# 컴퓨터비전 파이프라인 설계서

> ViralCraft AI — 영상에서 진짜 정보를 추출하는 CV 모듈
> 목적: "Gemini에 영상 전체를 던지는" 환각·고비용 구조를, **CV로 추출한 대표 키프레임 + 객관 지표**로 대체한다.

---

## 0. 파이프라인 전체

```
영상 입력
  │
  ├─[F1] 디코딩 & 프레임 추출  (ffmpeg.wasm / OpenCV VideoCapture)
  │        └ 1차 균일 샘플링(예: 2~5fps) → 후보 프레임 집합
  │
  ├─[F2] 샷 경계 검출 (Shot Boundary Detection)
  │        └ 인접 프레임 HSV 히스토그램 χ² 거리 > 임계값 → 컷 지점
  │        └ 산출물: 진짜 keyTimestamps (장면 전환 시각 + 구간)
  │
  ├─[F3] 모션/템포 정량화
  │        └ 프레임 차분(빠름) 또는 Lucas-Kanade 옵티컬 플로우(정밀)
  │        └ 산출물: 평균 모션크기, 컷 빈도(cuts/sec) → "템포" 수치
  │
  ├─[F4] 대표 키프레임 선정
  │        └ 샷별로 Laplacian variance(선명도)·colorfulness 점수 최대 프레임
  │        └ 산출물: 샷당 1장, 총 N장의 대표 프레임
  │
  └─[F5] LLM 입력 최적화
           └ 영상 전체 대신 키프레임 N장 + 메타(타임스탬프·모션지표)만 Gemini 전송
           └ 산출물: 지연/토큰 before-after 측정값
```

---

## F1. 프레임 추출

**목표:** 영상을 일정 간격으로 디코딩해 후보 프레임을 만든다(전체 프레임은 과다).

- 클라이언트(A안): `@ffmpeg/ffmpeg`(WASM)로 `fps=N` 추출, 또는 `<video>`+`<canvas>`로 `currentTime`을 옮겨가며 `drawImage` 캡처.
- 백엔드(B안): OpenCV `cv2.VideoCapture` + `CAP_PROP_POS_MSEC`.

**파라미터:** 샘플링 FPS(기본 3fps), 최대 해상도(긴 변 360~480px로 다운스케일 → 속도↑).

```python
# B안 의사코드 (OpenCV)
cap = cv2.VideoCapture(path)
fps = cap.get(cv2.CAP_PROP_FPS)
step = int(fps / SAMPLE_FPS)
frames, idx = [], 0
while True:
    ok, f = cap.read()
    if not ok: break
    if idx % step == 0:
        frames.append((idx / fps, downscale(f, long_edge=480)))
    idx += 1
```

---

## F2. 샷 경계 검출 (Shot Boundary Detection)

**알고리즘:** 인접 프레임의 **색 히스토그램 차이**가 급증하면 컷으로 판정(고전 SBD).

1. 각 프레임을 HSV 변환 후 H,S 채널 2D 히스토그램(예: 50×60 bin) 계산, 정규화.
2. 인접 프레임 히스토그램 거리 d = χ²(또는 Bhattacharyya). OpenCV `cv2.compareHist`.
3. d > 임계값 τ → 컷. τ는 (평균 + k·표준편차) 적응형으로 설정해 영상별 자동 보정.

```python
def shot_boundaries(frames, k=3.0):
    hists = [hsv_hist(f) for _, f in frames]
    dists = [cv2.compareHist(hists[i], hists[i+1], cv2.HISTCMP_CHISQR)
             for i in range(len(hists)-1)]
    tau = mean(dists) + k * std(dists)
    cuts = [frames[i+1][0] for i, d in enumerate(dists) if d > tau]  # 컷 시각(초)
    return cuts, dists
```

**산출물:** `keyTimestamps = [{time, label}]` — 모델이 지어내던 값(이슈 #3)을 **CV 측정값**으로 대체.
**검증:** 샘플 영상에서 사람이 표시한 정답 컷과 비교 → Precision/Recall/F1 표로 제시(발표 자료).

> 발전형(여유 시): 페이드/디졸브 검출(점진적 전환)은 누적 히스토그램 차이의 "고원(plateau)" 패턴으로 탐지.

---

## F3. 모션/템포 정량화

현재 "템포"는 모델이 만든 문장이다. 이를 **수치 + 그래프**로 바꾼다.

**방법 1 — 프레임 차분(빠름):** 인접 그레이 프레임 절대차 평균 → 시간축 모션 시그널.
**방법 2 — 옵티컬 플로우(정밀):**
- 희소: `cv2.goodFeaturesToTrack` + `cv2.calcOpticalFlowPyrLK`(Lucas-Kanade) → 특징점 이동거리 평균.
- 조밀: `cv2.calcOpticalFlowFarneback` → 픽셀별 흐름 크기 평균(무겁다, 다운스케일 필수).

```python
def motion_profile(frames):
    sig = []
    prev = to_gray(frames[0][1])
    for t, f in frames[1:]:
        g = to_gray(f)
        flow = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5,3,15,3,5,1.2,0)
        mag = np.linalg.norm(flow, axis=2).mean()
        sig.append((t, mag)); prev = g
    return sig  # (시각, 모션크기)
```

**산출 지표:** 평균 모션크기, 컷 빈도(cuts/sec = len(cuts)/duration), 모션 분산.
→ "빠른 템포"를 *cuts/sec=1.8, 평균모션=12.4* 처럼 **정량 라벨링**.

---

## F4. 대표 키프레임 선정

**목표:** 각 샷에서 가장 선명하고 정보량 많은 1프레임 선택(블러/모션블러 프레임 배제).

- **선명도:** Laplacian variance — `cv2.Laplacian(gray, CV_64F).var()` (값↑ = 또렷).
- **컬러풀니스:** Hasler-Süsstrunk colorfulness 지표.
- **(선택) 현저성:** `cv2.saliency`(Spectral Residual) 평균.
- 점수 = w1·선명도̂ + w2·컬러풀̂ + w3·현저성̂ (정규화 후 가중합).

```python
def best_frame(shot_frames):
    def score(f):
        g = to_gray(f)
        sharp = cv2.Laplacian(g, cv2.CV_64F).var()
        return norm(sharp)*0.6 + norm(colorfulness(f))*0.4
    return max(shot_frames, key=lambda x: score(x[1]))
```

**산출물:** 가짜 썸네일 생성(`imageService`) 대신 **실제 영상에서 뽑은 대표 프레임**을 썸네일/씬 캡처로 사용.

---

## F5. LLM 입력 최적화 (속도·비용)

**핵심 차별점.** 영상 전체(수 MB, 수백 프레임)를 보내는 대신 **F4가 뽑은 대표 N프레임(예: 6~8장)** + F2/F3 메타데이터(컷 타임스탬프, 템포 지표)만 Gemini에 전달.

**측정 실험 (발표용 그래프):**

| 입력 방식 | 업로드 용량 | 지연(초) | 토큰(추정) | 분석 품질(rubric) |
|-----------|-------------|----------|------------|-------------------|
| 전체 영상 | (측정) | (측정) | (측정) | (측정) |
| 키프레임 8장 + 메타 | (측정) | (측정) | (측정) | (측정) |
| 키프레임 4장 + 메타 | (측정) | (측정) | (측정) | (측정) |

→ "키프레임 방식이 지연 X% / 비용 Y% 절감, 품질은 동등" 결론을 그래프로.

---

## 기술 스택·라이브러리

| 용도 | 클라이언트(A) | 백엔드(B) |
|------|---------------|-----------|
| 디코딩/프레임추출 | `@ffmpeg/ffmpeg` (WASM) | OpenCV `VideoCapture`, ffmpeg |
| CV 연산 | `opencv.js` (WASM) | `opencv-python`, `numpy` |
| 차트 | `recharts`(이미 RN 가능) | (FE로 데이터 전달) |
| 서버 | — | `FastAPI` + `uvicorn` |

> A안은 큰 영상에서 WASM 메모리 한계가 있으니 다운스케일·샘플링 필수. B안은 CV 수업 표준이고 API 키 은닉까지 해결.

---

## 검증·재현성

- 샘플 영상 3~5개(빠른컷 릴스 / 느린 ASMR / 페이드 많은 브이로그)로 케이스 다양화.
- 샷 경계 정답 라벨을 수동 작성 → F2 P/R/F1 측정.
- 모든 파라미터(SAMPLE_FPS, τ의 k, 가중치)는 설정파일로 분리해 실험 재현 가능하게.

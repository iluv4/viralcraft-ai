# ViralCraft AI — Backend (FastAPI + OpenCV)

영상에서 **컴퓨터비전으로 정보를 추출**하고, 그 결과(대표 키프레임 + 메타)만 Gemini에 보내는 백엔드.
API 키를 서버에만 보관해 클라이언트 노출(이슈 #1)을 구조적으로 해결한다.

## 설치 & 실행

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env       # (mac/linux: cp) → .env 에 GEMINI_API_KEY 입력
uvicorn app.main:app --reload --port 8000
```

문서: http://localhost:8000/docs (Swagger UI)

## 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 헬스체크 + 키 로드 여부 |
| POST | `/cv/analyze` | **순수 CV** — 샷경계·모션·키프레임만 반환(빠름, Gemini 미호출) |
| POST | `/analyze` | **CV + Gemini(F5)** — 키프레임만 전송하는 최적화 분석 |
| POST | `/proxy/remake` | 리메이크 전략 생성(프록시) |
| POST | `/proxy/chat` | AI 채팅(프록시) |
| POST | `/proxy/image` | 이미지 생성(프록시) |

예시:
```bash
curl -F "file=@sample.mp4" "http://localhost:8000/cv/analyze?max_kf=8"
```

## 컴퓨터비전 파이프라인 (`app/cv_pipeline.py`)

1. **F1 프레임 추출** — `SAMPLE_FPS`로 샘플링 + 다운스케일(`LONG_EDGE`)
2. **F2 샷 경계 검출** — 인접 프레임 HSV 히스토그램 χ² 거리 > (mean + k·std)
3. **F3 모션/템포** — Farneback dense optical flow 평균 크기 + 컷 빈도 → 템포 라벨
4. **F4 키프레임 선정** — 샷별 Laplacian variance(선명도) + colorfulness 가중합 최대 프레임

모든 파라미터는 `app/config.py` / `.env`에서 조정 → 실험 재현성 확보.

## 프롬프트 실험 하네스 (`experiments/`)

```bash
python -m experiments.run_harness --video sample.mp4 --repeats 3
# → experiments/results/*.json, experiments/results.csv
```
프롬프트 변형(`experiments/prompts/*.txt`)별로 스키마 충족·타임스탬프 정합성·지연을 측정.
설계 상세: [`../docs/PROMPT_HARNESS.md`](../docs/PROMPT_HARNESS.md)

## 프론트엔드 연동

기존 React 서비스(`src/services/*.ts`)의 Gemini 직접 호출을 이 백엔드 호출로 교체하면
클라이언트에서 API 키가 사라진다. (마이그레이션 가이드: `docs/PROJECT_PLAN.md` 이슈 #1)

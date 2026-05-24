# 배포 가이드 (Deployment)

ViralCraft는 **3덩어리**다. 각각 배포 위치가 다르다.

| 구성 | 무엇 | 배포처(추천) | 난이도 |
|------|------|--------------|--------|
| 프론트엔드 | React/Vite 정적 빌드 | **Vercel** / Netlify / Firebase Hosting | ★ 쉬움 |
| 백엔드 | FastAPI + OpenCV (영상처리) | **Render** / Railway / Google Cloud Run (Docker) | ★★ 보통 |
| Auth/DB | Firebase (Auth + Firestore) | 이미 호스팅됨 | — |

> ⚠️ 백엔드는 OpenCV·ffmpeg 같은 **네이티브 라이브러리 + 영상 업로드**가 필요해 Vercel/Netlify **서버리스 함수로는 부적합**하다. 반드시 컨테이너(Docker) 기반 서비스에 올린다.

---

## 0. 가장 빠른 방법 — 데모만 필요하면 배포하지 마라
수업 시연이 목적이면 **로컬 실행 + 화면녹화**가 가장 싸고 안전하다.
- 백엔드: `uvicorn app.main:app --port 8000`
- 프론트: `npm run dev`
- 외부에 잠깐 공유해야 하면 `ngrok http 8000` 으로 백엔드를 임시 공개.

"개발 덜 하고"가 목표라면 이걸 권장. 아래는 실제 배포가 필요할 때.

---

## 1. 백엔드 배포 (Render 예시 — 무료 티어 가능)

레포에 `backend/Dockerfile` 이 이미 있다.

1. https://render.com → **New → Web Service** → GitHub 레포 `iluv4/viralcraft-ai` 연결
2. 설정:
   - **Root Directory:** `backend`
   - **Runtime:** Docker (Dockerfile 자동 인식)
   - **Instance:** Free (또는 영상처리가 무거우면 Starter)
3. **Environment** 에 키 등록 (코드/깃엔 절대 안 올림):
   - `GEMINI_API_KEY = <키>`
   - `ALLOWED_ORIGINS = https://<프론트도메인>` (배포 후 프론트 주소로)
4. Deploy → `https://viralcraft-api.onrender.com/health` 로 확인.

**Railway / Fly.io / Cloud Run** 도 동일 — Dockerfile만 있으면 된다.
Cloud Run(CLI) 예:
```bash
cd backend
gcloud run deploy viralcraft-api --source . --region asia-northeast3 \
  --allow-unauthenticated --set-env-vars GEMINI_API_KEY=...,ALLOWED_ORIGINS=https://...
```

> 참고: 무료 티어는 **콜드 스타트**(첫 요청 수십 초)와 **메모리 제한**이 있다. 영상 업로드 한도는 `MAX_UPLOAD_MB`(기본 50). 큰 영상은 `SAMPLE_FPS`·`LONG_EDGE`를 낮춰 메모리·시간을 줄인다.

---

## 2. 프론트엔드 배포 (Vercel)

> 전제: 프론트가 백엔드 URL을 환경변수로 읽도록 바꿔야 한다(아래 3번). 현재는 Gemini를 직접 호출하므로 그 부분을 백엔드 호출로 교체한 뒤 배포.

1. https://vercel.com → **Add New → Project** → 레포 연결
2. 설정:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` · **Output:** `dist`
3. **Environment Variables:**
   - `VITE_API_BASE = https://viralcraft-api.onrender.com`
   - (백엔드 미연동 구간 동안만) `GEMINI_API_KEY` — ⚠️ 클라이언트 노출되므로 **데모 후 제거**
4. Deploy → 발급된 도메인을 백엔드 `ALLOWED_ORIGINS` 에 추가(2-3번) 후 백엔드 재배포.

**Firebase Hosting** 으로도 가능:
```bash
npm run build && firebase deploy --only hosting
```
(이미 Firebase 프로젝트를 쓰고 있으니 Auth 도메인 관리가 한 곳에 모이는 장점)

---

## 3. 프론트 ↔ 백엔드 연결 (배포 전 코드 1곳 변경)

`src/services/*.ts` 의 Gemini 직접 호출을 백엔드 fetch로 교체한다. 예:

```ts
const API = import.meta.env.VITE_API_BASE;

export async function analyzeVideoFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API}/analyze`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();   // { analysis, cv, total_elapsed_sec }
}
```

이렇게 하면 **GEMINI_API_KEY가 프론트에서 완전히 사라진다(이슈 #1 해결)**.

---

## 4. 체크리스트

- [ ] 백엔드 `/health` 가 `{"gemini_key_loaded": true}` 반환
- [ ] 백엔드 `ALLOWED_ORIGINS` 에 실제 프론트 도메인 등록(CORS)
- [ ] 프론트 `VITE_API_BASE` 가 백엔드 주소를 가리킴
- [ ] Firebase 콘솔 → Authentication → 승인된 도메인에 배포 도메인 추가
- [ ] `.env` 는 절대 커밋되지 않음(.gitignore 확인)
- [ ] 무료 티어 콜드스타트/메모리 한도 확인(데모 직전 한 번 호출해 워밍업)
```

# 🎬 Short-form AI Remake Studio (숏폼 AI 리메이크 스튜디오)

> **"바이럴 영상을 분석하고, 나만의 성공적인 숏폼으로 재탄생시키는 AI 디렉터"**
> 
> PPT(발표 자료) 제작을 위해 최적화된 프로젝트 기획 및 상세 설명서입니다.

---

## 💡 1. 기획 배경 (Background & Problem)

**"왜 숏폼 리메이크인가?"**
*   **어려운 흥행 공식:** 성공하는 숏폼은 단순한 운이 아니라, '초반 3초 훅(Hook)', '빠른 템포', '명확한 행동 유도(CTA)'라는 공식을 따릅니다.
*   **분석 및 기획의 병목 현상:** 수많은 레퍼런스 영상을 보고 분석하여 내 브랜드/콘텐츠에 맞게 재구성(스토리보드 작성, 스크립트 작성)하는 데 막대한 시간이 소요됩니다.
*   **에셋 제작의 한계:** 머릿속에 있는 기획을 시각적 스토리보드나 목소리(나레이션)로 구체화하는 것은 비전문가에게 진입 장벽이 높습니다.

---

## 🎯 2. 해결 방안 (Our Solution)

**Gemini AI와 통합된 올인원 숏폼 기획 솔루션**
1.  **AI 영상 분석:** 틱톡, 릴스, 쇼츠 등 레퍼런스 영상을 텍스트/링크로 입력하면 AI가 흥행 요소를 즉각적으로 리버스 엔지니어링(역분석) 합니다.
2.  **자동 스토리보드 변환:** 분석된 내용을 바탕으로 내 브랜드에 맞는 새로운 리메이크 전략과 시각적 스토리보드(이미지+스크립트)를 자동 생성합니다.
3.  **실시간 AI 인터랙션:** 생성된 기획안을 AI 디렉터와 채팅하며 즉각적으로 수정하고 디벨롭합니다.

---

## 🚀 3. 핵심 기능 (Key Features)

### ① 원본 영상 심층 분석 (Viral Insight Extraction)
*   **분석 항목:** 초반 3초 훅(Hook), 영상 템포, 전개 구성, CTA(행동 유도), 바이럴 포인트.
*   **시각화:** 텍스트가 아닌, 생성된 썸네일 이미지 위에 핵심 인사이트를 오버레이(Overlay)하여 대시보드 형태로 직관적으로 제공합니다.
*   **장면 캡처(Scene Captures):** 핵심 타임스탬프별로 영상의 주요 장면을 텍스트 설명과 함께 AI 생성 이미지로 시각화합니다.

### ② 한국형 리메이크 전략 & 스토리보드 생성
*   사용자의 타겟 시청자와 브랜드 목적에 맞춰 **새로운 리메이크 대본 및 시나리오**를 도출합니다.
*   각 장면(Scene)별로 적용해야 할 카메라 앵글, 영상미(Visual Concept), 그리고 예상 바이럴 점수를 예측하여 제공합니다.

### ③ AI 에셋 제너레이터 (이미지 & 음성)
*   **Text-to-Image:** Gemini 2.5 Flash Image 모델을 활용하여 스토리보드의 각 장면에 들어갈 고품질 레퍼런스 이미지를 실시간으로 생성합니다.
*   **Text-to-Speech (TTS):** 생성된 나레이션 대본을 Gemini가 직접 자연스러운 음성으로 읽어주어, 실제 숏폼 템포를 미리 가늠해 볼 수 있습니다.

### ④ AI 디렉터와의 공동 작업 (Co-pilot Chat)
*   "이 부분을 조금 더 코믹하게 바꿔줘", "BGM 추천해줘" 등 AI와 실시간으로 소통하며 기획안을 고도화합니다.

---

## ⚙️ 4. 기술 스택 및 아키텍처 (Tech Stack & Architecture)

### Frontend
*   **React 19 & Vite 6:** 빠르고 반응성 높은 SPA(Single Page Application) 구축.
*   **Tailwind CSS & shadcn/ui:** 일관되고 트렌디한 디자인 시스템 (모던/블랙 & 오렌지 엑센트).
*   **Framer Motion:** 부드러운 상태 전환 및 데이터 시각화 애니메이션 처리.

### Backend & Database (Firebase)
*   **Firebase Authentication:** 구글 소셜 로그인 연동으로 안전한 사용자 인증.
*   **Cloud Firestore (NoSQL):** 프로젝트 기획안 데이터를 실시간으로 저장 및 동기화.
*   **🔥 대용량 데이터 최적화 아키텍처 (Sub-collections):**
    *   **문제:** 수십 장의 AI 생성 이미지(Base64)를 하나의 프로젝트 문서에 저장할 경우 Firestore의 단일 문서 크기 제한(1MB) 초과 에러 발생.
    *   **해결:** `projects/{projectId}` 메인 문서에는 텍스트 기획안만 저장하고, 무거운 이미지 데이터는 `scenes` 및 `frames` **하위 컬렉션(Sub-collections)으로 분리하여 저장**. 클라이언트 로드 시에 이를 지능적으로 병합(Merge)하여 성능과 안정성을 모두 확보.

### Artificial Intelligence (Google Gemini)
*   **분석/기획:** Gemini Flash 계열 (빠르고 정확한 텍스트/맥락 추론) — *실험 후 실존 모델로 고정*
*   **이미지 생성:** `gemini-2.5-flash-image` (프롬프트 기반 스토리보드 시각화)
*   **음성 생성:** Gemini TTS (감정이 담긴 실시간 나레이션 생성)

### 🎥 Computer Vision 파이프라인 (본 프로젝트의 핵심)
단순 API 호출을 넘어, 영상에서 **CV 알고리즘으로 직접 정보를 추출**합니다.
*   **샷 경계 검출(Shot Boundary Detection):** 인접 프레임 HSV 히스토그램 χ² 거리로 장면 전환 지점을 검출 → AI가 지어내던 타임스탬프를 **실측값**으로 대체.
*   **모션/템포 정량화:** 프레임 차분·옵티컬 플로우(Lucas-Kanade/Farneback)로 "템포"를 **수치·그래프**로 측정.
*   **대표 키프레임 선정:** Laplacian variance(선명도)·colorfulness 점수로 샷별 베스트 프레임 자동 선택.
*   **속도·비용 최적화:** 영상 전체 대신 **추출한 키프레임 N장만** Gemini에 전달 → 지연·토큰 대폭 절감 (before/after 측정).
> 상세: [`docs/CV_PIPELINE.md`](./docs/CV_PIPELINE.md) · 프롬프트 실험: [`docs/PROMPT_HARNESS.md`](./docs/PROMPT_HARNESS.md) · 일정/역할: [`docs/PROJECT_PLAN.md`](./docs/PROJECT_PLAN.md)

---

## 🛠️ 개발 환경 설정 (Setup)

```bash
npm install
# .env 파일 생성 후 키 입력 (커밋 금지!)
echo "GEMINI_API_KEY=your_key_here" > .env
npm run dev      # http://localhost:3000
npm run lint     # 타입 체크 (tsc --noEmit)
```

> ⚠️ **보안 주의:** 현재 `vite.config.ts`가 `GEMINI_API_KEY`를 클라이언트 번들에 주입하므로 키가 브라우저에 노출됩니다. 프로덕션/배포 전 **백엔드 프록시로 키를 은닉**해야 합니다(계획: `docs/PROJECT_PLAN.md` 이슈 #1). Firebase 설정은 `firebase-applet-config.json`을 참조합니다.

---

## 📈 5. 기대 효과 (Expected Impact)

1.  **제작 시간 90% 단축:** "아이디어 스케치 -> 레퍼런스 분석 -> 스토리보드 작성"으로 이어지는 수일의 기획 과정을 단 5분으로 압축.
2.  **데이터 기반의 확실한 기획:** 감에 의존하는 기획이 아닌, 훅과 전개 구성 등 바이럴 공식을 따르는 성공 확률 높은 콘텐츠 제작.
3.  **비전문가의 크리에이터화:** 카메라와 편집 기술이 없어도 누구나 에이전시급 스토리보드를 만들어 외주 제작을 맡기거나 직접 촬영 가능.

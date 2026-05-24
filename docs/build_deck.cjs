const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
p.author = "ViralCraft AI Team";
p.title = "ViralCraft AI — 컴퓨터비전 프로젝트";

// Palette (brand: 오렌지 on dark navy/charcoal — 숏폼/바이럴 톤)
const INK = "13151A";      // 거의 검정 네이비
const PANEL = "1E212B";    // 다크 패널
const ORANGE = "FF6321";   // 브랜드 액센트
const LIGHT = "FFFFFF";
const PAPER = "F7F7F9";    // 본문 배경
const GRAY = "6B7280";
const DGRAY = "374151";
const GREEN = "22C55E";
const HF = "Malgun Gothic"; // 헤더
const BF = "Malgun Gothic"; // 본문

const W = 13.333, H = 7.5;

function chip(s, t, x, y, w, color, txtcol) {
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.4, rectRadius: 0.2, fill: { color } });
  s.addText(t, { x, y, w, h: 0.4, align: "center", valign: "middle", fontFace: HF, fontSize: 11, bold: true, color: txtcol || LIGHT, margin: 0 });
}
function shadow() { return { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.12 }; }

// ---------- 1. TITLE ----------
let s = p.addSlide(); s.background = { color: INK };
s.addShape(p.shapes.OVAL, { x: 9.6, y: -2.2, w: 6.5, h: 6.5, fill: { color: ORANGE, transparency: 78 } });
s.addShape(p.shapes.OVAL, { x: 11.0, y: 3.8, w: 5.0, h: 5.0, fill: { color: ORANGE, transparency: 88 } });
chip(s, "상명대학교 소프트웨어학과 · 컴퓨터비전", 0.9, 1.2, 4.6, ORANGE);
s.addText("ViralCraft AI", { x: 0.85, y: 1.9, w: 11, h: 1.1, fontFace: HF, fontSize: 54, bold: true, color: LIGHT, margin: 0 });
s.addText("영상을 '컴퓨터비전'으로 해체하여 바이럴 공식을 추출하는 AI 스튜디오", { x: 0.9, y: 3.05, w: 11, h: 0.6, fontFace: BF, fontSize: 20, color: "C9CDD6", margin: 0 });
s.addText([
  { text: "핵심 한 줄  ", options: { bold: true, color: ORANGE } },
  { text: "API만 호출하던 구조 →  CV로 진짜 정보를 뽑아 키프레임만 AI에 전달", options: { color: "E5E7EB" } },
], { x: 0.9, y: 4.1, w: 11.4, h: 0.6, fontFace: BF, fontSize: 16, margin: 0 });
s.addText("github.com/iluv4/viralcraft-ai", { x: 0.9, y: 6.6, w: 8, h: 0.4, fontFace: BF, fontSize: 13, color: GRAY, margin: 0 });

// ---------- 2. 문제 정의 (As-Is) ----------
s = p.addSlide(); s.background = { color: PAPER };
s.addText("지금 코드의 문제 — 왜 점수가 안 나오나", { x: 0.7, y: 0.5, w: 12, h: 0.7, fontFace: HF, fontSize: 30, bold: true, color: INK, margin: 0 });
s.addText("현재 ViralCraft는 영상/링크를 Gemini API에 '그대로' 던진다. 컴퓨터비전이 없다.", { x: 0.7, y: 1.25, w: 12, h: 0.5, fontFace: BF, fontSize: 15, color: GRAY, margin: 0 });
const probs = [
  ["링크 분석 = 환각", "URL을 텍스트로만 전달 → 모델이 영상을 실제로 보지 못함"],
  ["'템포·핵심장면'이 가짜", "keyTimestamps·tempo를 모델이 지어낸 텍스트로 출력"],
  ["느리고 비싸다", "매번 영상 전체를 업로드 → 지연·토큰 낭비"],
  ["API 키 노출", "vite가 GEMINI 키를 브라우저 번들에 주입 → 도용 위험"],
];
probs.forEach((c, i) => {
  const x = 0.7 + (i % 2) * 6.25, y = 2.0 + Math.floor(i / 2) * 2.4;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.95, h: 2.1, rectRadius: 0.08, fill: { color: LIGHT }, shadow: shadow() });
  s.addShape(p.shapes.RECTANGLE, { x, y, w: 0.12, h: 2.1, fill: { color: ORANGE } });
  s.addText(c[0], { x: x + 0.35, y: y + 0.28, w: 5.4, h: 0.5, fontFace: HF, fontSize: 18, bold: true, color: INK, margin: 0 });
  s.addText(c[1], { x: x + 0.35, y: y + 0.9, w: 5.4, h: 1.0, fontFace: BF, fontSize: 14, color: DGRAY, margin: 0 });
});

// ---------- 3. To-Be 한 줄 재정의 ----------
s = p.addSlide(); s.background = { color: INK };
chip(s, "프로젝트 재정의", 0.9, 0.9, 2.8, ORANGE);
s.addText("영상에서 CV로 진짜 정보를 뽑고,\n대표 키프레임만 AI에 보낸다", { x: 0.85, y: 1.5, w: 11.6, h: 1.7, fontFace: HF, fontSize: 34, bold: true, color: LIGHT, lineSpacingMultiple: 1.05, margin: 0 });
const wins = [
  ["CV 콘텐츠 확보", "샷경계·옵티컬플로우·키프레임 = 수업 평가의 본체"],
  ["속도·비용 절감", "전체영상 대신 키프레임 N장만 전송"],
  ["환각 제거 + 보안", "CV 측정값으로 그라운딩 + 키를 서버에 은닉"],
];
wins.forEach((c, i) => {
  const x = 0.85 + i * 3.95, y = 3.7;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: 3.7, h: 2.7, rectRadius: 0.1, fill: { color: PANEL } });
  s.addShape(p.shapes.OVAL, { x: x + 0.35, y: y + 0.35, w: 0.6, h: 0.6, fill: { color: ORANGE } });
  s.addText(String(i + 1), { x: x + 0.35, y: y + 0.35, w: 0.6, h: 0.6, align: "center", valign: "middle", fontFace: HF, fontSize: 20, bold: true, color: LIGHT, margin: 0 });
  s.addText(c[0], { x: x + 0.35, y: y + 1.15, w: 3.1, h: 0.5, fontFace: HF, fontSize: 18, bold: true, color: LIGHT, margin: 0 });
  s.addText(c[1], { x: x + 0.35, y: y + 1.7, w: 3.15, h: 0.9, fontFace: BF, fontSize: 13, color: "C9CDD6", margin: 0 });
});

// ---------- 4. 아키텍처 ----------
s = p.addSlide(); s.background = { color: PAPER };
s.addText("To-Be 아키텍처", { x: 0.7, y: 0.5, w: 12, h: 0.7, fontFace: HF, fontSize: 30, bold: true, color: INK, margin: 0 });
const boxes = [
  ["React (프론트)", "업로드 · 결과 시각화\n컷 타임라인 · 모션 그래프", LIGHT, INK, "0.7"],
  ["FastAPI + OpenCV", "① 프레임추출 ② 샷경계검출\n③ 옵티컬플로우 ④ 키프레임선정", INK, LIGHT, "4.85"],
  ["Gemini (서버 호출)", "키프레임 N장 + 메타로\n분석·전략·이미지·TTS", LIGHT, INK, "9.0"],
];
boxes.forEach((b) => {
  const x = parseFloat(b[4]);
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: 2.0, w: 3.6, h: 2.5, rectRadius: 0.1, fill: { color: b[2] }, line: { color: b[2] === LIGHT ? "E5E7EB" : INK, width: 1 }, shadow: shadow() });
  s.addText(b[0], { x: x + 0.3, y: 2.3, w: 3.0, h: 0.6, fontFace: HF, fontSize: 17, bold: true, color: b[3], margin: 0 });
  s.addText(b[1], { x: x + 0.3, y: 3.0, w: 3.05, h: 1.3, fontFace: BF, fontSize: 13, color: b[2] === LIGHT ? DGRAY : "C9CDD6", margin: 0 });
});
s.addText("▶", { x: 4.35, y: 2.95, w: 0.5, h: 0.6, fontSize: 22, color: ORANGE, align: "center", margin: 0 });
s.addText("▶", { x: 8.5, y: 2.95, w: 0.5, h: 0.6, fontSize: 22, color: ORANGE, align: "center", margin: 0 });
s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 5.1, w: 11.9, h: 1.4, rectRadius: 0.08, fill: { color: "FFF1EA" } });
s.addText([
  { text: "핵심 효과  ", options: { bold: true, color: ORANGE } },
  { text: "CV를 백엔드(Python/OpenCV)에 두어 ① 컴퓨터비전 코드가 깔끔하고 ② 영상 전체 전송을 없애 빠르며 ③ API 키가 클라이언트에서 사라진다.", options: { color: DGRAY } },
], { x: 1.0, y: 5.3, w: 11.4, h: 1.0, fontFace: BF, fontSize: 14, valign: "middle", margin: 0 });

// ---------- 5. CV 파이프라인 4단계 ----------
s = p.addSlide(); s.background = { color: PAPER };
s.addText("컴퓨터비전 파이프라인 (실제 구현됨)", { x: 0.7, y: 0.5, w: 12, h: 0.7, fontFace: HF, fontSize: 28, bold: true, color: INK, margin: 0 });
s.addText("backend/app/cv_pipeline.py · OpenCV + NumPy", { x: 0.7, y: 1.2, w: 12, h: 0.4, fontFace: BF, fontSize: 13, color: GRAY, margin: 0 });
const steps = [
  ["F1", "프레임 추출", "일정 간격(3fps)으로 샘플링 + 다운스케일(480px) → 속도↑"],
  ["F2", "샷 경계 검출", "인접 프레임 HSV 히스토그램 χ² 거리 > (mean+k·std) → 컷 검출"],
  ["F3", "모션·템포 정량화", "Farneback 옵티컬 플로우 평균 크기 + 컷 빈도 → 템포 '수치화'"],
  ["F4", "대표 키프레임 선정", "샷별 Laplacian 선명도 + colorfulness 가중합 최대 프레임"],
];
steps.forEach((c, i) => {
  const y = 1.85 + i * 1.28;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.7, y, w: 11.9, h: 1.13, rectRadius: 0.08, fill: { color: LIGHT }, shadow: shadow() });
  s.addShape(p.shapes.OVAL, { x: 0.95, y: y + 0.25, w: 0.62, h: 0.62, fill: { color: ORANGE } });
  s.addText(c[0], { x: 0.95, y: y + 0.25, w: 0.62, h: 0.62, align: "center", valign: "middle", fontFace: HF, fontSize: 16, bold: true, color: LIGHT, margin: 0 });
  s.addText(c[1], { x: 1.85, y: y + 0.16, w: 3.3, h: 0.8, fontFace: HF, fontSize: 17, bold: true, color: INK, valign: "middle", margin: 0 });
  s.addText(c[2], { x: 5.2, y: y + 0.16, w: 7.2, h: 0.8, fontFace: BF, fontSize: 13.5, color: DGRAY, valign: "middle", margin: 0 });
});

// ---------- 6. 속도 최적화 (차트) ----------
s = p.addSlide(); s.background = { color: PAPER };
s.addText("속도·비용 최적화 (F5)", { x: 0.7, y: 0.5, w: 12, h: 0.7, fontFace: HF, fontSize: 28, bold: true, color: INK, margin: 0 });
s.addText("영상 전체 vs 키프레임만 전송 — 실험으로 측정할 핵심 그래프 (예시 수치)", { x: 0.7, y: 1.2, w: 12, h: 0.4, fontFace: BF, fontSize: 13, color: GRAY, margin: 0 });
s.addChart(p.charts.BAR, [
  { name: "지연(초)", labels: ["전체 영상", "키프레임 8장", "키프레임 4장"], values: [14.2, 5.1, 3.4] },
], {
  x: 0.7, y: 1.8, w: 7.2, h: 4.9, barDir: "col",
  chartColors: [ORANGE], showValue: true, dataLabelPosition: "outEnd", dataLabelColor: INK, dataLabelFontFace: BF,
  catAxisLabelColor: DGRAY, valAxisLabelColor: GRAY, valGridLine: { color: "E5E7EB", size: 0.5 }, catGridLine: { style: "none" },
  showLegend: false, chartArea: { fill: { color: PAPER } },
});
const kpis = [["−76%", "지연 절감", "키프레임 8장 기준"], ["−70%", "토큰/비용 절감", "전송 데이터 급감"], ["≈ 동등", "분석 품질", "CV 그라운딩으로 보완"]];
kpis.forEach((k, i) => {
  const y = 1.85 + i * 1.6;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 8.4, y, w: 4.2, h: 1.42, rectRadius: 0.1, fill: { color: LIGHT }, shadow: shadow() });
  s.addText(k[0], { x: 8.65, y: y + 0.12, w: 2.0, h: 0.9, fontFace: HF, fontSize: 30, bold: true, color: ORANGE, valign: "middle", margin: 0 });
  s.addText(k[1], { x: 10.55, y: y + 0.2, w: 1.95, h: 0.45, fontFace: HF, fontSize: 14, bold: true, color: INK, valign: "middle", margin: 0 });
  s.addText(k[2], { x: 10.55, y: y + 0.65, w: 1.95, h: 0.55, fontFace: BF, fontSize: 10.5, color: GRAY, valign: "top", margin: 0 });
});

// ---------- 7. 프롬프트 엔지니어링 하네스 ----------
s = p.addSlide(); s.background = { color: INK };
chip(s, "프롬프트 엔지니어링 — '여러 번 실험'의 근거", 0.9, 0.7, 5.4, ORANGE);
s.addText("프롬프트 실험 하네스", { x: 0.85, y: 1.25, w: 11, h: 0.8, fontFace: HF, fontSize: 30, bold: true, color: LIGHT, margin: 0 });
s.addText("backend/experiments/run_harness.py — 프롬프트 변형 × 입력방식을 자동으로 돌려 지표를 CSV로 기록", { x: 0.9, y: 2.05, w: 11.5, h: 0.5, fontFace: BF, fontSize: 14, color: "C9CDD6", margin: 0 });
const rows = [
  ["변수", "프롬프트 V0~V4 (역할강화·Few-shot·CoT·CV메타주입) × 입력 I0~I3 (전체영상·키프레임8·4·링크)"],
  ["지표", "스키마 충족률 · 타임스탬프 정합성(CV 컷과 오차) · 일관성 · 지연 · 토큰 · 사람 루브릭(5점)"],
  ["결론", "최적 조합 도출: V4(CV 그라운딩) × I1(키프레임) → 환각↓, 타임스탬프 오차↓"],
];
rows.forEach((r, i) => {
  const y = 2.85 + i * 1.25;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.85, y, w: 11.65, h: 1.08, rectRadius: 0.08, fill: { color: PANEL } });
  s.addText(r[0], { x: 1.1, y: y + 0.16, w: 1.5, h: 0.76, fontFace: HF, fontSize: 16, bold: true, color: ORANGE, valign: "middle", margin: 0 });
  s.addText(r[1], { x: 2.6, y: y + 0.16, w: 9.7, h: 0.76, fontFace: BF, fontSize: 13.5, color: "E5E7EB", valign: "middle", margin: 0 });
});

// ---------- 8. 역할 분배 ----------
s = p.addSlide(); s.background = { color: PAPER };
s.addText("역할 분배 (3~4명)", { x: 0.7, y: 0.5, w: 12, h: 0.7, fontFace: HF, fontSize: 28, bold: true, color: INK, margin: 0 });
const roles = [
  ["A · CV 엔지니어", "F1~F4 프레임추출·샷경계·옵티컬플로우·키프레임", "CV 모듈 · 알고리즘 검증 · 지표 그래프"],
  ["B · AI/프롬프트", "F5 속도최적화 · 프롬프트 실험 하네스 · 모델 고정", "프롬프트 세트 · 실험표 · 평가 루브릭"],
  ["C · 프론트/풀스택", "UI 통합·시각화 · 백엔드 프록시(키 은닉) · 버그픽스", "React 통합 · FastAPI 연동"],
  ["D · 기획/발표/QA", "발표자료·README · 데모 시나리오 · 테스트", "PPT · 데모 영상 · 체크리스트 (3명이면 분담)"],
];
roles.forEach((c, i) => {
  const x = 0.7 + (i % 2) * 6.25, y = 1.5 + Math.floor(i / 2) * 2.45;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.95, h: 2.2, rectRadius: 0.08, fill: { color: LIGHT }, shadow: shadow() });
  s.addText(c[0], { x: x + 0.35, y: y + 0.25, w: 5.3, h: 0.5, fontFace: HF, fontSize: 18, bold: true, color: ORANGE, margin: 0 });
  s.addText(c[1], { x: x + 0.35, y: y + 0.85, w: 5.3, h: 0.7, fontFace: BF, fontSize: 13.5, color: INK, margin: 0 });
  s.addText("산출물 · " + c[2], { x: x + 0.35, y: y + 1.6, w: 5.3, h: 0.5, fontFace: BF, fontSize: 12, italic: true, color: GRAY, margin: 0 });
});

// ---------- 9. 일정 (3주) ----------
s = p.addSlide(); s.background = { color: PAPER };
s.addText("일정 — 오늘(5/24) → 기말 2주차(6/12)", { x: 0.7, y: 0.5, w: 12, h: 0.7, fontFace: HF, fontSize: 27, bold: true, color: INK, margin: 0 });
const weeks = [
  ["W1", "5/24 – 5/31", "기반 구축", "프레임추출+샷경계 MVP · 백엔드 프록시(키 은닉) · 실존 모델 고정"],
  ["W2", "6/1 – 6/7", "핵심 CV·실험", "옵티컬플로우 템포·키프레임선정 · 속도 before/after 측정 · 프롬프트 실험 1차"],
  ["W3", "6/8 – 6/12", "통합·발표", "엔드투엔드 통합 · 실험 결론 · 발표자료·데모 (기말주간이라 신규코드 최소)"],
];
weeks.forEach((c, i) => {
  const y = 1.5 + i * 1.75;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 0.7, y, w: 11.9, h: 1.55, rectRadius: 0.08, fill: { color: LIGHT }, shadow: shadow() });
  s.addShape(p.shapes.RECTANGLE, { x: 0.7, y, w: 1.7, h: 1.55, fill: { color: i === 2 ? ORANGE : INK } });
  s.addText(c[0], { x: 0.7, y: y + 0.25, w: 1.7, h: 0.55, align: "center", fontFace: HF, fontSize: 24, bold: true, color: LIGHT, margin: 0 });
  s.addText(c[1], { x: 0.7, y: y + 0.85, w: 1.7, h: 0.5, align: "center", fontFace: BF, fontSize: 12, color: i === 2 ? "FFE8DC" : "C9CDD6", margin: 0 });
  s.addText(c[2], { x: 2.6, y: y + 0.22, w: 9.7, h: 0.5, fontFace: HF, fontSize: 18, bold: true, color: INK, margin: 0 });
  s.addText(c[3], { x: 2.6, y: y + 0.78, w: 9.7, h: 0.65, fontFace: BF, fontSize: 13.5, color: DGRAY, valign: "middle", margin: 0 });
});

// ---------- 10. 마무리 ----------
s = p.addSlide(); s.background = { color: INK };
s.addShape(p.shapes.OVAL, { x: -2, y: 4.5, w: 6, h: 6, fill: { color: ORANGE, transparency: 85 } });
chip(s, "발표에서 보여줄 것", 0.9, 1.3, 3.0, ORANGE);
s.addText("CV가 들어간 '진짜' 바이럴 분석기", { x: 0.85, y: 1.95, w: 11.6, h: 1.0, fontFace: HF, fontSize: 36, bold: true, color: LIGHT, margin: 0 });
const checks = [
  "샷 경계 검출 정확도 (정답 컷과 P/R/F1 비교)",
  "옵티컬 플로우 모션 그래프 → 템포 수치화",
  "속도·비용 최적화 그래프 (전체영상 vs 키프레임)",
  "프롬프트 실험표 (정량 근거) + 키 은닉 보안 다이어그램",
];
s.addText(checks.map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 18 }, breakLine: true, color: "E5E7EB", paraSpaceAfter: 10 } })),
  { x: 0.95, y: 3.2, w: 11, h: 2.6, fontFace: BF, fontSize: 17, margin: 0 });
s.addText("github.com/iluv4/viralcraft-ai", { x: 0.9, y: 6.7, w: 8, h: 0.4, fontFace: BF, fontSize: 13, color: GRAY, margin: 0 });

p.writeFile({ fileName: "C:/Users/4mins/Downloads/viralcraft-extracted/docs/ViralCraft_발표자료.pptx" }).then((f) => console.log("OK:", f));

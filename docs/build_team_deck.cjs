const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";
p.author = "ViralCraft AI Team";
p.title = "ViralCraft AI — 팀 킥오프 & 역할 분배";

const INK="13151A", PANEL="1E212B", ORANGE="FF6321", LIGHT="FFFFFF",
      PAPER="F7F7F9", GRAY="6B7280", DGRAY="374151", GREEN="22C55E", HF="Malgun Gothic", BF="Malgun Gothic";

function chip(s,t,x,y,w,color,txtcol){
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y,w,h:0.4,rectRadius:0.2,fill:{color}});
  s.addText(t,{x,y,w,h:0.4,align:"center",valign:"middle",fontFace:HF,fontSize:11,bold:true,color:txtcol||LIGHT,margin:0});
}
function sh(){return {type:"outer",color:"000000",blur:8,offset:3,angle:135,opacity:0.12};}

// 1. TITLE
let s=p.addSlide(); s.background={color:INK};
s.addShape(p.shapes.OVAL,{x:9.6,y:-2.2,w:6.5,h:6.5,fill:{color:ORANGE,transparency:78}});
s.addShape(p.shapes.OVAL,{x:11,y:3.8,w:5,h:5,fill:{color:ORANGE,transparency:88}});
chip(s,"팀 킥오프 · 무엇을 만들고, 누가 무엇을 하나",0.9,1.2,5.2,ORANGE);
s.addText("ViralCraft AI",{x:0.85,y:1.9,w:11,h:1.1,fontFace:HF,fontSize:50,bold:true,color:LIGHT,margin:0});
s.addText("영상을 컴퓨터비전으로 분석해 바이럴 리메이크 전략을 만드는 AI 스튜디오",{x:0.9,y:3.05,w:11.5,h:0.6,fontFace:BF,fontSize:19,color:"C9CDD6",margin:0});
s.addText("상명대 소프트웨어학과 · 컴퓨터비전 팀 프로젝트   |   github.com/iluv4/viralcraft-ai",{x:0.9,y:6.6,w:11,h:0.4,fontFace:BF,fontSize:13,color:GRAY,margin:0});

// 2. 프로젝트 한눈에
s=p.addSlide(); s.background={color:PAPER};
s.addText("우리가 만드는 것 (한눈에)",{x:0.7,y:0.5,w:12,h:0.7,fontFace:HF,fontSize:30,bold:true,color:INK,margin:0});
const cards=[
  ["무엇을","인기 숏폼 영상을 넣으면 → 흥행 요소를 분석하고 → 한국형 리메이크 대본·스토리보드를 만들어주는 웹앱"],
  ["왜","성공하는 숏폼엔 공식(훅·템포·CTA)이 있는데, 분석·기획에 시간이 너무 든다. 그걸 AI가 5분으로 압축"],
  ["우리만의 차별점","단순 API 호출이 아니라, 영상에서 컴퓨터비전으로 '진짜 정보'를 뽑아낸다 (수업 핵심)"],
];
cards.forEach((c,i)=>{
  const y=1.5+i*1.7;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.7,y,w:11.9,h:1.5,rectRadius:0.08,fill:{color:LIGHT},shadow:sh()});
  s.addShape(p.shapes.RECTANGLE,{x:0.7,y,w:0.12,h:1.5,fill:{color:ORANGE}});
  s.addText(c[0],{x:1.05,y:y+0.2,w:2.4,h:1.1,fontFace:HF,fontSize:19,bold:true,color:ORANGE,valign:"middle",margin:0});
  s.addText(c[1],{x:3.5,y:y+0.2,w:8.9,h:1.1,fontFace:BF,fontSize:15,color:DGRAY,valign:"middle",margin:0});
});

// 3. 어떻게 동작하나
s=p.addSlide(); s.background={color:INK};
chip(s,"동작 흐름",0.9,0.7,1.8,ORANGE);
s.addText("영상을 넣으면 이렇게 흘러간다",{x:0.85,y:1.25,w:11,h:0.8,fontFace:HF,fontSize:30,bold:true,color:LIGHT,margin:0});
const flow=[
  ["1  영상 입력","사용자가 릴스/쇼츠 영상 업로드"],
  ["2  컴퓨터비전","장면전환·모션·대표 프레임을 뽑아냄 (OpenCV)"],
  ["3  AI 분석","대표 프레임만 Gemini에 전달 → 빠르고 정확"],
  ["4  결과","훅·템포·리메이크 대본·스토리보드·TTS 제공"],
];
flow.forEach((c,i)=>{
  const x=0.85+i*3.0;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y:2.6,w:2.75,h:2.9,rectRadius:0.1,fill:{color:PANEL}});
  s.addText(c[0],{x:x+0.25,y:2.9,w:2.3,h:0.7,fontFace:HF,fontSize:18,bold:true,color:ORANGE,margin:0});
  s.addText(c[1],{x:x+0.25,y:3.7,w:2.3,h:1.6,fontFace:BF,fontSize:13.5,color:"E5E7EB",margin:0});
  if(i<3) s.addText("▶",{x:x+2.62,y:3.7,w:0.5,h:0.6,fontSize:20,color:ORANGE,align:"center",margin:0});
});
s.addText("포인트: 영상 전체가 아니라 'CV로 고른 핵심 프레임 몇 장'만 AI에 보내서 빠르고 싸다.",
  {x:0.85,y:6.0,w:11.6,h:0.6,fontFace:BF,fontSize:14,italic:true,color:"C9CDD6",margin:0});

// 4. 현재 상태
s=p.addSlide(); s.background={color:PAPER};
s.addText("지금 상태 (어디까지 됐나)",{x:0.7,y:0.5,w:12,h:0.7,fontFace:HF,fontSize:30,bold:true,color:INK,margin:0});
const st=[
  ["완료","프론트(웹화면) Vercel 배포","viralcraft-extracted.vercel.app",GREEN],
  ["완료","백엔드 CV+AI 코드 작성 (backend/)","OpenCV 파이프라인·실험 하네스 포함",GREEN],
  ["완료","GitHub 레포 + 발표자료 PPT","github.com/iluv4/viralcraft-ai",GREEN],
  ["할일","백엔드 실행/연동 + 실험 데이터","각자 역할에서 진행 (다음 장)",ORANGE],
];
st.forEach((c,i)=>{
  const y=1.6+i*1.25;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.7,y,w:11.9,h:1.05,rectRadius:0.08,fill:{color:LIGHT},shadow:sh()});
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.95,y:y+0.3,w:1.1,h:0.45,rectRadius:0.22,fill:{color:c[3]}});
  s.addText(c[0],{x:0.95,y:y+0.3,w:1.1,h:0.45,align:"center",valign:"middle",fontFace:HF,fontSize:12,bold:true,color:LIGHT,margin:0});
  s.addText(c[1],{x:2.3,y:y+0.15,w:6.3,h:0.75,fontFace:HF,fontSize:16,bold:true,color:INK,valign:"middle",margin:0});
  s.addText(c[2],{x:8.6,y:y+0.15,w:3.8,h:0.75,fontFace:BF,fontSize:12,color:GRAY,valign:"middle",margin:0});
});

// 5. 역할 분배 (카드)
s=p.addSlide(); s.background={color:PAPER};
s.addText("역할 분배 (4명 기준 · 3명이면 D 분담)",{x:0.7,y:0.5,w:12,h:0.7,fontFace:HF,fontSize:28,bold:true,color:INK,margin:0});
const roles=[
  ["A","CV 엔지니어","영상에서 정보 추출하는 OpenCV 코드","프레임추출·샷경계검출·옵티컬플로우·키프레임 선정"],
  ["B","AI / 프롬프트","AI에 잘 물어보고 실험으로 증명","속도 최적화·프롬프트 실험 하네스 돌리기·결과 정리"],
  ["C","프론트 / 풀스택","웹화면 + 백엔드 연결 + 배포","UI에 CV결과 시각화·프론트↔백엔드 연동·버그수정"],
  ["D","기획 / 발표 / QA","문서·발표·테스트","PPT·데모 시나리오·실험 데이터 표 정리·테스트"],
];
roles.forEach((c,i)=>{
  const x=0.7+(i%2)*6.25, y=1.5+Math.floor(i/2)*2.45;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y,w:5.95,h:2.2,rectRadius:0.1,fill:{color:LIGHT},shadow:sh()});
  s.addShape(p.shapes.OVAL,{x:x+0.3,y:y+0.3,w:0.75,h:0.75,fill:{color:ORANGE}});
  s.addText(c[0],{x:x+0.3,y:y+0.3,w:0.75,h:0.75,align:"center",valign:"middle",fontFace:HF,fontSize:24,bold:true,color:LIGHT,margin:0});
  s.addText(c[1],{x:x+1.25,y:y+0.32,w:4.4,h:0.5,fontFace:HF,fontSize:18,bold:true,color:INK,margin:0});
  s.addText(c[2],{x:x+1.25,y:y+0.82,w:4.4,h:0.45,fontFace:BF,fontSize:12.5,italic:true,color:ORANGE,margin:0});
  s.addText(c[3],{x:x+0.35,y:y+1.4,w:5.3,h:0.7,fontFace:BF,fontSize:13,color:DGRAY,margin:0});
});

// 6. 역할별 체크리스트
s=p.addSlide(); s.background={color:INK};
chip(s,"각자 이것만 하면 됨",0.9,0.6,3.0,ORANGE);
s.addText("역할별 할 일 (단계별)",{x:0.85,y:1.15,w:11,h:0.7,fontFace:HF,fontSize:27,bold:true,color:LIGHT,margin:0});
const tasks=[
  ["A · CV","backend/ 에서 cv_pipeline.py 검증 → 샘플영상으로 컷·키프레임 정확도 확인 → 지표 그래프"],
  ["B · AI","run_harness.py 로 프롬프트 실험 3~5회 → results.csv 정리 → 최적 조합 결론"],
  ["C · 프론트","Firebase 승인도메인 추가 → src/services 를 백엔드 호출로 교체 → 재배포"],
  ["D · 기획","PPT 수치 실측값 교체 → 데모 시나리오·녹화 → 테스트 체크리스트"],
];
tasks.forEach((c,i)=>{
  const y=2.2+i*1.15;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.85,y,w:11.65,h:0.98,rectRadius:0.08,fill:{color:PANEL}});
  s.addText(c[0],{x:1.1,y:y+0.14,w:1.9,h:0.7,fontFace:HF,fontSize:15,bold:true,color:ORANGE,valign:"middle",margin:0});
  s.addText(c[1],{x:3.0,y:y+0.14,w:9.3,h:0.7,fontFace:BF,fontSize:13.5,color:"E5E7EB",valign:"middle",margin:0});
});

// 7. 일정
s=p.addSlide(); s.background={color:PAPER};
s.addText("일정 — 오늘(5/24) → 기말 2주차(6/12)",{x:0.7,y:0.5,w:12,h:0.7,fontFace:HF,fontSize:27,bold:true,color:INK,margin:0});
const wk=[
  ["W1","5/24–5/31","기반 구축","CV 기본동작 확인 · 백엔드 실행 · 프론트↔백엔드 연결 준비"],
  ["W2","6/1–6/7","핵심 + 실험","옵티컬플로우·키프레임 완성 · 속도 측정 · 프롬프트 실험"],
  ["W3","6/8–6/12","통합·발표","합치기 · 실험결론 · 발표자료·데모 (기말이라 코드 최소)"],
];
wk.forEach((c,i)=>{
  const y=1.5+i*1.75;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.7,y,w:11.9,h:1.55,rectRadius:0.08,fill:{color:LIGHT},shadow:sh()});
  s.addShape(p.shapes.RECTANGLE,{x:0.7,y,w:1.7,h:1.55,fill:{color:i===2?ORANGE:INK}});
  s.addText(c[0],{x:0.7,y:y+0.25,w:1.7,h:0.55,align:"center",fontFace:HF,fontSize:24,bold:true,color:LIGHT,margin:0});
  s.addText(c[1],{x:0.7,y:y+0.85,w:1.7,h:0.5,align:"center",fontFace:BF,fontSize:11,color:i===2?"FFE8DC":"C9CDD6",margin:0});
  s.addText(c[2],{x:2.6,y:y+0.22,w:9.7,h:0.5,fontFace:HF,fontSize:18,bold:true,color:INK,margin:0});
  s.addText(c[3],{x:2.6,y:y+0.78,w:9.7,h:0.65,fontFace:BF,fontSize:13.5,color:DGRAY,valign:"middle",margin:0});
});

// 8. 마무리
s=p.addSlide(); s.background={color:INK};
s.addShape(p.shapes.OVAL,{x:-2,y:4.5,w:6,h:6,fill:{color:ORANGE,transparency:85}});
chip(s,"기억할 것",0.9,1.3,2.2,ORANGE);
s.addText("핵심은 '컴퓨터비전'",{x:0.85,y:1.95,w:11.6,h:1.0,fontFace:HF,fontSize:36,bold:true,color:LIGHT,margin:0});
const pts=[
  "데모는 노트북 로컬 실행이 제일 안전 (배포는 옵션)",
  "발표 핵심 = 샷경계·모션·키프레임 + 속도·실험 그래프",
  "막히면 GitHub 레포 docs/ 폴더에 다 정리돼 있음",
];
s.addText(pts.map(t=>({text:t,options:{bullet:{code:"2022",indent:18},breakLine:true,color:"E5E7EB",paraSpaceAfter:10}})),
  {x:0.95,y:3.2,w:11,h:2.2,fontFace:BF,fontSize:17,margin:0});
s.addText("github.com/iluv4/viralcraft-ai   ·   docs/ 폴더: 계획·CV설계·실험·배포 가이드",
  {x:0.9,y:6.6,w:11,h:0.4,fontFace:BF,fontSize:13,color:GRAY,margin:0});

p.writeFile({fileName:"C:/Users/4mins/Downloads/viralcraft-extracted/docs/ViralCraft_팀역할분배.pptx"}).then(f=>console.log("OK:",f));

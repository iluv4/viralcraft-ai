"""
Gemini 프록시 — API 키를 서버에만 두어 클라이언트 노출(이슈 #1)을 해결한다.
키프레임(CV 산출) + 메타데이터를 입력으로 받는 'grounded' 분석이 핵심(F5).
"""
from __future__ import annotations
import base64
import json
from typing import List, Optional

from google import genai
from google.genai import types

from . import config

_client: Optional[genai.Client] = None


def client() -> genai.Client:
    global _client
    if _client is None:
        if not config.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY가 설정되지 않았습니다 (.env 확인).")
        _client = genai.Client(api_key=config.GEMINI_API_KEY)
    return _client


ANALYSIS_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "hook": {"type": "STRING"},
        "structure": {"type": "STRING"},
        "tempo": {"type": "STRING"},
        "cta": {"type": "STRING"},
        "viralPoints": {"type": "ARRAY", "items": {"type": "STRING"}},
        "scenario": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "time": {"type": "STRING"},
                    "description": {"type": "STRING"},
                    "visualConcept": {"type": "STRING"},
                },
                "required": ["time", "description", "visualConcept"],
            },
        },
    },
    "required": ["hook", "structure", "tempo", "cta", "viralPoints"],
}


def _b64_to_part(data_url: str) -> types.Part:
    b64 = data_url.split(",", 1)[1] if "," in data_url else data_url
    return types.Part.from_bytes(data=base64.b64decode(b64), mime_type="image/jpeg")


def analyze_keyframes(keyframes: List[dict], cv_meta: dict, prompt_override: Optional[str] = None) -> dict:
    """F5: 영상 전체 대신 키프레임 + CV 메타만 전달 → 환각↓, 비용↓."""
    cuts = cv_meta.get("cuts", [])
    grounding = (
        f"[CV 측정 사실 — 추정하지 말고 그대로 활용]\n"
        f"- 영상 길이: {cv_meta.get('duration')}초\n"
        f"- 검출된 장면 전환(컷) 시각: {cuts}\n"
        f"- 컷 빈도: {cv_meta.get('cuts_per_sec')} cuts/sec\n"
        f"- 평균 모션: {cv_meta.get('avg_motion')} ({cv_meta.get('tempo_label')})\n"
        f"- 첨부된 이미지는 각 샷의 대표 키프레임이며 시간순이다.\n"
    )
    instruction = prompt_override or (
        "너는 세계적 바이럴 영상 분석가다. 첨부된 키프레임들과 위 CV 측정값만 근거로 "
        "영상의 훅/구조/템포/CTA/바이럴포인트와 4~6장면 스토리보드를 분석하라. "
        "키프레임에서 관찰되지 않은 내용은 지어내지 말 것. 모든 한국어 필드는 한국어로, "
        "visualConcept은 영어로 작성. JSON으로만 응답."
    )
    parts: List[types.Part] = [types.Part(text=grounding + "\n" + instruction)]
    for kf in keyframes:
        parts.append(_b64_to_part(kf["base64"]))

    resp = client().models.generate_content(
        model=config.MODEL_TEXT,
        contents=[types.Content(role="user", parts=parts)],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ANALYSIS_SCHEMA,
        ),
    )
    return json.loads(resp.text)


def generate_remake(analysis: dict, target_tone: str = "friendly", user_context: str = "") -> dict:
    prompt = (
        f"다음 바이럴 분석을 바탕으로 한국 시장용 리메이크 전략을 JSON으로 생성하라.\n"
        f"분석: {json.dumps(analysis, ensure_ascii=False)}\n타겟 톤: {target_tone}\n맥락: {user_context}\n"
        "포함: narration(한국어), shootingAngles[{type,description}], editFormat, "
        "viralScore(0-100 정수), tips[], remakeScenario[{time,description,visualConcept}]."
    )
    resp = client().models.generate_content(
        model=config.MODEL_TEXT,
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return json.loads(resp.text)


def chat(message: str, history: list, context: dict) -> str:
    contents = []
    for h in history:
        role = "user" if h.get("role") == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part(text=str(h.get("content", "")))]))
    sys = (
        "너는 ViralCraft AI 어시스턴트다. 크리에이터의 영상 리메이크를 돕는다. "
        f"맥락: {json.dumps(context, ensure_ascii=False)[:4000]}. 한국어로 전문적이고 창의적으로 답하라."
    )
    contents.append(types.Content(role="user", parts=[types.Part(text=sys + "\n\n사용자: " + message)]))
    resp = client().models.generate_content(model=config.MODEL_TEXT, contents=contents)
    return resp.text


def generate_image(prompt: str, aspect_ratio: str = "16:9") -> str:
    resp = client().models.generate_content(
        model=config.MODEL_IMAGE,
        contents=[types.Part(text=prompt)],
        config=types.GenerateContentConfig(image_config=types.ImageConfig(aspect_ratio=aspect_ratio)),
    )
    for part in resp.candidates[0].content.parts:
        if getattr(part, "inline_data", None) and part.inline_data.data:
            return "data:image/png;base64," + base64.b64encode(part.inline_data.data).decode("ascii")
    raise RuntimeError("이미지 생성 실패")

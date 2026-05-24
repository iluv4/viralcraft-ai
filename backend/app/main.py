"""
ViralCraft AI — FastAPI 백엔드.
- /cv/analyze : 순수 CV 파이프라인 (Gemini 호출 없음, 빠름)
- /analyze    : CV + 키프레임 기반 Gemini 분석 (F5 최적화 경로)
- /proxy/*    : Gemini 프록시 (API 키 서버 은닉 → 이슈 #1 해결)
실행:  uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations
import os
import tempfile
import time

from fastapi import FastAPI, File, UploadFile, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from dataclasses import asdict

from . import config, cv_pipeline, gemini_proxy

app = FastAPI(title="ViralCraft AI Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "gemini_key_loaded": bool(config.GEMINI_API_KEY)}


async def _save_temp(file: UploadFile) -> str:
    data = await file.read()
    if len(data) > config.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"{config.MAX_UPLOAD_MB}MB 이하만 허용됩니다.")
    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    return path


@app.post("/cv/analyze")
async def cv_analyze(file: UploadFile = File(...), max_kf: int = Query(config.MAX_KEYFRAMES)):
    """순수 CV: 샷 경계·모션·키프레임만 반환 (Gemini 미호출)."""
    path = await _save_temp(file)
    try:
        t0 = time.perf_counter()
        result = cv_pipeline.run_pipeline(path, max_kf=max_kf)
        elapsed = time.perf_counter() - t0
        out = asdict(result)
        out["cv_elapsed_sec"] = round(elapsed, 3)
        return out
    except ValueError as e:
        raise HTTPException(400, str(e))
    finally:
        os.remove(path)


@app.post("/analyze")
async def analyze(file: UploadFile = File(...), max_kf: int = Query(config.MAX_KEYFRAMES)):
    """CV + 키프레임 기반 Gemini 분석 (F5). 영상 전체 대신 키프레임만 전송."""
    path = await _save_temp(file)
    try:
        t0 = time.perf_counter()
        cv = cv_pipeline.run_pipeline(path, max_kf=max_kf)
        cv_meta = asdict(cv)
        # 키프레임 base64는 응답엔 유지하되, Gemini 입력용으로 그대로 전달
        analysis = gemini_proxy.analyze_keyframes(cv.keyframes, cv_meta)
        elapsed = time.perf_counter() - t0
        return {
            "analysis": analysis,
            "cv": {k: v for k, v in cv_meta.items()},
            "total_elapsed_sec": round(elapsed, 3),
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(502, f"분석 실패: {e}")
    finally:
        os.remove(path)


@app.post("/proxy/remake")
def proxy_remake(payload: dict = Body(...)):
    try:
        return gemini_proxy.generate_remake(
            payload.get("analysis", {}),
            payload.get("targetTone", "friendly"),
            payload.get("userContext", ""),
        )
    except Exception as e:
        raise HTTPException(502, str(e))


@app.post("/proxy/chat")
def proxy_chat(payload: dict = Body(...)):
    try:
        return {"reply": gemini_proxy.chat(
            payload.get("message", ""),
            payload.get("history", []),
            payload.get("context", {}),
        )}
    except Exception as e:
        raise HTTPException(502, str(e))


@app.post("/proxy/image")
def proxy_image(payload: dict = Body(...)):
    try:
        return {"imageUrl": gemini_proxy.generate_image(
            payload.get("prompt", ""), payload.get("aspectRatio", "16:9")
        )}
    except Exception as e:
        raise HTTPException(502, str(e))

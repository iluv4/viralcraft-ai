"""중앙 설정 — 실험 재현성을 위해 모든 CV 파라미터를 한 곳에 모은다."""
import os
from dotenv import load_dotenv

load_dotenv()

# --- Gemini ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# 실존 모델로 고정 (이슈 #4 대응). 환경변수로 오버라이드 가능.
MODEL_TEXT = os.getenv("MODEL_TEXT", "gemini-2.5-flash")
MODEL_IMAGE = os.getenv("MODEL_IMAGE", "gemini-2.5-flash-image")
MODEL_TTS = os.getenv("MODEL_TTS", "gemini-2.5-flash-preview-tts")

# --- CV 파이프라인 파라미터 (CV_PIPELINE.md 기준) ---
SAMPLE_FPS = float(os.getenv("SAMPLE_FPS", "3"))      # 프레임 추출 샘플링 FPS
LONG_EDGE = int(os.getenv("LONG_EDGE", "480"))        # 다운스케일 긴 변(px) → 속도↑
SBD_K = float(os.getenv("SBD_K", "3.0"))              # 샷경계 임계 = mean + k*std
KEYFRAME_W_SHARP = float(os.getenv("KF_W_SHARP", "0.6"))   # 키프레임 점수 가중치
KEYFRAME_W_COLOR = float(os.getenv("KF_W_COLOR", "0.4"))
MAX_KEYFRAMES = int(os.getenv("MAX_KEYFRAMES", "8"))  # Gemini로 보낼 최대 키프레임 수

# --- 서버 ---
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "50"))
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

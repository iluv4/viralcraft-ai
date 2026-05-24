# FastAPI + OpenCV 백엔드 컨테이너
FROM python:3.11-slim

# OpenCV(headless) + 영상 디코딩(ffmpeg)에 필요한 시스템 라이브러리
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app

# 클라우드(Run/Render/Railway)는 $PORT 를 주입한다. 없으면 8000.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]

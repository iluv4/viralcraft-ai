"""
컴퓨터비전 파이프라인 (F1~F4).
영상 → 프레임추출 → 샷경계검출 → 모션/템포 정량화 → 대표 키프레임 선정.
설계 문서: docs/CV_PIPELINE.md
"""
from __future__ import annotations
import base64
from dataclasses import dataclass, field
from typing import List, Tuple

import cv2
import numpy as np

from . import config


@dataclass
class Frame:
    t: float           # 시각(초)
    img: np.ndarray    # BGR (다운스케일됨)


@dataclass
class CVResult:
    duration: float
    fps: float
    sampled: int
    cuts: List[float]                      # 샷 경계 시각(초)
    cuts_per_sec: float
    motion_profile: List[Tuple[float, float]]  # (시각, 모션크기)
    avg_motion: float
    tempo_label: str
    keyframes: List[dict] = field(default_factory=list)  # {time, shot, sharpness, base64}


# ---------- F1. 프레임 추출 ----------
def _downscale(img: np.ndarray, long_edge: int) -> np.ndarray:
    h, w = img.shape[:2]
    scale = long_edge / max(h, w)
    if scale >= 1.0:
        return img
    return cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)


def extract_frames(path: str, sample_fps: float = config.SAMPLE_FPS) -> Tuple[List[Frame], float, float]:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise ValueError("영상을 열 수 없습니다.")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
    duration = (total / fps) if fps else 0.0
    step = max(1, int(round(fps / sample_fps)))

    frames: List[Frame] = []
    idx = 0
    while True:
        ok, f = cap.read()
        if not ok:
            break
        if idx % step == 0:
            frames.append(Frame(t=idx / fps, img=_downscale(f, config.LONG_EDGE)))
        idx += 1
    cap.release()
    if not frames:
        raise ValueError("프레임을 추출하지 못했습니다.")
    return frames, fps, duration


# ---------- F2. 샷 경계 검출 (HSV 히스토그램 χ² 거리) ----------
def _hsv_hist(img: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1], None, [50, 60], [0, 180, 0, 256])
    cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
    return hist


def shot_boundaries(frames: List[Frame], k: float = config.SBD_K) -> Tuple[List[float], List[float]]:
    hists = [_hsv_hist(f.img) for f in frames]
    dists = [
        float(cv2.compareHist(hists[i], hists[i + 1], cv2.HISTCMP_CHISQR))
        for i in range(len(hists) - 1)
    ]
    if not dists:
        return [], []
    tau = float(np.mean(dists) + k * np.std(dists))
    cuts = [frames[i + 1].t for i, d in enumerate(dists) if d > tau]
    return cuts, dists


# ---------- F3. 모션/템포 정량화 (Farneback dense optical flow) ----------
def motion_profile(frames: List[Frame]) -> Tuple[List[Tuple[float, float]], float]:
    prof: List[Tuple[float, float]] = []
    prev = cv2.cvtColor(frames[0].img, cv2.COLOR_BGR2GRAY)
    for f in frames[1:]:
        g = cv2.cvtColor(f.img, cv2.COLOR_BGR2GRAY)
        flow = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        mag = float(np.linalg.norm(flow, axis=2).mean())
        prof.append((f.t, mag))
        prev = g
    avg = float(np.mean([m for _, m in prof])) if prof else 0.0
    return prof, avg


def _tempo_label(cuts_per_sec: float, avg_motion: float) -> str:
    if cuts_per_sec >= 1.2 or avg_motion >= 8.0:
        return "빠른 템포 (fast-cut)"
    if cuts_per_sec >= 0.5 or avg_motion >= 3.0:
        return "보통 템포 (medium)"
    return "느린 템포 (slow / ASMR)"


# ---------- F4. 대표 키프레임 선정 (선명도 + 컬러풀니스) ----------
def _sharpness(img: np.ndarray) -> float:
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(g, cv2.CV_64F).var())


def _colorfulness(img: np.ndarray) -> float:
    # Hasler & Süsstrunk (2003)
    b, gch, r = cv2.split(img.astype("float"))
    rg = np.absolute(r - gch)
    yb = np.absolute(0.5 * (r + gch) - b)
    return float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))


def _norm(vals: List[float]) -> List[float]:
    if not vals:
        return []
    lo, hi = min(vals), max(vals)
    if hi - lo < 1e-9:
        return [0.5] * len(vals)
    return [(v - lo) / (hi - lo) for v in vals]


def _to_b64_jpg(img: np.ndarray) -> str:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if not ok:
        raise ValueError("JPEG 인코딩 실패")
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode("ascii")


def select_keyframes(frames: List[Frame], cuts: List[float], max_kf: int = config.MAX_KEYFRAMES) -> List[dict]:
    # 컷 경계로 샷 구간 분할
    bounds = [0.0] + cuts + [frames[-1].t + 1e-3]
    shots: List[List[Frame]] = []
    for i in range(len(bounds) - 1):
        seg = [f for f in frames if bounds[i] <= f.t < bounds[i + 1]]
        if seg:
            shots.append(seg)

    keyframes = []
    for s_idx, seg in enumerate(shots):
        sharp = [_sharpness(f.img) for f in seg]
        color = [_colorfulness(f.img) for f in seg]
        ns, nc = _norm(sharp), _norm(color)
        scores = [config.KEYFRAME_W_SHARP * ns[i] + config.KEYFRAME_W_COLOR * nc[i] for i in range(len(seg))]
        best = int(np.argmax(scores))
        keyframes.append({
            "time": round(seg[best].t, 2),
            "shot": s_idx,
            "sharpness": round(sharp[best], 2),
            "score": round(scores[best], 3),
            "base64": _to_b64_jpg(seg[best].img),
        })

    # 샷이 너무 많으면 점수 상위 max_kf개만 (시간순 유지)
    if len(keyframes) > max_kf:
        top = sorted(keyframes, key=lambda x: x["score"], reverse=True)[:max_kf]
        keyframes = sorted(top, key=lambda x: x["time"])
    return keyframes


# ---------- 전체 파이프라인 ----------
def run_pipeline(path: str, max_kf: int = config.MAX_KEYFRAMES) -> CVResult:
    frames, fps, duration = extract_frames(path)
    cuts, _ = shot_boundaries(frames)
    prof, avg_motion = motion_profile(frames)
    cps = (len(cuts) / duration) if duration else 0.0
    keyframes = select_keyframes(frames, cuts, max_kf)
    return CVResult(
        duration=round(duration, 2),
        fps=round(fps, 2),
        sampled=len(frames),
        cuts=[round(c, 2) for c in cuts],
        cuts_per_sec=round(cps, 3),
        motion_profile=[(round(t, 2), round(m, 3)) for t, m in prof],
        avg_motion=round(avg_motion, 3),
        tempo_label=_tempo_label(cps, avg_motion),
        keyframes=keyframes,
    )

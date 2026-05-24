"""
프롬프트 엔지니어링 실험 하네스.
(프롬프트 변형 × 입력방식) 조합을 돌려 결과/지연/타임스탬프 정합성을 측정하고 CSV로 남긴다.
설계: docs/PROMPT_HARNESS.md

사용:
  python -m experiments.run_harness --video sample.mp4 --repeats 3
결과: experiments/results/*.json, experiments/results.csv
"""
from __future__ import annotations
import argparse
import csv
import json
import os
import time
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import cv_pipeline, gemini_proxy  # noqa: E402
from dataclasses import asdict  # noqa: E402

HERE = Path(__file__).parent
PROMPTS = {p.stem: p.read_text(encoding="utf-8") for p in (HERE / "prompts").glob("*.txt")}
RESULTS = HERE / "results"
RESULTS.mkdir(exist_ok=True)


def timestamp_error(cv_cuts, model_scenario):
    """모델이 낸 scenario time vs CV 컷 시각의 평균 최소오차(초). 정합성 지표."""
    def parse(t):
        try:
            t = str(t).split("-")[0].strip().replace("s", "")
            if ":" in t:
                m, s = t.split(":"); return int(m) * 60 + float(s)
            return float(t)
        except Exception:
            return None
    model_times = [parse(s.get("time")) for s in (model_scenario or [])]
    model_times = [t for t in model_times if t is not None]
    if not model_times or not cv_cuts:
        return None
    errs = [min(abs(mt - c) for c in cv_cuts) for mt in model_times]
    return round(sum(errs) / len(errs), 2)


def run(video: str, repeats: int):
    print(f"[CV] 파이프라인 실행: {video}")
    cv = cv_pipeline.run_pipeline(video)
    cv_meta = asdict(cv)
    print(f"[CV] 컷 {len(cv.cuts)}개, 키프레임 {len(cv.keyframes)}장, 템포={cv.tempo_label}")

    rows = []
    for variant, prompt in PROMPTS.items():
        for r in range(repeats):
            exp_id = f"{variant}_r{r}"
            t0 = time.perf_counter()
            try:
                out = gemini_proxy.analyze_keyframes(cv.keyframes, cv_meta, prompt_override=prompt)
                ok = True
            except Exception as e:
                out, ok = {"error": str(e)}, False
            elapsed = round(time.perf_counter() - t0, 3)

            (RESULTS / f"{exp_id}.json").write_text(
                json.dumps({"variant": variant, "repeat": r, "output": out}, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            schema_ok = ok and all(k in out for k in ["hook", "structure", "tempo", "cta", "viralPoints"])
            ts_err = timestamp_error(cv.cuts, out.get("scenario")) if ok else None
            rows.append({
                "exp_id": exp_id, "variant": variant, "repeat": r,
                "schema_ok": schema_ok, "ts_error_sec": ts_err,
                "latency_sec": elapsed, "n_keyframes": len(cv.keyframes),
            })
            print(f"  {exp_id}: schema_ok={schema_ok} ts_err={ts_err} {elapsed}s")

    with open(HERE / "results.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    print(f"\n완료 → {HERE / 'results.csv'} (사람 평가는 rubric.csv에 별도 기입)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--repeats", type=int, default=3)
    args = ap.parse_args()
    if not os.path.exists(args.video):
        raise SystemExit(f"영상 없음: {args.video}")
    run(args.video, args.repeats)

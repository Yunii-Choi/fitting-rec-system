"""테스트 프로필 쌍별 sync% 측정 하네스 (MVP).

게이트 생략, κ=1 고정, 단일 archetype 라벨, 색은 평균 Lab.
4축 sim과 기여도(w·sim·100, 활성 가중치 재정규화 후)를 표로 출력.

사용:
    python model/score_testset.py
    python model/score_testset.py --profiles model/data/testset.json
"""
from __future__ import annotations

import argparse
import json
import warnings
from itertools import combinations
from pathlib import Path

from similarity import (
    WEIGHTS,
    archetype_sim,
    color_sim,
    keyword_sim,
    load_M,
    load_keyword_index,
    sync_final,
    sync_raw,
    temp_sim,
)


ROOT = Path(__file__).parent


def score_pair(a: dict, b: dict, M, kw_index) -> dict:
    sims = {
        "archetype": archetype_sim(a["archetype_id"], b["archetype_id"], M),
        "keyword":   keyword_sim(a["keywords"], b["keywords"], kw_index),
        "temp":      temp_sim(a["style_temp"], b["style_temp"]),
        "color":     color_sim(a["colors"], b["colors"]),
    }
    raw = sync_raw(sims)
    final = sync_final(raw, 1.0, 1.0) if raw is not None else None

    # 기여도: 활성 가중치 재정규화 후 각 축이 final에 얼마나 보탰는지
    active_w_sum = sum(WEIGHTS[axis] for axis, s in sims.items() if s is not None)
    contrib = {}
    for axis, s in sims.items():
        if s is None or active_w_sum == 0:
            contrib[axis] = None
        else:
            w_norm = WEIGHTS[axis] / active_w_sum
            contrib[axis] = 100.0 * w_norm * s

    return {"sims": sims, "contrib": contrib, "raw": raw, "final": final}


def fmt(v, w=6, p=2):
    if v is None:
        return f"{'—':>{w}}"
    return f"{v:>{w}.{p}f}"


def print_report(profiles: list[dict], results: list[tuple[dict, dict, dict]]):
    # 헤더
    print("\n=== sync% 측정 결과 (κ=1 고정, M_rescaled 사용) ===\n")
    print(f"가중치: archetype={WEIGHTS['archetype']:.2f}  "
          f"keyword={WEIGHTS['keyword']:.2f}  "
          f"temp={WEIGHTS['temp']:.2f}  "
          f"color={WEIGHTS['color']:.2f}\n")

    # 쌍별 결과
    col = "pair                                     | arch    kw     temp   color  |  raw   final"
    print(col)
    print("-" * len(col))
    for a, b, r in results:
        label = f"{a['id']} × {b['id']}"
        s = r["sims"]
        line = (
            f"{label:<40} |"
            f" {fmt(s['archetype'], 5, 3)}  {fmt(s['keyword'], 5, 3)}"
            f"  {fmt(s['temp'], 5, 3)}  {fmt(s['color'], 5, 3)}  |"
            f" {fmt(r['raw'], 5, 1)}  {fmt(r['final'], 5, 1)}"
        )
        print(line)

    # 기여도 분해 (어느 축이 점수를 끌었는지)
    print("\n--- 축별 기여도 (w·sim·100, 활성 가중치 재정규화 후, sum = final) ---\n")
    print("pair                                     | arch    kw     temp   color  |  sum")
    print("-" * len(col))
    for a, b, r in results:
        label = f"{a['id']} × {b['id']}"
        c = r["contrib"]
        total = sum(v for v in c.values() if v is not None)
        line = (
            f"{label:<40} |"
            f" {fmt(c['archetype'], 5, 2)}  {fmt(c['keyword'], 5, 2)}"
            f"  {fmt(c['temp'], 5, 2)}  {fmt(c['color'], 5, 2)}  |"
            f" {fmt(total, 5, 1)}"
        )
        print(line)
    print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--profiles", default=str(ROOT / "data" / "testset.json"))
    ap.add_argument("--m", default=str(ROOT / "artifacts" / "M.json"))
    ap.add_argument("--keywords", default=str(ROOT / "data" / "keywords.json"))
    args = ap.parse_args()

    profiles = json.loads(Path(args.profiles).read_text(encoding="utf-8"))
    M, _ids = load_M(args.m)
    kw_index = load_keyword_index(args.keywords)

    with warnings.catch_warnings():
        # unknown 토큰은 stderr로 나가지만, 테스트셋엔 unknown 없음 가정
        warnings.simplefilter("default")
        results = [
            (a, b, score_pair(a, b, M, kw_index))
            for a, b in combinations(profiles, 2)
        ]

    print_report(profiles, results)


if __name__ == "__main__":
    main()

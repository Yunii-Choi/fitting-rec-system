"""keyword_sim 테스트 시나리오 (model/progress.md 「설계 메모」 참조).

실행: python model/tests/test_keyword_sim.py
"""
from __future__ import annotations

import sys
import warnings
from pathlib import Path

# repo의 model/을 import path에 추가
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from similarity import KeywordIndex, keyword_sim, load_keyword_index  # noqa: E402

INDEX_PATH = ROOT / "data" / "keywords.json"
INDEX: KeywordIndex = load_keyword_index(INDEX_PATH)


def approx(a: float, b: float, eps: float = 1e-9) -> bool:
    return abs(a - b) < eps


# ─── 테스트 시나리오 ────────────────────────────────────────────────────

def test_self_similarity():
    """동일 유저 자기 자신 → 1.0"""
    a = ["미니멀", "깔끔", "오버핏", "셔츠", "무채색"]  # 5 facet 모두
    assert keyword_sim(a, a, INDEX) == 1.0


def test_completely_different_same_facet():
    """같은 facet 내에서 완전 다름 → 0.0"""
    a = ["미니멀"]   # genre
    b = ["클래식"]   # genre (다른 canonical)
    assert keyword_sim(a, b, INDEX) == 0.0


def test_one_side_empty_facet_penalty():
    """한쪽 빈 facet, 다른 쪽 있음 → 해당 facet Jaccard 0 (B 결정사항: 페널티)"""
    a = ["미니멀", "깔끔"]   # genre + vibe
    b = ["미니멀"]           # genre만
    # genre 활성(둘 다 미니멀), Jac=1
    # vibe  활성(a만 있음),   Jac=0
    # active_w = 0.40 + 0.25 = 0.65, weighted = 0.40
    expected = 0.40 / 0.65
    assert approx(keyword_sim(a, b, INDEX), expected)


def test_both_sides_empty_facet_dropped():
    """양쪽 다 빈 facet은 재정규화에서 제외 (그 facet 가중치 통째로 빠짐)"""
    a = ["미니멀"]
    b = ["미니멀"]
    # genre만 활성, Jac=1 → 0.4 / 0.4 = 1.0
    assert keyword_sim(a, b, INDEX) == 1.0


def test_raw_synonym_merges_to_canonical():
    """raw 동의어 → 정규화 후 같은 canonical, Jaccard 기여"""
    # 둘 다 normalize 후 genre.스트릿
    assert keyword_sim(["럭셔리스트릿"], ["그런지"], INDEX) == 1.0


def test_unknown_token_warns_and_drops():
    """잘못된 토큰 → warn + drop, 나머지 토큰으로 계산 (A 결정사항)"""
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        result = keyword_sim(["미니멀", "존재안함"], ["미니멀"], INDEX)
    assert result == 1.0
    assert any("unknown keyword" in str(w.message) for w in caught), "warn 미발생"


def test_all_empty_returns_none():
    """양 유저 모두 어떤 facet에도 키워드 없음 → None (D 결정사항)"""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        assert keyword_sim(["존재안함"], ["없음"], INDEX) is None
        assert keyword_sim([], [], INDEX) is None


def test_multi_facet_realistic():
    """미니멀 시티보이 vs 미니멀 시크걸 — 같은 계열인데 키워드는 부분 일치"""
    a = ["미니멀", "모던캐주얼", "깔끔", "시티무드"]
    b = ["미니멀", "시크", "단정함", "모노톤"]
    # a_norm: genre={미니멀, 캐주얼}, vibe={깔끔, 시티무드}
    # b_norm: genre={미니멀, 시크}, vibe={깔끔}, color={무채색}
    #   ('단정함' → vibe.깔끔, '모노톤' → color.무채색)
    # genre  active, Jac = 1/3 (intersection={미니멀}, union={미니멀,캐주얼,시크})
    # vibe   active, Jac = 1/2 (intersection={깔끔},   union={깔끔,시티무드})
    # color  active, Jac = 0   (a 빔, b 있음)
    # fit, item: 둘 다 빔 → 제외
    expected = (0.40 * (1/3) + 0.25 * (1/2) + 0.05 * 0) / (0.40 + 0.25 + 0.05)
    assert approx(keyword_sim(a, b, INDEX), expected)


# ─── 러너 ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import traceback
    tests = [(n, fn) for n, fn in sorted(globals().items())
             if n.startswith("test_") and callable(fn)]
    passed, failed = 0, 0
    for name, fn in tests:
        try:
            fn()
            print(f"  ✓ {name}")
            passed += 1
        except Exception as e:
            print(f"  ✗ {name}: {type(e).__name__}: {e}")
            traceback.print_exc()
            failed += 1
    print(f"\n{passed}/{len(tests)} passed" + (f", {failed} FAILED" if failed else ""))
    sys.exit(0 if failed == 0 else 1)

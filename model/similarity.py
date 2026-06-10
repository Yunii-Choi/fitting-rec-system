"""런타임 매칭 유사도 함수.

CLAUDE.md 매칭 설계 요약 참조:
  2단계: 게이트(하드 필터) → 스코어(4축 가중합) → 일관도 압축.

구현 상태:
  ✓ keyword_sim, archetype_sim, temp_sim, color_sim, sync_raw, sync_final
  □ gate_pass, consistency_kappa (스코프 밖)

런타임 매칭 루프엔 임베딩 계산 없음 — 표 조회 + 집합 연산 + 산수뿐.
"""
from __future__ import annotations

import json
import math
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Mapping, Sequence, Union

# 4축 가중치 (무드는 매칭 제외)
WEIGHTS = {"archetype": 0.40, "keyword": 0.30, "temp": 0.20, "color": 0.10}


# ─── ② 키워드 통제 어휘 인덱스 ──────────────────────────────────────────

@dataclass(frozen=True)
class KeywordIndex:
    """keywords.json을 한 번 로드해서 런타임 룩업용으로 펼친 인덱스."""
    facets: tuple[str, ...]
    facet_weights: Mapping[str, float]
    normalize: Mapping[str, tuple[str, str]]  # raw → (facet, canonical)

    def normalize_user(self, raw_tokens: Iterable[str]) -> dict[str, set[str]]:
        """유저의 raw 키워드 리스트 → facet별 canonical 셋.

        알 수 없는 토큰은 warn + drop (결정사항 A).
        리턴 dict는 모든 facet 키 포함, 비어있을 수 있음.
        """
        result: dict[str, set[str]] = {f: set() for f in self.facets}
        for tok in raw_tokens:
            entry = self.normalize.get(tok)
            if entry is None:
                warnings.warn(
                    f"unknown keyword token: {tok!r} — dropped",
                    UserWarning,
                    stacklevel=2,
                )
                continue
            facet, canonical = entry
            result[facet].add(canonical)
        return result


def load_keyword_index(path: str | Path) -> KeywordIndex:
    """keywords.json → KeywordIndex. 앱 부팅 시 한 번."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    facets = tuple(data["facets"].keys())
    facet_weights = {f: data["facets"][f]["weight"] for f in facets}
    normalize = {
        tok: (info["facet"], info["canonical"])
        for tok, info in data["normalize"].items()
    }
    s = sum(facet_weights.values())
    if abs(s - 1.0) > 1e-6:
        warnings.warn(f"facet weights sum to {s:.4f}, expected 1.0", UserWarning)
    return KeywordIndex(facets=facets, facet_weights=facet_weights, normalize=normalize)


# ─── M 로더 ──────────────────────────────────────────────────────────────

def load_M(path: str | Path) -> tuple[list[list[float]], list[int]]:
    """artifacts/M.json → (M_rescaled 30×30, ids_present)."""
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    return data["M_rescaled"], data["ids_present"]


# ─── 게이트 ──────────────────────────────────────────────────────────────

def gate_pass(user_a: Mapping, user_b: Mapping) -> bool:
    """성별/지향·나이로 후보 풀 필터. 유사도 아님(통과/제외)."""
    raise NotImplementedError


# ─── 4축 유사도 ─────────────────────────────────────────────────────────

def archetype_sim(
    a: Union[int, Sequence[float]],
    b: Union[int, Sequence[float]],
    M: Sequence[Sequence[float]],
) -> float:
    """① 아키타입 유사도.

    a, b가 int(archetype_id 1~30)이면 단일 라벨 모드: M[a-1][b-1].
    a, b가 Sequence[float] 분포면 pᵀMq.
    """
    if isinstance(a, int) and isinstance(b, int):
        return M[a - 1][b - 1]
    # 분포 모드: pᵀMq
    p, q = list(a), list(b)
    n = len(p)
    return sum(p[i] * M[i][j] * q[j] for i in range(n) for j in range(n))


def keyword_sim(
    a: Iterable[str],
    b: Iterable[str],
    index: KeywordIndex,
) -> float | None:
    """② facet 가중 자카드.

    Returns:
        0~1 float, 또는 None (양 유저 모두 어떤 facet에도 키워드 없음).
        호출자(sync_raw)가 None을 받으면 keyword 축 자체를 가중치 재정규화에서 제외.

    설계 결정 (model/progress.md 「설계 메모 — keyword_sim」 참조):
      A: 알 수 없는 raw 토큰 → warn + drop  (normalize_user에서)
      B: 한쪽 facet만 비어있음 → 활성, Jaccard 0  (정보 격차는 페널티)
      C: 정규화는 KeywordIndex.normalize_user() 헬퍼로
      D: 양쪽 다 모두 비어있음 → None 반환
    """
    a_norm = index.normalize_user(a)
    b_norm = index.normalize_user(b)

    weighted_sum = 0.0
    active_weight = 0.0
    for facet in index.facets:
        sa, sb = a_norm[facet], b_norm[facet]
        if not sa and not sb:
            continue                              # B: 양쪽 빔 → 비활성
        union = sa | sb
        jaccard = len(sa & sb) / len(union) if union else 0.0
        w = index.facet_weights[facet]
        weighted_sum += w * jaccard
        active_weight += w

    if active_weight == 0:
        return None                               # D: 모두 비어있음
    return weighted_sum / active_weight


def temp_sim(t_a: float, t_b: float) -> float:
    """③ 꾸밈온도(0~100): 1 − |Δ|/100. clamp [0, 1]."""
    s = 1.0 - abs(t_a - t_b) / 100.0
    return max(0.0, min(1.0, s))


# ── 색 변환 헬퍼 (MVP: hex → sRGB → XYZ → CIELAB, D65) ───────────────────

def _hex_to_rgb01(h: str) -> tuple[float, float, float]:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))  # type: ignore[return-value]


def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _hex_to_lab(h: str) -> tuple[float, float, float]:
    """hex → CIELAB (D65). MVP, sRGB 가정."""
    r, g, b = (_srgb_to_linear(c) for c in _hex_to_rgb01(h))
    # sRGB linear → XYZ (D65)
    x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
    y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
    z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b
    # D65 white reference
    xn, yn, zn = 0.95047, 1.00000, 1.08883
    def f(t: float) -> float:
        delta = 6 / 29
        return t ** (1 / 3) if t > delta ** 3 else t / (3 * delta ** 2) + 4 / 29
    fx, fy, fz = f(x / xn), f(y / yn), f(z / zn)
    L = 116 * fy - 16
    a = 500 * (fx - fy)
    b_ = 200 * (fy - fz)
    return L, a, b_


def color_sim(
    hex_a: Sequence[str],
    hex_b: Sequence[str],
) -> float | None:
    """④ 컬러 (MVP): 팔레트 평균 Lab 간 ΔE76 → 1 - min(ΔE/100, 1).

    빈 팔레트가 한 쪽이라도 있으면 None.
    """
    if not hex_a or not hex_b:
        return None
    def mean_lab(palette: Sequence[str]) -> tuple[float, float, float]:
        labs = [_hex_to_lab(h) for h in palette]
        n = len(labs)
        return tuple(sum(c) / n for c in zip(*labs))  # type: ignore[return-value]
    L1, a1, b1 = mean_lab(hex_a)
    L2, a2, b2 = mean_lab(hex_b)
    delta_e = math.sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
    return 1.0 - min(delta_e / 100.0, 1.0)


# ─── 집계 ────────────────────────────────────────────────────────────────

def sync_raw(
    sims: Mapping[str, float | None],
    weights: Mapping[str, float] = WEIGHTS,
) -> float | None:
    """4축 가중합 → 0~100. None/결측 축은 가중치 재정규화. 활성 0개면 None."""
    weighted_sum = 0.0
    active_weight = 0.0
    for axis, w in weights.items():
        sim = sims.get(axis)
        if sim is None:
            continue
        weighted_sum += w * sim
        active_weight += w
    if active_weight == 0:
        return None
    return 100.0 * weighted_sum / active_weight


def consistency_kappa(user_features: Sequence[Mapping]) -> float:
    """유저의 사진들 간 self-유사도 κ (같은 4축 재활용). 화면 04 '스타일 일관도'."""
    raise NotImplementedError


def sync_final(sync_raw_val: float, kappa_a: float = 1.0, kappa_b: float = 1.0) -> float:
    """일관도 압축: 50 + min(κ_a, κ_b) × (sync_raw − 50). κ=1이면 raw 그대로."""
    return 50.0 + min(kappa_a, kappa_b) * (sync_raw_val - 50.0)

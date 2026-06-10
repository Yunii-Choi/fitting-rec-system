"""런타임 매칭 유사도 함수.

CLAUDE.md 매칭 설계 요약 참조:
  2단계: 게이트(하드 필터) → 스코어(4축 가중합) → 일관도 압축.

구현 상태:
  ✓ keyword_sim — facet 가중 자카드 (5 facet, weight 재정규화)
  □ archetype_sim, temp_sim, color_sim, sync_raw, consistency_kappa, sync_final

런타임 매칭 루프엔 임베딩 계산 없음 — 표 조회 + 집합 연산 + 산수뿐.
"""
from __future__ import annotations

import json
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Mapping, Sequence

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


# ─── 게이트 ──────────────────────────────────────────────────────────────

def gate_pass(user_a: Mapping, user_b: Mapping) -> bool:
    """성별/지향·나이로 후보 풀 필터. 유사도 아님(통과/제외)."""
    raise NotImplementedError


# ─── 4축 유사도 ─────────────────────────────────────────────────────────

def archetype_sim(
    p: Sequence[float],
    q: Sequence[float],
    M: Sequence[Sequence[float]],
) -> float:
    """① 아키타입 분포 유사도: pᵀMq. 단일 라벨이면 M[i][j]."""
    raise NotImplementedError


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
    """③ 꾸밈온도(0~100): 1 − |Δ|/100."""
    raise NotImplementedError


def color_sim(
    colors_a: Sequence[Mapping],
    colors_b: Sequence[Mapping],
) -> float:
    """④ 컬러: 저장된 CIELAB로 거리 계산. hex→Lab 변환은 프로필 생성 시 끝남."""
    raise NotImplementedError


# ─── 집계 ────────────────────────────────────────────────────────────────

def sync_raw(
    sims: Mapping[str, float | None],
    weights: Mapping[str, float] = WEIGHTS,
) -> float:
    """4축 가중합 → 0~100. None/결측 축은 가중치 재정규화."""
    raise NotImplementedError


def consistency_kappa(user_features: Sequence[Mapping]) -> float:
    """유저의 사진들 간 self-유사도 κ (같은 4축 재활용). 화면 04 '스타일 일관도'."""
    raise NotImplementedError


def sync_final(sync_raw_val: float, kappa_a: float, kappa_b: float) -> float:
    """일관도 압축: 50 + min(κ_a, κ_b) × (sync_raw − 50)."""
    raise NotImplementedError

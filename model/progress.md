# 핏팅 매칭 엔진 — 진행 로그 (progress.md)

> 세션 **시작 시 읽고, 끝낼 때 갱신**한다. 설계·규칙은 `CLAUDE.md`, 진행 상황·결정·다음 할 일은 여기.

## 현재 상태
**M v1 빌드 완료**(30/30, 120 앵커 이미지). `similarity.py::keyword_sim` 구현+테스트 통과. 저녁에 재개 — **홀드 중**.

## 완료
- 매칭 설계 확정: 게이트 → 4축 가중합 → 일관도 압축 (상세는 CLAUDE.md)
- 아키타입 거리 = Path 2 (배정=LLM, M=FashionCLIP 이미지 앵커, 오프라인 1회)
- 일관도(κ) 역할 = 점수 중립 압축(`50 + κ(raw−50)`) + 화면 표시
- 앵커 이미지 일부 수집 (Drive: 현재 `13/`, `27/` 폴더만, 1~2장)
- **[2026-06-10]** 엑셀(`~/Downloads/fashion_matching/style-keywords.xlsx`, 시트1) →
  - `model/data/archetypes.json` (30개, id 1~30 정수, Drive 폴더와 일치)
  - `model/data/keywords_raw.json` (109 unique / 120 total, 동의어 통합 X)
- **[2026-06-10]** `model/` 스캐폴드: `build_matrix.ipynb`(빈 셀+6단계 마크다운), `similarity.py`(함수 시그니처 8개 NotImplementedError), `artifacts/`(빈 폴더)
- gender 자동 추정 규칙: 보이→M(1), 걸/페미닌→F(3), 나머지→U(26)
- **[2026-06-10]** `model/data/keywords.json` 추가 — 5 facet 가중 구조(genre 0.40 / vibe 0.25 / fit 0.15 / item 0.15 / color 0.05), canonical 63개, normalize 맵 109 raw→canonical 100% 커버
- **[2026-06-10]** `model/build_matrix.ipynb` 본구현 — 9 코드 셀 자체완결 Colab 노트북. segformer 크롭(GARMENT 라벨 마스크, 흰배경 RGB + bbox 타이트 크롭 + 정사각 패딩 / RGBA 검수본 별도) → FashionCLIP 임베딩(L2 정규화 → 평균 → 재정규화) → 30×30 코사인(NaN fill) → off-diagonal 재스케일(부분 커버리지면 스킵) → 최근접 top-5 + 계열 within/cross 리포트 → M.json + anchors.npy + report.md
- **[2026-06-10]** **M v1 빌드 성공** — Colab+VS Code, 30/30 풀 커버리지, 4 imgs/id (120장 총). 산출물 `model/artifacts/`에: M.json, anchors.npy (shape=(30,512)), anchors_ids.json, report.md. off-diagonal raw [0.6841, 0.9243], mean 0.81 ± 0.05.
  - 디버깅 우회: FashionCLIP `get_image_features()`가 일부 transformers 버전에서 풀링 안 된 (1, seq, hidden)을 반환 → `vision_model + visual_projection` 직접 호출로 우회.
  - Drive 셋업: 데이터는 Mac→Drive Desktop sync(`~/Library/CloudStorage/GoogleDrive-.../My Drive/fitting/data`), 앵커는 "Shared with me" → My Drive 바로가기로 마운트(`Fitting 이미지 데이터 모음/`).
- **[2026-06-10]** **`similarity.py::keyword_sim` 구현 + 테스트 8/8 통과** — 설계 메모 A~D 추천안대로. `KeywordIndex` dataclass + `load_keyword_index()` + `KeywordIndex.normalize_user()`. 테스트: `model/tests/test_keyword_sim.py` (self-sim, 완전 다름, 페널티, drop, 동의어 정규화, unknown warn, None 반환, 멀티 facet 현실 케이스).

## 진행 중
- (없음 — 저녁까지 홀드)

## 다음 (태스크 큐)
1. **앵커 보강 + M v2 재빌드** — 아래 「성능 평가 (M v1)」의 우선순위 항목 반영. 특히 감성 내추럴(20) hub 효과, 맥시멀/캐주얼 분산, 시티보이↔시크걸 페어 약함.
2. `similarity.py` 나머지 구현 — `archetype_sim`(M[i][j]/pᵀMq), `temp_sim`, `color_sim`(CIELAB), `sync_raw`(None 포함 가중치 재정규화), `consistency_kappa`, `sync_final`. 각각 테스트 추가.
3. 🔴 **gender 라벨 보강 검토** — U(26)개 중 페어로 분리할 것 결정 (시티보이↔시크걸 페어 약화 문제와 연관)
4. **archetypes.json 키워드 재매핑** (선택) — 현재 raw 토큰. 통제 어휘로 재매핑하면 LLM 추출과 마스터 데이터가 동일 정규화 거침. 단 raw → KeywordIndex.normalize_user 하면 런타임에 자동 정규화되므로 마이그레이션은 not blocking.
5. `extract/schema.py` — LLM 출력 JSON 스키마 (`keywords.json::vocabulary`를 enum으로 강제)
6. Firebase 연결 (추후)

## 블로커 / 열린 질문
- 🔴 추출 JSON 스키마 미확정 (런타임용 — `keywords.json::vocabulary` enum 강제로 작성 예정)
- 앵커 품질 보강 필요 — 아래 「성능 평가 (M v1)」 참조 (특히 감성 내추럴 hub, 맥시멀 분산)
- gender U(26) 처리 — 페어 라벨 확장 여부 (시티보이↔시크걸 cos 0.8585로 약함, 페어 가설 검증 안 됨)

## 성능 평가 (M v1, 2026-06-10)

`model/artifacts/report.md` 분석. **파이프라인 정상 작동, 일부 계열 응집력 부족.**

### ✅ 합리적 시그널
- **직관적으로 비슷한 페어가 가까움**: 클린베이직↔모던클래식 0.9243, 하이엔드스트릿↔테크웨어 0.9241, 모노톤↔다크아티스틱 0.9200
- **직관적으로 다른 페어가 멀음**: 글램맥시멀↔아메카지 0.6841, 러블리페미닌↔아메카지 0.6941
- off-diagonal 분포 mean 0.81 ± 0.05, range [0.68, 0.92] — 재스케일이 의미있게 작동할 폭

### 계열별 within / cross
| 계열 | within | cross | diff | 판정 |
|---|---|---|---|---|
| 클래식 | 0.8768 | 0.8198 | **+0.057** | ✓✓ |
| 스트릿 | 0.8671 | 0.8109 | **+0.056** | ✓✓ |
| 미니멀 | 0.8509 | 0.8217 | +0.029 | ✓ |
| 페미닌 | 0.8123 | 0.8123 | 0.000 | ⚠ 구분 안 됨 |
| 아티스틱 | 0.8066 | 0.8082 | -0.002 | ⚠ 구분 안 됨 |
| 캐주얼 | 0.7851 | 0.8021 | **-0.017** | ❌ |
| 맥시멀 | 0.7709 | 0.7956 | **-0.025** | ❌ |

### ⚠ 개선 우선순위 (다음 빌드 전)
1. **감성 내추럴(id 20) hub 효과** — 거의 절반의 아키타입 top-5에 등장. 앵커가 너무 무난해서 모든 것과 평균적으로 비슷한 임베딩. 더 특색있는 사진(린넨/오가닉/대지색)으로 교체.
2. **맥시멀 계열 앵커 재정렬** — 글램/보헤미안/아메카지/컬러팝이 시각적으로 너무 다름. 각 아키타입의 "맥시멀스러운 공통점" 드러나도록.
3. **시티보이↔시크걸 페어** — cos 0.8585로 평균보다 약간 높지만 1순위 아님 (CLAUDE.md 가설 충족 X). 두 anchors의 옷색/실루엣 의도적으로 비슷하게.
4. **캐주얼 계열 재검토** — within < cross. 릴렉스/스포티/코지/서프/캠퍼스가 의외로 서로 멀음.

### 매칭 시스템 관점
지금 M으로 매칭 돌려도 클래식·스트릿·미니멀 계열 유저들끼린 잘 매칭됨. 캐주얼/맥시멀/페미닌은 어수선할 가능성. 한 사이클 보강 권장하지만 파이프라인 검증으론 충분히 성공.

---

## 설계 메모 — `keyword_sim` ✓ 구현 완료 (2026-06-10)

`similarity.py::keyword_sim` 구현됨. 결정사항 A~D 추천안 그대로 적용. 테스트 `model/tests/test_keyword_sim.py` 8/8 통과.

### 시그니처 변경 제안 (현재 stub → 2-함수 구조)

```python
def load_keyword_index(path: str | Path) -> KeywordIndex:
    """keywords.json 1회 로드 → 룩업 인덱스. 앱 부팅 시 한 번."""

def keyword_sim(
    a: Iterable[str],
    b: Iterable[str],
    index: KeywordIndex,
) -> float | None:
    """facet 가중 자카드. 0~1 또는 None(전부 비어있음)."""
```

`KeywordIndex` = dataclass `{facet_weights, normalize: dict[str→(facet,canonical)], facets: list[str]}`.
**이유:** 매 호출마다 JSON 파싱은 낭비. 모듈 전역 캐시는 테스트가 지저분해짐.

### 알고리즘

1. **정규화** — 두 입력 각각에 `index.normalize[token]` → `(facet, canonical)`. 알 수 없는 토큰 drop.
2. **facet 셋** — 유저별 `dict[facet → set[canonical]]`. 5개 facet 키 모두 존재(빈 셋 가능).
3. **facet별 Jaccard** —
   - 양쪽 다 빈 셋 → **비활성** (재정규화 시 제외)
   - 한쪽이라도 있음 → 활성. Jaccard = `|A∩B|/|A∪B|`. 한쪽만 비면 0 (페널티).
4. **가중치 재정규화** — 활성 facet weight 합으로 나눔 → 활성 facet 가중합.
5. **반환** — `Σ(normalized_weight × jaccard)` 또는 활성 0개면 None.

### 결정사항 (합의 필요)

| # | 이슈 | 옵션 | 추천 |
|---|---|---|---|
| A | 알 수 없는 raw 토큰 | (1) silently drop / (2) warn+drop / (3) raise | **(2)** — schema 위반 모니터링하되 매칭은 안 막음 |
| B | 한쪽 facet만 비어있음 | (1) 활성+Jaccard 0 / (2) drop | **(1)** — "명시 안 함" ≠ "양쪽 모름". 정보 격차는 페널티 |
| C | 정규화 함수 위치 | (1) `keyword_sim` 내부 / (2) 호출자가 미리 / (3) `KeywordIndex.normalize_user()` 헬퍼 | **(3)** — 정규화는 캐싱 대상. Firestore에 정규화 형태로 저장 |
| D | 두 유저 모두 5 facet 다 비어있음 | (1) 0.0 / (2) None / (3) `sync_raw`에서 keyword 축 drop | **(3)** — CLAUDE.md "결측 축은 가중치 재정규화" 정신. `keyword_sim`이 None 반환 → `sync_raw`가 축 자체 뺌 |

### 영향받는 다른 코드

- `similarity.py::sync_raw` 시그니처: `sims: Mapping[str, float | None]` 허용 (D번 결정 시).
- `archetypes.json` 키워드 재매핑 작업(태스크 큐 #2)과 같은 인덱스 재사용 → 마스터 데이터/유저 데이터 둘 다 동일 정규화.
- Firestore 스키마: `profile_keywords` 정션은 `(user_id, facet, canonical)` 모양이어야 함 (추후 단계).

### 테스트 시나리오 (구현 시 같이 작성)

- 동일 유저 자기 자신 → 1.0
- 완전 다른 facet 셋 → 0.0
- 한쪽 빈 facet (다른 쪽엔 있음) → 그 facet은 0 (재정규화 후 가중합에 페널티)
- 양쪽 다 빈 facet → 재정규화에서 제외 (그 facet 없는 셈)
- raw 동의어 (`럭셔리스트릿` ↔ `스트릿`) → 정규화 후 동일 canonical, Jaccard 기여
- 잘못된 토큰 (`존재안함`) → drop + warn
- 모든 facet 비어있는 양 유저 → `None` 반환, `sync_raw`에서 축 자체 빠짐

---

## 환경 메모
- 앵커: Google Drive를 로컬 동기화 → 로컬 경로로 접근. 코드엔 `ANCHOR_DIR` 변수 하나로 분리(로컬/Colab 경로 교체용).
- 임베딩 실행: Colab(GPU) 또는 로컬. 코드 동일, 경로만 다름.
- Firebase: `serviceAccount.json` (Admin SDK) — 추후 런타임 단계. **절대 커밋 금지(.gitignore).**
- 데이터 스크립트 Python: `/Library/Frameworks/Python.framework/Versions/3.9/bin/python3.9` (openpyxl/pandas 설치됨). anaconda/pyenv 디폴트 피하기.
- 코드 디렉토리는 `model/`. CLAUDE.md의 `matching/` 경로는 `model/`로 읽기.

## 변경 로그
- **2026-06-10** — 첫 코딩 작업. archetypes.json/keywords_raw.json 생성, model/ 스캐폴드. id=정수, gender=닉네임 추정. progress.md 갱신 시작.
- **2026-06-10** — keywords.json(5 facet 가중 구조, canonical 63개) 추가. raw 109 토큰 100% 커버 검증. 키워드 사전 블로커 해제 → keyword_sim 구현 단계 진입.
- **2026-06-10** — `keyword_sim` 설계 메모 작성(2-함수 구조, 알고리즘, 결정사항 A~D, 테스트 시나리오). A~D 합의 대기.
- **2026-06-10** — `build_matrix.ipynb` 9 코드 셀 구현. 사용자 피드백 반영: 임베딩 입력은 흰배경 RGB + bbox 타이트 + 정사각 패딩 (RGBA 검수본 별도), M_rescaled는 풀 커버리지 전용. keyword_sim 결정은 홀드, 아키타입 임베딩 우선.
- **2026-06-10** — M v1 빌드 성공(30/30, 120 앵커). Drive 셋업·get_image_features 버그 우회 등 디버깅 후 완주. 성능 평가 위 섹션 추가. `model/artifacts/`에 M.json·anchors.npy·anchors_ids.json·report.md 모두 저장.
- **2026-06-10** — `similarity.py::keyword_sim` 구현. 설계 메모 A~D 추천안 그대로(warn+drop / 한쪽 빔 페널티 / KeywordIndex 헬퍼 / None 반환). 테스트 8/8 통과. 저녁 재개 위해 홀드.

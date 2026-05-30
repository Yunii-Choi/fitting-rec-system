# fitting 👕

> 옷만 보고 이 사람이랑 사귈 수 있을까?
> OOTD 패션 데이팅 앱 — Style Chemistry MVP

얼굴보다 스타일이 먼저 보이는 데이팅 앱. OOTD 사진으로 스타일 무드를 분석하고,
스타일 케미가 맞는 사람을 찾아 매칭해 줍니다.

## 📁 디렉토리 구조

```
fitting/
├── README.md
├── .gitignore
├── docs/                 # 설계 문서 (버전관리 대상)
│   ├── erd/
│   │   ├── erd.html      # 시각적 ERD (브라우저에서 열기)
│   │   └── schema.md     # 테이블 스키마 정의
│   └── wireframe/
│       └── wireframe.html # 7-스크린 UX 플로우 와이어프레임
└── firebase/             # Firebase 연동
    ├── firebase-config.js # 설정 템플릿 (콘솔 값으로 채우기)
    ├── storage.js         # Storage 업로드/다운로드 헬퍼
    └── README.md          # Firebase 셋업 가이드
```

## 🔥 Firebase

- 프로젝트 ID: `fitting-524`
- Storage 버킷: `fitting-524.firebasestorage.app`
- 셋업 방법은 [`firebase/README.md`](./firebase/README.md) 참고

## 🌿 브랜치 전략

| 브랜치 | 용도 |
| --- | --- |
| `main` | 통합 브랜치 (보호) |
| `feat_charles` | Charles 작업 |
| `feat_clara` | Clara 작업 |
| `feat_tissue` | Tissue 작업 |
| `feat_jenifer` | Jenifer 작업 |

각 `feat_*` 브랜치는 `main`에서 분기하며, 작업 후 PR로 `main`에 병합합니다.

## 🖥️ 핵심 화면 (7)

1. 프로필 입력 → 2. OOTD 업로드 → 3. AI 분석 → 4. 스타일 프로필
→ 5. 매칭 리스트 → 6. 케미 리포트 → 7. 채팅

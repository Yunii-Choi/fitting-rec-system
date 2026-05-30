# 데이터 스키마 (fitting)

시각적 ERD는 [`erd.html`](./erd.html)을 브라우저로 열어 확인하세요.

## 테이블

### users — 사용자 프로필
| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| id | PK | |
| email | string | |
| gender | enum | MALE / FEMALE |
| nickname | string | 예: 스타일러시_준 |
| age | int | |
| created_at | timestamp | |

### ootd_photos — OOTD 사진 (Firebase Storage 연동)
| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| id | PK | |
| user_id | FK → users | |
| photo_type | enum | DAILY / DATE / ME |
| storage_path | string | `ootd/{userId}/{type}/...` |
| image_url | string | download URL |
| uploaded_at | timestamp | |

### style_profiles — AI 스타일 분석 결과
| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| id | PK | |
| user_id | FK → users | |
| mood_title | string | 예: 미니멀 시티보이 |
| mood_score | float | 예: 8.3 |
| warmth_temp | float | 꾸밈 온도 °C |
| ai_comment | text | AI 코멘트 |
| created_at | timestamp | |

### style_keywords — 스타일 키워드 (#미니멀 #모던 ...)
| id PK | style_profile_id FK | keyword string |

### color_palette — 컬러 팔레트
| id PK | style_profile_id FK | hex_code string | sort_order int |

### date_moods — 데이트 무드 (전시/카페/공연/와인바)
| id PK | style_profile_id FK | mood string | selected bool |

### matches — 매칭
| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| id | PK | |
| user_a_id | FK → users | |
| user_b_id | FK → users | |
| sync_score | int | 스타일 싱크 % (예: 84) |
| status | enum | PENDING / MATCHED / PASSED |
| created_at | timestamp | |

### chemistry_reports — 케미 리포트
| 컬럼 | 타입 | 비고 |
| --- | --- | --- |
| id | PK | |
| match_id | FK → matches | |
| style_score | int | 스타일 |
| decoration_score | int | 꾸밈 |
| mood_score | int | 무드 |
| complement_score | int | 보완 |
| created_at | timestamp | |

### report_points — 리포트 포인트 (잘 맞는/주의)
| id PK | report_id FK | point_type enum(MATCH/WARNING) | content text |

### chat_rooms — 채팅방
| id PK | match_id FK | created_at timestamp |

### messages — 메시지
| id PK | chat_room_id FK | sender_id FK→users | content text | sent_at timestamp |

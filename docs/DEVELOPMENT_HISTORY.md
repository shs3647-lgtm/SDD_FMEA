# 📋 FMEA On-Premise 개발 히스토리

> **최종 업데이트**: 2026-01-05  
> **현재 버전**: 2.2.0

---

## 📅 2026-01-05

### v2.2.0 - 3L기능 스타일 줄무늬 표준화 + 2L기능 누락 버튼

**작업 내용**:
1. ✅ **3L기능 스타일 줄무늬**: 모든 워크시트 탭에 블록 단위 줄무늬 적용
2. ✅ **2L기능 누락 버튼**: 확정/누락/수정 3버튼 구조 완성
3. ✅ **코드프리즈**: 구조분석~원인분석 전체 탭 안정화

**줄무늬 규칙 (3L기능 스타일)**:
| 탭 | 구조열 | 기능열 | 고장열 |
|---|---|---|---|
| 1L기능 | `tIdx`(타입) | `funcCounter`(기능) | `rowIdx`(행) |
| 2L기능 | `pIdx`(공정) | `funcCounter`(기능) | `rowIdx`(행) |
| 고장영향 | `productIdx`(블록) | `funcIdx`(블록) | `rowIdx`(행) |

**TDD 검증 결과**:
- zebra-style-inline.spec.ts: ✅ PASS
- worksheet-complete.spec.ts: ✅ 21개 PASS

**커밋 해시**:
- `a1a4b51` feat(2L기능): 누락 버튼 추가
- `78474de` chore: 코드프리즈 날짜 업데이트 2026-01-05
- `f18355e` feat: 3L기능 스타일 줄무늬 표준화

---

## 📅 2026-01-03

### v2.1.0 - DB 스키마 문서화

**작업 내용**:
1. ✅ DB 스키마 텍스트 문서 생성 (`docs/DB_SCHEMA.md`)
2. ✅ Mermaid ERD 다이어그램 생성 (`docs/DB_SCHEMA_ERD.md`)
3. ✅ Mermaid 순수 코드 버전 생성 (`docs/DB_SCHEMA_ERD_PURE.md`)
4. ✅ 샘플 레코드 문서 생성 (`docs/DB_SAMPLE_RECORDS.md`)
5. ✅ 루트 URL을 Welcome Board로 변경

**생성된 문서**:
- `docs/DB_SCHEMA.md` - 438줄, 테이블 정의 + FK 관계
- `docs/DB_SCHEMA_ERD.md` - 551줄, Mermaid 다이어그램
- `docs/DB_SCHEMA_ERD_PURE.md` - Mermaid Live Editor용
- `docs/DB_SAMPLE_RECORDS.md` - 272줄, 16개 테이블 샘플 레코드

**기술적 세부사항**:
- 현재 DB: 브라우저 localStorage (JSON)
- 스키마 정의: TypeScript 인터페이스
- 향후: PostgreSQL 마이그레이션 예정

---

### v2.0.0 - Welcome Board 모듈화

**작업 내용**:
1. ✅ Welcome Board 컴포넌트 분리
2. ✅ AP Improvement 구조와 동일하게 모듈화
3. ✅ 타입/데이터/유틸리티 분리

**파일 구조**:
```
welcomeboard/
├── page.tsx (메인 페이지)
├── layout.tsx (레이아웃)
├── types.ts (타입 정의)
├── mock-data.ts (샘플 데이터)
├── utils.ts (유틸리티)
├── components/
│   ├── index.ts
│   ├── Header.tsx
│   ├── HeroSection.tsx
│   ├── ProjectStatsSection.tsx
│   ├── QuickLinksSection.tsx
│   └── APSummaryTable.tsx
└── ap-improvement/
    ├── page.tsx
    ├── APModal.tsx
    ├── types.ts
    ├── mock-data.ts
    └── utils.ts
```

---

## 📅 이전 버전

### v1.0.62 - PFMEA Worksheet Fix Reference
- PFMEA 워크시트 참조 오류 수정

### v1.0.34 - COUNT 표시 표준화
- 전체 화면 COUNT 표시 일관성 적용

---

## 🔒 백업 정책

| 항목 | 정책 |
|------|------|
| 온라인 Git | ❌ 사용 금지 |
| 로컬 Fork | ✅ C:\05_REFACTORING_FORK |
| 파일 백업 | ✅ robocopy 사용 |
| 태그 형식 | backup-YYYYMMDD-HHMM |

---

## 📁 관련 문서

- [DB_SCHEMA.md](./DB_SCHEMA.md) - 데이터베이스 스키마
- [DB_SCHEMA_ERD.md](./DB_SCHEMA_ERD.md) - ERD 다이어그램
- [DB_SAMPLE_RECORDS.md](./DB_SAMPLE_RECORDS.md) - 샘플 레코드






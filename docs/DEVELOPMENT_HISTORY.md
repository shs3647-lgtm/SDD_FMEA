# 📋 FMEA On-Premise 개발 히스토리

> **최종 업데이트**: 2026-01-03  
> **현재 버전**: 2.1.0

---

## 📅 2026-01-03 (금일)

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





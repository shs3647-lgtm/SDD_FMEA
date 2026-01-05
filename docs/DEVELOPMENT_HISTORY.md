# 📋 FMEA On-Premise 개발 히스토리

> **최종 업데이트**: 2026-01-06  
> **현재 버전**: 2.4.0

---

## 📅 2026-01-06

### v2.4.0 - 리스크평가/최적화 확정 기능 + DB 저장 완성

**핵심 변경사항**:

1. ✅ **FMEA ID 소문자 규칙 적용**
   - 생성 규칙: `pfm26-001` (소문자 + 연도2자리 + 시퀀스3자리)
   - 모든 샘플 데이터 ID 소문자로 변경
   - `formatFmeaId()` 함수 수정

2. ✅ **모든 분석 단계 확정 시 DB 저장 구현**
   - **구조분석 (2단계)**: `StructureTab.tsx` → `saveAtomicDB()` 호출
   - **기능분석 (3단계)**: `FunctionL1/L2/L3Tab.tsx` → `saveAtomicDB()` 호출
   - **고장분석 (4단계)**: `FailureL1/L2/L3Tab.tsx`, `FailureLinkTab.tsx` 기존 구현 확인
   - **리스크평가 (5단계)**: `RiskTabConfirmable.tsx` 신규 생성
   - **최적화 (6단계)**: `OptTabConfirmable.tsx` 신규 생성

3. ✅ **TabMenu 확정 버튼 추가**
   - 5단계확정 버튼 (고장연결 확정 후 표시)
   - 6단계확정 버튼 (리스크평가 확정 후 표시)
   - 확정 상태 색상 표시 (미확정: 노란색, 확정됨: 초록색 ✓)

4. ✅ **메인 저장 버튼 전체 저장**
   - TopMenuBar 저장 버튼 → `saveToLocalStorage()` + `saveAtomicDB()` 동시 호출
   - 저장 상태 표시: ⏳저장중 / 💾저장 / ✅저장됨

5. ✅ **Prisma 스키마 업데이트**
   - `Optimization` 모델에 `remarks` (비고) 필드 추가
   - `@types/pg` 패키지 추가

6. ✅ **빌드 에러 수정**
   - 임시 테스트 파일 삭제 (`check-db.ts`, `check-db-list.ts`)
   - Prisma 7.x `PrismaPg` 어댑터 적용
   - 타입 에러 수정

**생성된 파일**:
- `src/app/pfmea/worksheet/tabs/RiskTabConfirmable.tsx` - 리스크평가 확정 탭
- `src/app/pfmea/worksheet/tabs/OptTabConfirmable.tsx` - 최적화 확정 탭

**수정된 파일**:
- `src/app/pfmea/worksheet/tabs/index.ts` - export 추가
- `src/app/pfmea/worksheet/components/TabMenu.tsx` - 확정 버튼 추가
- `src/app/pfmea/worksheet/components/TabFullComponents.tsx` - 새 탭 연동
- `src/app/pfmea/worksheet/page.tsx` - 메인 저장 함수 수정
- `src/app/pfmea/worksheet/tabs/StructureTab.tsx` - DB 저장 추가
- `src/app/pfmea/worksheet/tabs/function/FunctionL1/L2/L3Tab.tsx` - DB 저장 추가
- `src/app/pfmea/worksheet/tabs/function/types.ts` - saveAtomicDB prop 추가
- `prisma/schema.prisma` - Optimization.remarks 추가
- `scripts/check-failure-links.ts` - Prisma 7.x 호환

**데이터 저장 흐름**:
```
사용자 입력 → localStorage (임시)
     ↓
각 단계 확정 버튼 클릭
     ↓
saveToLocalStorage() + saveAtomicDB()
     ↓
PostgreSQL DB (영구 저장)
  ├─ FmeaLegacyData (전체 JSON)
  ├─ FmeaConfirmedState (확정 상태)
  └─ 원자성 테이블들:
     ├─ l1/l2/l3_structures
     ├─ l1/l2/l3_functions
     ├─ failure_effects/modes/causes/links
     ├─ risk_analyses
     └─ optimizations
```

**FMEA 저장 규칙** (메모리 ID: 12967844):
- 파일명: FMEA ID로 저장 (예: `pfm26-001`)
- 저장 시점: 신규 프로젝트 생성 시 + 각 단계 확정 시
- ID 생성: `pfm` + 연도2자리 + `-` + 시퀀스3자리

---

## 📅 2026-01-05

### v2.3.0 - 원자성 DB 기반 전체화면 CASCADE 역전개 (AI 분석 기반)

**작업 내용**:
1. ✅ **프로젝트별 원자성 관계형 DB 구축**
   - L1Structure, L2Structure, L3Structure (구조분석)
   - L1Function, L2Function, L3Function (기능분석)
   - FailureEffect, FailureMode, FailureCause (고장분석)
   - FailureLink, RiskAnalysis, Optimization (연결/분석)

2. ✅ **전체화면 API** (`/api/fmea/all-view`)
   - JOIN으로 CASCADE 역전개
   - 고장연결 결과 → 기능분석 → 구조분석 역추적

3. ✅ **AllTabAtomic 컴포넌트**
   - 원자성 DB에서 직접 데이터 로드
   - 28열 FMEA 워크시트 렌더링

4. ✅ **AllTabRenderer 통합**
   - `fmeaId` + `useAtomicDB` prop 추가
   - 원자성 모드 / 레거시 모드 자동 전환

**아키텍처**:
```
AllTabRenderer
├─ fmeaId + useAtomicDB=true → AllTabAtomic (원자성 DB)
├─ failureLinks.length > 0   → AllTabWithLinks (state)
└─ 기타                      → AllTabBasic

/api/fmea/all-view
└─ FailureLink + JOIN (FM→L2Func→L2Struct, FE→L1Func,
                       FC→L3Func→L3Struct, Risk, Opt)
```

**AI 분석 가능성**:
- 공정별 고장 빈도 분석 (SQL GROUP BY)
- 유사 공정 고장 패턴 예측
- RPN 기반 위험도 학습
- 프로젝트간 Lessons Learned

**생성된 파일**:
- `src/app/api/fmea/all-view/route.ts` - 전체화면 API
- `src/app/pfmea/worksheet/tabs/all/AllTabAtomic.tsx` - 원자성 렌더러

---

## 📅 2026-01-04

### v2.2.0 - 줄무늬(Zebra) 표준화 완료

- `getZebraColors(idx)` 함수 표준화
- 모든 워크시트 탭에 일관된 색상 적용
- 문서화: `docs/ZEBRA_STRIPE_RULES.md`

---

## 🔒 코드프리즈 태그

- `codefreeze-20260106-risk-opt-confirm` - 리스크/최적화 확정 기능
- `codefreeze-20260105-all-tab-atomic` - 전체화면 원자성 DB
- `codefreeze-20260103-zebra-refactoring` - 줄무늬 표준화
- `codefreeze-20260103-multiselect` - 다중선택 저장 로직

---

## 📦 빌드 정보

- **빌드 성공**: 2026-01-06
- **빌드 시간**: ~12초
- **Next.js**: 15.x
- **Prisma**: 7.2.0
- **PostgreSQL 어댑터**: `@prisma/adapter-pg`

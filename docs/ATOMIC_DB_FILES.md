# 원자성 관계형 DB 파일 목록

> 작성일: 2025-12-29
> 버전: 1.0.0

## 생성된 파일 목록

### 1. 공유 스키마 (전체 시스템)

| 파일 경로 | 설명 | 라인 수 |
|-----------|------|---------|
| `src/lib/shared-schema.ts` | 공유 원자성 DB 스키마 | ~450 |

**포함 내용:**
- `APQPProject` - APQP 프로젝트 (최상위)
- `ProcessMaster` - 공정 마스터 (공유)
- `WorkElementMaster` - 작업요소 마스터
- `SpecialCharacteristic` - 특별특성 (공유)
- `SpecialCharUsage` - 특별특성 사용 추적
- `FMEAResult` - FMEA 결과 (공유)
- `ControlPlan` / `ControlPlanItem` - CP
- `ProcessFlowDiagram` / `PFDItem` - PFD
- `WorkStandard` / `WorkStandardItem` - WS
- `PreventiveMaintenance` / `PMItem` - PM
- `SharedDB` - 전체 공유 DB 구조
- 유틸리티 함수들

---

### 2. PFMEA 스키마

| 파일 경로 | 설명 | 라인 수 |
|-----------|------|---------|
| `src/app/pfmea/worksheet/schema.ts` | PFMEA 원자성 DB 스키마 | ~400 |

**포함 내용:**
- **구조분석 (2단계)**
  - `L1Structure` - 완제품 공정
  - `L2Structure` - 메인공정
  - `L3Structure` - 작업요소

- **기능분석 (3단계)**
  - `L1Function` - 완제품 기능/요구사항
  - `L2Function` - 메인공정 기능/제품특성
  - `L3Function` - 작업요소 기능/공정특성

- **고장분석 (4단계)**
  - `FailureEffect` - 고장영향 (FE)
  - `FailureMode` - 고장형태 (FM)
  - `FailureCause` - 고장원인 (FC)
  - `FailureLink` - 고장연결 (관계 테이블)

- **리스크분석/최적화 (5-6단계)**
  - `RiskAnalysis` - 리스크 분석
  - `Optimization` - 최적화

- **유틸리티**
  - `FMEAWorksheetDB` - 전체 DB 구조
  - `FlattenedRow` - 평탄화된 행
  - `getLinkedDataByFK()` - FK 기반 조회
  - `linkFunctionToStructure()` - 기능→구조 FK 연결
  - `linkFailureToFunction()` - 고장→기능 FK 연결
  - `flattenDB()` - DB 평탄화

---

### 3. 마이그레이션 유틸리티

| 파일 경로 | 설명 | 라인 수 |
|-----------|------|---------|
| `src/app/pfmea/worksheet/migration.ts` | 마이그레이션 유틸리티 | ~350 |

**포함 내용:**
- `migrateToAtomicDB()` - 기존 중첩 구조 → 원자성 DB 변환
- `convertToLegacyFormat()` - 원자성 DB → 레거시 형식 변환
- `loadWorksheetDB()` - localStorage에서 로드 (자동 마이그레이션)
- `saveWorksheetDB()` - localStorage에 저장
- `confirmFailureLink()` - 고장연결 확정

---

### 4. 상태 관리 Hook

| 파일 경로 | 설명 | 라인 수 |
|-----------|------|---------|
| `src/app/pfmea/worksheet/hooks/useWorksheetState.ts` | 상태 관리 Hook (수정) | ~500 |

**추가된 내용:**
- `atomicDB` - 원자성 DB 상태
- `flattenedRows` - 평탄화된 행 데이터 (FK 기반)
- `saveAtomicDB()` - 원자성 DB 저장 함수

---

### 5. 문서

| 파일 경로 | 설명 |
|-----------|------|
| `docs/ATOMIC_DB_ARCHITECTURE.md` | 아키텍처 설계 문서 (본 문서) |
| `docs/ATOMIC_DB_FILES.md` | 파일 목록 문서 (현재 파일) |

---

## 의존성 관계

```
shared-schema.ts (공유)
    │
    └──→ 각 모듈에서 import
         ├── CP 모듈
         ├── PFD 모듈
         ├── WS 모듈
         └── PM 모듈

schema.ts (PFMEA)
    │
    ├──→ migration.ts (마이그레이션)
    │        │
    │        └──→ useWorksheetState.ts (상태 관리)
    │                 │
    │                 └──→ page.tsx (UI)
    │
    └──→ constants.ts (레거시 호환)
```

---

## Import 예시

### 공유 스키마 사용

```typescript
import {
  SharedDB,
  SpecialCharacteristic,
  FMEAResult,
  addSpecialChar,
  registerSpecialCharUsage,
  getProcessRelatedData,
} from '@/lib/shared-schema';
```

### PFMEA 스키마 사용

```typescript
import {
  FMEAWorksheetDB,
  L1Structure,
  L2Structure,
  L3Structure,
  L1Function,
  L2Function,
  L3Function,
  FailureEffect,
  FailureMode,
  FailureCause,
  FailureLink,
  getLinkedDataByFK,
  linkFunctionToStructure,
  linkFailureToFunction,
} from '../schema';
```

### 마이그레이션 사용

```typescript
import {
  loadWorksheetDB,
  saveWorksheetDB,
  migrateToAtomicDB,
  convertToLegacyFormat,
  confirmFailureLink,
} from '../migration';
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2025-12-29 | 초기 작성 |


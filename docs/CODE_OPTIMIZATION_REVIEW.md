# 코드 최적화 검토 보고서

> 작성일: 2025-12-30  
> 검토 기준: 700행 ±100 (600~800행)  
> 검토 관점: 모듈화, 공용화, 표준화

## 1. 현재 상태 분석

### 1.1 파일 크기 현황

| 파일 | 라인 수 | 상태 | 우선순위 |
|------|---------|------|----------|
| `page.tsx` | **2,747줄** | ⚠️ 매우 큼 (3.9배) | 🔴 최우선 |
| `FailureLinkTab.tsx` | **1,102줄** | ⚠️ 큼 (1.6배) | 🟠 높음 |
| `schema.ts` | 997줄 | ⚠️ 큼 (1.4배) | 🟡 보통 |
| `migration.ts` | 675줄 | ✅ 허용 범위 | - |
| `excel-export.ts` | 672줄 | ✅ 허용 범위 | - |
| `useWorksheetState.ts` | 658줄 | ✅ 허용 범위 | - |
| `FunctionL3Tab.tsx` | 665줄 | ✅ 허용 범위 | - |

### 1.2 주요 문제점

#### 🔴 Critical: `page.tsx` (2,747줄)

**현재 구조:**
- 메인 페이지 컴포넌트
- `TabMenu` 컴포넌트 포함 (~200줄)
- `EvalTabRenderer` 컴포넌트 포함 (~600줄)
  - `eval-structure` 탭 렌더링 (~150줄)
  - `eval-function` 탭 렌더링 (~150줄)
  - `eval-failure` 탭 렌더링 (~150줄)
  - `all` 탭 렌더링 (~450줄)
  - `risk`, `opt` 탭 렌더링 (~200줄)
- 이벤트 핸들러 및 상태 관리 (~500줄)
- 기타 유틸리티 함수 (~300줄)

**중복 로직:**
1. `failureLinks` 그룹핑 로직이 4곳에서 반복:
   - `EvalTabRenderer`의 `eval-structure` (~100줄)
   - `EvalTabRenderer`의 `eval-function` (~100줄)
   - `EvalTabRenderer`의 `eval-failure` (~100줄)
   - `EvalTabRenderer`의 `all` (~150줄)
   - `FailureLinkTab`의 `result` 뷰 (~150줄)

2. 마지막 행 병합 로직이 2곳에서 반복:
   - `FailureLinkTab.tsx` (~80줄)
   - `page.tsx`의 `all` 탭 (~100줄)

3. 공정명별 그룹핑 로직이 2곳에서 반복:
   - `EvalTabRenderer` 내부 여러 곳
   - `all` 탭 렌더링

#### 🟠 High: `FailureLinkTab.tsx` (1,102줄)

**현재 구조:**
- 고장연결 다이어그램 뷰 (~400줄)
- 연결 결과 뷰 (~500줄)
- 상태 관리 및 이벤트 핸들러 (~200줄)

**모듈화 여지:**
- 다이어그램 뷰 컴포넌트 분리 가능
- 결과 테이블 컴포넌트 분리 가능
- 데이터 그룹핑 로직 분리 가능

## 2. 모듈화 제안

### 2.1 `page.tsx` 리팩토링 계획

#### Phase 1: 평가 탭 렌더러 분리 (우선순위: 🔴 최우선)

```
src/app/pfmea/worksheet/
├── tabs/
│   ├── eval/
│   │   ├── EvalStructureTab.tsx       (~200줄) - eval-structure 전용
│   │   ├── EvalFunctionTab.tsx        (~200줄) - eval-function 전용
│   │   ├── EvalFailureTab.tsx         (~200줄) - eval-failure 전용
│   │   ├── AllViewTab.tsx             (~500줄) - all 탭 전용 (기존 파일 재활용)
│   │   └── index.ts
│   └── ...
└── page.tsx                            (~800줄) - 메인 페이지만
```

**예상 효과:**
- `page.tsx`: 2,747줄 → ~800줄 (70% 감소)
- 각 평가 탭: 독립적으로 관리 가능
- 재사용성 향상

#### Phase 2: 공통 로직 추출 (우선순위: 🟠 높음)

```
src/app/pfmea/worksheet/
├── utils/
│   ├── failure-link-grouping.ts       (~150줄) - failureLinks 그룹핑 로직
│   ├── row-merge-logic.ts             (~100줄) - 마지막 행 병합 로직
│   ├── process-grouping.ts            (~80줄)  - 공정명별 그룹핑 로직
│   └── function-data-mapper.ts        (~100줄) - 기능분석 데이터 매핑
└── ...
```

**예상 효과:**
- 중복 코드 제거: ~400줄 감소
- 유지보수성 향상
- 테스트 용이성 향상

#### Phase 3: `TabMenu` 컴포넌트 분리 (우선순위: 🟡 보통)

```
src/app/pfmea/worksheet/
├── components/
│   ├── TabMenu.tsx                     (~200줄)
│   └── ...
└── ...
```

### 2.2 `FailureLinkTab.tsx` 리팩토링 계획

#### Phase 1: 뷰 컴포넌트 분리

```
src/app/pfmea/worksheet/tabs/failure/
├── FailureLinkTab.tsx                  (~400줄) - 메인 로직만
├── FailureLinkDiagram.tsx              (~300줄) - 다이어그램 뷰
├── FailureLinkResult.tsx               (~350줄) - 결과 테이블 뷰
└── ...
```

**예상 효과:**
- `FailureLinkTab.tsx`: 1,102줄 → ~400줄 (64% 감소)
- 각 뷰 컴포넌트 독립 테스트 가능

## 3. 공용화 및 표준화 제안

### 3.1 공통 유틸리티 함수

#### `failure-link-grouping.ts`
```typescript
// failureLinks를 FM별로 그룹핑
export function groupFailureLinksByFM(failureLinks: any[]): Map<string, FMGroup>

// 기능분석 데이터 매핑 포함 버전
export function groupFailureLinksWithFunctionData(
  failureLinks: any[], 
  state: WorksheetState
): Map<string, FMGroupWithFuncData>
```

#### `row-merge-logic.ts`
```typescript
// 마지막 행 병합 로직
export function calculateLastRowMerge(
  feCount: number, 
  fcCount: number, 
  maxRows: number
): { feRowSpan: number; fcRowSpan: number; showFe: boolean; showFc: boolean }
```

#### `process-grouping.ts`
```typescript
// 공정명별 그룹핑 (셀합치기용)
export function groupByProcessName(
  fmGroups: Map<string, FMGroup>
): Map<string, ProcessGroup>
```

### 3.2 표준화된 인터페이스

#### 타입 정의 표준화
```typescript
// tabs/shared/types.ts
export interface FMGroup {
  fmId: string;
  fmText: string;
  fmProcess: string;
  fes: FEItem[];
  fcs: FCItem[];
}

export interface ProcessGroup {
  processName: string;
  fmList: FMGroup[];
  startIdx: number;
}

export interface RowMergeConfig {
  feRowSpan: number;
  fcRowSpan: number;
  showFe: boolean;
  showFc: boolean;
}
```

## 4. 리팩토링 시 주의사항

### 4.1 현재 리팩토링 시 문제점

#### ⚠️ `all` 탭의 복잡성
- 현재 `all` 탭은 40개 컬럼을 모두 렌더링하는 매우 복잡한 로직
- 마지막 행 병합 로직이 복잡하게 얽혀있음
- 급격한 리팩토링 시 버그 발생 가능성 높음

**권장 사항:**
- `all` 탭은 마지막에 리팩토링
- 먼저 `eval-structure`, `eval-function`, `eval-failure` 탭부터 분리
- 공통 로직 추출 후 `all` 탭에 적용

#### ⚠️ 상태 관리 복잡성
- `useWorksheetState` Hook과 긴밀하게 결합
- 상태 업데이트 로직이 여러 곳에 분산
- 리팩토링 시 상태 동기화 문제 가능

**권장 사항:**
- 상태 관리 로직은 그대로 유지
- 뷰 렌더링 로직만 분리
- Props로 필요한 상태만 전달

#### ⚠️ 테스트 커버리지
- 현재 통합 테스트 부족
- 리팩토링 후 회귀 테스트 필요

**권장 사항:**
- 단계별 리팩토링
- 각 단계마다 수동 테스트
- 주요 기능 검증 후 다음 단계 진행

### 4.2 고장연결/역전개 모듈화 시 문제점

#### 문제점 1: 데이터 흐름 복잡성
- `failureLinks` 데이터가 여러 컴포넌트 간에 공유
- 역전개 로직이 `useWorksheetState`와 결합
- 모듈화 시 Props drilling 문제 가능

**해결 방안:**
- Context API 또는 Zustand 같은 상태 관리 라이브러리 고려
- 또는 유틸리티 함수로 로직만 추출 (상태는 기존 방식 유지)

#### 문제점 2: 성능 이슈
- `all` 탭 렌더링 시 대량의 데이터 처리
- 그룹핑 로직이 렌더링마다 실행
- 모듈화 시 불필요한 재계산 가능

**해결 방안:**
- `useMemo`로 그룹핑 결과 캐싱
- 메모이제이션된 유틸리티 함수 사용

#### 문제점 3: 타입 안정성
- 현재 많은 `any` 타입 사용
- 모듈화 시 타입 정의 필요
- 타입 불일치로 인한 런타임 에러 가능

**해결 방안:**
- 단계별로 타입 정의 추가
- TypeScript strict mode 점진적 적용

## 5. 권장 리팩토링 순서

### Step 1: 공통 유틸리티 함수 추출 (위험도: 🟢 낮음)
1. `failure-link-grouping.ts` 생성
2. `row-merge-logic.ts` 생성
3. `process-grouping.ts` 생성
4. 기존 코드에서 점진적으로 교체

**예상 소요 시간:** 2-3시간  
**예상 효과:** 중복 코드 200-300줄 감소

### Step 2: 평가 탭 컴포넌트 분리 (위험도: 🟡 보통)
1. `EvalStructureTab.tsx` 생성 및 분리
2. `EvalFunctionTab.tsx` 생성 및 분리
3. `EvalFailureTab.tsx` 생성 및 분리
4. `page.tsx`에서 `EvalTabRenderer` 제거

**예상 소요 시간:** 4-6시간  
**예상 효과:** `page.tsx` 1,500-1,800줄 감소

### Step 3: `all` 탭 리팩토링 (위험도: 🔴 높음)
1. `AllViewTab.tsx` 확장 및 개선
2. 공통 유틸리티 함수 적용
3. `page.tsx`에서 `all` 탭 로직 제거

**예상 소요 시간:** 6-8시간  
**예상 효과:** `page.tsx` 400-500줄 감소

### Step 4: `FailureLinkTab` 분리 (위험도: 🟡 보통)
1. `FailureLinkDiagram.tsx` 생성
2. `FailureLinkResult.tsx` 생성
3. `FailureLinkTab.tsx` 간소화

**예상 소요 시간:** 3-4시간  
**예상 효과:** `FailureLinkTab.tsx` 700줄 감소

## 6. 최종 목표

| 파일 | 현재 | 목표 | 감소율 |
|------|------|------|--------|
| `page.tsx` | 2,747줄 | ~700줄 | 74% |
| `FailureLinkTab.tsx` | 1,102줄 | ~400줄 | 64% |
| `schema.ts` | 997줄 | ~800줄 | 20% (타입 정의 추가) |

**총 감소:** ~1,750줄  
**신규 파일:** ~10개 (유틸리티 + 컴포넌트)  
**평균 파일 크기:** ~400줄 (목표 범위 내)

## 7. 결론

### 현재 상태: ⚠️ 리팩토링 필요

- `page.tsx`는 기준(700±100)을 3.9배 초과
- 중복 코드가 상당량 존재
- 모듈화를 통해 유지보수성 향상 가능

### 권장 조치

1. **즉시 시작 가능:** 공통 유틸리티 함수 추출 (Step 1)
2. **신중한 접근 필요:** 평가 탭 분리 (Step 2-3)
3. **점진적 진행:** 각 단계마다 테스트 및 검증

### 리스크 관리

- 단계별 리팩토링으로 위험 최소화
- 각 단계마다 커밋 및 테스트
- 주요 기능 회귀 테스트 필수




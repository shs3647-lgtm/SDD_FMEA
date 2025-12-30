# 리팩토링 마스터 플랜 v2.0

> 작성일: 2025-12-30  
> 최종 업데이트: 2025-12-30  
> 목표: 코드 모듈화, 공용화, 표준화를 통한 유지보수성 향상  
> 기준: 파일당 700±100줄 (600~800줄)  
> **중요**: 향후 기능 확장(역전개, TOP RPN, REVERSE FMEA, FMEA4판 등) 고려

## 📊 현재 상태

| 파일 | 현재 | 목표 | 감소율 |
|------|------|------|--------|
| `page.tsx` | 2,747줄 | ~700줄 | 74% |
| `FailureLinkTab.tsx` | 1,102줄 | ~400줄 | 64% |
| `schema.ts` | 997줄 | ~800줄 | 20% |

**총 목표 감소:** ~1,750줄  
**신규 파일 예상:** ~20개 (확장 기능 포함)

## 🎯 전체 목표

1. **모듈화**: 대형 파일을 논리적 단위로 분리
2. **공용화**: 중복 코드를 공통 유틸리티로 추출
3. **표준화**: 일관된 구조와 인터페이스 적용
4. **확장성**: 향후 기능 추가를 고려한 플러그인 구조
5. **유지보수성 향상**: 코드 가독성 및 테스트 용이성 개선

## 🔮 향후 확장 기능 (확정/예정)

### 확정된 기능
- ✅ **역전개 (Reverse FMEA)**: 고장분석 → 기능분석 역변환
- ✅ **고장연결**: 현재 구현 완료

### 예정된 기능
- 📋 **TOP RPN**: RPN 상위 항목 대시보드
- 📋 **REVERSE FMEA**: 추가 역전개 기능
- 📋 **FMEA4판**: 새로운 표준 버전 지원
- 📋 **기타 메뉴**: 지속적 추가 예상

## 🏗️ 확장 가능한 아키텍처 설계

### 메뉴 구조 확장성

```
src/app/pfmea/worksheet/
├── tabs/
│   ├── analysis/              # 분석 탭 그룹 (기존)
│   │   ├── structure/
│   │   ├── function/
│   │   └── failure/
│   ├── evaluation/            # 평가 탭 그룹 (기존)
│   │   ├── eval-structure/
│   │   ├── eval-function/
│   │   ├── eval-failure/
│   │   ├── risk/
│   │   └── optimization/
│   ├── extended/              # 확장 탭 그룹 (신규)
│   │   ├── reverse/           # 역전개 관련
│   │   │   ├── ReverseFMEATab.tsx
│   │   │   └── ReverseGenerationTab.tsx
│   │   ├── dashboard/         # 대시보드 관련
│   │   │   ├── TopRPNTab.tsx
│   │   │   └── AnalysisDashboardTab.tsx
│   │   └── version/           # 버전별 (FMEA4판 등)
│   │       └── FMEA4Tab.tsx
│   └── shared/                # 공용 컴포넌트
└── ...
```

### 탭 등록 시스템 (플러그인 방식)

```typescript
// tabs/registry.ts
export interface TabDefinition {
  id: string;
  label: string;
  category: 'analysis' | 'evaluation' | 'extended';
  component: React.ComponentType<any>;
  enabled?: (state: WorksheetState) => boolean;
  order?: number;
}

export const TAB_REGISTRY: TabDefinition[] = [
  // 분석 탭
  { id: 'structure', category: 'analysis', component: StructureTab, ... },
  { id: 'function-l1', category: 'analysis', component: FunctionL1Tab, ... },
  // 평가 탭
  { id: 'eval-structure', category: 'evaluation', component: EvalStructureTab, ... },
  // 확장 탭
  { id: 'reverse-fmea', category: 'extended', component: ReverseFMEATab, ... },
  { id: 'top-rpn', category: 'extended', component: TopRPNTab, ... },
];
```

## 📋 단계별 계획 (확장성 고려)

### ✅ Step 0: 준비 단계 (완료)

- [x] 코드 최적화 검토 보고서 작성
- [x] 리팩토링 마스터 플랜 작성
- [x] 현재 코드베이스 분석
- [x] 향후 확장 기능 분석 및 아키텍처 설계

---

### 🔵 Step 1: 공통 유틸리티 함수 추출

**목표**: 중복 로직을 재사용 가능한 유틸리티 함수로 추출

**예상 소요 시간**: 2-3시간  
**위험도**: 🟢 낮음  
**예상 효과**: 중복 코드 200-300줄 감소

#### 작업 내용

1. **`utils/failure-link-grouping.ts` 생성**
   - `groupFailureLinksByFM()`: failureLinks를 FM별로 그룹핑
   - `groupFailureLinksWithFunctionData()`: 기능분석 데이터 매핑 포함 버전
   - 타입 정의: `FMGroup`, `FEItem`, `FCItem`

2. **`utils/row-merge-logic.ts` 생성**
   - `calculateLastRowMerge()`: 마지막 행 병합 계산
   - 타입 정의: `RowMergeConfig`

3. **`utils/process-grouping.ts` 생성**
   - `groupByProcessName()`: 공정명별 그룹핑 (셀합치기용)
   - 타입 정의: `ProcessGroup`

4. **`utils/reverse-generation.ts` 생성** (확장 고려)
   - `reverseGenerateFunctionFromFailure()`: 고장분석 → 기능분석 역변환
   - 향후 역전개 탭에서 재사용

5. **기존 코드 점진적 교체**
   - `page.tsx`의 `EvalTabRenderer` 내부 로직 교체
   - `FailureLinkTab.tsx`의 그룹핑 로직 교체

#### 체크리스트

- [ ] `utils/` 디렉토리 생성
- [ ] `failure-link-grouping.ts` 작성 및 테스트
- [ ] `row-merge-logic.ts` 작성 및 테스트
- [ ] `process-grouping.ts` 작성 및 테스트
- [ ] `reverse-generation.ts` 작성 (확장 고려)
- [ ] `page.tsx`에서 유틸리티 함수 사용으로 교체
- [ ] `FailureLinkTab.tsx`에서 유틸리티 함수 사용으로 교체
- [ ] 수동 테스트: 전체보기 화면 정상 동작 확인
- [ ] 수동 테스트: 고장연결 화면 정상 동작 확인
- [ ] 커밋: "refactor: Step 1 - 공통 유틸리티 함수 추출"

---

### 🟡 Step 2: 평가 탭 컴포넌트 분리 (Part 1)

**목표**: `EvalTabRenderer`의 `eval-structure`, `eval-function`, `eval-failure` 탭을 독립 컴포넌트로 분리

**예상 소요 시간**: 4-6시간  
**위험도**: 🟡 보통  
**예상 효과**: `page.tsx` 1,000-1,200줄 감소

#### 작업 내용

1. **`tabs/evaluation/` 디렉토리 생성**

2. **`EvalStructureTab.tsx` 생성**
   - `eval-structure` 탭 렌더링 로직 분리
   - Props: `failureLinks`, `state`, `rows`
   - 공통 유틸리티 함수 활용

3. **`EvalFunctionTab.tsx` 생성**
   - `eval-function` 탭 렌더링 로직 분리
   - Props: `failureLinks`, `state`, `rows`
   - 기능분석 데이터 매핑 로직 포함

4. **`EvalFailureTab.tsx` 생성**
   - `eval-failure` 탭 렌더링 로직 분리
   - Props: `failureLinks`, `state`, `rows`
   - 고장분석 데이터 표시 로직 포함

5. **`tabs/evaluation/index.ts` 생성**
   - 컴포넌트 export

6. **`page.tsx` 수정**
   - `EvalTabRenderer` 내부의 조건문을 컴포넌트 분기로 변경
   - 각 탭 컴포넌트 import 및 사용

#### 체크리스트

- [ ] `tabs/evaluation/` 디렉토리 생성
- [ ] `EvalStructureTab.tsx` 작성
- [ ] `EvalFunctionTab.tsx` 작성
- [ ] `EvalFailureTab.tsx` 작성
- [ ] `tabs/evaluation/index.ts` 작성
- [ ] `page.tsx`에서 컴포넌트 분리 적용
- [ ] 수동 테스트: eval-structure 탭 정상 동작
- [ ] 수동 테스트: eval-function 탭 정상 동작
- [ ] 수동 테스트: eval-failure 탭 정상 동작
- [ ] 커밋: "refactor: Step 2 - 평가 탭 컴포넌트 분리 (Part 1)"

---

### 🟡 Step 3: `all` 탭 리팩토링

**목표**: `all` 탭 로직을 `AllViewTab.tsx`로 이동 및 개선

**예상 소요 시간**: 6-8시간  
**위험도**: 🔴 높음 (복잡한 로직)  
**예상 효과**: `page.tsx` 400-500줄 감소

#### 작업 내용

1. **`AllViewTab.tsx` 확장**
   - 기존 파일 재활용 (현재 214줄)
   - `all` 탭 렌더링 로직 모두 이동
   - 공통 유틸리티 함수 활용
   - 마지막 행 병합 로직 적용

2. **`page.tsx` 정리**
   - `EvalTabRenderer`에서 `all` 탭 로직 제거
   - `AllViewTab` 컴포넌트 import 및 사용

3. **타입 정의 정리**
   - `all` 탭 관련 타입을 `tabs/shared/types.ts`로 이동

#### 체크리스트

- [ ] `AllViewTab.tsx` 확장 (기존 로직 이동)
- [ ] 공통 유틸리티 함수 적용
- [ ] 타입 정의 정리
- [ ] `page.tsx`에서 `all` 탭 로직 제거
- [ ] 수동 테스트: all 탭 전체 기능 정상 동작
- [ ] 수동 테스트: 40개 컬럼 정상 표시
- [ ] 수동 테스트: 셀합치기 정상 동작
- [ ] 수동 테스트: 마지막 행 병합 정상 동작
- [ ] 수동 테스트: Excel 내보내기 정상 동작
- [ ] 커밋: "refactor: Step 3 - all 탭 리팩토링 완료"

---

### 🟡 Step 4: `FailureLinkTab` 컴포넌트 분리

**목표**: `FailureLinkTab.tsx`를 다이어그램과 결과 테이블로 분리

**예상 소요 시간**: 3-4시간  
**위험도**: 🟡 보통  
**예상 효과**: `FailureLinkTab.tsx` 700줄 감소

#### 작업 내용

1. **`FailureLinkDiagram.tsx` 생성**
   - 다이어그램 뷰 로직 분리
   - Props: `savedLinks`, `fmData`, `feData`, `fcData`, `onSelectFM`, `onToggleFE`, `onToggleFC`
   - SVG 그리기 로직 포함

2. **`FailureLinkResult.tsx` 생성**
   - 결과 테이블 뷰 로직 분리
   - Props: `savedLinks`, `fmData`, `feData`, `fcData`
   - 공통 유틸리티 함수 활용

3. **`FailureLinkTab.tsx` 간소화**
   - 상태 관리 및 이벤트 핸들러만 유지
   - 분리된 컴포넌트 조합

#### 체크리스트

- [ ] `FailureLinkDiagram.tsx` 작성
- [ ] `FailureLinkResult.tsx` 작성
- [ ] `FailureLinkTab.tsx` 간소화
- [ ] 수동 테스트: 고장사슬 다이어그램 정상 동작
- [ ] 수동 테스트: 분석결과 테이블 정상 동작
- [ ] 수동 테스트: 연결/해제 기능 정상 동작
- [ ] 수동 테스트: 연결확정 기능 정상 동작
- [ ] 커밋: "refactor: Step 4 - FailureLinkTab 컴포넌트 분리"

---

### 🟢 Step 5: `TabMenu` 컴포넌트 분리 및 탭 등록 시스템 구축

**목표**: `TabMenu` 컴포넌트 분리 및 확장 가능한 탭 등록 시스템 구축

**예상 소요 시간**: 3-4시간  
**위험도**: 🟢 낮음  
**예상 효과**: `page.tsx` 200줄 감소 + 확장성 확보

#### 작업 내용

1. **`components/TabMenu.tsx` 생성**
   - `TabMenu` 컴포넌트 이동
   - Props 타입 정의

2. **`tabs/registry.ts` 생성** (확장성 고려)
   - 탭 정의 인터페이스: `TabDefinition`
   - 탭 등록 시스템: `TAB_REGISTRY`
   - 탭 활성화 조건 함수 지원

3. **`page.tsx` 정리**
   - `TabMenu` 컴포넌트 제거
   - 탭 등록 시스템 사용

4. **향후 확장 준비**
   - 역전개 탭, TOP RPN 탭 등 추가 시 `registry.ts`에만 등록
   - `page.tsx` 수정 불필요

#### 체크리스트

- [ ] `components/TabMenu.tsx` 생성
- [ ] `tabs/registry.ts` 생성 (탭 등록 시스템)
- [ ] 기존 탭들을 `TAB_REGISTRY`에 등록
- [ ] `page.tsx`에서 `TabMenu` 제거 및 registry 사용
- [ ] 수동 테스트: 탭 메뉴 정상 동작
- [ ] 수동 테스트: 탭 전환 정상 동작
- [ ] 수동 테스트: 탭 활성화 조건 정상 동작
- [ ] 커밋: "refactor: Step 5 - TabMenu 분리 및 탭 등록 시스템 구축"

---

### 🟢 Step 6: 역전개 탭 분리 및 확장 구조 준비

**목표**: 역전개 관련 로직을 별도 탭으로 분리하고 확장 구조 준비

**예상 소요 시간**: 2-3시간  
**위험도**: 🟢 낮음  
**예상 효과**: 확장성 확보 + 코드 정리

#### 작업 내용

1. **`tabs/extended/reverse/` 디렉토리 생성**

2. **`ReverseFMEATab.tsx` 생성** (향후 확장용)
   - 역전개 메인 탭
   - 현재는 플레이스홀더 또는 기존 역전개 로직 이동

3. **`ReverseGenerationTab.tsx` 생성** (필요 시)
   - 역전개 생성 로직
   - `utils/reverse-generation.ts` 활용

4. **탭 등록 시스템에 추가**
   - `tabs/registry.ts`에 역전개 탭 등록

#### 체크리스트

- [ ] `tabs/extended/reverse/` 디렉토리 생성
- [ ] `ReverseFMEATab.tsx` 작성
- [ ] 기존 역전개 로직 이동 (있는 경우)
- [ ] `tabs/registry.ts`에 등록
- [ ] 수동 테스트: 역전개 탭 정상 동작
- [ ] 커밋: "refactor: Step 6 - 역전개 탭 분리"

---

### 🟢 Step 7: 타입 정의 표준화

**목표**: 타입 정의를 표준화하고 `any` 타입 제거

**예상 소요 시간**: 2-3시간  
**위험도**: 🟢 낮음  
**예상 효과**: 타입 안정성 향상

#### 작업 내용

1. **`tabs/shared/types.ts` 확장**
   - `FMGroup`, `ProcessGroup`, `RowMergeConfig` 등 추가
   - 공통 타입 정의 통합
   - 확장 탭용 타입 정의 추가

2. **타입 적용**
   - 유틸리티 함수에 타입 적용
   - 컴포넌트 Props 타입 정의
   - `any` 타입 제거

#### 체크리스트

- [ ] `tabs/shared/types.ts` 확장
- [ ] 유틸리티 함수 타입 적용
- [ ] 컴포넌트 Props 타입 정의
- [ ] `any` 타입 점진적 제거
- [ ] TypeScript 컴파일 오류 해결
- [ ] 커밋: "refactor: Step 7 - 타입 정의 표준화"

---

## 📈 진행 상황 추적

| Step | 상태 | 시작일 | 완료일 | 소요 시간 | 비고 |
|------|------|--------|--------|-----------|------|
| Step 0 | ✅ 완료 | 2025-12-30 | 2025-12-30 | - | 준비 단계 |
| Step 1 | ⏳ 진행 예정 | - | - | - | 공통 유틸리티 함수 추출 |
| Step 2 | ⏸️ 대기 | - | - | - | 평가 탭 컴포넌트 분리 (Part 1) |
| Step 3 | ⏸️ 대기 | - | - | - | all 탭 리팩토링 |
| Step 4 | ⏸️ 대기 | - | - | - | FailureLinkTab 분리 |
| Step 5 | ⏸️ 대기 | - | - | - | TabMenu 분리 및 탭 등록 시스템 |
| Step 6 | ⏸️ 대기 | - | - | - | 역전개 탭 분리 |
| Step 7 | ⏸️ 대기 | - | - | - | 타입 정의 표준화 |

**범례**: ✅ 완료 | ⏳ 진행중 | ⏸️ 대기 | 🔴 차단

---

## 🔮 향후 확장 가이드

### 새 탭 추가 방법 (Step 5 이후)

1. **새 탭 컴포넌트 작성**
   ```typescript
   // tabs/extended/dashboard/TopRPNTab.tsx
   export default function TopRPNTab({ state, ...props }) {
     // 탭 로직
   }
   ```

2. **탭 등록 시스템에 추가**
   ```typescript
   // tabs/registry.ts
   import TopRPNTab from './extended/dashboard/TopRPNTab';
   
   export const TAB_REGISTRY: TabDefinition[] = [
     // ... 기존 탭들
     {
       id: 'top-rpn',
       label: 'TOP RPN',
       category: 'extended',
       component: TopRPNTab,
       enabled: (state) => state.failureLinks?.length > 0,
       order: 100,
     },
   ];
   ```

3. **끝!** `page.tsx` 수정 불필요

### 새 유틸리티 함수 추가

1. **`utils/` 디렉토리에 새 파일 생성**
2. **타입 정의는 `tabs/shared/types.ts`에 추가**
3. **컴포넌트에서 import 및 사용**

---

## ⚠️ 위험 관리

### 주요 위험 요소

1. **데이터 흐름 복잡성**
   - 위험: Props drilling으로 인한 복잡도 증가
   - 완화: 유틸리티 함수로 로직만 추출, 상태는 기존 방식 유지

2. **성능 이슈**
   - 위험: 리팩토링 후 불필요한 재렌더링
   - 완화: `useMemo`로 그룹핑 결과 캐싱

3. **회귀 버그**
   - 위험: 리팩토링 과정에서 기존 기능 손상
   - 완화: 각 단계마다 수동 테스트 수행, 단계별 커밋

4. **타입 안정성**
   - 위험: 타입 정의 변경으로 인한 런타임 에러
   - 완화: 점진적 타입 적용, TypeScript 컴파일 검증

5. **확장성 저하** (신규)
   - 위험: 새 기능 추가 시 기존 구조 깨짐
   - 완화: 탭 등록 시스템으로 확장성 확보

### 롤백 계획

- 각 Step 완료 후 커밋 및 태그 생성
- 문제 발생 시 이전 Step으로 롤백
- 주요 변경사항은 별도 브랜치에서 작업 (선택사항)

---

## 🧪 테스트 전략

### 각 Step 완료 시 검증 항목

#### 공통 검증
- [ ] 빌드 성공 (`npm run build`)
- [ ] TypeScript 컴파일 오류 없음
- [ ] Linter 오류 없음 (선택사항)

#### 기능 검증
- [ ] 전체보기 화면 정상 동작
- [ ] 고장연결 화면 정상 동작
- [ ] 평가 탭들 정상 동작
- [ ] Excel 내보내기 정상 동작
- [ ] 데이터 저장/로드 정상 동작
- [ ] 탭 전환 정상 동작 (확장 기능 포함)

#### 시각적 검증
- [ ] 셀합치기 정상 표시
- [ ] 마지막 행 병합 정상 표시
- [ ] 레이아웃 깨짐 없음
- [ ] 색상 및 스타일 정상 적용

---

## 📝 커밋 전략

### 커밋 메시지 형식
```
refactor: Step [번호] - [간단한 설명]

- 상세 변경 내용 1
- 상세 변경 내용 2
```

### 예시
```
refactor: Step 1 - 공통 유틸리티 함수 추출

- failure-link-grouping.ts 생성 및 적용
- row-merge-logic.ts 생성 및 적용
- process-grouping.ts 생성 및 적용
- reverse-generation.ts 생성 (확장 고려)
- page.tsx, FailureLinkTab.tsx에서 중복 코드 제거
```

### 태그 전략
- 각 Step 완료 후 태그 생성 (선택사항)
- 주요 마일스톤: `refactor-step-1`, `refactor-step-2`, etc.

---

## 📚 참고 문서

- [코드 최적화 검토 보고서](./CODE_OPTIMIZATION_REVIEW.md)
- [모듈화 교훈](./MODULARIZATION_LESSONS_LEARNED.md)
- [원자성 DB 아키텍처](./ATOMIC_DB_ARCHITECTURE.md)
- [코드 인덱스](../CODE_INDEX.md) (있는 경우)

---

## 🎯 최종 목표 달성 기준

### 정량적 목표
- [ ] `page.tsx` 2,747줄 → 700줄 이하 (74% 감소)
- [ ] `FailureLinkTab.tsx` 1,102줄 → 400줄 이하 (64% 감소)
- [ ] 모든 파일 800줄 이하
- [ ] 새 탭 추가 시 `page.tsx` 수정 불필요 (탭 등록 시스템)

### 정성적 목표
- [ ] 중복 코드 제거 완료
- [ ] 컴포넌트 재사용성 향상
- [ ] 타입 안정성 향상
- [ ] 테스트 용이성 향상
- [ ] 코드 가독성 향상
- [ ] **확장성 확보**: 새 기능 추가 시 기존 구조 깨지지 않음

---

**마지막 업데이트**: 2025-12-30  
**다음 단계**: Step 1 시작

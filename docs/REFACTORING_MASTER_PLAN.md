# 리팩토링 마스터 플랜

> 작성일: 2025-12-30  
> 목표: 코드 모듈화, 공용화, 표준화를 통한 유지보수성 향상  
> 기준: 파일당 700±100줄 (600~800줄)

## 📊 현재 상태

| 파일 | 현재 | 목표 | 감소율 |
|------|------|------|--------|
| `page.tsx` | 2,747줄 | ~700줄 | 74% |
| `FailureLinkTab.tsx` | 1,102줄 | ~400줄 | 64% |
| `schema.ts` | 997줄 | ~800줄 | 20% |

**총 목표 감소:** ~1,750줄  
**신규 파일 예상:** ~15개

## 🎯 전체 목표

1. **모듈화**: 대형 파일을 논리적 단위로 분리
2. **공용화**: 중복 코드를 공통 유틸리티로 추출
3. **표준화**: 일관된 구조와 인터페이스 적용
4. **유지보수성 향상**: 코드 가독성 및 테스트 용이성 개선

---

## 📋 단계별 계획

### ✅ Step 0: 준비 단계 (완료)

- [x] 코드 최적화 검토 보고서 작성
- [x] 리팩토링 마스터 플랜 작성
- [x] 현재 코드베이스 분석

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

4. **기존 코드 점진적 교체**
   - `page.tsx`의 `EvalTabRenderer` 내부 로직 교체
   - `FailureLinkTab.tsx`의 그룹핑 로직 교체

#### 체크리스트

- [ ] `utils/` 디렉토리 생성
- [ ] `failure-link-grouping.ts` 작성 및 테스트
- [ ] `row-merge-logic.ts` 작성 및 테스트
- [ ] `process-grouping.ts` 작성 및 테스트
- [ ] `page.tsx`에서 유틸리티 함수 사용으로 교체
- [ ] `FailureLinkTab.tsx`에서 유틸리티 함수 사용으로 교체
- [ ] 수동 테스트: 전체보기 화면 정상 동작 확인
- [ ] 수동 테스트: 고장연결 화면 정상 동작 확인
- [ ] 커밋: "refactor: 공통 유틸리티 함수 추출"

---

### 🟡 Step 2: 평가 탭 컴포넌트 분리 (Part 1)

**목표**: `EvalTabRenderer`의 `eval-structure`, `eval-function`, `eval-failure` 탭을 독립 컴포넌트로 분리

**예상 소요 시간**: 4-6시간  
**위험도**: 🟡 보통  
**예상 효과**: `page.tsx` 1,000-1,200줄 감소

#### 작업 내용

1. **`tabs/eval/` 디렉토리 생성**

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

5. **`tabs/eval/index.ts` 생성**
   - 컴포넌트 export

6. **`page.tsx` 수정**
   - `EvalTabRenderer` 내부의 조건문을 컴포넌트 분기로 변경
   - 각 탭 컴포넌트 import 및 사용

#### 체크리스트

- [ ] `tabs/eval/` 디렉토리 생성
- [ ] `EvalStructureTab.tsx` 작성
- [ ] `EvalFunctionTab.tsx` 작성
- [ ] `EvalFailureTab.tsx` 작성
- [ ] `tabs/eval/index.ts` 작성
- [ ] `page.tsx`에서 컴포넌트 분리 적용
- [ ] 수동 테스트: eval-structure 탭 정상 동작
- [ ] 수동 테스트: eval-function 탭 정상 동작
- [ ] 수동 테스트: eval-failure 탭 정상 동작
- [ ] 커밋: "refactor: 평가 탭 컴포넌트 분리 (Part 1)"

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
- [ ] 커밋: "refactor: all 탭 리팩토링 완료"

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
- [ ] 커밋: "refactor: FailureLinkTab 컴포넌트 분리"

---

### 🟢 Step 5: `TabMenu` 컴포넌트 분리

**목표**: `TabMenu` 컴포넌트를 독립 파일로 분리

**예상 소요 시간**: 1-2시간  
**위험도**: 🟢 낮음  
**예상 효과**: `page.tsx` 200줄 감소

#### 작업 내용

1. **`components/TabMenu.tsx` 생성**
   - `TabMenu` 컴포넌트 이동
   - Props 타입 정의

2. **`page.tsx` 정리**
   - `TabMenu` 컴포넌트 제거
   - import 및 사용

#### 체크리스트

- [ ] `components/TabMenu.tsx` 생성
- [ ] `page.tsx`에서 `TabMenu` 제거
- [ ] 수동 테스트: 탭 메뉴 정상 동작
- [ ] 수동 테스트: 탭 전환 정상 동작
- [ ] 커밋: "refactor: TabMenu 컴포넌트 분리"

---

### 🟢 Step 6: 타입 정의 표준화

**목표**: 타입 정의를 표준화하고 `any` 타입 제거

**예상 소요 시간**: 2-3시간  
**위험도**: 🟢 낮음  
**예상 효과**: 타입 안정성 향상

#### 작업 내용

1. **`tabs/shared/types.ts` 확장**
   - `FMGroup`, `ProcessGroup`, `RowMergeConfig` 등 추가
   - 공통 타입 정의 통합

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
- [ ] 커밋: "refactor: 타입 정의 표준화"

---

## 📈 진행 상황 추적

| Step | 상태 | 시작일 | 완료일 | 소요 시간 | 비고 |
|------|------|--------|--------|-----------|------|
| Step 0 | ✅ 완료 | 2025-12-30 | 2025-12-30 | - | 준비 단계 |
| Step 1 | ⏳ 진행 예정 | - | - | - | 공통 유틸리티 함수 추출 |
| Step 2 | ⏸️ 대기 | - | - | - | 평가 탭 컴포넌트 분리 (Part 1) |
| Step 3 | ⏸️ 대기 | - | - | - | all 탭 리팩토링 |
| Step 4 | ⏸️ 대기 | - | - | - | FailureLinkTab 분리 |
| Step 5 | ⏸️ 대기 | - | - | - | TabMenu 분리 |
| Step 6 | ⏸️ 대기 | - | - | - | 타입 정의 표준화 |

**범례**: ✅ 완료 | ⏳ 진행중 | ⏸️ 대기 | 🔴 차단

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

#### 시각적 검증
- [ ] 셀합치기 정상 표시
- [ ] 마지막 행 병합 정상 표시
- [ ] 레이아웃 깨짐 없음
- [ ] 색상 및 스타일 정상 적용

---

## 📝 커밋 전략

### 커밋 메시지 형식
```
refactor: [Step 번호] [간단한 설명]

- 상세 변경 내용 1
- 상세 변경 내용 2
```

### 예시
```
refactor: Step 1 - 공통 유틸리티 함수 추출

- failure-link-grouping.ts 생성 및 적용
- row-merge-logic.ts 생성 및 적용
- process-grouping.ts 생성 및 적용
- page.tsx, FailureLinkTab.tsx에서 중복 코드 제거
```

### 태그 전략
- 각 Step 완료 후 태그 생성 (선택사항)
- 주요 마일스톤: `refactor-step-1`, `refactor-step-2`, etc.

---

## 📚 참고 문서

- [코드 최적화 검토 보고서](./CODE_OPTIMIZATION_REVIEW.md)
- [원자성 DB 아키텍처](./ATOMIC_DB_ARCHITECTURE.md)
- [코드 인덱스](../CODE_INDEX.md) (있는 경우)

---

## 🎯 최종 목표 달성 기준

### 정량적 목표
- [ ] `page.tsx` 2,747줄 → 700줄 이하 (74% 감소)
- [ ] `FailureLinkTab.tsx` 1,102줄 → 400줄 이하 (64% 감소)
- [ ] 모든 파일 800줄 이하

### 정성적 목표
- [ ] 중복 코드 제거 완료
- [ ] 컴포넌트 재사용성 향상
- [ ] 타입 안정성 향상
- [ ] 테스트 용이성 향상
- [ ] 코드 가독성 향상

---

**마지막 업데이트**: 2025-12-30  
**다음 단계**: Step 1 시작


# 우측 패널 플러그인 시스템 구현 계획

> **작성일**: 2025-12-30  
> **상태**: ✅ Phase 0 완료 (스켈레톤 구축)  
> **다음 단계**: Phase 1 시작

---

## 🎯 목표 요약

### 추가할 기능 (8개 패널)

| 버튼 | 기능 | 예상 크기 | 우선순위 |
|------|------|----------|---------|
| 🌳 TREE | 구조/기능/고장 트리 (기존) | ~15KB | ⭐⭐⭐ 높음 |
| 📄 PDF | PDF/PPT/Excel 뷰어 | ~150KB | ⭐⭐ 중간 |
| 🔴 5 AP | 5단계 AP 테이블 (기존) | ~3KB | ⭐⭐⭐ 높음 |
| 🟠 6 AP | 6단계 AP 테이블 (기존) | ~3KB | ⭐⭐⭐ 높음 |
| 📊 10 RPN | 파레토 차트 | ~80KB | ⭐⭐ 중간 |
| 📈 RPN | RPN 분석 | ~10KB | ⭐⭐ 중간 |
| 📚 LLD | 문서화 | ~15KB | ⭐ 낮음 |
| 🔍 GAP | 갭 분석 | ~20KB | ⭐ 낮음 |

**총 예상 크기**: ~296KB (레이지 로딩)  
**메인 번들 영향**: 0KB ✅

### 핵심 원칙

1. ✅ **레이지 로딩**: 클릭할 때만 로드 → 초기 번들 62% 감소
2. ✅ **플러그인 방식**: 새 패널 추가 3단계로 완료
3. ✅ **코드 분리**: 700행 규칙 준수, 각 패널 독립적
4. ✅ **확장성**: `page.tsx` 수정 없이 무한 확장

---

## 📋 구현 단계별 계획

### ✅ Phase 0: 스켈레톤 구축 (완료)

**소요 시간**: 1시간  
**완료일**: 2025-12-30

#### 완료 항목
- [x] `panels/` 디렉토리 생성
- [x] `panels/index.ts` 레지스트리 작성
- [x] `RightPanelMenu.tsx` 컴포넌트 생성
- [x] 8개 패널 스켈레톤 생성
- [x] `panels/README.md` 작성
- [x] 문서화 완료
- [x] 커밋: de0a5eb

#### 생성된 파일 (12개)
```
src/app/pfmea/worksheet/
├── panels/
│   ├── index.ts              ✅ 레지스트리
│   ├── README.md             ✅ 가이드
│   ├── TreePanel/            ✅ 스켈레톤
│   ├── PDFViewer/            ✅ 스켈레톤
│   ├── APTable/              ✅ 스켈레톤 (2개)
│   ├── RPNChart/             ✅ 스켈레톤 (2개)
│   ├── LLDViewer/            ✅ 스켈레톤
│   └── GAPAnalysis/          ✅ 스켈레톤
└── components/
    └── RightPanelMenu.tsx    ✅ 메뉴바
```

---

### ⏳ Phase 1: page.tsx 통합 (예정)

**예상 소요 시간**: 2-3시간  
**위험도**: 🟡 보통  
**목표**: 스켈레톤을 실제 page.tsx에 통합하고 동작 확인

#### 작업 내용

1. **`page.tsx`에 Suspense 추가**
   ```typescript
   import { Suspense, useState } from 'react';
   import RightPanelMenu from './components/RightPanelMenu';
   import { getPanelById } from './panels';
   
   function FMEAWorksheetPageContent() {
     const [activePanelId, setActivePanelId] = useState<string>('tree');
     const activePanel = getPanelById(activePanelId);
     const PanelComponent = activePanel?.component;
     
     return (
       <div>
         {/* ... 기존 코드 ... */}
         
         {/* 우측 패널 영역 */}
         <div style={{ width: '350px', ... }}>
           <RightPanelMenu 
             currentTab={state.tab}
             activePanel={activePanelId}
             onPanelChange={setActivePanelId}
             state={state}
           />
           
           <Suspense fallback={<LoadingSpinner />}>
             {PanelComponent && <PanelComponent state={state} />}
           </Suspense>
         </div>
       </div>
     );
   }
   ```

2. **기존 트리 뷰 코드 임시 숨김**
   - 기존 트리 코드를 주석 처리 또는 조건부 렌더링
   - Phase 2에서 완전히 이전

3. **LoadingSpinner 컴포넌트 작성**
   ```typescript
   function LoadingSpinner() {
     return (
       <div style={{ 
         display: 'flex', 
         justifyContent: 'center', 
         alignItems: 'center', 
         height: '100%' 
       }}>
         ⏳ 로딩 중...
       </div>
     );
   }
   ```

#### 체크리스트

- [ ] `page.tsx`에 import 추가
- [ ] 상태 관리 (activePanelId) 추가
- [ ] 우측 패널 영역에 RightPanelMenu 배치
- [ ] Suspense로 패널 영역 감싸기
- [ ] 기존 우측 메뉴바 제거 (page.tsx에 있던 것)
- [ ] 빌드 테스트: `npm run build`
- [ ] 수동 테스트: 패널 전환 동작 확인
- [ ] 수동 테스트: 탭별 색상 변경 확인
- [ ] 수동 테스트: 로딩 스피너 표시 확인
- [ ] 커밋: "refactor: Phase 1 - 우측 패널 시스템 통합"

#### 예상 결과
- 우측에 8개 버튼이 표시됨
- 버튼 클릭 시 "구현 예정" 메시지 표시 (스켈레톤)
- 탭 전환 시 메뉴바 색상 변경
- 기존 트리는 임시로 숨김

---

### ⏳ Phase 2: 기존 기능 이전 (예정)

**예상 소요 시간**: 3-4시간  
**위험도**: 🟡 보통  
**목표**: 기존 트리 및 AP 테이블 로직을 새 패널로 이전

#### 작업 내용

1. **TreePanel 실제 구현**
   - `page.tsx`의 기존 트리 코드 복사
   - `panels/TreePanel/TreePanel.tsx`에 이전
   - 구조/기능/고장 트리별로 분기 로직 유지
   - Props 전달 확인

2. **APTable5/6 실제 구현**
   - `components/APTableInline.tsx` 코드 복사
   - `panels/APTable/APTable5.tsx`, `APTable6.tsx`에 이전
   - 공통 로직 추출 (APTableCommon.tsx)

3. **기존 코드 제거**
   - `page.tsx`의 기존 트리 코드 삭제
   - `APTableInline.tsx` 삭제 (이미 별도 컴포넌트화됨)

#### 체크리스트

- [ ] TreePanel 로직 이전 완료
- [ ] StructureTree, FunctionTree, FailureTree 분리 (선택사항)
- [ ] APTable5 로직 이전 완료
- [ ] APTable6 로직 이전 완료
- [ ] APTableCommon 공통 로직 추출
- [ ] `page.tsx`에서 기존 코드 제거 (약 200줄 감소)
- [ ] 빌드 테스트: 성공
- [ ] 수동 테스트: 트리 정상 동작
- [ ] 수동 테스트: 5AP 정상 동작
- [ ] 수동 테스트: 6AP 정상 동작
- [ ] 번들 크기 확인: tree-panel.js, ap-table.js 분리 확인
- [ ] 커밋: "refactor: Phase 2 - 트리 및 AP 테이블 이전"

#### 예상 결과
- 트리 및 AP 테이블 정상 동작
- `page.tsx` 약 200줄 감소
- 번들 분리 확인 (개발자 도구)

---

### ⏳ Phase 3: 신규 뷰어 구현 (예정)

**예상 소요 시간**: 6-8시간  
**위험도**: 🟢 낮음 (독립적 구현)  
**목표**: 새로운 뷰어들 구현

#### 우선순위별 구현 계획

##### 3-1. PDF 뷰어 (2시간, 우선순위: 중간)

```bash
npm install react-pdf pdfjs-dist
npm install @types/react-pdf --save-dev
```

**구현 내용**:
- PDF 파일 업로드
- 페이지 네비게이션
- 확대/축소
- PPT, Excel 뷰어 (선택사항)

**체크리스트**:
- [ ] react-pdf 설치
- [ ] PDFViewer 컴포넌트 구현
- [ ] 파일 업로드 UI
- [ ] 페이지 네비게이션
- [ ] 확대/축소 기능
- [ ] 테스트: PDF 파일 표시
- [ ] 번들 크기 확인: ~150KB

##### 3-2. RPN 파레토 차트 (2시간, 우선순위: 중간)

```bash
npm install chart.js react-chartjs-2
```

**구현 내용**:
- RPN 상위 10개 추출
- 파레토 차트 그리기
- 인터랙티브 툴팁

**체크리스트**:
- [ ] Chart.js 설치
- [ ] RPN 데이터 추출 로직
- [ ] 파레토 차트 구현
- [ ] 차트 스타일링
- [ ] 테스트: 차트 표시
- [ ] 번들 크기 확인: ~80KB

##### 3-3. RPN 분석 뷰 (1시간, 우선순위: 중간)

**구현 내용**:
- RPN 통계 (평균, 최대, 최소)
- 분포 그래프
- 필터링 기능

**체크리스트**:
- [ ] RPN 통계 계산
- [ ] 분포 그래프 구현
- [ ] 필터링 UI
- [ ] 테스트: 통계 표시
- [ ] 번들 크기 확인: ~10KB

##### 3-4. LLD 문서 뷰어 (1시간, 우선순위: 낮음)

**구현 내용**:
- 마크다운 렌더링
- HTML 렌더링
- 목차 자동 생성

**체크리스트**:
- [ ] 마크다운 파서 선택
- [ ] 문서 렌더링
- [ ] 목차 생성
- [ ] 테스트: 문서 표시
- [ ] 번들 크기 확인: ~15KB

##### 3-5. GAP 분석 뷰 (1시간, 우선순위: 낮음)

**구현 내용**:
- 비교 테이블
- 차이점 하이라이트
- 필터링

**체크리스트**:
- [ ] 비교 로직 구현
- [ ] 테이블 UI
- [ ] 차이점 하이라이트
- [ ] 테스트: 비교 표시
- [ ] 번들 크기 확인: ~20KB

---

### ⏳ Phase 4: 최적화 및 테스트 (예정)

**예상 소요 시간**: 2시간  
**위험도**: 🟢 낮음  
**목표**: 성능 최적화 및 최종 검증

#### 작업 내용

1. **번들 크기 분석**
   ```bash
   npm run build
   # 각 청크 크기 확인
   ```

2. **성능 측정**
   - 초기 로딩 시간
   - 패널 전환 속도
   - 메모리 사용량

3. **최적화**
   - 불필요한 import 제거
   - 이미지 최적화
   - 코드 스플리팅 확인

4. **문서화**
   - `RIGHT_PANEL_ARCHITECTURE.md` 업데이트
   - `panels/README.md` 업데이트
   - 커밋 로그 정리

#### 체크리스트

- [ ] 번들 크기 분석: main.js < 350KB
- [ ] 초기 로딩 시간: < 3초
- [ ] 패널 전환 속도: < 0.5초
- [ ] 메모리 누수 체크: 없음
- [ ] 회귀 테스트: 모든 기능 정상
- [ ] 문서 업데이트 완료
- [ ] 커밋: "refactor: Phase 4 - 최적화 및 최종 검증 완료"

#### 예상 결과
- 메인 번들: 850KB → 320KB ✅
- 초기 로딩: 2배 빠름 ✅
- 확장성: 새 패널 추가 3단계 ✅

---

## 📊 예상 성과

### 번들 크기 비교

| 구분 | 기존 | 최적화 후 | 절약 |
|------|------|----------|------|
| **메인 번들** | 850KB | 320KB | **530KB (62%)** ✅ |
| tree-panel.js | - | 15KB | (분리) |
| pdf-viewer.js | - | 150KB | (분리) |
| rpn-chart.js | - | 80KB | (분리) |
| 기타 패널들 | - | 51KB | (분리) |

### 개발 생산성

| 항목 | 기존 | 개선 후 |
|------|------|--------|
| 새 패널 추가 | `page.tsx` 수정 필요 (50줄+) | 3단계로 완료 (10줄) ✅ |
| 패널 독립성 | 낮음 (의존성 많음) | 높음 (완전 독립) ✅ |
| 테스트 용이성 | 어려움 | 쉬움 ✅ |
| 유지보수성 | 낮음 | 높음 ✅ |

---

## 🚀 다음 단계 (사용자 지시 대기)

### 즉시 시작 가능
✅ **Phase 1: page.tsx 통합** (2-3시간)
- 스켈레톤을 실제로 동작하게 만들기
- 기존 트리 임시 숨김
- 패널 전환 동작 확인

### 권장 순서
1. Phase 1 → 테스트 → 커밋
2. Phase 2 → 테스트 → 커밋
3. Phase 3-1 (PDF) → 테스트 → 커밋
4. Phase 3-2 (RPN) → 테스트 → 커밋
5. Phase 3-3,4,5 (나머지) → 테스트 → 커밋
6. Phase 4 (최적화) → 테스트 → 커밋

### 사용자 선택지

**옵션 1: 전체 진행** (12-15시간)
```
Phase 1 → Phase 2 → Phase 3 → Phase 4
```

**옵션 2: 단계별 진행** (권장)
```
Phase 1 → 확인 → Phase 2 → 확인 → ...
```

**옵션 3: 우선순위만 진행** (6-8시간)
```
Phase 1 → Phase 2 (트리, AP만) → Phase 4
```

---

## 📚 참고 문서

- [RIGHT_PANEL_ARCHITECTURE.md](./RIGHT_PANEL_ARCHITECTURE.md) - 상세 설계
- [REFACTORING_MASTER_PLAN.md](./REFACTORING_MASTER_PLAN.md) - Step 8
- [panels/README.md](../src/app/pfmea/worksheet/panels/README.md) - 패널 가이드

---

**🎉 Phase 0 완료! 다음 단계를 시작하려면 지시해 주세요!**


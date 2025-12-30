# 스냅샷 메타정보 - 2025-12-30 플러그인 모듈화

## 커밋 정보

| 항목 | 내용 |
|------|------|
| **커밋 해시** | `f477296` |
| **태그** | `v1.8.0-plugin-modularization` |
| **날짜** | 2025-12-30 |
| **상태** | 코드프리즈 ✅ |

## 주요 변경사항

### 1. 플러그인 모듈화 시스템 구축

#### 패널 레지스트리 (`panels/index.ts`)
- `PanelConfig` 인터페이스 정의
- `PANEL_REGISTRY`: 레이지 로딩 기반 패널 등록
- `getPanelById()`, `getSortedPanels()`, `getEnabledPanels()` 유틸리티

#### 구현된 패널
| 패널 | 파일 | 상태 | 설명 |
|------|------|------|------|
| 🌳 TREE | `TreePanel/TreePanel.tsx` | ✅ 완료 | 7개 탭 트리 로직 (~320줄) |
| 📄 PDF | `PDFViewer/index.tsx` | 📋 스켈레톤 | react-pdf 예정 |
| 📊 RPN | `RPNChart/ParetoChart.tsx` | ✅ 완료 | Chart.js 파레토 차트 (~300줄) |

### 2. TreePanel 구현
- 구조분석(structure) 트리
- 기능분석 L1/L2/L3 트리
- 고장분석 L1/L2/L3 트리
- page.tsx에서 인라인 트리 코드 제거 (~300줄 감소)

### 3. ParetoChart 구현
- Chart.js + react-chartjs-2 사용
- RPN 상위 10개 파레토 차트
- 누적 백분율 라인 차트
- 위험도별 색상 구분 (빨강/노랑/녹색)

### 4. RPNAnalysis 구현
- RPN 통계 카드 (총 건수, 최대/최소/평균)
- 위험도 분포 바 차트
- 권장 조치 알림

### 5. UI 개선

#### 4M 컬럼 너비 표준화
| 파일 | 변경 전 | 변경 후 |
|------|---------|---------|
| StructureTab.tsx (colgroup) | 20px | 80px |
| StructureTab.tsx (header/cell) | 120px | 80px |
| columnConfig.ts | 25px | 80px |
| FunctionColgroup.tsx | 40px | 80px |
| AllTabRenderer.tsx | 50px/25px | 60px |

#### 패널 메뉴 위치 이동
- 기존: 우측 패널 내부 상단
- 변경: 상단 탭 메뉴 우측 (350px 고정)
- 구분선: 3px 노란색 (#ffd600)
- 탭 메뉴: 진한 네이비 (#1a237e)
- 플러그인 메뉴: 청록색 (#00695c)

### 6. 버그 수정
- colgroup 내 JSX 주석 제거 (hydration 에러 수정)
- 콘텐츠 영역 div 닫힘 태그 누락 수정

## 디렉토리 구조

```
src/app/pfmea/worksheet/
├── panels/                          # 🆕 플러그인 패널
│   ├── index.ts                     # 레지스트리
│   ├── README.md                    # 사용 가이드
│   ├── TreePanel/
│   │   ├── index.tsx                # 레이지 로딩 래퍼
│   │   └── TreePanel.tsx            # 트리 렌더링 (~320줄)
│   ├── PDFViewer/
│   │   └── index.tsx                # 스켈레톤
│   ├── RPNChart/
│   │   ├── ParetoChart.tsx          # 파레토 차트 (~300줄)
│   │   └── RPNAnalysis.tsx          # RPN 분석 (~220줄)
│   ├── APTable/
│   │   ├── APTable5.tsx
│   │   └── APTable6.tsx
│   ├── LLDViewer/
│   │   └── index.tsx
│   └── GAPAnalysis/
│       └── index.tsx
├── components/
│   └── RightPanelMenu.tsx           # 패널 선택 메뉴
└── page.tsx                         # 메인 페이지 (리팩토링됨)
```

## 새 패널 추가 방법 (3단계)

```typescript
// 1. panels/NewPanel/index.tsx 생성
export default function NewPanel({ state }) { ... }

// 2. panels/index.ts에 등록
{
  id: 'new-panel',
  label: 'NEW',
  icon: '🆕',
  component: lazy(() => import('./NewPanel')),
  order: 10,
}

// 3. 완료! page.tsx 수정 불필요
```

## 파일 변경 통계

| 항목 | 수치 |
|------|------|
| 변경된 파일 | 72개 |
| 추가된 줄 | +1,229 |
| 삭제된 줄 | -565 |
| 순 증가 | +664줄 |

## 다음 단계

### 예정된 작업
- [ ] PDFViewer 구현 (react-pdf)
- [ ] LLDViewer 구현 (문서화 뷰어)
- [ ] GAPAnalysis 구현 (갭 분석)
- [ ] 번들 크기 최적화 확인

### 장기 계획
- TabMenu 탭 등록 시스템 구축
- 역전개 기능 추가
- FMEA4판 지원

---

**작성일**: 2025-12-30  
**작성자**: AI Assistant  
**버전**: v1.8.0-plugin-modularization


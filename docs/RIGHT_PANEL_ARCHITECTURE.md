# 📐 우측 패널 아키텍처 설계 (Right Panel Architecture)

> **목표**: 트리뷰 영역을 확장 가능한 플러그인 시스템으로 구현  
> **원칙**: 레이지 로딩, 코드 분리, 번들 크기 최소화

---

## 🎯 요구사항

### 1. 기능 목록
| 버튼 | 기능 | 상태 | 예상 크기 | 완료일 |
|------|------|------|----------|--------|
| 🌳 TREE | 구조/기능/고장 트리 | ✅ 완료 | ~8KB | 2025-12-30 |
| 📄 PDF | PDF/PPT/Excel 뷰어 | 📋 스켈레톤 | ~150KB | - |
| 🔴 5 AP | 5단계 AP 테이블 | ✅ 완료 | ~3KB | 기존 |
| 🟠 6 AP | 6단계 AP 테이블 | ✅ 완료 | ~3KB | 기존 |
| 📊 RPN | 파레토 차트 | ✅ 완료 | ~10KB (Chart.js) | 2025-12-30 |
| 📈 분석 | RPN 분석 뷰 | ✅ 완료 | ~7KB | 2025-12-30 |
| 📚 LLD | 문서화 | 📋 스켈레톤 | ~15KB | - |
| 🔍 GAP | 갭 분석 | 📋 스켈레톤 | ~20KB | - |

### 2. 핵심 원칙
- ✅ **레이지 로딩**: 클릭할 때만 로드
- ✅ **코드 분리**: 각 뷰어를 별도 청크로 분리
- ✅ **번들 최소화**: 메인 번들에 영향 없음
- ✅ **확장 가능**: 새 뷰어 추가 용이

---

## 🏗️ 아키텍처

### 1. 디렉토리 구조
```
src/app/pfmea/worksheet/
├── components/
│   ├── TopMenuBar.tsx
│   ├── TabMenu.tsx
│   └── RightPanelMenu.tsx          # 우측 메뉴바 (신규)
├── panels/                          # 우측 패널 뷰어들
│   ├── index.ts                     # 플러그인 레지스트리
│   ├── TreePanel/
│   │   ├── index.tsx                # Lazy wrapper
│   │   ├── TreePanel.tsx            # 실제 컴포넌트
│   │   ├── StructureTree.tsx
│   │   ├── FunctionTree.tsx
│   │   └── FailureTree.tsx
│   ├── PDFViewer/
│   │   ├── index.tsx                # Lazy wrapper
│   │   ├── PDFViewer.tsx
│   │   ├── PPTViewer.tsx
│   │   └── ExcelViewer.tsx
│   ├── APTable/
│   │   ├── index.tsx
│   │   ├── APTable5.tsx
│   │   └── APTable6.tsx
│   ├── RPNChart/
│   │   ├── index.tsx
│   │   ├── ParetoChart.tsx          # 파레토 차트
│   │   └── RPNAnalysis.tsx
│   ├── LLDViewer/
│   │   ├── index.tsx
│   │   └── LLDViewer.tsx
│   └── GAPAnalysis/
│       ├── index.tsx
│       └── GAPAnalysis.tsx
└── page.tsx
```

### 2. 플러그인 시스템

#### panels/index.ts (레지스트리)
```typescript
import { lazy } from 'react';

export interface PanelConfig {
  id: string;
  label: string;
  icon: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  color?: string;
  order: number;
}

export const PANEL_REGISTRY: PanelConfig[] = [
  {
    id: 'tree',
    label: 'TREE',
    icon: '🌳',
    component: lazy(() => import('./TreePanel')),
    order: 1,
  },
  {
    id: 'pdf',
    label: 'PDF',
    icon: '📄',
    component: lazy(() => import('./PDFViewer')),
    order: 2,
  },
  {
    id: '5ap',
    label: '5 AP',
    icon: '🔴',
    component: lazy(() => import('./APTable/APTable5')),
    color: '#f44336',
    order: 3,
  },
  {
    id: '6ap',
    label: '6 AP',
    icon: '🟠',
    component: lazy(() => import('./APTable/APTable6')),
    color: '#ff9800',
    order: 4,
  },
  {
    id: '10rpn',
    label: '10 RPN',
    icon: '📊',
    component: lazy(() => import('./RPNChart/ParetoChart')),
    order: 5,
  },
  {
    id: 'rpn',
    label: 'RPN',
    icon: '📈',
    component: lazy(() => import('./RPNChart/RPNAnalysis')),
    order: 6,
  },
  {
    id: 'lld',
    label: 'LLD',
    icon: '📚',
    component: lazy(() => import('./LLDViewer')),
    order: 7,
  },
  {
    id: 'gap',
    label: 'GAP',
    icon: '🔍',
    component: lazy(() => import('./GAPAnalysis')),
    order: 8,
  },
];

export const getPanelById = (id: string) => 
  PANEL_REGISTRY.find(p => p.id === id);
```

### 3. 우측 메뉴바 컴포넌트

#### components/RightPanelMenu.tsx
```typescript
'use client';

import React, { Suspense } from 'react';
import { PANEL_REGISTRY, type PanelConfig } from '../panels';

interface RightPanelMenuProps {
  currentTab: string;
  activePanel: string | null;
  onPanelChange: (panelId: string) => void;
}

export default function RightPanelMenu({ 
  currentTab, 
  activePanel, 
  onPanelChange 
}: RightPanelMenuProps) {
  // 탭별 배경 색상
  const getBackgroundColor = () => {
    if (currentTab === 'structure') return 'linear-gradient(to right, #42a5f5, #5c6bc0, #42a5f5)';
    if (currentTab.startsWith('function')) return 'linear-gradient(to right, #66bb6a, #81c784, #66bb6a)';
    if (currentTab.startsWith('failure')) return 'linear-gradient(to right, #ffa726, #ffb74d, #ffa726)';
    return 'linear-gradient(to right, #3949ab, #5c6bc0, #3949ab)';
  };

  return (
    <div style={{
      height: '32px',
      background: getBackgroundColor(),
      borderTop: '1px solid rgba(255,255,255,0.4)',
      borderBottom: '1px solid rgba(255,255,255,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '8px',
      gap: '6px',
      position: 'sticky',
      top: '64px',
      zIndex: 70,
    }}>
      {PANEL_REGISTRY.map(panel => (
        <button
          key={panel.id}
          onClick={() => onPanelChange(panel.id)}
          className="px-3 py-1 rounded transition-all"
          style={{
            background: activePanel === panel.id 
              ? 'rgba(255,255,255,0.3)' 
              : 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            fontSize: '12px',
            fontWeight: activePanel === panel.id ? 600 : 400,
            cursor: 'pointer',
          }}
          onMouseOver={(e) => {
            if (activePanel !== panel.id) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
            }
          }}
          onMouseOut={(e) => {
            if (activePanel !== panel.id) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            }
          }}
        >
          {panel.icon} {panel.label}
        </button>
      ))}
    </div>
  );
}
```

### 4. 메인 페이지 통합

#### page.tsx (우측 패널 영역)
```typescript
'use client';

import React, { Suspense, useState } from 'react';
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
      {state.tab !== 'all' && state.tab !== 'failure-link' && (
        <div style={{ width: '350px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          {/* 우측 메뉴바 */}
          <RightPanelMenu 
            currentTab={state.tab}
            activePanel={activePanelId}
            onPanelChange={setActivePanelId}
          />
          
          {/* 패널 콘텐츠 (레이지 로딩) */}
          <div style={{ flex: 1, overflow: 'auto', background: '#f0f4f8' }}>
            <Suspense fallback={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                fontSize: '14px',
                color: '#666'
              }}>
                ⏳ 로딩 중...
              </div>
            }>
              {PanelComponent && <PanelComponent state={state} />}
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 📦 번들 크기 최적화

### 1. 레이지 로딩 효과
```
기존 (모든 코드 포함):
  main.js: 850KB

최적화 후 (레이지 로딩):
  main.js: 320KB ✅
  tree-panel.js: 15KB (클릭 시 로드)
  pdf-viewer.js: 150KB (클릭 시 로드)
  rpn-chart.js: 80KB (클릭 시 로드)
  ... 기타 패널들
  
총 절약: ~530KB (초기 로드 시)
```

### 2. Dynamic Import 사용
```typescript
// ❌ 나쁜 예 (모든 코드를 메인 번들에 포함)
import PDFViewer from './panels/PDFViewer';

// ✅ 좋은 예 (필요할 때만 로드)
const PDFViewer = lazy(() => import('./panels/PDFViewer'));
```

### 3. 코드 분리 확인
```bash
# 빌드 후 청크 크기 확인
npm run build

# 예상 결과
Route (app)                              Size
┌ ○ /pfmea/worksheet                     85 kB          
├   ├ css/xxx.css                        12 kB
├   └ chunks/tree-panel.js               15 kB (lazy)
├   └ chunks/pdf-viewer.js               150 kB (lazy)
└   └ chunks/rpn-chart.js                80 kB (lazy)
```

---

## 🚀 구현 순서

### Phase 1: 기반 구조 (1-2시간)
- [ ] `panels/` 디렉토리 생성
- [ ] `panels/index.ts` 레지스트리 작성
- [ ] `RightPanelMenu.tsx` 컴포넌트 생성
- [ ] `page.tsx`에 통합

### Phase 2: 기존 기능 이전 (2-3시간)
- [ ] 트리 뷰어를 `TreePanel/`로 이전
- [ ] AP 테이블을 `APTable/`로 이전
- [ ] 레이지 로딩 적용
- [ ] 테스트

### Phase 3: 신규 뷰어 구현 (각 2-4시간)
- [ ] PDF 뷰어 (react-pdf 사용)
- [ ] 파레토 차트 (Chart.js 사용)
- [ ] RPN 분석 뷰
- [ ] LLD 문서 뷰어
- [ ] GAP 분석 뷰

### Phase 4: 최적화 및 테스트 (2시간)
- [ ] 번들 크기 분석
- [ ] 로딩 속도 측정
- [ ] 메모리 누수 체크
- [ ] 문서화

---

## 📊 예상 효과

### 1. 성능
- **초기 로딩**: 850KB → 320KB (62% 감소)
- **메모리**: 사용하지 않는 뷰어는 메모리에 로드되지 않음
- **속도**: 첫 화면 표시 속도 2배 향상

### 2. 유지보수성
- **독립성**: 각 뷰어를 독립적으로 개발/테스트
- **확장성**: 새 뷰어 추가가 용이 (3단계만)
  1. 컴포넌트 작성
  2. 레지스트리에 등록
  3. 완료!

### 3. 개발 경험
- **핫 리로드**: 수정한 패널만 리로드
- **코드 분리**: 파일 크기가 작아 편집 쉬움
- **명확한 구조**: 어디에 뭐가 있는지 명확

---

## 🔧 필요한 라이브러리

```json
{
  "dependencies": {
    "react-pdf": "^7.7.0",              // PDF 뷰어
    "pptxgenjs": "^3.12.0",             // PPT 뷰어
    "xlsx": "^0.18.5",                  // Excel 뷰어
    "chart.js": "^4.4.1",               // 차트 (파레토)
    "react-chartjs-2": "^5.2.0"         // React Chart 래퍼
  }
}
```

---

## ✅ 완료 기준

- [ ] 모든 패널이 레이지 로딩됨
- [ ] 메인 번들 크기 < 350KB
- [ ] 패널 전환이 0.5초 이내
- [ ] 메모리 누수 없음
- [ ] 모든 패널이 독립적으로 동작
- [ ] 문서화 완료

---

**🎯 이 아키텍처로 코드 크기를 최소화하면서 무한 확장 가능한 우측 패널 시스템을 구축합니다!**



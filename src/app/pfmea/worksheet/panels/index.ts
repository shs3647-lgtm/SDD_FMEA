/**
 * 우측 패널 플러그인 레지스트리
 * 
 * 새 패널 추가 방법:
 * 1. panels/ 하위에 새 폴더 생성 (예: NewPanel/)
 * 2. index.tsx에서 React.lazy()로 export
 * 3. 아래 PANEL_REGISTRY에 추가
 * 
 * 예시:
 * {
 *   id: 'new-panel',
 *   label: 'NEW',
 *   icon: '🆕',
 *   component: lazy(() => import('./NewPanel')),
 *   order: 9,
 * }
 */

import { lazy, ComponentType } from 'react';

export interface PanelConfig {
  /** 패널 고유 ID */
  id: string;
  /** 버튼에 표시될 라벨 */
  label: string;
  /** 버튼 아이콘 (이모지) */
  icon: string;
  /** 레이지 로딩될 컴포넌트 */
  component: React.LazyExoticComponent<ComponentType<any>>;
  /** 버튼 색상 (선택사항) */
  color?: string;
  /** 표시 순서 */
  order: number;
  /** 활성화 조건 (선택사항) */
  enabled?: (state: any) => boolean;
}

/**
 * 패널 레지스트리
 * 
 * 레이지 로딩으로 각 패널은 클릭할 때만 로드됨
 * 이로 인해 초기 번들 크기가 크게 감소
 */
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
    // 예시: PDF 파일이 있을 때만 활성화
    // enabled: (state) => !!state.pdfUrl,
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

/**
 * 패널 ID로 패널 설정 찾기
 */
export const getPanelById = (id: string): PanelConfig | undefined => 
  PANEL_REGISTRY.find(p => p.id === id);

/**
 * 순서대로 정렬된 패널 목록
 */
export const getSortedPanels = (): PanelConfig[] => 
  [...PANEL_REGISTRY].sort((a, b) => a.order - b.order);

/**
 * 활성화된 패널 목록 (조건 검사)
 */
export const getEnabledPanels = (state: any): PanelConfig[] => 
  getSortedPanels().filter(p => !p.enabled || p.enabled(state));


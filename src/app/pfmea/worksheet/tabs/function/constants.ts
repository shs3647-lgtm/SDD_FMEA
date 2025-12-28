import { COLORS } from '../constants';

export const FUNC_COLORS = {
  l1Main: '#7b1fa2',      // 보라 진한
  l1Sub: '#ce93d8',       // 보라 중간
  l1Cell: '#f3e5f5',      // 보라 연한
  l2Main: '#512da8',      // 인디고 진한  
  l2Sub: '#b39ddb',       // 인디고 중간
  l2Cell: '#ede7f6',      // 인디고 연한
  l3Main: '#303f9f',      // 파랑 진한
  l3Sub: '#9fa8da',       // 파랑 중간
  l3Cell: '#e8eaf6',      // 파랑 연한
};

export const stickyFirstColStyle: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 10,
};

export const MODAL_CONFIG: Record<string, { title: string; itemCode: string }> = {
  l1Type: { title: '구분 선택', itemCode: 'C1' },
  l1Function: { title: '완제품 기능 선택', itemCode: 'C2' },
  l1Requirement: { title: '요구사항 선택', itemCode: 'C3' },
  l2Function: { title: '공정 기능 선택', itemCode: 'A3' },
  l2ProductChar: { title: '제품특성 선택', itemCode: 'A4' },
  l3Function: { title: '작업요소 기능 선택', itemCode: 'B2' },
  l3ProcessChar: { title: '공정특성 선택', itemCode: 'B3' },
};



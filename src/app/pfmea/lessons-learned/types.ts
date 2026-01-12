/**
 * @file types.ts
 * @description 습득교훈 화면 타입 정의
 * @reference PRD-023-lessons-learned-screen.md
 */

// 습득교훈 행 데이터
export interface LessonsLearnedRow {
  id: string;
  lldNo: string;          // LLD 시리얼 번호 (LLD26-001 형식)
  vehicle: string;        // 차종
  target: '설계' | '부품' | '제조';  // 대상
  failureMode: string;    // 고장형태
  location: string;       // 발생장소
  cause: string;          // 발생원인
  category: '예방관리' | '검출관리';  // 구분
  improvement: string;    // 개선대책
  result: string;         // 적용결과
  status: 'G' | 'Y' | 'R'; // 상태 (완료/진행중/미완료)
  date: string;           // 완료일자
}

// 드롭다운 옵션
export const TARGET_OPTIONS = ['설계', '부품', '제조'] as const;
export const CATEGORY_OPTIONS = ['예방관리', '검출관리'] as const;
export const STATUS_OPTIONS = ['G', 'Y', 'R'] as const;

// 상태 색상 코딩
export const STATUS_COLORS = {
  G: { background: '#92D050', color: '#1F2937', label: '완료' },  // 녹색
  Y: { background: '#FFD966', color: '#1F2937', label: '진행중' },  // 노랑
  R: { background: '#FF6B6B', color: '#FFFFFF', label: '미완료' },  // 빨강
} as const;

// 컬럼 정의
export const COLUMNS = [
  { key: 'lldNo', name: 'LLD_No', width: 100, align: 'center' as const },
  { key: 'vehicle', name: '차종', width: 80, align: 'center' as const },
  { key: 'target', name: '대상', width: 80, align: 'center' as const },
  { key: 'failureMode', name: '고장형태', width: 200, align: 'left' as const },
  { key: 'location', name: '발생장소', width: 100, align: 'center' as const },
  { key: 'cause', name: '발생원인', width: 200, align: 'left' as const },
  { key: 'category', name: '구분', width: 80, align: 'center' as const },
  { key: 'improvement', name: '개선대책', width: 200, align: 'left' as const },
  { key: 'result', name: '적용결과', width: 100, align: 'center' as const },
  { key: 'status', name: '상태', width: 60, align: 'center' as const },
  { key: 'date', name: '완료일자', width: 100, align: 'center' as const },
] as const;

// 통계 타입
export interface LessonsStats {
  total: number;
  completed: number;  // G
  inProgress: number; // Y
  pending: number;    // R
}


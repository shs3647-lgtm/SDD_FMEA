/**
 * ParetoChart - 10 RPN 파레토 차트
 * 
 * TODO: Phase 3에서 구현 예정
 * - Chart.js + react-chartjs-2 사용
 * - RPN 상위 10개 파레토 차트
 * - 예상 크기: ~80KB (레이지 로딩)
 */

'use client';

export default function ParetoChart({ state }: { state: any }) {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      color: '#999',
      fontSize: '12px' 
    }}>
      📊 10 RPN 파레토 차트 구현 예정<br/>
      (Phase 3: Chart.js 사용)<br/>
      예상 번들 크기: ~80KB (레이지 로딩)
    </div>
  );
}


/**
 * ParetoChart - 10 RPN 파레토 차트
 * 
 * RPN(Risk Priority Number) 상위 10개 항목을 파레토 차트로 표시
 * Chart.js + react-chartjs-2 사용
 */

'use client';

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface RPNItem {
  id: string;
  processName: string;
  workElement: string;
  failureMode: string;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
}

interface ParetoChartProps {
  state: any;
}

export default function ParetoChart({ state }: ParetoChartProps) {
  // state에서 RPN 데이터 추출
  const rpnData = useMemo(() => {
    const items: RPNItem[] = [];
    
    // failureLinks에서 RPN 데이터 추출
    const failureLinks = (state as any).failureLinkUI?.savedLinks || [];
    
    failureLinks.forEach((link: any) => {
      if (link.severity && link.occurrence && link.detection) {
        const rpn = link.severity * link.occurrence * link.detection;
        items.push({
          id: link.id || `${link.fmId}-${link.fcId}`,
          processName: link.processName || '',
          workElement: link.workElement || link.fcWe || '',
          failureMode: link.fmText || '',
          severity: link.severity,
          occurrence: link.occurrence,
          detection: link.detection,
          rpn,
        });
      }
    });
    
    // 각 L2(공정)의 고장형태에서도 RPN 추출 시도
    if (items.length === 0 && state.l2) {
      state.l2.forEach((proc: any) => {
        const failureModes = proc.failureModes || [];
        failureModes.forEach((fm: any) => {
          if (fm.severity && fm.occurrence && fm.detection) {
            const rpn = fm.severity * fm.occurrence * fm.detection;
            items.push({
              id: fm.id,
              processName: `${proc.no}. ${proc.name}`,
              workElement: '',
              failureMode: fm.name,
              severity: fm.severity,
              occurrence: fm.occurrence,
              detection: fm.detection,
              rpn,
            });
          }
        });
      });
    }
    
    // RPN 기준 내림차순 정렬 후 상위 10개
    return items.sort((a, b) => b.rpn - a.rpn).slice(0, 10);
  }, [state]);

  // 누적 백분율 계산
  const cumulativePercentage = useMemo(() => {
    const totalRPN = rpnData.reduce((sum, item) => sum + item.rpn, 0);
    if (totalRPN === 0) return [];
    
    let cumulative = 0;
    return rpnData.map(item => {
      cumulative += item.rpn;
      return (cumulative / totalRPN) * 100;
    });
  }, [rpnData]);

  // 차트 데이터
  const chartData = {
    labels: rpnData.map((item, idx) => `#${idx + 1}`),
    datasets: [
      {
        type: 'bar' as const,
        label: 'RPN',
        data: rpnData.map(item => item.rpn),
        backgroundColor: rpnData.map((item, idx) => {
          // 상위 3개는 빨간색 계열, 나머지는 파란색 계열
          if (idx < 3) return 'rgba(220, 53, 69, 0.8)';
          if (idx < 6) return 'rgba(255, 193, 7, 0.8)';
          return 'rgba(40, 167, 69, 0.8)';
        }),
        borderColor: rpnData.map((item, idx) => {
          if (idx < 3) return '#dc3545';
          if (idx < 6) return '#ffc107';
          return '#28a745';
        }),
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: '누적 %',
        data: cumulativePercentage,
        borderColor: '#6c757d',
        backgroundColor: 'rgba(108, 117, 125, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#6c757d',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  };

  // 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { size: 10 },
          padding: 8,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const idx = context.dataIndex;
            const item = rpnData[idx];
            if (!item) return '';
            if (context.dataset.label === 'RPN') {
              return `RPN: ${item.rpn} (S:${item.severity} × O:${item.occurrence} × D:${item.detection})`;
            }
            return `누적: ${cumulativePercentage[idx]?.toFixed(1)}%`;
          },
          afterLabel: (context: any) => {
            const idx = context.dataIndex;
            const item = rpnData[idx];
            if (!item || context.dataset.label !== 'RPN') return '';
            return [
              `공정: ${item.processName}`,
              `FM: ${item.failureMode}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'RPN',
          font: { size: 10 },
        },
        ticks: { font: { size: 9 } },
        min: 0,
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        title: {
          display: true,
          text: '누적 %',
          font: { size: 10 },
        },
        ticks: { 
          font: { size: 9 },
          callback: (value: number | string) => `${value}%`,
        },
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false },
      },
    },
  };

  // 데이터가 없을 때
  if (rpnData.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        background: '#f8fafc' 
      }}>
        <div style={{ 
          background: '#6c757d', 
          color: 'white', 
          padding: '8px 12px', 
          fontSize: '12px', 
          fontWeight: 700,
          flexShrink: 0 
        }}>
          📊 TOP 10 RPN 파레토
        </div>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          padding: '20px',
          color: '#888',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>RPN 데이터가 없습니다</div>
          <div style={{ fontSize: '11px', color: '#aaa' }}>
            고장분석에서 심각도(S), 발생도(O), 검출도(D)를<br/>
            입력하면 RPN 차트가 표시됩니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: '#f8fafc' 
    }}>
      {/* 헤더 */}
      <div style={{ 
        background: '#495057', 
        color: 'white', 
        padding: '8px 12px', 
        fontSize: '12px', 
        fontWeight: 700,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>📊 TOP 10 RPN 파레토</span>
        <span style={{ fontSize: '10px', fontWeight: 400 }}>
          총 {rpnData.length}건
        </span>
      </div>

      {/* 차트 영역 */}
      <div style={{ flex: 1, padding: '8px', minHeight: '200px' }}>
        <Chart type="bar" data={chartData as any} options={chartOptions as any} />
      </div>

      {/* 상세 목록 */}
      <div style={{ 
        flexShrink: 0, 
        maxHeight: '150px', 
        overflow: 'auto',
        borderTop: '1px solid #dee2e6',
        background: '#fff'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '9px' 
        }}>
          <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '4px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>#</th>
              <th style={{ padding: '4px', borderBottom: '1px solid #dee2e6', textAlign: 'left' }}>고장형태</th>
              <th style={{ padding: '4px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>S</th>
              <th style={{ padding: '4px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>O</th>
              <th style={{ padding: '4px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>D</th>
              <th style={{ padding: '4px', borderBottom: '1px solid #dee2e6', textAlign: 'center', fontWeight: 700 }}>RPN</th>
            </tr>
          </thead>
          <tbody>
            {rpnData.map((item, idx) => (
              <tr key={item.id} style={{ 
                background: idx < 3 ? '#fff5f5' : idx < 6 ? '#fffef5' : '#f8fff5' 
              }}>
                <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 600 }}>
                  {idx + 1}
                </td>
                <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.failureMode || '-'}
                </td>
                <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  {item.severity}
                </td>
                <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  {item.occurrence}
                </td>
                <td style={{ padding: '3px 4px', borderBottom: '1px solid #eee', textAlign: 'center' }}>
                  {item.detection}
                </td>
                <td style={{ 
                  padding: '3px 4px', 
                  borderBottom: '1px solid #eee', 
                  textAlign: 'center',
                  fontWeight: 700,
                  color: idx < 3 ? '#dc3545' : idx < 6 ? '#856404' : '#155724'
                }}>
                  {item.rpn}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

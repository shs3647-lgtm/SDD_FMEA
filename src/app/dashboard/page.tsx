/**
 * @file page.tsx
 * @description FMEA Dashboard - 참조 이미지와 동일한 레이아웃
 * 
 * 2x3 그리드:
 * Row 1: RPN 분포, 개선조치 현황, Top 10 RPN 파레토
 * Row 2: Severity 개선전후, Occurrence 개선전후, Detection 개선전후
 */

'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { useDashboardStats, getDemoStats } from './hooks/useDashboardStats';

Chart.register(...registerables);

export default function DashboardPage() {
  const liveStats = useDashboardStats();
  const stats = useMemo(() => {
    return liveStats.totalItems > 0 ? liveStats : getDemoStats();
  }, [liveStats]);

  // 차트 레퍼런스
  const rpnDistRef = useRef<HTMLCanvasElement>(null);
  const improvementRef = useRef<HTMLCanvasElement>(null);
  const paretoRef = useRef<HTMLCanvasElement>(null);
  const severityRef = useRef<HTMLCanvasElement>(null);
  const occurrenceRef = useRef<HTMLCanvasElement>(null);
  const detectionRef = useRef<HTMLCanvasElement>(null);

  const chartsRef = useRef<Chart[]>([]);

  useEffect(() => {
    chartsRef.current.forEach(c => c.destroy());
    chartsRef.current = [];

    // 1. RPN 분포 (막대 차트)
    if (rpnDistRef.current) {
      const ctx = rpnDistRef.current.getContext('2d');
      if (ctx) {
        chartsRef.current.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['낮음 (1-49)', '중간 (50-99)', '높음 (100-199)', '매우높음 (200+)'],
            datasets: [{
              data: [25, 45, 20, 10],
              backgroundColor: ['#22c55e', '#3b82f6', '#f97316', '#ef4444'],
              borderRadius: 4,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, max: 50, ticks: { stepSize: 10 } },
              x: { ticks: { font: { size: 10 } } }
            }
          }
        }));
      }
    }

    // 2. 개선조치 현황 (도넛 차트)
    if (improvementRef.current) {
      const ctx = improvementRef.current.getContext('2d');
      if (ctx) {
        chartsRef.current.push(new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['완료', '진행중', '계획', '지연'],
            datasets: [{
              data: [40, 30, 20, 10],
              backgroundColor: ['#22c55e', '#3b82f6', '#facc15', '#ef4444'],
              borderWidth: 0,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'top',
                labels: { 
                  usePointStyle: true, 
                  pointStyle: 'rect',
                  padding: 12,
                  font: { size: 11 }
                }
              }
            }
          }
        }));
      }
    }

    // 3. Top 10 RPN 파레토
    if (paretoRef.current) {
      const ctx = paretoRef.current.getContext('2d');
      if (ctx) {
        const labels = ['모터 노후', '전력 부족', '센서 오류', '계획 오류', '품질 편차', '온도 관리', '시간 초과', '재료 결함', '인원 부족', '유지보수'];
        const rpnData = [210, 195, 180, 165, 150, 135, 120, 105, 90, 75];
        const total = rpnData.reduce((a, b) => a + b, 0);
        let cum = 0;
        const cumPct = rpnData.map(v => { cum += v; return Math.round((cum / total) * 100); });

        chartsRef.current.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'RPN',
                data: rpnData,
                backgroundColor: '#3b82f6',
                borderRadius: 2,
                yAxisID: 'y',
                order: 2,
              },
              {
                label: '누적율 (%)',
                data: cumPct,
                type: 'line',
                borderColor: '#ef4444',
                backgroundColor: '#ef4444',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#ef4444',
                tension: 0.3,
                yAxisID: 'y1',
                order: 1,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                align: 'end',
                labels: { usePointStyle: true, pointStyle: 'rect', font: { size: 10 }, padding: 8 }
              }
            },
            scales: {
              x: { ticks: { font: { size: 9 }, maxRotation: 45, minRotation: 45 } },
              y: { position: 'left', beginAtZero: true, max: 250, title: { display: true, text: 'RPN', font: { size: 10 } } },
              y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: '누적률 (%)', font: { size: 10 } } }
            }
          }
        }));
      }
    }

    // 4. Severity 개선 전후
    if (severityRef.current) {
      const ctx = severityRef.current.getContext('2d');
      if (ctx) {
        chartsRef.current.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['개선 전', '개선 후'],
            datasets: [{
              data: [stats.sodComparison.before.s, stats.sodComparison.after.s],
              backgroundColor: ['#f97316', '#22c55e'],
              borderRadius: 4,
              barThickness: 60,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, max: 10, ticks: { stepSize: 2 } },
              x: { ticks: { font: { size: 12, weight: 'bold' } } }
            }
          }
        }));
      }
    }

    // 5. Occurrence 개선 전후
    if (occurrenceRef.current) {
      const ctx = occurrenceRef.current.getContext('2d');
      if (ctx) {
        chartsRef.current.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['개선 전', '개선 후'],
            datasets: [{
              data: [stats.sodComparison.before.o, stats.sodComparison.after.o],
              backgroundColor: ['#facc15', '#22c55e'],
              borderRadius: 4,
              barThickness: 60,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, max: 10, ticks: { stepSize: 2 } },
              x: { ticks: { font: { size: 12, weight: 'bold' } } }
            }
          }
        }));
      }
    }

    // 6. Detection 개선 전후
    if (detectionRef.current) {
      const ctx = detectionRef.current.getContext('2d');
      if (ctx) {
        chartsRef.current.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['개선 전', '개선 후'],
            datasets: [{
              data: [stats.sodComparison.before.d, stats.sodComparison.after.d],
              backgroundColor: ['#a855f7', '#22c55e'],
              borderRadius: 4,
              barThickness: 60,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, max: 10, ticks: { stepSize: 2 } },
              x: { ticks: { font: { size: 12, weight: 'bold' } } }
            }
          }
        }));
      }
    }

    return () => { chartsRef.current.forEach(c => c.destroy()); };
  }, [stats]);

  // 차트 카드 스타일
  const cardStyle = "bg-white rounded-lg shadow-md border border-slate-200 p-4 flex flex-col";
  const titleStyle = "text-sm font-bold text-slate-700 text-center mb-2";

  return (
    <div className="min-h-screen bg-[#4a6fa5]">
      {/* 상단 버튼 바 */}
      <div className="flex items-center gap-3 px-6 py-3">
        <button className="px-4 py-2 bg-[#3b5998] hover:bg-[#2d4373] text-white text-sm font-medium rounded shadow">
          🔄 새로고침
        </button>
        <button className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-sm font-medium rounded shadow">
          📊 리포트 출력
        </button>
        <div className="flex-1" />
        <button className="px-4 py-2 bg-[#3b5998] hover:bg-[#2d4373] text-white text-sm font-medium rounded shadow">
          기간 설정
        </button>
      </div>

      {/* 차트 그리드 (2x3) */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 grid-rows-2 gap-4" style={{ height: 'calc(100vh - 80px)' }}>
          {/* Row 1 */}
          <div className={cardStyle}>
            <div className={titleStyle}>RPN 분포</div>
            <div className="flex-1 relative">
              <canvas ref={rpnDistRef} />
            </div>
          </div>

          <div className={cardStyle}>
            <div className={titleStyle}>개선조치 현황</div>
            <div className="flex-1 relative">
              <canvas ref={improvementRef} />
            </div>
          </div>

          <div className={cardStyle}>
            <div className={titleStyle}>📊 Top 10 RPN 파레토</div>
            <div className="flex-1 relative">
              <canvas ref={paretoRef} />
            </div>
          </div>

          {/* Row 2 */}
          <div className={cardStyle}>
            <div className={titleStyle}>Severity (개선 전후)</div>
            <div className="flex-1 relative">
              <canvas ref={severityRef} />
            </div>
          </div>

          <div className={cardStyle}>
            <div className={titleStyle}>Occurrence (개선 전후)</div>
            <div className="flex-1 relative">
              <canvas ref={occurrenceRef} />
            </div>
          </div>

          <div className={cardStyle}>
            <div className={titleStyle}>Detection (개선 전후)</div>
            <div className="flex-1 relative">
              <canvas ref={detectionRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @file page.tsx
 * @description FMEA Dashboard 메인 페이지
 * 
 * 차트 구성 (2x3 그리드):
 * - AP 분포 (H/M/L)
 * - 개선조치 현황
 * - Top 10 RPN 파레토
 * - Severity 개선 전후
 * - Occurrence 개선 전후
 * - Detection 개선 전후
 */

'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { useDashboardStats, getDemoStats } from './hooks/useDashboardStats';
import { ChartCard } from './components/ChartCard';
import { StatsSummary } from './components/StatsSummary';
import { SODCompareChart } from './components/SODCompareChart';
import { CHART_COLORS } from './types';

// Chart.js 등록
Chart.register(...registerables);

export default function DashboardPage() {
  // 통계 데이터 (실제 데이터 없으면 데모 데이터 사용)
  const liveStats = useDashboardStats();
  const stats = useMemo(() => {
    return liveStats.totalItems > 0 ? liveStats : getDemoStats();
  }, [liveStats]);

  // 차트 레퍼런스
  const apChartRef = useRef<HTMLCanvasElement>(null);
  const improvementChartRef = useRef<HTMLCanvasElement>(null);
  const paretoChartRef = useRef<HTMLCanvasElement>(null);

  // 차트 인스턴스
  const chartsRef = useRef<Chart[]>([]);

  useEffect(() => {
    // 기존 차트 정리
    chartsRef.current.forEach(chart => chart.destroy());
    chartsRef.current = [];

    // 1. AP 분포 차트 (도넛)
    if (apChartRef.current) {
      const ctx = apChartRef.current.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
              data: [
                stats.apDistribution.high,
                stats.apDistribution.medium,
                stats.apDistribution.low
              ],
              backgroundColor: [
                CHART_COLORS.high,
                CHART_COLORS.medium,
                CHART_COLORS.low,
              ],
              borderWidth: 0,
              hoverOffset: 8,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 12,
                  usePointStyle: true,
                  pointStyle: 'circle',
                  font: { size: 11, weight: 'bold' }
                }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const total = stats.apDistribution.total;
                    const pct = ((ctx.raw as number) / total * 100).toFixed(1);
                    return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                  }
                }
              }
            }
          }
        });
        chartsRef.current.push(chart);
      }
    }

    // 2. 개선조치 현황 (도넛)
    if (improvementChartRef.current) {
      const ctx = improvementChartRef.current.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['완료', '진행중', '계획', '지연'],
            datasets: [{
              data: [
                stats.improvementStatus.completed,
                stats.improvementStatus.inProgress,
                stats.improvementStatus.planned,
                stats.improvementStatus.delayed,
              ],
              backgroundColor: [
                CHART_COLORS.completed,
                CHART_COLORS.inProgress,
                CHART_COLORS.planned,
                CHART_COLORS.delayed,
              ],
              borderWidth: 0,
              hoverOffset: 8,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 12,
                  usePointStyle: true,
                  pointStyle: 'circle',
                  font: { size: 11, weight: 'bold' }
                }
              }
            }
          }
        });
        chartsRef.current.push(chart);
      }
    }

    // 3. Top 10 RPN 파레토 차트
    if (paretoChartRef.current) {
      const ctx = paretoChartRef.current.getContext('2d');
      if (ctx) {
        const labels = stats.topRPNItems.map(item => 
          item.failureMode.length > 8 ? item.failureMode.slice(0, 8) + '…' : item.failureMode
        );
        const rpnData = stats.topRPNItems.map(item => item.rpn);
        
        // 누적률 계산
        const total = rpnData.reduce((sum, val) => sum + val, 0);
        let cumulative = 0;
        const cumulativePercent = rpnData.map(val => {
          cumulative += val;
          return Math.round((cumulative / total) * 100);
        });

        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'RPN',
                data: rpnData,
                backgroundColor: stats.topRPNItems.map(item => 
                  item.ap === 'H' ? CHART_COLORS.high :
                  item.ap === 'M' ? CHART_COLORS.medium : CHART_COLORS.low
                ),
                borderRadius: 4,
                yAxisID: 'y',
                order: 2,
              },
              {
                label: '누적률 (%)',
                data: cumulativePercent,
                type: 'line',
                borderColor: '#6366f1',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointBackgroundColor: '#6366f1',
                pointRadius: 4,
                tension: 0.3,
                yAxisID: 'y1',
                order: 1,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                position: 'top',
                align: 'end',
                labels: { 
                  boxWidth: 12,
                  padding: 8,
                  font: { size: 10 }
                }
              },
              tooltip: {
                callbacks: {
                  title: (items) => {
                    const idx = items[0].dataIndex;
                    return stats.topRPNItems[idx]?.name || '';
                  }
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 9 } }
              },
              y: {
                position: 'left',
                beginAtZero: true,
                max: 300,
                title: { display: true, text: 'RPN', font: { size: 10 } },
                ticks: { font: { size: 9 } }
              },
              y1: {
                position: 'right',
                min: 0,
                max: 100,
                title: { display: true, text: '누적 (%)', font: { size: 10 } },
                grid: { drawOnChartArea: false },
                ticks: { font: { size: 9 } }
              }
            }
          }
        });
        chartsRef.current.push(chart);
      }
    }

    return () => {
      chartsRef.current.forEach(chart => chart.destroy());
    };
  }, [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 헤더 - 컴팩트 */}
      <header className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-cyan-900 text-white px-6 py-3">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span className="text-2xl">📊</span>
              FMEA Dashboard
              <span className="ml-2 text-[10px] font-medium bg-cyan-500/30 text-cyan-200 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </h1>
            <span className="text-slate-400 text-xs">| Action Priority & Risk Analysis</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs font-medium transition-all">
              🔄 새로고침
            </button>
            <button className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 rounded text-xs font-semibold transition-all">
              📤 리포트
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="p-4">
        {/* 통계 요약 카드 */}
        <StatsSummary
          totalItems={stats.totalItems}
          highRiskCount={stats.highRiskCount}
          avgRPN={stats.avgRPN}
          improvementRate={stats.improvementRate}
        />

        {/* 차트 그리드 (2행) */}
        <div className="flex flex-col gap-3" style={{ height: 'calc(100vh - 240px)' }}>
          {/* Row 1: 3개 차트 (AP, 개선조치, Pareto) */}
          <div className="flex-1 grid grid-cols-3 gap-3">
            <ChartCard title="AP 분포 (Action Priority)" icon="🎯" accentColor="#ef4444">
              <canvas ref={apChartRef} />
            </ChartCard>

            <ChartCard title="개선조치 현황" icon="📋" accentColor="#10b981">
              <canvas ref={improvementChartRef} />
            </ChartCard>

            <ChartCard title="Top 10 RPN 파레토" icon="📊" accentColor="#6366f1">
              <canvas ref={paretoChartRef} />
            </ChartCard>
          </div>

          {/* Row 2: S/O/D 버터플라이 차트 (전체 폭) */}
          <div className="h-[180px]">
            <ChartCard title="S/O/D 개선 전후 비교" icon="📈" accentColor="#0ea5e9" className="h-full">
              <SODCompareChart data={stats.sodComparison} />
            </ChartCard>
          </div>
        </div>
      </main>

      {/* 상태바 - 미니멀 */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/90 text-slate-500 text-[10px] px-4 py-1 flex justify-between">
        <span>✅ Ready</span>
        <span>{new Date().toLocaleString('ko-KR')}</span>
      </footer>
    </div>
  );
}


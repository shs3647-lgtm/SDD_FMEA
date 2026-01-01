/**
 * @file StatsSummary.tsx
 * @description 대시보드 상단 통계 요약 카드
 */

'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: { value: number; isUp: boolean };
  color: string;
  bgGradient: string;
}

function StatCard({ label, value, icon, trend, color, bgGradient }: StatCardProps) {
  return (
    <div 
      className="relative overflow-hidden rounded-xl p-4 text-white shadow-lg transition-transform hover:scale-[1.02]"
      style={{ background: bgGradient }}
    >
      {/* 배경 패턴 */}
      <div className="absolute -right-4 -top-4 text-6xl opacity-20">
        {icon}
      </div>
      
      <div className="relative z-10">
        <p className="text-sm font-medium opacity-90">{label}</p>
        <p className="text-3xl font-black mt-1 tracking-tight">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${trend.isUp ? 'text-green-200' : 'text-red-200'}`}>
            <span>{trend.isUp ? '▲' : '▼'}</span>
            <span>{Math.abs(trend.value)}% {trend.isUp ? '증가' : '감소'}</span>
          </p>
        )}
      </div>
    </div>
  );
}

interface StatsSummaryProps {
  totalItems: number;
  highRiskCount: number;
  avgRPN: number;
  improvementRate: number;
}

export function StatsSummary({ totalItems, highRiskCount, avgRPN, improvementRate }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <StatCard
        label="전체 항목"
        value={totalItems}
        icon="📊"
        color="#0ea5e9"
        bgGradient="linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
      />
      <StatCard
        label="High Risk (AP:H)"
        value={highRiskCount}
        icon="⚠️"
        trend={{ value: 15, isUp: false }}
        color="#ef4444"
        bgGradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
      />
      <StatCard
        label="평균 RPN"
        value={avgRPN}
        icon="📈"
        trend={{ value: 8, isUp: false }}
        color="#f59e0b"
        bgGradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
      />
      <StatCard
        label="개선 완료율"
        value={`${improvementRate}%`}
        icon="✅"
        trend={{ value: 12, isUp: true }}
        color="#22c55e"
        bgGradient="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
      />
    </div>
  );
}


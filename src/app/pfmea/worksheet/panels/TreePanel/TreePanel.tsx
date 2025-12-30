/**
 * TreePanel - 트리 뷰 패널
 * 
 * 구조분석, 기능분석, 고장분석 트리를 표시
 * 
 * TODO: 기존 page.tsx의 트리 로직을 이곳으로 이전 예정
 */

'use client';

import React from 'react';

interface TreePanelProps {
  state: any;
}

export default function TreePanel({ state }: TreePanelProps) {
  // 탭별 트리 색상
  const getTreeColor = () => {
    if (state.tab === 'structure') return '#1976d2'; // 파란색
    if (state.tab.startsWith('function')) return '#66bb6a'; // 초록색
    if (state.tab.startsWith('failure')) return '#ffa726'; // 주황색
    return '#1976d2';
  };

  // 탭별 트리 제목
  const getTreeTitle = () => {
    if (state.tab === 'structure') return '🌳 구조 트리';
    if (state.tab.startsWith('function')) return '🌳 기능 트리';
    if (state.tab.startsWith('failure')) return '🌳 고장 트리';
    return '🌳 트리';
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: '#f8fafc' 
    }}>
      {/* 트리 헤더 */}
      <div style={{ 
        background: getTreeColor(), 
        color: 'white', 
        padding: '8px 12px', 
        fontSize: '12px', 
        fontWeight: 700,
        flexShrink: 0 
      }}>
        {getTreeTitle()}
      </div>

      {/* 완제품명 표시 */}
      <div style={{ 
        flexShrink: 0, 
        background: '#e3f2fd', 
        padding: '6px 10px', 
        borderBottom: '1px solid #90caf9' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>📦</span>
          <span style={{ fontSize: '12px', fontWeight: 700 }}>
            {state.l1?.name || '(완제품명 입력)'}
          </span>
        </div>
      </div>

      {/* 트리 내용 */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '8px' 
      }}>
        {/* TODO: 기존 트리 로직 이전 */}
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#999',
          fontSize: '12px' 
        }}>
          📋 트리 뷰 구현 예정<br/>
          (Phase 2에서 기존 로직 이전)
        </div>
      </div>
    </div>
  );
}


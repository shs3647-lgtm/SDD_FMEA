/**
 * RPNAnalysis - RPN 분석 뷰
 * 
 * RPN 통계 및 분석 정보 제공
 */

'use client';

import React, { useMemo } from 'react';

interface RPNAnalysisProps {
  state: any;
}

export default function RPNAnalysis({ state }: RPNAnalysisProps) {
  // RPN 통계 계산
  const stats = useMemo(() => {
    const rpnValues: number[] = [];
    
    // failureLinks에서 RPN 추출
    const failureLinks = (state as any).failureLinkUI?.savedLinks || [];
    failureLinks.forEach((link: any) => {
      if (link.severity && link.occurrence && link.detection) {
        rpnValues.push(link.severity * link.occurrence * link.detection);
      }
    });
    
    // L2 공정별 고장형태에서도 RPN 추출
    if (rpnValues.length === 0 && state.l2) {
      state.l2.forEach((proc: any) => {
        (proc.failureModes || []).forEach((fm: any) => {
          if (fm.severity && fm.occurrence && fm.detection) {
            rpnValues.push(fm.severity * fm.occurrence * fm.detection);
          }
        });
      });
    }
    
    if (rpnValues.length === 0) {
      return {
        count: 0,
        max: 0,
        min: 0,
        avg: 0,
        high: 0,    // RPN > 100
        medium: 0,  // 50 < RPN <= 100
        low: 0,     // RPN <= 50
      };
    }
    
    const sorted = [...rpnValues].sort((a, b) => b - a);
    
    return {
      count: rpnValues.length,
      max: sorted[0],
      min: sorted[sorted.length - 1],
      avg: Math.round(rpnValues.reduce((a, b) => a + b, 0) / rpnValues.length),
      high: rpnValues.filter(v => v > 100).length,
      medium: rpnValues.filter(v => v > 50 && v <= 100).length,
      low: rpnValues.filter(v => v <= 50).length,
    };
  }, [state]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: '#f8fafc' 
    }}>
      {/* 헤더 */}
      <div style={{ 
        background: '#17a2b8', 
        color: 'white', 
        padding: '8px 12px', 
        fontSize: '12px', 
        fontWeight: 700,
        flexShrink: 0 
      }}>
        📈 RPN 분석
      </div>

      {/* 통계 카드들 */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto', 
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {stats.count === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#888', 
            padding: '40px 20px',
            fontSize: '12px'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📈</div>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>분석할 RPN 데이터가 없습니다</div>
            <div style={{ fontSize: '11px', color: '#aaa' }}>
              고장분석에서 S/O/D를 입력하세요
            </div>
          </div>
        ) : (
          <>
            {/* 개요 */}
            <div style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              borderRadius: '8px', 
              padding: '12px',
              color: 'white'
            }}>
              <div style={{ fontSize: '10px', opacity: 0.9, marginBottom: '4px' }}>총 RPN 분석 항목</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.count}건</div>
            </div>

            {/* 최대/최소/평균 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr', 
              gap: '8px' 
            }}>
              <div style={{ 
                background: '#dc3545', 
                borderRadius: '6px', 
                padding: '10px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '9px', opacity: 0.9 }}>최대</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{stats.max}</div>
              </div>
              <div style={{ 
                background: '#28a745', 
                borderRadius: '6px', 
                padding: '10px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '9px', opacity: 0.9 }}>최소</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{stats.min}</div>
              </div>
              <div style={{ 
                background: '#6c757d', 
                borderRadius: '6px', 
                padding: '10px',
                color: 'white',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '9px', opacity: 0.9 }}>평균</div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{stats.avg}</div>
              </div>
            </div>

            {/* 위험도 분포 */}
            <div style={{ 
              background: '#fff', 
              borderRadius: '8px', 
              padding: '12px',
              border: '1px solid #e0e0e0'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '10px', color: '#333' }}>
                위험도 분포
              </div>
              
              {/* 높음 (RPN > 100) */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                  <span style={{ color: '#dc3545', fontWeight: 600 }}>🔴 높음 (RPN &gt; 100)</span>
                  <span style={{ fontWeight: 700 }}>{stats.high}건</span>
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(stats.high / stats.count) * 100}%`,
                    background: '#dc3545',
                    borderRadius: '4px',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              {/* 중간 (50 < RPN <= 100) */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                  <span style={{ color: '#ffc107', fontWeight: 600 }}>🟡 중간 (50 &lt; RPN ≤ 100)</span>
                  <span style={{ fontWeight: 700 }}>{stats.medium}건</span>
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(stats.medium / stats.count) * 100}%`,
                    background: '#ffc107',
                    borderRadius: '4px',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              {/* 낮음 (RPN <= 50) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                  <span style={{ color: '#28a745', fontWeight: 600 }}>🟢 낮음 (RPN ≤ 50)</span>
                  <span style={{ fontWeight: 700 }}>{stats.low}건</span>
                </div>
                <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(stats.low / stats.count) * 100}%`,
                    background: '#28a745',
                    borderRadius: '4px',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            </div>

            {/* 권장 조치 */}
            {stats.high > 0 && (
              <div style={{ 
                background: '#fff3cd', 
                borderRadius: '8px', 
                padding: '12px',
                border: '1px solid #ffc107'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#856404', marginBottom: '6px' }}>
                  ⚠️ 권장 조치
                </div>
                <div style={{ fontSize: '10px', color: '#856404' }}>
                  높은 위험도 항목 {stats.high}건에 대해 <br/>
                  예방관리/검출관리 개선이 필요합니다.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

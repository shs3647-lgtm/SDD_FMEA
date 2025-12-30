/**
 * TreePanel - 트리 뷰 패널
 * 
 * 구조분석, 기능분석, 고장분석 트리를 표시
 * page.tsx에서 이전된 트리 로직
 */

'use client';

import React from 'react';

interface TreePanelProps {
  state: any;
  collapsedIds?: Set<string>;
  setCollapsedIds?: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
}

// 구분별 색상 정의 - 네이비 기반 고급스러운 디자인
const TYPE_COLORS: Record<string, { bg: string; light: string; text: string; border: string }> = {
  'Your Plant': { bg: '#1565c0', light: '#e3f2fd', text: '#0d47a1', border: '#1976d2' },
  'Ship to Plant': { bg: '#5c6bc0', light: '#e8eaf6', text: '#3949ab', border: '#5c6bc0' },
  'User': { bg: '#7986cb', light: '#e8eaf6', text: '#3949ab', border: '#7986cb' },
};

// 고장분석 트리 색상 정의 - 네이비 기반
const FAILURE_COLORS = {
  header: '#1a237e',       // 딥 인디고
  headerLight: '#3949ab',  // 인디고
  bg: '#f5f6fc',          // 아주 연한 인디고
  bgAlt: '#e8eaf6',       // 연한 인디고
  text: '#1a237e',        // 딥 인디고 텍스트
  textLight: '#5c6bc0',   // 라이트 인디고 텍스트
  accent: '#7986cb',      // 악센트
  severity: { high: '#ffccbc', highText: '#bf360c', low: '#e8eaf6', lowText: '#3949ab' }
};

// 4M별 색상 정의
const M4_COLORS: Record<string, string> = {
  'MN': '#e3f2fd',
  'MC': '#fff3e0',
  'IM': '#e8f5e9',
  'EN': '#fff3e0',
};

export default function TreePanel({ state, collapsedIds, setCollapsedIds }: TreePanelProps) {
  const tab = state.tab;

  // ========== 구조 트리 (structure) ==========
  if (tab === 'structure') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: '#1976d2', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
          🌳 구조 트리
        </div>
        <div style={{ flexShrink: 0, background: '#e3f2fd', padding: '6px 10px', borderBottom: '1px solid #90caf9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>📦</span>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>{state.l1.name || '(완제품명 입력)'}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#f8fafc' }}>
          {state.l2.filter((p: any) => !p.name.includes('클릭')).map((proc: any) => (
            <div key={proc.id} style={{ marginBottom: '6px', marginLeft: '8px', borderLeft: '2px solid #90caf9', paddingLeft: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px', background: '#e8f5e9', borderRadius: '4px' }}>
                <span>📁</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{proc.no}-{proc.name}</span>
                <span style={{ fontSize: '9px', color: '#888', marginLeft: 'auto', background: '#fff', padding: '1px 6px', borderRadius: '8px' }}>
                  {proc.l3.filter((w: any) => !w.name.includes('추가')).length}
                </span>
              </div>
              <div style={{ marginLeft: '16px' }}>
                {proc.l3.filter((w: any) => !w.name.includes('추가') && !w.name.includes('클릭')).map((w: any) => (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 4px', fontSize: '10px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 700, padding: '0 4px', borderRadius: '2px', background: M4_COLORS[w.m4] || '#e0e0e0' }}>
                      {w.m4}
                    </span>
                    <span>{w.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaed', fontSize: '10px', color: '#666' }}>
          공정: {state.l2.filter((p: any) => !p.name.includes('클릭')).length}개 | 
          작업요소: {state.l2.reduce((sum: number, p: any) => sum + p.l3.filter((w: any) => !w.name.includes('추가')).length, 0)}개
        </div>
      </div>
    );
  }

  // ========== 1L 기능트리 (완제품 기능분석) ==========
  if (tab === 'function-l1') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: '#1b5e20', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
          🎯 1L 기능트리 (완제품)
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#e8f5e9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px', background: '#c8e6c9', borderRadius: '4px', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px' }}>📦</span>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>{state.l1.name || '(완제품명)'}</span>
          </div>
          {state.l1.types.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#888', padding: '16px', textAlign: 'center', background: '#f5f5f5', borderRadius: '4px' }}>
              구분/기능/요구사항을 정의하세요
            </div>
          ) : state.l1.types.map((t: any) => {
            const color = TYPE_COLORS[t.name] || { bg: '#388e3c', light: '#c8e6c9', text: '#1b5e20', border: '#388e3c' };
            return (
              <div key={t.id} style={{ marginLeft: '12px', marginBottom: '8px', borderLeft: `3px solid ${color.border}`, paddingLeft: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'white', padding: '4px 8px', background: color.bg, borderRadius: '3px', marginBottom: '4px' }}>
                  📋 {t.name}
                </div>
                {t.functions.map((f: any) => (
                  <div key={f.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                    <div style={{ fontSize: '10px', color: '#000000', fontWeight: 600, padding: '2px 6px', background: '#fff3e0', borderRadius: '2px' }}>
                      ⚙️ {f.name}
                    </div>
                    {f.requirements.map((r: any) => (
                      <div key={r.id} style={{ marginLeft: '16px', fontSize: '9px', color: '#e65100', fontWeight: 500, padding: '2px 4px', background: '#fff3e0', borderRadius: '2px', marginTop: '2px' }}>
                        • {r.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaed', fontSize: '10px', color: '#666' }}>
          구분: {state.l1.types.length}개 | 
          기능: {state.l1.types.reduce((s: number, t: any) => s + t.functions.length, 0)}개 | 
          요구사항: {state.l1.types.reduce((s: number, t: any) => s + t.functions.reduce((a: number, f: any) => a + f.requirements.length, 0), 0)}개
        </div>
      </div>
    );
  }

  // ========== 2L 기능트리 (메인공정 기능분석) ==========
  if (tab === 'function-l2') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: '#2e7d32', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
          🔧 2L 기능트리 (메인공정)
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#e8f5e9' }}>
          {state.l2.length === 0 ? (
            <div style={{ fontSize: '11px', color: '#888', padding: '16px', textAlign: 'center', background: '#f5f5f5', borderRadius: '4px' }}>
              구조분석에서 공정을 추가하세요
            </div>
          ) : state.l2.map((proc: any) => (
            <div key={proc.id} style={{ marginBottom: '10px', borderLeft: '2px solid #4caf50', paddingLeft: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#1b5e20', padding: '4px 8px', background: '#a5d6a7', borderRadius: '3px', marginBottom: '4px' }}>
                🏭 {proc.no}. {proc.name}
              </div>
              {(proc.functions || []).length === 0 ? (
                <div style={{ fontSize: '10px', color: '#888', marginLeft: '12px', padding: '4px' }}>기능 미정의</div>
              ) : (proc.functions || []).map((f: any) => (
                <div key={f.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '10px', color: '#2e7d32', padding: '2px 6px', background: '#c8e6c9', borderRadius: '2px' }}>
                    ⚙️ {f.name}
                  </div>
                  {(f.productChars || []).map((c: any) => (
                    <div key={c.id} style={{ marginLeft: '16px', fontSize: '9px', color: '#555', padding: '1px 4px' }}>
                      📐 {c.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaed', fontSize: '10px', color: '#666' }}>
          공정: {state.l2.length}개 | 
          기능: {state.l2.reduce((s: number, p: any) => s + (p.functions || []).length, 0)}개 | 
          제품특성: {state.l2.reduce((s: number, p: any) => s + (p.functions || []).reduce((a: number, f: any) => a + (f.productChars || []).length, 0), 0)}개
        </div>
      </div>
    );
  }

  // ========== 3L 기능트리 (작업요소 기능분석) ==========
  if (tab === 'function-l3') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: '#388e3c', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
          🛠️ 3L 기능트리 (작업요소)
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#e8f5e9' }}>
          {state.l2.every((p: any) => (p.l3 || []).length === 0) ? (
            <div style={{ fontSize: '11px', color: '#888', padding: '16px', textAlign: 'center', background: '#f5f5f5', borderRadius: '4px' }}>
              구조분석에서 작업요소를 추가하세요
            </div>
          ) : state.l2.filter((p: any) => (p.l3 || []).length > 0).map((proc: any) => (
            <div key={proc.id} style={{ marginBottom: '10px', borderLeft: '2px solid #4caf50', paddingLeft: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#1b5e20', padding: '4px 8px', background: '#a5d6a7', borderRadius: '3px', marginBottom: '4px' }}>
                🏭 {proc.no}. {proc.name}
              </div>
              {(proc.l3 || []).map((we: any) => (
                <div key={we.id} style={{ marginLeft: '12px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#2e7d32', padding: '2px 6px', background: '#c8e6c9', borderRadius: '2px', marginBottom: '2px' }}>
                    [{we.m4}] {we.name}
                  </div>
                  {(we.functions || []).length === 0 ? (
                    <div style={{ fontSize: '9px', color: '#888', marginLeft: '12px', padding: '2px' }}>기능 미정의</div>
                  ) : (we.functions || []).map((f: any) => (
                    <div key={f.id} style={{ marginLeft: '12px' }}>
                      <div style={{ fontSize: '9px', color: '#2e7d32', padding: '1px 4px' }}>⚙️ {f.name}</div>
                      {(f.processChars || []).map((c: any) => (
                        <div key={c.id} style={{ marginLeft: '12px', fontSize: '8px', color: '#555', padding: '1px 4px' }}>
                          📏 {c.name}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: '1px solid #ccc', background: '#e8eaed', fontSize: '10px', color: '#666' }}>
          작업요소: {state.l2.reduce((s: number, p: any) => s + (p.l3 || []).length, 0)}개 | 
          기능: {state.l2.reduce((s: number, p: any) => s + (p.l3 || []).reduce((a: number, w: any) => a + (w.functions || []).length, 0), 0)}개
        </div>
      </div>
    );
  }

  // ========== 1L 고장영향 트리 (FE) - 네이비 기반 고급 디자인 ==========
  if (tab === 'failure-l1') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: FAILURE_COLORS.header, color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
          ⚠️ 1L 고장영향 트리 (FE)
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: FAILURE_COLORS.bg }}>
          <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px', color: FAILURE_COLORS.text, padding: '4px 8px', background: FAILURE_COLORS.bgAlt, borderRadius: '4px', borderLeft: `3px solid ${FAILURE_COLORS.header}` }}>
            📦 {state.l1.name || '(완제품 공정명)'}
          </div>
          
          {(state.l1.types || []).map((type: any) => (
            <div key={type.id} style={{ marginLeft: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: FAILURE_COLORS.text, padding: '2px 6px', background: FAILURE_COLORS.bgAlt, borderRadius: '3px', marginBottom: '4px', borderLeft: `2px solid ${FAILURE_COLORS.accent}` }}>
                🏷️ {type.name}
              </div>
              
              {(type.functions || []).length === 0 ? (
                <div style={{ marginLeft: '12px', fontSize: '9px', color: '#999', fontStyle: 'italic' }}>(기능 미입력)</div>
              ) : (type.functions || []).map((func: any) => (
                <div key={func.id} style={{ marginLeft: '12px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#2e7d32', padding: '2px 6px', background: '#e8f5e9', borderRadius: '2px', marginBottom: '2px' }}>
                    ⚙️ {func.name}
                  </div>
                  {(func.requirements || []).length === 0 ? (
                    <div style={{ marginLeft: '12px', fontSize: '9px', color: '#999', fontStyle: 'italic' }}>(요구사항 미입력)</div>
                  ) : (func.requirements || []).map((req: any) => {
                    const effects = (state.l1.failureScopes || []).filter((s: any) => s.reqId === req.id);
                    return (
                      <div key={req.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: FAILURE_COLORS.textLight, padding: '1px 4px', background: FAILURE_COLORS.bgAlt, borderRadius: '2px' }}>
                          📋 {req.name}
                        </div>
                        {effects.length === 0 ? (
                          <div style={{ marginLeft: '12px', fontSize: '9px', color: '#aaa', fontStyle: 'italic' }}>(고장영향 미입력)</div>
                        ) : effects.map((eff: any) => (
                          <div key={eff.id} style={{ marginLeft: '12px', fontSize: '9px', color: FAILURE_COLORS.text, display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span>⚡ {eff.effect || '(미입력)'}</span>
                            {eff.severity && (
                              <span style={{ 
                                color: eff.severity >= 8 ? FAILURE_COLORS.severity.highText : FAILURE_COLORS.severity.lowText, 
                                fontWeight: 700,
                                background: eff.severity >= 8 ? FAILURE_COLORS.severity.high : FAILURE_COLORS.severity.low,
                                padding: '0 4px',
                                borderRadius: '2px',
                                fontSize: '8px'
                              }}>
                                S:{eff.severity}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
          
          {(state.l1.types || []).length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', fontSize: '10px', padding: '20px' }}>
              기능분석(L1)에서 구분을 먼저 입력해주세요.
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, padding: '6px 10px', borderTop: `1px solid ${FAILURE_COLORS.bgAlt}`, background: FAILURE_COLORS.bgAlt, fontSize: '10px', color: FAILURE_COLORS.text }}>
          구분: {(state.l1.types || []).length}개 | 
          요구사항: {(state.l1.types || []).reduce((s: number, t: any) => s + (t.functions || []).reduce((a: number, f: any) => a + (f.requirements || []).length, 0), 0)}개 | 
          고장영향: {(state.l1.failureScopes || []).filter((s: any) => s.effect).length}개
        </div>
      </div>
    );
  }

  // ========== 2L 고장형태 트리 (FM) - 네이비 기반 고급 디자인 ==========
  if (tab === 'failure-l2') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: FAILURE_COLORS.header, color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
          🔥 2L 고장형태 트리 (FM)
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: FAILURE_COLORS.bg }}>
          {state.l2.filter((p: any) => p.name && !p.name.includes('클릭')).map((proc: any) => {
            const functions = proc.functions || [];
            return (
              <div key={proc.id} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: FAILURE_COLORS.text, padding: '2px 6px', background: FAILURE_COLORS.bgAlt, borderRadius: '3px', borderLeft: `3px solid ${FAILURE_COLORS.header}` }}>🔧 {proc.no}. {proc.name}</div>
                {functions.length > 0 ? functions.map((f: any) => {
                  const productChars = f.productChars || [];
                  return (
                    <div key={f.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, color: '#2e7d32' }}>📋 {f.name}</div>
                      {productChars.length > 0 ? productChars.map((pc: any) => (
                        <div key={pc.id} style={{ marginLeft: '12px', marginBottom: '2px' }}>
                          <div style={{ fontSize: '9px', color: FAILURE_COLORS.textLight }}>🏷️ {pc.name}</div>
                          {(proc.failureModes || []).filter((m: any) => !pc.name || m.productCharId === pc.id || !m.productCharId).slice(0, 3).map((m: any) => (
                            <div key={m.id} style={{ marginLeft: '12px', fontSize: '9px', color: FAILURE_COLORS.text, display: 'flex', gap: '6px' }}>
                              <span>└ ⚠️ {m.name}</span>
                            </div>
                          ))}
                        </div>
                      )) : (
                        <div style={{ marginLeft: '12px', fontSize: '9px', color: '#999' }}>└ (제품특성 미입력)</div>
                      )}
                    </div>
                  );
                }) : (
                  <div style={{ marginLeft: '12px', fontSize: '9px', color: '#999' }}>└ (메인공정기능 미입력)</div>
                )}
                {functions.length === 0 && (proc.failureModes || []).map((m: any) => (
                  <div key={m.id} style={{ marginLeft: '16px', fontSize: '9px', color: FAILURE_COLORS.text, display: 'flex', gap: '6px' }}>
                    <span>└ ⚠️ {m.name}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ========== 3L 고장원인 트리 (FC) - 네이비 기반 고급 디자인 ==========
  if (tab === 'failure-l3') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ background: FAILURE_COLORS.header, color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
          ⚡ 3L 고장원인 트리 (FC)
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px', background: FAILURE_COLORS.bg }}>
          {state.l2.filter((p: any) => p.name && !p.name.includes('클릭')).map((proc: any) => (
            <div key={proc.id} style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: FAILURE_COLORS.text, padding: '2px 6px', background: FAILURE_COLORS.bgAlt, borderRadius: '3px', borderLeft: `3px solid ${FAILURE_COLORS.header}` }}>🔧 {proc.no}. {proc.name}</div>
              {(proc.l3 || []).filter((w: any) => w.name && !w.name.includes('클릭')).map((we: any) => (
                <div key={we.id} style={{ marginLeft: '12px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: FAILURE_COLORS.textLight }}>
                    [{we.m4}] {we.name}
                  </div>
                  {(we.failureCauses || []).map((c: any) => (
                    <div key={c.id} style={{ marginLeft: '16px', fontSize: '9px', color: '#666', display: 'flex', gap: '8px' }}>
                      <span>└ {c.name}</span>
                      {c.occurrence && (
                        <span style={{ 
                          color: c.occurrence >= 7 ? FAILURE_COLORS.severity.highText : FAILURE_COLORS.severity.lowText, 
                          fontWeight: 700,
                          background: c.occurrence >= 7 ? FAILURE_COLORS.severity.high : FAILURE_COLORS.severity.low,
                          padding: '0 4px',
                          borderRadius: '2px',
                          fontSize: '8px'
                        }}>
                          O:{c.occurrence}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ========== 기본 폴백 ==========
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: '#f8fafc' 
    }}>
      <div style={{ 
        background: '#1976d2', 
        color: 'white', 
        padding: '8px 12px', 
        fontSize: '12px', 
        fontWeight: 700,
        flexShrink: 0 
      }}>
        🌳 트리
      </div>
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        fontSize: '11px',
        color: '#888' 
      }}>
        해당 탭에서는 트리가 표시되지 않습니다
      </div>
    </div>
  );
}

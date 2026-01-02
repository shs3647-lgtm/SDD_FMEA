/**
 * TreePanel - 트리 뷰 패널
 * 구조분석, 기능분석, 고장분석 트리를 표시
 * 
 * @description 인라인 스타일 제거, Tailwind CSS 적용
 * @version 2.0.0
 */

'use client';

import React from 'react';
import { L1_TYPE_COLORS, getL1TypeColor, TREE_FUNCTION, TREE_FAILURE, TREE_STRUCTURE } from '@/styles/level-colors';

interface TreePanelProps {
  state: any;
  collapsedIds?: Set<string>;
  setCollapsedIds?: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
}

/** 4M별 배경색 클래스 */
const M4_BG: Record<string, string> = {
  'MN': 'bg-blue-50',
  'MC': 'bg-orange-50',
  'IM': 'bg-green-50',
  'EN': 'bg-orange-50',
};

/** 공통 스타일 클래스 */
const tw = {
  // 패널 헤더
  header: 'shrink-0 text-white px-3 py-2 text-xs font-bold',
  headerBlue: 'bg-[#1976d2]',
  headerGreen1: 'bg-[#1b5e20]',
  headerGreen2: 'bg-[#2e7d32]',
  headerGreen3: 'bg-[#388e3c]',
  headerNavy: 'bg-[#1a237e]',
  
  // 컨테이너
  container: 'flex flex-col h-full',
  content: 'flex-1 overflow-auto p-2',
  contentGreen: 'bg-green-50',
  contentNavy: 'bg-[#f5f6fc]',
  
  // 푸터
  footer: 'shrink-0 py-1.5 px-2.5 border-t border-gray-300 bg-gray-200 text-[10px] text-gray-600',
  footerNavy: 'shrink-0 py-1.5 px-2.5 border-t border-indigo-100 bg-indigo-50 text-[10px] text-[#1a237e]',
  
  // 트리 아이템
  treeItem: 'flex items-center gap-1.5 p-1 rounded',
  treeBranch: 'mb-1.5 ml-2 border-l-2 border-blue-300 pl-2',
  treeBranchGreen: 'mb-2.5 border-l-2 border-green-500 pl-2',
  
  // 배지
  countBadge: 'text-[9px] text-gray-500 ml-auto bg-white px-1.5 py-0.5 rounded-full',
  m4Badge: 'text-[8px] font-bold px-1 rounded-sm',
  severityBadge: 'text-[8px] font-bold px-1 rounded-sm',
  
  // 텍스트
  textXs: 'text-[10px]',
  textXxs: 'text-[9px]',
  text11: 'text-[11px]',
  fontBold: 'font-bold',
  fontSemibold: 'font-semibold',
  
  // 상태
  empty: 'text-[11px] text-gray-500 p-4 text-center bg-gray-100 rounded',
  emptySmall: 'text-[9px] text-gray-400 italic ml-3',
};

export default function TreePanel({ state }: TreePanelProps) {
  const tab = state.tab;

  // ========== 구조 트리 (structure) ==========
  if (tab === 'structure') {
    return (
      <div className={tw.container}>
        <div className={`${tw.header} ${tw.headerBlue}`}>🌳 구조 트리</div>
        <div className="shrink-0 bg-blue-50 py-1.5 px-2.5 border-b border-blue-200">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📦</span>
            <span className="text-xs font-bold">{state.l1.name || '(완제품명 입력)'}</span>
          </div>
        </div>
        <div className={`${tw.content} bg-slate-50`}>
          {state.l2.filter((p: any) => !p.name.includes('클릭')).map((proc: any) => (
            <div key={proc.id} className={tw.treeBranch}>
              <div className={`${tw.treeItem} bg-green-100`}>
                <span>📁</span>
                <span className={`${tw.text11} ${tw.fontSemibold}`}>{proc.no}-{proc.name}</span>
                <span className={tw.countBadge}>{proc.l3.filter((w: any) => !w.name.includes('추가')).length}</span>
              </div>
              <div className="ml-4">
                {proc.l3.filter((w: any) => !w.name.includes('추가') && !w.name.includes('클릭')).map((w: any) => (
                  <div key={w.id} className={`flex items-center gap-1 py-0.5 px-1 ${tw.textXs}`}>
                    <span className={`${tw.m4Badge} ${M4_BG[w.m4] || 'bg-gray-200'}`}>{w.m4}</span>
                    <span>{w.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={tw.footer}>
          공정: {state.l2.filter((p: any) => !p.name.includes('클릭')).length}개 | 
          작업요소: {state.l2.reduce((sum: number, p: any) => sum + p.l3.filter((w: any) => !w.name.includes('추가')).length, 0)}개
        </div>
      </div>
    );
  }

  // ========== 1L 기능트리 (완제품 기능분석) ==========
  if (tab === 'function-l1') {
    return (
      <div className={tw.container}>
        <div className={`${tw.header} ${tw.headerGreen1}`}>🎯 1L 기능트리 (완제품)</div>
        <div className={`${tw.content} ${tw.contentGreen}`}>
          <div className="flex items-center gap-1.5 p-1.5 bg-green-200 rounded mb-2">
            <span className="text-sm">📦</span>
            <span className="text-xs font-bold">{state.l1.name || '(완제품명)'}</span>
          </div>
          {state.l1.types.length === 0 ? (
            <div className={tw.empty}>구분/기능/요구사항을 정의하세요</div>
          ) : state.l1.types.map((t: any) => {
            // 구분별 색상 적용 (Your Plant=보라, Ship to Plant=주황, User=녹색)
            const typeColor = getL1TypeColor(t.name);
            return (
              <div key={t.id} className="ml-3 mb-2 pl-2" style={{ borderLeft: `2px solid ${typeColor.bg}` }}>
                <div 
                  className={`${tw.text11} ${tw.fontBold} text-white py-1 px-2 rounded-sm mb-1`}
                  style={{ backgroundColor: typeColor.bg }}
                >
                  📋 {t.name}
                </div>
                {t.functions.map((f: any) => (
                  <div key={f.id} className="ml-3 mb-1">
                    <div 
                      className={`${tw.textXs} font-semibold py-0.5 px-1.5 rounded-sm`}
                      style={{ backgroundColor: typeColor.light, color: typeColor.text }}
                    >
                      ⚙️ {f.name}
                    </div>
                    {f.requirements.map((r: any) => (
                      <div 
                        key={r.id} 
                        className={`ml-4 ${tw.textXxs} font-medium py-0.5 px-1 rounded-sm mt-0.5`}
                        style={{ color: typeColor.text }}
                      >
                        • {r.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className={tw.footer}>
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
      <div className={tw.container}>
        <div className={`${tw.header} ${tw.headerGreen2}`}>🔧 2L 기능트리 (메인공정)</div>
        <div className={`${tw.content} ${tw.contentGreen}`}>
          {state.l2.length === 0 ? (
            <div className={tw.empty}>구조분석에서 공정을 추가하세요</div>
          ) : state.l2.map((proc: any) => (
            <div key={proc.id} className={tw.treeBranchGreen}>
              <div 
                className={`${tw.text11} font-semibold py-1 px-2 rounded-sm mb-1`}
                style={{ backgroundColor: TREE_FUNCTION.procBg, color: TREE_FUNCTION.procText, borderLeft: `3px solid ${TREE_FUNCTION.border}` }}
              >
                🏭 {proc.no}. {proc.name}
              </div>
              {(proc.functions || []).length === 0 ? (
                <div className={tw.emptySmall}>기능 미정의</div>
              ) : (proc.functions || []).map((f: any) => (
                <div key={f.id} className="ml-3 mb-1">
                  <div 
                    className={`${tw.textXs} py-0.5 px-1.5 rounded-sm`}
                    style={{ backgroundColor: TREE_FUNCTION.itemBg, color: TREE_FUNCTION.itemText }}
                  >
                    ⚙️ {f.name}
                  </div>
                  {(f.productChars || []).map((c: any) => (
                    <div key={c.id} className={`ml-4 ${tw.textXxs} py-0.5 px-1`} style={{ color: TREE_FUNCTION.itemText }}>
                      📐 {c.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className={tw.footer}>
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
      <div className={tw.container}>
        <div className={`${tw.header} ${tw.headerGreen3}`}>🛠️ 3L 기능트리 (작업요소)</div>
        <div className={`${tw.content} ${tw.contentGreen}`}>
          {state.l2.every((p: any) => (p.l3 || []).length === 0) ? (
            <div className={tw.empty}>구조분석에서 작업요소를 추가하세요</div>
          ) : state.l2.filter((p: any) => (p.l3 || []).length > 0).map((proc: any) => (
            <div key={proc.id} className={tw.treeBranchGreen}>
              <div 
                className={`${tw.text11} font-semibold py-1 px-2 rounded-sm mb-1`}
                style={{ backgroundColor: TREE_FUNCTION.procBg, color: TREE_FUNCTION.procText, borderLeft: `3px solid ${TREE_FUNCTION.border}` }}
              >
                🏭 {proc.no}. {proc.name}
              </div>
              {(proc.l3 || []).map((we: any) => (
                <div key={we.id} className="ml-3 mb-1.5">
                  <div 
                    className={`${tw.textXs} font-semibold py-0.5 px-1.5 rounded-sm mb-0.5`}
                    style={{ backgroundColor: TREE_FUNCTION.itemBg, color: TREE_FUNCTION.itemText }}
                  >
                    [{we.m4}] {we.name}
                  </div>
                  {(we.functions || []).length === 0 ? (
                    <div className={tw.emptySmall}>기능 미정의</div>
                  ) : (we.functions || []).map((f: any) => (
                    <div key={f.id} className="ml-3">
                      <div className={`${tw.textXxs} py-0.5 px-1`} style={{ color: TREE_FUNCTION.itemText }}>⚙️ {f.name}</div>
                      {(f.processChars || []).map((c: any) => (
                        <div key={c.id} className={`ml-3 text-[8px] py-0.5 px-1`} style={{ color: TREE_FUNCTION.itemText }}>
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
        <div className={tw.footer}>
          작업요소: {state.l2.reduce((s: number, p: any) => s + (p.l3 || []).length, 0)}개 | 
          기능: {state.l2.reduce((s: number, p: any) => s + (p.l3 || []).reduce((a: number, w: any) => a + (w.functions || []).length, 0), 0)}개
        </div>
      </div>
    );
  }

  // ========== 1L 고장영향 트리 (FE) ==========
  if (tab === 'failure-l1') {
    return (
      <div className={tw.container}>
        <div className={`${tw.header} ${tw.headerNavy} whitespace-nowrap`}>⚠️ 1L 고장영향 트리 (FE)</div>
        <div className={`${tw.content} ${tw.contentNavy}`}>
          <div className="font-bold text-xs mb-2 text-[#1a237e] p-1 px-2 bg-indigo-100 rounded border-l-[3px] border-[#1a237e]">
            📦 {state.l1.name || '(완제품 공정명)'}
          </div>
          
          {(state.l1.types || []).map((type: any) => {
            // 구분별 색상 적용 (Your Plant=보라, Ship to Plant=주황, User=녹색)
            const typeColor = getL1TypeColor(type.name);
            return (
              <div key={type.id} className="ml-2 mb-2">
                <div 
                  className={`${tw.text11} font-bold py-0.5 px-1.5 rounded-sm mb-1`}
                  style={{ backgroundColor: typeColor.bg, color: '#fff', borderLeft: `2px solid ${typeColor.border}` }}
                >
                  🏷️ {type.name}
                </div>
                
                {(type.functions || []).length === 0 ? (
                  <div className={tw.emptySmall}>(기능 미입력)</div>
                ) : (type.functions || []).map((func: any) => (
                  <div key={func.id} className="ml-3 mb-1.5">
                    <div 
                      className={`${tw.textXs} font-semibold py-0.5 px-1.5 rounded-sm mb-0.5`}
                      style={{ backgroundColor: typeColor.light, color: typeColor.text }}
                    >
                      ⚙️ {func.name}
                    </div>
                    {(func.requirements || []).length === 0 ? (
                      <div className={tw.emptySmall}>(요구사항 미입력)</div>
                    ) : (func.requirements || []).map((req: any) => {
                      const effects = (state.l1.failureScopes || []).filter((s: any) => s.reqId === req.id);
                      return (
                        <div key={req.id} className="ml-3 mb-1">
                          <div 
                            className={`${tw.textXs} font-semibold py-0.5 px-1 rounded-sm`}
                            style={{ color: typeColor.text }}
                          >
                            📋 {req.name}
                          </div>
                          {effects.length === 0 ? (
                            <div className={tw.emptySmall}>(고장영향 미입력)</div>
                          ) : effects.map((eff: any) => (
                            <div key={eff.id} className={`ml-3 ${tw.textXxs} flex gap-1.5 items-center`} style={{ color: typeColor.text }}>
                              <span>⚡ {eff.effect || '(미입력)'}</span>
                              {eff.severity && (
                                <span className={`${tw.severityBadge} ${eff.severity >= 8 ? 'bg-orange-200 text-orange-800' : 'bg-indigo-100 text-indigo-700'}`}>
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
            );
          })}
          
          {(state.l1.types || []).length === 0 && (
            <div className="text-center text-gray-500 text-[10px] p-5">
              기능분석(L1)에서 구분을 먼저 입력해주세요.
            </div>
          )}
        </div>
        <div className={tw.footerNavy}>
          구분: {(state.l1.types || []).length}개 | 
          요구사항: {(state.l1.types || []).reduce((s: number, t: any) => s + (t.functions || []).reduce((a: number, f: any) => a + (f.requirements || []).length, 0), 0)}개 | 
          고장영향: {(state.l1.failureScopes || []).filter((s: any) => s.effect).length}개
        </div>
      </div>
    );
  }

  // ========== 2L 고장형태 트리 (FM) - 확정된 것만 표시 ==========
  if (tab === 'failure-l2') {
    const isL2Confirmed = state.failureL2Confirmed || false;
    
    return (
      <div className={tw.container}>
        <div className={`${tw.header} ${tw.headerNavy}`}>
          🔥 2L 고장형태 트리 (FM) 
          {!isL2Confirmed && <span className="ml-2 text-yellow-300 text-[9px]">(미확정)</span>}
        </div>
        <div className={`${tw.content} ${tw.contentNavy}`}>
          {/* ✅ 확정되지 않으면 안내 메시지 표시 */}
          {!isL2Confirmed && (
            <div className="text-center py-8 text-gray-500 text-xs">
              ⚠️ 2L 고장형태 분석을 완료하고 확정해주세요
            </div>
          )}
          
          {/* ✅ 확정된 경우에만 데이터 표시 */}
          {isL2Confirmed && state.l2.filter((p: any) => p.name && !p.name.includes('클릭')).map((proc: any) => {
            const functions = proc.functions || [];
            const confirmedModes = proc.failureModes || [];
            return (
              <div key={proc.id} className="mb-2.5">
                <div 
                  className={`${tw.textXs} font-bold py-0.5 px-1.5 rounded-sm`}
                  style={{ backgroundColor: TREE_FAILURE.procBg, color: TREE_FAILURE.procText, borderLeft: `3px solid ${TREE_FAILURE.border}` }}
                >
                  🔧 {proc.no}. {proc.name}
                </div>
                {functions.length > 0 ? functions.map((f: any) => {
                  const productChars = f.productChars || [];
                  return (
                    <div key={f.id} className="ml-3 mb-1">
                      <div className={`${tw.textXxs} font-semibold`} style={{ color: TREE_FUNCTION.itemText }}>📋 {f.name}</div>
                      {productChars.length > 0 ? productChars.map((pc: any) => (
                        <div key={pc.id} className="ml-3 mb-0.5">
                          <div className={`${tw.textXxs}`} style={{ color: TREE_FAILURE.itemText }}>🏷️ {pc.name}</div>
                          {confirmedModes.filter((m: any) => !pc.name || m.productCharId === pc.id || !m.productCharId).slice(0, 3).map((m: any) => (
                            <div key={m.id} className={`ml-3 ${tw.textXxs} flex gap-1.5`} style={{ color: TREE_FAILURE.itemText }}>
                              <span>└ ⚠️ {m.name}</span>
                            </div>
                          ))}
                        </div>
                      )) : (
                        <div className={tw.emptySmall}>└ (제품특성 미입력)</div>
                      )}
                    </div>
                  );
                }) : (
                  <div className={tw.emptySmall}>└ (메인공정기능 미입력)</div>
                )}
                {functions.length === 0 && confirmedModes.map((m: any) => (
                  <div key={m.id} className={`ml-4 ${tw.textXxs} flex gap-1.5`} style={{ color: TREE_FAILURE.itemText }}>
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

  // ========== 3L 고장원인 트리 (FC) - 확정된 것만 표시 ==========
  if (tab === 'failure-l3') {
    const isL3Confirmed = state.failureL3Confirmed || false;
    
    return (
      <div className={tw.container}>
        <div className={`${tw.header} ${tw.headerNavy}`}>
          ⚡ 3L 고장원인 트리 (FC)
          {!isL3Confirmed && <span className="ml-2 text-yellow-300 text-[9px]">(미확정)</span>}
        </div>
        <div className={`${tw.content} ${tw.contentNavy}`}>
          {/* ✅ 확정되지 않으면 안내 메시지 표시 */}
          {!isL3Confirmed && (
            <div className="text-center py-8 text-gray-500 text-xs">
              ⚠️ 3L 고장원인 분석을 완료하고 확정해주세요
            </div>
          )}
          
          {/* ✅ 확정된 경우에만 데이터 표시 */}
          {isL3Confirmed && state.l2.filter((p: any) => p.name && !p.name.includes('클릭')).map((proc: any) => (
            <div key={proc.id} className="mb-2">
              <div 
                className={`${tw.textXs} font-bold py-0.5 px-1.5 rounded-sm`}
                style={{ backgroundColor: TREE_FAILURE.procBg, color: TREE_FAILURE.procText, borderLeft: `3px solid ${TREE_FAILURE.border}` }}
              >
                🔧 {proc.no}. {proc.name}
              </div>
              {(proc.l3 || []).filter((w: any) => w.name && !w.name.includes('클릭')).map((we: any) => {
                const confirmedCauses = we.failureCauses || [];
                return (
                  <div key={we.id} className="ml-3 mb-1">
                    <div 
                      className={`${tw.textXxs} font-semibold py-0.5 px-1 rounded-sm`}
                      style={{ backgroundColor: TREE_FAILURE.itemBg, color: TREE_FAILURE.itemText }}
                    >
                      [{we.m4}] {we.name}
                    </div>
                    {confirmedCauses.map((c: any) => (
                      <div key={c.id} className={`ml-4 ${tw.textXxs} flex gap-2`} style={{ color: TREE_FAILURE.itemText }}>
                        <span>└ {c.name}</span>
                        {c.occurrence && (
                          <span className={`${tw.severityBadge} ${c.occurrence >= 7 ? 'bg-orange-200 text-orange-800' : 'bg-orange-100 text-orange-700'}`}>
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
    <div className={`${tw.container} bg-slate-50`}>
      <div className={`${tw.header} ${tw.headerBlue}`}>🌳 트리</div>
      <div className="flex-1 flex justify-center items-center text-[11px] text-gray-500">
        해당 탭에서는 트리가 표시되지 않습니다
      </div>
    </div>
  );
}

/**
 * @file TreePanel.tsx
 * @description FMEA 워크시트 트리 패널 (BaseTreePanel 기반 리팩토링)
 * @version 3.0.0 - 표준화/모듈화
 * @updated 2026-01-03
 */

'use client';

import React from 'react';
import BaseTreePanel, { TreeItem, TreeBranch, TreeLeaf, TreeEmpty, TreeBadge, tw } from './BaseTreePanel';
import { getL1TypeColor, TREE_FUNCTION, TREE_FAILURE } from '@/styles/level-colors';

interface TreePanelProps {
  state: any;
  collapsedIds?: Set<string>;
  setCollapsedIds?: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
}

// 4M 색상
const M4_COLORS: Record<string, { bg: string; text: string }> = {
  MN: { bg: '#ffebee', text: '#d32f2f' },
  MC: { bg: '#e3f2fd', text: '#1565c0' },
  IM: { bg: '#e8f5e9', text: '#2e7d32' },
  EN: { bg: '#fff3e0', text: '#f57c00' },
};

export default function TreePanel({ state }: TreePanelProps) {
  const tab = state.tab;

  // ========== 구조 트리 ==========
  if (tab === 'structure') {
    const s2Count = state.l2.filter((p: any) => p.name && !p.name.includes('클릭')).length;
    const s3Count = state.l2.reduce((sum: number, p: any) => 
      sum + (p.l3 || []).filter((w: any) => w.name && !w.name.includes('추가') && !w.name.includes('클릭')).length, 0);
    
    return (
      <BaseTreePanel config={{
        icon: '🌳',
        title: '구조트리',
        counts: [{ label: '완제품', value: 1 }, { label: '메인공정', value: s2Count }, { label: '작업요소', value: s3Count }],
        theme: 'structure',
        subHeader: { icon: '📦', label: state.l1.name || '(완제품명 입력)', bgColor: '#e3f2fd' },
      }}>
        {state.l2.filter((p: any) => !p.name.includes('클릭')).map((proc: any) => (
          <TreeBranch key={proc.id} borderColor="#93c5fd">
            <TreeItem icon="📁" label={`${proc.no}-${proc.name}`} count={(proc.l3 || []).filter((w: any) => !w.name.includes('추가')).length} bgColor="#dcfce7" />
            <div className="ml-4">
              {(proc.l3 || []).filter((w: any) => !w.name.includes('추가') && !w.name.includes('클릭')).map((w: any) => (
                <TreeLeaf key={w.id} icon="" label={w.name} indent={0} badge={<TreeBadge label={w.m4} bgColor={M4_COLORS[w.m4]?.bg} textColor={M4_COLORS[w.m4]?.text} />} />
              ))}
            </div>
          </TreeBranch>
        ))}
      </BaseTreePanel>
    );
  }

  // ========== 1L 기능트리 ==========
  if (tab === 'function-l1') {
    const funcCount = state.l1.types.reduce((s: number, t: any) => s + (t.functions || []).length, 0);
    const reqCount = state.l1.types.reduce((s: number, t: any) => s + (t.functions || []).reduce((a: number, f: any) => a + (f.requirements || []).length, 0), 0);
    
    return (
      <BaseTreePanel config={{
        icon: '🎯',
        title: '1L 기능트리',
        counts: [{ label: '완제품', value: 1 }, { label: '기능', value: funcCount }, { label: '요구사항', value: reqCount }],
        theme: 'function-l1',
      }}>
        <TreeItem icon="📦" label={state.l1.name || '(완제품명)'} bgColor="#bbf7d0" textColor="#166534" className="mb-2" />
        {state.l1.types.length === 0 ? (
          <TreeEmpty message="구분/기능/요구사항을 정의하세요" />
        ) : state.l1.types.map((t: any) => {
          const typeColor = getL1TypeColor(t.name);
          return (
            <TreeBranch key={t.id} borderColor={typeColor.bg}>
              <TreeItem icon="📋" label={t.name} bgColor={typeColor.bg} textColor="#fff" />
              {t.functions.map((f: any) => (
                <div key={f.id} className="ml-3 mb-1">
                  <TreeLeaf icon="⚙️" label={f.name} bgColor={typeColor.light} textColor={typeColor.text} indent={0} />
                  {f.requirements.map((r: any) => (
                    <TreeLeaf key={r.id} icon="•" label={r.name} bgColor="#fff3e0" textColor="#e65100" indent={4} />
                  ))}
                </div>
              ))}
            </TreeBranch>
          );
        })}
      </BaseTreePanel>
    );
  }

  // ========== 2L 기능트리 ==========
  if (tab === 'function-l2') {
    const procCount = state.l2.filter((p: any) => p.name && !p.name.includes('클릭')).length;
    const funcCount = state.l2.reduce((s: number, p: any) => s + (p.functions || []).length, 0);
    const charCount = state.l2.reduce((s: number, p: any) => s + (p.functions || []).reduce((a: number, f: any) => a + (f.productChars || []).length, 0), 0);
    
    return (
      <BaseTreePanel config={{
        icon: '🔧',
        title: '2L 기능트리',
        counts: [{ label: '공정', value: procCount }, { label: '기능', value: funcCount }, { label: '제품특성', value: charCount }],
        theme: 'function-l2',
      }}>
        {state.l2.length === 0 ? (
          <TreeEmpty message="구조분석에서 공정을 추가하세요" />
        ) : state.l2.map((proc: any) => (
          <TreeBranch key={proc.id} borderColor={TREE_FUNCTION.border}>
            <TreeItem icon="🏭" label={`${proc.no}. ${proc.name}`} bgColor={TREE_FUNCTION.procBg} textColor={TREE_FUNCTION.procText} />
            {(proc.functions || []).length === 0 ? (
              <TreeEmpty message="기능 미정의" small />
            ) : (proc.functions || []).map((f: any) => (
              <div key={f.id} className="ml-3 mb-1">
                <TreeLeaf icon="⚙️" label={f.name} bgColor={TREE_FUNCTION.itemBg} textColor={TREE_FUNCTION.itemText} indent={0} />
                {(f.productChars || []).map((c: any) => (
                  <TreeLeaf 
                    key={c.id} 
                    icon="📐" 
                    label={c.name} 
                    bgColor={c.specialChar ? '#fed7aa' : '#fff7ed'} 
                    textColor="#e65100" 
                    indent={4}
                    badge={c.specialChar && <TreeBadge label={c.specialChar} bgColor="#f97316" textColor="#fff" />}
                  />
                ))}
              </div>
            ))}
          </TreeBranch>
        ))}
      </BaseTreePanel>
    );
  }

  // ========== 3L 기능트리 ==========
  if (tab === 'function-l3') {
    const weCount = state.l2.reduce((s: number, p: any) => s + (p.l3 || []).filter((w: any) => w.name && !w.name.includes('클릭')).length, 0);
    const funcCount = state.l2.reduce((s: number, p: any) => s + (p.l3 || []).reduce((a: number, w: any) => a + (w.functions || []).length, 0), 0);
    const charCount = state.l2.reduce((s: number, p: any) => s + (p.l3 || []).reduce((a: number, w: any) => a + (w.functions || []).reduce((b: number, f: any) => b + (f.processChars || []).length, 0), 0), 0);
    
    return (
      <BaseTreePanel config={{
        icon: '🛠️',
        title: '3L 기능트리',
        counts: [{ label: '작업요소', value: weCount }, { label: '기능', value: funcCount }, { label: '공정특성', value: charCount }],
        theme: 'function-l3',
      }}>
        {state.l2.every((p: any) => (p.l3 || []).length === 0) ? (
          <TreeEmpty message="구조분석에서 작업요소를 추가하세요" />
        ) : state.l2.filter((p: any) => (p.l3 || []).length > 0).map((proc: any) => (
          <TreeBranch key={proc.id} borderColor={TREE_FUNCTION.border}>
            <TreeItem icon="🏭" label={`${proc.no}. ${proc.name}`} bgColor={TREE_FUNCTION.procBg} textColor={TREE_FUNCTION.procText} />
            {(proc.l3 || []).map((we: any) => (
              <div key={we.id} className="ml-3 mb-1.5">
                <TreeLeaf icon="" label={`[${we.m4}] ${we.name}`} bgColor={TREE_FUNCTION.itemBg} textColor={TREE_FUNCTION.itemText} indent={0} />
                {(we.functions || []).length === 0 ? (
                  <TreeEmpty message="기능 미정의" small />
                ) : (we.functions || []).map((f: any) => (
                  <div key={f.id} className="ml-3">
                    <TreeLeaf icon="⚙️" label={f.name} textColor={TREE_FUNCTION.itemText} indent={0} />
                    {(f.processChars || []).map((c: any) => (
                      <TreeLeaf 
                        key={c.id} 
                        icon="📏" 
                        label={c.name} 
                        bgColor={c.specialChar ? '#dbeafe' : undefined}
                        textColor={c.specialChar ? '#1565c0' : TREE_FUNCTION.itemText}
                        indent={3}
                        badge={c.specialChar && <TreeBadge label={c.specialChar} bgColor="#2563eb" textColor="#fff" />}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </TreeBranch>
        ))}
      </BaseTreePanel>
    );
  }

  // ========== 1L 고장영향 트리 ==========
  if (tab === 'failure-l1') {
    const reqCount = (state.l1.types || []).reduce((s: number, t: any) => s + (t.functions || []).reduce((a: number, f: any) => a + (f.requirements || []).length, 0), 0);
    const feCount = (state.l1.failureScopes || []).filter((s: any) => s.effect).length;
    
    return (
      <BaseTreePanel config={{
        icon: '⚠️',
        title: '1L 고장영향',
        counts: [{ label: '요구사항', value: reqCount }, { label: '고장영향', value: feCount }],
        theme: 'failure-l1',
      }}>
        <TreeItem icon="📦" label={state.l1.name || '(완제품 공정명)'} bgColor="#e0e7ff" textColor="#3730a3" className="mb-2 border-l-[3px] border-[#1a237e]" />
        {(state.l1.types || []).length === 0 ? (
          <div className="text-center text-gray-500 text-[10px] p-5">기능분석(L1)에서 구분을 먼저 입력해주세요.</div>
        ) : (state.l1.types || []).map((type: any) => {
          const typeColor = getL1TypeColor(type.name);
          return (
            <div key={type.id} className="ml-2 mb-2">
              <TreeItem icon="🏷️" label={type.name} bgColor={typeColor.bg} textColor="#fff" />
              {(type.functions || []).length === 0 ? (
                <TreeEmpty message="(기능 미입력)" small />
              ) : (type.functions || []).map((func: any) => (
                <div key={func.id} className="ml-3 mb-1.5">
                  <TreeLeaf icon="⚙️" label={func.name} bgColor={typeColor.light} textColor={typeColor.text} indent={0} />
                  {(func.requirements || []).length === 0 ? (
                    <TreeEmpty message="(요구사항 미입력)" small />
                  ) : (func.requirements || []).map((req: any) => {
                    const effects = (state.l1.failureScopes || []).filter((s: any) => s.reqId === req.id);
                    return (
                      <div key={req.id} className="ml-3 mb-1">
                        <TreeLeaf icon="📋" label={req.name} textColor={typeColor.text} indent={0} />
                        {effects.length === 0 ? (
                          <TreeEmpty message="(고장영향 미입력)" small />
                        ) : effects.map((eff: any) => (
                          <TreeLeaf 
                            key={eff.id} 
                            icon="⚡" 
                            label={eff.effect || '(미입력)'} 
                            textColor={typeColor.text} 
                            indent={3}
                            badge={eff.severity && <TreeBadge label={`S:${eff.severity}`} bgColor={eff.severity >= 8 ? '#fed7aa' : '#e0e7ff'} textColor={eff.severity >= 8 ? '#9a3412' : '#4338ca'} />}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </BaseTreePanel>
    );
  }

  // ========== 2L 고장형태 트리 ==========
  if (tab === 'failure-l2') {
    const isL2Confirmed = state.failureL2Confirmed || false;
    const charCount = state.l2.reduce((s: number, p: any) => s + (p.functions || []).reduce((a: number, f: any) => a + (f.productChars || []).length, 0), 0);
    const fmCount = state.l2.reduce((s: number, p: any) => s + (p.failureModes || []).length, 0);
    
    return (
      <BaseTreePanel config={{
        icon: '🔥',
        title: '2L 고장형태',
        counts: [{ label: '제품특성', value: charCount }, { label: '고장형태', value: fmCount }],
        theme: 'failure-l2',
        extra: !isL2Confirmed && <span className="ml-1 text-yellow-300 text-[9px]">(미확정)</span>,
      }}>
        {!isL2Confirmed ? (
          <div className="text-center py-8 text-gray-500 text-xs">⚠️ 2L 고장형태 분석을 완료하고 확정해주세요</div>
        ) : state.l2.filter((p: any) => p.name && !p.name.includes('클릭')).map((proc: any) => {
          const functions = proc.functions || [];
          const confirmedModes = proc.failureModes || [];
          return (
            <div key={proc.id} className="mb-2.5">
              <TreeItem icon="🔧" label={`${proc.no}. ${proc.name}`} bgColor={TREE_FAILURE.procBg} textColor={TREE_FAILURE.procText} className="border-l-[3px] border-[#3949ab]" />
              {functions.length > 0 ? functions.map((f: any) => {
                const productChars = f.productChars || [];
                return (
                  <div key={f.id} className="ml-3 mb-1">
                    <TreeLeaf icon="📋" label={f.name} textColor={TREE_FUNCTION.itemText} indent={0} />
                    {productChars.length > 0 ? productChars.map((pc: any) => (
                      <div key={pc.id} className="ml-3 mb-0.5">
                        <TreeLeaf 
                          icon="🏷️" 
                          label={pc.name} 
                          bgColor={pc.specialChar ? '#fed7aa' : undefined}
                          textColor={pc.specialChar ? '#e65100' : TREE_FAILURE.itemText}
                          indent={0}
                          badge={pc.specialChar && <TreeBadge label={pc.specialChar} bgColor="#f97316" textColor="#fff" />}
                        />
                        {confirmedModes.filter((m: any) => !pc.name || m.productCharId === pc.id || !m.productCharId).slice(0, 3).map((m: any) => (
                          <TreeLeaf key={m.id} icon="└ ⚠️" label={m.name} textColor={TREE_FAILURE.itemText} indent={3} />
                        ))}
                      </div>
                    )) : <TreeEmpty message="└ (제품특성 미입력)" small />}
                  </div>
                );
              }) : <TreeEmpty message="└ (메인공정기능 미입력)" small />}
              {functions.length === 0 && confirmedModes.map((m: any) => (
                <TreeLeaf key={m.id} icon="└ ⚠️" label={m.name} textColor={TREE_FAILURE.itemText} indent={4} />
              ))}
            </div>
          );
        })}
      </BaseTreePanel>
    );
  }

  // ========== 3L 고장원인 트리 ==========
  if (tab === 'failure-l3') {
    const isL3Confirmed = state.failureL3Confirmed || false;
    let processCharCount = 0, failureCauseCount = 0;
    state.l2.forEach((proc: any) => {
      (proc.l3 || []).forEach((we: any) => {
        (we.functions || []).forEach((f: any) => {
          processCharCount += (f.processChars || []).filter((c: any) => c.name).length;
        });
      });
      failureCauseCount += (proc.failureCauses || []).filter((c: any) => c.name).length;
    });
    
    return (
      <BaseTreePanel config={{
        icon: '⚡',
        title: '3L 고장원인 트리 (FC)',
        counts: [{ label: '공정특성', value: processCharCount }, { label: '고장원인', value: failureCauseCount }],
        theme: 'failure-l3',
        extra: !isL3Confirmed && <span className="ml-2 text-yellow-300 text-[9px]">(미확정)</span>,
      }}>
        {!isL3Confirmed ? (
          <div className="text-center py-8 text-gray-500 text-xs">⚠️ 3L 고장원인 분석을 완료하고 확정해주세요</div>
        ) : state.l2.filter((p: any) => p.name && !p.name.includes('클릭')).map((proc: any) => {
          const allCauses = proc.failureCauses || [];
          return (
            <div key={proc.id} className="mb-2">
              <TreeItem icon="🔧" label={`${proc.no}. ${proc.name}`} bgColor={TREE_FAILURE.procBg} textColor={TREE_FAILURE.procText} className="border-l-[3px] border-[#3949ab]" />
              {(proc.l3 || []).filter((w: any) => w.name && !w.name.includes('클릭')).map((we: any) => {
                const processChars: any[] = [];
                (we.functions || []).forEach((f: any) => {
                  (f.processChars || []).forEach((pc: any) => { if (pc.name) processChars.push(pc); });
                });
                return (
                  <div key={we.id} className="ml-3 mb-1">
                    <TreeLeaf icon="" label={`[${we.m4}] ${we.name}`} bgColor={TREE_FAILURE.itemBg} textColor={TREE_FAILURE.itemText} indent={0} />
                    {processChars.map((pc: any) => {
                      const linkedCauses = allCauses.filter((c: any) => c.processCharId === pc.id);
                      return (
                        <div key={pc.id} className="ml-2">
                          <TreeLeaf 
                            icon="└" 
                            label={pc.name} 
                            textColor="#1565c0" 
                            indent={0}
                            badge={pc.specialChar && <TreeBadge label={pc.specialChar} bgColor="#2563eb" textColor="#fff" />}
                          />
                          {linkedCauses.map((c: any) => (
                            <TreeLeaf 
                              key={c.id} 
                              icon="└" 
                              label={c.name} 
                              textColor={TREE_FAILURE.itemText} 
                              indent={4}
                              badge={c.occurrence && <TreeBadge label={`O:${c.occurrence}`} bgColor={c.occurrence >= 7 ? '#fed7aa' : '#ffedd5'} textColor={c.occurrence >= 7 ? '#9a3412' : '#c2410c'} />}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </BaseTreePanel>
    );
  }

  // ========== 기본 폴백 ==========
  return (
    <BaseTreePanel config={{
      icon: '🌳',
      title: '트리',
      counts: [],
      theme: 'structure',
    }}>
      <div className="flex-1 flex justify-center items-center text-[11px] text-gray-500">
        해당 탭에서는 트리가 표시되지 않습니다
      </div>
    </BaseTreePanel>
  );
}

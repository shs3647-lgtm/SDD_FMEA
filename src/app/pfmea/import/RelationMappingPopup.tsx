/**
 * @file RelationMappingPopup.tsx
 * @description 상위-하위 관계 지정 팝업 컴포넌트
 * @author AI Assistant
 * @created 2025-12-26
 * 
 * 사용 흐름:
 * 1. 공정 선택
 * 2. 관계 쌍 선택 (예: A4→A5, B1→B2)
 * 3. 상위 아이템 선택
 * 4. 하위 아이템 선택
 * 5. [연결] 버튼 클릭 → 관계 저장
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Link2, ArrowRight, Check, Trash2 } from 'lucide-react';
import { 
  ImportedFlatData, 
  RelationMapping, 
  RELATION_PAIRS, 
  ITEM_CODE_LABELS 
} from './types';

interface RelationMappingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  processNo: string;
  processName: string;
  flatData: ImportedFlatData[];
  existingMappings: RelationMapping[];
  onSaveMapping: (mapping: RelationMapping) => void;
  onDeleteMapping: (mappingId: string) => void;
}

export default function RelationMappingPopup({
  isOpen,
  onClose,
  processNo,
  processName,
  flatData,
  existingMappings,
  onSaveMapping,
  onDeleteMapping,
}: RelationMappingPopupProps) {
  // 선택된 관계 쌍
  const [selectedPair, setSelectedPair] = useState<typeof RELATION_PAIRS[number] | null>(null);
  
  // 선택된 상위/하위 아이템
  const [selectedParent, setSelectedParent] = useState<ImportedFlatData | null>(null);
  const [selectedChild, setSelectedChild] = useState<ImportedFlatData | null>(null);

  // 현재 공정의 데이터만 필터링
  const processData = useMemo(() => 
    flatData.filter(d => d.processNo === processNo),
    [flatData, processNo]
  );

  // 선택된 쌍의 상위 아이템들
  const parentItems = useMemo(() => {
    if (!selectedPair) return [];
    return processData.filter(d => d.itemCode === selectedPair.parent);
  }, [processData, selectedPair]);

  // 선택된 쌍의 하위 아이템들
  const childItems = useMemo(() => {
    if (!selectedPair) return [];
    return processData.filter(d => d.itemCode === selectedPair.child);
  }, [processData, selectedPair]);

  // 현재 공정의 기존 매핑
  const processMappings = useMemo(() =>
    existingMappings.filter(m => m.processNo === processNo),
    [existingMappings, processNo]
  );

  // 연결 버튼 클릭
  const handleConnect = () => {
    if (!selectedParent || !selectedChild || !selectedPair) return;

    const mapping: RelationMapping = {
      id: `${Date.now()}`,
      processNo,
      parentItemCode: selectedPair.parent,
      parentItemId: selectedParent.id,
      parentValue: selectedParent.value,
      childItemCode: selectedPair.child,
      childItemId: selectedChild.id,
      childValue: selectedChild.value,
      createdAt: new Date(),
      createdBy: 'user',
    };

    onSaveMapping(mapping);
    setSelectedChild(null);
  };

  // 이미 연결되었는지 확인
  const isAlreadyConnected = (parentId: string, childId: string) => {
    return processMappings.some(
      m => m.parentItemId === parentId && m.childItemId === childId
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-[#00587a] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">상위-하위 관계 지정</h2>
            <p className="text-sm opacity-80">공정: {processNo} - {processName}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Step 1: 관계 쌍 선택 */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[#00587a] mb-3">Step 1. 연결할 관계 선택</h3>
            <div className="flex flex-wrap gap-2">
              {RELATION_PAIRS.map((pair) => (
                <button
                  key={`${pair.parent}-${pair.child}`}
                  onClick={() => {
                    setSelectedPair(pair);
                    setSelectedParent(null);
                    setSelectedChild(null);
                  }}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    selectedPair?.parent === pair.parent && selectedPair?.child === pair.child
                      ? 'bg-[#00587a] text-white'
                      : 'bg-[#e0f2fb] text-[#00587a] hover:bg-[#c0e2f0]'
                  }`}
                >
                  {pair.label}
                </button>
              ))}
            </div>
          </div>

          {selectedPair && (
            <>
              {/* Step 2: 아이템 선택 */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* 상위 아이템 */}
                <div>
                  <h3 className="text-sm font-bold text-[#00587a] mb-3">
                    Step 2. 상위 아이템 선택 ({ITEM_CODE_LABELS[selectedPair.parent]})
                  </h3>
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {parentItems.length === 0 ? (
                      <p className="p-4 text-gray-500 text-sm text-center">데이터 없음</p>
                    ) : (
                      parentItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedParent(item)}
                          className={`w-full px-4 py-3 text-left text-sm border-b border-gray-100 last:border-0 transition-colors ${
                            selectedParent?.id === item.id
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-[#e0f2fb]'
                          }`}
                        >
                          <Badge variant="outline" className="mr-2 text-xs">
                            {item.itemCode}
                          </Badge>
                          {item.value}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* 하위 아이템 */}
                <div>
                  <h3 className="text-sm font-bold text-[#00587a] mb-3">
                    Step 3. 하위 아이템 선택 ({ITEM_CODE_LABELS[selectedPair.child]})
                  </h3>
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                    {childItems.length === 0 ? (
                      <p className="p-4 text-gray-500 text-sm text-center">데이터 없음</p>
                    ) : (
                      childItems.map((item) => {
                        const connected = selectedParent && isAlreadyConnected(selectedParent.id, item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => !connected && setSelectedChild(item)}
                            disabled={!!connected}
                            className={`w-full px-4 py-3 text-left text-sm border-b border-gray-100 last:border-0 transition-colors ${
                              connected
                                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                : selectedChild?.id === item.id
                                ? 'bg-green-500 text-white'
                                : 'hover:bg-[#e0f2fb]'
                            }`}
                          >
                            <Badge variant="outline" className="mr-2 text-xs">
                              {item.itemCode}
                            </Badge>
                            {item.value}
                            {connected && <Check className="h-4 w-4 inline ml-2" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* 연결 버튼 */}
              <div className="flex justify-center mb-6">
                <Button
                  onClick={handleConnect}
                  disabled={!selectedParent || !selectedChild}
                  className="bg-[#00587a] hover:bg-[#004560] text-white px-8"
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  연결하기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {/* 기존 매핑 목록 */}
          {processMappings.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#00587a] mb-3">
                연결된 관계 ({processMappings.length}개)
              </h3>
              <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th className="bg-[#00587a] text-white px-3 py-2 text-left" style={{ border: '1px solid #999' }}>상위</th>
                    <th className="bg-[#00587a] text-white px-3 py-2 text-center w-12" style={{ border: '1px solid #999' }}></th>
                    <th className="bg-[#00587a] text-white px-3 py-2 text-left" style={{ border: '1px solid #999' }}>하위</th>
                    <th className="bg-[#00587a] text-white px-3 py-2 text-center w-16" style={{ border: '1px solid #999' }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {processMappings.map((mapping, idx) => (
                    <tr key={mapping.id}>
                      <td className={`px-3 py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        <Badge variant="outline" className="mr-2 text-xs border-blue-500 text-blue-600">
                          {mapping.parentItemCode}
                        </Badge>
                        {mapping.parentValue}
                      </td>
                      <td className={`px-3 py-2 text-center ${idx % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        <ArrowRight className="h-4 w-4 inline text-gray-400" />
                      </td>
                      <td className={`px-3 py-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        <Badge variant="outline" className="mr-2 text-xs border-green-500 text-green-600">
                          {mapping.childItemCode}
                        </Badge>
                        {mapping.childValue}
                      </td>
                      <td className={`px-3 py-2 text-center ${idx % 2 === 0 ? 'bg-white' : 'bg-[#e0f2fb]'}`} style={{ border: '1px solid #999' }}>
                        <button
                          onClick={() => onDeleteMapping(mapping.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button className="bg-[#00587a] hover:bg-[#004560] text-white">
            <Check className="h-4 w-4 mr-2" />
            관계 확정 ({processMappings.length}개)
          </Button>
        </div>
      </div>
    </div>
  );
}


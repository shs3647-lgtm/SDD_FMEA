/**
 * @file LLDSelectModal.tsx
 * @description 습득교훈(LLD) 선택 모달
 * - 리스크분석 화면에서 습득교훈 셀 클릭 시 열림
 * - LLD_No 선택하면 해당 셀에 입력됨
 * - 저장 후 LLD_No 클릭하면 LLD 화면으로 이동
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LLDItem {
  id: string;
  lldNo: string;
  vehicle: string;
  target: string;
  failureMode: string;
  cause: string;
  improvement: string;
  status: 'G' | 'Y' | 'R';
}

interface LLDSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lldNo: string, fmeaId?: string) => void;  // ★ fmeaId 전달
  currentValue?: string;
  fmeaId?: string;  // ★ 현재 FMEA ID (적용결과에 자동 입력)
}

const STATUS_COLORS = {
  G: { bg: '#92D050', text: '#1F2937', label: '완료' },
  Y: { bg: '#FFD966', text: '#1F2937', label: '진행중' },
  R: { bg: '#FF6B6B', text: '#FFFFFF', label: '미완료' },
};

export default function LLDSelectModal({ isOpen, onClose, onSelect, currentValue, fmeaId }: LLDSelectModalProps) {
  const [items, setItems] = useState<LLDItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLldNo, setSelectedLldNo] = useState<string>(currentValue || '');

  // LLD 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadLLDData();
      setSelectedLldNo(currentValue || '');
    }
  }, [isOpen, currentValue]);

  const loadLLDData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lessons-learned');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('LLD 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.lldNo.toLowerCase().includes(search) ||
      item.vehicle.toLowerCase().includes(search) ||
      item.failureMode.toLowerCase().includes(search) ||
      item.cause.toLowerCase().includes(search)
    );
  });

  // 선택 완료
  const handleConfirm = () => {
    if (selectedLldNo) {
      onSelect(selectedLldNo, fmeaId);  // ★ fmeaId 전달
      onClose();
    }
  };

  // LLD 화면으로 이동
  const handleGoToLLD = () => {
    window.open('/pfmea/lessons-learned', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 border-b bg-[#00587a] text-white rounded-t-lg">
          <h2 className="text-base font-bold">📚 습득교훈 선택 (Lessons Learned)</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={handleGoToLLD}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              LLD 화면
            </Button>
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="LLD No, 차종, 고장형태, 원인 검색..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-auto p-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">로딩 중...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              {items.length === 0 ? '등록된 습득교훈이 없습니다.' : '검색 결과가 없습니다.'}
            </div>
          ) : (
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="bg-[#00587a] text-white font-bold p-1 text-center" style={{ border: '1px solid #999', width: 30 }}>선택</th>
                  <th className="bg-[#00587a] text-white font-bold p-1 text-center" style={{ border: '1px solid #999', width: 90 }}>LLD_No</th>
                  <th className="bg-[#00587a] text-white font-bold p-1 text-center" style={{ border: '1px solid #999', width: 50 }}>차종</th>
                  <th className="bg-[#00587a] text-white font-bold p-1 text-center" style={{ border: '1px solid #999', width: 50 }}>대상</th>
                  <th className="bg-[#00587a] text-white font-bold p-1 text-left" style={{ border: '1px solid #999' }}>고장형태</th>
                  <th className="bg-[#00587a] text-white font-bold p-1 text-center" style={{ border: '1px solid #999', width: 40 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const isSelected = selectedLldNo === item.lldNo;
                  const zebraBg = idx % 2 === 0 ? '#fff' : '#e0f2fb';
                  return (
                    <tr 
                      key={item.id}
                      className={`cursor-pointer hover:bg-blue-100 ${isSelected ? 'bg-blue-200' : ''}`}
                      style={{ background: isSelected ? '#bbdefb' : zebraBg }}
                      onClick={() => setSelectedLldNo(item.lldNo)}
                    >
                      <td className="p-1 text-center" style={{ border: '1px solid #999' }}>
                        <input 
                          type="radio" 
                          checked={isSelected} 
                          onChange={() => setSelectedLldNo(item.lldNo)}
                        />
                      </td>
                      <td className="p-1 text-center font-mono font-bold text-[#00587a]" style={{ border: '1px solid #999' }}>
                        {item.lldNo}
                      </td>
                      <td className="p-1 text-center" style={{ border: '1px solid #999' }}>{item.vehicle}</td>
                      <td className="p-1 text-center" style={{ border: '1px solid #999' }}>{item.target}</td>
                      <td className="p-1 text-left" style={{ border: '1px solid #999' }}>{item.failureMode}</td>
                      <td className="p-1 text-center" style={{ border: '1px solid #999' }}>
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{ 
                            backgroundColor: STATUS_COLORS[item.status].bg, 
                            color: STATUS_COLORS[item.status].text 
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-3 border-t flex items-center justify-between bg-gray-50 rounded-b-lg">
          <div className="text-xs text-gray-500">
            {selectedLldNo && <span className="font-bold text-[#00587a]">선택: {selectedLldNo}</span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
            <Button 
              size="sm" 
              className="bg-[#00587a] hover:bg-[#004060]"
              onClick={handleConfirm}
              disabled={!selectedLldNo}
            >
              선택 완료
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * @file SpecialCharMasterModal.tsx
 * @description 특별특성 마스터 등록/관리 모달
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';

export interface SpecialCharMaster {
  id: string;
  customer: string;
  customerSymbol: string;
  internalSymbol: string;
  meaning: string;
  icon?: string;
  color: string;
  partName?: string;
  processName?: string;
  productChar?: string;
  processChar?: string;
  linkDFMEA: boolean;
  linkPFMEA: boolean;
  linkCP: boolean;
  linkPFD: boolean;
}

const DEFAULT_SPECIAL_CHARS: Omit<SpecialCharMaster, 'id' | 'partName' | 'processName' | 'productChar' | 'processChar'>[] = [
  { customer: '현대/기아', customerSymbol: 'IC', internalSymbol: 'SC', meaning: '중요', icon: '◆', color: '#e53935', linkDFMEA: true, linkPFMEA: true, linkCP: true, linkPFD: true },
  { customer: '현대/기아', customerSymbol: 'CC', internalSymbol: 'SC', meaning: '보안', icon: '★', color: '#d32f2f', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'BMW', customerSymbol: 'BM-F', internalSymbol: 'SC', meaning: '사용자건강', icon: '▲', color: '#ff9800', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'BMW', customerSymbol: 'BM-C', internalSymbol: 'SC', meaning: '규제', icon: '●', color: '#f57c00', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'BMW', customerSymbol: 'BM-S', internalSymbol: 'SC', meaning: '사용자안전', icon: '◆', color: '#ef6c00', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'BMW', customerSymbol: 'BM-L', internalSymbol: 'SC', meaning: '법규', icon: '■', color: '#e65100', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'BMW', customerSymbol: 'BM-E', internalSymbol: 'FF', meaning: '경제적손실', icon: '○', color: '#4caf50', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'FORD', customerSymbol: 'CC', internalSymbol: 'SC', meaning: '공정법규', icon: '◆', color: '#1976d2', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'FORD', customerSymbol: 'OS', internalSymbol: 'SC', meaning: '작업자안전', icon: '▲', color: '#1565c0', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'FORD', customerSymbol: 'YC', internalSymbol: 'SC', meaning: '법규관련', icon: '●', color: '#0d47a1', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'FORD', customerSymbol: 'SC', internalSymbol: 'SC', meaning: '품질영향', icon: '■', color: '#2196f3', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'FORD', customerSymbol: 'HI', internalSymbol: 'SC', meaning: '유해환경', icon: '◇', color: '#42a5f5', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
  { customer: 'FORD', customerSymbol: 'YS', internalSymbol: 'FF', meaning: '법규', icon: '○', color: '#66bb6a', linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false },
];

const STYLES = {
  th: { padding: '8px 6px', border: '1px solid #c8e6c9', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' as const, textAlign: 'center' as const },
  td: { padding: '4px 6px', border: '1px solid #e0e0e0', fontSize: '11px', whiteSpace: 'nowrap' as const },
  selectBtn: { width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11px', background: '#fafafa', cursor: 'pointer', textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: { padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: 700, color: 'white', display: 'inline-block' },
  btnLink: { padding: '2px 8px', border: 'none', borderRadius: '3px', fontSize: '10px', cursor: 'pointer', fontWeight: 600 },
};
const linkBtnStyle = (linked: boolean): React.CSSProperties => ({
  ...STYLES.btnLink,
  background: linked ? '#4caf50' : '#e0e0e0',
  color: linked ? 'white' : '#999'
});

// 선택 모달 컴포넌트
function ItemSelectModal({ 
  isOpen, onClose, onSelect, title, items, currentValue 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (value: string) => void; 
  title: string; 
  items: string[]; 
  currentValue: string;
}) {
  const [search, setSearch] = useState('');
  const [newItem, setNewItem] = useState('');
  
  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter(item => item.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[10001] bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg w-[400px] max-h-[500px] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-600 text-white py-3 px-4 rounded-t-lg flex justify-between items-center">
          <span className="font-semibold text-sm">{title}</span>
          <button onClick={onClose} className="bg-transparent border-none text-white text-lg cursor-pointer">×</button>
        </div>
        
        <div className="p-3 border-b border-gray-300">
          <input 
            type="text" 
            placeholder="검색..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded text-xs"
          />
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          {/* 선택 해제 */}
          <div 
            onClick={() => { onSelect(''); onClose(); }}
            className={`py-2 px-3 cursor-pointer rounded text-xs ${!currentValue ? 'bg-blue-50 text-gray-500' : 'text-gray-400'}`}
          >
            (선택 안함)
          </div>
          
          {filteredItems.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => { onSelect(item); onClose(); }}
              className={`py-2 px-3 cursor-pointer rounded text-xs ${currentValue === item ? 'bg-blue-50 font-semibold' : 'font-normal'} hover:bg-gray-100`}
            >
              {item}
            </div>
          ))}
          
          {filteredItems.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-xs">
              검색 결과 없음
            </div>
          )}
        </div>
        
        {/* 신규 추가 */}
        <div className="p-3 border-t border-gray-300 flex gap-2">
          <input 
            type="text" 
            placeholder="신규 항목 입력..." 
            value={newItem} 
            onChange={e => setNewItem(e.target.value)}
            className="flex-1 py-2 px-3 border border-gray-300 rounded text-xs"
          />
          <button 
            onClick={() => { if (newItem.trim()) { onSelect(newItem.trim()); onClose(); } }}
            className="py-2 px-4 bg-green-600 text-white border-none rounded text-xs cursor-pointer"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

interface SpecialCharMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SpecialCharMasterModal({ isOpen, onClose }: SpecialCharMasterModalProps) {
  const [masterData, setMasterData] = useState<SpecialCharMaster[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('전체');
  const [selectModal, setSelectModal] = useState<{ itemId: string; field: 'partName' | 'processName' | 'productChar' | 'processChar'; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FMEA 기초정보(pfmea_master_data)에서 항목 목록 가져오기
  const masterItems = useMemo(() => {
    if (typeof window === 'undefined') return { parts: [], processes: [], productChars: [], processChars: [] };
    
    const parts: string[] = [];
    const processes: string[] = [];
    const productChars: string[] = [];
    const processChars: string[] = [];
    
    // 1. FMEA 기초정보에서 데이터 로드
    try {
      const savedData = localStorage.getItem('pfmea_master_data');
      if (savedData) {
        const flatData = JSON.parse(savedData);
        
        flatData.forEach((item: any) => {
          const value = item.value?.trim();
          if (!value) return;
          
          switch (item.itemCode) {
            case 'A2': // 공정명
              // 공정번호 + 공정명 조합
              const procNo = flatData.find((d: any) => d.processNo === item.processNo && d.itemCode === 'A1')?.value || '';
              const fullName = procNo ? `${procNo}. ${value}` : value;
              if (!processes.includes(fullName)) processes.push(fullName);
              break;
            case 'A4': // 제품특성
              if (!productChars.includes(value)) productChars.push(value);
              break;
            case 'B3': // 공정특성
              if (!processChars.includes(value)) processChars.push(value);
              break;
          }
        });
      }
    } catch (e) {
      console.error('기초정보 로드 오류:', e);
    }
    
    // 2. 워크시트 데이터에서 부품명(완제품명) 로드
    try {
      const worksheetData = localStorage.getItem('pfmea_worksheet_data');
      if (worksheetData) {
        const allData = JSON.parse(worksheetData);
        Object.values(allData).forEach((data: any) => {
          // L1 완제품명
          if (data?.l1?.name && !parts.includes(data.l1.name)) {
            parts.push(data.l1.name);
          }
          // L2 공정에서도 추가
          (data?.l2 || []).forEach((proc: any) => {
            if (proc.name && !proc.name.includes('클릭')) {
              const pName = `${proc.no}. ${proc.name}`;
              if (!processes.includes(pName)) processes.push(pName);
            }
          });
        });
      }
    } catch (e) {
      console.error('워크시트 로드 오류:', e);
    }
    
    // 3. FMEA 프로젝트에서 부품명 로드
    try {
      const projects = localStorage.getItem('pfmea-projects');
      if (projects) {
        const projectList = JSON.parse(projects);
        projectList.forEach((proj: any) => {
          if (proj.partName && !parts.includes(proj.partName)) {
            parts.push(proj.partName);
          }
          if (proj.productName && !parts.includes(proj.productName)) {
            parts.push(proj.productName);
          }
        });
      }
    } catch (e) {
      console.error('프로젝트 로드 오류:', e);
    }
    
    return {
      parts: parts.sort(),
      processes: processes.sort((a, b) => {
        const numA = parseInt(a.split('.')[0]) || 0;
        const numB = parseInt(b.split('.')[0]) || 0;
        return numA - numB;
      }),
      productChars: productChars.sort(),
      processChars: processChars.sort(),
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem('pfmea_special_char_master');
    if (saved) {
      setMasterData(JSON.parse(saved));
    } else {
      const initialData: SpecialCharMaster[] = DEFAULT_SPECIAL_CHARS.map((item, idx) => ({
        ...item, id: `SC_${idx + 1}`, partName: '', processName: '', productChar: '', processChar: '',
      }));
      setMasterData(initialData);
      localStorage.setItem('pfmea_special_char_master', JSON.stringify(initialData));
    }
  }, [isOpen]);

  const saveData = useCallback((data: SpecialCharMaster[]) => {
    setMasterData(data);
    localStorage.setItem('pfmea_special_char_master', JSON.stringify(data));
  }, []);

  const toggleLink = useCallback((id: string, field: 'linkDFMEA' | 'linkPFMEA' | 'linkCP' | 'linkPFD') => {
    saveData(masterData.map(item => item.id === id ? { ...item, [field]: !item[field] } : item));
  }, [masterData, saveData]);

  const updateItem = useCallback((id: string, field: keyof SpecialCharMaster, value: string) => {
    saveData(masterData.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, [masterData, saveData]);

  const addNewItem = useCallback(() => {
    const newItem: SpecialCharMaster = {
      id: `SC_${Date.now()}`, customer: '신규', customerSymbol: '', internalSymbol: 'SC', meaning: '',
      icon: '●', color: '#9e9e9e', partName: '', processName: '', productChar: '', processChar: '',
      linkDFMEA: false, linkPFMEA: false, linkCP: false, linkPFD: false,
    };
    saveData([...masterData, newItem]);
  }, [masterData, saveData]);

  const deleteItem = useCallback((id: string) => {
    if (confirm('삭제하시겠습니까?')) saveData(masterData.filter(item => item.id !== id));
  }, [masterData, saveData]);

  const handleExport = useCallback(() => {
    const exportData = masterData.map(item => ({
      '고객': item.customer, '고객기호': item.customerSymbol, '자사표시': item.internalSymbol, '구분': item.meaning,
      '아이콘': item.icon || '', '색상': item.color, '부품': item.partName || '', '공정': item.processName || '',
      '제품특성': item.productChar || '', '공정특성': item.processChar || '',
      'D-FMEA': item.linkDFMEA ? 'Y' : '', 'P-FMEA': item.linkPFMEA ? 'Y' : '', 'CP': item.linkCP ? 'Y' : '', 'PFD': item.linkPFD ? 'Y' : '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '특별특성');
    ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 6 }];
    XLSX.writeFile(wb, `특별특성_마스터_${new Date().toISOString().slice(0,10)}.xlsx`);
  }, [masterData]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const importedData: SpecialCharMaster[] = jsonData.map((row: any, idx) => ({
        id: `SC_${Date.now()}_${idx}`, customer: row['고객'] || '', customerSymbol: row['고객기호'] || '',
        internalSymbol: row['자사표시'] || 'SC', meaning: row['구분'] || '', icon: row['아이콘'] || '●', color: row['색상'] || '#9e9e9e',
        partName: row['부품'] || '', processName: row['공정'] || '', productChar: row['제품특성'] || '', processChar: row['공정특성'] || '',
        linkDFMEA: row['D-FMEA'] === 'Y', linkPFMEA: row['P-FMEA'] === 'Y', linkCP: row['CP'] === 'Y', linkPFD: row['PFD'] === 'Y',
      }));
      saveData(importedData);
      alert(`${importedData.length}개 항목을 가져왔습니다.`);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }, [saveData]);

  const getSelectItems = (field: string) => {
    switch (field) {
      case 'partName': return masterItems.parts;
      case 'processName': return masterItems.processes;
      case 'productChar': return masterItems.productChars;
      case 'processChar': return masterItems.processChars;
      default: return [];
    }
  };

  const customers = ['전체', ...new Set(masterData.map(d => d.customer))];
  const filteredData = selectedCustomer === '전체' ? masterData : masterData.filter(d => d.customer === selectedCustomer);

  if (!isOpen) return null;

  // 선택 버튼 컴포넌트
  const SelectButton = ({ itemId, field, value, title }: { itemId: string; field: 'partName' | 'processName' | 'productChar' | 'processChar'; value: string; title: string }) => (
    <button 
      onClick={() => setSelectModal({ itemId, field, title })}
      style={STYLES.selectBtn}
    >
      <span className={`overflow-hidden text-ellipsis ${value ? 'text-gray-800' : 'text-gray-400'}`}>{value || title}</span>
      <span className="text-blue-700 text-[10px]">▼</span>
    </button>
  );

  // 헤더 그라데이션 스타일
  const headerGradientStyle: React.CSSProperties = { background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)' };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-white rounded-lg w-[98%] max-w-[1400px] max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        
        <div className="text-white py-3 px-5 flex justify-between items-center" style={headerGradientStyle}>
          <h3 className="m-0 text-[15px] font-bold">★ 특별특성 마스터 등록</h3>
          <button onClick={onClose} className="bg-white/20 border-none text-white w-7 h-7 rounded-full cursor-pointer text-base">×</button>
        </div>

        <div className="py-2 px-4 bg-gray-100 border-b border-gray-300 flex gap-2 items-center flex-wrap">
          <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="py-1.5 px-2.5 border border-gray-300 rounded text-xs">
            {customers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addNewItem} className="py-1.5 px-3 bg-green-600 text-white border-none rounded text-xs cursor-pointer font-semibold">+ 신규</button>
          <span className="text-[11px] text-gray-600 ml-1">총 {filteredData.length}개</span>
          <div className="flex-1" />
          <button onClick={handleExport} className="py-1.5 px-3 bg-blue-700 text-white border-none rounded text-xs cursor-pointer">📥 Export</button>
          <button onClick={() => fileInputRef.current?.click()} className="py-1.5 px-3 bg-orange-500 text-white border-none rounded text-xs cursor-pointer">📤 Import</button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button onClick={() => { saveData(masterData); alert('저장되었습니다.'); onClose(); }} className="py-1.5 px-4 bg-green-800 text-white border-none rounded text-xs cursor-pointer font-semibold">💾 저장</button>
          <button onClick={onClose} className="py-1.5 px-3 bg-gray-500 text-white border-none rounded text-xs cursor-pointer">취소</button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse min-w-[1200px]">
            <thead className="sticky top-0 z-[1]">
              <tr className="bg-green-50">
                <th colSpan={4} className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center bg-green-100 text-green-800">기호등록</th>
                <th colSpan={4} className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center bg-blue-100 text-blue-700">항목등록 (FMEA 기초정보에서 선택)</th>
                <th colSpan={4} className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center bg-purple-100 text-purple-800">연동</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center bg-gray-200">작업</th>
              </tr>
              <tr className="bg-gray-50">
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-20">고객</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-[70px]">기호</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-[50px]">자사</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-20">구분</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-[100px]">부품</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-[120px]">공정</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-[140px]">제품특성</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-[140px]">공정특성</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-[55px]">D-FMEA</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-[55px]">P-FMEA</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-10">CP</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-10">PFD</th>
                <th className="p-2 border border-green-300 text-[11px] font-semibold whitespace-nowrap text-center w-[60px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} className="bg-white">
                  <td style={STYLES.td}>
                    <input type="text" value={item.customer} onChange={e => updateItem(item.id, 'customer', e.target.value)} className="w-full py-1 px-1.5 border border-gray-300 rounded text-[11px]" />
                  </td>
                  <td className="p-1 border border-gray-300 text-[11px] whitespace-nowrap text-center">
                    <span style={{ ...STYLES.badge, background: item.color }}>{item.icon} {item.customerSymbol || '?'}</span>
                  </td>
                  <td className="p-1 border border-gray-300 text-[11px] whitespace-nowrap text-center">
                    <select value={item.internalSymbol} onChange={e => updateItem(item.id, 'internalSymbol', e.target.value)} className="py-0.5 px-1 border border-gray-300 rounded text-[10px]">
                      <option value="SC">SC</option>
                      <option value="FF">FF</option>
                    </select>
                  </td>
                  <td style={STYLES.td}>
                    <input type="text" value={item.meaning} onChange={e => updateItem(item.id, 'meaning', e.target.value)} className="w-full py-1 px-1.5 border border-gray-300 rounded text-[11px]" />
                  </td>
                  <td style={STYLES.td}><SelectButton itemId={item.id} field="partName" value={item.partName || ''} title="부품 선택" /></td>
                  <td style={STYLES.td}><SelectButton itemId={item.id} field="processName" value={item.processName || ''} title="공정 선택" /></td>
                  <td style={STYLES.td}><SelectButton itemId={item.id} field="productChar" value={item.productChar || ''} title="제품특성 선택" /></td>
                  <td style={STYLES.td}><SelectButton itemId={item.id} field="processChar" value={item.processChar || ''} title="공정특성 선택" /></td>
                  <td className="p-1 border border-gray-300 text-[11px] whitespace-nowrap text-center">
                    <button onClick={() => toggleLink(item.id, 'linkDFMEA')} style={linkBtnStyle(item.linkDFMEA)}>{item.linkDFMEA ? '연동' : '-'}</button>
                  </td>
                  <td className="p-1 border border-gray-300 text-[11px] whitespace-nowrap text-center">
                    <button onClick={() => toggleLink(item.id, 'linkPFMEA')} style={linkBtnStyle(item.linkPFMEA)}>{item.linkPFMEA ? '연동' : '-'}</button>
                  </td>
                  <td className="p-1 border border-gray-300 text-[11px] whitespace-nowrap text-center">
                    <button onClick={() => toggleLink(item.id, 'linkCP')} style={linkBtnStyle(item.linkCP)}>{item.linkCP ? '연동' : '-'}</button>
                  </td>
                  <td className="p-1 border border-gray-300 text-[11px] whitespace-nowrap text-center">
                    <button onClick={() => toggleLink(item.id, 'linkPFD')} style={linkBtnStyle(item.linkPFD)}>{item.linkPFD ? '연동' : '-'}</button>
                  </td>
                  <td className="p-1 border border-gray-300 text-[11px] whitespace-nowrap text-center">
                    <select defaultValue="" onChange={(e) => { if (e.target.value === 'delete') deleteItem(item.id); e.target.value = ''; }} className="py-0.5 px-1 border border-gray-300 rounded text-[10px] cursor-pointer">
                      <option value="">수정▼</option>
                      <option value="delete">🗑 삭제</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-2 bg-[#f5f5f5] border-t border-[#e0e0e0]">
          <span className="text-[11px] text-[#666]">💡 SC: Safety/Critical | FF: Fit/Function | 연동 시 해당 문서에 자동 표시</span>
        </div>
      </div>

      {/* 항목 선택 모달 */}
      {selectModal && (
        <ItemSelectModal
          isOpen={!!selectModal}
          onClose={() => setSelectModal(null)}
          onSelect={(value) => updateItem(selectModal.itemId, selectModal.field, value)}
          title={selectModal.title}
          items={getSelectItems(selectModal.field)}
          currentValue={masterData.find(d => d.id === selectModal.itemId)?.[selectModal.field] || ''}
        />
      )}
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

export function getSpecialCharMaster(): SpecialCharMaster[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('pfmea_special_char_master');
  return saved ? JSON.parse(saved) : [];
}

export function matchSpecialChar(charName: string, type: 'product' | 'process'): SpecialCharMaster | null {
  const masterData = getSpecialCharMaster();
  const field = type === 'product' ? 'productChar' : 'processChar';
  return masterData.find(item => item[field] === charName) || null;
}

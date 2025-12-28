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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '8px', width: '400px', maxHeight: '500px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: '#1976d2', color: 'white', padding: '12px 16px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '13px' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer' }}>×</button>
        </div>
        
        <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
          <input 
            type="text" 
            placeholder="검색..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
          />
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {/* 선택 해제 */}
          <div 
            onClick={() => { onSelect(''); onClose(); }}
            style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px', color: '#999', background: !currentValue ? '#e3f2fd' : 'transparent' }}
          >
            (선택 안함)
          </div>
          
          {filteredItems.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => { onSelect(item); onClose(); }}
              style={{ 
                padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px',
                background: currentValue === item ? '#e3f2fd' : 'transparent',
                fontWeight: currentValue === item ? 600 : 400,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={e => (e.currentTarget.style.background = currentValue === item ? '#e3f2fd' : 'transparent')}
            >
              {item}
            </div>
          ))}
          
          {filteredItems.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '12px' }}>
              검색 결과 없음
            </div>
          )}
        </div>
        
        {/* 신규 추가 */}
        <div style={{ padding: '12px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="신규 항목 입력..." 
            value={newItem} 
            onChange={e => setNewItem(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px' }}
          />
          <button 
            onClick={() => { if (newItem.trim()) { onSelect(newItem.trim()); onClose(); } }}
            style={{ padding: '8px 16px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
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
      <span style={{ color: value ? '#333' : '#999', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || title}</span>
      <span style={{ color: '#1976d2', fontSize: '10px' }}>▼</span>
    </button>
  );

  const modalContent = (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '8px', width: '98%', maxWidth: '1400px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        
        <div style={{ background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', padding: '12px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>★ 특별특성 마스터 등록</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>

        <div style={{ padding: '8px 16px', background: '#f5f5f5', borderBottom: '1px solid #e0e0e0', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}>
            {customers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addNewItem} style={{ padding: '6px 12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>+ 신규</button>
          <span style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>총 {filteredData.length}개</span>
          <div style={{ flex: 1 }} />
          <button onClick={handleExport} style={{ padding: '6px 12px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>📥 Export</button>
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '6px 12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>📤 Import</button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} />
          <div style={{ width: '1px', height: '24px', background: '#ccc', margin: '0 4px' }} />
          <button onClick={() => { saveData(masterData); alert('저장되었습니다.'); onClose(); }} style={{ padding: '6px 16px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>💾 저장</button>
          <button onClick={onClose} style={{ padding: '6px 12px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>취소</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ background: '#e8f5e9' }}>
                <th colSpan={4} style={{ ...STYLES.th, background: '#c8e6c9', color: '#2e7d32' }}>기호등록</th>
                <th colSpan={4} style={{ ...STYLES.th, background: '#bbdefb', color: '#1565c0' }}>항목등록 (FMEA 기초정보에서 선택)</th>
                <th colSpan={4} style={{ ...STYLES.th, background: '#e1bee7', color: '#7b1fa2' }}>연동</th>
                <th style={{ ...STYLES.th, background: '#e0e0e0' }}>작업</th>
              </tr>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ ...STYLES.th, width: '80px' }}>고객</th>
                <th style={{ ...STYLES.th, width: '70px' }}>기호</th>
                <th style={{ ...STYLES.th, width: '50px' }}>자사</th>
                <th style={{ ...STYLES.th, width: '80px' }}>구분</th>
                <th style={{ ...STYLES.th, width: '100px' }}>부품</th>
                <th style={{ ...STYLES.th, width: '120px' }}>공정</th>
                <th style={{ ...STYLES.th, width: '140px' }}>제품특성</th>
                <th style={{ ...STYLES.th, width: '140px' }}>공정특성</th>
                <th style={{ ...STYLES.th, width: '55px' }}>D-FMEA</th>
                <th style={{ ...STYLES.th, width: '55px' }}>P-FMEA</th>
                <th style={{ ...STYLES.th, width: '40px' }}>CP</th>
                <th style={{ ...STYLES.th, width: '40px' }}>PFD</th>
                <th style={{ ...STYLES.th, width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <tr key={item.id} style={{ background: 'white' }}>
                  <td style={STYLES.td}>
                    <input type="text" value={item.customer} onChange={e => updateItem(item.id, 'customer', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11px' }} />
                  </td>
                  <td style={{ ...STYLES.td, textAlign: 'center' }}>
                    <span style={{ ...STYLES.badge, background: item.color }}>{item.icon} {item.customerSymbol || '?'}</span>
                  </td>
                  <td style={{ ...STYLES.td, textAlign: 'center' }}>
                    <select value={item.internalSymbol} onChange={e => updateItem(item.id, 'internalSymbol', e.target.value)} style={{ padding: '2px 4px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '10px' }}>
                      <option value="SC">SC</option>
                      <option value="FF">FF</option>
                    </select>
                  </td>
                  <td style={STYLES.td}>
                    <input type="text" value={item.meaning} onChange={e => updateItem(item.id, 'meaning', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '11px' }} />
                  </td>
                  <td style={STYLES.td}><SelectButton itemId={item.id} field="partName" value={item.partName || ''} title="부품 선택" /></td>
                  <td style={STYLES.td}><SelectButton itemId={item.id} field="processName" value={item.processName || ''} title="공정 선택" /></td>
                  <td style={STYLES.td}><SelectButton itemId={item.id} field="productChar" value={item.productChar || ''} title="제품특성 선택" /></td>
                  <td style={STYLES.td}><SelectButton itemId={item.id} field="processChar" value={item.processChar || ''} title="공정특성 선택" /></td>
                  <td style={{ ...STYLES.td, textAlign: 'center' }}>
                    <button onClick={() => toggleLink(item.id, 'linkDFMEA')} style={{ ...STYLES.btnLink, background: item.linkDFMEA ? '#4caf50' : '#e0e0e0', color: item.linkDFMEA ? 'white' : '#999' }}>{item.linkDFMEA ? '연동' : '-'}</button>
                  </td>
                  <td style={{ ...STYLES.td, textAlign: 'center' }}>
                    <button onClick={() => toggleLink(item.id, 'linkPFMEA')} style={{ ...STYLES.btnLink, background: item.linkPFMEA ? '#4caf50' : '#e0e0e0', color: item.linkPFMEA ? 'white' : '#999' }}>{item.linkPFMEA ? '연동' : '-'}</button>
                  </td>
                  <td style={{ ...STYLES.td, textAlign: 'center' }}>
                    <button onClick={() => toggleLink(item.id, 'linkCP')} style={{ ...STYLES.btnLink, background: item.linkCP ? '#4caf50' : '#e0e0e0', color: item.linkCP ? 'white' : '#999' }}>{item.linkCP ? '연동' : '-'}</button>
                  </td>
                  <td style={{ ...STYLES.td, textAlign: 'center' }}>
                    <button onClick={() => toggleLink(item.id, 'linkPFD')} style={{ ...STYLES.btnLink, background: item.linkPFD ? '#4caf50' : '#e0e0e0', color: item.linkPFD ? 'white' : '#999' }}>{item.linkPFD ? '연동' : '-'}</button>
                  </td>
                  <td style={{ ...STYLES.td, textAlign: 'center' }}>
                    <select defaultValue="" onChange={(e) => { if (e.target.value === 'delete') deleteItem(item.id); e.target.value = ''; }} style={{ padding: '2px 4px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>
                      <option value="">수정▼</option>
                      <option value="delete">🗑 삭제</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '8px 16px', background: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
          <span style={{ fontSize: '11px', color: '#666' }}>💡 SC: Safety/Critical | FF: Fit/Function | 연동 시 해당 문서에 자동 표시</span>
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

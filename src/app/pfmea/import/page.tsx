/**
 * @file page.tsx
 * @description PFMEA 기초정보 Excel Import 메인 페이지
 * @author AI Assistant
 * @created 2025-12-26
 * @updated 2025-12-26 - 설계안 이미지 기반 완전 재구현
 * 
 * 테이블 디자인:
 * - 헤더: #00587a (진한 남청색) + 흰색 글자
 * - 첫 번째 열: #00587a + 흰색 글자
 * - 데이터 행: 흰색 배경
 * - 테두리: 1px solid #999
 */

'use client';

import { useState, useRef } from 'react';
import { GripVertical, Save } from 'lucide-react';
import { ImportedFlatData } from './types';
import { parseMultiSheetExcel, ParseResult } from './excel-parser';
import { downloadEmptyTemplate, downloadSampleTemplate } from './excel-template';

// 샘플 데이터 20행 (PFMEA기초정보입력.xlsx 기반)
const SAMPLE_DATA: ImportedFlatData[] = [
  // 공정 10 - 입고검사
  { id: '10-A1', processNo: '10', category: 'A', itemCode: 'A1', value: '10', createdAt: new Date() },
  { id: '10-A2', processNo: '10', category: 'A', itemCode: 'A2', value: '입고검사', createdAt: new Date() },
  { id: '10-A3', processNo: '10', category: 'A', itemCode: 'A3', value: '원자재 품질 검사', createdAt: new Date() },
  { id: '10-A4', processNo: '10', category: 'A', itemCode: 'A4', value: '외관, 치수, 재질', createdAt: new Date() },
  { id: '10-A5', processNo: '10', category: 'A', itemCode: 'A5', value: '불량품 입고', createdAt: new Date() },
  { id: '10-A6', processNo: '10', category: 'A', itemCode: 'A6', value: '수입검사 체크시트', createdAt: new Date() },
  { id: '10-B1', processNo: '10', category: 'B', itemCode: 'B1', value: '측정기, 검사대', createdAt: new Date() },
  { id: '10-B2', processNo: '10', category: 'B', itemCode: 'B2', value: '치수측정, 외관검사', createdAt: new Date() },
  { id: '10-B3', processNo: '10', category: 'B', itemCode: 'B3', value: '검사정밀도', createdAt: new Date() },
  { id: '10-B4', processNo: '10', category: 'B', itemCode: 'B4', value: '검사누락, 오판정', createdAt: new Date() },
  { id: '10-B5', processNo: '10', category: 'B', itemCode: 'B5', value: '검사교육, 체크시트', createdAt: new Date() },
  // 공정 20 - 전처리
  { id: '20-A1', processNo: '20', category: 'A', itemCode: 'A1', value: '20', createdAt: new Date() },
  { id: '20-A2', processNo: '20', category: 'A', itemCode: 'A2', value: '전처리', createdAt: new Date() },
  { id: '20-A3', processNo: '20', category: 'A', itemCode: 'A3', value: '표면 세척 및 탈지', createdAt: new Date() },
  { id: '20-A4', processNo: '20', category: 'A', itemCode: 'A4', value: '청정도, 탈지율', createdAt: new Date() },
  { id: '20-A5', processNo: '20', category: 'A', itemCode: 'A5', value: '잔류이물, 탈지불량', createdAt: new Date() },
  { id: '20-A6', processNo: '20', category: 'A', itemCode: 'A6', value: '청정도 측정', createdAt: new Date() },
  { id: '20-B1', processNo: '20', category: 'B', itemCode: 'B1', value: '세척기, 탈지조', createdAt: new Date() },
  { id: '20-B2', processNo: '20', category: 'B', itemCode: 'B2', value: '세척, 탈지', createdAt: new Date() },
  { id: '20-B3', processNo: '20', category: 'B', itemCode: 'B3', value: '온도, 농도, 시간', createdAt: new Date() },
  { id: '20-B4', processNo: '20', category: 'B', itemCode: 'B4', value: '온도편차, 농도부족', createdAt: new Date() },
  { id: '20-B5', processNo: '20', category: 'B', itemCode: 'B5', value: '정기점검, 농도관리', createdAt: new Date() },
  // 공정 30 - 가공
  { id: '30-A1', processNo: '30', category: 'A', itemCode: 'A1', value: '30', createdAt: new Date() },
  { id: '30-A2', processNo: '30', category: 'A', itemCode: 'A2', value: '가공', createdAt: new Date() },
  { id: '30-A3', processNo: '30', category: 'A', itemCode: 'A3', value: 'CNC 절삭가공', createdAt: new Date() },
  { id: '30-A4', processNo: '30', category: 'A', itemCode: 'A4', value: '치수정밀도, 표면조도', createdAt: new Date() },
  { id: '30-A5', processNo: '30', category: 'A', itemCode: 'A5', value: '치수불량, 조도불량', createdAt: new Date() },
  { id: '30-A6', processNo: '30', category: 'A', itemCode: 'A6', value: '초중종품검사', createdAt: new Date() },
  { id: '30-B1', processNo: '30', category: 'B', itemCode: 'B1', value: 'CNC선반, 공구', createdAt: new Date() },
  { id: '30-B2', processNo: '30', category: 'B', itemCode: 'B2', value: '절삭, 가공', createdAt: new Date() },
  { id: '30-B3', processNo: '30', category: 'B', itemCode: 'B3', value: '이송속도, 절삭깊이', createdAt: new Date() },
  { id: '30-B4', processNo: '30', category: 'B', itemCode: 'B4', value: '공구마모, 셋팅오류', createdAt: new Date() },
  { id: '30-B5', processNo: '30', category: 'B', itemCode: 'B5', value: '공구교환주기, TPM', createdAt: new Date() },
  // 공정 40 - 열처리
  { id: '40-A1', processNo: '40', category: 'A', itemCode: 'A1', value: '40', createdAt: new Date() },
  { id: '40-A2', processNo: '40', category: 'A', itemCode: 'A2', value: '열처리', createdAt: new Date() },
  { id: '40-A3', processNo: '40', category: 'A', itemCode: 'A3', value: '담금질/뜨임', createdAt: new Date() },
  { id: '40-A4', processNo: '40', category: 'A', itemCode: 'A4', value: '경도, 조직', createdAt: new Date() },
  { id: '40-A5', processNo: '40', category: 'A', itemCode: 'A5', value: '경도미달, 변형', createdAt: new Date() },
  { id: '40-A6', processNo: '40', category: 'A', itemCode: 'A6', value: '경도검사, 조직검사', createdAt: new Date() },
  { id: '40-B1', processNo: '40', category: 'B', itemCode: 'B1', value: '열처리로, 냉각조', createdAt: new Date() },
  { id: '40-B2', processNo: '40', category: 'B', itemCode: 'B2', value: '가열, 냉각', createdAt: new Date() },
  { id: '40-B3', processNo: '40', category: 'B', itemCode: 'B3', value: '온도, 시간, 냉각속도', createdAt: new Date() },
  { id: '40-B4', processNo: '40', category: 'B', itemCode: 'B4', value: '온도이탈, 시간부족', createdAt: new Date() },
  { id: '40-B5', processNo: '40', category: 'B', itemCode: 'B5', value: '온도모니터링, 정기교정', createdAt: new Date() },
  // 공정 50 - 조립
  { id: '50-A1', processNo: '50', category: 'A', itemCode: 'A1', value: '50', createdAt: new Date() },
  { id: '50-A2', processNo: '50', category: 'A', itemCode: 'A2', value: '조립', createdAt: new Date() },
  { id: '50-A3', processNo: '50', category: 'A', itemCode: 'A3', value: '부품결합/체결', createdAt: new Date() },
  { id: '50-A4', processNo: '50', category: 'A', itemCode: 'A4', value: '체결력, 위치정도', createdAt: new Date() },
  { id: '50-A5', processNo: '50', category: 'A', itemCode: 'A5', value: '미체결, 오조립', createdAt: new Date() },
  { id: '50-A6', processNo: '50', category: 'A', itemCode: 'A6', value: '토크검사, 외관검사', createdAt: new Date() },
  { id: '50-B1', processNo: '50', category: 'B', itemCode: 'B1', value: '토크렌치, 지그', createdAt: new Date() },
  { id: '50-B2', processNo: '50', category: 'B', itemCode: 'B2', value: '체결, 정렬', createdAt: new Date() },
  { id: '50-B3', processNo: '50', category: 'B', itemCode: 'B3', value: '토크값, 체결순서', createdAt: new Date() },
  { id: '50-B4', processNo: '50', category: 'B', itemCode: 'B4', value: '토크부족, 순서누락', createdAt: new Date() },
  { id: '50-B5', processNo: '50', category: 'B', itemCode: 'B5', value: '작업표준서, 포카요케', createdAt: new Date() },
  // 완제품 정보
  { id: 'C1-1', processNo: 'ALL', category: 'C', itemCode: 'C1', value: '자동차 부품 A', createdAt: new Date() },
  { id: 'C2-1', processNo: 'ALL', category: 'C', itemCode: 'C2', value: '동력전달', createdAt: new Date() },
  { id: 'C3-1', processNo: 'ALL', category: 'C', itemCode: 'C3', value: '내구성 10만km', createdAt: new Date() },
  { id: 'C4-1', processNo: 'ALL', category: 'C', itemCode: 'C4', value: '차량정지, 안전사고', createdAt: new Date() },
];

// 드롭다운 항목
const PREVIEW_OPTIONS = [
  { value: 'A1', label: 'A1 공정번호' },
  { value: 'A2', label: 'A2 공정명' },
  { value: 'A3', label: 'A3 공정기능' },
  { value: 'A4', label: 'A4 제품특성' },
  { value: 'A5', label: 'A5 고장형태' },
  { value: 'A6', label: 'A6 검출관리' },
  { value: 'B1', label: 'B1 작업요소' },
  { value: 'B2', label: 'B2 요소기능' },
  { value: 'B3', label: 'B3 공정특성' },
  { value: 'B4', label: 'B4 고장원인' },
  { value: 'B5', label: 'B5 예방관리' },
  { value: 'C1', label: 'C1 제품명' },
  { value: 'C2', label: 'C2 제품기능' },
  { value: 'C3', label: 'C3 요구사항' },
  { value: 'C4', label: 'C4 고장영향' },
];

export default function PFMEAImportPage() {
  // 상태 관리 - 샘플 데이터로 초기화
  const [importType, setImportType] = useState<'full' | 'partial'>('full');
  const [fileName, setFileName] = useState<string>('샘플데이터.xlsx');
  const [flatData, setFlatData] = useState<ImportedFlatData[]>(SAMPLE_DATA);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  
  // 좌측 미리보기
  const [previewColumn, setPreviewColumn] = useState('A2');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // 우측 관계형 탭
  const [relationTab, setRelationTab] = useState<'A' | 'B' | 'C'>('A');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 핸들러
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsParsing(true);
    
    try {
      const result = await parseMultiSheetExcel(file);
      setParseResult(result);
      
      // Flat 데이터 생성
      const flat: ImportedFlatData[] = [];
      result.processes.forEach((p) => {
        flat.push({ id: `${p.processNo}-A1`, processNo: p.processNo, category: 'A', itemCode: 'A1', value: p.processNo, createdAt: new Date() });
        flat.push({ id: `${p.processNo}-A2`, processNo: p.processNo, category: 'A', itemCode: 'A2', value: p.processName, createdAt: new Date() });
        p.processDesc.forEach((v, i) => flat.push({ id: `${p.processNo}-A3-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A3', value: v, createdAt: new Date() }));
        p.productChars.forEach((v, i) => flat.push({ id: `${p.processNo}-A4-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A4', value: v, createdAt: new Date() }));
        p.failureModes.forEach((v, i) => flat.push({ id: `${p.processNo}-A5-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A5', value: v, createdAt: new Date() }));
        p.detectionCtrls.forEach((v, i) => flat.push({ id: `${p.processNo}-A6-${i}`, processNo: p.processNo, category: 'A', itemCode: 'A6', value: v, createdAt: new Date() }));
        p.workElements.forEach((v, i) => flat.push({ id: `${p.processNo}-B1-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B1', value: v, createdAt: new Date() }));
        p.elementFuncs.forEach((v, i) => flat.push({ id: `${p.processNo}-B2-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B2', value: v, createdAt: new Date() }));
        p.processChars.forEach((v, i) => flat.push({ id: `${p.processNo}-B3-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B3', value: v, createdAt: new Date() }));
        p.failureCauses.forEach((v, i) => flat.push({ id: `${p.processNo}-B4-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B4', value: v, createdAt: new Date() }));
        p.preventionCtrls.forEach((v, i) => flat.push({ id: `${p.processNo}-B5-${i}`, processNo: p.processNo, category: 'B', itemCode: 'B5', value: v, createdAt: new Date() }));
      });
      result.products.forEach((p) => {
        flat.push({ id: `C1-${p.productProcessName}`, processNo: 'ALL', category: 'C', itemCode: 'C1', value: p.productProcessName, createdAt: new Date() });
        p.productFuncs.forEach((v, i) => flat.push({ id: `C2-${p.productProcessName}-${i}`, processNo: 'ALL', category: 'C', itemCode: 'C2', value: v, createdAt: new Date() }));
        p.requirements.forEach((v, i) => flat.push({ id: `C3-${p.productProcessName}-${i}`, processNo: 'ALL', category: 'C', itemCode: 'C3', value: v, createdAt: new Date() }));
        p.failureEffects.forEach((v, i) => flat.push({ id: `C4-${p.productProcessName}-${i}`, processNo: 'ALL', category: 'C', itemCode: 'C4', value: v, createdAt: new Date() }));
      });
      setFlatData(flat);
    } catch (error) {
      console.error('파싱 오류:', error);
    } finally {
      setIsParsing(false);
    }
  };

  // 미리보기 데이터 필터링
  const previewData = flatData.filter(d => d.itemCode === previewColumn);
  
  // 통계 계산
  const stats = {
    total: flatData.length,
    processCount: new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo)).size,
    aCount: flatData.filter(d => d.itemCode.startsWith('A')).length,
    bCount: flatData.filter(d => d.itemCode.startsWith('B')).length,
    cCount: flatData.filter(d => d.itemCode.startsWith('C')).length,
    missing: flatData.filter(d => !d.value || d.value.trim() === '').length,
  };

  // 관계형 데이터 필터링
  const getRelationData = () => {
    if (relationTab === 'A') {
      const processes = [...new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo))];
      return processes.map(pNo => ({
        A1: pNo,
        A2: flatData.find(d => d.processNo === pNo && d.itemCode === 'A2')?.value || '',
        A3: flatData.find(d => d.processNo === pNo && d.itemCode === 'A3')?.value || '',
        A4: flatData.find(d => d.processNo === pNo && d.itemCode === 'A4')?.value || '',
        A5: flatData.find(d => d.processNo === pNo && d.itemCode === 'A5')?.value || '',
        A6: flatData.find(d => d.processNo === pNo && d.itemCode === 'A6')?.value || '',
      }));
    } else if (relationTab === 'B') {
      const processes = [...new Set(flatData.filter(d => d.itemCode === 'A1').map(d => d.processNo))];
      return processes.map(pNo => ({
        A1: pNo,
        B1: flatData.find(d => d.processNo === pNo && d.itemCode === 'B1')?.value || '',
        B2: flatData.find(d => d.processNo === pNo && d.itemCode === 'B2')?.value || '',
        B3: flatData.find(d => d.processNo === pNo && d.itemCode === 'B3')?.value || '',
        B4: flatData.find(d => d.processNo === pNo && d.itemCode === 'B4')?.value || '',
        B5: flatData.find(d => d.processNo === pNo && d.itemCode === 'B5')?.value || '',
      }));
    } else {
      const products = flatData.filter(d => d.itemCode === 'C1');
      return products.map(p => ({
        A1: p.processNo,
        C1: p.value,
        C2: flatData.find(d => d.itemCode === 'C2')?.value || '',
        C3: flatData.find(d => d.itemCode === 'C3')?.value || '',
        C4: flatData.find(d => d.itemCode === 'C4')?.value || '',
        note: '',
      }));
    }
  };

  const relationData = getRelationData();

  // 테이블 스타일 - 행 높이 40px로 통일
  const ROW_HEIGHT = '40px';
  const headerStyle = { background: '#00587a', color: 'white', border: '1px solid #999', padding: '10px 12px', fontWeight: 'bold', textAlign: 'center' as const, whiteSpace: 'nowrap' as const, height: ROW_HEIGHT };
  const rowHeaderStyle = { background: '#00587a', color: 'white', border: '1px solid #999', padding: '10px 12px', fontWeight: 'bold', whiteSpace: 'nowrap' as const, height: ROW_HEIGHT };
  const cellStyle = { background: 'white', border: '1px solid #999', padding: '10px 12px', whiteSpace: 'nowrap' as const, height: ROW_HEIGHT };
  const lightBlueStyle = { background: '#e0f2fb', border: '1px solid #999', padding: '10px 12px', whiteSpace: 'nowrap' as const, height: ROW_HEIGHT };
  const tableWrapperStyle = { borderRadius: '8px', overflow: 'hidden', border: '1px solid #999' };
  const sectionTitleStyle = { fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#00587a' };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh', fontFamily: '"Malgun Gothic", sans-serif' }}>
      {/* 제목 */}
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#00587a', marginBottom: '16px' }}>
        PFMEA 기초정보 Excel Import
      </h1>

      {/* 상단: 기초정보 테이블 */}
      <div style={tableWrapperStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={headerStyle}>구분</th>
            <th colSpan={6} style={headerStyle}>기초정보</th>
            <th style={headerStyle}>빈템플렛</th>
            <th style={headerStyle}>샘플템플렛</th>
          </tr>
        </thead>
        <tbody>
          {/* 공통요소 */}
          <tr>
            <td style={rowHeaderStyle}>공통요소</td>
            <td style={cellStyle}>A0 사람</td>
            <td style={cellStyle}>A0 부자재</td>
            <td style={cellStyle}>A0 작업환경</td>
            <td style={cellStyle}></td>
            <td style={cellStyle}></td>
            <td style={cellStyle}></td>
            <td rowSpan={4} style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'middle' }}>
              <button 
                onClick={() => downloadEmptyTemplate()}
                style={{ padding: '8px 16px', background: '#00587a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                빈템플렛
              </button>
            </td>
            <td rowSpan={4} style={{ ...cellStyle, textAlign: 'center', verticalAlign: 'middle' }}>
              <button 
                onClick={() => downloadSampleTemplate()}
                style={{ padding: '8px 16px', background: '#00587a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                샘플템플렛
              </button>
            </td>
          </tr>
          {/* A 공정 */}
          <tr>
            <td style={rowHeaderStyle}>A 공정</td>
            <td style={cellStyle}>A1 공정번호</td>
            <td style={cellStyle}>A2 공정명</td>
            <td style={cellStyle}>A3 공정기능(설명)</td>
            <td style={cellStyle}>A4 제품특성</td>
            <td style={cellStyle}>A5 고장형태</td>
            <td style={cellStyle}>A6 검출관리</td>
          </tr>
          {/* B 작업요소 */}
          <tr>
            <td style={rowHeaderStyle}>B 작업요소</td>
            <td style={cellStyle}>B1 작업요소(설비)</td>
            <td style={cellStyle}>B2 작업요소기능</td>
            <td style={cellStyle}>B3 공정특성</td>
            <td style={cellStyle}>B4 고장원인</td>
            <td style={cellStyle}>B5 예방관리</td>
            <td style={cellStyle}></td>
          </tr>
          {/* C 완(반)제품 */}
          <tr>
            <td style={rowHeaderStyle}>C 완(반)제품</td>
            <td style={cellStyle}>C1 제품(반) 명</td>
            <td style={cellStyle}>C2 제품(반) 기능</td>
            <td style={cellStyle}>C3 제품(반) 요구사항</td>
            <td style={cellStyle}>C4 제품(반) 고장영향</td>
            <td style={cellStyle}></td>
            <td style={cellStyle}></td>
          </tr>
        </tbody>
      </table>
      </div>

      {/* 상단과 메인 영역 사이 간격 */}
      <div style={{ height: '15px' }}></div>

      {/* 메인 영역: 좌측 + 우측 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 좌측 영역 */}
        <div>
          {/* Excel 파일 선택 */}
          <h3 style={sectionTitleStyle}>Excel 파일 선택</h3>
          <div style={{ ...tableWrapperStyle, marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ ...lightBlueStyle, width: '120px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>전체 입포트</td>
                <td style={{ ...cellStyle, padding: '8px' }}>{fileName && <span style={{ color: '#00587a' }}>{fileName}</span>}</td>
                <td style={{ ...cellStyle, width: '120px', textAlign: 'center', padding: '8px' }}>
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <input 
                      type="file" 
                      accept=".xlsx,.xls" 
                      style={{ display: 'none' }} 
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                    />
                    <span style={{ padding: '6px 20px', background: '#f0f0f0', border: '1px solid #999', borderRadius: '4px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                      찾아보기
                    </span>
                  </label>
                </td>
              </tr>
              <tr>
                <td style={{ ...lightBlueStyle, fontWeight: 'bold', whiteSpace: 'nowrap' }}>개별 입포트</td>
                <td style={{ ...cellStyle, padding: '8px' }}></td>
                <td style={{ ...cellStyle, width: '120px', textAlign: 'center', padding: '8px' }}>
                  <span style={{ padding: '6px 20px', background: '#f0f0f0', border: '1px solid #999', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-block' }}>
                    찾아보기
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          {/* 입포트 미리보기 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#00587a' }}>입포트 미리보기</span>
            <select 
              value={previewColumn}
              onChange={(e) => setPreviewColumn(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #999', borderRadius: '4px', minWidth: '120px' }}
            >
              {PREVIEW_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span style={{ color: '#666' }}>All Delet, Delete</span>
            <button style={{ padding: '6px 16px', background: '#00587a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              저장
            </button>
          </div>

          {/* 미리보기 테이블 - 20행 고정, 세로 스크롤 */}
          <div style={{ ...tableWrapperStyle, marginBottom: '20px' }}>
            {/* 헤더 고정 */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...headerStyle, width: '50px' }}>NO</th>
                  <th style={{ ...headerStyle, width: '50px' }}>순서</th>
                  <th style={{ ...headerStyle, width: '80px' }}>공정번호</th>
                  <th style={headerStyle}>값</th>
                </tr>
              </thead>
            </table>
            {/* 스크롤 영역 - 20행 높이 (약 800px) */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {previewData.length === 0 ? (
                    // 빈 행 20개 표시
                    Array.from({ length: 20 }).map((_, i) => (
                      <tr key={i}>
                        <td style={{ ...cellStyle, width: '50px', textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ ...cellStyle, width: '50px', textAlign: 'center' }}>
                          <GripVertical style={{ width: '16px', height: '16px', color: '#ccc' }} />
                        </td>
                        <td style={{ ...cellStyle, width: '80px' }}></td>
                        <td style={cellStyle}></td>
                      </tr>
                    ))
                  ) : (
                    previewData.map((item, i) => (
                      <tr key={item.id} style={{ cursor: 'grab' }}>
                        <td style={{ ...cellStyle, width: '50px', textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ ...cellStyle, width: '50px', textAlign: 'center' }}>
                          <GripVertical style={{ width: '16px', height: '16px', color: '#666', cursor: 'grab' }} />
                        </td>
                        <td style={{ ...cellStyle, width: '80px', textAlign: 'center' }}>{item.processNo}</td>
                        <td style={cellStyle}>{item.value}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 우측 영역 */}
        <div>
          {/* 입포트 현황 */}
          <h3 style={sectionTitleStyle}>입포트 현황</h3>
          <div style={{ ...tableWrapperStyle, marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerStyle}>총행</th>
                <th style={headerStyle}>공정항목수</th>
                <th style={headerStyle}>작업요소수</th>
                <th style={headerStyle}>완제품수</th>
                <th style={headerStyle}>누락</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>{stats.total || ''}</td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>{stats.aCount || ''}</td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>{stats.bCount || ''}</td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>{stats.cCount || ''}</td>
                <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '18px', color: stats.missing > 0 ? 'red' : 'inherit' }}>{stats.missing || ''}</td>
              </tr>
            </tbody>
          </table>
          </div>

          {/* 관계형 DATA 미리보기 */}
          <h3 style={sectionTitleStyle}>관계형 DATA 미리보기</h3>
          
          {/* 탭 */}
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <button 
              onClick={() => setRelationTab('A')}
              style={{ 
                padding: '8px 16px', 
                background: relationTab === 'A' ? '#00587a' : '#e0f2fb', 
                color: relationTab === 'A' ? 'white' : '#00587a',
                border: '1px solid #999',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              A 공정
            </button>
            <button 
              onClick={() => setRelationTab('B')}
              style={{ 
                padding: '8px 16px', 
                background: relationTab === 'B' ? '#90EE90' : '#e8f5e9', 
                color: relationTab === 'B' ? 'black' : '#2e7d32',
                border: '1px solid #999',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              B 작업요소
            </button>
            <button 
              onClick={() => setRelationTab('C')}
              style={{ 
                padding: '8px 16px', 
                background: relationTab === 'C' ? '#FFCCCB' : '#ffebee', 
                color: relationTab === 'C' ? 'black' : '#c62828',
                border: '1px solid #999',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              C 완(반)제품
            </button>
            <button style={{ padding: '8px 16px', background: '#fff9c4', border: '1px solid #999', cursor: 'pointer', fontWeight: 'bold' }}>다운로드</button>
            <button style={{ padding: '8px 16px', background: '#fff9c4', border: '1px solid #999', cursor: 'pointer', fontWeight: 'bold' }}>입포트</button>
            <button style={{ padding: '8px 16px', background: '#e1bee7', border: '1px solid #999', cursor: 'pointer', fontWeight: 'bold' }}>저장</button>
          </div>

          {/* 관계형 테이블 - 20행 고정, 세로 스크롤 */}
          <div style={tableWrapperStyle}>
            {/* 헤더 고정 */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {relationTab === 'A' && (
                    <>
                      <th style={{ ...headerStyle, background: '#e0f2fb', color: '#00587a' }}>A1 공정번호</th>
                      <th style={{ ...headerStyle, background: '#e0f2fb', color: '#00587a' }}>A2 공정명</th>
                      <th style={{ ...headerStyle, background: '#e0f2fb', color: '#00587a' }}>A3 공정기능</th>
                      <th style={{ ...headerStyle, background: '#e0f2fb', color: '#00587a' }}>A4 제품특성</th>
                      <th style={{ ...headerStyle, background: '#e0f2fb', color: '#00587a' }}>A5 고장형태</th>
                      <th style={{ ...headerStyle, background: '#e0f2fb', color: '#00587a' }}>A6 검출관리</th>
                    </>
                  )}
                  {relationTab === 'B' && (
                    <>
                      <th style={{ ...headerStyle, background: '#e0f2fb', color: '#00587a' }}>A1 공정번호</th>
                      <th style={{ ...headerStyle, background: '#e8f5e9', color: '#2e7d32' }}>B1 작업요소</th>
                      <th style={{ ...headerStyle, background: '#e8f5e9', color: '#2e7d32' }}>B2 요소기능</th>
                      <th style={{ ...headerStyle, background: '#e8f5e9', color: '#2e7d32' }}>B3 공정특성</th>
                      <th style={{ ...headerStyle, background: '#e8f5e9', color: '#2e7d32' }}>B4 고장원인</th>
                      <th style={{ ...headerStyle, background: '#e8f5e9', color: '#2e7d32' }}>B5 예방관리</th>
                    </>
                  )}
                  {relationTab === 'C' && (
                    <>
                      <th style={{ ...headerStyle, background: '#e0f2fb', color: '#00587a' }}>A1 공정번호</th>
                      <th style={{ ...headerStyle, background: '#ffebee', color: '#c62828' }}>C1 제품명</th>
                      <th style={{ ...headerStyle, background: '#ffebee', color: '#c62828' }}>C2 제품기능</th>
                      <th style={{ ...headerStyle, background: '#ffebee', color: '#c62828' }}>C3 요구사항</th>
                      <th style={{ ...headerStyle, background: '#ffebee', color: '#c62828' }}>C4 고장영향</th>
                      <th style={headerStyle}>비고</th>
                    </>
                  )}
                </tr>
              </thead>
            </table>
            {/* 스크롤 영역 - 20행 높이 */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {relationData.length === 0 ? (
                    // 빈 행 20개 표시
                    Array.from({ length: 20 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} style={cellStyle}></td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    relationData.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j} style={cellStyle}>{val}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

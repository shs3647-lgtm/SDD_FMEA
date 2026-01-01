/**
 * @file useImportFileHandlers.ts
 * @description 파일 선택 및 Import 핸들러
 */

import { ParseResult } from '../excel-parser';
import { ImportedFlatData } from '../types';

interface UseImportFileHandlersProps {
  setFileName: (name: string) => void;
  setIsParsing: (parsing: boolean) => void;
  setImportSuccess: (success: boolean) => void;
  setParseResult: (result: ParseResult | null) => void;
  setPendingData: React.Dispatch<React.SetStateAction<ImportedFlatData[]>>;
  setFlatData: React.Dispatch<React.SetStateAction<ImportedFlatData[]>>;
  setIsImporting: (importing: boolean) => void;
  flatData: ImportedFlatData[];
  pendingData: ImportedFlatData[];
  parseMultiSheetExcel: (file: File) => Promise<ParseResult>;
}

export function useImportFileHandlers({
  setFileName,
  setIsParsing,
  setImportSuccess,
  setParseResult,
  setPendingData,
  setFlatData,
  setIsImporting,
  flatData,
  pendingData,
  parseMultiSheetExcel,
}: UseImportFileHandlersProps) {
  
  /** 파일 선택 핸들러 (파싱 후 pendingData에 저장) */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsParsing(true);
    setImportSuccess(false);
    
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
      
      setPendingData(flat);
      setFlatData(flat);
      
      console.log('📊 전체 Import 결과:');
      console.log('  - 공정 수:', result.processes.length);
      console.log('  - 제품 수:', result.products.length);
      console.log('  - Flat 데이터 수:', flat.length);
    } catch (error) {
      console.error('파싱 오류:', error);
    } finally {
      setIsParsing(false);
    }
  };

  /** Import 버튼 클릭 핸들러 */
  const handleImport = async () => {
    if (pendingData.length === 0) {
      alert('Import할 데이터가 없습니다. 먼저 Excel 파일을 선택해주세요.');
      return;
    }

    setIsImporting(true);
    setImportSuccess(false);

    try {
      const mergedData: ImportedFlatData[] = [...flatData];
      let addedCount = 0;
      let updatedCount = 0;

      pendingData.forEach(newItem => {
        const existingIndex = mergedData.findIndex(d => 
          d.processNo === newItem.processNo && 
          d.itemCode === newItem.itemCode && 
          d.id === newItem.id
        );

        if (existingIndex >= 0) {
          mergedData[existingIndex] = { ...newItem, createdAt: new Date() };
          updatedCount++;
        } else {
          mergedData.push({ ...newItem, createdAt: new Date() });
          addedCount++;
        }
      });

      setFlatData(mergedData);
      setPendingData([]);
      setImportSuccess(true);

      console.log(`Import 완료: 추가 ${addedCount}건, 업데이트 ${updatedCount}건`);
      
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (error) {
      console.error('Import 오류:', error);
      alert('Import 중 오류가 발생했습니다.');
    } finally {
      setIsImporting(false);
    }
  };

  return {
    handleFileSelect,
    handleImport,
  };
}



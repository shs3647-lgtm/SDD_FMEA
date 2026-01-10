/**
 * @file useImportFileHandlers.ts
 * @description 파일 선택 및 Import 핸들러
 */

import { ParseResult } from '../excel-parser';
import { ImportedFlatData } from '../types';
import { saveMasterDataset } from '../utils/master-api';

interface UseImportFileHandlersProps {
  setFileName: (name: string) => void;
  setIsParsing: (parsing: boolean) => void;
  setImportSuccess: (success: boolean) => void;
  setParseResult: (result: ParseResult | null) => void;
  setPendingData: React.Dispatch<React.SetStateAction<ImportedFlatData[]>>;
  setFlatData: React.Dispatch<React.SetStateAction<ImportedFlatData[]>>;
  setIsImporting: (importing: boolean) => void;
  setMasterDatasetId?: (id: string | null) => void;
  flatData: ImportedFlatData[];
  pendingData: ImportedFlatData[];
  parseMultiSheetExcel: (file: File) => Promise<ParseResult>;
  saveToMaster?: boolean; // Master FMEA에 자동 저장 여부
}

export function useImportFileHandlers({
  setFileName,
  setIsParsing,
  setImportSuccess,
  setParseResult,
  setPendingData,
  setFlatData,
  setIsImporting,
  setMasterDatasetId,
  flatData,
  pendingData,
  parseMultiSheetExcel,
  saveToMaster = true, // 기본값: Master FMEA에 저장
}: UseImportFileHandlersProps) {
  
  /** 파일 선택 핸들러 (파싱 후 pendingData에 저장) */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsParsing(true);
    setImportSuccess(false);
    
    try {
      console.log('📂 파일 파싱 시작:', file.name);
      const result = await parseMultiSheetExcel(file);
      setParseResult(result);
      
      console.log('📊 파싱 결과:', {
        success: result.success,
        processes: result.processes.length,
        products: result.products.length,
        sheetSummary: result.sheetSummary,
        errors: result.errors
      });
      
      // 디버깅: 각 프로세스별 데이터 상세 확인
      if (result.processes.length > 0) {
        console.log('📋 공정 데이터 상세 (첫 3개):');
        result.processes.slice(0, 3).forEach((p, idx) => {
          console.log(`  ${idx + 1}. 공정번호: ${p.processNo}, 공정명: ${p.processName}`);
          console.log(`     A3(공정기능): ${p.processDesc.length}건, A4(제품특성): ${p.productChars.length}건, A5(고장형태): ${p.failureModes.length}건`);
          console.log(`     B1(작업요소): ${p.workElements.length}건, B4(고장원인): ${p.failureCauses.length}건, B5(예방관리): ${p.preventionCtrls.length}건`);
        });
      }
      
      // 디버깅: 제품 데이터 상세 확인
      if (result.products.length > 0) {
        console.log('📋 제품 데이터 상세:');
        result.products.forEach((p, idx) => {
          console.log(`  ${idx + 1}. 구분: ${p.productProcessName}`);
          console.log(`     C2(제품기능): ${p.productFuncs.length}건, C3(요구사항): ${p.requirements.length}건, C4(고장영향): ${p.failureEffects.length}건`);
        });
      }
      
      // Flat 데이터 생성
      const flat: ImportedFlatData[] = [];
      result.processes.forEach((p) => {
        flat.push({ id: `${p.processNo}-A1`, processNo: p.processNo, category: 'A', itemCode: 'A1', value: p.processNo, createdAt: new Date() });
        if (p.processName) {
          flat.push({ id: `${p.processNo}-A2`, processNo: p.processNo, category: 'A', itemCode: 'A2', value: p.processName, createdAt: new Date() });
        }
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
      
      // Flat 데이터 통계
      const flatStats = {
        A1: flat.filter(d => d.itemCode === 'A1').length,
        A2: flat.filter(d => d.itemCode === 'A2').length,
        A3: flat.filter(d => d.itemCode === 'A3').length,
        A4: flat.filter(d => d.itemCode === 'A4').length,
        A5: flat.filter(d => d.itemCode === 'A5').length,
        A6: flat.filter(d => d.itemCode === 'A6').length,
        B1: flat.filter(d => d.itemCode === 'B1').length,
        B2: flat.filter(d => d.itemCode === 'B2').length,
        B3: flat.filter(d => d.itemCode === 'B3').length,
        B4: flat.filter(d => d.itemCode === 'B4').length,
        B5: flat.filter(d => d.itemCode === 'B5').length,
        C1: flat.filter(d => d.itemCode === 'C1').length,
        C2: flat.filter(d => d.itemCode === 'C2').length,
        C3: flat.filter(d => d.itemCode === 'C3').length,
        C4: flat.filter(d => d.itemCode === 'C4').length,
      };
      console.log('📊 Flat 데이터 통계:', flatStats);
      
      console.log('✅ Flat 데이터 생성 완료:', flat.length, '건');
      
      // ⚠️ 파싱 결과가 비어있으면 경고
      if (flat.length === 0) {
        console.warn('⚠️ 파싱된 데이터가 없습니다. 시트 이름을 확인하세요.');
        console.warn('   유효한 시트 이름: L2-1 공정번호, L2-3 공정기능, L3-1 작업요소, L1-1 구분 등');
        alert('⚠️ 파싱된 데이터가 없습니다.\n\n시트 이름이 올바른지 확인하세요:\n- L2-1 공정번호, L2-3 공정기능\n- L3-1 작업요소, L3-4 고장원인\n- L1-1 구분, L1-4 고장영향\n\n또는 기존 형식: A1, A2, A3, B1, C1 등');
      }
      
      setPendingData(flat);
      setFlatData(flat);
      
      console.log('📊 전체 Import 결과:');
      console.log('  - 공정 수:', result.processes.length);
      console.log('  - 제품 수:', result.products.length);
      console.log('  - Flat 데이터 수:', flat.length);
      console.log('  - pendingData 설정 완료: Import 버튼 활성화됨');
    } catch (error) {
      console.error('❌ 파싱 오류:', error);
      alert('❌ Excel 파싱 중 오류가 발생했습니다.\n\n' + (error as Error).message);
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

      // ✅ Master FMEA에 자동 저장
      if (saveToMaster) {
        console.log('📦 Master FMEA에 저장 중...');
        
        // 1. localStorage에 저장 (폴백)
        localStorage.setItem('pfmea_master_data', JSON.stringify(mergedData));
        localStorage.setItem('pfmea_saved_at', new Date().toISOString());
        
        // 2. DB에 저장 (Master Dataset)
        try {
          const res = await saveMasterDataset({
            name: 'MASTER',
            setActive: true,
            replace: true,
            flatData: mergedData,
          });
          
          if (res.ok) {
            console.log('✅ Master FMEA DB 저장 완료:', res.datasetId);
            if (setMasterDatasetId && res.datasetId) {
              setMasterDatasetId(res.datasetId);
            }
          } else {
            console.warn('⚠️ Master FMEA DB 저장 실패 (localStorage 유지)');
          }
        } catch (dbError) {
          console.warn('⚠️ Master FMEA DB 저장 오류:', dbError);
        }
      }

      setImportSuccess(true);
      console.log(`✅ Import 완료: 추가 ${addedCount}건, 업데이트 ${updatedCount}건`);
      
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



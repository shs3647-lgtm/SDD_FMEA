/**
 * @file convertToFmea4.ts
 * @description SDD 7단계 FMEA 데이터를 4판 형식으로 변환
 * 
 * 핵심 매핑:
 * - L1.failureScopes: 고장영향(FE) + 심각도(S)
 * - L2.failureModes: 고장형태(FM)
 * - L2.productChars: 제품특성 + 특별특성
 * - L3.failureCauses: 고장원인(FC)
 * - L3.processChars: 공정특성 + 특별특성
 * - riskData: O, D, PC, DC 값
 * - failureLinks: FM-FE-FC 연결 관계
 */

import { WorksheetState } from '../../constants';
import { Fmea4Row, createEmptyFmea4Row, calculateRPN } from '../../types/fmea4';

/**
 * SDD 7단계 FMEA 데이터를 4판 형식으로 변환
 */
export function convertToFmea4(state: WorksheetState): Fmea4Row[] {
  const rows: Fmea4Row[] = [];
  const riskData = state.riskData || {};
  
  console.log('🔄 convertToFmea4 시작');
  console.log('  L1:', state.l1?.name);
  console.log('  L2 공정 수:', state.l2?.length || 0);
  console.log('  riskData 키 수:', Object.keys(riskData).length);
  console.log('  failureLinks:', state.failureLinks?.length || 0);

  // 1. L1 고장영향(FE) + 심각도 맵 생성
  const feMap = new Map<string, { effect: string; severity: number; reqId: string }>();
  (state.l1?.failureScopes || []).forEach((fs: any) => {
    if (fs.id && fs.effect) {
      feMap.set(fs.id, {
        effect: fs.effect,
        severity: fs.severity || 0,
        reqId: fs.reqId || ''
      });
    }
  });
  console.log('  FE 맵:', feMap.size, '개');

  // 2. failureLinks에서 FM-FE-FC 연결 정보 추출
  const linkMap = new Map<string, { feIds: string[]; fcIds: string[] }>();
  (state.failureLinks || []).forEach((link: any) => {
    if (link.fmId) {
      const existing = linkMap.get(link.fmId) || { feIds: [], fcIds: [] };
      if (link.feId && !existing.feIds.includes(link.feId)) {
        existing.feIds.push(link.feId);
      }
      if (link.fcId && !existing.fcIds.includes(link.fcId)) {
        existing.fcIds.push(link.fcId);
      }
      linkMap.set(link.fmId, existing);
    }
  });
  console.log('  Link 맵:', linkMap.size, '개');

  let rowIndex = 0;

  // 3. L2 공정 순회
  (state.l2 || []).forEach((proc: any, procIdx: number) => {
    if (!proc.name || proc.name.includes('클릭')) return;

    const processNo = proc.no || String((procIdx + 1) * 10);
    const processName = proc.name;
    
    // 공정 기능
    const processFunction = (proc.functions || [])
      .map((f: any) => f.name)
      .filter((n: string) => n && !n.includes('클릭'))
      .join(', ');

    // 제품특성에서 특별특성 추출
    const productSpecialChars = (proc.functions || [])
      .flatMap((f: any) => f.productChars || [])
      .map((pc: any) => pc.specialChar)
      .filter((sc: string) => sc)
      .join(', ');

    console.log(`  📦 공정 [${processNo}] ${processName}`);

    // 4. L2 고장형태(FM) 순회
    const failureModes = proc.failureModes || [];
    
    if (failureModes.length === 0) {
      // FM이 없으면 L3 직접 순회
      (proc.l3 || []).forEach((we: any) => {
        if (!we.name || we.name.includes('클릭')) return;
        
        // L3의 riskData 배열 처리
        if (we.riskData && Array.isArray(we.riskData) && we.riskData.length > 0) {
          we.riskData.forEach((risk: any) => {
            const row = createFmea4RowFromRisk(
              processNo, processName, processFunction, productSpecialChars,
              we, risk, riskData, rowIndex
            );
            rows.push(row);
            rowIndex++;
          });
        }
      });
    } else {
      // FM이 있으면 FM 순회
      failureModes.forEach((fm: any) => {
        if (!fm.name || fm.name.includes('클릭') || fm.name.includes('추가')) return;

        const failureMode = fm.name;
        const fmId = fm.id;
        const fmLinks = linkMap.get(fmId) || { feIds: [], fcIds: [] };

        // 연결된 FE 정보 가져오기
        let failureEffect = '';
        let severity = 0;
        if (fmLinks.feIds.length > 0) {
          const feInfo = feMap.get(fmLinks.feIds[0]);
          if (feInfo) {
            failureEffect = feInfo.effect;
            severity = feInfo.severity;
          }
        }

        // riskData에서 심각도 찾기 (S-fe-* 또는 S-fm-*)
        if (severity === 0) {
          Object.keys(riskData).forEach(key => {
            if (key.startsWith('S-fe-') || key.startsWith('S-fm-')) {
              const val = Number(riskData[key]);
              if (val > severity) severity = val;
            }
          });
        }

        console.log(`    🔴 FM: ${failureMode}, FE: ${failureEffect}, S: ${severity}`);

        // 5. L3 작업요소 순회
        (proc.l3 || []).forEach((we: any) => {
          if (!we.name || we.name.includes('클릭') || we.name.includes('추가')) return;

          const workElement = we.name;
          const m4 = we.m4 || we.fourM || 'MN';

          // 공정특성에서 특별특성 추출
          const processSpecialChars = (we.functions || [])
            .flatMap((f: any) => f.processChars || [])
            .map((pc: any) => pc.specialChar)
            .filter((sc: string) => sc)
            .join(', ');

          // 6-A. L3.riskData 배열 처리 (새로운 구조)
          if (we.riskData && Array.isArray(we.riskData) && we.riskData.length > 0) {
            we.riskData.forEach((risk: any) => {
              const row = createEmptyFmea4Row(processNo, processName);
              row.processFunction = processFunction || workElement;
              row.failureMode = failureMode;
              row.failureEffect = risk.fe || risk.failureEffect || failureEffect;
              row.severity = Number(risk.severity || risk.s || severity);
              row.failureCause = risk.fc || risk.failureCause || '';
              row.occurrence = Number(risk.occurrence || risk.o || 0);
              row.detection = Number(risk.detection || risk.d || 0);
              row.preventionControl = risk.preventionControl || risk.pc || '';
              row.detectionControl = risk.detectionControl || risk.dc || '';
              row.specialChar1 = productSpecialChars || risk.specialChar || '';
              row.specialChar2 = processSpecialChars || risk.sc || '';
              row.rpn = calculateRPN(row.severity, row.occurrence, row.detection);

              // 개선 조치
              row.preventionImprove = risk.preventionImprove || '';
              row.detectionImprove = risk.detectionImprove || '';
              row.responsible = risk.responsible || risk.manager || '';
              row.targetDate = risk.targetDate || '';
              row.severityAfter = Number(risk.severityAfter || 0);
              row.occurrenceAfter = Number(risk.occurrenceAfter || 0);
              row.detectionAfter = Number(risk.detectionAfter || 0);
              row.rpnAfter = calculateRPN(row.severityAfter, row.occurrenceAfter, row.detectionAfter);

              rows.push(row);
              rowIndex++;
            });
          }
          // 6-B. L3.failureCauses 배열 처리 (기존 구조)
          else if (we.failureCauses && Array.isArray(we.failureCauses) && we.failureCauses.length > 0) {
            we.failureCauses.forEach((fc: any) => {
              if (!fc.name || fc.name.includes('클릭') || fc.name.includes('추가')) return;

              const row = createEmptyFmea4Row(processNo, processName);
              row.processFunction = processFunction || workElement;
              row.failureMode = failureMode;
              row.failureEffect = failureEffect;
              row.severity = severity;
              row.failureCause = fc.name;
              row.specialChar1 = productSpecialChars;
              row.specialChar2 = processSpecialChars;

              // riskData에서 O, D 값 가져오기
              const oKey = `risk-${rowIndex}-O`;
              const dKey = `risk-${rowIndex}-D`;
              const pcKey = `prevention-${rowIndex}`;
              const dcKey = `detection-${rowIndex}`;

              row.occurrence = Number(riskData[oKey] || fc.occurrence || 0);
              row.detection = Number(riskData[dKey] || 0);
              row.preventionControl = String(riskData[pcKey] || '');
              row.detectionControl = String(riskData[dcKey] || '');
              row.rpn = calculateRPN(row.severity, row.occurrence, row.detection);

              // 개선 조치 (6단계 데이터)
              row.preventionImprove = String(riskData[`opt-action-${rowIndex}`] || '');
              row.detectionImprove = String(riskData[`opt-detection-action-${rowIndex}`] || '');
              row.responsible = String(riskData[`opt-manager-${rowIndex}`] || '');
              row.targetDate = String(riskData[`opt-target-date-${rowIndex}`] || '');
              row.severityAfter = Number(riskData[`opt-${rowIndex}-S`] || 0);
              row.occurrenceAfter = Number(riskData[`opt-${rowIndex}-O`] || 0);
              row.detectionAfter = Number(riskData[`opt-${rowIndex}-D`] || 0);
              row.rpnAfter = calculateRPN(row.severityAfter, row.occurrenceAfter, row.detectionAfter);

              console.log(`      🟡 FC: ${fc.name}, O: ${row.occurrence}, D: ${row.detection}, RPN: ${row.rpn}`);

              rows.push(row);
              rowIndex++;
            });
          }
          // 6-C. FC도 없는 경우 - FM만으로 행 생성
          else {
            const row = createEmptyFmea4Row(processNo, processName);
            row.processFunction = processFunction || workElement;
            row.failureMode = failureMode;
            row.failureEffect = failureEffect;
            row.severity = severity;
            row.specialChar1 = productSpecialChars;
            row.specialChar2 = processSpecialChars;

            // riskData에서 값 가져오기
            const oKey = `risk-${rowIndex}-O`;
            const dKey = `risk-${rowIndex}-D`;
            row.occurrence = Number(riskData[oKey] || 0);
            row.detection = Number(riskData[dKey] || 0);
            row.rpn = calculateRPN(row.severity, row.occurrence, row.detection);

            rows.push(row);
            rowIndex++;
          }
        });
      });
    }
  });

  console.log('✅ convertToFmea4 완료:', rows.length, '행 생성');
  return rows;
}

/**
 * riskData 객체에서 Fmea4Row 생성 (헬퍼 함수)
 */
function createFmea4RowFromRisk(
  processNo: string,
  processName: string,
  processFunction: string,
  productSpecialChars: string,
  we: any,
  risk: any,
  globalRiskData: { [key: string]: number | string },
  rowIndex: number
): Fmea4Row {
  const row = createEmptyFmea4Row(processNo, processName);
  row.processFunction = processFunction || we.name;
  row.failureMode = risk.fm || risk.failureMode || '';
  row.failureEffect = risk.fe || risk.failureEffect || '';
  row.severity = Number(risk.severity || risk.s || 0);
  row.failureCause = risk.fc || risk.failureCause || '';
  row.occurrence = Number(risk.occurrence || risk.o || 0);
  row.detection = Number(risk.detection || risk.d || 0);
  row.preventionControl = risk.preventionControl || risk.pc || '';
  row.detectionControl = risk.detectionControl || risk.dc || '';
  row.specialChar1 = productSpecialChars || risk.specialChar || '';
  row.specialChar2 = risk.sc || '';
  row.rpn = calculateRPN(row.severity, row.occurrence, row.detection);
  return row;
}

/**
 * 4판 행이 비어있는지 확인
 */
export function isEmptyFmea4Row(row: Fmea4Row): boolean {
  return !row.processName && !row.failureMode && !row.failureCause;
}

/**
 * 4판 데이터 통계
 */
export function getFmea4Stats(rows: Fmea4Row[]) {
  const totalRows = rows.length;
  const highRpn = rows.filter(r => r.rpn >= 200).length;
  const mediumRpn = rows.filter(r => r.rpn >= 100 && r.rpn < 200).length;
  const lowRpn = rows.filter(r => r.rpn > 0 && r.rpn < 100).length;
  const improvedRpn = rows.filter(r => r.rpnAfter > 0 && r.rpnAfter < r.rpn).length;
  
  return {
    totalRows,
    highRpn,
    mediumRpn,
    lowRpn,
    improvedRpn,
  };
}

/**
 * @file convertToFmea4.ts
 * @description 기존 7단계 FMEA 데이터를 4판 형식으로 변환
 */

import { WorksheetState } from '../../constants';
import { Fmea4Row, createEmptyFmea4Row, calculateRPN } from '../../types/fmea4';

/**
 * 7단계 FMEA 데이터를 4판 형식으로 변환
 * 
 * 매핑:
 * - processNo, processName: L2 공정에서
 * - processFunction: L2 공정 기능에서
 * - failureMode: L2 failureModes에서
 * - failureEffect: L1 failureScopes.effect에서
 * - severity: failureScopes.severity에서
 * - failureCause: L3 failureCauses에서
 * - preventionControl, detectionControl: riskData에서
 * - occurrence, detection: riskData에서
 */
export function convertToFmea4(state: WorksheetState): Fmea4Row[] {
  const rows: Fmea4Row[] = [];
  const riskData = state.riskData || {};
  
  // L1 고장영향(FE) 맵 생성
  const feMap = new Map<string, { effect: string; severity: number; scope: string }>();
  (state.l1?.failureScopes || []).forEach((fs: any) => {
    if (fs.effect) {
      // 구분(scope) 찾기
      let scope = 'Your Plant';
      (state.l1?.types || []).forEach((type: any) => {
        (type.functions || []).forEach((fn: any) => {
          (fn.requirements || []).forEach((req: any) => {
            if (req.id === fs.reqId) scope = type.name;
          });
        });
      });
      feMap.set(fs.id, { effect: fs.effect, severity: fs.severity || 0, scope });
    }
  });

  let rowIndex = 0;

  // L2 공정 순회
  (state.l2 || []).forEach((proc: any) => {
    if (!proc.name || proc.name.includes('클릭')) return;

    const processNo = proc.no || '';
    const processName = proc.name;
    const processFunction = (proc.functions || []).map((f: any) => f.name).filter((n: string) => n && !n.includes('클릭')).join(', ');

    // FM 순회
    (proc.failureModes || []).forEach((fm: any) => {
      if (!fm.name || fm.name.includes('클릭') || fm.name.includes('추가')) return;

      const failureMode = fm.name;

      // FE (고장영향) - 첫 번째 연결된 FE 사용
      let failureEffect = '';
      let severity = 0;
      
      // riskData에서 S-fe-* 키로 심각도 찾기
      Object.keys(riskData).forEach(key => {
        if (key.startsWith('S-fe-') && !failureEffect) {
          const feText = key.replace('S-fe-', '');
          failureEffect = feText;
          severity = Number(riskData[key]) || 0;
        }
      });

      // L3 작업요소 순회 → FC 추출
      (proc.l3 || []).forEach((we: any) => {
        if (!we.name || we.name.includes('클릭') || we.name.includes('추가')) return;

        const m4 = we.m4 || we.fourM || 'MN';

        (we.failureCauses || []).forEach((fc: any) => {
          if (!fc.name || fc.name.includes('클릭') || fc.name.includes('추가')) return;

          const row = createEmptyFmea4Row(processNo, processName);
          row.processFunction = processFunction;
          row.failureMode = failureMode;
          row.failureEffect = failureEffect;
          row.severity = severity;
          row.failureCause = fc.name;

          // riskData에서 현재 관리 정보 가져오기
          const o = Number(riskData[`risk-${rowIndex}-O`]) || 0;
          const d = Number(riskData[`risk-${rowIndex}-D`]) || 0;
          row.preventionControl = String(riskData[`prevention-${rowIndex}`] || '');
          row.occurrence = o;
          row.detectionControl = String(riskData[`detection-${rowIndex}`] || '');
          row.detection = d;
          row.rpn = calculateRPN(severity, o, d);

          // 개선 조치 (6단계 데이터)
          row.preventionImprove = String(riskData[`opt-action-${rowIndex}`] || '');
          row.detectionImprove = String(riskData[`opt-detection-action-${rowIndex}`] || '');
          row.responsible = String(riskData[`opt-manager-${rowIndex}`] || '');
          row.targetDate = String(riskData[`opt-target-date-${rowIndex}`] || '');

          // 개선 후 평가
          const sAfter = Number(riskData[`opt-${rowIndex}-S`]) || 0;
          const oAfter = Number(riskData[`opt-${rowIndex}-O`]) || 0;
          const dAfter = Number(riskData[`opt-${rowIndex}-D`]) || 0;
          row.severityAfter = sAfter;
          row.occurrenceAfter = oAfter;
          row.detectionAfter = dAfter;
          row.rpnAfter = calculateRPN(sAfter, oAfter, dAfter);

          // 비고
          row.remarks = String(riskData[`opt-note-${rowIndex}`] || '');

          // 특별특성
          row.specialChar1 = String(riskData[`specialChar-${rowIndex}`] || '');
          row.specialChar2 = String(riskData[`opt-specialChar-${rowIndex}`] || '');

          rows.push(row);
          rowIndex++;
        });
      });
    });
  });

  return rows;
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


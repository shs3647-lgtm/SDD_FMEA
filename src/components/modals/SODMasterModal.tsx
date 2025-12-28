/**
 * @file SODMasterModal.tsx
 * @description SOD(심각도/발생도/검출도) 마스터 등록 모달
 * P-FMEA 및 D-FMEA의 SOD 기준표 관리
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface SODItem {
  id: string;
  fmeaType: 'P-FMEA' | 'D-FMEA';
  category: 'S' | 'O' | 'D'; // Severity, Occurrence, Detection
  rating: number; // 1-10
  levelKr: string; // 한글 레벨 (매우 높음, 높음, 중간, 낮음 등)
  levelEn: string; // 영문 레벨 (Very High, High, Moderate, Low 등)
  yourPlant?: string; // Your Plant 영향
  shipToPlant?: string; // Ship to Plant 영향
  endUser?: string; // End User 영향
  description?: string; // 추가 설명/발생빈도
  criteria?: string; // 기준 설명/검출방법 성숙도
  // 발생도(O) 전용 필드
  controlType?: string; // 관리유형 (Type of Control)
  preventionControl?: string; // 예방관리 (Prevention Controls)
}

interface SODMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// P-FMEA 심각도 기본 데이터 (AIAG & VDA FMEA Handbook 기준)
const DEFAULT_PFMEA_SEVERITY: Omit<SODItem, 'id'>[] = [
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 10, levelKr: '매우 높음', levelEn: 'Very High', 
    yourPlant: '고장으로 제조/조립근로자의 건강 및/또는 안전 리스크 초래 가능 (Failure may result in health and/or safety risk for manufacturing or assembly worker)', 
    shipToPlant: '고장으로 제조/조립근로자의 건강 및/또는 안전 리스크 초래 가능 (Failure may result in health and/or safety risk for manufacturing or assembly worker)', 
    endUser: '차량 및/또는 다른 자동차의 안전운행, 운전자, 승객 또는 도로 사용자나 보행자의 건강에 영향을 미침 (Affects safe operation of the vehicle and/or other vehicles, the health of driver or passenger(s) or road users or pedestrians)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 9, levelKr: '매우 높음', levelEn: 'Very High', 
    yourPlant: '고장이 발생하면 공장내 규제 미준수로 이어질수 있음 (Failure may result in in-plant regulatory non-compliance)', 
    shipToPlant: '고장이 발생하면 공장내 규제 미준수로 이어질수 있음 (Failure may result in in-plant regulatory non-compliance)', 
    endUser: '규제사항 미준수 (Noncompliance with regulations)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 8, levelKr: '높음', levelEn: 'High', 
    yourPlant: '영향을 받은 생산제품의 100%가 폐기될 수 있음 (100% of production run affected may have to be scrapped)', 
    shipToPlant: '1 Shift 이상 라인중단; 출하중단 가능 (Line shutdown greater than full production shift)', 
    endUser: '기대되는 사용수명기간 동안 정상 주행에 필요한 자동차 주요 기능의 상실 (Loss of primary vehicle function necessary for normal driving during expected service life)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 7, levelKr: '높음', levelEn: 'High', 
    yourPlant: '① 제품을 선별하고 일부 폐기 할 수도 있음 ② 공정에서 기준이탈; 라인속도저하, 인력추가필요 (Product may have to be sorted and portion scrapped; deviation from primary process; decreased line speed or added manpower)', 
    shipToPlant: '1시간~1shift 라인중단; 출하중단 가능; 규정 미준수이외에 필드수리/교체 (Line shutdown from 1 hour up to full production shift; stop shipment possible)', 
    endUser: '기대되는 사용수명기간 동안 정상 주행에 필요한 자동차 주요 기능의 저하 (Degradation of primary vehicle function necessary for normal driving during expected service life)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 6, levelKr: '중간', levelEn: 'Moderate', 
    yourPlant: '100% 라인 밖에서 재작업 및 승인 (100% of production run may have to be reworked off line and accepted)', 
    shipToPlant: '최대 1시간 까지 라인 중단 (Impact to Ship-to-Plant when known)', 
    endUser: '자동차 보조 기능 상실 (Loss of secondary vehicle function)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 5, levelKr: '중간', levelEn: 'Moderate', 
    yourPlant: '일부 제품을 라인밖에서 재작업 및 승인 (A portion of the production run may have to be reworked offline and accepted)', 
    shipToPlant: '영향을 받은 제품 100%미만; 추가적인 제품결함 가능성; 선별필요; 라인중단 없음 (Less than 100% of product affected; strong possibility for additional defective product; sort required; no line shutdown)', 
    endUser: '매우 좋지않은 외관, 소리, 진동, 거친소리 또는 촉각 (Very objectionable appearance, sound, vibration, harshness, or haptics)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 4, levelKr: '중간', levelEn: 'Moderate', 
    yourPlant: '100% 스테이션에서 재작업 (100% of production run may have to be reworked in station before it is processed)', 
    shipToPlant: '제품결함으로 중대한 대응 계획 유발; 추가적인 제품결함 가능성 없음; 선별필요 없음 (Defective product triggers significant reaction plan; additional defective products not likely; sort not required)', 
    endUser: '매우 좋지않은 외관, 소리, 진동, 거친소리 또는 촉각 (Very objectionable appearance, sound, vibration, harshness, or haptics)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 3, levelKr: '낮음', levelEn: 'Low', 
    yourPlant: '일부 제품을 스테이션내 에서 재작업 (A portion of the production run may have to be reworked in-station before it is processed)', 
    shipToPlant: '제품결함으로 경미한 대응 계획 유발; 추가적인 제품결함 가능성 없음; 선별필요 없음 (Defective product triggers minor reaction plan; additional defective products not likely; sort not required)', 
    endUser: '중간정도의 좋지않은 외관, 소리, 진동, 거친소리 또는 촉각 (Moderately objectionable appearance, sound, vibration, harshness, or haptics)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 2, levelKr: '낮음', levelEn: 'Low', 
    yourPlant: '공정, 작업 또는 작업자에게 약간의 불편 함 (Slight inconvenience to process, operation, or operator)', 
    shipToPlant: '제품결함으로 대응 계획 유발 없음; 추가적인 제품결함 가능성 없음; 선별필요 없음. 공급자에게 피드백 요구 (Defective product triggers no reaction plan; additional defective products not likely; sort not required; requires feedback to supplier)', 
    endUser: '약간 좋지않은 외관, 소리, 진동, 거친소리 또는 촉각 (Slightly objectionable appearance, sound, vibration, harshness, or haptics)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'S', rating: 1, levelKr: '매우 낮음', levelEn: 'Very Low', 
    yourPlant: '식별 가능한 영향이 없거나 영향이 없음 (No discernible effect)', 
    shipToPlant: '식별 가능한 영향이 없거나 영향이 없음 (No discernible effect)', 
    endUser: '인지할 수 있는 영향 없음 (No discernible effect)' 
  },
];

// P-FMEA 발생도 기본 데이터 (AIAG & VDA FMEA Handbook 기준)
// controlType: 관리유형, preventionControl: 예방관리 (기준), description: 발생빈도 (대안1)
const DEFAULT_PFMEA_OCCURRENCE: Omit<SODItem, 'id'>[] = [
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 10, levelKr: '극도로 높음', levelEn: 'Extremely High', 
    controlType: '없음\nNone',
    preventionControl: '예방관리 없음\nNo prevention controls.',
    description: '100개/1,000개, 매번\n1/10개' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 9, levelKr: '매우 높음', levelEn: 'Very High', 
    controlType: '행동적\nBehavioral',
    preventionControl: '예방관리는 고장원인을 예방하는데 거의 효과가 없음\nPrevention controls will have little effect in preventing failure cause.',
    description: '50개/1,000개, 거의 매번\n1개/20개' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 8, levelKr: '매우 높음', levelEn: 'Very High', 
    controlType: '행동적\nBehavioral',
    preventionControl: '예방관리는 고장원인을 예방하는데 거의 효과가 없음\nPrevention controls will have little effect in preventing failure cause.',
    description: '20개/1,000개, 교대당 1회 이상\n1개/50개' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 7, levelKr: '높음', levelEn: 'High', 
    controlType: '행동적 또는 기술적\nBehavioral or Technical',
    preventionControl: '예방관리는 고장원인을 예방하는데 다소 효과적 임\nPrevention controls somewhat effective in preventing failure cause.',
    description: '10개/1,000개, 일일 1회 이상\n1개/50개' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 6, levelKr: '높음', levelEn: 'High', 
    controlType: '행동적 또는 기술적\nBehavioral or Technical',
    preventionControl: '예방관리는 고장원인을 예방하는데 다소 효과적 임\nPrevention controls somewhat effective in preventing failure cause.',
    description: '2개/1,000개, 주간 1회 이상\n1개/500개' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 5, levelKr: '중간', levelEn: 'Moderate', 
    controlType: '행동적 또는 기술적\nBehavioral or Technical',
    preventionControl: '예방관리는 고장원인을 예방하는데 효과적 임\nPrevention controls are effective in preventing failure cause.',
    description: '0.5개/1,000개, 월간 1회 이상\n1개/2,000개' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 4, levelKr: '중간', levelEn: 'Moderate', 
    controlType: '행동적 또는 기술적\nBehavioral or Technical',
    preventionControl: '예방관리는 고장원인을 예방하는데 효과적 임\nPrevention controls are effective in preventing failure cause.',
    description: '0.1개/1,000개, 연간 1회 이상\n1개/10,000개' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 3, levelKr: '낮음', levelEn: 'Low', 
    controlType: '모범사례; 행동적 또는 기술적\nBest Practice; Behavioral or Technical',
    preventionControl: '예방관리는 고장원인을 예방하는데 매우 효과적 임\nPrevention controls are highly effective in preventing failure cause.',
    description: '0.001개/1,000개, 1년에 1회\n1개/100,000개' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 2, levelKr: '매우 낮음', levelEn: 'Very Low', 
    controlType: '기술적\nTechnical',
    preventionControl: '예방관리는 고장원인을 예방하는데 매우 효과적 임\nPrevention controls are effective in preventing failure cause.',
    description: '0.001개 미만/1,000개, 매년 1회 미만\n1개/1,000,000개' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'O', rating: 1, levelKr: '극도로 낮음', levelEn: 'Extremely Low', 
    controlType: '기술적\nTechnical',
    preventionControl: '설계(부품형상) 또는 공정(지그,치공구)로 고장원인을 예방하는데 매우 효과적임\n예방관리 의도-고장원인으로 인한 고장 형태를 물리적으로 생산 할 수 없음\nPrevention controls are extremely effective in preventing failure cause from occurring due to design or process.\nIntent of Prevention Controls-Failure Mode cannot be physically produced due to the Failure Cause.',
    description: '예방관리를 통해 제거됨\nFailure is eliminated through prevention control' 
  },
];

// P-FMEA 검출도 기본 데이터 (AIAG & VDA FMEA Handbook 기준)
const DEFAULT_PFMEA_DETECTION: Omit<SODItem, 'id'>[] = [
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 10, levelKr: '매우 낮음', levelEn: 'Very Low', 
    criteria: '시험 또는 검사방법이 수립되거나 알려지지 않음 (No testing or inspection method has been established or is known.)', 
    description: '고장형태가 검출되지 않거나 검출될 수 없음 (The failure mode will not or cannot be detected.)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 9, levelKr: '매우 낮음', levelEn: 'Very Low', 
    criteria: '시험 또는 검사방법이 고장형태를 검출할 가능성이 낮음 (It is unlikely that the testing or inspection method will detect the failure mode.)', 
    description: '고장형태는 무작위 또는 산발적 심사를 통해 쉽게 검출되지 않음 (The failure mode is not easily detected through random or sporadic audits.)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 8, levelKr: '낮음', levelEn: 'Low', 
    criteria: '시험 또는 검사 방법이 효과적이며, 신뢰할 만한 것으로 입증되지 않음. 공장은 방법, 게이지 R&R 결과의 비교 가능한 공정 또는 적용에 경험이 없음 (Test or inspection method has not been proven to be effective and reliable. e.g. plant has little or no experience with method, gauge R&R results marginal on comparable process or this application etc)', 
    description: '사람의 검사(시각,촉각,청각) 또는 고장형태나 원인을 검출해야 하는 수동 게이지(속성/변동) 사용 (Human inspection (visual, tactile, audible), or use of manual gauging (attribute or variable) that should detect the failure mode or failure cause.)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 7, levelKr: '낮음', levelEn: 'Low', 
    criteria: '시험 또는 검사 방법이 효과적이며, 신뢰할 만한 것으로 입증되지 않음 (Test or inspection method has not been proven to be effective and reliable.)', 
    description: '기계기반 검출(조명,부저-자동/반자동) 또는 고장형태 또는 고장원인을 검출해야하는 3차원 측정기 같은 검사장비 사용 (Machine-based detection (automated or semi-automated with notification by light, buzzer, etc.), or use of inspection equipment such as a coordinate measuring machine that should detect failure mode or failure cause.)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 6, levelKr: '중간', levelEn: 'Moderate', 
    criteria: '시험 또는 검사방법이 효과적이고 신뢰할 수 있으며(공장이 동일한 공정 또는 적용에 대한 경험이 있음) 게이지 R&R 결과 수용이 가능하다는 등이 입증됨 (Test or inspection method has been proven to be effective and reliable. e.g. plant has experience with method, gauge R&R results are acceptable on comparable process or this application, etc.)', 
    description: '사람의 검사(시각, 촉각, 청각) 또는 고장형태나 고장원인을 검출 할 수 있는 수동게이지(계량형/계수형) 사용 (Human inspection (visual, tactile, audible), or use of manual gauging (attribute or variable) that will detect the failure mode or failure cause (including product sample checks).)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 5, levelKr: '중간', levelEn: 'Moderate', 
    criteria: '시험 또는 검사방법이 효과적이고 신뢰할 수 있으며(공장이 동일한 공정 또는 적용에 대한 경험이 있음) 게이지 R&R 결과 수용이 가능하다는 등이 입증됨 (Test or inspection method has been proven to be effective and reliable. gauge R&R results are acceptable on comparable process or this application, etc.)', 
    description: '기계기반 검출(조명,부저-반자동) 또는 고장형태 또는 고장원인을 검출하는 3차원 측정기 같은 검사장비 사용 (Machine-based detection (semi-automated with notification by light, buzzer, etc.), or use of inspection equipment such as a coordinate measuring machine that will detect failure mode or failure cause (including product sample checks).)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 4, levelKr: '높음', levelEn: 'High', 
    criteria: '시스템이 효과적이고 신뢰할 수 있으며(공장이 동일한 공정 또는 적용에 대한 경험이 있음) 게이지 R&R 결과 수용이 가능하다는 등이 입증됨 (System has been proven to be effective and reliable. Gauge R&R results are acceptable, etc.)', 
    description: '하류부문에서 고장형태를 검출하고 더 이상 유출을 방지하거나 시스템이 제품을 불일치로 식별하여 지정된 불합격 하적영역까지 자동으로 취출되도록 하는 기계기반 자동검출 방법. 서로 어긋나는 제품은 시설에서 제품이 유출되지 않도록 관리하는 강건한 시스템으로 관리 (Machine-based automated detection method that will detect the failure mode downstream, prevent further processing or system will identify the product as discrepant and allow it to automatically move forward in the process until the designated reject unload area. Discrepant product will be controlled by a robust system that will prevent outflow of the product from the facility.)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 3, levelKr: '높음', levelEn: 'High', 
    criteria: '시스템이 효과적이고 신뢰할 수 있으며(공장이 동일한 공정 또는 적용에 대한 경험이 있음) 게이지 R&R 결과 수용이 가능하다는 등이 입증됨 (System has been proven to be effective and reliable (e.g. plant has experience with method) on identical process or this application. Gauge R&R results are acceptable, etc.)', 
    description: '스테이션내에서 고장형태를 검출하고 더 이상 유출을 방지하거나 시스템이 제품을 불일치로 식별하여 지정된 불합격 하적영역까지 자동으로 취출되도록 하는 기계기반 자동검출 방법. 불일치 제품이 유출되지 않도록하는 견고한 시스템으로 관리 됨 (Machine-based automated detection method that will detect the failure mode in-station, prevent further processing or system will identify the product as discrepant and allow it to automatically move forward in the process until the designated reject unload area. Discrepant product will be controlled by a robust system that will prevent outflow of the product from the facility.)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 2, levelKr: '높음', levelEn: 'High', 
    criteria: '검출방법은 효과적으로 신뢰할 수 있음 (경험이 있고, 실수방지 검증 등) (Detection method has been proven to be effective and reliable (e.g. plant has experience with method, error-proofing verifications, etc.).)', 
    description: '원인을 검출하고 고장형태가 생산되지 않도록하는 기계기반 검출방법 (Machine-based detection method that will detect the cause and prevent the failure mode (discrepant part) from being produced.)' 
  },
  { 
    fmeaType: 'P-FMEA', category: 'D', rating: 1, levelKr: '매우 높음', levelEn: 'Very High', 
    criteria: '고장형태는 물리적으로 설계 또는 생산 될 수 없으며, 항상 고장형태 또는 고장원인을 검출하는 방법으로 입증 됨 (Failure mode cannot be physically produced as-designed or processed, or detection methods proven to always detect the failure mode or failure cause.)', 
    description: '' 
  },
];

// =====================================================
// D-FMEA 기본 데이터 (AIAG & VDA FMEA Handbook 기준)
// =====================================================

// D-FMEA 심각도 기본 데이터
const DEFAULT_DFMEA_SEVERITY: Omit<SODItem, 'id'>[] = [
  { fmeaType: 'D-FMEA', category: 'S', rating: 10, levelKr: '매우 높음', levelEn: 'Very High', 
    endUser: '차량 및/또는 다른 자동차의 안전운행, 운전자, 승객 또는 도로 사용자나 보행자의 건강에 영향을 미침\nAffects safe operation of the vehicle and/or other vehicles, the health of driver or passenger(s) or road users or pedestrians.' },
  { fmeaType: 'D-FMEA', category: 'S', rating: 9, levelKr: '매우 높음', levelEn: 'Very High', 
    endUser: '규제사항 미준수\nNoncompliance with regulations.' },
  { fmeaType: 'D-FMEA', category: 'S', rating: 8, levelKr: '높음', levelEn: 'High', 
    endUser: '기대되는 사용수명기간 동안 정상 주행에 필요한 자동차 주요 기능의 상실\nLoss of primary vehicle function necessary for normal driving during expected service life.' },
  { fmeaType: 'D-FMEA', category: 'S', rating: 7, levelKr: '높음', levelEn: 'High', 
    endUser: '기대되는 사용수명기간 동안 정상 주행에 필요한 자동차 주요 기능의 저하\nDegradation of primary vehicle function necessary for normal driving during expected service life.' },
  { fmeaType: 'D-FMEA', category: 'S', rating: 6, levelKr: '중간', levelEn: 'Moderate', 
    endUser: '자동차 보조 기능 상실\nLoss of secondary vehicle function.' },
  { fmeaType: 'D-FMEA', category: 'S', rating: 5, levelKr: '중간', levelEn: 'Moderate', 
    endUser: '자동차 보조 기능 저하\nDegradation of secondary vehicle function.' },
  { fmeaType: 'D-FMEA', category: 'S', rating: 4, levelKr: '중간', levelEn: 'Moderate', 
    endUser: '매우 좋지않은 외관, 소리, 진동, 거친소리 또는 촉각\nVery objectionable appearance, sound, vibration, harshness, or haptics.' },
  { fmeaType: 'D-FMEA', category: 'S', rating: 3, levelKr: '낮음', levelEn: 'Low', 
    endUser: '중간정도의 좋지않은 외관, 소리, 진동, 거친소리 또는 촉각\nModerately objectionable appearance, sound, vibration, harshness, or haptics.' },
  { fmeaType: 'D-FMEA', category: 'S', rating: 2, levelKr: '낮음', levelEn: 'Low', 
    endUser: '약간 좋지않은 외관, 소리, 진동, 거친소리 또는 촉각\nSlightly objectionable appearance, sound, vibration, harshness, or haptics.' },
  { fmeaType: 'D-FMEA', category: 'S', rating: 1, levelKr: '매우 낮음', levelEn: 'Very Low', 
    endUser: '인지할 수 있는 영향 없음\nNo discernible effect.' },
];

// D-FMEA 발생도 기본 데이터 (AIAG & VDA FMEA Handbook 기준)
const DEFAULT_DFMEA_OCCURRENCE: Omit<SODItem, 'id'>[] = [
  { fmeaType: 'D-FMEA', category: 'O', rating: 10, levelKr: '극도로 높음', levelEn: 'Extremely High', 
    criteria: '① 운행경험 및/또는 통제되지 않은 운행조건하에서 새로운 기술을 처음으로 적용한다.\n② 제품검증 및/또는 타당성 확인 경험이 없다\n③ 표준은 존재하지 않으며, 모범사례는 아직 결정되지 않았다.\n④ 예방관리가 필드성능을 예측할 수 없거나, 존재하지 않는다.\n① First application of new technology anywhere without operating experience and/or under uncontrolled operating conditions.\n② No product verification and/or validation experience.\n③ Standards do not exist and best practices have not yet been determined.\n④ Prevention controls not able to predict field performance or do not exist.',
    description: '100개/1,000개\n1/10개' },
  { fmeaType: 'D-FMEA', category: 'O', rating: 9, levelKr: '매우 높음', levelEn: 'Very High', 
    criteria: '① 회사 내에서 기술혁신이나 재료로 설계를 처음 사용한다.\n② 새로운 적용 또는 부품 수명의 변경 / 운행(자동차 사용) 조건 변화.\n③ 제품검증 및/또는 타당성 확인 경험이 없다.\n④ 예방관리는 특정 요구사항에 대한 성능을 식별하기 위해 목표로 하지 않는다.\n① First use of design with technical innovations or materials within the company.\n② New application, or change in duty cycle / operating conditions.\n③ No product verification and/or validation experience.\n④ Prevention controls not targeted to identify performance to specific requirements.',
    description: '50개/1,000개\n1개/20개' },
  { fmeaType: 'D-FMEA', category: 'O', rating: 8, levelKr: '매우 높음', levelEn: 'Very High', 
    criteria: '① 새로운 적용 분야에 기술혁신이나 재료를 설계에 처음 사용\n② 새로운 어플리케이션 또는 듀티 사이클 / 운행조건\n③ 제품 검증 및 / 또는 유효성 검사 경험이 없음.\n④ 설계에 직접 적용 할 있는 표준이나 모범사례가 거의 없음.\n⑤ 예방관리가 필드성능에 대해 신뢰할 만한 지표가 아님.\n① First use of design with technical innovations or materials on a new application.\n② New application, or change in duty cycle/operating conditions.\n③ No product verification and/or validation experience.\n④ Few existing standards and best practices, not directly applicable for this design.\n⑤ Prevention controls not a reliable indicator of field performance.',
    description: '20개/1,000개\n1개/20개' },
  { fmeaType: 'D-FMEA', category: 'O', rating: 7, levelKr: '높음', levelEn: 'High', 
    criteria: '① 유사한 기술과 재료를 바탕으로 한 새로운 설계\n② 새로운 어플리케이션 또는 듀티 사이클 / 운행조건\n③ 제품 검증 및 / 또는 유효성 검사 경험이 없음.\n④ 표준이나 모범사례가 기본설계에 적용되지만, 혁신은 적용되지 않음\n⑤ 예방관리가 필드성능에 대해 신뢰할 만한 지표가 아님.\n① New design based on similar technology and materials.\n② New application, or change in duty cycle/operating conditions.\n③ No product verification and/or validation experience.\n④ Standards, best practices, and design rules apply to the baseline design, but not the innovations.\n⑤ Prevention controls not a reliable indicator of field performance.',
    description: '10개/1,000개\n1개/100개' },
  { fmeaType: 'D-FMEA', category: 'O', rating: 6, levelKr: '높음', levelEn: 'High', 
    criteria: '① 기존 기술과 재료를 사용한 이전 설계와 유사함.\n② 유사한 애플리케이션 또는 듀티 사이클 / 운행조건\n③ 제품 검증 및 / 또는 유효성 검증 경험 있음.\n④ 표준과 설계는 존재하지만 필드고장을 원인을 예방하기에는 불충분 함.\n⑤ 예방관리가 고장 원인을 예방할 수 있는 일부능력을 제공함\n① Similar to previous designs, using existing technology and materials.\n② Similar application with changes in duty cycle or operating conditions.\n③ Previous testing or field experience.\n④ Standards and design rules exist but are insufficient to ensure that the failure cause will not occur.\n⑤ Prevention controls provide some ability to prevent a failure cause.',
    description: '2개/1,000개\n1개/500개' },
  { fmeaType: 'D-FMEA', category: 'O', rating: 5, levelKr: '중간', levelEn: 'Moderate', 
    criteria: '① 입증된 재료를 사용한 이전 설계와 세부사항 변경.\n② 유사한 적용, 듀티 사이클 / 운행조건\n③ 이전 시험 또는 필드경험 또는 새로운 설계에 대한 시험 경험 있음.\n④ 이전 설계로 부터 학습교훈을 적용, 설계에 대한 모범사례가 재평가 되었지만, 아직 입증되지 않음.\n⑤ 예방관리은 일부 고장 원인과 관련된 결함을 찾아내고, 일부성능지표를 제공함\n① Detail changes to previous design using proven technology and materials.\n② Similar application, duty cycle or operating conditions.\n③ Previous testing or field experience, or new design with some test experience related to the failure.\n④ Design addresses lessons learned from previous designs. Best Practices re-evaluated for this design, but have not yet been proven.\n⑤ Prevention controls capable of finding deficiencies in the product related to the failure cause and provide some indication of performance.',
    description: '0.5개/1,000개\n1개/2000개' },
  { fmeaType: 'D-FMEA', category: 'O', rating: 4, levelKr: '중간', levelEn: 'Moderate', 
    criteria: '① 단기적 필드 노출과 거의 동일한 설계\n② 유사한 적용, 듀티 사이클 / 운행조건에서 약간의 변경\n③ 이전 시험 또는 필드경험.\n④ 새로운 설계의 선행설계 및 변경은 모범사례, 표준 및 시방을 준수 함.\n⑤ 예방관리은 고장 원인과 관련된 결함을 찾아내고, 설계 적합성을 나타낼 수 있음.\n① Almost identical design with short-term field exposure.\n② Similar application, with minor change in duty cycle or operating conditions.\n③ Previous testing or field experience. Predecessor design and changes for new design conform to best practices standards, and specifications.\n④ Design addresses lessons learned from previous designs. Best Practices re-evaluated for this design, but have not yet been proven.\n⑤ Prevention controls capable of finding deficiencies in the product related to the failure cause, and indicate likely design conformance.',
    description: '0.1개/1,000개\n1개/10,000개' },
  { fmeaType: 'D-FMEA', category: 'O', rating: 3, levelKr: '낮음', levelEn: 'Low', 
    criteria: '① 알려진 설계에서 세부사항 변경\n② 동일한 적용, 듀티 사이클 / 운행조건에서 약간의 변경\n③ 비교 가능한 운행조건 하에서 시험 및 필드 경험 있음.\n④ 새로운 설계에 대한 성공적으로 수행된 시험 절차 보유\n⑤ 예방관리은 고장 원인과 관련된 결함을 찾아내고, 생산 설계 적합성을 나타낼 수 있음.\n① Detail changes to known design.\n② Same application with minor change in duty cycle or operating conditions.\n③ and testing or field experience under comparable operating conditions.\n④ or new design with successfully completed test procedure.\n⑤ Prevention controls capable of finding deficiencies in the product related to the failure cause and predict conformance of production design.',
    description: '0.01개/1,000개\n1개/100,000개' },
  { fmeaType: 'D-FMEA', category: 'O', rating: 2, levelKr: '매우낮음', levelEn: 'Very Low', 
    criteria: '① 장기적인 필드 노출로 거의 동일한 성숙된 설계\n② 듀티 싸이클, 운행조건의 약간의 변경을 갖는 동일 적용\n③ 비교 가능한 운행조건에서 시험 및 필드 경험 보유\n④ 신뢰할 만한 이전 설계로 부터 표준, 학습교훈이 고려된 모범사례에 적합한 설계\n⑤ 예방관리은 고장 원인과 관련된 결함을 찾아내고, 설계 적합성에 신뢰성이 있음.\n① Almost identical mature design with long term field exposure.\n② Same application, with comparable duty cycle and operating conditions.\n③ Testing or field experience under comparable operating conditions.\n④ Design expected to conform to Standards and Best Practices considering Lessons Learned from previous designs with significant margin of confidence.\n⑤ Prevention controls capable of finding deficiencies in the product related to the failure cause and indicate confidence in design conformance.',
    description: '0.001개미만/1,000개\n1개/1,000,000개' },
  { fmeaType: 'D-FMEA', category: 'O', rating: 1, levelKr: '극도로 낮음', levelEn: 'Extremely Low', 
    criteria: '고장은 예방관리를 통해 제거되고, 고장원인은 설계에 의해 발생이 불가능 함.\nFailure eliminated through prevention control and failure cause is not possible by design.',
    description: '예방관리를 통해 제거됨\nFailure is eliminated through prevention control' },
];

// D-FMEA 검출도 기본 데이터 (AIAG & VDA FMEA Handbook 기준)
const DEFAULT_DFMEA_DETECTION: Omit<SODItem, 'id'>[] = [
  { fmeaType: 'D-FMEA', category: 'D', rating: 10, levelKr: '매우 낮음', levelEn: 'Very Low', 
    criteria: '아직 개발되지 않은 시험 절차.\nTest procedure yet to be developed.',
    description: '시험방법이 정의되지 않음\nPass-Fail, Test-to-Fail, Degradation Testing' },
  { fmeaType: 'D-FMEA', category: 'D', rating: 9, levelKr: '매우 낮음', levelEn: 'Very Low', 
    criteria: '고장형태 또는 원인을 검출하도록 구체적으로 설계되지 않은 시험 방법.\nTest method not designed specifically to detect failure mode or cause.',
    description: '합격-불합격 시험, 불합격 시험, 성능저하(열화)시험\nPass-Fail, Test-to-Fail, Degradation Testing' },
  { fmeaType: 'D-FMEA', category: 'D', rating: 8, levelKr: '낮음', levelEn: 'Low', 
    criteria: '새로운 시험방법 : 입증되지 않음\nNew test method; not proven.',
    description: '합격-불합격 시험, 불합격 시험, 성능저하(열화)시험\nPass-Fail, Test-to-Fail, Degradation Testing' },
  { fmeaType: 'D-FMEA', category: 'D', rating: 7, levelKr: '낮음', levelEn: 'Low', 
    criteria: '새로운 시험방법 : 양산승인 전 양산 툴 변경을 위한 시간이 충분하지 못함.\nNew test method; not proven; planned timing is sufficient to modify production tools before release for production.',
    description: '합격-불합격 시험\nPass-Fail Testing' },
  { fmeaType: 'D-FMEA', category: 'D', rating: 6, levelKr: '중간', levelEn: 'Moderate', 
    criteria: '기능 검증 또는 성능, 품질, 신뢰성 및 내구성의 유효성확인을 위한 입증된 시험방법; 시험실패로 인한 재 설계 및/또는 재 툴링을 위한 생산 지연이 발생할 수 있는 제품개발 사이클의 후반부에 계획 됨.\nProven test method for verification of functionality or validation of performance, quality, reliability and durability; planned timing is later in the product development cycle such that test failures may result in production delays for re-design and/or re-tooling.',
    description: '불합격 시험\nTest-to-Failure' },
  { fmeaType: 'D-FMEA', category: 'D', rating: 5, levelKr: '중간', levelEn: 'Moderate', 
    criteria: 'Proven test method for verification of functionality or validation of performance, quality, reliability and durability; planned timing is later in the product development cycle such that test failures may result in production delays for re-design and/or re-tooling.',
    description: '성능저하(열화)시험\nDegradation Testing' },
  { fmeaType: 'D-FMEA', category: 'D', rating: 4, levelKr: '높음', levelEn: 'High', 
    criteria: '성능, 품질, 신뢰성 및 내구성의 기능검증 또는 실현성 확인/타당성 확인을 위한 입증된 시험방법; 계획된 시험일정이 양산을 위한 불출 전에 생산 툴을 수정하기에 충분하다.\nProven test method for verification of functionality or validation of performance, quality, reliability and durability; planned timing is sufficient to modify production tools before release for production.',
    description: '합격-불합격 시험\nPass-Fail' },
  { fmeaType: 'D-FMEA', category: 'D', rating: 3, levelKr: '높음', levelEn: 'High', 
    criteria: 'Proven test method for verification of functionality or validation of performance, quality, reliability and durability; planned timing is sufficient to modify production tools before release for production.',
    description: '불합격 시험\nTest-to-Failure' },
  { fmeaType: 'D-FMEA', category: 'D', rating: 2, levelKr: '높음', levelEn: 'High', 
    criteria: 'Proven test method for verification of functionality or validation of performance, quality, reliability and durability; planned timing is sufficient to modify production tools before release for production.',
    description: '성능저하(열화)시험\nDegradation Testing' },
  { fmeaType: 'D-FMEA', category: 'D', rating: 1, levelKr: '매우 높음', levelEn: 'Very High', 
    criteria: '시험 전에 고장형태 또는 원인이 발생할 수 없음을 확인하거나, 고장형태 또는 고장원인을 항상 검출하는 것으로 입증된 검출방법을 확인 한다\nPrior testing confirmed that failure mode or cause cannot occur, or detection methods proven to always detect the failure mode or failure cause.',
    description: '' },
];

const uid = () => 'sod_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16);

export default function SODMasterModal({ isOpen, onClose }: SODMasterModalProps) {
  const [items, setItems] = useState<SODItem[]>([]);
  const [activeTab, setActiveTab] = useState<'P-FMEA' | 'D-FMEA'>('P-FMEA');
  const [activeCategory, setActiveCategory] = useState<'S' | 'O' | 'D'>('S');
  const [mounted, setMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // 수정/저장 토글

  useEffect(() => {
    setMounted(true);
  }, []);

  // 데이터 로드 (v2: controlType, preventionControl 필드 추가로 인한 마이그레이션)
  useEffect(() => {
    if (!isOpen) return;

    const savedData = localStorage.getItem('sod_master_data');
    const needsMigration = savedData ? (() => {
      const parsed = JSON.parse(savedData);
      // 발생도(O) 데이터에 controlType 필드가 없으면 마이그레이션 필요
      const occurrenceItem = parsed.find((item: SODItem) => item.category === 'O');
      return occurrenceItem && !occurrenceItem.controlType;
    })() : false;

    // D-FMEA 데이터 존재 여부 확인
    const needsDfmeaMigration = savedData ? (() => {
      const parsed = JSON.parse(savedData);
      const dfmeaItem = parsed.find((item: SODItem) => item.fmeaType === 'D-FMEA');
      return !dfmeaItem;
    })() : false;

    if (savedData && !needsMigration && !needsDfmeaMigration) {
      setItems(JSON.parse(savedData));
    } else {
      // 기본 데이터 생성 (신규 또는 마이그레이션) - P-FMEA + D-FMEA
      const defaultItems: SODItem[] = [
        // P-FMEA
        ...DEFAULT_PFMEA_SEVERITY.map(item => ({ ...item, id: uid() })),
        ...DEFAULT_PFMEA_OCCURRENCE.map(item => ({ ...item, id: uid() })),
        ...DEFAULT_PFMEA_DETECTION.map(item => ({ ...item, id: uid() })),
        // D-FMEA
        ...DEFAULT_DFMEA_SEVERITY.map(item => ({ ...item, id: uid() })),
        ...DEFAULT_DFMEA_OCCURRENCE.map(item => ({ ...item, id: uid() })),
        ...DEFAULT_DFMEA_DETECTION.map(item => ({ ...item, id: uid() })),
      ];
      setItems(defaultItems);
      localStorage.setItem('sod_master_data', JSON.stringify(defaultItems));
      console.log('[SOD] 데이터 마이그레이션 완료 - P-FMEA + D-FMEA 데이터 추가');
    }
  }, [isOpen]);

  // 저장 (수정모드에서 저장 후 보기모드로 전환)
  const handleSave = useCallback(() => {
    localStorage.setItem('sod_master_data', JSON.stringify(items));
    setIsEditMode(false);
    alert('저장되었습니다.');
  }, [items]);

  // 수정모드 토글
  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  // 내보내기
  const handleExport = useCallback(() => {
    const filteredItems = items.filter(item => item.fmeaType === activeTab && item.category === activeCategory);
    const csvContent = [
      ['등급', '레벨(한글)', '레벨(영문)', 'Your Plant', 'Ship to Plant', 'End User', '기준', '설명'].join(','),
      ...filteredItems.map(item => [
        item.rating,
        item.levelKr,
        item.levelEn,
        item.yourPlant || '',
        item.shipToPlant || '',
        item.endUser || '',
        item.criteria || '',
        item.description || ''
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab}_${activeCategory === 'S' ? '심각도' : activeCategory === 'O' ? '발생도' : '검출도'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [items, activeTab, activeCategory]);

  // 가져오기
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(1); // 헤더 제외
        
        const importedItems: SODItem[] = lines
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
            return {
              id: uid(),
              fmeaType: activeTab,
              category: activeCategory,
              rating: parseInt(values[0]) || 1,
              levelKr: values[1] || '',
              levelEn: values[2] || '',
              yourPlant: values[3] || undefined,
              shipToPlant: values[4] || undefined,
              endUser: values[5] || undefined,
              criteria: values[6] || undefined,
              description: values[7] || undefined,
            };
          });

        // 기존 데이터에서 해당 탭/카테고리 제외하고 새 데이터 추가
        setItems(prev => [
          ...prev.filter(item => !(item.fmeaType === activeTab && item.category === activeCategory)),
          ...importedItems
        ]);
        alert(`${importedItems.length}개 항목을 가져왔습니다.`);
      };
      reader.readAsText(file, 'UTF-8');
    };
    input.click();
  }, [activeTab, activeCategory]);

  // 필터링된 아이템
  const filteredItems = items
    .filter(item => item.fmeaType === activeTab && item.category === activeCategory)
    .sort((a, b) => b.rating - a.rating);

  // 셀 수정
  const updateItem = useCallback((id: string, field: keyof SODItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }, []);

  if (!mounted || !isOpen) return null;

  const categoryLabels = {
    S: { kr: '심각도', en: 'Severity', color: '#c62828', full: '심각도(Severity)' },
    O: { kr: '발생도', en: 'Occurrence', color: '#1565c0', full: '발생도(Occurrence)' },
    D: { kr: '검출도', en: 'Detection', color: '#2e7d32', full: '검출도(Detection)' },
  };

  const modalContent = (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '12px', width: '95%', maxWidth: '1200px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* 헤더 */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', 
          color: 'white', padding: '16px 24px', borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>📊 SOD 기준표 관리 (SOD Criteria Management)</h2>
              <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.8 }}>심각도(Severity) / 발생도(Occurrence) / 검출도(Detection) 기준표 등록 및 관리</p>
            </div>
            {isEditMode && (
              <span style={{ 
                background: '#ff5722', color: 'white', padding: '4px 12px', borderRadius: '12px', 
                fontSize: '11px', fontWeight: 700, animation: 'pulse 1.5s infinite'
              }}>
                ✏️ 수정중
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleImport} style={{ padding: '6px 12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Import
            </button>
            <button onClick={handleExport} style={{ padding: '6px 12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Export
            </button>
            {/* 수정/저장 토글 버튼 */}
            {isEditMode ? (
              <button onClick={handleSave} style={{ padding: '6px 12px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                💾 저장
              </button>
            ) : (
              <button onClick={handleToggleEditMode} style={{ padding: '6px 12px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                ✏️ 수정
              </button>
            )}
            {isEditMode && (
              <button onClick={() => setIsEditMode(false)} style={{ padding: '6px 12px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                취소
              </button>
            )}
            <button onClick={onClose} style={{ padding: '6px 12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        </div>

        {/* FMEA 타입 탭 */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', background: '#f5f5f5' }}>
          {(['P-FMEA', 'D-FMEA'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                background: activeTab === tab ? 'white' : 'transparent',
                borderBottom: activeTab === tab ? '3px solid #1a237e' : 'none',
                fontWeight: activeTab === tab ? 700 : 400,
                color: activeTab === tab ? '#1a237e' : '#666',
                fontSize: '14px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SOD 카테고리 탭 */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 24px', background: '#fafafa' }}>
          {(['S', 'O', 'D'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 24px', border: 'none', borderRadius: '20px', cursor: 'pointer',
                background: activeCategory === cat ? categoryLabels[cat].color : '#e0e0e0',
                color: activeCategory === cat ? 'white' : '#666',
                fontWeight: 600, fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              {cat} - {categoryLabels[cat].full}
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: categoryLabels[activeCategory].color, color: 'white' }}>
                <th style={{ padding: '10px', border: '1px solid #ccc', width: '70px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  등급<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Rating</span>
                </th>
                <th style={{ padding: '10px', border: '1px solid #ccc', width: '100px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  레벨(한글)<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Level(KR)</span>
                </th>
                <th style={{ padding: '10px', border: '1px solid #ccc', width: '100px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  레벨(영문)<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Level(EN)</span>
                </th>
                {activeCategory === 'S' ? (
                  activeTab === 'P-FMEA' ? (
                    // P-FMEA 심각도: 3개 컬럼
                    <>
                      <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        귀사의 공장에 미치는 영향<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Impact to Your Plant</span>
                      </th>
                      <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        고객사에 미치는 영향<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Impact to Ship-to-Plant</span>
                      </th>
                      <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        최종사용자에 대한 영향<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Impact to End User</span>
                      </th>
                    </>
                  ) : (
                    // D-FMEA 심각도: 1개 컬럼
                    <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      DFMEA 심각도 기준<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>DFMEA Severity Criteria</span>
                    </th>
                  )
                ) : activeCategory === 'O' ? (
                  activeTab === 'P-FMEA' ? (
                    // P-FMEA 발생도: 3개 컬럼
                    <>
                      {/* 기준 - 노란색 계열 */}
                      <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center', background: '#f9a825', color: 'white' }}>
                        관리유형<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Type of Control</span>
                      </th>
                      <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center', background: '#f9a825', color: 'white' }}>
                        예방관리<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Prevention Controls</span>
                      </th>
                      {/* 대안1 - 빨간색 계열 */}
                      <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center', background: '#c62828', color: 'white' }}>
                        FMEA 대안1 발생빈도<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Incidents per 1,000 items</span>
                      </th>
                    </>
                  ) : (
                    // D-FMEA 발생도: 2개 컬럼
                    <>
                      <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        DFMEA 발생도 기준<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>DFMEA Occurrence Criteria</span>
                      </th>
                      {/* 대안1 - 빨간색 계열 */}
                      <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center', background: '#c62828', color: 'white' }}>
                        FMEA 대안1<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Incidents per 1,000 item/vehicles</span>
                      </th>
                    </>
                  )
                ) : (
                  <>
                    <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      검출방법 성숙도<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Detection Method Maturity</span>
                    </th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      검출기회<br/><span style={{ fontSize: '10px', opacity: 0.9 }}>Opportunity for Detection</span>
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                // 등급(Rating) 숫자 기준 위험도 색상: 10=적색(위험), 1=녹색(안전)
                const rating = item.rating;
                let rowBgColor = '#fff';
                let ratingBgColor = '#e0e0e0';
                let ratingTextColor = '#333';
                
                if (rating >= 9) {
                  // 9-10: 적색 (매우 위험)
                  rowBgColor = '#ffcdd2';
                  ratingBgColor = '#c62828';
                  ratingTextColor = '#fff';
                } else if (rating >= 7) {
                  // 7-8: 주황색 (위험)
                  rowBgColor = '#ffe0b2';
                  ratingBgColor = '#ef6c00';
                  ratingTextColor = '#fff';
                } else if (rating >= 5) {
                  // 5-6: 노란색 (보통)
                  rowBgColor = '#fff9c4';
                  ratingBgColor = '#f9a825';
                  ratingTextColor = '#333';
                } else if (rating >= 3) {
                  // 3-4: 연두색 (낮음)
                  rowBgColor = '#dcedc8';
                  ratingBgColor = '#7cb342';
                  ratingTextColor = '#fff';
                } else {
                  // 1-2: 녹색 (매우 낮음/안전)
                  rowBgColor = '#c8e6c9';
                  ratingBgColor = '#2e7d32';
                  ratingTextColor = '#fff';
                }
                
                return (
                <tr key={item.id} style={{ background: rowBgColor }}>
                  <td style={{ 
                    padding: '8px', border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 700,
                    background: ratingBgColor,
                    color: ratingTextColor
                  }}>
                    {item.rating}
                  </td>
                  <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={item.levelKr}
                        onChange={(e) => updateItem(item.id, 'levelKr', e.target.value)}
                        style={{ width: '100%', border: '1px solid #2196f3', padding: '4px', fontSize: '12px', background: '#e3f2fd', borderRadius: '3px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '12px', padding: '4px', display: 'block' }}>{item.levelKr}</span>
                    )}
                  </td>
                  <td style={{ padding: '4px', border: '1px solid #e0e0e0' }}>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={item.levelEn}
                        onChange={(e) => updateItem(item.id, 'levelEn', e.target.value)}
                        style={{ width: '100%', border: '1px solid #2196f3', padding: '4px', fontSize: '12px', background: '#e3f2fd', borderRadius: '3px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '12px', padding: '4px', display: 'block' }}>{item.levelEn}</span>
                    )}
                  </td>
                  {activeCategory === 'S' ? (
                    activeTab === 'P-FMEA' ? (
                      // P-FMEA 심각도: 3개 컬럼
                      <>
                        <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                            <div style={{ color: '#333', marginBottom: '4px' }}>{(item.yourPlant || '').split('(')[0].trim()}</div>
                            <div style={{ color: '#1565c0', fontSize: '10px', fontStyle: 'italic' }}>
                              {(item.yourPlant || '').includes('(') ? '(' + (item.yourPlant || '').split('(').slice(1).join('(') : ''}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                            <div style={{ color: '#333', marginBottom: '4px' }}>{(item.shipToPlant || '').split('(')[0].trim()}</div>
                            <div style={{ color: '#1565c0', fontSize: '10px', fontStyle: 'italic' }}>
                              {(item.shipToPlant || '').includes('(') ? '(' + (item.shipToPlant || '').split('(').slice(1).join('(') : ''}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                            <div style={{ color: '#333', marginBottom: '4px' }}>{(item.endUser || '').split('(')[0].trim()}</div>
                            <div style={{ color: '#1565c0', fontSize: '10px', fontStyle: 'italic' }}>
                              {(item.endUser || '').includes('(') ? '(' + (item.endUser || '').split('(').slice(1).join('(') : ''}
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      // D-FMEA 심각도: 1개 컬럼 (endUser 필드에 저장)
                      <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                        <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                          {(item.endUser || '').split('\n').map((line, i) => (
                            <div key={i} style={{ color: i === 0 ? '#333' : '#1565c0', fontStyle: i === 0 ? 'normal' : 'italic', fontSize: i === 0 ? '11px' : '10px' }}>
                              {line}
                            </div>
                          ))}
                        </div>
                      </td>
                    )
                  ) : activeCategory === 'O' ? (
                    activeTab === 'P-FMEA' ? (
                      // P-FMEA 발생도: 3개 컬럼
                      <>
                        {/* 관리유형 - 기준 (노란색 배경) */}
                        <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top', background: '#fff8e1' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                            {(item.controlType || '').split('\n').map((line, i) => (
                              <div key={i} style={{ color: i === 0 ? '#333' : '#1565c0', fontStyle: i === 0 ? 'normal' : 'italic', fontSize: i === 0 ? '11px' : '10px' }}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* 예방관리 - 기준 (노란색 배경) */}
                        <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top', background: '#fff8e1' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                            {(item.preventionControl || '').split('\n').map((line, i) => (
                              <div key={i} style={{ color: i % 2 === 0 ? '#333' : '#1565c0', fontStyle: i % 2 === 0 ? 'normal' : 'italic', fontSize: i % 2 === 0 ? '11px' : '10px' }}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </td>
                        {/* 발생빈도 - 대안1 (빨간색 배경) */}
                        <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top', background: '#ffebee' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                            {(item.description || '').split('\n').map((line, i) => (
                              <div key={i} style={{ color: i === 0 ? '#c62828' : '#1565c0', fontWeight: i === 0 ? 600 : 400, fontStyle: i === 0 ? 'normal' : 'italic', fontSize: i === 0 ? '11px' : '10px' }}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </td>
                      </>
                    ) : (
                      // D-FMEA 발생도: 2개 컬럼 (criteria + description)
                      <>
                        {/* DFMEA 발생도 기준 */}
                        <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                            {(item.criteria || '').split('\n').map((line, i) => {
                              // 영문은 파란색 이탤릭
                              const isEnglish = /^[①②③④⑤]?\s*[A-Z]/.test(line) || /^[A-Z]/.test(line.trim());
                              return (
                                <div key={i} style={{ 
                                  color: isEnglish ? '#1565c0' : '#333', 
                                  fontStyle: isEnglish ? 'italic' : 'normal', 
                                  fontSize: isEnglish ? '10px' : '11px' 
                                }}>
                                  {line}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        {/* FMEA 대안1 (빨간색 배경) */}
                        <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top', background: '#ffebee' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                            {(item.description || '').split('\n').map((line, i) => (
                              <div key={i} style={{ color: i === 0 ? '#c62828' : '#1565c0', fontWeight: i === 0 ? 600 : 400, fontStyle: i === 0 ? 'normal' : 'italic', fontSize: i === 0 ? '11px' : '10px' }}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </td>
                      </>
                    )
                  ) : (
                    <>
                      {/* 검출도 - 등급 1은 셀 병합 */}
                      {item.rating === 1 ? (
                        <td colSpan={2} style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                            {(item.criteria || '').split('(').map((part, i) => (
                              <div key={i} style={{ color: i === 0 ? '#333' : '#1565c0', fontStyle: i === 0 ? 'normal' : 'italic', fontSize: i === 0 ? '11px' : '10px' }}>
                                {i === 0 ? part.trim() : '(' + part}
                              </div>
                            ))}
                          </div>
                        </td>
                      ) : (
                        <>
                          {/* 검출도 - 검출방법 성숙도 */}
                          <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                              {(item.criteria || '').split('(').map((part, i) => (
                                <div key={i} style={{ color: i === 0 ? '#333' : '#1565c0', fontStyle: i === 0 ? 'normal' : 'italic', fontSize: i === 0 ? '11px' : '10px' }}>
                                  {i === 0 ? part.trim() : '(' + part}
                                </div>
                              ))}
                            </div>
                          </td>
                          {/* 검출도 - 검출기회 */}
                          <td style={{ padding: '6px', border: '1px solid #e0e0e0', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
                              {(item.description || '').split('(').map((part, i) => (
                                <div key={i} style={{ color: i === 0 ? '#333' : '#1565c0', fontStyle: i === 0 ? 'normal' : 'italic', fontSize: i === 0 ? '11px' : '10px' }}>
                                  {i === 0 ? part.trim() : '(' + part}
                                </div>
                              ))}
                            </div>
                          </td>
                        </>
                      )}
                    </>
                  )}
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {/* 푸터 */}
        <div style={{ padding: '12px 24px', background: '#f5f5f5', borderTop: '1px solid #e0e0e0', fontSize: '11px', color: '#666' }}>
          총 {filteredItems.length}개 항목 (Total {filteredItems.length} items) | {activeTab} {categoryLabels[activeCategory].full} 기준표
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}


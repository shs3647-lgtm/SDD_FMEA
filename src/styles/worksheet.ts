/**
 * @file worksheet.ts
 * @description 워크시트 표준 스타일 (3가지 패턴)
 * 
 * 1. 구조분석 (파란색) - Structure
 * 2. 기능분석 (초록색) - Function (L1/L2/L3 통일)
 * 3. 고장분석 (주황색) - Failure (영향/형태/원인 통일)
 */

// ============ 컨테이너 ============
export const container = 'p-0 overflow-auto h-full';
export const table = 'w-full border-collapse table-fixed';

// ============ 셀 구분선 (1px 회색) ============
export const border = 'border border-[#ccc]';

// ============ 제목-데이터 구분선 (2px 네이비) ============
export const headerDataDivider = 'border-b-2 border-[#1a237e]';
export const theadWithDivider = 'sticky top-0 z-20 bg-white border-b-2 border-[#1a237e]';

// ============ 1. 구조분석 (파란색) ============
export const S = {
  h1: 'bg-[#1976d2] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center',
  h2: 'bg-[#1976d2] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center',
  h3: 'bg-[#e3f2fd] border border-[#ccc] p-1.5 text-xs font-semibold',
  cell: 'border border-[#ccc] p-1 text-xs align-middle bg-[#e3f2fd]',
  cellBold: 'border border-[#ccc] p-2 text-xs align-middle bg-[#e3f2fd] font-semibold text-center',
  zebra: (i: number) => i % 2 === 0 ? 'bg-[#e3f2fd]' : 'bg-[#bbdefb]',
};

// ============ 2. 기능분석 (초록색) - L1/L2/L3 통일 ============
export const F = {
  h1: 'bg-[#388e3c] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center',
  h2: 'bg-[#388e3c] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center',
  h3: 'bg-[#c8e6c9] border border-[#ccc] p-1.5 text-xs font-semibold',
  cell: 'border border-[#ccc] p-1 text-xs align-middle bg-[#e8f5e9]',
  cellBold: 'border border-[#ccc] p-2 text-xs align-middle bg-[#e8f5e9] font-semibold',
  zebra: (i: number) => i % 2 === 0 ? 'bg-[#e8f5e9]' : 'bg-[#c8e6c9]',
};

// ============ 3. 고장분석 (주황색) - 영향/형태/원인 통일 ============
export const X = {
  h1: 'bg-[#f57c00] text-white border border-[#ccc] p-2 text-xs font-extrabold text-center',
  h2: 'bg-[#f57c00] text-white border border-[#ccc] p-1.5 text-xs font-semibold text-center',
  h3: 'bg-[#ffe0b2] border border-[#ccc] p-1.5 text-xs font-semibold',
  cell: 'border border-[#ccc] p-1 text-xs align-middle bg-[#fff3e0]',
  cellBold: 'border border-[#ccc] p-2 text-xs align-middle bg-[#fff3e0] font-semibold',
  zebra: (i: number) => i % 2 === 0 ? 'bg-[#fff3e0]' : 'bg-[#ffe0b2]',
};

// ============ 공통 ============
export const cell = 'border border-[#ccc] p-1 text-xs align-middle';
export const cellCenter = 'border border-[#ccc] p-1 text-xs align-middle text-center';
export const cellP0 = 'border border-[#ccc] p-0';

// ============ 버튼/배지 ============
export const btnConfirm = 'bg-green-600 text-white border-none px-2.5 py-0.5 rounded text-xs font-semibold cursor-pointer';
export const btnEdit = 'bg-orange-500 text-white border-none px-2.5 py-0.5 rounded text-xs font-semibold cursor-pointer';
export const btnDisabled = 'bg-gray-400 text-white border-none px-2.5 py-0.5 rounded text-xs font-semibold cursor-not-allowed opacity-70';
export const badgeOk = 'bg-green-600 text-white px-2.5 py-0.5 rounded text-xs font-semibold';
export const badgeMissing = 'bg-orange-500 text-white px-2.5 py-0.5 rounded text-xs font-semibold';
export const badgeCount = 'ml-1 bg-orange-500 text-white px-1.5 py-0.5 rounded-lg text-[11px]';

// ============ 하위 호환 (WS 객체) ============
export const WS = {
  h1Structure: S.h1, h2Structure: S.h2,
  h1Function: F.h1, h2Function: F.h2,
  h1Failure: X.h1, h2Failure: X.h2,
  btnConfirm, btnEdit, btnDisabled,
  badgeOk, badgeMissing, badgeCount,
};

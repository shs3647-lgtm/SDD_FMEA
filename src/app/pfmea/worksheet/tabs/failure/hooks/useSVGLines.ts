/**
 * @file useSVGLines.ts
 * @description SVG 연결선 계산 훅
 */

import { useState, useCallback, useEffect, RefObject } from 'react';

export function useSVGLines(
  chainAreaRef: RefObject<HTMLDivElement | null>,
  fmNodeRef: RefObject<HTMLDivElement | null>,
  feColRef: RefObject<HTMLDivElement | null>,
  fcColRef: RefObject<HTMLDivElement | null>,
  linkedFEs: Map<string, any>,
  linkedFCs: Map<string, any>,
  currentFM: any
) {
  const [svgPaths, setSvgPaths] = useState<string[]>([]);

  const drawLines = useCallback(() => {
    if (!chainAreaRef.current || !fmNodeRef.current) {
      setSvgPaths([]);
      return;
    }
    const area = chainAreaRef.current.getBoundingClientRect();
    const fmRect = fmNodeRef.current.getBoundingClientRect();
    const fmCenterY = fmRect.top + fmRect.height / 2 - area.top;
    const fmLeft = fmRect.left - area.left;
    const fmRight = fmRect.right - area.left;

    const paths: string[] = [];

    // FM → FE 곡선 (FM에서 FE로)
    if (feColRef.current) {
      const feCards = feColRef.current.querySelectorAll('.fe-card');
      feCards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const x1 = fmLeft;
        const y1 = fmCenterY;
        const x2 = r.right - area.left;
        const y2 = r.top + r.height / 2 - area.top;
        const cx = (x1 + x2) / 2;
        paths.push(`M ${x1} ${y1} Q ${cx} ${y1}, ${cx} ${(y1 + y2) / 2} T ${x2} ${y2}`);
      });
    }

    // FM → FC 곡선 (FM에서 FC로)
    if (fcColRef.current) {
      const fcCards = fcColRef.current.querySelectorAll('.fc-card');
      fcCards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const x1 = fmRight;
        const y1 = fmCenterY;
        const x2 = r.left - area.left;
        const y2 = r.top + r.height / 2 - area.top;
        const cx = (x1 + x2) / 2;
        paths.push(`M ${x1} ${y1} Q ${cx} ${y1}, ${cx} ${(y1 + y2) / 2} T ${x2} ${y2}`);
      });
    }

    setSvgPaths(paths);
  }, [chainAreaRef, fmNodeRef, feColRef, fcColRef]);

  useEffect(() => {
    // 여러 타이밍에 drawLines 호출 (카드 렌더링 후 확실히 그리기)
    const timer1 = setTimeout(drawLines, 50);
    const timer2 = setTimeout(drawLines, 150);
    const timer3 = setTimeout(drawLines, 300);
    const timer4 = setTimeout(drawLines, 500);
    const timer5 = setTimeout(drawLines, 1000);
    window.addEventListener('resize', drawLines);
    
    // MutationObserver로 DOM 변경 감지
    const observer = new MutationObserver(() => {
      setTimeout(drawLines, 50);
    });
    
    if (chainAreaRef.current) {
      observer.observe(chainAreaRef.current, { childList: true, subtree: true });
    }
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      window.removeEventListener('resize', drawLines);
      observer.disconnect();
    };
  }, [drawLines, linkedFEs, linkedFCs, currentFM, chainAreaRef]);

  return { svgPaths, drawLines };
}


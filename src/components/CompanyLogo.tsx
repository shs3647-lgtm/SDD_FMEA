/**
 * @file CompanyLogo.tsx
 * @description 회사 로고 컴포넌트 - 클릭 시 변경 및 저장 가능
 * @author AI Assistant
 * @created 2025-12-26
 * @version 1.0.0
 * 
 * 기능:
 * - 기본 로고 표시 (/logo.png)
 * - 클릭 시 파일 선택 다이얼로그
 * - 선택한 이미지를 LocalStorage에 저장
 * - 새로고침 시에도 저장된 로고 유지
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface CompanyLogoProps {
  /** 로고 너비 (기본: 120px) */
  width?: number;
  /** 로고 높이 (기본: 40px) */
  height?: number;
  /** 추가 CSS 클래스 */
  className?: string;
}

// LocalStorage 키
const LOGO_STORAGE_KEY = 'fmea_company_logo';

/**
 * 회사 로고 컴포넌트
 * 
 * @description
 * 클릭 시 새 로고를 업로드할 수 있습니다.
 * 업로드된 로고는 LocalStorage에 Base64로 저장됩니다.
 */
export function CompanyLogo({ 
  width = 120, 
  height = 40, 
  className = '' 
}: CompanyLogoProps) {
  // 현재 로고 URL (Base64 또는 기본 경로)
  const [logoSrc, setLogoSrc] = useState<string>('/logo.png');
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  // 호버 상태
  const [isHovered, setIsHovered] = useState(false);
  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 컴포넌트 마운트 시 저장된 로고 불러오기
   */
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
      if (savedLogo) {
        setLogoSrc(savedLogo);
      }
    } catch (error) {
      console.warn('로고 불러오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 로고 클릭 핸들러 - 파일 선택 다이얼로그 열기
   */
  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * 파일 선택 핸들러
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 제한 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('파일 크기는 2MB 이하여야 합니다.');
      return;
    }

    // FileReader로 Base64 변환
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      // LocalStorage에 저장
      try {
        localStorage.setItem(LOGO_STORAGE_KEY, base64);
        setLogoSrc(base64);
        console.log('✅ 로고가 저장되었습니다.');
      } catch (error) {
        console.error('로고 저장 실패:', error);
        alert('로고 저장에 실패했습니다. 파일 크기를 줄여주세요.');
      }
    };
    reader.readAsDataURL(file);

    // 입력 초기화 (같은 파일 재선택 가능하도록)
    event.target.value = '';
  };

  /**
   * 로고 초기화 (기본 로고로 복원)
   */
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(LOGO_STORAGE_KEY);
      setLogoSrc('/logo.png');
      console.log('✅ 로고가 초기화되었습니다.');
    } catch (error) {
      console.error('로고 초기화 실패:', error);
    }
  };

  if (isLoading) {
    return (
      <div 
        className={`bg-[#1d2a48] rounded animate-pulse ${className}`}
        style={{ width, height }}
      />
    );
  }

  return (
    <div 
      className={`relative cursor-pointer group ${className}`}
      onClick={handleLogoClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="클릭하여 로고 변경"
    >
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 로고 이미지 - 연한 파란색 배경, 패딩 최소화 */}
      <div 
        className="relative overflow-hidden rounded-lg border border-[#5ba9ff]/30 bg-[#e0f2fb] shadow-md"
        style={{ width, height, padding: '1px' }}
      >
        {logoSrc.startsWith('data:') ? (
          // Base64 이미지 (업로드된 로고)
          <img
            src={logoSrc}
            alt="Company Logo"
            className="w-full h-full object-contain"
          />
        ) : (
          // 기본 로고 (public 폴더)
          <Image
            src={logoSrc}
            alt="Company Logo"
            width={width}
            height={height}
            className="object-contain"
            priority
          />
        )}

        {/* 호버 오버레이 */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity">
            <div className="text-center">
              <span className="text-white text-xs font-bold block">📷</span>
              <span className="text-white text-[10px]">로고 변경</span>
            </div>
          </div>
        )}
      </div>

      {/* 초기화 버튼 (커스텀 로고일 때만 표시) */}
      {logoSrc.startsWith('data:') && isHovered && (
        <button
          onClick={handleReset}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
          title="기본 로고로 복원"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default CompanyLogo;


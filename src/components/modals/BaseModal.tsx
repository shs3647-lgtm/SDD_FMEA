'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  headerColor?: string;
  width?: string;
  tabs?: { id: string; label: string; icon?: string }[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  footerContent?: ReactNode;
  onSave?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
  children: ReactNode;
}

/**
 * 프로젝트 전체 모달 표준화를 위한 베이스 컴포넌트
 */
export default function BaseModal({
  isOpen,
  onClose,
  title,
  icon,
  headerColor = '#2b78c5',
  width = '600px',
  tabs,
  activeTab,
  onTabChange,
  footerContent,
  onSave,
  saveDisabled = false,
  saveLabel = '저장',
  children,
}: BaseModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
        style={{ width, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div 
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: headerColor }}
        >
          <h2 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
            {icon && <span>{icon}</span>}
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 탭 네비게이션 */}
        {tabs && tabs.length > 0 && (
          <div className="flex border-b bg-gray-50/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 text-blue-600 border-blue-500' 
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 본문 콘텐츠 */}
        <div className="flex-1 overflow-auto flex flex-col">
          {children}
        </div>

        {/* 푸터 */}
        <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-3">
            {footerContent}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-bold border rounded-md hover:bg-gray-100 transition-colors bg-white text-gray-700"
            >
              취소
            </button>
            {onSave && (
              <button 
                onClick={onSave}
                disabled={saveDisabled}
                className={`px-6 py-2 text-sm font-bold text-white rounded-md transition-all shadow-sm ${
                  saveDisabled 
                    ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                {saveLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}




/**
 * @file layout.tsx
 * @description FMEA Smart System 루트 레이아웃
 * @author AI Assistant
 * @created 2025-12-26
 * @version 1.0.0
 * 
 * 디자인 확정: 2025-12-26 18:00
 * - 화면 비율: Chrome 기준 100% 고정
 * - 스케일: 1.0 고정 (사용자 줌 비활성화)
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * 메타데이터 설정
 */
export const metadata: Metadata = {
  title: "FMEA Smart System",
  description: "FMEA · Control Plan · PFD · Work Standard — 모듈식 품질 플랫폼",
  keywords: ["FMEA", "PFMEA", "DFMEA", "Control Plan", "품질관리", "자동차"],
  authors: [{ name: "AMP SYSTEM" }],
};

/**
 * 뷰포트 설정 - 화면 비율 100% 고정
 * Chrome 기준 zoom level 100% 유지
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  minimumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 화면 비율 100% 고정을 위한 추가 스타일 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* 화면 비율 100% 고정 - Chrome 기준 */
            html {
              zoom: 100% !important;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            body {
              zoom: 1 !important;
              transform-origin: 0 0;
            }
            /* 스크롤바 스타일 */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #1d2a48;
            }
            ::-webkit-scrollbar-thumb {
              background: #3b5998;
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #5ba9ff;
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

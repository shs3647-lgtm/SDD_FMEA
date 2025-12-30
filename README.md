# FMEA Smart System

## 릴리즈 정보

### v1.7.0-고장연결-완성-251230 (2025-12-30)
**롤백 포인트**: 고장연결 기능 완성

#### 주요 변경사항
- 전체보기 화면 기능분석 데이터 표시 개선
- 마지막 행 병합 기능 구현 (FE/FC 개수 불일치 시 빈 셀 제거)
- 구조분석, 기능분석, 고장분석 모든 열에 마지막 행 병합 적용

#### 태그 정보
```bash
git checkout v1.7.0-고장연결-완성-251230
```

---

## 📋 개발 규칙

### 파일 크기 관리 (엄격 적용)

1. ⚠️ **700행 초과 시 무조건 분리** - 예외 없음
2. ⚠️ **새 기능은 별도 파일로** - 기존 파일에 추가 금지
3. ✅ **커밋 전 체크 필수** - 700행 초과 파일 확인

> 📖 상세 규칙: [docs/CODING_RULES.md](./docs/CODING_RULES.md) 참조

### 주요 문서

- [코딩 규칙 (CODING_RULES.md)](./docs/CODING_RULES.md) - 필수 개발 규칙
- [리팩토링 마스터 플랜 (REFACTORING_MASTER_PLAN.md)](./docs/REFACTORING_MASTER_PLAN.md) - 코드 최적화 계획
- [원자성 DB 아키텍처 (ATOMIC_DB_ARCHITECTURE.md)](./docs/ATOMIC_DB_ARCHITECTURE.md) - DB 설계 원칙
- [백업 가이드 (BACKUP_GUIDE.md)](./docs/BACKUP_GUIDE.md) - 백업 정책

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Backup Guide

## 백업 위치

```
C:\05_SDD_FMEA_BACKUP\
├── snapshots\          # 스냅샷 (PNG)
│   └── YYYYMMDD-HHMM\
├── html-screens\       # HTML 화면 (TSX)
│   └── YYYYMMDD-HHMM\
├── docs\               # 문서
│   └── YYYYMMDD-HHMM\
├── code\               # 코드 백업
│   └── YYYYMMDD-HHMM\
├── commits\            # 커밋 로그
│   └── YYYYMMDD-HHMM.md
└── LATEST.txt          # 최신 백업 정보
```

## 5가지 백업 세트

| # | 항목 | 설명 | 저장 위치 |
|---|------|------|-----------|
| 1 | **HTML 화면** | 모달 포함 모든 TSX 컴포넌트 | `html-screens\` |
| 2 | **스냅샷** | PNG 화면 캡처 | `snapshots\` |
| 3 | **문서** | PRD, 가이드 등 | `docs\` |
| 4 | **코드** | src 폴더 + 설정 파일 | `code\` |
| 5 | **커밋 로그** | 상세 변경 내역 | `commits\` |

## 사용법

### 백업 실행

```powershell
# 기본 백업
.\scripts\backup-full-set.ps1 -Message "변경 내용 설명"

# 예시
.\scripts\backup-full-set.ps1 -Message "Dashboard UI complete"
.\scripts\backup-full-set.ps1 -Message "AP List CRUD"
.\scripts\backup-full-set.ps1 -Message "FMEA basic info modal"
```

### 스냅샷 저장 (수동)

스크린샷은 수동으로 저장해야 합니다:

1. 브라우저에서 화면 캡처 (Win + Shift + S)
2. `C:\05_SDD_FMEA_BACKUP\snapshots\YYYYMMDD-HHMM\` 폴더에 저장
3. 파일명 규칙: `화면명_상태.png`
   - 예: `dashboard_main.png`
   - 예: `ap-list_modal-open.png`
   - 예: `fmea-edit_step1.png`

### 자동 백업 스케줄 (권장)

| 시점 | 조건 |
|------|------|
| **기능 완료 시** | 하나의 기능 개발 완료 |
| **하루 종료 시** | 24:00 전 |
| **커밋 전** | GitHub 푸시 전 |
| **주요 변경 후** | 구조 변경, 리팩토링 |

## 복원 방법

```powershell
# 특정 시점의 코드 복원
Copy-Item -Path "C:\05_SDD_FMEA_BACKUP\code\20251226-0721\*" `
          -Destination "C:\05_SDD_FMEA\fmea-smart-system\" `
          -Recurse -Force
```

## 스냅샷 폴더 (프로젝트 내)

```
fmea-smart-system\
└── tests\
    └── snapshots\      # 테스트용 스냅샷
```

---

*Generated: 2024-12-26*



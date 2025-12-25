# 커밋 절차 (Commit Procedure)

## 필수 체크리스트

커밋 전 반드시 다음 순서로 진행:

### 1단계: 코드 변경 완료
- [ ] 기능 개발 완료
- [ ] 린트 에러 없음 확인
- [ ] 브라우저 테스트 완료

### 2단계: 스냅샷 저장
- [ ] 모든 화면 스크린샷 캡처
- [ ] 스냅샷 메타정보 문서 작성 (`docs/SNAPSHOT_YYMMDD.md`)
- [ ] 변경된 파일 목록 기록

### 3단계: Git 커밋
```bash
# 모든 변경사항 스테이징
git add .

# 커밋 (메시지 형식 준수)
git commit -m "[카테고리] 제목 YYMMDD-HH:MM

변경사항:
1. 첫 번째 변경
2. 두 번째 변경

코드프리즈: (해당 시 표시)
테스트 URL: http://localhost:3000"
```

### 4단계: 태그 생성
```bash
# 버전 태그 생성
git tag -a "기능명-vX.X.X-YYMMDD" -m "설명"
```

### 5단계: GitHub 푸시
```bash
git push origin main --tags
```

### 6단계: 로컬 백업
```powershell
$backupDate = Get-Date -Format "yyyyMMdd-HHmm"
$backupPath = "C:\05_SDD_FMEA_BACKUP\$backupDate"
New-Item -ItemType Directory -Force -Path $backupPath
Copy-Item -Recurse -Force "C:\05_SDD_FMEA\fmea-smart-system\src" "$backupPath\src"
Copy-Item -Recurse -Force "C:\05_SDD_FMEA\fmea-smart-system\public" "$backupPath\public"
Copy-Item -Recurse -Force "C:\05_SDD_FMEA\fmea-smart-system\docs" "$backupPath\docs"
```

### 7단계: Fork 로컬 저장소 백업 (선택)
```powershell
# Fork 로컬 저장소 경로
$forkPath = "C:\05_REFACTORING_FORK"

# Fork 저장소로 복사
Copy-Item -Recurse -Force "C:\05_SDD_FMEA\*" "$forkPath\SDD_FMEA_BACKUP\"

# Fork에서 커밋 (Fork Desktop 사용 권장)
cd $forkPath
git add .
git commit -m "백업: SDD_FMEA $backupDate"
```

---

## 커밋 메시지 카테고리

| 카테고리 | 설명 |
|----------|------|
| `[DESIGN]` | UI/UX 디자인 변경 |
| `[FEAT]` | 새 기능 추가 |
| `[FIX]` | 버그 수정 |
| `[REFACTOR]` | 코드 리팩토링 |
| `[DOCS]` | 문서 업데이트 |
| `[STYLE]` | 스타일 변경 (코드 동작 무변경) |
| `[TEST]` | 테스트 추가/수정 |

---

## Fork 로컬 저장소 설정 방법

### 1. Fork Desktop 설치
- https://fork.dev/ 에서 다운로드
- 설치 후 실행

### 2. 로컬 저장소 생성
```powershell
mkdir C:\05_REFACTORING_FORK
cd C:\05_REFACTORING_FORK
git init
```

### 3. Fork Desktop에서 열기
- File > Add Local Repository
- `C:\05_REFACTORING_FORK` 선택

### 4. 백업 폴더 구조
```
C:\05_REFACTORING_FORK\
├── SDD_FMEA_BACKUP\
│   ├── 20251226-0702\
│   │   ├── src\
│   │   ├── public\
│   │   └── docs\
│   └── 20251227-1000\
│       └── ...
└── README.md
```

### 5. Fork Desktop에서 커밋/푸시
- Fork Desktop 열기
- 변경사항 확인
- Commit 버튼 클릭
- Push (원격 저장소 설정 시)

---

## 자동화 스크립트

### backup-and-commit.ps1
```powershell
# 백업 및 커밋 자동화 스크립트
param(
    [string]$message = "자동 백업"
)

$backupDate = Get-Date -Format "yyyyMMdd-HHmm"

# 1. 로컬 백업
$backupPath = "C:\05_SDD_FMEA_BACKUP\$backupDate"
New-Item -ItemType Directory -Force -Path $backupPath
Copy-Item -Recurse -Force "C:\05_SDD_FMEA\fmea-smart-system\src" "$backupPath\src"
Copy-Item -Recurse -Force "C:\05_SDD_FMEA\fmea-smart-system\public" "$backupPath\public"
Copy-Item -Recurse -Force "C:\05_SDD_FMEA\fmea-smart-system\docs" "$backupPath\docs"

# 2. Git 커밋
cd C:\05_SDD_FMEA
git add .
git commit -m "$message - $backupDate"

# 3. 태그 생성
git tag -a "backup-$backupDate" -m "자동 백업"

# 4. GitHub 푸시
git push origin main --tags

Write-Host "✅ 백업 및 커밋 완료: $backupDate"
```

---

## 코드프리즈 규칙

코드프리즈된 파일/폴더는 사용자 승인 없이 수정 금지:

- `src/components/layout/` - 레이아웃 컴포넌트
- `src/app/dashboard/` - 대시보드 페이지
- `public/` - 정적 자산
- `docs/DESIGN_GUIDE.md` - 디자인 가이드

---

© AMP SYSTEM - FMEA Smart System


# 보안 강화 작업 계획 (미착수)

> 작성일: 2026-07-22
> 상태: **계획만 정리된 상태, 작업 미착수**

## 현재 상태와 문제점

Firestore 규칙이 전체 허용으로 배포되어 있다 (`firestore.rules` 참고):

```
match /{document=**} {
  allow read, write: if true;
}
```

Firebase 설정(apiKey, projectId 등)은 빌드된 사이트(`docs/assets/*.js`)에 그대로 포함되어 공개된다.
apiKey는 원래 비밀값이 아니므로 문제가 아니지만, 규칙이 전체 허용이면 **누구나 Firebase SDK로
직접 접속해 모든 데이터를 읽고 쓰고 지울 수 있다.**

구체적 위험:

- 실적(`performances`), 수요처(`demands`), 예산(`budgets`, `budgetUsages`) 데이터를 외부인이 조회·변조·삭제 가능
- 관리자 계정 문서(`admin/user`)의 **비밀번호 해시를 누구나 읽을 수 있음** (오프라인 크래킹 가능)
- 중복 방지 잠금 컬렉션(`performanceKeys`)도 외부인이 임의 생성/삭제 가능
- 로그인 검증이 클라이언트에서만 이루어짐 — 로그인 화면을 우회해도 데이터 접근에는 아무 제약이 없음

## 작업 계획

### 1단계 — Firebase Authentication 도입

- Firebase 콘솔에서 Authentication 활성화 (이메일/비밀번호 방식이면 충분)
- 관리자 계정을 Firebase Auth 사용자로 생성
- `Login.tsx` / `ChangePassword.tsx`를 `signInWithEmailAndPassword` 기반으로 교체
- 기존 커스텀 인증(Firestore `admin/user` 문서의 passwordHash 비교) 제거
- 로그인 상태 관리를 `onAuthStateChanged` 기반으로 변경

### 2단계 — Firestore 규칙 강화

인증된 사용자만 쓰기 가능하도록 컬렉션별로 제한. 초안:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 앱에서 사용하는 컬렉션: 로그인한 사용자만 접근
    match /demands/{id}          { allow read, write: if request.auth != null; }
    match /performances/{id}     { allow read, write: if request.auth != null; }
    match /performanceKeys/{id}  { allow read, write: if request.auth != null; }
    match /budgets/{id}          { allow read, write: if request.auth != null; }
    match /budgetUsages/{id}     { allow read, write: if request.auth != null; }

    // 커스텀 인증 제거 후에는 admin 컬렉션 자체를 삭제하고 이 규칙도 제거
    match /admin/{id}            { allow read, write: if false; }

    // 그 외 모든 컬렉션 차단
    match /{document=**}         { allow read, write: if false; }
  }
}
```

검토 사항:

- 조회 전용 화면(대시보드/통계)을 비로그인으로 열어둘지 결정 — 열어둔다면 해당 컬렉션만 `allow read: if true`
- 배포는 `npx firebase-tools deploy --only firestore:rules` (CLI는 forzamin12@gmail.com 계정으로 로그인되어 있음)
- **규칙을 먼저 배포하면 아직 Auth를 안 붙인 앱이 즉시 깨진다 — 반드시 1단계(앱 코드) 배포 후 규칙 배포**

### 3단계 — 마이그레이션·정리

- `admin/user` 문서(비밀번호 해시) 삭제
- `src/utils/storage.ts`의 커스텀 해시 로직(`hashPassword` 등) 제거
- localStorage 기반 세션 흔적이 있으면 정리
- 데이터 검증 규칙 추가 검토 (예: `performances` 쓰기 시 필수 필드/타입 검증)

### 4단계 — 선택 사항

- **App Check** (reCAPTCHA v3) 활성화로 승인된 웹앱 외 SDK 접근 차단
- 관리자 다중 계정이 필요하면 Auth 사용자 추가 + 커스텀 클레임으로 역할 구분
- Firestore 백업: `firebase firestore:backups` 스케줄 설정

## 진행 시 체크리스트

- [ ] Firebase 콘솔에서 Authentication(이메일/비밀번호) 활성화
- [ ] 관리자 Auth 계정 생성
- [ ] 앱 로그인/비밀번호 변경 코드를 Firebase Auth로 교체
- [ ] 빌드·배포 후 로그인 동작 확인
- [ ] `firestore.rules`를 위 초안으로 교체하고 배포
- [ ] 배포된 사이트에서 전 기능(수요처/실적/예산 CRUD, 일괄 업로드) 동작 확인
- [ ] `admin/user` 문서 및 커스텀 인증 코드 제거
- [ ] (선택) App Check 활성화

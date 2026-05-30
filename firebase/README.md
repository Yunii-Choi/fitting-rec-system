# Firebase 셋업 가이드

프로젝트: **fitting-524** · Storage 버킷: **fitting-524.firebasestorage.app**

## 1. 웹 앱 설정값 채우기

1. [Firebase 콘솔](https://console.firebase.google.com/project/fitting-524) 접속
2. ⚙️ **프로젝트 설정 → 일반 → 내 앱**
3. 웹 앱(`</>`)이 없으면 새로 추가
4. **SDK 설정 및 구성**의 `firebaseConfig` 값을 복사
5. [`firebase-config.js`](./firebase-config.js)의 `<YOUR_API_KEY>` 등 placeholder를 교체

> 웹 `apiKey`는 클라이언트에 노출되는 **공개 식별자**라 커밋해도 됩니다.
> 실제 접근 통제는 아래 **Storage 보안 규칙**으로 합니다.
> 단, **Admin SDK 서비스 계정 키(JSON)는 절대 커밋 금지** — `.gitignore`에 이미 포함돼 있습니다.

## 2. Storage 보안 규칙 (권장 시작점)

콘솔 → **Storage → Rules**에 적용:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // OOTD: 본인 폴더만 쓰기, 로그인 유저는 읽기
    match /ootd/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 3. 사용 예시

```html
<script type="module">
  import { uploadOOTD } from "./firebase/storage.js";

  document.querySelector("#fileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const { url } = await uploadOOTD("user_123", "DAILY", file);
    console.log("업로드 완료:", url);
  });
</script>
```

# 개발 환경 가이드

> 팀 전체(A/B/C)가 같은 방식으로 개발 환경을 세팅하기 위한 문서. 채팅에서 논의된 내용을 정리한 것이며, 세부 명령어는 실제 진행하면서 조금씩 바뀔 수 있다.

---

## 1. 팀 OS 현황

| 담당 | OS |
|---|---|
| A | Windows |
| B | **Mac** |
| C | Windows |

iOS 실물 기기 테스트/서명 관련 작업은 **B(Mac)가 허브 역할**을 한다. A/C는 평소 개발(코드 작성, 핫리로드 확인)에는 Mac이 필요 없다.

---

## 2. 핵심 라이브러리

### Frontend
| 용도 | 라이브러리 |
|---|---|
| 프레임워크 | Expo (Custom Dev Client) |
| 네비게이션 | `@react-navigation/native` (stack + bottom-tabs) |
| 서버 상태 | `@tanstack/react-query` |
| 클라이언트 상태 | `zustand` |
| HTTP | `axios` |
| 스타일링 | `nativewind` |
| 아이콘 | `lucide-react-native` |
| 이미지 선택 | `expo-image-picker` |
| 슬라이더 | `@react-native-community/slider` |
| 드래그(스티커) | `react-native-gesture-handler`, `react-native-reanimated` |
| 화면 캡처 + 공유 | `react-native-view-shot`, `react-native-share` |
| 에러 모니터링 | `@sentry/react-native` |

### Backend
| 용도 | 라이브러리 |
|---|---|
| ORM | SQLAlchemy 2.0 + Alembic |
| Redis | `redis` (redis-py, asyncio) |
| 비밀번호 해싱 | `passlib[bcrypt]` |
| 외부 API 호출 | `httpx` |
| 로깅 | `loguru` |
| 테스트 | `pytest` + `httpx` test client |

---

## 3. 인스타그램 스토리 공유 구현

핵심 기능(SNS 공유 화면)은 `react-native-view-shot` + `react-native-share` 조합으로 구현한다.

1. `react-native-view-shot`으로 사진+스티커(이모지/코멘트/진도오버레이)가 합성된 `View`를 캡처해 이미지 파일 생성
2. `react-native-share`의 `Share.shareSingle({ social: Share.Social.INSTAGRAM_STORIES, backgroundImage, appId })`로 인스타그램 스토리 작성 화면으로 바로 전달

> ⚠ 두 라이브러리 모두 **네이티브 모듈**이라 일반 Expo Go 앱에서는 동작하지 않는다. 반드시 아래 4번의 Dev Client로 빌드해야 테스트 가능하다.

---

## 4. Expo Dev Client — 왜, 그리고 어떻게

**Expo Go**(스토어에서 받는 범용 앱)는 미리 정해진 네이티브 모듈만 포함되어 있어 `react-native-share` 같은 라이브러리를 쓸 수 없다. **Expo Dev Client**는 우리 프로젝트에 필요한 네이티브 모듈을 미리 넣어 직접 빌드한 "우리 전용 앱"이다. 겉모습(QR 스캔, 핫리로드)은 Expo Go와 동일하다.

- JS/화면 코드만 수정 → Dev Client 재빌드 불필요, 저장하면 바로 반영
- 네이티브 라이브러리를 새로 추가/제거할 때만 → Dev Client 재빌드 필요

앱스토어 출시가 목적이 아니므로 **internal distribution(내부 배포)** 방식으로 충분하다. 스토어 심사·등록 자체가 필요 없다.

| 항목 | 스토어 출시 시 | 우리(내부 테스트만) |
|---|---|---|
| Apple Developer 계정 | 필요 | 필요 없음 (아래 5번 "방법 2" 채택) |
| App Store Connect 등록/심사 | 필요 | 불필요 |
| Google Play 계정 ($25, 1회) | 필요 | 불필요 (APK 직접 설치) |

---

## 5. iOS 테스트 — 무료 개인 계정(Personal Team) 방식 채택

우리 팀은 **Apple Developer Program($99/년) 없이**, Xcode의 무료 개인 계정(Personal Team) 서명으로 iOS 테스트를 진행하기로 결정했다.

### 트레이드오프 (미리 인지할 것)
- 서명이 **7일마다 만료**된다 → 매주 재설치 필요
- **Mac + USB(또는 같은 Wi-Fi)로 Xcode에서 직접** 설치해야 한다 → B만 실행 가능, A/C는 자기 아이폰을 B에게 물리적/네트워크로 연결해야 함
- 동시 등록 가능한 기기 수, 앱 개수 등에 제한이 있는 것으로 알고 있으나 **애플이 정책을 자주 바꾸므로 진행 중 막히면 그때 Apple Developer 공식 문서에서 최신 기준 확인**

### B(Mac) 최초 셋업
1. Xcode 설치 (App Store)
2. CocoaPods 설치: `sudo gem install cocoapods` (또는 Homebrew)
3. Xcode → Settings → Accounts → 무료 Apple ID 로그인
4. 프로젝트 루트(`frontend/`)에서:
   ```
   npx expo install expo-dev-client react-native-share react-native-view-shot
   npx expo prebuild -p ios
   ```
   **주의**: `ios/` 폴더는 한 번 생성한 뒤 Xcode에서 서명 설정을 하면, `prebuild`를 다시 실행하지 않는다 (설정이 초기화됨).
5. `ios/*.xcworkspace`를 Xcode로 열기

### 아이폰 연결 & 설치 (A/C 아이폰 포함)
1. A, C의 아이폰을 **최초 1회는 USB로 B의 Mac에 직접 연결** (신뢰 확인 팝업 허용)
2. Xcode 상단에서 기기 선택 → Signing & Capabilities → "Automatically manage signing" 체크 → Team을 Personal Team으로 지정
3. ▶ Run → 기기에 설치. 최초 실행 시 아이폰에서 설정 → 일반 → VPN 및 기기 관리 → 개발자 앱 신뢰 필요
4. Xcode "Devices and Simulators" 창에서 기기의 **"Connect via network" 체크** → 이후 같은 Wi-Fi 안에서는 USB 없이 무선 재설치 가능

### 매주 반복 (7일 서명 만료)
- **팀 캘린더에 반복 일정 등록 추천**: "매주 O요일 — B가 Xcode에서 A/C 기기 재설치"
- 같은 Wi-Fi면 무선으로, 아니라면 다시 USB 연결

### iOS 트러블슈팅 (실제로 겪은 에러들)
- **`.xcworkspace`가 없고 `.xcodeproj`만 있다 / "could not be unlocked"** → `.xcodeproj`를 우클릭해서 내부의 `project.xcworkspace`를 직접 열면 안 됨. `pod install`이 아직 성공하지 못한 상태라 최상위 `.xcworkspace`가 생성되지 않은 것.
- **`You cannot run CocoaPods as root`** → `sudo pod install`로 실행하면 안 됨. `sudo`는 CocoaPods 설치(`brew install cocoapods` 권장, `sudo gem install`은 지양)에만 필요하고, `pod install` 자체는 항상 일반 계정으로 실행.
- **`.xcode.env.local: Permission denied`** → 과거에 `sudo`로 실행했던 흔적 때문에 프로젝트 폴더 일부가 root 소유로 바뀐 것. `sudo chown -R $(whoami):staff <프로젝트경로>`로 소유권을 복구하고, `ios/` 폴더를 지운 뒤 `npx expo prebuild --platform ios --clean`으로 재생성.
- **공통 원칙**: `pod install`, `npx expo prebuild`, `npx expo run:ios` 등 프로젝트 관련 명령에는 **절대 `sudo`를 붙이지 않는다.** `sudo`가 필요한 건 도구 자체를 시스템에 설치할 때(`brew install ...`)뿐.

### Android (A/C 본인 기기)
제약 없음. Android Studio 에뮬레이터 또는 실물 기기에 APK 직접 설치 — 완전 무료, 재서명 불필요. 상세 절차는 아래 6번.

### EAS Build/Update (참고, 지금은 안 씀)
Free 플랜이 있으나 빌드 대기열이 느릴 수 있고, iOS 실물 기기 설치는 결국 Apple Developer 계정이 필요해서 지금 단계에서는 **채택하지 않음**. 나중에 무료 계정의 7일 재서명이 번거로워지면 유료 전환($99/년)을 재검토.

---

## 6. Android 테스트 — Android Studio 에뮬레이터 (추천)

iOS와 달리 서명/인증서가 전혀 필요 없어서 A/B/C 모두 **각자 컴퓨터에서 독립적으로** 세팅 가능하다 (B에게 의존할 필요 없음). 매일 개발은 이 환경으로 먼저 돌리는 걸 추천.

### 설치 (Windows·Mac 공통 절차)
1. https://developer.android.com/studio 에서 Android Studio 다운로드·설치
2. 설치 마법사에서 아래가 체크되어 있는지 확인 (기본값으로 대부분 포함됨):
   - Android SDK
   - Android SDK Platform
   - **Android Virtual Device (AVD)**

### 환경변수 설정
**Windows (A, C)** — 시스템 환경 변수에 추가:
```
ANDROID_HOME = C:\Users\사용자명\AppData\Local\Android\Sdk
Path에 추가: %ANDROID_HOME%\platform-tools , %ANDROID_HOME%\emulator
```

**Mac (B)** — `~/.zshrc`(또는 `~/.bash_profile`)에 추가:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```
저장 후 `source ~/.zshrc`

**확인**
```bash
adb --version
```

### 에뮬레이터(가상 기기) 생성
1. Android Studio → 우측 상단 **Device Manager** (또는 More Actions → Virtual Device Manager)
2. "Create Device" → **Pixel 7** 등 최신 기종 선택
3. 시스템 이미지: **API 34 이상** 권장 (최초 다운로드 용량이 크니 시간 감안)
4. 생성 후 ▶ 로 실행 — 실제 폰처럼 화면이 뜬다

### Expo 프로젝트와 연결
에뮬레이터를 켜둔 상태에서:
```bash
cd frontend
npx expo run:android
```
prebuild + APK 빌드 + 설치를 한 번에 처리한다. **서명/인증서 걱정 없이 바로 동작.** 이후부터는 평소처럼:
```bash
npx expo start --dev-client
```

### 실물 안드로이드 폰으로 테스트 (에뮬레이터가 무겁게 느껴지면 추천)
1. 폰: 설정 → 휴대전화 정보 → 빌드 번호 7번 연타 → 개발자 모드 활성화
2. 설정 → 개발자 옵션 → **USB 디버깅** 켜기
3. USB로 컴퓨터 연결 → 폰에서 "이 컴퓨터를 신뢰하시겠습니까" 허용
4. 터미널에서 확인:
   ```bash
   adb devices
   ```
   기기가 목록에 뜨면 인식된 것. 이후 `npx expo run:android` 실행 시 에뮬레이터 대신 이 실물 기기에 설치된다.

---

## 7. Frontend 프로젝트 초기화 (`frontend/` 폴더)

`frontend/`가 React Native 앱의 루트다. `src/` 하위 모듈별 빈 폴더(A/B/C 소유권 경계)는 이미 만들어져 있으므로, 그 구조를 유지한 채로 Expo 프로젝트를 초기화한다.

```bash
# 1. 안전장치: git 커밋 먼저
cd /path/to/readlog
git init
git add -A
git commit -m "chore: initial scaffold before expo init"

# 2. frontend 폴더에서 Expo 프로젝트 초기화
cd frontend
npx create-expo-app@latest . --template blank-typescript

# 3. 핵심 네이티브 라이브러리 설치
npx expo install expo-dev-client react-native-share react-native-view-shot expo-image-picker @react-native-community/slider

# 4. 확인
git status   # src/ 하위 폴더들이 그대로 있는지 확인
```

초기화 후 매일 개발 시:
```bash
npx expo start --dev-client
```
이 명령은 **Windows/Mac 어디서든** 실행 가능 (Mac이 필요한 건 5번의 iOS 서명/설치 순간뿐).

---

## 8. 백엔드 로컬 테스트 (실시간 반영)

```bash
uvicorn app.main:app --reload
```
- 같은 Wi-Fi: 컴퓨터 IP로 폰에서 직접 접속
- 외부망: `ngrok` 또는 Cloudflare Tunnel로 임시 URL 발급해 3명이 동일 백엔드에 접속

## 9. 모니터링/디버깅 도구
- **React Native DevTools** (RN 0.74+ 내장) — 네트워크/콘솔/성능 실시간 확인
- **Reactotron** — 로컬 서버에 3명 기기를 동시에 붙여 상태/API 호출 모니터링
- **Sentry** — 테스트 중 크래시/에러 실시간 알림

---

## 10. 실제 코드 작업 — Claude Code로 진행

이 채팅(claude.ai)은 설계·문서·의사결정을 돕는 용도이고, **실제 코드 작성은 각자 로컬에서 Claude Code로 진행**한다.

1. 설치: `npm install -g @anthropic-ai/claude-code`
2. `readlog/` 저장소 **루트에서 실행** (루트에서 실행해야 `CLAUDE.md`를 확실히 인식)
3. Claude Code는 루트의 `CLAUDE.md`와 `.claude/skills/*.md`를 자동으로 읽는다 — 예를 들어 "로그인 화면 구현해줘"라고 하면 `.claude/skills/auth-module/SKILL.md`의 소유 범위·화면 스펙·DB 테이블 규칙을 따라 정해진 폴더 안에서만 작업한다.
4. A/B/C는 각자 본인 모듈 이야기만 하면 되고, 공용 파일(`components/common`, `navigation`, `core`, `db`) 변경이 필요한 상황이면 Claude Code가 CLAUDE.md §5 규칙에 따라 먼저 알려주도록 설계되어 있다.

---

## 11. 체크리스트 요약

- [ ] git 초기 커밋 완료
- [ ] `frontend/`에서 `create-expo-app` 실행 완료
- [ ] Dev Client용 네이티브 라이브러리 설치 완료
- [ ] B: Xcode + 무료 Apple ID 세팅 완료
- [ ] A, C: 아이폰 최초 1회 USB 연결 + 신뢰 설정 완료
- [ ] 무선 재설치(Connect via network) 활성화 확인
- [ ] 팀 캘린더에 "매주 iOS 재설치" 반복 일정 등록
- [ ] A, B, C 각자: Android Studio 설치 + `ANDROID_HOME` 환경변수 설정 + `adb --version` 확인
- [ ] A, B, C 각자: 에뮬레이터 생성 또는 실물 기기 `adb devices` 인식 확인
- [ ] 각자 로컬에 Claude Code 설치, `readlog/` 루트에서 실행 확인

# StudyBuddy Flutter App — System Design

> Phiên bản: 1.0 · Ngày: 2026-07-01  
> Dựa trên: thiết kế UI `APP/StudyBuddy_AI_Tutor.dc.html` (20 màn hình) + BE NestJS hiện có  
> State management: **Riverpod**  
> Platform: Android · iOS (Flutter multiplatform)

---

## 1. Kiến trúc tổng quan

```
┌─────────────────────────────────────────┐
│              Flutter App                │
│  ┌────────┐  ┌────────┐  ┌──────────┐  │
│  │  UI    │  │Riverpod│  │  Domain  │  │
│  │Screens │─▶│Provider│─▶│ UseCases │  │
│  │Widgets │  │Notifier│  │          │  │
│  └────────┘  └────────┘  └────┬─────┘  │
│                                │        │
│                     ┌──────────▼──────┐ │
│                     │  Data Layer      │ │
│                     │  ├ RemoteDS     │ │
│                     │  └ LocalDS(Hive)│ │
│                     └──────────────────┘ │
└────────────────────┬────────────────────┘
                     │ HTTPS / REST
          ┌──────────▼──────────┐
          │   NestJS Backend    │
          │  POST /auth/register│
          │  POST /auth/login   │
          │  POST /solve        │
          │  GET  /me           │
          │  POST /solve/:id/   │
          │       feedback      │
          └─────────────────────┘
               │           │
         Firebase      PostgreSQL
         Auth Admin    + Redis
```

**Luồng dữ liệu cốt lõi:**  
UI → Provider/Notifier → UseCase → Repository → DataSource (Remote/Local) → NestJS API

---

## 2. Tech Stack

| Lớp | Thư viện | Lý do |
|---|---|---|
| State management | `flutter_riverpod ^2.x` | Type-safe, code gen, dễ test |
| Code generation | `riverpod_annotation`, `riverpod_generator` | Giảm boilerplate |
| Navigation | `go_router ^14.x` | Declarative, deep link, guard |
| DI / Service locator | Riverpod tích hợp sẵn | Không cần get_it |
| HTTP client | `dio ^5.x` | Interceptor cho auth token, retry |
| Firebase Auth | `firebase_auth ^5.x` | Email/password, Google, Apple |
| Google Sign-In | `google_sign_in ^6.x` | — |
| Sign in with Apple | `sign_in_with_apple ^6.x` | iOS required |
| Camera | `camera ^0.11.x` | Màn hình Scan |
| Image crop | `image_cropper ^4.x` | Màn hình Crop |
| Base64 encode | dart:convert (built-in) | Chuyển ảnh → base64 |
| Image picker | `image_picker ^1.x` | Chọn từ gallery |
| Local storage | `hive_flutter ^1.x` | Cache lịch sử offline |
| Secure storage | `flutter_secure_storage ^9.x` | Lưu Firebase token |
| In-app purchases | `purchases_flutter ^7.x` (RevenueCat) | Premium subscription |
| LaTeX / Math | `flutter_math_fork ^0.7.x` | Render công thức |
| Lottie animation | `lottie ^3.x` | Animation loading Nova |
| Shared preferences | `shared_preferences ^2.x` | Theme, ngôn ngữ, onboarding done |
| Fonts | Google Fonts CDN → `Plus Jakarta Sans`, `Fredoka` | Theo thiết kế |
| Permissions | `permission_handler ^11.x` | Camera permission |

---

## 3. Cấu trúc thư mục

```
studybuddy/
├── lib/
│   ├── main.dart
│   ├── app.dart                          # MaterialApp + GoRouter + ProviderScope
│   │
│   ├── core/
│   │   ├── constants/
│   │   │   ├── app_colors.dart           # Design palette
│   │   │   ├── app_typography.dart       # Plus Jakarta Sans, Fredoka
│   │   │   └── app_sizes.dart            # Border radius, spacing tokens
│   │   ├── theme/
│   │   │   ├── app_theme.dart            # Light ThemeData
│   │   │   └── app_theme_dark.dart       # Dark ThemeData
│   │   ├── router/
│   │   │   ├── app_router.dart           # GoRouter definition
│   │   │   └── route_names.dart          # Route path constants
│   │   ├── network/
│   │   │   ├── dio_client.dart           # Dio setup + interceptors
│   │   │   └── auth_interceptor.dart     # Inject Bearer token
│   │   ├── errors/
│   │   │   ├── app_exception.dart        # Sealed class exceptions
│   │   │   └── failure.dart
│   │   └── utils/
│   │       ├── image_utils.dart          # compress + base64
│   │       └── date_utils.dart
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── datasource/
│   │   │   │   │   ├── auth_remote_datasource.dart
│   │   │   │   │   └── auth_local_datasource.dart   # FlutterSecureStorage
│   │   │   │   ├── models/
│   │   │   │   │   └── auth_token_model.dart        # idToken, refreshToken…
│   │   │   │   └── repositories/
│   │   │   │       └── auth_repository_impl.dart
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── auth_user.dart               # uid, email, isPremium
│   │   │   │   ├── repositories/
│   │   │   │   │   └── auth_repository.dart         # abstract
│   │   │   │   └── usecases/
│   │   │   │       ├── login_usecase.dart
│   │   │   │       ├── register_usecase.dart
│   │   │   │       ├── login_google_usecase.dart
│   │   │   │       ├── login_apple_usecase.dart
│   │   │   │       └── logout_usecase.dart
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── auth_provider.dart           # authStateProvider, userProvider
│   │   │       └── screens/
│   │   │           ├── splash_screen.dart            # Screen 01
│   │   │           ├── onboarding_screen.dart        # Screen 02-04
│   │   │           └── login_screen.dart             # Screen 05
│   │   │
│   │   ├── home/
│   │   │   ├── data/ …
│   │   │   ├── domain/
│   │   │   │   └── entities/
│   │   │   │       └── streak_info.dart              # streak, totalSolved, saved
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── home_provider.dart            # meProvider (GET /me)
│   │   │       └── screens/
│   │   │           ├── home_screen.dart              # Screen 06
│   │   │           └── subject_detail_screen.dart    # Screen 13
│   │   │
│   │   ├── scan/
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── scan_provider.dart
│   │   │       └── screens/
│   │   │           ├── camera_scan_screen.dart       # Screen 07
│   │   │           └── crop_screen.dart              # Screen 08
│   │   │
│   │   ├── solve/
│   │   │   ├── data/
│   │   │   │   ├── datasource/
│   │   │   │   │   ├── solve_remote_datasource.dart  # POST /solve
│   │   │   │   │   └── solve_local_datasource.dart   # Hive cache
│   │   │   │   ├── models/
│   │   │   │   │   ├── solve_request_model.dart
│   │   │   │   │   ├── solve_response_model.dart
│   │   │   │   │   └── solve_step_model.dart
│   │   │   │   └── repositories/
│   │   │   │       └── solve_repository_impl.dart
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── solve_result.dart
│   │   │   │   │   └── solve_step.dart
│   │   │   │   ├── repositories/
│   │   │   │   │   └── solve_repository.dart
│   │   │   │   └── usecases/
│   │   │   │       ├── solve_text_usecase.dart
│   │   │   │       ├── solve_image_usecase.dart
│   │   │   │       └── submit_feedback_usecase.dart
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── solve_provider.dart           # solveNotifierProvider
│   │   │       └── screens/
│   │   │           ├── loading_screen.dart            # Screen 09
│   │   │           ├── solution_screen.dart           # Screen 10 (Light)
│   │   │           ├── solution_dark_screen.dart      # Screen 20 (Dark)
│   │   │           └── text_question_screen.dart      # Screen 12
│   │   │
│   │   ├── chat/
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── chat_provider.dart
│   │   │       └── screens/
│   │   │           └── chat_screen.dart               # Screen 11
│   │   │
│   │   ├── history/
│   │   │   ├── data/ …
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── history_provider.dart          # lấy từ Hive local
│   │   │       └── screens/
│   │   │           └── history_screen.dart            # Screen 14
│   │   │
│   │   ├── practice/
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── practice_provider.dart
│   │   │       └── screens/
│   │   │           └── practice_screen.dart           # Screen 15
│   │   │
│   │   ├── profile/
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── profile_provider.dart
│   │   │       └── screens/
│   │   │           ├── profile_screen.dart            # Screen 16
│   │   │           └── settings_screen.dart           # Screen 18
│   │   │
│   │   └── premium/
│   │       └── presentation/
│   │           ├── providers/
│   │           │   └── premium_provider.dart          # RevenueCat
│   │           └── screens/
│   │               └── premium_screen.dart            # Screen 17
│   │
│   └── shared/
│       ├── widgets/
│       │   ├── nova_avatar.dart           # Robot mascot widget (reused nhiều chỗ)
│       │   ├── primary_button.dart        # Gradient purple button
│       │   ├── subject_chip.dart          # Subject tag (Math, Physics…)
│       │   ├── solve_step_card.dart       # Step-by-step card
│       │   ├── quota_banner.dart          # "X lượt còn lại hôm nay"
│       │   ├── bottom_nav_bar.dart        # Tab bar (Home/Chat/Scan/History/Profile)
│       │   └── streak_card.dart           # 7-day streak card
│       └── extensions/
│           ├── context_ext.dart
│           └── string_ext.dart
│
├── assets/
│   ├── fonts/                            # plus_jakarta_sans, fredoka (offline fallback)
│   ├── images/
│   │   └── nova_idle.json               # Lottie animation
│   └── icons/
│
├── pubspec.yaml
├── pubspec.lock
├── analysis_options.yaml
└── test/
    ├── unit/
    │   ├── auth/
    │   ├── solve/
    │   └── quota/
    └── widget/
```

---

## 4. Navigation (GoRouter)

```dart
// route_names.dart
const splash       = '/';
const onboarding   = '/onboarding';
const login        = '/login';
const home         = '/home';
const cameraScan   = '/scan/camera';
const crop         = '/scan/crop';
const loading      = '/scan/loading';
const solution     = '/solution/:id';
const chat         = '/chat';
const textQuestion = '/ask';
const subjectDetail = '/subject/:subject';
const history      = '/history';
const practice     = '/practice/:solveId';
const profile      = '/profile';
const settings     = '/settings';
const premium      = '/premium';
```

**Redirect guard:** nếu `authStateProvider` là null → redirect về `/login`  
**Redirect guard:** nếu đã xem onboarding (SharedPrefs `onboarding_done=true`) → skip `/onboarding`

### Luồng điều hướng chính

```
App Start
  └─► Splash (2s animation)
        ├─► [chưa login] → Onboarding (1→2→3) → Login
        └─► [đã login]   → Home

Home (Bottom Nav: Home | Chat | [Scan FAB] | History | Profile)
  ├─► Scan FAB → CameraScan → Crop → Loading → Solution
  │                                            └─► Practice (similar)
  ├─► "Type Question" → TextQuestion → Loading → Solution
  ├─► "Ask AI Tutor" → Chat
  ├─► Subjects → SubjectDetail
  ├─► Recent Item → Solution (cached)
  ├─► History tab
  ├─► Profile tab
  │      └─► Settings
  │      └─► Premium (nếu free tier)
  └─► Premium → RevenueCat purchase
```

---

## 5. API Mapping (Flutter ↔ NestJS BE)

### 5.1 Auth Endpoints

| UI Action | Flutter Call | BE Endpoint | Notes |
|---|---|---|---|
| Register (email) | `AuthRemoteDS.register(email, pass)` | `POST /auth/register` | Firebase signUp |
| Login (email) | `AuthRemoteDS.login(email, pass)` | `POST /auth/login` | Firebase signInWithPassword |
| Login (Google) | `firebase_auth.GoogleAuthProvider` | Firebase SDK (client-side) | Lấy idToken sau đó dùng cho /solve |
| Login (Apple) | `sign_in_with_apple` + Firebase | Firebase SDK (client-side) | Tương tự Google |
| Logout | `firebase_auth.signOut()` + clear SecureStorage | — | Không cần BE endpoint |

**Response model** (`POST /auth/register` hoặc `POST /auth/login`):
```json
{
  "idToken": "eyJ...",
  "refreshToken": "AMf...",
  "expiresIn": "3600",
  "localId": "abc123"
}
```

→ Lưu `idToken` vào `FlutterSecureStorage` key `firebase_id_token`  
→ Lưu `localId` (uid) vào `FlutterSecureStorage` key `firebase_uid`

---

### 5.2 Solve Endpoints

#### POST /solve
**Khi nào gọi:** User bấm "Solve with AI" (từ Crop hoặc TextQuestion screen)

```json
// Request body
{
  "input_type": "image" | "text",
  "text": "Giải 2x + 5 = 17",          // nếu input_type = text
  "image_base64": "iVBORw...",           // nếu input_type = image (JPEG/PNG, max 2MB)
  "mode": "fast" | "accurate" | "explain_more"
}

// Response
{
  "id": "uuid",
  "problem_text": "2x + 5 = 17",
  "problem_type": "linear_equation",
  "difficulty": "easy",
  "steps": [
    { "title": "Subtract 5", "explanation": "2x = 12", "formula_latex": "2x = 12" }
  ],
  "final_answer": "x = 6",
  "answer_type": "numeric",
  "variables": { "x": 6 },
  "confidence": 0.98,
  "verified": true,
  "warnings": [],
  "grade_level": "Lớp 8",
  "curriculum_topic": "Phương trình bậc nhất",
  "common_mistakes": ["Quên đổi dấu khi chuyển vế"],
  "similar_questions": [
    { "question": "3x - 4 = 11", "difficulty": "easy" }
  ],
  "model_used": "gemini-2.0-flash-lite",
  "quota_remaining": 4
}
```

**Lỗi cần handle:**
- `429 QUOTA_EXCEEDED` → hiện dialog "Hết lượt hôm nay" + nút "Nâng cấp Premium"
- `429 RATE_LIMITED` → hiện snackbar "Quá nhiều yêu cầu, thử lại sau 1 phút"
- `400 INVALID_IMAGE` → "Định dạng ảnh không hợp lệ"
- `400 IMAGE_TOO_LARGE` → "Ảnh vượt quá 2MB, hãy chụp lại"
- `401` → Force logout, redirect Login

---

#### GET /me
**Khi nào gọi:** Khi mount Home screen và Profile screen

```json
{
  "uid": "abc123",
  "tier": "free" | "premium",
  "quota": {
    "used": 1,
    "limit": 5,
    "remaining": 4,
    "reset_at": "2026-07-02T17:00:00.000Z"
  },
  "premium_until": null | "2026-12-31T00:00:00.000Z"
}
```

Dùng để render:
- `streak_card.dart`: lượt còn lại trong ngày
- `quota_banner.dart`: "4/5 lượt còn lại"
- `profile_screen.dart`: tier badge, premium_until

---

#### POST /solve/:id/feedback
**Khi nào gọi:** User báo sai/đánh dấu từ Solution screen

```json
// Request
{
  "type": "wrong_answer" | "bad_explanation" | "bad_ocr" | "other",
  "note": "Bước 2 tính sai dấu"   // optional
}
// Response: { "success": true }
```

---

### 5.3 Lưu ý Authentication Header

Mọi request đến BE (trừ `/auth/*`) cần header:
```
Authorization: Bearer <Firebase_idToken>
```

Implement trong `AuthInterceptor` (Dio):
```dart
class AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await secureStorage.read(key: 'firebase_id_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
  
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired → refresh qua Firebase sau đó retry
      final user = FirebaseAuth.instance.currentUser;
      final newToken = await user?.getIdToken(forceRefresh: true);
      if (newToken != null) {
        await secureStorage.write(key: 'firebase_id_token', value: newToken);
        // retry original request
        final opts = err.requestOptions..headers['Authorization'] = 'Bearer $newToken';
        final response = await dio.fetch(opts);
        return handler.resolve(response);
      }
    }
    handler.next(err);
  }
}
```

---

## 6. Design System → Flutter Constants

### 6.1 Color Palette

```dart
// core/constants/app_colors.dart
class AppColors {
  // Primary
  static const primary        = Color(0xFF6D5DF6);
  static const primaryLight   = Color(0xFF9B6BFF);
  static const primaryDark    = Color(0xFF5B4BE0);

  // Ink (background dark)
  static const ink            = Color(0xFF15162B);
  static const inkSurface     = Color(0xFF1F2036);

  // Surface (background light)
  static const surface        = Color(0xFFF5F6FB);
  static const surfaceCard    = Color(0xFFFFFFFF);

  // Subject accents
  static const math           = Color(0xFF4C6FFF);
  static const chemistry      = Color(0xFF00B8A9);
  static const biology        = Color(0xFF34C759);
  static const english        = Color(0xFFFF8A3D);
  static const literature     = Color(0xFFFF5C8A);
  static const history        = Color(0xFFF2B705);
  static const geography      = Color(0xFF20C5E8);
  static const coding         = Color(0xFF6E56CF);
  static const physics        = Color(0xFF7C5CFC);

  // Status
  static const success        = Color(0xFF34C759);
  static const warning        = Color(0xFFF2B705);
  static const error          = Color(0xFFE5484D);

  // Text
  static const textPrimary    = Color(0xFF15162B);
  static const textSecondary  = Color(0xFF82849A);
  static const textHint       = Color(0xFF9A9CB2);

  // Dark mode equivalents
  static const darkSurface    = Color(0xFF0D0E1A);
  static const darkCard       = Color(0xFF181926);
  static const darkBorder     = Color(0xFF2A2C45);
}
```

### 6.2 Typography

```dart
// core/constants/app_typography.dart
class AppTypography {
  static const fontDisplay = 'Fredoka';     // Heading brand (StudyBuddy title)
  static const fontBody    = 'Plus Jakarta Sans';

  // Display
  static TextStyle display({Color? color}) =>
      TextStyle(fontFamily: fontDisplay, fontSize: 44, fontWeight: FontWeight.w700, color: color);

  // Headings
  static TextStyle h1({Color? color}) =>
      TextStyle(fontFamily: fontBody, fontSize: 28, fontWeight: FontWeight.w700, color: color);
  static TextStyle h2({Color? color}) =>
      TextStyle(fontFamily: fontBody, fontSize: 23, fontWeight: FontWeight.w700, color: color);
  static TextStyle h3({Color? color}) =>
      TextStyle(fontFamily: fontBody, fontSize: 18, fontWeight: FontWeight.w700, color: color);

  // Body
  static TextStyle bodyLarge({Color? color, FontWeight? weight}) =>
      TextStyle(fontFamily: fontBody, fontSize: 16, fontWeight: weight ?? FontWeight.w500, color: color);
  static TextStyle bodyMedium({Color? color, FontWeight? weight}) =>
      TextStyle(fontFamily: fontBody, fontSize: 14, fontWeight: weight ?? FontWeight.w500, color: color);
  static TextStyle bodySmall({Color? color, FontWeight? weight}) =>
      TextStyle(fontFamily: fontBody, fontSize: 12, fontWeight: weight ?? FontWeight.w600, color: color);

  // Label / Caption
  static TextStyle label({Color? color}) =>
      TextStyle(fontFamily: fontBody, fontSize: 11, fontWeight: FontWeight.w700, color: color,
                letterSpacing: 0.04 * 11);
}
```

### 6.3 Design Tokens

```dart
class AppSizes {
  // Border radius
  static const radiusSm  = 9.0;
  static const radiusMd  = 14.0;
  static const radiusLg  = 18.0;
  static const radiusXl  = 22.0;
  static const radius2xl = 28.0;

  // Spacing
  static const spaceXs   = 6.0;
  static const spaceSm   = 10.0;
  static const spaceMd   = 14.0;
  static const spaceLg   = 20.0;
  static const spaceXl   = 28.0;

  // Button height
  static const buttonHeight = 58.0;
  static const buttonHeightSm = 48.0;

  // Bottom nav
  static const bottomNavHeight = 90.0;

  // Card padding
  static const cardPadding = EdgeInsets.all(18);
}
```

---

## 7. Riverpod Provider Design

### 7.1 Auth Providers

```dart
// auth_provider.dart

// Firebase user stream
@riverpod
Stream<User?> firebaseUser(FirebaseUserRef ref) {
  return FirebaseAuth.instance.authStateChanges();
}

// App auth state (bao gồm isPremium từ custom claim)
@riverpod
class AuthNotifier extends _$AuthNotifier {
  @override
  FutureOr<AuthUser?> build() async {
    final user = ref.watch(firebaseUserProvider).value;
    if (user == null) return null;
    final token = await user.getIdTokenResult();
    return AuthUser(
      uid: user.uid,
      email: user.email ?? '',
      isPremium: token.claims?['premium'] == true,
    );
  }

  Future<void> loginEmail(String email, String pass) async { … }
  Future<void> loginGoogle() async { … }
  Future<void> loginApple() async { … }
  Future<void> register(String email, String pass) async { … }
  Future<void> logout() async { … }
}
```

### 7.2 Me/Quota Provider

```dart
@riverpod
Future<MeResponse> me(MeRef ref) async {
  ref.watch(authNotifierProvider); // invalidate khi auth thay đổi
  final repo = ref.watch(solveRepositoryProvider);
  return repo.getMe();
}
```

### 7.3 Solve Provider (State Machine)

```dart
// Trạng thái của flow giải bài
enum SolveStatus { idle, loading, success, error }

@immutable
class SolveState {
  final SolveStatus status;
  final SolveResult? result;
  final String? errorCode;    // 'QUOTA_EXCEEDED', 'RATE_LIMITED', etc.
  final String? errorMessage;
  
  const SolveState({ … });
}

@riverpod
class SolveNotifier extends _$SolveNotifier {
  @override
  SolveState build() => const SolveState(status: SolveStatus.idle);

  Future<void> solveText(String text, String mode) async {
    state = SolveState(status: SolveStatus.loading);
    try {
      final result = await ref.read(solveUsecaseProvider).solveText(text, mode);
      state = SolveState(status: SolveStatus.success, result: result);
    } on QuotaExceededException catch (e) {
      state = SolveState(status: SolveStatus.error, errorCode: 'QUOTA_EXCEEDED');
    } on ApiException catch (e) {
      state = SolveState(status: SolveStatus.error, errorMessage: e.message);
    }
  }

  Future<void> solveImage(String base64, String mode) async { … }
  void reset() => state = const SolveState(status: SolveStatus.idle);
}
```

### 7.4 Chat Provider (Local, không cần BE mới)

Chat trong UI là follow-up sau Solution → gọi lại `POST /solve` với mode `explain_more` hoặc gửi text question mới.

```dart
@immutable
class ChatMessage {
  final String id;
  final bool isUser;
  final String text;
  final DateTime createdAt;
}

@riverpod
class ChatNotifier extends _$ChatNotifier {
  @override
  List<ChatMessage> build() => [];

  Future<void> sendMessage(String text) async {
    // Thêm user message
    state = [...state, ChatMessage(id: uuid(), isUser: true, text: text, …)];
    // Thêm typing indicator (isUser=false, text='...')
    state = [...state, ChatMessage(id: '___typing', isUser: false, text: '...', …)];
    // Gọi /solve với mode=explain_more
    final result = await ref.read(solveUsecaseProvider).solveText(text, 'explain_more');
    // Replace typing với AI response
    state = state.where((m) => m.id != '___typing').toList()
      ..add(ChatMessage(isUser: false, text: result.finalAnswer + '\n\n' + result.steps.map(…).join(), …));
  }
}
```

### 7.5 History Provider (Hive local cache)

```dart
@riverpod
Future<List<SolveResult>> history(HistoryRef ref) async {
  final box = await Hive.openBox<SolveResult>('history');
  return box.values.toList().reversed.toList();
}
```

Sau mỗi lần solve thành công → lưu vào Hive box.

---

## 8. Màn hình chi tiết — Spec UI

### Screen 01 · Splash
- Background: `LinearGradient(#6D5DF6 → #7C5CFC → #5B4BE0)`
- Nova avatar: float animation (translateY 0 → -10px lặp 4s)
- Logo text: `Fredoka 44px bold #fff "StudyBuddy"`
- Sau 2.5s → redirect (auth guard quyết định Home hay Onboarding)

### Screen 02-04 · Onboarding
- 3 slide (PageView): Scan · Steps · Ask
- Bottom dots indicator (purple active, gray inactive — `width: 26/8`)
- CTA: "Next" → "Get Started" → navigate Login

### Screen 05 · Login
- Google Sign-In button (border, Google colors)
- Apple Sign-In button (black bg)
- Or divider
- Email field (icon: mail, placeholder text)
- Password field (icon: lock, eye toggle)
- "Log In" gradient button
- "New here? Create account" → push Register hoặc toggle form

### Screen 06 · Home
- Header: `Hi, {name} 👋 / Ready to learn today?`
- Avatar: gradient initials, online indicator
- Streak card: gradient purple, `{n}-day streak 🔥`, 7 dots progress bar
- Quick actions grid: Scan Homework (2x1) + Ask AI Tutor + Type Question
- Subjects: 4×2 grid (Math/Physics/Chemistry/Biology/English/History/Geo/Coding)
- Recent questions list
- **Bottom Nav:** Home · Chat · [Scan FAB center] · History · Profile

### Screen 07 · Camera Scan
- Dark bg (#0c0d16)
- Viewfinder frame: 4 corner markers purple
- Scan line animation (gradient horizontal bar moving)
- Bottom: mode selector (Solve / Graph / Word) + shutter + gallery/flip
- Top: ✕ close + flash toggle + "Scan" label

### Screen 08 · Crop (Image Preview)
- Drag handles: 4 corners (circle resize handles)
- "Detected: Algebra (Math) ✓" chip
- "Retake" ghost button + "Solve with AI" gradient button

### Screen 09 · Loading
- Nova avatar: float + pulseRing animation
- "AI is analyzing your question…"
- 3-step checklist: Reading image ✓ → Understanding (spinner) → Generating (dim)
- Progress bar 62%

### Screen 10 · Solution (Light) / Screen 20 · Solution (Dark)
- Question card (problem_text + subject chip)
- Answer card: gradient purple, `{final_answer}`, confidence badge (e.g. "98% confident")
- Step-by-step expandable list
- Warning tip card (yellow)
- Action row: "Practice similar" (dark) + "Explain simpler" (ghost)
- Follow-up input bar at bottom → navigate Chat

### Screen 11 · Chat
- Header: Nova avatar + "Nova · AI Tutor" + "● Online" + subject chip
- Messages: user (right, gradient purple) + AI (left, white bubble, bot avatar)
- Typing indicator: 3 dots bounce animation
- Suggestion chips: "Explain simpler" / "Another example" / "Check my answer"
- Input bar: image icon + text + mic + send

### Screen 12 · Text Question
- Large text area with cursor blink
- Subject chips (Math selected purple, others gray)
- Difficulty toggle: Easy/Medium/Hard (slider style)
- Example questions list
- "Solve with AI" CTA

### Screen 13 · Subject Detail
- (Không có screenshot riêng nhưng từ Subjects grid → show filtered history + practice sets cho môn đó)

### Screen 14 · History
- Search bar
- Filter chips: All / Math / Physics / Saved
- Grouped by date: TODAY / YESTERDAY / …
- Each item: subject icon + problem_text + time + status badge (Solved/Saved/Practice)

### Screen 15 · Practice
- Progress bar + counter (2/10)
- Question card: difficulty badge + question text + formula
- Multiple choice A/B/C/D
- Correct feedback: green card with explanation
- "Show hint" button
- "Next question" CTA
- Source: `similar_questions` từ solve response

### Screen 16 · Profile
- Purple gradient header với avatar initials
- Stats: streak 🔥 · Solved count · Saved count
- Menu: Saved questions / Learning progress / Language / Dark mode toggle
- Premium card (nếu active)

### Screen 17 · Premium
- Dark gradient bg (#1b1340)
- Crown icon + "Learn without limits"
- Feature list (checkmarks xanh)
- Price cards: Monthly ($6.99) vs Yearly ($49.99, SAVE 40%)
- "Start learning smarter" white CTA button
- "Cancel anytime · 7-day free trial"
- RevenueCat integration

### Screen 18 · Settings
- Account & Profile / Notifications toggle
- Language / Theme
- Help center / Privacy policy
- Log out (red)

---

## 9. Social Login (Google + Apple)

### Flow Google Sign-In
```
1. User tap "Continue with Google"
2. GoogleSignIn().signIn() → GoogleSignInAccount
3. GoogleSignInAuthentication → idToken, accessToken
4. GoogleAuthProvider.credential(idToken, accessToken)
5. FirebaseAuth.signInWithCredential(credential) → UserCredential
6. user.getIdToken() → Firebase idToken
7. Lưu vào FlutterSecureStorage
8. Dùng idToken này cho header Authorization tới BE
```

### Flow Apple Sign-In (iOS)
```
1. User tap "Continue with Apple"
2. getAppleIDCredential() → AppleIDCredential
3. OAuthProvider('apple.com').credential(idToken, rawNonce)
4. FirebaseAuth.signInWithCredential(credential) → UserCredential
5. user.getIdToken() → Firebase idToken
6. Lưu + dùng tương tự Google
```

**Không cần thay đổi gì ở BE** — BE chỉ verify Firebase idToken bằng `admin.auth().verifyIdToken(token)`, hoàn toàn hỗ trợ mọi provider (email, Google, Apple).

---

## 10. Premium / RevenueCat Integration

### Setup
1. Tạo app trên RevenueCat, link đến Play Console + App Store Connect
2. Định nghĩa Offerings: `studybuddy_monthly` ($6.99), `studybuddy_yearly` ($49.99)
3. BE entity `subscriptions` (provider: 'revenuecat') đã sẵn sàng

### Flutter Flow
```
1. Purchases.configure(PurchasesConfiguration(apiKey))
2. Purchases.logIn(uid) // link với Firebase UID
3. Hiện danh sách packages từ getOfferings()
4. User chọn → Purchases.purchasePackage(package)
5. Kiểm tra CustomerInfo.entitlements.active
6. Nếu có entitlement "premium" → Gọi webhook hoặc API riêng
   để BE set Firebase Custom Claim: { premium: true }
7. user.getIdToken(forceRefresh: true) → token mới có claim
```

### Webhook BE (cần thêm endpoint sau)
```
POST /webhook/revenuecat
Body: RevenueCat event payload
→ Xác minh signature
→ Set Firebase Custom Claim: admin.auth().setCustomUserClaims(uid, { premium: true })
→ Upsert subscriptions table
```

---

## 11. Local Storage (Hive)

| Box | Key | Value | Dùng để |
|---|---|---|---|
| `history` | uuid | `SolveResultHive` | History screen offline |
| `saved` | uuid | `SolveResultHive` | Bookmarked questions |
| `onboarding` | `done` | bool | Skip onboarding |
| `preferences` | `theme` | `'light'/'dark'` | Dark mode |
| `preferences` | `lang` | `'en'/'vi'` | Ngôn ngữ |

**Giới hạn:** giữ tối đa 100 bản ghi history (FIFO khi đầy)

---

## 12. Xử lý ảnh (Camera Flow)

```
CameraScreen
  │ [Chụp ảnh]
  ▼
XFile (raw camera image)
  │ [ImageUtils.compress(file, maxWidth: 1280, quality: 85)]
  ▼
Compressed XFile (~< 500KB)
  │ [CropScreen - image_cropper]
  ▼
CroppedFile
  │ [base64Encode(await file.readAsBytes())]
  ▼
String base64
  │ validate size (< 2MB sau base64 decode)
  ▼
POST /solve { input_type: "image", image_base64: base64, mode: "fast" }
```

---

## 13. Theme — Light / Dark

| Token | Light | Dark |
|---|---|---|
| `Scaffold background` | `#F5F6FB` | `#0D0E1A` |
| `Card bg` | `#FFFFFF` | `#181926` |
| `Text primary` | `#15162B` | `#FFFFFF` |
| `Text secondary` | `#82849A` | `#8A8CA6` |
| `Border` | `#ECEDF4` | `#2A2C45` |
| `Bottom nav bg` | `rgba(255,255,255,0.92)` | `rgba(13,14,26,0.92)` |

Dark mode: toggle trong Profile → lưu SharedPreferences → `ThemeMode.dark`

---

## 14. Error Handling Strategy

```
API Error (Dio) 
  → DioException
    → 400: AppException.badRequest(code, message)  
    → 401: AppException.unauthorized() → force logout
    → 429: 
        code=QUOTA_EXCEEDED → QuotaExceededException  
        code=RATE_LIMITED   → RateLimitedException
    → 5xx: AppException.serverError()
    → timeout/no internet → AppException.networkError()

AppException → sealed class → switch in UI:
  badRequest    → Snackbar (message từ BE)
  unauthorized  → navigate Login
  quota         → QuotaDialog (nút Upgrade)
  rateLimit     → Snackbar "Thử lại sau 1 phút"
  server        → Snackbar "Lỗi hệ thống"
  network       → Snackbar "Không có kết nối"
```

---

## 15. Quota UI Components

### QuotaBar (hiển thị trong Home + Solution)
```
used=1, limit=5 (free)  →  "4 lượt còn lại hôm nay"
used=5, limit=5 (free)  →  "Hết lượt · Reset lúc 00:00" + nút "Upgrade"
used=12, limit=50 (pro) →  "38 lượt còn lại"
```

---

## 16. Build & Release

### Android
```yaml
# android/app/build.gradle
minSdkVersion: 24
targetSdkVersion: 34
```
- Keystore signing cho release
- ProGuard rules cho firebase_admin, google_sign_in

### iOS
```yaml
# ios/Runner/Info.plist
NSCameraUsageDescription: "Dùng để chụp đề bài"
NSPhotoLibraryUsageDescription: "Dùng để chọn ảnh đề bài"
```
- Sign in with Apple: enable capability trong Xcode
- RevenueCat: enable In-App Purchase capability

---

## 17. Testing Strategy

| Loại | Phạm vi | Tool |
|---|---|---|
| Unit | UseCases, Repository, AuthInterceptor | `flutter_test` + `mockito` |
| Widget | Screen widgets, shared widgets | `flutter_test` |
| Integration | Luồng Login → Solve → Solution | `integration_test` |

---

## 18. Sequence Diagram — Luồng giải bài chính

```
User          Flutter App       FirebaseAuth     NestJS BE       Gemini AI
 │                │                  │               │               │
 │── chụp ảnh ──►│                  │               │               │
 │                │── compress ─────►│               │               │
 │                │── crop ──────────│               │               │
 │                │                  │               │               │
 │── "Solve" ────►│                  │               │               │
 │                │── getIdToken ───►│               │               │
 │                │◄── idToken ──────│               │               │
 │                │                  │               │               │
 │                │─── POST /solve ──────────────────►│               │
 │                │    Authorization: Bearer <token>  │               │
 │                │    { input_type, image_base64 }   │               │
 │                │                  │               │── verify ────►│
 │                │                  │               │               │
 │                │                  │               │── Gemini API─►│
 │                │                  │               │◄── AI result──│
 │                │                  │               │── save DB     │
 │                │◄─── 200 solution ────────────────│               │
 │                │                  │               │               │
 │◄── Solution ───│                  │               │               │
 │    Screen      │                  │               │               │
```

---

## 19. Sprint Roadmap đề xuất

| Sprint | Công việc |
|---|---|
| S1 (1w) | Project setup, core module, auth flow (email + Google + Apple), Splash/Onboarding/Login screens |
| S2 (1w) | Home screen, Camera scan, Crop, Text question screens, Dio/interceptor setup |
| S3 (1w) | Loading screen, Solution screen, solve integration (text + image), quota UI |
| S4 (1w) | Chat screen, History screen (Hive), Practice screen |
| S5 (1w) | Profile, Settings, Dark mode, Premium screen + RevenueCat integration |
| S6 (1w) | Polish animation, LaTeX render, unit tests, bug fix, release build |

---

## 20. File pubspec.yaml (khung)

```yaml
name: studybuddy
description: AI Study Tutor — scan, ask, learn.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'
  flutter: '>=3.19.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5
  go_router: ^14.2.0
  dio: ^5.7.0
  firebase_core: ^3.6.0
  firebase_auth: ^5.3.1
  google_sign_in: ^6.2.1
  sign_in_with_apple: ^6.1.0
  camera: ^0.11.0+2
  image_cropper: ^4.0.1
  image_picker: ^1.1.2
  hive_flutter: ^1.1.0
  flutter_secure_storage: ^9.2.2
  shared_preferences: ^2.3.2
  purchases_flutter: ^7.8.0          # RevenueCat
  flutter_math_fork: ^0.7.2          # LaTeX
  lottie: ^3.1.2
  permission_handler: ^11.3.1
  google_fonts: ^6.2.1
  uuid: ^4.4.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  riverpod_generator: ^2.4.3
  build_runner: ^2.4.11
  mockito: ^5.4.4
  flutter_lints: ^4.0.0
```

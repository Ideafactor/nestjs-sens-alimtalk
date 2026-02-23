# NestJS SENS AlimTalk

NAVER Cloud Platform SENS AlimTalk API를 위한 NestJS 모듈입니다.

## 설치

```bash
npm install nestjs-sens-alimtalk
```

## 설정

### 모듈 등록

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SensAlimtalkModule } from 'nestjs-sens-alimtalk';

@Module({
  imports: [
    ConfigModule.forRoot(),

    // 방법 1: forRootAsync (권장)
    SensAlimtalkModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        accessKey: config.get('NCLOUD_ACCESS_KEY'),
        secretKey: config.get('NCLOUD_SECRET_KEY'),
        serviceId: config.get('SENS_SERVICE_ID'),
        plusFriendId: config.get('KAKAO_PLUS_FRIEND_ID'),
        useSmsFailover: true, // SMS 대체 발송 (선택, 기본값: true)
      }),
      isGlobal: true, // 전역 모듈 여부 (선택, 기본값: true)
    }),

    // 방법 2: forRoot (직접 설정)
    // SensAlimtalkModule.forRoot({
    //   accessKey: 'your-access-key',
    //   secretKey: 'your-secret-key',
    //   serviceId: 'your-service-id',
    //   plusFriendId: '@yourplusfriend',
    //   isGlobal: true, // 전역 모듈 여부 (선택, 기본값: true)
    // }),
  ],
})
export class AppModule {}
```

#### `isGlobal` 옵션

기본값은 `true`로 기존 동작과 동일합니다. 멀티테넌시 구조처럼 모듈을 여러 인스턴스로 등록해야 하는 경우 `false`로 설정하세요.

```typescript
// 기능별로 독립적인 모듈 인스턴스가 필요한 경우
SensAlimtalkModule.forRoot({
  // ...
  isGlobal: false,
})
```

### 환경 변수

```env
NCLOUD_ACCESS_KEY=your_access_key
NCLOUD_SECRET_KEY=your_secret_key
SENS_SERVICE_ID=your_service_id
KAKAO_PLUS_FRIEND_ID=@yourplusfriend
```

## 사용법

### 기본 사용

```typescript
import { Injectable } from '@nestjs/common';
import { SensAlimtalkService } from 'nestjs-sens-alimtalk';

@Injectable()
export class NotificationService {
  constructor(private readonly alimtalkService: SensAlimtalkService) {}

  async sendWelcomeMessage(phone: string, name: string) {
    const message = this.alimtalkService
      .createMessage()
      .templateCode('WELCOME_001')
      .to(phone)
      .content('안녕하세요 #{name}님! 가입을 환영합니다.')
      .variables({ name });

    return this.alimtalkService.sendMessage(message);
  }
}
```

### 버튼 추가

```typescript
const message = this.alimtalkService
  .createMessage()
  .templateCode('ORDER_COMPLETE')
  .to('01012345678')
  .content('주문이 완료되었습니다.\n주문번호: #{orderNo}')
  .variables({ orderNo: 'ORD-2024-001' })
  .button({
    type: 'WL',
    name: '주문 확인',
    linkMobile: 'https://example.com/orders/123',
    linkPc: 'https://example.com/orders/123',
  })
  .button({
    type: 'WL',
    name: '배송 조회',
    linkMobile: 'https://example.com/tracking/123',
  });

await this.alimtalkService.sendMessage(message);
```

### 버튼 타입

| 타입 | 설명 |
|------|------|
| `WL` | 웹 링크 |
| `AL` | 앱 링크 |
| `DS` | 배송 조회 |
| `BK` | 봇 키워드 |
| `MD` | 메시지 전달 |
| `BC` | 상담톡 전환 |
| `BT` | 봇 전환 |

### 다중 수신자

```typescript
const message = this.alimtalkService
  .createMessage()
  .templateCode('NOTICE_001')
  .to(['01012345678', '01087654321', '01011112222'])
  .content('공지사항입니다.');

await this.alimtalkService.sendMessage(message);
```

### UTM 파라미터 자동 추가

```typescript
const message = this.alimtalkService
  .createMessage()
  .templateCode('PROMO_001')
  .to('01012345678')
  .content('특별 할인 이벤트!')
  .button({
    type: 'WL',
    name: '이벤트 보기',
    linkMobile: 'https://example.com/event',
  })
  .utmSource('utm_source=kakao&utm_medium=alimtalk&utm_campaign=promo');

// 결과: linkMobile = 'https://example.com/event?utm_source=kakao&utm_medium=alimtalk&utm_campaign=promo'
```

### 예약 발송

```typescript
// 30분 후 발송 (최소 11분 이상)
const message = this.alimtalkService
  .createMessage()
  .templateCode('REMINDER_001')
  .to('01012345678')
  .content('예약 알림입니다.')
  .reserveAfterMinutes(30);

// 3일 후 발송 (최대 180일)
const message2 = this.alimtalkService
  .createMessage()
  .templateCode('REMINDER_001')
  .to('01012345678')
  .content('예약 알림입니다.')
  .reserveAfterDays(3);

// 특정 시간 지정
const message3 = this.alimtalkService
  .createMessage()
  .templateCode('REMINDER_001')
  .to('01012345678')
  .content('예약 알림입니다.')
  .reserveTime('2024-12-25 09:00');
```

### SMS 대체 발송 설정

```typescript
const message = this.alimtalkService
  .createMessage()
  .templateCode('NOTICE_001')
  .to('01012345678')
  .content('알림톡 내용')
  .useSmsFailover(true)
  .failoverContent('SMS 대체 발송 시 표시될 내용');
```

`useSmsFailover(false)`로 설정하면 `failoverConfig` 필드 자체가 요청에서 제외됩니다. SENS API에서 불필요한 필드로 인한 오류를 방지합니다.

### 플러스친구 ID 변경

```typescript
// 기본 설정된 plusFriendId 대신 다른 ID 사용
const message = this.alimtalkService
  .createMessage()
  .plusFriendId('@anotherfriend')
  .templateCode('NOTICE_001')
  .to('01012345678')
  .content('알림톡 내용');
```

## API 응답

```typescript
interface SensAlimtalkResponse {
  requestId: string;
  requestTime: string;
  statusCode: string;      // '202' = 성공
  statusName: string;
  messages: Array<{
    messageId: string;
    to: string;
    requestStatusCode: string;
    requestStatusName: string;
    requestStatusDesc?: string;
  }>;
}
```

## 에러 처리

```typescript
import {
  SensAlimtalkService,
  CouldNotSendNotificationException
} from 'nestjs-sens-alimtalk';

try {
  await this.alimtalkService.sendMessage(message);
} catch (error) {
  if (error instanceof CouldNotSendNotificationException) {
    console.error('알림톡 발송 실패:', error.message);
  }
}
```

## 테스트

### 데모 서버 실행

```bash
cd example

# 환경 변수 설정
cp .env.example .env
# .env 파일에 실제 SENS API 키 입력

# 의존성 설치
npm install

# 서버 실행
npm start
```

### 데모 페이지 접속

브라우저에서 http://localhost:3000 접속

**데모 페이지 기능:**
- 템플릿 코드, 수신번호, 메시지 내용 입력
- `#{변수명}` 변수 자동 감지 및 치환
- 버튼 추가/삭제
- UTM 파라미터, 예약 발송 설정
- **테스트(Mock)**: API 호출 없이 메시지 빌드 결과 확인
- **실제 발송**: SENS API 호출 (`.env` 설정 필요)

### API 직접 테스트 (curl)

```bash
# Mock 테스트 (API 호출 없이 빌드 결과 확인)
curl -X POST http://localhost:3000/alimtalk/test \
  -H "Content-Type: application/json" \
  -d '{
    "templateCode": "WELCOME_001",
    "to": "01012345678",
    "content": "안녕하세요 #{name}님!",
    "variables": { "name": "홍길동" },
    "buttons": [
      { "type": "WL", "name": "바로가기", "linkMobile": "https://example.com" }
    ]
  }'

# 실제 발송 (.env 설정 필요)
curl -X POST http://localhost:3000/alimtalk/send \
  -H "Content-Type: application/json" \
  -d '{
    "templateCode": "WELCOME_001",
    "to": "01012345678",
    "content": "안녕하세요 #{name}님!",
    "variables": { "name": "홍길동" }
  }'
```

## 프로젝트 구조

```
nestjs-sens-alimtalk/
├── src/
│   ├── index.ts                              # 모듈 내보내기
│   ├── sens-alimtalk.module.ts               # NestJS 모듈
│   ├── sens-alimtalk.service.ts              # API 클라이언트 서비스
│   ├── sens-alimtalk-message.builder.ts      # 메시지 빌더
│   ├── constants/
│   │   └── sens-alimtalk.constants.ts
│   ├── interfaces/
│   │   ├── index.ts
│   │   ├── sens-alimtalk-config.interface.ts
│   │   ├── sens-alimtalk-button.interface.ts
│   │   ├── sens-alimtalk-message.interface.ts
│   │   └── sens-alimtalk-response.interface.ts
│   └── exceptions/
│       └── could-not-send-notification.exception.ts
├── example/                                   # 데모 앱
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   └── alimtalk.controller.ts
│   ├── public/
│   │   └── index.html                        # 데모 페이지
│   └── .env.example
├── package.json
└── tsconfig.json
```

## 변경 이력

### v1.1.0

#### 개선 사항

**`isGlobal` 옵션 추가** (`SensAlimtalkConfig`, `SensAlimtalkAsyncOptions`)

`@Global()` 데코레이터를 하드코딩하는 대신 `DynamicModule.global` 속성을 동적으로 제어합니다. 기본값은 `true`로 기존 동작과 동일하며, `false`로 설정하면 해당 모듈 범위에서만 `SensAlimtalkService`가 주입됩니다.

**`build()` 필수 필드 검증 추가**

`templateCode`, `to`, `content`를 설정하지 않고 `build()`를 호출하면 명확한 오류 메시지를 던집니다. 기존에는 `undefined.replace is not a function` 같은 불명확한 런타임 오류가 발생했습니다.

```
Error: templateCode is required. Call .templateCode() before .build()
Error: to is required. Call .to() before .build()
Error: content is required. Call .content() before .build()
```

**`failoverConfig` 조건부 포함 수정**

`useSmsFailover(false)` 설정 시 `failoverConfig` 필드가 API 요청 바디에서 제외됩니다. 이전에는 `useSmsFailover` 값에 관계없이 항상 포함되어 SENS API에서 불필요한 필드로 거부될 수 있었습니다.

**`HttpStatus` 안전 캐스팅**

SENS API가 NestJS에 정의되지 않은 HTTP 상태 코드(예: 429 Too Many Requests)를 반환하는 경우, 강제 캐스팅 대신 `HttpStatus.BAD_GATEWAY`로 안전하게 폴백합니다.

#### 의존성 재분류

소비자 앱의 패키지 버전 충돌을 방지하기 위해 의존성을 재분류했습니다.

| 패키지 | 변경 전 | 변경 후 |
|--------|---------|---------|
| `@nestjs/axios` | `dependencies` | `peerDependencies` |
| `@nestjs/common` | `dependencies` + `peerDependencies` (중복) | `peerDependencies` |
| `@nestjs/core` | `peerDependencies` | `peerDependencies` |
| `@nestjs/config` | `dependencies` | 제거 (라이브러리 내부에서 미사용) |
| `axios` | `dependencies` | `peerDependencies` |
| `rxjs` | `dependencies` | `peerDependencies` |

> **마이그레이션:** `@nestjs/axios`, `axios`, `rxjs`가 소비자 앱의 의존성에 없다면 별도로 설치해야 합니다.
> ```bash
> npm install @nestjs/axios axios rxjs
> ```

`engines` 필드가 추가되어 Node.js 16 이상을 요구합니다. `exports` 필드 추가로 번들러 호환성이 향상됩니다.

## 라이선스

MIT

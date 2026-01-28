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
    }),

    // 방법 2: forRoot (직접 설정)
    // SensAlimtalkModule.forRoot({
    //   accessKey: 'your-access-key',
    //   secretKey: 'your-secret-key',
    //   serviceId: 'your-service-id',
    //   plusFriendId: '@yourplusfriend',
    // }),
  ],
})
export class AppModule {}
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

## 라이선스

MIT

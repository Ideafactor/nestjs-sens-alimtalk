# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-28

### Added
- 초기 릴리스
- AlimTalk 메시지 발송 기능 (`sendAlimTalk`)
- 메시지 빌더 패턴 지원 (`AlimTalkMessageBuilder`)
- 예약 발송 기능 (reserveTime, scheduleCode)
- SMS 대체 발송 기능 (failover 옵션)
- 완전한 TypeScript 타입 정의
- 동기/비동기 모듈 등록 지원 (`forRoot`, `forRootAsync`)
- Express 기반 데모 앱 포함

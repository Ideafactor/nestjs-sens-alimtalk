import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { SensAlimtalkService } from '../../src';

interface SendAlimtalkDto {
  templateCode: string;
  to: string;
  content: string;
  variables?: Record<string, string>;
  buttons?: Array<{
    type: 'WL' | 'AL' | 'DS' | 'BK' | 'MD' | 'BC' | 'BT';
    name: string;
    linkMobile?: string;
    linkPc?: string;
  }>;
  utmSource?: string;
  reserveMinutes?: number;
}

@Controller('alimtalk')
export class AlimtalkController {
  constructor(private readonly alimtalkService: SensAlimtalkService) {}

  @Post('send')
  async send(@Body() dto: SendAlimtalkDto) {
    try {
      const message = this.alimtalkService
        .createMessage()
        .templateCode(dto.templateCode)
        .to(dto.to)
        .content(dto.content);

      if (dto.variables) {
        message.variables(dto.variables);
      }

      if (dto.buttons) {
        dto.buttons.forEach(button => message.button(button));
      }

      if (dto.utmSource) {
        message.utmSource(dto.utmSource);
      }

      if (dto.reserveMinutes) {
        message.reserveAfterMinutes(dto.reserveMinutes);
      }

      const result = await this.alimtalkService.sendMessage(message);

      return {
        success: true,
        message: '알림톡 발송 요청 완료',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '알림톡 발송 실패',
          error: error.response || error,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test')
  async test(@Body() dto: SendAlimtalkDto) {
    // Mock 응답 - 실제 API 호출 없이 빌드된 메시지 확인
    const message = this.alimtalkService
      .createMessage()
      .templateCode(dto.templateCode)
      .to(dto.to)
      .content(dto.content);

    if (dto.variables) {
      message.variables(dto.variables);
    }

    if (dto.buttons) {
      dto.buttons.forEach(button => message.button(button));
    }

    if (dto.utmSource) {
      message.utmSource(dto.utmSource);
    }

    const builtMessage = message.build();

    return {
      success: true,
      message: '테스트 모드 - API 호출 없이 메시지 빌드 결과 반환',
      data: {
        requestId: 'test-' + Date.now(),
        requestTime: new Date().toISOString(),
        statusCode: '202',
        statusName: 'success',
        builtMessage,
      },
    };
  }
}

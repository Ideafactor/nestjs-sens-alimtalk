import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { AxiosError } from 'axios';
import {
  SensAlimtalkConfig,
  SensAlimtalkRequestBody,
  SensAlimtalkResponse,
} from './interfaces';
import {
  SENS_ALIMTALK_MODULE_OPTIONS,
  SENS_BASE_URL,
  SENS_ALIMTALK_API_PATH,
  DEFAULT_TIMEOUT,
} from './constants/sens-alimtalk.constants';
import { SensAlimtalkMessageBuilder } from './sens-alimtalk-message.builder';
import { CouldNotSendNotificationException } from './exceptions/could-not-send-notification.exception';

@Injectable()
export class SensAlimtalkService {
  private readonly baseUrl = SENS_BASE_URL;
  private readonly targetUrl: string;

  constructor(
    @Inject(SENS_ALIMTALK_MODULE_OPTIONS)
    private readonly config: SensAlimtalkConfig,
    private readonly httpService: HttpService,
  ) {
    this.targetUrl = `${SENS_ALIMTALK_API_PATH}/${config.serviceId}/messages`;
  }

  createMessage(): SensAlimtalkMessageBuilder {
    return new SensAlimtalkMessageBuilder(
      this.config.plusFriendId,
      this.config.useSmsFailover ?? true,
    );
  }

  private generateSignature(timestamp: string): string {
    const method = 'POST';
    const message = `${method} ${this.targetUrl}\n${timestamp}\n${this.config.accessKey}`;

    const hmac = crypto.createHmac('sha256', this.config.secretKey);
    hmac.update(message);

    return hmac.digest('base64');
  }

  async sendMessage(
    message: SensAlimtalkMessageBuilder | SensAlimtalkRequestBody,
  ): Promise<SensAlimtalkResponse> {
    const body = message instanceof SensAlimtalkMessageBuilder
      ? message.build()
      : message;

    const timestamp = Date.now().toString();
    const signature = this.generateSignature(timestamp);

    const url = `${this.baseUrl}${this.targetUrl}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<SensAlimtalkResponse>(url, body, {
          headers: {
            'Content-Type': 'application/json',
            'x-ncp-apigw-timestamp': timestamp,
            'x-ncp-iam-access-key': this.config.accessKey,
            'x-ncp-apigw-signature-v2': signature,
          },
          timeout: DEFAULT_TIMEOUT,
        }),
      );

      const result = response.data;

      if (result.statusCode !== '202') {
        throw CouldNotSendNotificationException.serviceRespondedWithAnError(result);
      }

      return result;
    } catch (error) {
      if (error instanceof CouldNotSendNotificationException) {
        throw error;
      }

      if (error instanceof AxiosError) {
        throw CouldNotSendNotificationException.serviceRespondedWithAnHttpError(error);
      }

      throw CouldNotSendNotificationException.serviceCommunicationError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async send(body: SensAlimtalkRequestBody): Promise<SensAlimtalkResponse> {
    return this.sendMessage(body);
  }
}

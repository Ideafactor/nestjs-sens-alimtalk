import { HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import { SensAlimtalkResponse } from '../interfaces';

export class CouldNotSendNotificationException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }

  static serviceRespondedWithAnHttpError(
    error: AxiosError,
  ): CouldNotSendNotificationException {
    const rawStatus = error.response?.status ?? 500;
    const status = Object.values(HttpStatus).includes(rawStatus as HttpStatus)
      ? (rawStatus as HttpStatus)
      : HttpStatus.BAD_GATEWAY;
    const message = `SensAlimtalk responded with an HTTP error: ${rawStatus}: ${error.message}`;
    return new CouldNotSendNotificationException(message, status);
  }

  static serviceRespondedWithAnError(
    response: SensAlimtalkResponse,
  ): CouldNotSendNotificationException {
    const requestStatusCode =
      response.messages?.[0]?.requestStatusCode ?? 'UNKNOWN';
    const message = `SensAlimtalk was not sent: ${response.statusCode}: ${requestStatusCode}`;
    return new CouldNotSendNotificationException(message, HttpStatus.BAD_REQUEST);
  }

  static serviceCommunicationError(
    error: Error,
  ): CouldNotSendNotificationException {
    const message = `Communication with SensAlimtalk failed: ${error.message}`;
    return new CouldNotSendNotificationException(
      message,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  static invalidReservationTime(message: string): CouldNotSendNotificationException {
    return new CouldNotSendNotificationException(message, HttpStatus.BAD_REQUEST);
  }
}

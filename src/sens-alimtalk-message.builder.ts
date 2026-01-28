import {
  SensAlimtalkButton,
  SensAlimtalkMessageItem,
  SensAlimtalkRequestBody,
} from './interfaces';
import {
  DEFAULT_COUNTRY_CODE,
  VARIABLE_PATTERN,
  MIN_RESERVE_MINUTES,
  MAX_RESERVE_DAYS,
} from './constants/sens-alimtalk.constants';
import { CouldNotSendNotificationException } from './exceptions/could-not-send-notification.exception';

export class SensAlimtalkMessageBuilder {
  private _plusFriendId: string;
  private _templateCode: string;
  private _to: string | string[];
  private _content: string;
  private _buttons: SensAlimtalkButton[] = [];
  private _useSmsFailover: boolean;
  private _failoverContent?: string;
  private _reserveTime?: string;
  private _countryCode: string = DEFAULT_COUNTRY_CODE;
  private _variables: Record<string, string> = {};
  private _utmSource?: string;

  constructor(plusFriendId: string, useSmsFailover: boolean = true) {
    this._plusFriendId = plusFriendId;
    this._useSmsFailover = useSmsFailover;
  }

  plusFriendId(plusFriendId: string): this {
    this._plusFriendId = plusFriendId;
    return this;
  }

  templateCode(templateCode: string): this {
    this._templateCode = templateCode;
    return this;
  }

  to(to: string | string[]): this {
    this._to = to;
    return this;
  }

  content(content: string): this {
    this._content = content;
    return this;
  }

  button(button: SensAlimtalkButton): this {
    this._buttons.push(button);
    return this;
  }

  buttons(buttons: SensAlimtalkButton[]): this {
    this._buttons = buttons;
    return this;
  }

  useSmsFailover(useSmsFailover: boolean): this {
    this._useSmsFailover = useSmsFailover;
    return this;
  }

  failoverContent(content: string): this {
    this._failoverContent = content;
    return this;
  }

  reserveTime(reserveTime: string): this {
    this._reserveTime = reserveTime;
    return this;
  }

  countryCode(countryCode: string): this {
    this._countryCode = countryCode;
    return this;
  }

  reserveAfterMinutes(minutes: number): this {
    if (minutes <= MIN_RESERVE_MINUTES) {
      throw CouldNotSendNotificationException.invalidReservationTime(
        `Reservation cannot be requested within ${MIN_RESERVE_MINUTES} minutes.`,
      );
    }

    const maxMinutes = 60 * 24 * MAX_RESERVE_DAYS;
    if (minutes > maxMinutes) {
      throw CouldNotSendNotificationException.invalidReservationTime(
        `Reservations can be made in up to ${MAX_RESERVE_DAYS} days.`,
      );
    }

    const reserveDate = new Date(Date.now() + minutes * 60 * 1000);
    this._reserveTime = this.formatDateTime(reserveDate);
    return this;
  }

  reserveAfterDays(days: number): this {
    if (days > MAX_RESERVE_DAYS) {
      throw CouldNotSendNotificationException.invalidReservationTime(
        `Reservations can be made in up to ${MAX_RESERVE_DAYS} days.`,
      );
    }

    const reserveDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    this._reserveTime = this.formatDateTime(reserveDate);
    return this;
  }

  variables(variables: Record<string, string>): this {
    this._variables = variables;
    return this;
  }

  utmSource(utmSource: string): this {
    this._utmSource = utmSource;
    return this;
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}`;
  }

  private replaceVariables(text: string): string {
    return text.replace(VARIABLE_PATTERN, (match, key) => {
      return this._variables[key] ?? match;
    });
  }

  private appendUtmToUrl(url: string): string {
    if (!this._utmSource) {
      return url;
    }
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${this._utmSource}`;
  }

  private processButtons(): SensAlimtalkButton[] | undefined {
    if (this._buttons.length === 0) {
      return undefined;
    }

    return this._buttons.map((button) => {
      const processed = { ...button };
      if (processed.linkMobile) {
        processed.linkMobile = this.appendUtmToUrl(processed.linkMobile);
      }
      if (processed.linkPc) {
        processed.linkPc = this.appendUtmToUrl(processed.linkPc);
      }
      return processed;
    });
  }

  private getFailoverContent(): string {
    if (this._failoverContent) {
      return this._failoverContent;
    }

    const firstButtonLink = this._buttons[0]?.linkMobile ?? '';
    return firstButtonLink
      ? `${this._content}\n\n${firstButtonLink}`
      : this._content;
  }

  build(): SensAlimtalkRequestBody {
    const processedContent = this.replaceVariables(this._content);
    const processedButtons = this.processButtons();
    const recipients = Array.isArray(this._to) ? this._to : [this._to];

    const messages: SensAlimtalkMessageItem[] = recipients.map((recipient) => ({
      to: recipient,
      content: processedContent,
      buttons: processedButtons,
      countryCode: this._countryCode,
      useSmsFailover: this._useSmsFailover,
      failoverConfig: {
        content: this.getFailoverContent(),
      },
    }));

    const body: SensAlimtalkRequestBody = {
      plusFriendId: this._plusFriendId,
      templateCode: this._templateCode,
      messages,
    };

    if (this._reserveTime) {
      body.reserveTime = this._reserveTime;
    }

    return body;
  }
}

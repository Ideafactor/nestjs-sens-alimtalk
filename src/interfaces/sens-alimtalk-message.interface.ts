import { SensAlimtalkButton } from './sens-alimtalk-button.interface';

export interface SensAlimtalkMessageItem {
  to: string;
  content: string;
  buttons?: SensAlimtalkButton[];
  countryCode?: string;
  useSmsFailover?: boolean;
  failoverConfig?: {
    content: string;
  };
}

export interface SensAlimtalkRequestBody {
  plusFriendId: string;
  templateCode: string;
  messages: SensAlimtalkMessageItem[];
  reserveTime?: string;
}

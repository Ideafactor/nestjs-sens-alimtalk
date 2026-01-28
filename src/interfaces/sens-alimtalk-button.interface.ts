export type AlimtalkButtonType = 'WL' | 'AL' | 'DS' | 'BK' | 'MD' | 'BC' | 'BT';

export interface SensAlimtalkButton {
  type: AlimtalkButtonType;
  name: string;
  linkMobile?: string;
  linkPc?: string;
  schemeIos?: string;
  schemeAndroid?: string;
}

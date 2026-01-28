export interface SensAlimtalkMessageResult {
  messageId: string;
  to: string;
  requestStatusCode: string;
  requestStatusName: string;
  requestStatusDesc?: string;
}

export interface SensAlimtalkResponse {
  requestId: string;
  requestTime: string;
  statusCode: string;
  statusName: string;
  messages: SensAlimtalkMessageResult[];
}

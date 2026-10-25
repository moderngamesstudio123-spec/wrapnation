export interface SendTemplateMessageParams {
  toPhone: string; // 10 or 12 digit phone number (e.g. 9876543210 or 919876543210)
  templateName: string;
  languageCode?: string; // default 'en'
  parameters: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  name: string;
  sendTemplate(params: SendTemplateMessageParams): Promise<SendMessageResult>;
}

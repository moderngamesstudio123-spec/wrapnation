import { WhatsAppProvider, SendTemplateMessageParams, SendMessageResult } from './provider';

export class MetaWhatsAppProvider implements WhatsAppProvider {
  name = 'MetaCloudAPI';
  private phoneNumberId: string;
  private accessToken: string;

  constructor(phoneNumberId: string, accessToken: string) {
    this.phoneNumberId = phoneNumberId;
    this.accessToken = accessToken;
  }

  async sendTemplate(params: SendTemplateMessageParams): Promise<SendMessageResult> {
    try {
      // Ensure Indian country code prefix 91
      let recipient = params.toPhone.replace(/\D/g, '');
      if (recipient.length === 10) {
        recipient = `91${recipient}`;
      }

      const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
      const body = {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'template',
        template: {
          name: params.templateName,
          language: { code: params.languageCode || 'en' },
          components: [
            {
              type: 'body',
              parameters: params.parameters,
            },
          ],
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error?.message || 'Meta API error',
        };
      }

      const messageId = data.messages?.[0]?.id;
      return { success: true, messageId };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Network failure';
      return { success: false, error: msg };
    }
  }
}

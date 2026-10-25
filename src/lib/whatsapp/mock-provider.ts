import { WhatsAppProvider, SendTemplateMessageParams, SendMessageResult } from './provider';

export class MockWhatsAppProvider implements WhatsAppProvider {
  name = 'MockWhatsApp';

  async sendTemplate(params: SendTemplateMessageParams): Promise<SendMessageResult> {
    console.log(`[WhatsApp Mock Provider] Sending template "${params.templateName}" to ${params.toPhone}:`);
    console.log('Parameters:', JSON.stringify(params.parameters, null, 2));

    return {
      success: true,
      messageId: `mock_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }
}

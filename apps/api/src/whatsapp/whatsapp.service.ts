import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface PaymentLinkMessage {
  orderDetails: string;
  total: string;
  paymentUrl: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private apiBaseUrl: string;
  private apiKey: string;
  private phoneNumberId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiBaseUrl = this.configService.get<string>("kapso.apiBaseUrl") || "";
    this.apiKey = this.configService.get<string>("kapso.apiKey") || "";
    this.phoneNumberId = this.configService.get<string>("kapso.phoneNumberId") || "";
  }

  async sendOTP(phone: string, code: string): Promise<void> {
    await this.sendTemplate(phone, "otp_verification", "es", [
      {
        type: "body",
        parameters: [{ type: "text", text: code }],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: code }],
      },
    ]);
  }

  async sendPaymentLink(phone: string, details: PaymentLinkMessage): Promise<void> {
    await this.sendTemplate(phone, "payment_link", "es", [
      {
        type: "body",
        parameters: [
          { type: "text", text: details.orderDetails },
          { type: "text", text: details.total },
          { type: "text", text: details.paymentUrl },
        ],
      },
    ]);
  }

  async sendText(phone: string, message: string): Promise<void> {
    await this.sendMessage(phone, {
      type: "text",
      text: { body: message },
    });
  }

  private async sendTemplate(
    phone: string,
    templateName: string,
    language: string,
    components: Array<Record<string, unknown>>,
  ): Promise<void> {
    await this.sendMessage(phone, {
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components,
      },
    });
  }

  private async sendMessage(phone: string, content: Record<string, unknown>): Promise<void> {
    const url = `${this.apiBaseUrl}/platform/v1/phone-numbers/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({
          to: phone,
          ...content,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Kapso API error: ${response.status} - ${errorBody}`);
        throw new Error(`WhatsApp message failed: ${response.status}`);
      }

      this.logger.log(`WhatsApp message sent to ${phone.slice(0, 6)}***`);
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error}`);
      throw error;
    }
  }
}

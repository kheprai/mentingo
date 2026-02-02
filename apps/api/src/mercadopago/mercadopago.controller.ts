import { Body, Controller, Get, Logger, Param, Post, Req } from "@nestjs/common";
import { Type } from "@sinclair/typebox";
import { Validate } from "nestjs-typebox";

import { BaseResponse, baseResponse } from "src/common";
import { Public } from "src/common/decorators/public.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { USER_ROLES } from "src/user/schemas/userRoles";

import { MercadoPagoService } from "./mercadopago.service";
import { MercadoPagoWebhookHandler } from "./mercadopagoWebhook.handler";
import {
  processPaymentSchema,
  paymentResponseSchema,
  getPaymentStatusSchema,
  ProcessPaymentBody,
} from "./schemas/processPayment.schema";
import { webhookPayloadSchema, WebhookPayload } from "./schemas/webhookPayload.schema";

@Controller("mercadopago")
export class MercadoPagoController {
  private readonly logger = new Logger(MercadoPagoController.name);

  constructor(
    private readonly mercadopagoService: MercadoPagoService,
    private readonly webhookHandler: MercadoPagoWebhookHandler,
  ) {}

  @Post("payment")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    response: baseResponse(paymentResponseSchema),
    request: [{ type: "body", schema: processPaymentSchema }],
  })
  async processPayment(@Body() body: ProcessPaymentBody) {
    const result = await this.mercadopagoService.processPayment(body);
    return new BaseResponse(result);
  }

  @Get("payment/:id")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    response: baseResponse(getPaymentStatusSchema),
    request: [
      {
        type: "param",
        name: "id",
        schema: Type.String(),
        required: true,
      },
    ],
  })
  async getPaymentStatus(@Param("id") id: string) {
    const result = await this.mercadopagoService.getPayment(id);
    return new BaseResponse(result);
  }

  @Public()
  @Post("webhook")
  @Validate({
    response: baseResponse(Type.Object({ received: Type.Boolean() })),
    request: [{ type: "body", schema: webhookPayloadSchema }],
  })
  async handleWebhook(@Body() body: WebhookPayload, @Req() _request: Request) {
    this.logger.log(`Webhook received: ${JSON.stringify(body)}`);

    // MercadoPago webhooks should be processed asynchronously
    // Return immediately and process in background
    this.webhookHandler.handleWebhook(body).catch((error) => {
      this.logger.error("Error processing webhook:", error);
    });

    return new BaseResponse({ received: true });
  }
}

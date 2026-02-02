import { Body, Controller, Delete, Get, Logger, Param, Post, Req } from "@nestjs/common";
import { Type } from "@sinclair/typebox";
import { Validate } from "nestjs-typebox";

import { BaseResponse, baseResponse } from "src/common";
import { Public } from "src/common/decorators/public.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { USER_ROLES } from "src/user/schemas/userRoles";

import { MercadoPagoService } from "./mercadopago.service";
import { MercadoPagoWebhookHandler } from "./mercadopagoWebhook.handler";
import { getOrCreateCustomerSchema, customerCardsResponseSchema } from "./schemas/customer.schema";
import {
  processPaymentSchema,
  paymentResponseSchema,
  getPaymentStatusSchema,
  ProcessPaymentBody,
} from "./schemas/processPayment.schema";
import { webhookPayloadSchema, WebhookPayload } from "./schemas/webhookPayload.schema";

import type { CurrentUser } from "src/common/types/current-user.type";

@Controller("mercadopago")
export class MercadoPagoController {
  private readonly logger = new Logger(MercadoPagoController.name);

  constructor(
    private readonly mercadopagoService: MercadoPagoService,
    private readonly webhookHandler: MercadoPagoWebhookHandler,
  ) {}

  @Post("customer")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    response: baseResponse(getOrCreateCustomerSchema),
  })
  async getOrCreateCustomer(@Req() request: { user: CurrentUser }) {
    const { userId, email } = request.user;
    const customerId = await this.mercadopagoService.getOrCreateCustomer(userId, email);
    return new BaseResponse({ customerId });
  }

  @Get("customer/cards")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    response: baseResponse(customerCardsResponseSchema),
  })
  async getCustomerCards(@Req() request: { user: CurrentUser }) {
    const cards = await this.mercadopagoService.getCustomerCards(request.user.userId);
    const mappedCards = cards.map((card) => ({
      id: card.id,
      firstSixDigits: card.first_six_digits,
      lastFourDigits: card.last_four_digits,
      expirationMonth: card.expiration_month,
      expirationYear: card.expiration_year,
      paymentMethod: card.payment_method
        ? {
            id: card.payment_method.id,
            name: card.payment_method.name,
            paymentTypeId: card.payment_method.payment_type_id,
            thumbnail: card.payment_method.thumbnail,
            secureThumbnail: card.payment_method.secure_thumbnail,
          }
        : undefined,
      issuer: card.issuer
        ? {
            id: card.issuer.id,
            name: card.issuer.name,
          }
        : undefined,
      cardholder: card.cardholder
        ? {
            name: card.cardholder.name,
          }
        : undefined,
    }));
    return new BaseResponse(mappedCards);
  }

  @Delete("customer/cards/:cardId")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    response: baseResponse(Type.Object({ success: Type.Boolean() })),
    request: [
      {
        type: "param",
        name: "cardId",
        schema: Type.String(),
        required: true,
      },
    ],
  })
  async deleteCustomerCard(@Param("cardId") cardId: string, @Req() request: { user: CurrentUser }) {
    await this.mercadopagoService.deleteCustomerCard(request.user.userId, cardId);
    return new BaseResponse({ success: true });
  }

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

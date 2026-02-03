import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { Type } from "@sinclair/typebox";
import { Validate } from "nestjs-typebox";

import { BaseResponse, baseResponse, UUIDSchema } from "src/common";
import { Roles } from "src/common/decorators/roles.decorator";
import { USER_ROLES } from "src/user/schemas/userRoles";

import { CheckoutService } from "./checkout.service";
import {
  freeCheckoutResponseSchema,
  freeCheckoutSchema,
  mercadopagoCheckoutResponseSchema,
  mercadopagoCheckoutSchema,
  stripeCheckoutResponseSchema,
  stripeCheckoutSchema,
} from "./schemas/checkout.schema";

import type { CurrentUser } from "src/common/types/current-user.type";
import type {
  FreeCheckoutBody,
  MercadopagoCheckoutBody,
  StripeCheckoutBody,
} from "./schemas/checkout.schema";

const requestPaymentLinkSchema = Type.Object({
  method: Type.Union([Type.Literal("stripe"), Type.Literal("mercadopago")]),
});

const requestPaymentLinkResponseSchema = Type.Object({
  orderId: Type.String(),
  status: Type.String(),
});

const orderStatusResponseSchema = Type.Object({
  orderId: Type.String(),
  status: Type.String(),
  provider: Type.String(),
  totalAmountInCents: Type.Number(),
  currency: Type.String(),
  createdAt: Type.String(),
});

@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("request-payment-link")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    request: [{ type: "body", schema: requestPaymentLinkSchema }],
    response: baseResponse(requestPaymentLinkResponseSchema),
  })
  async requestPaymentLink(
    @Body() body: { method: "stripe" | "mercadopago" },
    @Req() request: { user: CurrentUser },
  ) {
    const result = await this.checkoutService.requestPaymentLink(request.user.userId, body.method);
    return new BaseResponse(result);
  }

  @Get("orders/:id/status")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    response: baseResponse(orderStatusResponseSchema),
  })
  async getOrderStatus(@Param("id") orderId: string, @Req() request: { user: CurrentUser }) {
    const result = await this.checkoutService.getOrderStatus(orderId, request.user.userId);
    return new BaseResponse(result);
  }

  @Post("stripe")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    request: [{ type: "body", schema: stripeCheckoutSchema }],
    response: baseResponse(stripeCheckoutResponseSchema),
  })
  async stripeCheckout(@Body() body: StripeCheckoutBody, @Req() request: { user: CurrentUser }) {
    const result = await this.checkoutService.stripeCheckout(request.user.userId, body);
    return new BaseResponse(result);
  }

  @Post("mercadopago")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    request: [{ type: "body", schema: mercadopagoCheckoutSchema }],
    response: baseResponse(mercadopagoCheckoutResponseSchema),
  })
  async mercadopagoCheckout(
    @Body() body: MercadopagoCheckoutBody,
    @Req() request: { user: CurrentUser },
  ) {
    const result = await this.checkoutService.mercadopagoCheckout(
      request.user.userId,
      request.user.email ?? "",
      body,
    );
    return new BaseResponse(result);
  }

  @Post("free")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    request: [{ type: "body", schema: freeCheckoutSchema }],
    response: baseResponse(freeCheckoutResponseSchema),
  })
  async freeCheckout(@Body() body: FreeCheckoutBody, @Req() request: { user: CurrentUser }) {
    const result = await this.checkoutService.freeCheckout(request.user.userId, body);
    return new BaseResponse(result);
  }
}

import { Body, Controller, Delete, Get, Param, Post, Req } from "@nestjs/common";
import { Type } from "@sinclair/typebox";
import { Validate } from "nestjs-typebox";

import { BaseResponse, baseResponse, UUIDSchema } from "src/common";
import { Roles } from "src/common/decorators/roles.decorator";
import { USER_ROLES } from "src/user/schemas/userRoles";

import { CartService } from "./cart.service";
import { addToCartSchema, cartResponseSchema, mergeCartSchema } from "./schemas/cart.schema";

import type { CurrentUser } from "src/common/types/current-user.type";

@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    response: baseResponse(cartResponseSchema),
  })
  async getCart(@Req() request: { user: CurrentUser }) {
    const cart = await this.cartService.getCart(request.user.userId);
    return new BaseResponse(cart);
  }

  @Post("items")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    request: [{ type: "body", schema: addToCartSchema }],
    response: baseResponse(Type.Object({ success: Type.Boolean() })),
  })
  async addItem(@Body() body: { courseId: string }, @Req() request: { user: CurrentUser }) {
    await this.cartService.addItem(request.user.userId, body.courseId);
    return new BaseResponse({ success: true });
  }

  @Delete("items/:courseId")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    request: [{ type: "param", name: "courseId", schema: UUIDSchema, required: true }],
    response: baseResponse(Type.Object({ success: Type.Boolean() })),
  })
  async removeItem(@Param("courseId") courseId: string, @Req() request: { user: CurrentUser }) {
    await this.cartService.removeItem(request.user.userId, courseId);
    return new BaseResponse({ success: true });
  }

  @Delete()
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    response: baseResponse(Type.Object({ success: Type.Boolean() })),
  })
  async clearCart(@Req() request: { user: CurrentUser }) {
    await this.cartService.clearCart(request.user.userId);
    return new BaseResponse({ success: true });
  }

  @Post("merge")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    request: [{ type: "body", schema: mergeCartSchema }],
    response: baseResponse(cartResponseSchema),
  })
  async mergeGuestCart(
    @Body() body: { courseIds: string[] },
    @Req() request: { user: CurrentUser },
  ) {
    const cart = await this.cartService.mergeGuestCart(request.user.userId, body.courseIds);
    return new BaseResponse(cart);
  }
}

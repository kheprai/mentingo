import { Controller, Get, Param, Req } from "@nestjs/common";
import { Validate } from "nestjs-typebox";

import { BaseResponse, baseResponse, UUIDSchema } from "src/common";
import { Roles } from "src/common/decorators/roles.decorator";
import { USER_ROLES } from "src/user/schemas/userRoles";

import { OrderService } from "./order.service";
import { orderDetailSchema, orderListSchema } from "./schemas/order.schema";

import type { CurrentUser } from "src/common/types/current-user.type";

@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    response: baseResponse(orderListSchema),
  })
  async listOrders(@Req() request: { user: CurrentUser }) {
    const result = await this.orderService.listOrders(request.user.userId);
    return new BaseResponse(result);
  }

  @Get(":id")
  @Roles(USER_ROLES.STUDENT)
  @Validate({
    request: [{ type: "param", name: "id", schema: UUIDSchema, required: true }],
    response: baseResponse(orderDetailSchema),
  })
  async getOrder(@Param("id") id: string, @Req() request: { user: CurrentUser }) {
    const order = await this.orderService.getOrder(id, request.user.userId);
    return new BaseResponse(order);
  }
}

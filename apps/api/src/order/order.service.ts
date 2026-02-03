import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";

import { DatabasePg } from "src/common";
import { FileService } from "src/file/file.service";
import { courses, orderItems, orders } from "src/storage/schema";

import type { OrderDto } from "./schemas/order.schema";

@Injectable()
export class OrderService {
  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    private readonly fileService: FileService,
  ) {}

  async listOrders(userId: string): Promise<{ orders: OrderDto[] }> {
    const orderRows = await this.db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const result: OrderDto[] = [];

    for (const order of orderRows) {
      const items = await this.getOrderItems(order.id);
      result.push({
        id: order.id,
        status: order.status,
        provider: order.provider,
        totalAmountInCents: order.totalAmountInCents,
        currency: order.currency,
        createdAt: order.createdAt,
        items,
      });
    }

    return { orders: result };
  }

  async getOrder(orderId: string, userId: string): Promise<OrderDto> {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const items = await this.getOrderItems(orderId);

    return {
      id: order.id,
      status: order.status,
      provider: order.provider,
      totalAmountInCents: order.totalAmountInCents,
      currency: order.currency,
      createdAt: order.createdAt,
      items,
    };
  }

  private async getOrderItems(orderId: string) {
    const rows = await this.db
      .select({
        id: orderItems.id,
        courseId: orderItems.courseId,
        courseTitle: courses.title,
        courseThumbnailS3Key: courses.thumbnailS3Key,
        priceInCents: orderItems.priceInCents,
        currency: orderItems.currency,
      })
      .from(orderItems)
      .innerJoin(courses, eq(orderItems.courseId, courses.id))
      .where(eq(orderItems.orderId, orderId));

    return Promise.all(
      rows.map(async (row) => {
        let thumbnailUrl: string | null = null;
        if (row.courseThumbnailS3Key) {
          try {
            thumbnailUrl = await this.fileService.getFileUrl(row.courseThumbnailS3Key);
          } catch {
            thumbnailUrl = null;
          }
        }

        const title =
          typeof row.courseTitle === "object"
            ? ((row.courseTitle as Record<string, string>)["en"] ?? "")
            : String(row.courseTitle ?? "");

        return {
          id: row.id,
          courseId: row.courseId,
          courseTitle: title,
          courseThumbnailUrl: thumbnailUrl,
          priceInCents: row.priceInCents,
          currency: row.currency,
        };
      }),
    );
  }
}

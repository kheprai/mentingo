import { ConflictException, Inject, Injectable, Logger } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";

import { DatabasePg } from "src/common";
import { CourseService } from "src/courses/course.service";
import { courses, orderItems, orders, users } from "src/storage/schema";

import { MercadoPagoService } from "./mercadopago.service";

import type { WebhookPayload } from "./schemas/webhookPayload.schema";

@Injectable()
export class MercadoPagoWebhookHandler {
  private readonly logger = new Logger(MercadoPagoWebhookHandler.name);

  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    private readonly mercadopagoService: MercadoPagoService,
    private readonly courseService: CourseService,
  ) {}

  async handleWebhook(payload: WebhookPayload): Promise<boolean> {
    this.logger.log(`Received webhook: type=${payload.type}, data.id=${payload.data.id}`);

    if (payload.type === "payment") {
      return this.handlePaymentNotification(String(payload.data.id));
    }

    this.logger.log(`Unhandled webhook type: ${payload.type}`);
    return false;
  }

  private async handlePaymentNotification(paymentId: string): Promise<boolean> {
    try {
      const paymentInfo = await this.mercadopagoService.getPayment(paymentId);

      this.logger.log(
        `Payment ${paymentId} status: ${paymentInfo.status} - ${paymentInfo.statusDetail}`,
      );

      await this.mercadopagoService.updatePaymentStatus(
        paymentId,
        paymentInfo.status,
        paymentInfo.statusDetail,
      );

      const paymentRecord = await this.mercadopagoService.getPaymentByProviderId(paymentId);

      if (!paymentRecord) {
        this.logger.warn(`Payment record not found for provider ID: ${paymentId}`);
        return false;
      }

      if (paymentInfo.status === "approved") {
        if (paymentRecord.orderId) {
          return this.handleCartCheckoutApproval(paymentRecord.orderId, paymentRecord.userId);
        }

        if (paymentRecord.courseId) {
          return this.enrollUserInCourse(
            paymentRecord.userId,
            paymentRecord.courseId,
            paymentId,
          );
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error handling payment notification ${paymentId}:`, error);
      return false;
    }
  }

  private async handleCartCheckoutApproval(
    orderId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      await this.db
        .update(orders)
        .set({ status: "completed" })
        .where(eq(orders.id, orderId));

      await this.enrollOrderCourses(orderId, userId);

      this.logger.log(`Cart checkout completed for order ${orderId}, user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error completing cart checkout for order ${orderId}:`, error);
      return false;
    }
  }

  private async enrollUserInCourse(
    userId: string,
    courseId: string,
    paymentId: string,
  ): Promise<boolean> {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)));

      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        return false;
      }

      const [course] = await this.db.select().from(courses).where(eq(courses.id, courseId));

      if (!course) {
        this.logger.warn(`Course not found: ${courseId}`);
        return false;
      }

      await this.courseService.enrollCourse(courseId, userId, undefined, paymentId);

      this.logger.log(
        `User ${userId} enrolled in course ${courseId} via MercadoPago payment ${paymentId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(`Error enrolling user ${userId} in course ${courseId}:`, error);
      return false;
    }
  }

  private async enrollOrderCourses(orderId: string, userId: string): Promise<void> {
    const items = await this.db
      .select({ courseId: orderItems.courseId })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      try {
        await this.courseService.enrollCourse(item.courseId, userId);
      } catch (error) {
        if (error instanceof ConflictException) {
          this.logger.log(`User ${userId} already enrolled in course ${item.courseId}, skipping`);
          continue;
        }
        this.logger.error(
          `Failed to enroll user ${userId} in course ${item.courseId}: ${error}`,
        );
      }
    }

    this.logger.log(`Enrolled user ${userId} in ${items.length} courses for order ${orderId}`);
  }
}

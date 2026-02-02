import { Inject, Injectable, Logger } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";

import { DatabasePg } from "src/common";
import { CourseService } from "src/courses/course.service";
import { courses, users } from "src/storage/schema";

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

      // Update payment status in our database
      await this.mercadopagoService.updatePaymentStatus(
        paymentId,
        paymentInfo.status,
        paymentInfo.statusDetail,
      );

      // Get the payment record to access metadata
      const paymentRecord = await this.mercadopagoService.getPaymentByProviderId(paymentId);

      if (!paymentRecord) {
        this.logger.warn(`Payment record not found for provider ID: ${paymentId}`);
        return false;
      }

      if (paymentInfo.status === "approved") {
        return this.enrollUserInCourse(paymentRecord.userId, paymentRecord.courseId, paymentId);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error handling payment notification ${paymentId}:`, error);
      return false;
    }
  }

  private async enrollUserInCourse(
    userId: string,
    courseId: string,
    paymentId: string,
  ): Promise<boolean> {
    try {
      // Verify user exists
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)));

      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        return false;
      }

      // Verify course exists
      const [course] = await this.db.select().from(courses).where(eq(courses.id, courseId));

      if (!course) {
        this.logger.warn(`Course not found: ${courseId}`);
        return false;
      }

      // Enroll the user
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
}

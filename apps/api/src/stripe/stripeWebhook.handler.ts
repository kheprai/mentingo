import { StripeWebhookHandler as StripeWebhookHandlerDecorator } from "@golevelup/nestjs-stripe";
import { ConflictException, Inject, Injectable, Logger } from "@nestjs/common";
import { and, eq, isNull } from "drizzle-orm";
import Stripe from "stripe";

import { DatabasePg } from "src/common";
import { CourseService } from "src/courses/course.service";
import { courses, orderItems, orders, payments, users } from "src/storage/schema";

@Injectable()
export class StripeWebhookHandler {
  private readonly logger = new Logger(StripeWebhookHandler.name);

  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    readonly courseService: CourseService,
  ) {}

  @StripeWebhookHandlerDecorator("payment_intent.succeeded")
  async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadataType = paymentIntent.metadata.type;

    if (metadataType === "cart_checkout") {
      return this.handleCartCheckout(paymentIntent);
    }

    return this.handleLegacySingleCourse(paymentIntent);
  }

  private async handleCartCheckout(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId;
    const userId = paymentIntent.metadata.customerId;

    if (!orderId || !userId) {
      this.logger.warn("Cart checkout webhook missing orderId or customerId");
      return null;
    }

    try {
      await this.db.insert(payments).values({
        userId,
        orderId,
        provider: "stripe",
        providerPaymentId: paymentIntent.id,
        amountInCents: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: "approved",
        paymentMethod: paymentIntent.payment_method_types?.[0] ?? "card",
      });

      await this.db
        .update(orders)
        .set({ status: "completed", providerPaymentId: paymentIntent.id })
        .where(eq(orders.id, orderId));

      await this.enrollOrderCourses(orderId, userId);

      this.logger.log(`Cart checkout completed for order ${orderId}, user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error processing cart checkout for order ${orderId}:`, error);
      return null;
    }
  }

  private async handleLegacySingleCourse(paymentIntent: Stripe.PaymentIntent) {
    const userId = paymentIntent.metadata.customerId;
    const courseId = paymentIntent.metadata.courseId;

    if (!userId && !courseId) return null;

    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)));

    if (!user) return null;

    const [course] = await this.db.select().from(courses).where(eq(courses.id, courseId));

    if (!course) return null;

    try {
      await this.courseService.enrollCourse(courseId, userId, undefined, paymentIntent.id);

      return true;
    } catch (error) {
      console.log(error);
      return null;
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

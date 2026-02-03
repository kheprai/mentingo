import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";

import { CartService } from "src/cart/cart.service";
import { DatabasePg } from "src/common";
import { CourseService } from "src/courses/course.service";
import { MercadoPagoService } from "src/mercadopago/mercadopago.service";
import { orderItems, orders, payments, studentCourses, users } from "src/storage/schema";
import { StripeService } from "src/stripe/stripe.service";
import { WhatsAppService } from "src/whatsapp/whatsapp.service";
import { isSupportedLocale } from "src/utils/isSupportedLocale";

import type {
  FreeCheckoutBody,
  MercadopagoCheckoutBody,
  StripeCheckoutBody,
} from "./schemas/checkout.schema";
import type { SupportedLocales } from "src/common/types";

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    private readonly cartService: CartService,
    private readonly stripeService: StripeService,
    private readonly mercadopagoService: MercadoPagoService,
    private readonly courseService: CourseService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  async requestPaymentLink(userId: string, method: "stripe" | "mercadopago") {
    const cartCourses = await this.cartService.getCartItemsForCheckout(userId);

    if (!cartCourses.length) {
      throw new BadRequestException("Cart is empty");
    }

    await this.validateNotEnrolled(
      userId,
      cartCourses.map((c) => c.courseId),
    );

    // Get user phone
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
    if (!user?.phone) {
      throw new BadRequestException("User must have a phone number to receive payment links");
    }

    let paymentUrl: string;
    let totalAmountInCents: number;
    let currency: string;
    let orderItems: Array<{ courseId: string; priceInCents: number; currency: string }>;

    if (method === "mercadopago") {
      const mpCourses = cartCourses.filter(
        (c) => c.mercadopagoProductId && c.mercadopagoPriceInCents > 0,
      );
      if (!mpCourses.length) {
        throw new BadRequestException("No courses in cart support MercadoPago payment");
      }

      totalAmountInCents = mpCourses.reduce((sum, c) => sum + c.mercadopagoPriceInCents, 0);
      currency = "ARS";
      orderItems = mpCourses.map((c) => ({
        courseId: c.courseId,
        priceInCents: c.mercadopagoPriceInCents,
        currency: "ARS",
      }));

      const order = await this.createOrder({
        userId,
        provider: "mercadopago",
        totalAmountInCents,
        currency,
        items: orderItems,
      });

      const items = mpCourses.map((c) => {
        const t = c.title;
        const title =
          typeof t === "object"
            ? ((t as Record<string, string>)["es"] ??
              (t as Record<string, string>)["en"] ??
              "Curso")
            : String(t ?? "Curso");
        return { title, quantity: 1, unitPrice: c.mercadopagoPriceInCents / 100 };
      });

      const { initPoint } = await this.mercadopagoService.createPaymentPreference({
        items,
        userId,
        orderId: order.id,
      });

      paymentUrl = initPoint;

      await this.db
        .update(orders)
        .set({ paymentUrl, status: "awaiting_payment" })
        .where(eq(orders.id, order.id));

      // Auto-enroll free courses
      await this.autoEnrollFreeCourses(userId, cartCourses);
      await this.cartService.clearCart(userId);

      // Send WhatsApp
      const orderDetails = items.map((i) => i.title).join(", ");
      const total = `$${(totalAmountInCents / 100).toLocaleString("es-AR")} ARS`;

      await this.whatsAppService.sendPaymentLink(user.phone, {
        orderDetails,
        total,
        paymentUrl,
      });

      return { orderId: order.id, status: "awaiting_payment" };
    } else {
      // Stripe
      const stripeCourses = cartCourses.filter((c) => c.stripePriceId);
      if (!stripeCourses.length) {
        throw new BadRequestException("No courses in cart support Stripe payment");
      }

      totalAmountInCents = stripeCourses.reduce((sum, c) => sum + c.priceInCents, 0);
      currency = "usd";
      orderItems = stripeCourses.map((c) => ({
        courseId: c.courseId,
        priceInCents: c.priceInCents,
        currency: "usd",
      }));

      const order = await this.createOrder({
        userId,
        provider: "stripe",
        totalAmountInCents,
        currency,
        items: orderItems,
      });

      const lineItems = stripeCourses.map((c) => ({
        price: c.stripePriceId!,
        quantity: 1,
      }));

      const { url } = await this.stripeService.createPaymentLink({
        lineItems,
        orderId: order.id,
        userId,
      });

      paymentUrl = url;

      await this.db
        .update(orders)
        .set({ paymentUrl, status: "awaiting_payment" })
        .where(eq(orders.id, order.id));

      await this.autoEnrollFreeCourses(userId, cartCourses);
      await this.cartService.clearCart(userId);

      // Send WhatsApp
      const titles = stripeCourses.map((c) => {
        const t = c.title;
        return typeof t === "object"
          ? ((t as Record<string, string>)["en"] ?? "Course")
          : String(t ?? "Course");
      });

      const orderDetails = titles.join(", ");
      const total = `$${(totalAmountInCents / 100).toFixed(2)} USD`;

      await this.whatsAppService.sendPaymentLink(user.phone, {
        orderDetails,
        total,
        paymentUrl,
      });

      return { orderId: order.id, status: "awaiting_payment" };
    }
  }

  async getOrderStatus(orderId: string, userId: string) {
    const [order] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return {
      orderId: order.id,
      status: order.status,
      provider: order.provider,
      totalAmountInCents: order.totalAmountInCents,
      currency: order.currency,
      createdAt: order.createdAt,
    };
  }

  async stripeCheckout(userId: string, body: StripeCheckoutBody) {
    const cartCourses = await this.cartService.getCartItemsForCheckout(userId);

    if (!cartCourses.length) {
      throw new BadRequestException("Cart is empty");
    }

    await this.validateNotEnrolled(
      userId,
      cartCourses.map((c) => c.courseId),
    );

    const stripeCourses = cartCourses.filter((c) => c.stripePriceId);
    if (!stripeCourses.length) {
      throw new BadRequestException("No courses in cart support Stripe payment");
    }

    const totalAmountInCents = stripeCourses.reduce((sum, c) => sum + c.priceInCents, 0);

    const order = await this.createOrder({
      userId,
      provider: "stripe",
      totalAmountInCents,
      currency: "usd",
      items: stripeCourses.map((c) => ({
        courseId: c.courseId,
        priceInCents: c.priceInCents,
        currency: "usd",
      })),
    });

    const client = await this.stripeService.getClient();
    const finalLocale: SupportedLocales = isSupportedLocale(body.locale)
      ? (body.locale as SupportedLocales)
      : "en";

    const lineItems = stripeCourses.map((c) => ({
      price: c.stripePriceId!,
      quantity: 1,
    }));

    const session = await client.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      ui_mode: "embedded",
      redirect_on_completion: "never",
      locale: finalLocale,
      payment_intent_data: {
        metadata: {
          orderId: order.id,
          customerId: userId,
          type: "cart_checkout",
        },
      },
    });

    await this.autoEnrollFreeCourses(userId, cartCourses);
    await this.cartService.clearCart(userId);

    return { clientSecret: session.client_secret!, orderId: order.id };
  }

  async mercadopagoCheckout(userId: string, email: string, body: MercadopagoCheckoutBody) {
    const cartCourses = await this.cartService.getCartItemsForCheckout(userId);

    if (!cartCourses.length) {
      throw new BadRequestException("Cart is empty");
    }

    await this.validateNotEnrolled(
      userId,
      cartCourses.map((c) => c.courseId),
    );

    const mpCourses = cartCourses.filter(
      (c) => c.mercadopagoProductId && c.mercadopagoPriceInCents > 0,
    );
    if (!mpCourses.length) {
      throw new BadRequestException("No courses in cart support MercadoPago payment");
    }

    const totalAmountInCents = mpCourses.reduce((sum, c) => sum + c.mercadopagoPriceInCents, 0);
    const totalAmount = totalAmountInCents / 100;

    const order = await this.createOrder({
      userId,
      provider: "mercadopago",
      totalAmountInCents,
      currency: "ARS",
      items: mpCourses.map((c) => ({
        courseId: c.courseId,
        priceInCents: c.mercadopagoPriceInCents,
        currency: "ARS",
      })),
    });

    const titles = mpCourses.map((c) => {
      const t = c.title;
      return typeof t === "object"
        ? ((t as Record<string, string>)["en"] ?? "Course")
        : String(t ?? "Course");
    });
    const description = `Order: ${titles.join(", ")}`;

    const paymentResult = await this.mercadopagoService.processPaymentForOrder({
      token: body.token,
      amount: totalAmount,
      description,
      installments: body.installments ?? 1,
      paymentMethodId: body.paymentMethodId,
      email: body.email,
      userId,
      orderId: order.id,
      identification: body.identification,
    });

    await this.autoEnrollFreeCourses(userId, cartCourses);
    await this.cartService.clearCart(userId);

    if (paymentResult.status === "approved") {
      await this.db
        .update(orders)
        .set({ status: "completed", providerPaymentId: String(paymentResult.id) })
        .where(eq(orders.id, order.id));

      await this.enrollOrderCourses(order.id, userId);
    } else {
      await this.db
        .update(orders)
        .set({ status: "processing", providerPaymentId: String(paymentResult.id) })
        .where(eq(orders.id, order.id));
    }

    return {
      orderId: order.id,
      paymentId: paymentResult.id,
      status: paymentResult.status,
      statusDetail: paymentResult.statusDetail,
    };
  }

  async freeCheckout(userId: string, body: FreeCheckoutBody) {
    const cartCourses = await this.cartService.getCartItemsForCheckout(userId);

    if (!cartCourses.length) {
      throw new BadRequestException("Cart is empty");
    }

    const freeCourses = body.courseIds?.length
      ? cartCourses.filter(
          (c) =>
            body.courseIds!.includes(c.courseId) &&
            c.priceInCents === 0 &&
            !c.stripePriceId &&
            !c.mercadopagoProductId,
        )
      : cartCourses.filter(
          (c) => c.priceInCents === 0 && !c.stripePriceId && !c.mercadopagoProductId,
        );

    if (!freeCourses.length) {
      throw new BadRequestException("No free courses found in cart");
    }

    const freeCourseIds = freeCourses.map((c) => c.courseId);
    await this.validateNotEnrolled(userId, freeCourseIds);

    const order = await this.createOrder({
      userId,
      provider: "free",
      totalAmountInCents: 0,
      currency: "USD",
      items: freeCourses.map((c) => ({
        courseId: c.courseId,
        priceInCents: 0,
        currency: "USD",
      })),
    });

    await this.db.update(orders).set({ status: "completed" }).where(eq(orders.id, order.id));

    await this.enrollOrderCourses(order.id, userId);
    await this.cartService.removeItems(userId, freeCourseIds);

    return { orderId: order.id, enrolledCourseIds: freeCourseIds };
  }

  private async autoEnrollFreeCourses(
    userId: string,
    cartCourses: Array<{
      courseId: string;
      priceInCents: number;
      stripePriceId: string | null;
      mercadopagoProductId: string | null;
    }>,
  ) {
    const freeCourses = cartCourses.filter(
      (c) => c.priceInCents === 0 && !c.stripePriceId && !c.mercadopagoProductId,
    );

    if (!freeCourses.length) return;

    for (const course of freeCourses) {
      try {
        await this.courseService.enrollCourse(course.courseId, userId);
        this.logger.log(`Auto-enrolled user ${userId} in free course ${course.courseId}`);
      } catch (error) {
        if (error instanceof ConflictException) continue;
        this.logger.error(`Failed to auto-enroll free course ${course.courseId}: ${error}`);
      }
    }

    await this.cartService.removeItems(
      userId,
      freeCourses.map((c) => c.courseId),
    );
  }

  async enrollOrderCourses(orderId: string, userId: string): Promise<void> {
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
        this.logger.error(`Failed to enroll user ${userId} in course ${item.courseId}: ${error}`);
      }
    }

    this.logger.log(`Enrolled user ${userId} in ${items.length} courses for order ${orderId}`);
  }

  private async validateNotEnrolled(userId: string, courseIds: string[]): Promise<void> {
    const enrolled = await this.db
      .select({ courseId: studentCourses.courseId })
      .from(studentCourses)
      .where(
        and(eq(studentCourses.studentId, userId), inArray(studentCourses.courseId, courseIds)),
      );

    if (enrolled.length) {
      const enrolledIds = enrolled.map((e) => e.courseId).join(", ");
      throw new ConflictException(`Already enrolled in courses: ${enrolledIds}`);
    }
  }

  private async createOrder(data: {
    userId: string;
    provider: string;
    totalAmountInCents: number;
    currency: string;
    items: Array<{ courseId: string; priceInCents: number; currency: string }>;
  }) {
    const [order] = await this.db
      .insert(orders)
      .values({
        userId: data.userId,
        status: "pending",
        provider: data.provider,
        totalAmountInCents: data.totalAmountInCents,
        currency: data.currency,
      })
      .returning();

    await this.db.insert(orderItems).values(
      data.items.map((item) => ({
        orderId: order.id,
        courseId: item.courseId,
        priceInCents: item.priceInCents,
        currency: item.currency,
      })),
    );

    return order;
  }
}

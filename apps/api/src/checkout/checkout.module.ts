import { forwardRef, Module } from "@nestjs/common";

import { CartModule } from "src/cart/cart.module";
import { CourseModule } from "src/courses/course.module";
import { MercadoPagoModule } from "src/mercadopago/mercadopago.module";
import { StripeModule } from "src/stripe/stripe.module";

import { CheckoutController } from "./checkout.controller";
import { CheckoutService } from "./checkout.service";

@Module({
  imports: [
    CartModule,
    forwardRef(() => CourseModule),
    forwardRef(() => StripeModule),
    forwardRef(() => MercadoPagoModule),
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}

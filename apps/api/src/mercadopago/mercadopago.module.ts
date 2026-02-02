import { forwardRef, Module } from "@nestjs/common";

import { CourseModule } from "src/courses/course.module";
import { EnvModule } from "src/env/env.module";

import { MercadoPagoController } from "./mercadopago.controller";
import { MercadoPagoService } from "./mercadopago.service";
import { MercadoPagoWebhookHandler } from "./mercadopagoWebhook.handler";

@Module({
  imports: [forwardRef(() => CourseModule), EnvModule],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService, MercadoPagoWebhookHandler],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}

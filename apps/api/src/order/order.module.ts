import { Module } from "@nestjs/common";

import { FileModule } from "src/file/files.module";

import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";

@Module({
  imports: [FileModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

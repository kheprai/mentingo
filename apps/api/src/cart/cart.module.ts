import { Module } from "@nestjs/common";

import { FileModule } from "src/file/files.module";

import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

@Module({
  imports: [FileModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

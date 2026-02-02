import { Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { MercadoPagoConfig, Payment } from "mercadopago";

import { DatabasePg } from "src/common";
import { EnvService } from "src/env/services/env.service";
import { payments } from "src/storage/schema";

import type { ProcessPaymentBody, GetPaymentStatusResponse } from "./schemas/processPayment.schema";

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    private readonly envService: EnvService,
  ) {}

  private async getAccessToken(): Promise<string | null> {
    try {
      const result = await this.envService.getEnv("MERCADOPAGO_ACCESS_TOKEN");
      return result.value;
    } catch {
      return process.env.MERCADOPAGO_ACCESS_TOKEN ?? null;
    }
  }

  private async getClient(): Promise<MercadoPagoConfig> {
    const accessToken = await this.getAccessToken();

    if (!accessToken) {
      throw new InternalServerErrorException("MercadoPago is not configured");
    }

    return new MercadoPagoConfig({ accessToken });
  }

  async processPayment(data: ProcessPaymentBody) {
    const client = await this.getClient();
    const paymentClient = new Payment(client);

    try {
      const paymentResponse = await paymentClient.create({
        body: {
          transaction_amount: data.amount,
          token: data.token,
          description: data.description,
          installments: data.installments ?? 1,
          payment_method_id: data.paymentMethodId,
          payer: {
            email: data.email,
            identification: data.identification
              ? {
                  type: data.identification.type,
                  number: data.identification.number,
                }
              : undefined,
          },
          metadata: {
            course_id: data.courseId,
            user_id: data.userId,
          },
        },
      });

      // Store payment record in our database
      await this.db.insert(payments).values({
        userId: data.userId,
        courseId: data.courseId,
        provider: "mercadopago",
        providerPaymentId: String(paymentResponse.id),
        amountInCents: Math.round(data.amount * 100),
        currency: paymentResponse.currency_id ?? "ARS",
        status: paymentResponse.status ?? "pending",
        statusDetail: paymentResponse.status_detail ?? undefined,
        paymentMethod: paymentResponse.payment_method_id ?? undefined,
        installments: paymentResponse.installments ?? 1,
      });

      this.logger.log(`Payment created: ${paymentResponse.id} - Status: ${paymentResponse.status}`);

      return {
        id: paymentResponse.id!,
        status: paymentResponse.status!,
        statusDetail: paymentResponse.status_detail ?? undefined,
        externalReference: paymentResponse.external_reference ?? undefined,
      };
    } catch (error) {
      this.logger.error("Error processing MercadoPago payment:", error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Error processing payment",
      );
    }
  }

  async getPayment(paymentId: string | number): Promise<GetPaymentStatusResponse> {
    const client = await this.getClient();
    const paymentClient = new Payment(client);

    try {
      const paymentInfo = await paymentClient.get({ id: Number(paymentId) });

      return {
        id: paymentInfo.id!,
        status: paymentInfo.status!,
        statusDetail: paymentInfo.status_detail ?? undefined,
        dateApproved: paymentInfo.date_approved ?? undefined,
        dateCreated: paymentInfo.date_created!,
        paymentMethodId: paymentInfo.payment_method_id!,
        installments: paymentInfo.installments ?? 1,
        transactionAmount: paymentInfo.transaction_amount!,
        currency: paymentInfo.currency_id ?? "ARS",
      };
    } catch (error) {
      this.logger.error(`Error fetching payment ${paymentId}:`, error);
      throw new InternalServerErrorException("Error fetching payment information");
    }
  }

  async updatePaymentStatus(
    providerPaymentId: string,
    status: string,
    statusDetail?: string,
  ): Promise<void> {
    await this.db
      .update(payments)
      .set({
        status,
        statusDetail,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(payments.providerPaymentId, providerPaymentId));
  }

  async getPaymentByProviderId(providerPaymentId: string) {
    const [payment] = await this.db
      .select()
      .from(payments)
      .where(eq(payments.providerPaymentId, providerPaymentId));

    return payment ?? null;
  }
}

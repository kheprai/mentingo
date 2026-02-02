import { Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { Customer, MercadoPagoConfig, Payment } from "mercadopago";

import { DatabasePg } from "src/common";
import { EnvService } from "src/env/services/env.service";
import { payments, users } from "src/storage/schema";

import type { ProcessPaymentBody, GetPaymentStatusResponse } from "./schemas/processPayment.schema";
import type { CustomerCardResponse } from "mercadopago/dist/clients/customerCard/commonTypes";

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

  async getOrCreateCustomer(userId: string, email: string): Promise<string> {
    // Check if user already has a stored customer ID
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));

    if (user?.mercadopagoCustomerId) {
      return user.mercadopagoCustomerId;
    }

    const client = await this.getClient();
    const customerClient = new Customer(client);

    try {
      // Search for existing customer by email
      const searchResult = await customerClient.search({ options: { email } });

      if (searchResult.results && searchResult.results.length > 0) {
        const existingCustomerId = searchResult.results[0].id!;

        // Store the customer ID in our DB
        await this.db
          .update(users)
          .set({ mercadopagoCustomerId: existingCustomerId })
          .where(eq(users.id, userId));

        return existingCustomerId;
      }

      // Create new customer using name from our DB
      const newCustomer = await customerClient.create({
        body: {
          email,
          first_name: user?.firstName ?? "",
          last_name: user?.lastName ?? "",
        },
      });

      const newCustomerId = newCustomer.id!;

      // Store the customer ID in our DB
      await this.db
        .update(users)
        .set({ mercadopagoCustomerId: newCustomerId })
        .where(eq(users.id, userId));

      this.logger.log(`Created MercadoPago customer ${newCustomerId} for user ${userId}`);

      return newCustomerId;
    } catch (error) {
      this.logger.error("Error creating MercadoPago customer:", error);
      throw new InternalServerErrorException("Error creating payment customer");
    }
  }

  async getCustomerCards(userId: string): Promise<CustomerCardResponse[]> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));

    if (!user?.mercadopagoCustomerId) {
      return [];
    }

    const client = await this.getClient();
    const customerClient = new Customer(client);

    try {
      const cards = await customerClient.listCards({
        customerId: user.mercadopagoCustomerId,
      });

      return cards;
    } catch (error) {
      this.logger.error("Error fetching customer cards:", error);
      return [];
    }
  }

  async deleteCustomerCard(userId: string, cardId: string): Promise<void> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));

    if (!user?.mercadopagoCustomerId) {
      throw new InternalServerErrorException("Customer not found");
    }

    const client = await this.getClient();
    const customerClient = new Customer(client);

    try {
      await customerClient.removeCard({
        customerId: user.mercadopagoCustomerId,
        cardId,
      });

      this.logger.log(`Deleted card ${cardId} for customer ${user.mercadopagoCustomerId}`);
    } catch (error) {
      this.logger.error("Error deleting customer card:", error);
      throw new InternalServerErrorException("Error deleting card");
    }
  }

  async processPayment(data: ProcessPaymentBody) {
    const client = await this.getClient();
    const paymentClient = new Payment(client);

    // Look up customer ID if userId is provided
    let payerCustomerId: string | undefined;
    if (data.userId) {
      const [user] = await this.db.select().from(users).where(eq(users.id, data.userId));
      payerCustomerId = user?.mercadopagoCustomerId ?? undefined;
    }

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
            ...(payerCustomerId ? { id: payerCustomerId } : {}),
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

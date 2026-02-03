import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";

import { DatabasePg } from "src/common";
import { FileService } from "src/file/file.service";
import {
  cartItems,
  categories,
  courses,
  courseSlugs,
  studentCourses,
  users,
} from "src/storage/schema";

import type { CartItemDto } from "./schemas/cart.schema";

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    private readonly fileService: FileService,
  ) {}

  async getCart(userId: string): Promise<{ items: CartItemDto[]; itemCount: number }> {
    const rows = await this.db
      .select({
        id: cartItems.id,
        courseId: cartItems.courseId,
        title: courses.title,
        description: courses.description,
        thumbnailUrl: courses.thumbnailS3Key,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        categoryTitle: categories.title,
        priceInCents: courses.priceInCents,
        mercadopagoPriceInCents: courses.mercadopagoPriceInCents,
        currency: courses.currency,
        stripePriceId: courses.stripePriceId,
        mercadopagoProductId: courses.mercadopagoProductId,
        shortId: courses.shortId,
        addedAt: cartItems.createdAt,
      })
      .from(cartItems)
      .innerJoin(courses, eq(cartItems.courseId, courses.id))
      .innerJoin(users, eq(courses.authorId, users.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(cartItems.createdAt);

    const items: CartItemDto[] = await Promise.all(
      rows.map(async (row) => {
        let thumbnailUrl: string | null = null;
        if (row.thumbnailUrl) {
          try {
            thumbnailUrl = await this.fileService.getFileUrl(row.thumbnailUrl);
          } catch {
            thumbnailUrl = null;
          }
        }

        let slug: string | null = null;
        if (row.shortId) {
          const [slugRow] = await this.db
            .select({ slug: courseSlugs.slug })
            .from(courseSlugs)
            .where(eq(courseSlugs.courseShortId, row.shortId))
            .limit(1);
          slug = slugRow?.slug ?? null;
        }

        const title =
          typeof row.title === "object"
            ? ((row.title as Record<string, string>)["en"] ?? "")
            : String(row.title ?? "");
        const description =
          typeof row.description === "object"
            ? ((row.description as Record<string, string>)["en"] ?? "")
            : String(row.description ?? "");
        const categoryName = row.categoryTitle
          ? typeof row.categoryTitle === "object"
            ? ((row.categoryTitle as Record<string, string>)["en"] ?? null)
            : String(row.categoryTitle)
          : null;

        return {
          id: row.id,
          courseId: row.courseId,
          title,
          description,
          thumbnailUrl,
          authorName: `${row.authorFirstName ?? ""} ${row.authorLastName ?? ""}`.trim(),
          categoryName,
          priceInCents: row.priceInCents,
          mercadopagoPriceInCents: row.mercadopagoPriceInCents,
          currency: row.currency,
          stripePriceId: row.stripePriceId,
          mercadopagoProductId: row.mercadopagoProductId,
          slug,
          addedAt: row.addedAt,
        };
      }),
    );

    return { items, itemCount: items.length };
  }

  async addItem(userId: string, courseId: string): Promise<void> {
    const [course] = await this.db
      .select({
        id: courses.id,
        status: courses.status,
        priceInCents: courses.priceInCents,
      })
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    if (course.status !== "published") {
      throw new BadRequestException("Course is not available");
    }

    const [enrollment] = await this.db
      .select({ id: studentCourses.id })
      .from(studentCourses)
      .where(and(eq(studentCourses.studentId, userId), eq(studentCourses.courseId, courseId)));

    if (enrollment) {
      throw new ConflictException("Already enrolled in this course");
    }

    try {
      await this.db.insert(cartItems).values({ userId, courseId }).onConflictDoNothing();
    } catch (error) {
      this.logger.error(`Error adding item to cart: ${error}`);
      throw error;
    }
  }

  async removeItem(userId: string, courseId: string): Promise<void> {
    await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.courseId, courseId)));
  }

  async clearCart(userId: string): Promise<void> {
    await this.db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  async removeItems(userId: string, courseIds: string[]): Promise<void> {
    if (!courseIds.length) return;
    await this.db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), inArray(cartItems.courseId, courseIds)));
  }

  async mergeGuestCart(
    userId: string,
    courseIds: string[],
  ): Promise<{ items: CartItemDto[]; itemCount: number }> {
    if (!courseIds.length) {
      return this.getCart(userId);
    }

    const validCourses = await this.db
      .select({ id: courses.id })
      .from(courses)
      .where(and(eq(courses.status, "published"), inArray(courses.id, courseIds)));

    const validCourseIds = validCourses.map((c) => c.id);

    if (!validCourseIds.length) {
      return this.getCart(userId);
    }

    const enrolledRows = await this.db
      .select({ courseId: studentCourses.courseId })
      .from(studentCourses)
      .where(
        and(eq(studentCourses.studentId, userId), inArray(studentCourses.courseId, validCourseIds)),
      );

    const enrolledIds = new Set(enrolledRows.map((r) => r.courseId));
    const toInsert = validCourseIds.filter((id) => !enrolledIds.has(id));

    if (toInsert.length) {
      await this.db
        .insert(cartItems)
        .values(toInsert.map((courseId) => ({ userId, courseId })))
        .onConflictDoNothing();
    }

    return this.getCart(userId);
  }

  async getCartItemsForCheckout(userId: string) {
    return this.db
      .select({
        courseId: cartItems.courseId,
        priceInCents: courses.priceInCents,
        mercadopagoPriceInCents: courses.mercadopagoPriceInCents,
        currency: courses.currency,
        stripePriceId: courses.stripePriceId,
        stripeProductId: courses.stripeProductId,
        mercadopagoProductId: courses.mercadopagoProductId,
        title: courses.title,
      })
      .from(cartItems)
      .innerJoin(courses, eq(cartItems.courseId, courses.id))
      .where(eq(cartItems.userId, userId));
  }
}

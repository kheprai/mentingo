import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { EventBus } from "@nestjs/cqrs";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { isEqual } from "lodash";

import { DatabasePg } from "src/common";
import { getSortOptions } from "src/common/helpers/getSortOptions";
import { addPagination, DEFAULT_PAGE_SIZE } from "src/common/pagination";
import { CreateCategoryEvent, DeleteCategoryEvent, UpdateCategoryEvent } from "src/events";
import { LocalizationService } from "src/localization/localization.service";
import { categories } from "src/storage/schema";
import { USER_ROLES, type UserRole } from "src/user/schemas/userRoles";

import {
  type CategoryFilterSchema,
  type CategorySortField,
  CategorySortFields,
} from "./schemas/categoryQuery";

import type { AllCategoriesResponse } from "./schemas/category.schema";
import type { CategoryQuery } from "./schemas/category.types";
import type { CategoryInsert } from "./schemas/createCategorySchema";
import type { CategoryUpdateBody } from "./schemas/updateCategorySchema";
import type { CategoryActivityLogSnapshot } from "src/activity-logs/types";
import type { Pagination, UUIDType } from "src/common";
import type { CurrentUser } from "src/common/types/current-user.type";

@Injectable()
export class CategoryService {
  constructor(
    @Inject("DB") private readonly db: DatabasePg,
    private readonly localizationService: LocalizationService,
    private readonly eventBus: EventBus,
  ) {}

  public async getCategories(
    query: CategoryQuery,
    userRole?: UserRole,
  ): Promise<{
    data: AllCategoriesResponse;
    pagination: Pagination;
  }> {
    const {
      sort = CategorySortFields.title,
      perPage = DEFAULT_PAGE_SIZE,
      page = 1,
      filters = {},
    } = query;

    const { sortOrder, sortedField } = getSortOptions(sort);

    const isAdmin = userRole === USER_ROLES.ADMIN;

    const selectedColumns = {
      id: categories.id,
      archived: categories.archived,
      createdAt: categories.createdAt,
      title: categories.title,
    };

    return this.db.transaction(async (tx) => {
      const conditions = this.getFiltersConditions(filters);
      const queryDB = tx
        .select(selectedColumns)
        .from(categories)
        .where(and(...conditions))
        .orderBy(sortOrder(this.getColumnToSortBy(sortedField as CategorySortField, isAdmin)));

      const dynamicQuery = queryDB.$dynamic();

      const paginatedQuery = addPagination(dynamicQuery, page, perPage);

      const data = await paginatedQuery;

      const [{ totalItems }] = await tx
        .select({ totalItems: count() })
        .from(categories)
        .where(and(...conditions));

      return {
        data: this.serializeCategories(data, isAdmin),
        pagination: { totalItems: totalItems, page, perPage },
        appliedFilters: filters,
      };
    });
  }

  public async getCategoryById(id: UUIDType) {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id)));

    return category;
  }

  public async createCategory(createCategoryBody: CategoryInsert, currentUser: CurrentUser) {
    // Check for duplicate category titles in any language
    const titleValues = Object.values(createCategoryBody.title);
    for (const titleValue of titleValues) {
      const existingCategory = await this.db
        .select()
        .from(categories)
        .where(
          sql`EXISTS (SELECT 1 FROM jsonb_each_text(${categories.title}) WHERE value ILIKE ${titleValue})`,
        )
        .limit(1);

      if (existingCategory.length > 0) {
        throw new ConflictException(`Category with title "${titleValue}" already exists`);
      }
    }

    const [newCategory] = await this.db.insert(categories).values(createCategoryBody).returning();

    if (!newCategory) throw new UnprocessableEntityException("Category not created");

    this.eventBus.publish(
      new CreateCategoryEvent({
        categoryId: newCategory.id,
        actor: currentUser,
        category: this.buildCategorySnapshot(newCategory),
      }),
    );

    return newCategory;
  }

  public async updateCategory(
    id: UUIDType,
    updateCategoryBody: CategoryUpdateBody,
    currentUser: CurrentUser,
  ) {
    const [existingCategory] = await this.db.select().from(categories).where(eq(categories.id, id));

    if (!existingCategory) {
      throw new NotFoundException("Category not found");
    }

    const previousSnapshot = this.buildCategorySnapshot(existingCategory);

    const [updatedCategory] = await this.db
      .update(categories)
      .set(updateCategoryBody)
      .where(eq(categories.id, id))
      .returning();

    if (updatedCategory) {
      const updatedSnapshot = this.buildCategorySnapshot(updatedCategory);

      if (!isEqual(previousSnapshot, updatedSnapshot)) {
        this.eventBus.publish(
          new UpdateCategoryEvent({
            categoryId: id,
            actor: currentUser,
            previousCategoryData: previousSnapshot,
            updatedCategoryData: updatedSnapshot,
          }),
        );
      }
    }

    return updatedCategory;
  }

  private getColumnToSortBy(sort: CategorySortField, isAdmin: boolean) {
    if (!isAdmin) return categories.title;

    switch (sort) {
      case CategorySortFields.creationDate:
        return categories.createdAt;
      default:
        return categories.title;
    }
  }

  async deleteCategory(id: UUIDType, currentUser: CurrentUser) {
    const [category] = await this.db.select().from(categories).where(eq(categories.id, id));

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    // Delete the category - courses will have their categoryId set to NULL automatically
    await this.db.delete(categories).where(eq(categories.id, id));

    this.eventBus.publish(
      new DeleteCategoryEvent({
        categoryId: category.id,
        actor: currentUser,
        categoryTitle: category.title,
      }),
    );
  }

  async deleteManyCategories(categoryIds: string[], currentUser: CurrentUser): Promise<string> {
    let deletedCategories: { id: UUIDType; title: Record<string, string> }[] = [];

    const message = await this.db.transaction(async (tx) => {
      const existingCategories = await tx
        .select({ id: categories.id, title: categories.title })
        .from(categories)
        .where(inArray(categories.id, categoryIds));

      if (existingCategories.length === 0) {
        throw new NotFoundException("No categories found to delete");
      }

      // Delete the categories - courses will have their categoryId set to NULL automatically
      await tx.delete(categories).where(
        inArray(
          categories.id,
          existingCategories.map((cat) => cat.id),
        ),
      );

      deletedCategories = existingCategories.map((cat) => ({ id: cat.id, title: cat.title }));

      const deletedTitles = existingCategories.map(
        (cat) => cat.title.en || Object.values(cat.title)[0],
      );
      return `Successfully deleted categories: ${deletedTitles.join(", ")}`;
    });

    deletedCategories.forEach(({ id, title }) =>
      this.eventBus.publish(
        new DeleteCategoryEvent({
          categoryId: id,
          actor: currentUser,
          categoryTitle: title,
        }),
      ),
    );

    return message;
  }

  private buildCategorySnapshot(category: {
    id: UUIDType;
    title?: Record<string, string> | null;
    archived?: boolean | null;
  }): CategoryActivityLogSnapshot {
    return {
      id: category.id,
      title: category.title,
      archived: category.archived,
    };
  }

  private serializeCategories = (data: AllCategoriesResponse, isAdmin: boolean) =>
    data.map((category) => ({
      ...category,
      archived: isAdmin ? category.archived : null,
      createdAt: isAdmin ? category.createdAt : null,
    }));

  private getFiltersConditions(filters: CategoryFilterSchema) {
    const conditions = [];
    if (filters.title) {
      // Search in any language value of the JSONB title field
      conditions.push(
        sql`EXISTS (SELECT 1 FROM jsonb_each_text(${categories.title}) WHERE value ILIKE ${`%${filters.title.toLowerCase()}%`})`,
      );
    }

    if (filters.archived) {
      conditions.push(eq(categories.archived, filters.archived === "true"));
    }

    return conditions ?? undefined;
  }
}

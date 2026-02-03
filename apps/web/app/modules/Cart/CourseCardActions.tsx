import { Link, useNavigate } from "@remix-run/react";
import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAddToServerCart } from "~/api/mutations/useAddToCart";
import { useRemoveFromServerCart } from "~/api/mutations/useRemoveFromCart";
import { useCurrentUser } from "~/api/queries/useCurrentUser";
import { Button } from "~/components/ui/button";
import { useCartStore } from "~/lib/stores/cartStore";

import type { CartItem } from "~/lib/stores/cartStore";

export type CourseCardActionsProps = {
  course: {
    id: string;
    slug?: string | null;
    title: string;
    thumbnailUrl?: string | null;
    authorName?: string;
    categoryName?: string | null;
    priceInCents: number;
    mercadopagoPriceInCents?: number;
    currency: string;
    stripePriceId?: string | null;
    mercadopagoProductId?: string | null;
  };
  isEnrolled: boolean;
  variant?: "card" | "detail";
};

export function CourseCardActions({ course, isEnrolled, variant = "card" }: CourseCardActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const isLoggedIn = !!currentUser;

  const addItemToStore = useCartStore((state) => state.addItem);
  const removeItemFromStore = useCartStore((state) => state.removeItem);
  const isInCart = useCartStore((state) => state.isInCart(course.id));
  const { mutateAsync: addToServer } = useAddToServerCart();
  const { mutateAsync: removeFromServer } = useRemoveFromServerCart();

  const courseUrl = course.slug ? `/course/${course.slug}` : `/course/${course.id}`;
  const detailUrl = `/courses/${course.slug ?? course.id}`;

  const buildCartItem = (): CartItem => ({
    courseId: course.id,
    slug: course.slug ?? null,
    title: course.title,
    thumbnailUrl: course.thumbnailUrl ?? null,
    authorName: course.authorName ?? "",
    categoryName: course.categoryName ?? null,
    priceInCents: course.priceInCents,
    mercadopagoPriceInCents: course.mercadopagoPriceInCents ?? 0,
    currency: course.currency,
    stripePriceId: course.stripePriceId ?? null,
    mercadopagoProductId: course.mercadopagoProductId ?? null,
    addedAt: new Date().toISOString(),
  });

  const handleAddAndCheckout = async () => {
    if (!isInCart) {
      addItemToStore(buildCartItem());
      if (isLoggedIn) {
        try { await addToServer(course.id); } catch { /* local cart updated */ }
      }
    }
    navigate("/checkout");
  };

  const handleAddToCart = async () => {
    addItemToStore(buildCartItem());
    if (isLoggedIn) {
      try { await addToServer(course.id); } catch { /* local cart updated */ }
    }
  };

  const handleRemoveFromCart = async () => {
    removeItemFromStore(course.id);
    if (isLoggedIn) {
      try { await removeFromServer(course.id); } catch { /* local cart updated */ }
    }
  };

  if (isEnrolled) {
    if (variant === "detail") {
      return (
        <Button size="lg" variant="primary" className="w-full" asChild>
          <Link to={courseUrl}>
            <ArrowRight className="mr-2 size-4" />
            {t("landing.courseDetail.continueLearning")}
          </Link>
        </Button>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="w-full" size="sm" asChild>
          <Link to={detailUrl}>
            {t("landing.courses.card.viewDetails")}
          </Link>
        </Button>
        <Button variant="primary" className="w-full" size="sm" asChild>
          <Link to={courseUrl}>
            <ArrowRight className="mr-2 size-3.5" />
            {t("landing.courses.card.continue")}
          </Link>
        </Button>
      </div>
    );
  }

  if (isInCart) {
    if (variant === "detail") {
      return (
        <div className="flex flex-col gap-2">
          <Button size="lg" variant="primary" className="w-full" asChild>
            <Link to="/checkout">
              {t("cart.button.goToCheckout")}
            </Link>
          </Button>
          <Button size="lg" variant="destructive" className="w-full" onClick={handleRemoveFromCart}>
            <Trash2 className="mr-2 size-4" />
            {t("cart.button.removeFromCart")}
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" className="w-full" size="sm" asChild>
          <Link to={detailUrl}>
            {t("landing.courses.card.viewDetails")}
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={handleRemoveFromCart}
            aria-label={t("cart.button.removeFromCart")}>
            <Trash2 className="size-3.5" />
          </Button>
          <Button variant="outline" className="flex-1" size="sm" asChild>
            <Link to="/cart">
              <ShoppingCart className="mr-1 size-3.5" />
              {t("cart.button.viewCart")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Not enrolled, not in cart
  if (variant === "detail") {
    return (
      <div className="flex flex-col gap-2">
        <Button size="lg" variant="primary" className="w-full" onClick={handleAddAndCheckout}>
          {t("cart.button.enroll")}
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 size-4" />
          {t("cart.button.addToCartShort")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" className="w-full" size="sm" asChild>
        <Link to={detailUrl}>
          {t("landing.courses.card.viewDetails")}
        </Link>
      </Button>
      <div className="flex gap-2">
        <Button variant="primary" className="flex-1" size="sm" onClick={handleAddAndCheckout}>
          {t("cart.button.enroll")}
        </Button>
        <Button variant="outline" className="flex-1" size="sm" onClick={handleAddToCart}>
          <ShoppingCart className="mr-1 size-3.5" />
          {t("cart.button.addToCartShort")}
        </Button>
      </div>
    </div>
  );
}

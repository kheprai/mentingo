import { Link } from "@remix-run/react";
import { ShoppingCart, Check, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAddToServerCart } from "~/api/mutations/useAddToCart";
import { useCurrentUser } from "~/api/queries/useCurrentUser";
import { Button } from "~/components/ui/button";
import { useCartStore } from "~/lib/stores/cartStore";

import type { CartItem } from "~/lib/stores/cartStore";

type AddToCartButtonProps = {
  course: {
    id: string;
    title: string;
    slug?: string | null;
    thumbnailUrl?: string | null;
    authorName?: string;
    categoryName?: string | null;
    priceInCents: number;
    mercadopagoPriceInCents?: number;
    currency: string;
    stripePriceId?: string | null;
    mercadopagoProductId?: string | null;
  };
  isEnrolled?: boolean;
  className?: string;
  variant?: "default" | "outline";
};

export function AddToCartButton({
  course,
  isEnrolled = false,
  className,
  variant = "default",
}: AddToCartButtonProps) {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const isLoggedIn = !!currentUser;

  const addItemToStore = useCartStore((state) => state.addItem);
  const isInCart = useCartStore((state) => state.isInCart(course.id));
  const setCartSidebarOpen = useCartStore((state) => state.setCartSidebarOpen);
  const { mutateAsync: addToServer } = useAddToServerCart();

  if (isEnrolled) {
    return (
      <Button variant={variant === "default" ? "primary" : "outline"} className={className} asChild>
        <Link to={course.slug ? `/course/${course.slug}` : `/course/${course.id}`}>
          <ArrowRight className="mr-2 size-4" />
          {t("studentCourseView.sideSection.button.continueLearning")}
        </Link>
      </Button>
    );
  }

  if (isInCart) {
    return (
      <Button
        variant="outline"
        className={className}
        onClick={() => setCartSidebarOpen(true)}
      >
        <Check className="mr-2 size-4" />
        {t("cart.button.inCart")}
      </Button>
    );
  }

  const handleAddToCart = async () => {
    const cartItem: CartItem = {
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
    };

    addItemToStore(cartItem);

    if (isLoggedIn) {
      try {
        await addToServer(course.id);
      } catch {
        // Local cart updated anyway
      }
    }

    setCartSidebarOpen(true);
  };

  return (
    <Button
      variant={variant === "default" ? "primary" : "outline"}
      className={className}
      onClick={handleAddToCart}
    >
      <ShoppingCart className="mr-2 size-4" />
      {t("cart.button.addToCart")}
    </Button>
  );
}

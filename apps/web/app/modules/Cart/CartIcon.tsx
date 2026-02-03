import { ShoppingCart } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useCartStore } from "~/lib/stores/cartStore";

export function CartIcon() {
  const items = useCartStore((state) => state.items);
  const toggleCartSidebar = useCartStore((state) => state.toggleCartSidebar);
  const count = items.length;

  if (count === 0) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={toggleCartSidebar}
      aria-label={`Shopping cart with ${count} items`}
    >
      <ShoppingCart className="size-5" />
      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary-700 text-[10px] font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    </Button>
  );
}

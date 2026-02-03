import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  courseId: string;
  slug: string | null;
  title: string;
  thumbnailUrl: string | null;
  authorName: string;
  categoryName: string | null;
  priceInCents: number;
  mercadopagoPriceInCents: number;
  currency: string;
  stripePriceId: string | null;
  mercadopagoProductId: string | null;
  addedAt: string;
}

interface CartState {
  items: CartItem[];
  selectedPaymentMethod: "stripe" | "mercadopago" | null;
  isCartSidebarOpen: boolean;

  addItem: (item: CartItem) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  replaceCart: (items: CartItem[]) => void;
  setSelectedPaymentMethod: (method: "stripe" | "mercadopago" | null) => void;
  setCartSidebarOpen: (open: boolean) => void;
  toggleCartSidebar: () => void;

  getItemCount: () => number;
  isInCart: (courseId: string) => boolean;
  getGuestCourseIds: () => string[];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedPaymentMethod: null,
      isCartSidebarOpen: false,

      addItem: (item) =>
        set((state) => {
          if (state.items.some((i) => i.courseId === item.courseId)) {
            return state;
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (courseId) =>
        set((state) => ({
          items: state.items.filter((i) => i.courseId !== courseId),
        })),

      clearCart: () => set({ items: [], selectedPaymentMethod: null }),

      replaceCart: (items) => set({ items }),

      setSelectedPaymentMethod: (method) => set({ selectedPaymentMethod: method }),

      setCartSidebarOpen: (open) => set({ isCartSidebarOpen: open }),

      toggleCartSidebar: () =>
        set((state) => ({ isCartSidebarOpen: !state.isCartSidebarOpen })),

      getItemCount: () => get().items.length,

      isInCart: (courseId) => get().items.some((i) => i.courseId === courseId),

      getGuestCourseIds: () => get().items.map((i) => i.courseId),
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        selectedPaymentMethod: state.selectedPaymentMethod,
      }),
    },
  ),
);

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  addCartItem,
  createCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/apis/carts";
import {
  PreviewCartContext,
  type PreviewCartContextValue,
} from "@/contexts/preview-cart-context";
import { cartKeys } from "@/hooks/use-cart";
import { formatMajorAmount } from "@/lib/format-money";
import { stockFailureMessage } from "@/lib/stock";
import {
  loadCartDisplayMap,
  loadStoredCartId,
  saveStoredCartId,
  upsertCartDisplay,
  type CartLineDisplay,
} from "@/lib/store-cart-storage";
import type { Cart, CartItem } from "@/types/cart";
import type { PreviewCartLine } from "@/types/preview-cart";
import { toast } from "sonner";

type ApiCartProviderProps = {
  storeSlug: string;
  children: ReactNode;
};

function toDisplayLines(
  cart: Cart | null,
  displayMap: Record<string, CartLineDisplay>,
): PreviewCartLine[] {
  if (!cart) return [];
  return cart.items.map((item) => {
    const meta = displayMap[item.productId];
    return {
      productId: item.productId,
      title: meta?.title ?? "Product",
      sku: meta?.sku ?? "",
      imageUrl: meta?.imageUrl ?? "",
      priceLabel: formatMajorAmount(item.unitPriceAmount, item.currency),
      quantity: item.quantity,
    };
  });
}

function findItem(cart: Cart | null, productId: string): CartItem | undefined {
  return cart?.items.find((item) => item.productId === productId);
}

export function ApiCartProvider({ storeSlug, children }: ApiCartProviderProps) {
  const queryClient = useQueryClient();
  const [cartId, setCartId] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [displayMap, setDisplayMap] = useState<Record<string, CartLineDisplay>>(
    {},
  );
  const [hydrated, setHydrated] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [lastAddedLine, setLastAddedLine] = useState<PreviewCartLine | null>(
    null,
  );
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isAddedModalOpen, setAddedModalOpen] = useState(false);
  const ensureCartPromise = useRef<Promise<string> | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setCartId(loadStoredCartId(storeSlug));
      setDisplayMap(loadCartDisplayMap(storeSlug));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [storeSlug]);

  const applyCart = useCallback(
    (next: Cart) => {
      setCart(next);
      setCartId(next.id);
      saveStoredCartId(storeSlug, next.id);
      queryClient.setQueryData(cartKeys.detail(storeSlug, next.id), next);
    },
    [queryClient, storeSlug],
  );

  useEffect(() => {
    if (!hydrated || !cartId) return;
    let cancelled = false;
    void (async () => {
      const result = await getCart(storeSlug, cartId);
      if (cancelled) return;
      if (!result.ok) {
        if (result.errorCode === "CART_NOT_FOUND" || result.status === 404) {
          saveStoredCartId(storeSlug, null);
          setCartId(null);
          setCart(null);
          return;
        }
        setCartError(result.errorMessage);
        return;
      }
      applyCart(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyCart, cartId, hydrated, storeSlug]);

  const ensureCartId = useCallback(async (): Promise<string> => {
    if (cartId) return cartId;
    if (ensureCartPromise.current) return ensureCartPromise.current;

    ensureCartPromise.current = (async () => {
      const result = await createCart(storeSlug);
      if (!result.ok) {
        throw new Error(result.errorMessage);
      }
      applyCart(result.data);
      return result.data.id;
    })();

    try {
      return await ensureCartPromise.current;
    } finally {
      ensureCartPromise.current = null;
    }
  }, [applyCart, cartId, storeSlug]);

  const lines = useMemo(
    () => toDisplayLines(cart, displayMap),
    [cart, displayMap],
  );
  const itemCount = useMemo(
    () => lines.reduce((n, line) => n + line.quantity, 0),
    [lines],
  );

  const openDrawer = useCallback(() => {
    setAddedModalOpen(false);
    setDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => {
    setAddedModalOpen(false);
    setDrawerOpen((open) => !open);
  }, []);
  const closeAddedModal = useCallback(() => setAddedModalOpen(false), []);

  const addItem = useCallback(
    (
      input: {
        productId: string;
        title: string;
        sku: string;
        priceLabel: string;
        imageUrl: string;
        quantity?: number;
      },
      opts?: { openDrawer?: boolean },
    ) => {
      const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
      const optimistic: PreviewCartLine = {
        productId: input.productId,
        title: input.title,
        sku: input.sku,
        priceLabel: input.priceLabel,
        imageUrl: input.imageUrl,
        quantity,
      };
      setLastAddedLine(optimistic);
      setDisplayMap(
        upsertCartDisplay(storeSlug, {
          productId: input.productId,
          title: input.title,
          sku: input.sku,
          imageUrl: input.imageUrl,
        }),
      );
      if (opts?.openDrawer !== false) {
        setDrawerOpen(false);
        setAddedModalOpen(true);
      }

      void (async () => {
        setIsBusy(true);
        setCartError(null);
        try {
          const id = await ensureCartId();
          const result = await addCartItem(storeSlug, id, {
            productId: input.productId,
            quantity,
          });
          if (!result.ok) {
            const message = stockFailureMessage(
              result.errorCode,
              result.errorMessage,
              result.availableQuantity,
            );
            setCartError(message);
            setAddedModalOpen(false);
            toast.error(
              result.errorCode === "INSUFFICIENT_STOCK"
                ? "Out of stock"
                : "Could not add to cart",
              { description: message },
            );
            return;
          }
          applyCart(result.data);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Could not update cart.";
          setCartError(message);
          setAddedModalOpen(false);
          toast.error("Could not add to cart", { description: message });
        } finally {
          setIsBusy(false);
        }
      })();
    },
    [applyCart, ensureCartId, storeSlug],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const item = findItem(cart, productId);
      if (!cartId || !item) return;
      const q = Math.floor(quantity);
      void (async () => {
        setIsBusy(true);
        setCartError(null);
        try {
          if (q < 1) {
            const result = await removeCartItem(storeSlug, cartId, item.id);
            if (!result.ok) throw new Error(result.errorMessage);
            applyCart(result.data);
            return;
          }
          const result = await updateCartItem(storeSlug, cartId, item.id, {
            quantity: q,
          });
          if (!result.ok) {
            const message = stockFailureMessage(
              result.errorCode,
              result.errorMessage,
              result.availableQuantity,
            );
            setCartError(message);
            toast.error(
              result.errorCode === "INSUFFICIENT_STOCK"
                ? "Out of stock"
                : "Could not update cart",
              { description: message },
            );
            return;
          }
          applyCart(result.data);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Could not update cart.";
          setCartError(message);
          toast.error("Could not update cart", { description: message });
        } finally {
          setIsBusy(false);
        }
      })();
    },
    [applyCart, cart, cartId, storeSlug],
  );

  const incrementLine = useCallback(
    (productId: string) => {
      const item = findItem(cart, productId);
      if (!item) return;
      setQuantity(productId, item.quantity + 1);
    },
    [cart, setQuantity],
  );

  const decrementLine = useCallback(
    (productId: string) => {
      const item = findItem(cart, productId);
      if (!item) return;
      setQuantity(productId, item.quantity - 1);
    },
    [cart, setQuantity],
  );

  const removeLine = useCallback(
    (productId: string) => {
      setQuantity(productId, 0);
    },
    [setQuantity],
  );

  const clearCart = useCallback(() => {
    if (!cartId || !cart?.items.length) {
      setCart(null);
      return;
    }
    void (async () => {
      setIsBusy(true);
      setCartError(null);
      try {
        let next = cart;
        for (const item of [...cart.items]) {
          const result = await removeCartItem(storeSlug, cartId, item.id);
          if (!result.ok) throw new Error(result.errorMessage);
          next = result.data;
        }
        applyCart(next);
      } catch (error) {
        setCartError(
          error instanceof Error ? error.message : "Could not clear cart.",
        );
      } finally {
        setIsBusy(false);
      }
    })();
  }, [applyCart, cart, cartId, storeSlug]);

  const discardCartSession = useCallback(() => {
    saveStoredCartId(storeSlug, null);
    setCartId(null);
    setCart(null);
    setLastAddedLine(null);
    setCartError(null);
  }, [storeSlug]);

  const value = useMemo<PreviewCartContextValue>(
    () => ({
      lines,
      lastAddedLine,
      itemCount,
      mode: "api",
      cartId,
      isBusy,
      cartError,
      subtotalLabel: cart
        ? formatMajorAmount(cart.subtotalAmount, cart.currency)
        : null,
      totalLabel: cart
        ? formatMajorAmount(cart.totalAmount, cart.currency)
        : null,
      isDrawerOpen,
      isAddedModalOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      closeAddedModal,
      addItem,
      setQuantity,
      incrementLine,
      decrementLine,
      removeLine,
      clearCart,
      discardCartSession,
    }),
    [
      lines,
      lastAddedLine,
      itemCount,
      cartId,
      isBusy,
      cartError,
      cart,
      isDrawerOpen,
      isAddedModalOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      closeAddedModal,
      addItem,
      setQuantity,
      incrementLine,
      decrementLine,
      removeLine,
      clearCart,
      discardCartSession,
    ],
  );

  return (
    <PreviewCartContext.Provider value={value}>
      {children}
    </PreviewCartContext.Provider>
  );
}

/** Clear local cart id after a successful checkout conversion. */
export function resetApiCartSession(storeSlug: string) {
  saveStoredCartId(storeSlug, null);
}

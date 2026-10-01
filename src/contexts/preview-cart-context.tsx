"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadPreviewCart,
  savePreviewCart,
} from "@/lib/preview-cart-storage";
import type { PreviewCartLine } from "@/types/preview-cart";

export type PreviewCartContextValue = {
  lines: PreviewCartLine[];
  lastAddedLine: PreviewCartLine | null;
  itemCount: number;
  isDrawerOpen: boolean;
  isAddedModalOpen: boolean;
  /** Backend cart id when `mode === "api"`. */
  cartId?: string | null;
  /** `api` = backend cart (public store). `preview` = browser-only draft cart. */
  mode?: "preview" | "api";
  isBusy?: boolean;
  cartError?: string | null;
  /** Backend totals when `mode === "api"`. */
  subtotalLabel?: string | null;
  totalLabel?: string | null;
  /** Major units from backend cart (same as subtotalLabel). */
  subtotalAmount?: number;
  totalAmount?: number;
  currency?: string;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  closeAddedModal: () => void;
  addItem: (
    input: {
      productId: string;
      title: string;
      sku: string;
      priceLabel: string;
      imageUrl: string;
      quantity?: number;
    },
    opts?: { openDrawer?: boolean },
  ) => void;
  setQuantity: (productId: string, quantity: number) => void;
  incrementLine: (productId: string) => void;
  decrementLine: (productId: string) => void;
  removeLine: (productId: string) => void;
  clearCart: () => void;
  /** Drop local cart id after checkout converts the cart (API mode). */
  discardCartSession?: () => void;
};

export const PreviewCartContext = createContext<PreviewCartContextValue | null>(
  null,
);

export function usePreviewCartOptional(): PreviewCartContextValue | null {
  return useContext(PreviewCartContext);
}

type PreviewCartProviderProps = {
  workspaceId: string;
  children: ReactNode;
};

export function PreviewCartProvider({
  workspaceId,
  children,
}: PreviewCartProviderProps) {
  const [lines, setLines] = useState<PreviewCartLine[]>([]);
  const [lastAddedLine, setLastAddedLine] = useState<PreviewCartLine | null>(
    null,
  );
  const [hydrated, setHydrated] = useState(false);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isAddedModalOpen, setAddedModalOpen] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setLines(loadPreviewCart(workspaceId));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [workspaceId]);

  useEffect(() => {
    if (!hydrated) return;
    savePreviewCart(workspaceId, lines);
  }, [hydrated, workspaceId, lines]);

  const itemCount = useMemo(
    () => lines.reduce((n, l) => n + l.quantity, 0),
    [lines],
  );

  const openDrawer = useCallback(() => {
    setAddedModalOpen(false);
    setDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => {
    setAddedModalOpen(false);
    setDrawerOpen((o) => !o);
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
      const q = Math.max(1, Math.floor(input.quantity ?? 1));
      const addedLine: PreviewCartLine = {
        productId: input.productId,
        title: input.title,
        sku: input.sku,
        priceLabel: input.priceLabel,
        imageUrl: input.imageUrl,
        quantity: q,
      };
      setLines((prev) => {
        const i = prev.findIndex((l) => l.productId === input.productId);
        if (i === -1) {
          return [...prev, addedLine];
        }
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + q };
        return next;
      });
      setLastAddedLine(addedLine);
      if (opts?.openDrawer !== false) {
        setDrawerOpen(false);
        setAddedModalOpen(true);
      }
    },
    [],
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const q = Math.floor(quantity);
    if (q < 1) {
      setLines((prev) => prev.filter((l) => l.productId !== productId));
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, quantity: q } : l,
      ),
    );
  }, []);

  const incrementLine = useCallback((productId: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l,
      ),
    );
  }, []);

  const decrementLine = useCallback((productId: string) => {
    setLines((prev) => {
      const next: PreviewCartLine[] = [];
      for (const l of prev) {
        if (l.productId !== productId) {
          next.push(l);
          continue;
        }
        if (l.quantity <= 1) continue;
        next.push({ ...l, quantity: l.quantity - 1 });
      }
      return next;
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const value = useMemo<PreviewCartContextValue>(
    () => ({
      lines,
      lastAddedLine,
      itemCount,
      mode: "preview",
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
    }),
    [
      lines,
      lastAddedLine,
      itemCount,
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
    ],
  );

  return (
    <PreviewCartContext.Provider value={value}>
      {children}
    </PreviewCartContext.Provider>
  );
}

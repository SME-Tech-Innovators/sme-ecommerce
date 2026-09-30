import type { ParsedApiFailure } from "@/apis/api-result";

export type CartStatus = "active" | "converted" | "abandoned";
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "fulfilled"
  | "cancelled";
export type PaymentStatus =
  | "unpaid"
  | "initialized"
  | "paid"
  | "failed"
  | "refunded";

export type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPriceAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type Cart = {
  id: string;
  workspaceId: string;
  customerSessionId: string;
  status: CartStatus;
  currency: string;
  items: CartItem[];
  subtotalAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  title: string;
  sku: string;
  quantity: number;
  unitPriceAmount: number;
  totalAmount: number;
  currency: string;
};

export type Order = {
  cancellationRequestStatus?: string | null;
  id: string;
  workspaceId: string;
  cartId: string | null;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  subtotalAmount: number;
  shippingAmount: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type AddCartItemBody = {
  productId: string;
  quantity: number;
};

export type UpdateCartItemBody = {
  quantity: number;
};

export type CheckoutShippingSelection = {
  optionId: string;
  provider?: string;
  amount: number;
  currency: string;
  bobgoRateToken?: string;
};

export type CheckoutBody = {
  cartId: string;
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  shippingSelection?: CheckoutShippingSelection;
};

export type CartResult = { ok: true; data: Cart } | ParsedApiFailure;
export type OrderResult = { ok: true; data: Order } | ParsedApiFailure;

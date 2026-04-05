import type { CartItem } from "@/src/lib/types";
import type { CartItemInput } from "@/src/lib/validation";

export const ADD_ON_CHARM_PRICE = 15;

export function formatCurrency(amount: number) {
  return `$${amount}`;
}

export function calculateCartItemSubtotal(
  item: Pick<CartItemInput, "quantity" | "addOnCharmQuantity"> & Partial<Pick<CartItem, "unitPrice" | "allowCharm">>,
) {
  const unitPrice = item.unitPrice ?? 0;
  const addOnCharmQuantity = item.allowCharm === false ? 0 : item.addOnCharmQuantity;

  return unitPrice * item.quantity + addOnCharmQuantity * ADD_ON_CHARM_PRICE;
}

export function calculateOrderTotal(items: Array<Pick<CartItemInput, "quantity" | "addOnCharmQuantity"> & Partial<Pick<CartItem, "unitPrice" | "allowCharm">>>) {
  return items.reduce((acc, item) => acc + calculateCartItemSubtotal(item), 0);
}

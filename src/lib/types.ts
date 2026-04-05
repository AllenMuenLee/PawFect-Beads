import type { CategoryType } from "@/src/lib/catalog";

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  sizeValue: string;
  colorScheme: string;
  styleDescription: string;
  addOnCharmQuantity: number;
  referenceImageUrl?: string;
  categoryType: CategoryType;
  allowCharm: boolean;
  productName: string;
  unitPrice: number;
};

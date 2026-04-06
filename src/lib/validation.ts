import { z } from "zod";

import { COLOR_SCHEMES } from "@/src/lib/catalog";

function isValidReferenceImageUrl(value: string) {
  if (value.startsWith("/uploads/") || value.startsWith("/api/upload/")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const cartItemSchema = z
  .object({
    id: z.string().optional(),
    productId: z.string().min(1, "請選擇商品"),
    quantity: z.number().int("數量需為整數").min(1, "數量至少 1").max(99, "數量最多 99"),
    sizeValue: z.string().min(1, "請選擇尺寸或長度"),
    colorScheme: z
      .string()
      .refine((value) => COLOR_SCHEMES.includes(value as (typeof COLOR_SCHEMES)[number]), "請選擇配色"),
    styleDescription: z.string().max(600, "款式描述最多 600 字"),
    addOnCharmQuantity: z.number().int("加購數量需為整數").min(0, "加購數量不可小於 0"),
    referenceImageUrl: z
      .string()
      .refine((value) => value === "" || isValidReferenceImageUrl(value), "參考圖片格式不正確")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.addOnCharmQuantity > value.quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "加購小綴飾數量不可超過商品數量",
        path: ["addOnCharmQuantity"],
      });
    }
  });

export const checkoutSchema = z
  .object({
    customerGmail: z.string().trim().min(1, "請填寫 Gmail").regex(/^[^@\s]+@gmail\.com$/i, "請填寫有效 Gmail"),
    customerInstagram: z.string().max(100, "Instagram 最多 100 字").or(z.literal("")),
    customerLine: z.string().max(100, "LINE 最多 100 字").or(z.literal("")),
    note: z.string().max(1000, "備註最多 1000 字").or(z.literal("")),
    termsAccepted: z.boolean().refine((value) => value, "請勾選同意注意事項"),
    materialAdjustment: z.enum(["accept", "confirm-first"]),
  });

export const createOrderPayloadSchema = z.object({
  items: z.array(cartItemSchema).min(1, "購物車至少要有一項"),
  checkout: checkoutSchema,
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CreateOrderPayloadInput = z.infer<typeof createOrderPayloadSchema>;

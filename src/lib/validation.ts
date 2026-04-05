import { z } from "zod";

import { COLOR_SCHEMES } from "@/src/lib/catalog";

function isValidReferenceImageUrl(value: string) {
  if (value.startsWith("/uploads/")) {
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
    productId: z.string().min(1, "?????"),
    quantity: z.number().int("??????").min(1, "???? 1").max(99, "???? 99"),
    sizeValue: z.string().min(1, "????????"),
    colorScheme: z
      .string()
      .refine((value) => COLOR_SCHEMES.includes(value as (typeof COLOR_SCHEMES)[number]), "?????"),
    styleDescription: z.string().max(600, "?????? 600 ?"),
    addOnCharmQuantity: z.number().int("????????").min(0, "???????? 0"),
    referenceImageUrl: z
      .string()
      .refine((value) => value === "" || isValidReferenceImageUrl(value), "??????????")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.addOnCharmQuantity > value.quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "???????????????",
        path: ["addOnCharmQuantity"],
      });
    }
  });

export const checkoutSchema = z
  .object({
    customerGmail: z
      .string()
      .refine((value) => value === "" || /^[^@\s]+@gmail\.com$/i.test(value), "????? Gmail")
      .or(z.literal("")),
    customerInstagram: z.string().max(100, "Instagram ?? 100 ?").or(z.literal("")),
    customerLine: z.string().max(100, "LINE ?? 100 ?").or(z.literal("")),
    note: z.string().max(1000, "???? 1000 ?").or(z.literal("")),
    termsAccepted: z.boolean().refine((value) => value, "???????????"),
    materialAdjustment: z.enum(["accept", "confirm-first"]),
  })
  .superRefine((value, ctx) => {
    const hasAnyContact =
      value.customerGmail.trim().length > 0 ||
      value.customerInstagram.trim().length > 0 ||
      value.customerLine.trim().length > 0;

    if (!hasAnyContact) {
      const message = "????? Gmail?Instagram ? LINE ????????";
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ["customerGmail"] });
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ["customerInstagram"] });
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ["customerLine"] });
    }
  });

export const createOrderPayloadSchema = z.object({
  items: z.array(cartItemSchema).min(1, "???????"),
  checkout: checkoutSchema,
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CreateOrderPayloadInput = z.infer<typeof createOrderPayloadSchema>;


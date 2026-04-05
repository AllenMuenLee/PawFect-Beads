import { describe, expect, it } from "vitest";

import { cartItemSchema, checkoutSchema } from "@/src/lib/validation";

describe("cartItemSchema", () => {
  it("should fail when add-on charm quantity exceeds item quantity", () => {
    const result = cartItemSchema.safeParse({
      id: "item-1",
      productId: "bracelet-basic",
      quantity: 1,
      sizeValue: "15",
      colorScheme: "\u7c89\u8272\u7cfb",
      styleDescription: "\u6e2c\u8a66\u6b3e\u5f0f\u63cf\u8ff0",
      addOnCharmQuantity: 2,
      referenceImageUrl: "",
    });

    expect(result.success).toBe(false);
  });

  it("should pass when reference image uses local uploads path", () => {
    const result = cartItemSchema.safeParse({
      id: "item-2",
      productId: "bracelet-basic",
      quantity: 1,
      sizeValue: "15",
      colorScheme: "粉色系",
      styleDescription: "",
      addOnCharmQuantity: 0,
      referenceImageUrl: "/uploads/test-image.jpg",
    });

    expect(result.success).toBe(true);
  });

  it("should pass when reference image uses api upload path", () => {
    const result = cartItemSchema.safeParse({
      id: "item-3",
      productId: "bracelet-basic",
      quantity: 1,
      sizeValue: "15",
      colorScheme: "粉色系",
      styleDescription: "",
      addOnCharmQuantity: 0,
      referenceImageUrl: "/api/upload/demo-id.jpg",
    });

    expect(result.success).toBe(true);
  });
});

describe("checkoutSchema", () => {
  it("should fail when all contact methods are empty", () => {
    const result = checkoutSchema.safeParse({
      customerGmail: "",
      customerInstagram: "",
      customerLine: "",
      note: "",
      termsAccepted: true,
      materialAdjustment: "accept",
    });

    expect(result.success).toBe(false);
  });

  it("should pass when at least one contact method is provided", () => {
    const result = checkoutSchema.safeParse({
      customerGmail: "",
      customerInstagram: "pawfect_account",
      customerLine: "",
      note: "",
      termsAccepted: true,
      materialAdjustment: "confirm-first",
    });

    expect(result.success).toBe(true);
  });
});

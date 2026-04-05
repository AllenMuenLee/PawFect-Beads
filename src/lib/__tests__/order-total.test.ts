import { describe, expect, it } from "vitest";

import { calculateOrderTotal } from "@/src/lib/cart";

describe("calculateOrderTotal", () => {
  it("should calculate total amount correctly", () => {
    const total = calculateOrderTotal([
      {
        quantity: 2,
        unitPrice: 130,
        allowCharm: true,
        addOnCharmQuantity: 0,
      },
      {
        quantity: 3,
        unitPrice: 30,
        allowCharm: false,
        addOnCharmQuantity: 0,
      },
    ]);

    expect(total).toBe(350);
  });

  it("should include add-on charm price", () => {
    const total = calculateOrderTotal([
      {
        quantity: 2,
        unitPrice: 65,
        allowCharm: true,
        addOnCharmQuantity: 2,
      },
    ]);

    expect(total).toBe(160);
  });
});

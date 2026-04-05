"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useCart } from "@/src/components/providers/cart-provider";
import { ADD_ON_CHARM_PRICE, calculateCartItemSubtotal, formatCurrency } from "@/src/lib/cart";
import {
  BRACELET_SIZES,
  COLOR_SCHEMES,
  NECKLACE_SIZES,
  type ProductCatalogItem,
  PRODUCT_CATALOG,
} from "@/src/lib/catalog";
import { getEstimatedDeliveryWindow } from "@/src/lib/delivery";
import {
  cartItemSchema,
  checkoutSchema,
  type CartItemInput,
  type CheckoutInput,
} from "@/src/lib/validation";

const defaultItemValues: CartItemInput = {
  id: "",
  productId: PRODUCT_CATALOG[0].id,
  quantity: 1,
  sizeValue: BRACELET_SIZES[0],
  colorScheme: COLOR_SCHEMES[0],
  styleDescription: "",
  addOnCharmQuantity: 0,
  referenceImageUrl: "",
};

const defaultCheckoutValues: CheckoutInput = {
  customerGmail: "",
  customerInstagram: "",
  customerLine: "",
  note: "",
  termsAccepted: false,
  materialAdjustment: "accept",
};

export function OrderPage() {
  const { items, totalAmount, addItem, updateItem, removeItem, updateQuantity, clearCart, isReady } =
    useCart();
  const [catalogProducts, setCatalogProducts] = useState<ProductCatalogItem[]>(PRODUCT_CATALOG);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const itemForm = useForm<CartItemInput>({
    resolver: zodResolver(cartItemSchema),
    defaultValues: defaultItemValues,
  });

  const checkoutForm = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: defaultCheckoutValues,
  });

  const selectedProductId = itemForm.watch("productId");
  const selectedProduct = useMemo(
    () => catalogProducts.find((product) => product.id === selectedProductId),
    [catalogProducts, selectedProductId],
  );

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch("/api/catalog");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { products: ProductCatalogItem[] };
        if (data.products.length === 0) {
          return;
        }

        setCatalogProducts(data.products);

        const currentProductId = itemForm.getValues("productId");
        const exists = data.products.some((product) => product.id === currentProductId);
        if (!exists) {
          itemForm.setValue("productId", data.products[0].id);
        }
      } finally {
        setIsCatalogLoading(false);
      }
    };

    void fetchCatalog();
  }, [itemForm]);

  const resetItemFormForProduct = (productId: string) => {
    const product = catalogProducts.find((entry) => entry.id === productId);
    if (!product) {
      return;
    }

    if (product.categoryType === "bracelet") {
      itemForm.setValue("sizeValue", BRACELET_SIZES[0]);
      return;
    }

    if (product.categoryType === "necklace") {
      itemForm.setValue("sizeValue", NECKLACE_SIZES[0]);
      return;
    }

    itemForm.setValue("sizeValue", "");
    if (!product.allowCharm) {
      itemForm.setValue("addOnCharmQuantity", 0);
    }
  };

  const onProductChange = (productId: string) => {
    itemForm.setValue("productId", productId);
    resetItemFormForProduct(productId);
  };

  const onUploadFile = async (file?: File) => {
    if (!file) {
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "圖片上傳失敗，請稍後再試");
      }

      itemForm.setValue("referenceImageUrl", payload.url, { shouldValidate: true });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "圖片上傳失敗");
    } finally {
      setIsUploading(false);
    }
  };

  const onAddOrUpdateItem = (values: CartItemInput) => {
    const payload: CartItemInput = {
      ...values,
      id: values.id?.trim() || crypto.randomUUID(),
      referenceImageUrl: values.referenceImageUrl || "",
    };

    if (!selectedProduct) {
      return;
    }

    const productSnapshot = {
      name: selectedProduct.name,
      price: selectedProduct.price,
      categoryType: selectedProduct.categoryType,
      allowCharm: selectedProduct.allowCharm,
    };

    if (editingId) {
      updateItem(editingId, payload, productSnapshot);
      setFormMessage("已更新項目");
      setEditingId(null);
    } else {
      addItem(payload, productSnapshot);
      setFormMessage("已加入購物車");
    }

    itemForm.reset(defaultItemValues);
  };

  const onEditItem = (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    setEditingId(itemId);
    itemForm.reset({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      sizeValue: item.sizeValue,
      colorScheme: item.colorScheme as (typeof COLOR_SCHEMES)[number],
      styleDescription: item.styleDescription,
      addOnCharmQuantity: item.addOnCharmQuantity ?? 0,
      referenceImageUrl: item.referenceImageUrl || "",
    });
  };

  const onSubmitOrder = async (contactValues: CheckoutInput) => {
    if (items.length === 0) {
      setSubmitError("購物車為空，請先新增商品");
      return;
    }

    setSubmitError(null);
    setSubmitWarning(null);

    try {
      const materialAdjustmentText =
        contactValues.materialAdjustment === "accept"
          ? "若材料不足：是，接受調整"
          : "若材料不足：否，希望先聯絡確認";

      const mergedNote = [contactValues.note, "營運須知：已同意", materialAdjustmentText]
        .filter(Boolean)
        .join("\n");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          checkout: {
            ...contactValues,
            note: mergedNote,
          },
        }),
      });

      const payload = (await response.json()) as { orderNumber?: string; error?: string };
      if (!response.ok && !payload.orderNumber) {
        throw new Error(payload.error || "送出訂單失敗，請稍後再試");
      }

      if (!payload.orderNumber) {
        throw new Error("系統回應異常，請稍後再試");
      }

      if (payload.error) {
        setSubmitWarning(payload.error);
      }

      const delivery = getEstimatedDeliveryWindow();
      setSuccessMessage(
        `訂單已成功送出（編號：${payload.orderNumber}）！預計出貨時間為：${delivery.text}`,
      );
      setIsContactOpen(false);
      checkoutForm.reset(defaultCheckoutValues);
      clearCart();
      setEditingId(null);
      itemForm.reset(defaultItemValues);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "送出失敗");
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-rose-950">下單頁面</h1>
      <p className="mt-2 text-sm text-stone-600">在同一頁完成商品客製、購物車確認與下單。</p>

      {!isReady && (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3 text-sm text-stone-600">
          載入購物車中...
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {submitWarning && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {submitWarning}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl border border-rose-100 bg-white p-6 shadow-[0_12px_35px_-18px_rgba(173,95,121,0.4)]">
          <h2 className="text-lg font-semibold text-rose-950">商品客製區</h2>

          <form onSubmit={itemForm.handleSubmit(onAddOrUpdateItem)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">商品類型</label>
              <select
                className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                value={selectedProductId}
                onChange={(event) => onProductChange(event.target.value)} disabled={isCatalogLoading || catalogProducts.length === 0}
              >
                {catalogProducts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}（{formatCurrency(item.price)}）
                  </option>
                ))}
              </select>
              <p className="text-xs text-rose-500">{itemForm.formState.errors.productId?.message}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-800">數量</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                  value={itemForm.watch("quantity")}
                  onChange={(event) => {
                    const nextQuantity = Math.min(
                      99,
                      Math.max(1, Number(event.target.value) || 1),
                    );
                    itemForm.setValue("quantity", nextQuantity, { shouldValidate: true });
                    const charmQty = itemForm.getValues("addOnCharmQuantity");
                    if (charmQty > nextQuantity) {
                      itemForm.setValue("addOnCharmQuantity", nextQuantity, { shouldValidate: true });
                    }
                  }}
                />
                <p className="text-xs text-rose-500">{itemForm.formState.errors.quantity?.message}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-800">尺寸</label>
                {selectedProduct?.categoryType === "bracelet" && (
                  <select
                    className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                    {...itemForm.register("sizeValue")}
                  >
                    {BRACELET_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                )}
                {selectedProduct?.categoryType === "necklace" && (
                  <select
                    className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                    {...itemForm.register("sizeValue")}
                  >
                    {NECKLACE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                )}
                {selectedProduct?.categoryType === "ring" && (
                  <input
                    type="text"
                    placeholder="請輸入戒圍，例如：#8"
                    className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                    {...itemForm.register("sizeValue")}
                  />
                )}
                <p className="text-xs text-rose-500">{itemForm.formState.errors.sizeValue?.message}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">配色</label>
              <select
                className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                {...itemForm.register("colorScheme")}
              >
                {COLOR_SCHEMES.map((scheme) => (
                  <option key={scheme} value={scheme}>
                    {scheme}
                  </option>
                ))}
              </select>
              <p className="text-xs text-rose-500">{itemForm.formState.errors.colorScheme?.message}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">款式描述（選填）</label>
              <textarea
                rows={4}
                placeholder="請描述想要的元素、飾品配置與風格感覺..."
                className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                {...itemForm.register("styleDescription")}
              />
              <p className="text-xs text-rose-500">
                {itemForm.formState.errors.styleDescription?.message}
              </p>
            </div>

            {selectedProduct?.allowCharm && (
              <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
                <p className="text-sm text-stone-800">
                  加購小綴飾（每個 {formatCurrency(ADD_ON_CHARM_PRICE)}）
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      itemForm.setValue(
                        "addOnCharmQuantity",
                        Math.max(0, itemForm.watch("addOnCharmQuantity") - 1),
                        { shouldValidate: true },
                      )
                    }
                    className="h-8 w-8 rounded-lg border border-rose-200 bg-white text-sm"
                  >
                    -
                  </button>
                  <span className="min-w-10 text-center text-sm font-medium text-stone-800">
                    {itemForm.watch("addOnCharmQuantity")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      itemForm.setValue(
                        "addOnCharmQuantity",
                        Math.min(itemForm.watch("quantity"), itemForm.watch("addOnCharmQuantity") + 1),
                        { shouldValidate: true },
                      )
                    }
                    className="h-8 w-8 rounded-lg border border-rose-200 bg-white text-sm"
                  >
                    +
                  </button>
                  <span className="text-xs text-stone-500">
                    最多可加購 {itemForm.watch("quantity")} 個
                  </span>
                </div>
                <p className="text-xs text-rose-500">
                  {itemForm.formState.errors.addOnCharmQuantity?.message}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">參考圖片（選填）</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => void onUploadFile(event.target.files?.[0])}
                className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm"
              />
              {isUploading && <p className="text-xs text-stone-500">圖片上傳中...</p>}
              {uploadError && <p className="text-xs text-rose-500">{uploadError}</p>}
              {itemForm.watch("referenceImageUrl") && (
                <div className="overflow-hidden rounded-2xl border border-rose-100">
                  <Image
                    src={itemForm.watch("referenceImageUrl") || ""}
                    alt="參考圖片預覽"
                    width={700}
                    height={350}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
            </div>

            <input type="hidden" {...itemForm.register("id")} />

            <button
              type="submit"
              disabled={itemForm.formState.isSubmitting || isUploading}
              className="w-full rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            >
              {editingId ? "更新項目" : "加入購物車"}
            </button>

            {formMessage && <p className="text-sm text-emerald-700">{formMessage}</p>}
          </form>
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-rose-100 bg-white p-6 shadow-[0_12px_35px_-18px_rgba(173,95,121,0.4)] lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold text-rose-950">購物車摘要</h2>

          {items.length === 0 ? (
            <p className="rounded-2xl border border-rose-100 bg-rose-50/40 px-3 py-4 text-sm text-stone-600">
              尚未加入商品
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
                  <p className="text-sm font-medium text-stone-800">{item.productName}</p>
                  <p className="mt-1 text-xs text-stone-600">尺寸：{item.sizeValue}</p>
                  <p className="text-xs text-stone-600">配色：{item.colorScheme}</p>
                  {item.addOnCharmQuantity > 0 && (
                    <p className="text-xs text-stone-600">
                      加購：小綴飾 x {item.addOnCharmQuantity}（
                      {formatCurrency(item.addOnCharmQuantity * ADD_ON_CHARM_PRICE)}）
                    </p>
                  )}
                  {item.styleDescription && (
                    <p className="text-xs text-stone-600">描述：{item.styleDescription}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(event) =>
                        updateQuantity(item.id, Math.min(99, Math.max(1, Number(event.target.value) || 1)))
                      }
                      className="w-18 rounded-xl border border-rose-200 bg-white px-2 py-1 text-sm"
                    />
                    <p className="text-sm font-medium text-rose-900">
                      {formatCurrency(calculateCartItemSubtotal(item))}
                    </p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEditItem(item.id)}
                      className="rounded-xl border border-rose-200 px-2 py-1 text-xs text-stone-700 hover:bg-white"
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded-xl border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      移除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-rose-100 pt-4">
            <p className="text-lg font-semibold text-rose-950">總金額：{formatCurrency(totalAmount)}</p>
          </div>

          <button
            type="button"
            onClick={() => setIsContactOpen(true)}
            disabled={items.length === 0}
            className="w-full rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            下單
          </button>
        </aside>
      </div>

      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/35 p-4">
          <div className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-rose-950">填寫聯絡資訊</h3>
              <button
                type="button"
                onClick={() => setIsContactOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
              >
                關閉
              </button>
            </div>

            <form onSubmit={checkoutForm.handleSubmit(onSubmitOrder)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-800">Gmail</label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                  {...checkoutForm.register("customerGmail")}
                />
                <p className="text-xs text-rose-500">{checkoutForm.formState.errors.customerGmail?.message}</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-800">Instagram</label>
                <input
                  type="text"
                  placeholder="@帳號"
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                  {...checkoutForm.register("customerInstagram")}
                />
                <p className="text-xs text-rose-500">
                  {checkoutForm.formState.errors.customerInstagram?.message}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-800">LINE</label>
                <input
                  type="text"
                  placeholder="LINE ID"
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                  {...checkoutForm.register("customerLine")}
                />
                <p className="text-xs text-rose-500">{checkoutForm.formState.errors.customerLine?.message}</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-800">備註（選填）</label>
                <textarea
                  rows={3}
                  placeholder="可補充希望聯絡時段..."
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                  {...checkoutForm.register("note")}
                />
                <p className="text-xs text-rose-500">{checkoutForm.formState.errors.note?.message}</p>
              </div>

              <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
                <label className="flex items-start gap-2 text-sm text-stone-800">
                  <input type="checkbox" className="mt-0.5" {...checkoutForm.register("termsAccepted")} />
                  <span>我已詳閱官帳發佈之「營運須知」並願意遵守</span>
                </label>
                <p className="text-xs text-rose-500">{checkoutForm.formState.errors.termsAccepted?.message}</p>
              </div>

              <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
                <p className="text-sm font-medium text-stone-800">若材料不足，是否接受調整？</p>
                <label className="flex items-center gap-2 text-sm text-stone-800">
                  <input type="radio" value="accept" {...checkoutForm.register("materialAdjustment")} />
                  <span>1. 是</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-800">
                  <input type="radio" value="confirm-first" {...checkoutForm.register("materialAdjustment")} />
                  <span>2. 否，希望先聯絡確認</span>
                </label>
                <p className="text-xs text-rose-500">
                  {checkoutForm.formState.errors.materialAdjustment?.message}
                </p>
              </div>

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <button
                type="submit"
                disabled={checkoutForm.formState.isSubmitting}
                className="mt-2 w-full rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {checkoutForm.formState.isSubmitting ? "送出中..." : "送出訂單"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}



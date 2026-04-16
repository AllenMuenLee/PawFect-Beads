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
import type { ReadyMadeProduct } from "@/src/lib/ready-made";

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
  orderIdentityType: "school-member",
  schoolClassSeat: "",
  friendFamilyName: "",
};

const NECKLACE_SIZE_VALUE = "固定尺寸";
const READY_MADE_COLOR_FALLBACK = COLOR_SCHEMES[COLOR_SCHEMES.length - 1];

export function OrderPage() {
  const { items, totalAmount, addItem, updateItem, removeItem, updateQuantity, clearCart, isReady } =
    useCart();
  const [catalogProducts, setCatalogProducts] = useState<ProductCatalogItem[]>(PRODUCT_CATALOG);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [readyMadeProducts, setReadyMadeProducts] = useState<ReadyMadeProduct[]>([]);
  const [isReadyMadeLoading, setIsReadyMadeLoading] = useState(true);
  const [readyMadeQuantities, setReadyMadeQuantities] = useState<Record<string, number>>({});
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
  const readyMadeStockMap = useMemo(
    () => new Map(readyMadeProducts.map((product) => [product.id, product.stock])),
    [readyMadeProducts],
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

  useEffect(() => {
    let active = true;

    const fetchReadyMadeProducts = async (isInitial: boolean) => {
      if (isInitial) {
        setIsReadyMadeLoading(true);
      }

      try {
        const response = await fetch("/api/ready-made-products");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { products: ReadyMadeProduct[] };
        if (!active) {
          return;
        }

        setReadyMadeProducts(data.products);
      } finally {
        if (isInitial && active) {
          setIsReadyMadeLoading(false);
        }
      }
    };

    void fetchReadyMadeProducts(true);

    const timer = window.setInterval(() => {
      void fetchReadyMadeProducts(false);
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

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
      itemForm.setValue("sizeValue", NECKLACE_SIZE_VALUE);
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

  const setCustomItemQuantity = (nextQuantity: number) => {
    const safeQuantity = Math.min(99, Math.max(1, nextQuantity));
    itemForm.setValue("quantity", safeQuantity, { shouldValidate: true });
    const charmQty = itemForm.getValues("addOnCharmQuantity");
    if (charmQty > safeQuantity) {
      itemForm.setValue("addOnCharmQuantity", safeQuantity, { shouldValidate: true });
    }
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
    const normalizedSizeValue =
      selectedProduct?.categoryType === "necklace" ? NECKLACE_SIZE_VALUE : values.sizeValue;

    const payload: CartItemInput = {
      ...values,
      id: values.id?.trim() || crypto.randomUUID(),
      sizeValue: normalizedSizeValue,
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

  const getReadyMadeInCartQuantity = (productId: string, excludeItemId?: string) =>
    items.reduce((acc, item) => {
      if (item.categoryType !== "ready-made" || item.productId !== productId || item.id === excludeItemId) {
        return acc;
      }

      return acc + item.quantity;
    }, 0);

  const getReadyMadeMaxQuantity = (productId: string, excludeItemId?: string) => {
    const stock = readyMadeStockMap.get(productId) ?? 0;
    const inCart = getReadyMadeInCartQuantity(productId, excludeItemId);
    return Math.max(0, stock - inCart);
  };

  const onAddReadyMadeProduct = (product: ReadyMadeProduct) => {
    const desiredQuantity = readyMadeQuantities[product.id] ?? 1;
    const maxQuantity = getReadyMadeMaxQuantity(product.id);

    if (maxQuantity <= 0) {
      setFormMessage(`預製作品「${product.name}」目前庫存不足`);
      return;
    }

    const quantity = Math.min(maxQuantity, Math.max(1, desiredQuantity));

    const payload: CartItemInput = {
      id: crypto.randomUUID(),
      productId: product.id,
      quantity,
      sizeValue: "現貨",
      colorScheme: READY_MADE_COLOR_FALLBACK,
      styleDescription: product.description,
      addOnCharmQuantity: 0,
      referenceImageUrl: "",
    };

    addItem(payload, {
      name: product.name,
      price: product.price,
      categoryType: "ready-made",
      allowCharm: false,
    });

    setReadyMadeQuantities((prev) => ({
      ...prev,
      [product.id]: 1,
    }));
    setFormMessage(`已加入預製作品：${product.name}`);
  };

  const onSubmitOrder = async (contactValues: CheckoutInput) => {
    if (items.length === 0) {
      setSubmitError("購物車為空，請先新增商品");
      return;
    }

    setSubmitError(null);
    setSubmitWarning(null);

    try {
      const sanitizedItems = items.map((item) => {
        const fallbackSizeValue =
          item.categoryType === "necklace"
            ? NECKLACE_SIZE_VALUE
            : item.categoryType === "bracelet"
              ? BRACELET_SIZES[0]
              : "現貨";

        const normalizedSizeValue = item.sizeValue.trim() || fallbackSizeValue;
        const normalizedColorScheme = COLOR_SCHEMES.includes(
          item.colorScheme as (typeof COLOR_SCHEMES)[number],
        )
          ? item.colorScheme
          : READY_MADE_COLOR_FALLBACK;
        const normalizedStyleDescription =
          item.styleDescription.trim() || (item.categoryType === "ready-made" ? "預製作品" : "款式由店家確認");

        return {
          ...item,
          sizeValue: normalizedSizeValue,
          colorScheme: normalizedColorScheme,
          styleDescription: normalizedStyleDescription,
          addOnCharmQuantity: item.allowCharm ? item.addOnCharmQuantity : 0,
          referenceImageUrl: item.referenceImageUrl || "",
        };
      });

      const materialAdjustmentText =
        contactValues.materialAdjustment === "accept"
          ? "若材料不足：是，接受調整"
          : "若材料不足：否，希望先聯絡確認";
      const identityText =
        contactValues.orderIdentityType === "school-member"
          ? `訂購者身分：竹女師生\n班級座號：${contactValues.schoolClassSeat.trim()}`
          : `訂購者身分：本帳工作人員親友\n姓名：${contactValues.friendFamilyName.trim()}`;

      const mergedNote = [contactValues.note, identityText, "營運須知：已同意", materialAdjustmentText]
        .filter(Boolean)
        .join("\n");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: sanitizedItems,
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
      const readyMadeResponse = await fetch("/api/ready-made-products");
      if (readyMadeResponse.ok) {
        const data = (await readyMadeResponse.json()) as { products: ReadyMadeProduct[] };
        setReadyMadeProducts(data.products);
      }
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
        <div className="space-y-4">
          <div className="space-y-4 rounded-3xl border border-rose-100 bg-white p-6 shadow-[0_12px_35px_-18px_rgba(173,95,121,0.4)]">
            <h2 className="text-lg font-semibold text-rose-950">商品客製區</h2>

          <form onSubmit={itemForm.handleSubmit(onAddOrUpdateItem)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">商品類型</label>
              <select
                className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                value={selectedProductId}
                onChange={(event) => onProductChange(event.target.value)}
                disabled={isCatalogLoading || catalogProducts.length === 0}
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomItemQuantity(itemForm.watch("quantity") - 1)}
                    className="h-10 w-10 rounded-xl border border-rose-200 bg-white text-base"
                  >
                    -
                  </button>
                  <span className="min-w-12 text-center text-sm font-medium text-stone-800">
                    {itemForm.watch("quantity")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomItemQuantity(itemForm.watch("quantity") + 1)}
                    className="h-10 w-10 rounded-xl border border-rose-200 bg-white text-base"
                  >
                    +
                  </button>
                </div>
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
                {selectedProduct?.categoryType === "ring" && (
                  <input
                    type="text"
                    placeholder="請輸入戒圍，例如：#8"
                    className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                    {...itemForm.register("sizeValue")}
                  />
                )}
                {selectedProduct?.categoryType === "necklace" && (
                  <input
                    type="text"
                    value="固定尺寸"
                    disabled
                    readOnly
                    className="w-full cursor-not-allowed rounded-2xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm text-stone-500"
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

          <div className="rounded-3xl border border-rose-100 bg-white p-6 shadow-[0_12px_35px_-18px_rgba(173,95,121,0.4)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-rose-950">預製作品區</h2>
                <p className="mt-1 text-xs text-stone-500">此區會自動依庫存更新，售完即不顯示。</p>
              </div>
              {isReadyMadeLoading ? <span className="text-xs text-stone-500">載入中...</span> : null}
            </div>

            {readyMadeProducts.length === 0 && !isReadyMadeLoading ? (
              <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3 text-sm text-stone-600">
                目前沒有可購買的預製作品
              </p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {readyMadeProducts.map((product) => {
                  const maxQuantity = getReadyMadeMaxQuantity(product.id);
                  const currentInCart = getReadyMadeInCartQuantity(product.id);

                  return (
                    <article key={product.id} className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4">
                      {product.imageUrl ? (
                        <div className="mb-3 overflow-hidden rounded-xl border border-rose-100">
                          <Image
                            src={product.imageUrl}
                            alt={`${product.name} 預製作品照片`}
                            width={800}
                            height={500}
                            className="h-auto max-h-72 w-full object-contain bg-stone-50"
                          />
                        </div>
                      ) : null}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-stone-800">{product.name}</h3>
                        <p className="text-sm font-semibold text-rose-900">{formatCurrency(product.price)}</p>
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-stone-600">{product.description}</p>
                      <p className="mt-2 text-xs text-stone-600">
                        庫存：{product.stock}，已放入購物車：{currentInCart}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setReadyMadeQuantities((prev) => ({
                              ...prev,
                              [product.id]: Math.max(1, (prev[product.id] ?? 1) - 1),
                            }))
                          }
                          disabled={maxQuantity <= 0}
                          className="h-8 w-8 rounded-lg border border-rose-200 bg-white text-sm disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="min-w-10 text-center text-sm font-medium text-stone-800">
                          {Math.max(1, Math.min(maxQuantity || 1, readyMadeQuantities[product.id] ?? 1))}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setReadyMadeQuantities((prev) => ({
                              ...prev,
                              [product.id]: Math.min(Math.max(1, maxQuantity), (prev[product.id] ?? 1) + 1),
                            }))
                          }
                          disabled={maxQuantity <= 0}
                          className="h-8 w-8 rounded-lg border border-rose-200 bg-white text-sm disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => onAddReadyMadeProduct(product)}
                          disabled={maxQuantity <= 0}
                          className="rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {maxQuantity > 0 ? "加入購物車" : "庫存不足"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
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
                  {item.categoryType !== "necklace" && item.categoryType !== "ready-made" ? (
                    <p className="mt-1 text-xs text-stone-600">尺寸：{item.sizeValue}</p>
                  ) : null}
                  {item.categoryType !== "ready-made" ? (
                    <p className="text-xs text-stone-600">配色：{item.colorScheme}</p>
                  ) : (
                    <p className="text-xs text-stone-600">現貨作品</p>
                  )}
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="h-8 w-8 rounded-lg border border-rose-200 bg-white text-sm"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center text-sm font-medium text-stone-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const maxQuantity =
                            item.categoryType === "ready-made"
                              ? getReadyMadeMaxQuantity(item.productId, item.id) + item.quantity
                              : 99;
                          updateQuantity(item.id, Math.min(maxQuantity, item.quantity + 1));
                        }}
                        className="h-8 w-8 rounded-lg border border-rose-200 bg-white text-sm"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-medium text-rose-900">
                      {formatCurrency(calculateCartItemSubtotal(item))}
                    </p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {item.categoryType !== "ready-made" ? (
                      <button
                        type="button"
                        onClick={() => onEditItem(item.id)}
                        className="rounded-xl border border-rose-200 px-2 py-1 text-xs text-stone-700 hover:bg-white"
                      >
                        編輯
                      </button>
                    ) : null}
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/35 px-4 py-6 sm:items-center">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-rose-100 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="text-lg font-semibold text-rose-950">填寫聯絡資訊</h3>
              <button
                type="button"
                onClick={() => setIsContactOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
              >
                關閉
              </button>
            </div>

            <form onSubmit={checkoutForm.handleSubmit(onSubmitOrder)} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-3 overflow-y-auto pr-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium text-stone-800">Gmail（必填）</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      className="w-full rounded-2xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-sm"
                      required
                      {...checkoutForm.register("customerGmail")}
                    />
                    <p className="text-xs text-rose-500">
                      {checkoutForm.formState.errors.customerGmail?.message}
                    </p>
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

                <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50/70 p-3">
                  <p className="text-sm font-semibold text-red-600">
                    不接受除竹女師生及本帳工作人員親友外之陌生訂單
                  </p>
                </div>

                <div className="space-y-2 rounded-2xl border border-rose-100 bg-rose-50/40 p-3">
                  <p className="text-sm font-medium text-stone-800">您的身分（可代訂）</p>
                  <label className="flex items-center gap-2 text-sm text-stone-800">
                    <input type="radio" value="school-member" {...checkoutForm.register("orderIdentityType")} />
                    <span>竹女師生</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-stone-800">
                    <input type="radio" value="friend-family" {...checkoutForm.register("orderIdentityType")} />
                    <span>本帳工作人員親友</span>
                  </label>
                  <p className="text-xs text-rose-500">
                    {checkoutForm.formState.errors.orderIdentityType?.message}
                  </p>

                  {checkoutForm.watch("orderIdentityType") === "school-member" ? (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-stone-800">班級座號</label>
                      <input
                        type="text"
                        placeholder="例如：312 班 18 號"
                        className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm"
                        {...checkoutForm.register("schoolClassSeat")}
                      />
                      <p className="text-xs text-rose-500">
                        {checkoutForm.formState.errors.schoolClassSeat?.message}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-stone-800">姓名</label>
                      <input
                        type="text"
                        placeholder="請填寫親友姓名"
                        className="w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm"
                        {...checkoutForm.register("friendFamilyName")}
                      />
                      <p className="text-xs text-rose-500">
                        {checkoutForm.formState.errors.friendFamilyName?.message}
                      </p>
                    </div>
                  )}
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
              </div>

              <div className="mt-4 border-t border-rose-100 pt-3">
                <button
                  type="submit"
                  disabled={checkoutForm.formState.isSubmitting}
                  className="w-full rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                >
                  {checkoutForm.formState.isSubmitting ? "送出中..." : "送出訂單"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

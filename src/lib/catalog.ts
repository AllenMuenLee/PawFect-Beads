export type CategoryType = "bracelet" | "ring" | "necklace";

export type ProductCatalogItem = {
  id: string;
  name: string;
  price: number;
  categoryType: CategoryType;
  allowCharm: boolean;
  isActive?: boolean;
};

export const PRODUCT_CATALOG: ProductCatalogItem[] = [
  {
    id: "bracelet-basic",
    name: "\u7121\u9020\u578b\u4e32\u73e0\u624b\u934a",
    price: 65,
    categoryType: "bracelet",
    allowCharm: true,
  },
  {
    id: "bracelet-signature",
    name: "\u4e3b\u6253\u6b3e\u9020\u578b\u624b\u934a\uff08\u6afb\u6843\u6216\u4e09\u6735\u82b1\uff08\u542b\uff09\u4ee5\u4e0b\u6db5\u84cb\u5728\u6b64\u985e\uff09",
    price: 130,
    categoryType: "bracelet",
    allowCharm: true,
  },
  {
    id: "bracelet-deluxe",
    name: "\u7cbe\u7dfb\u6b3e\u624b\u934a\uff08\u8774\u8776\u7d50\u6b3e\u6216\u591a\u65bc\u4e09\u6735\u82b1\uff09",
    price: 190,
    categoryType: "bracelet",
    allowCharm: true,
  },
  {
    id: "ring-basic",
    name: "\u5168\u7d20\u6212\u6307",
    price: 30,
    categoryType: "ring",
    allowCharm: false,
  },
  {
    id: "ring-style",
    name: "\u9020\u578b\u6212\u6307",
    price: 65,
    categoryType: "ring",
    allowCharm: false,
  },
  {
    id: "necklace-short-basic",
    name: "\u5168\u7d20\u77ed\u6b3e\u9805\u934a",
    price: 220,
    categoryType: "necklace",
    allowCharm: true,
  },
  {
    id: "necklace-short-style",
    name: "\u9020\u578b\u77ed\u6b3e\u9805\u934a",
    price: 370,
    categoryType: "necklace",
    allowCharm: true,
  },
  {
    id: "necklace-long",
    name: "\u9577\u6b3e\u9805\u934a\uff08\u9577\u65bc\u9396\u9aa8 \u4e0d\u5206\u6b3e\uff09",
    price: 500,
    categoryType: "necklace",
    allowCharm: true,
  },
];

export const BRACELET_SIZES = ["13", "14", "15", "16", "17"] as const;
export const NECKLACE_SIZES = ["\u77ed\u9805\u934a\uff08\u9396\u9aa8\u4ee5\u4e0a\uff09", "\u9577\u9805\u934a\uff08\u9396\u9aa8\u4ee5\u4e0b\uff09"] as const;
export const COLOR_SCHEMES = [
  "\u91d1\u5c6c\u8272\u7cfb",
  "\u7da0\u8272\u7cfb",
  "\u7c89\u8272\u7cfb",
  "\u9ec3\u8272\u7cfb",
  "\u85cd\u8272\u7cfb",
  "\u4ea4\u7531\u6211\u5011\u96a8\u5fc3\u914d",
] as const;

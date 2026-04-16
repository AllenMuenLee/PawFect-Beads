export type CategoryType = "bracelet" | "ring" | "necklace" | "ready-made";

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
    name: "無造型串珠手鍊",
    price: 65,
    categoryType: "bracelet",
    allowCharm: true,
  },
  {
    id: "bracelet-signature",
    name: "主打款造型手鍊（櫻桃或三朵花（含）以下涵蓋在此類）",
    price: 130,
    categoryType: "bracelet",
    allowCharm: true,
  },
  {
    id: "bracelet-deluxe",
    name: "精緻款手鍊（蝴蝶結款或多於三朵花）",
    price: 190,
    categoryType: "bracelet",
    allowCharm: true,
  },
  {
    id: "ring-basic",
    name: "全素戒指",
    price: 30,
    categoryType: "ring",
    allowCharm: false,
  },
  {
    id: "ring-style",
    name: "造型戒指",
    price: 65,
    categoryType: "ring",
    allowCharm: false,
  },
  {
    id: "necklace-short-basic",
    name: "全素短款項鍊",
    price: 220,
    categoryType: "necklace",
    allowCharm: true,
  },
  {
    id: "necklace-short-style",
    name: "造型短款項鍊",
    price: 370,
    categoryType: "necklace",
    allowCharm: true,
  },
  {
    id: "necklace-long",
    name: "長款項鍊（長於鎖骨 不分款）",
    price: 500,
    categoryType: "necklace",
    allowCharm: true,
  },
];

export const BRACELET_SIZES = ["13", "14", "15", "16", "17"] as const;
export const NECKLACE_SIZES = ["短項鍊（鎖骨以上）", "長項鍊（鎖骨以下）"] as const;
export const COLOR_SCHEMES = [
  "金屬色系",
  "綠色系",
  "粉色系",
  "黃色系",
  "藍色系",
  "交由我們隨心配",
] as const;

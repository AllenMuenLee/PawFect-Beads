export const ORDER_STATUS = {
  PROCESSING: "processing",
  COMPLETED: "completed",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export function getOrderStatusLabel(status: string) {
  switch (status) {
    case ORDER_STATUS.COMPLETED:
      return "已完成";
    case ORDER_STATUS.PROCESSING:
      return "處理中";
    default:
      return status;
  }
}

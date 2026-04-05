import nodemailer from "nodemailer";

import { ADD_ON_CHARM_PRICE, formatCurrency } from "@/src/lib/cart";

export type EmailOrderItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  sizeValue: string;
  colorScheme: string;
  styleDescription: string;
  addOnCharm: boolean;
  addOnCharmQuantity: number;
  referenceImageUrl?: string | null;
};

export type EmailOrderPayload = {
  orderNumber: string;
  createdAt: Date;
  totalAmount: number;
  customerGmail: string | null;
  customerInstagram: string | null;
  customerLine: string | null;
  note: string | null;
  items: EmailOrderItem[];
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP 環境變數未完整設定");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE ?? "false") === "true",
    auth: { user, pass },
  });
}

function buildItemsHtml(items: EmailOrderItem[]) {
  return items
    .map((item, index) => {
      const addOnLineTotal = item.addOnCharmQuantity * ADD_ON_CHARM_PRICE;
      const lineTotal = item.unitPrice * item.quantity + addOnLineTotal;
      const imageText = item.referenceImageUrl ? `<a href="${item.referenceImageUrl}">${item.referenceImageUrl}</a>` : "未提供";

      return `
        <div style="margin-bottom:16px;padding:12px;border:1px solid #eee;border-radius:10px;">
          <div><strong>項目 ${index + 1}</strong></div>
          <div>商品：${item.productName}</div>
          <div>單價：${formatCurrency(item.unitPrice)}</div>
          <div>小綴飾：${item.addOnCharmQuantity > 0 ? `x ${item.addOnCharmQuantity} (${formatCurrency(addOnLineTotal)})` : "未加購"}</div>
          <div>數量：${item.quantity}</div>
          <div>尺寸：${item.sizeValue}</div>
          <div>配色：${item.colorScheme}</div>
          <div>款式描述：${item.styleDescription}</div>
          <div>參考圖片：${imageText}</div>
          <div>小計：${formatCurrency(lineTotal)}</div>
        </div>
      `;
    })
    .join("\n");
}

export async function sendOwnerOrderEmail(payload: EmailOrderPayload) {
  const ownerEmail = process.env.OWNER_EMAIL;
  const from = process.env.MAIL_FROM;

  if (!ownerEmail || !from) {
    throw new Error("OWNER_EMAIL 或 MAIL_FROM 未設定");
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: ownerEmail,
    subject: `【新訂單】${payload.orderNumber}`,
    html: `
      <h2>PawFect Beads-韓式串珠 新訂單</h2>
      <p>訂單編號：<strong>${payload.orderNumber}</strong></p>
      <p>下單時間：${payload.createdAt.toLocaleString("zh-TW", { hour12: false })}</p>
      <hr />
      <h3>聯絡資訊</h3>
      <p>Gmail：${payload.customerGmail ?? "未提供"}</p>
      <p>Instagram：${payload.customerInstagram ?? "未提供"}</p>
      <p>LINE：${payload.customerLine ?? "未提供"}</p>
      <p>備註：${payload.note ?? "無"}</p>
      <hr />
      <h3>訂單項目</h3>
      ${buildItemsHtml(payload.items)}
      <hr />
      <p><strong>總金額：${formatCurrency(payload.totalAmount)}</strong></p>
    `,
  });
}

export async function sendCustomerConfirmationEmail(payload: EmailOrderPayload) {
  const from = process.env.MAIL_FROM;

  if (!payload.customerGmail || !from) {
    throw new Error("缺少客戶 Gmail 或 MAIL_FROM 未設定");
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: payload.customerGmail,
    subject: `【訂單已收到】${payload.orderNumber}｜PawFect Beads-韓式串珠`,
    html: `
      <h2>我們已收到您的訂單</h2>
      <p>訂單編號：<strong>${payload.orderNumber}</strong></p>
      <p>非常感謝您的訂製，我們會盡快透過您提供的聯絡方式與您確認細節。</p>
      <hr />
      <h3>訂單摘要</h3>
      ${buildItemsHtml(payload.items)}
      <p><strong>總金額：${formatCurrency(payload.totalAmount)}</strong></p>
      <hr />
      <p>品牌：PawFect Beads-韓式串珠</p>
    `,
  });
}

export async function sendCustomerPickupReadyEmail(payload: EmailOrderPayload, pickupTime: string) {
  const from = process.env.MAIL_FROM;

  if (!payload.customerGmail || !from) {
    throw new Error("缺少客戶 Gmail 或 MAIL_FROM 未設定");
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from,
    to: payload.customerGmail,
    subject: `【可領件通知】${payload.orderNumber}｜PawFect Beads-韓式串珠`,
    html: `
      <h2>您的訂單已製作完成</h2>
      <p>訂單編號：<strong>${payload.orderNumber}</strong></p>
      <p>請在（${pickupTime}）的時候於新竹女中正門口面交。</p>
      <hr />
      <h3>訂單清單</h3>
      ${buildItemsHtml(payload.items)}
      <p><strong>總金額：${formatCurrency(payload.totalAmount)}</strong></p>
      <hr />
      <p>品牌：PawFect Beads-韓式串珠</p>
    `,
  });
}

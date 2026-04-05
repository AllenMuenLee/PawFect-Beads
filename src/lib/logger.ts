import { prisma } from "@/src/lib/prisma";

type EmailLogInput = {
  orderId: string;
  recipient: string;
  emailType: "owner" | "customer";
  status: "sent" | "failed" | "skipped";
  errorMessage?: string;
};

export async function writeEmailLog(input: EmailLogInput) {
  const safeError = input.errorMessage ? input.errorMessage.slice(0, 500) : null;

  await prisma.emailLog.create({
    data: {
      orderId: input.orderId,
      recipient: input.recipient,
      emailType: input.emailType,
      status: input.status,
      errorMessage: safeError,
    },
  });

  if (input.status === "failed") {
    console.error("[EMAIL_FAILED]", {
      orderId: input.orderId,
      emailType: input.emailType,
      recipient: input.recipient,
      errorMessage: safeError,
    });
  }
}

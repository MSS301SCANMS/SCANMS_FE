export const MAX_PAYOUT_BILL_BYTES = 5 * 1024 * 1024;

export function validatePayoutBill(
  file: File,
  serverLimit = MAX_PAYOUT_BILL_BYTES,
): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const supported =
    (file.type === "image/jpeg" &&
      (extension === "jpg" || extension === "jpeg")) ||
    (file.type === "image/png" && extension === "png") ||
    (file.type === "application/pdf" && extension === "pdf");
  if (!supported) return "Chỉ chấp nhận chứng từ JPG, PNG hoặc PDF.";
  if (!file.size) return "Tệp chứng từ không được rỗng.";
  const limit = Math.min(serverLimit, MAX_PAYOUT_BILL_BYTES);
  if (file.size > limit)
    return `Chứng từ vượt quá giới hạn ${(limit / 1048576).toFixed(1)} MB.`;
  return "";
}

export function maskBankAccount(account: string | null): string {
  return account ? `**** ${account.slice(-4)}` : "Chưa cập nhật";
}

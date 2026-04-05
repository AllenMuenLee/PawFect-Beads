export function generateOrderNumber(now: Date = new Date()) {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000 + 1000);

  return `PFB-${yyyy}${mm}${dd}-${random}`;
}

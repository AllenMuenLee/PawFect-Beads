function addDays(baseDate: Date, days: number) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

export function getEstimatedDeliveryWindow(baseDate: Date = new Date()) {
  const start = addDays(baseDate, 5);
  const end = addDays(baseDate, 7);

  return {
    startDate: start,
    endDate: end,
    text: `${formatDate(start)} ~ ${formatDate(end)}`,
  };
}


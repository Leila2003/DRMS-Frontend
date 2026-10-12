// Amounts are stored as whole integers (RWF) in the backend.
const currency = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return currency.format(Number(value));
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const BOOKING_STATUS_STYLES = {
  active: "success",
  due: "warning",
  overdue: "danger",
  returned: "default",
  damaged: "purple",
};

export const ITEM_CONDITION_LABELS = {
  pending: "Pending",
  good: "Good",
  damaged: "Damaged",
  missing: "Missing",
};

export const NOTIFICATION_TYPE_STYLES = {
  info: "primary",
  warn: "warning",
  alert: "danger",
};

export const ROLE_LABELS = {
  super_admin: "Platform Admin",
  business_admin: "Business Admin",
  staff: "Staff",
};

// The backend returns bare arrays (not paginated envelopes) for
// /bookings, /customers, /categories and /notifications, so list pages
// filter, search and paginate client-side.

export function filterBySearch(items, term, getFields) {
  const needle = term.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) =>
    getFields(item).some((field) => String(field ?? "").toLowerCase().includes(needle))
  );
}

export function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    totalPages,
  };
}

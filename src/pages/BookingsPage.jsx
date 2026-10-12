import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PackageCheck, Pencil, Plus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { api, apiErrorMessage } from "../lib/api";
import { filterBySearch, paginate } from "../lib/list";
import {
  BOOKING_STATUS_STYLES,
  ITEM_CONDITION_LABELS,
  formatDate,
  formatMoney,
} from "../lib/format";
import Spinner from "../components/Spinner";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Label from "../components/ui/label";
import Select from "../components/ui/select";
import Textarea from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const STATUS_FILTERS = ["all", "active", "due", "overdue", "returned", "damaged"];
const PAGE_SIZE = 10;
const RETURNABLE_STATUSES = new Set(["active", "due", "overdue"]);

const CAUTION_OUTCOME_LABELS = {
  refunded: "Returned to customer",
  kept: "Kept by business",
};

function ReturnDialog({ booking, onClose, onReturned }) {
  const hasCaution = booking.caution > 0;
  const [condition, setCondition] = useState("good");
  const [notes, setNotes] = useState("");
  const [cautionOutcome, setCautionOutcome] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (hasCaution && !cautionOutcome) {
      setError("Choose whether the caution is returned to the customer or kept.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post(`/bookings/${booking.booking_id}/return`, {
        condition,
        notes: notes || undefined,
        caution_outcome: hasCaution ? cautionOutcome : undefined,
      });
      onReturned(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not process the return"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process return</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500">
          {booking.customer?.name} —{" "}
          {(booking.items ?? []).map((it) => `${it.quantity}× ${it.category_name}`).join(", ")}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="condition">Item condition</Label>
            <Select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)}>
              {Object.entries(ITEM_CONDITION_LABELS)
                .filter(([value]) => value !== "pending")
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </Select>
          </div>

          {hasCaution && (
            <div className="space-y-1.5">
              <Label htmlFor="caution_outcome">Caution ({formatMoney(booking.caution)})</Label>
              <Select
                id="caution_outcome"
                value={cautionOutcome}
                onChange={(e) => setCautionOutcome(e.target.value)}
              >
                <option value="">Select…</option>
                {Object.entries(CAUTION_OUTCOME_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details about the condition of the returned items…"
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4 text-white" />}
              Confirm return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditBookingDialog({ bookingId, onClose, onUpdated }) {
  const [form, setForm] = useState(null);
  const [lines, setLines] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        if (cancelled) return;
        const categoryNames = Object.fromEntries(
          data.items.map((it) => [it.category_id, it.category_name])
        );
        setForm({
          event_date: data.event_date ?? "",
          pickup_date: data.pickup_date,
          return_date: data.return_date,
          caution: data.caution ? String(data.caution) : "",
        });
        setLines(
          data.lines.map((line) => ({
            booking_item_id: line.booking_item_id,
            category_name: categoryNames[line.category_id] ?? "Item",
            quantity: String(line.quantity),
            unit_price: String(line.unit_price),
          }))
        );
      } catch (err) {
        if (!cancelled) setLoadError(apiErrorMessage(err, "Could not load booking"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function updateLine(index, field) {
    return (e) =>
      setLines((prev) =>
        prev.map((line, i) => (i === index ? { ...line, [field]: e.target.value } : line))
      );
  }

  const rentalTotal = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0),
    0
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.return_date < form.pickup_date) {
      setError("Return date must be on or after the pickup date");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.put(`/bookings/${bookingId}`, {
        event_date: form.event_date || null,
        pickup_date: form.pickup_date,
        return_date: form.return_date,
        caution: Number(form.caution) || 0,
        lines: lines.map((line) => ({
          booking_item_id: line.booking_item_id,
          quantity: Number(line.quantity),
          unit_price: Number(line.unit_price),
        })),
      });
      onUpdated(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update booking"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit booking</DialogTitle>
        </DialogHeader>

        {!form && !loadError && (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {loadError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{loadError}</p>
        )}

        {form && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit_event_date">Event</Label>
                <Input id="edit_event_date" type="date" value={form.event_date} onChange={update("event_date")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_pickup_date">Pickup</Label>
                <Input id="edit_pickup_date" type="date" required value={form.pickup_date} onChange={update("pickup_date")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_return_date">Return</Label>
                <Input id="edit_return_date" type="date" required value={form.return_date} onChange={update("return_date")} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Items
              </p>
              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div key={line.booking_item_id} className="grid grid-cols-[1fr_5rem_7rem] items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {line.category_name}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      required
                      aria-label={`${line.category_name} quantity`}
                      value={line.quantity}
                      onChange={updateLine(index, "quantity")}
                    />
                    <Input
                      type="number"
                      min={0}
                      required
                      aria-label={`${line.category_name} unit price`}
                      value={line.unit_price}
                      onChange={updateLine(index, "unit_price")}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_caution">Caution (optional)</Label>
              <Input
                id="edit_caution"
                type="number"
                min={0}
                placeholder="0"
                value={form.caution}
                onChange={update("caution")}
              />
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-slate-900">
              <span>New total</span>
              <span className="tabular-nums">
                {formatMoney(rentalTotal + (Number(form.caution) || 0))}
              </span>
            </div>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Spinner className="h-4 w-4 text-white" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BookingDetailDialog({ bookingId, canEdit, onClose, onReturn, onEdit }) {
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        if (!cancelled) setBooking(data);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load booking"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{booking ? booking.customer?.name : "Booking details"}</DialogTitle>
          {booking && <p className="text-sm text-slate-500">{booking.customer?.contact}</p>}
        </DialogHeader>

        {!booking && !error && (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6" />
          </div>
        )}

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {booking && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={BOOKING_STATUS_STYLES[booking.status]}>{booking.status}</Badge>
              <span className="text-xs text-slate-400">Booked {formatDate(booking.created_at)}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-lg bg-slate-50 py-2.5">
                <p className="font-semibold text-slate-900">{formatDate(booking.event_date)}</p>
                <p className="text-xs text-slate-500">Event</p>
              </div>
              <div className="rounded-lg bg-slate-50 py-2.5">
                <p className="font-semibold text-slate-900">{formatDate(booking.pickup_date)}</p>
                <p className="text-xs text-slate-500">Pickup</p>
              </div>
              <div className="rounded-lg bg-slate-50 py-2.5">
                <p className="font-semibold text-slate-900">{formatDate(booking.return_date)}</p>
                <p className="text-xs text-slate-500">Return</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Items
              </p>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booking.items.map((it) => (
                      <TableRow key={it.category_id}>
                        <TableCell className="font-medium text-slate-900">
                          {it.category_name}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(it.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {["returned", "damaged"].includes(booking.status) && booking.lines?.[0] && (
              <p className="text-sm text-slate-600">
                Returned condition:{" "}
                <span className="font-medium text-slate-900">
                  {ITEM_CONDITION_LABELS[booking.lines[0].condition]}
                </span>
              </p>
            )}

            <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Rental total</span>
                <span className="tabular-nums text-slate-900">{formatMoney(booking.price)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>
                  Caution
                  {booking.caution > 0 && booking.caution_outcome && (
                    <> · {CAUTION_OUTCOME_LABELS[booking.caution_outcome]}</>
                  )}
                </span>
                <span className="tabular-nums text-slate-900">{formatMoney(booking.caution)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-slate-900">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(booking.total_amount)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {booking && canEdit && RETURNABLE_STATUSES.has(booking.status) && (
            <Button type="button" variant="outline" onClick={() => onEdit(booking)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          {booking && RETURNABLE_STATUSES.has(booking.status) && (
            <Button type="button" onClick={() => onReturn(booking)}>
              <PackageCheck className="h-3.5 w-3.5" />
              Process return
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingsPage() {
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [returningBooking, setReturningBooking] = useState(null);
  const [viewingBookingId, setViewingBookingId] = useState(null);
  const [editingBookingId, setEditingBookingId] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "business_admin";

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/bookings");
      setBookings(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load bookings"));
      setBookings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Debounce the search box.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!bookings) return [];
    const byStatus = status === "all" ? bookings : bookings.filter((b) => b.status === status);
    return filterBySearch(byStatus, search, (b) => [b.customer?.name, b.customer?.contact]);
  }, [bookings, status, search]);

  const { items, total, totalPages } = paginate(filtered, page, PAGE_SIZE);

  function handleReturned(updated) {
    setBookings((prev) =>
      prev.map((b) => (b.booking_id === updated.booking_id ? { ...b, ...updated } : b))
    );
    setReturningBooking(null);
  }

  function handleUpdated(updated) {
    setBookings((prev) =>
      prev.map((b) => (b.booking_id === updated.booking_id ? { ...b, ...updated } : b))
    );
    setEditingBookingId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">{bookings ? `${total} total` : " "}</p>
        </div>
        <Button asChild variant="primary">
          <Link to="/bookings/new">
            <Plus className="h-4 w-4" />
            New booking
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <TabsList>
            {STATUS_FILTERS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {value}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Input
          type="search"
          placeholder="Search customer…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="ml-auto w-56"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Return</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Caution</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10">
                  <div className="flex justify-center">
                    <Spinner className="h-6 w-6" />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading && error && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-rose-600">
                  {error}
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                  No bookings found.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              !error &&
              items.map((booking) => (
                <TableRow
                  key={booking.booking_id}
                  className="cursor-pointer"
                  onClick={() => setViewingBookingId(booking.booking_id)}
                >
                  <TableCell>
                    <div className="font-medium text-slate-900">{booking.customer?.name}</div>
                    <div className="text-xs text-slate-500">{booking.customer?.contact}</div>
                  </TableCell>
                  <TableCell>
                    {(booking.items ?? [])
                      .map((it) => `${it.quantity}× ${it.category_name}`)
                      .join(", ") || "—"}
                  </TableCell>
                  <TableCell>{formatDate(booking.pickup_date)}</TableCell>
                  <TableCell>{formatDate(booking.return_date)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(booking.price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(booking.caution)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={BOOKING_STATUS_STYLES[booking.status]}>{booking.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {viewingBookingId && (
        <BookingDetailDialog
          bookingId={viewingBookingId}
          canEdit={isAdmin}
          onClose={() => setViewingBookingId(null)}
          onEdit={(booking) => {
            setViewingBookingId(null);
            setEditingBookingId(booking.booking_id);
          }}
          onReturn={(booking) => {
            setViewingBookingId(null);
            setReturningBooking(booking);
          }}
        />
      )}

      {editingBookingId && (
        <EditBookingDialog
          bookingId={editingBookingId}
          onClose={() => setEditingBookingId(null)}
          onUpdated={handleUpdated}
        />
      )}

      {returningBooking && (
        <ReturnDialog
          booking={returningBooking}
          onClose={() => setReturningBooking(null)}
          onReturned={handleReturned}
        />
      )}
    </div>
  );
}

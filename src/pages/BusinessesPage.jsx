import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, Power, UserRound } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { filterBySearch, paginate } from "../lib/list";
import { formatDate, formatMoney } from "../lib/format";
import Spinner from "../components/Spinner";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
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

const PAGE_SIZE = 10;
const STATUS_FILTERS = ["all", "active", "inactive"];
const COLUMN_COUNT = 7;

function StatusBadge({ active }) {
  return <Badge variant={active ? "success" : "default"}>{active ? "active" : "inactive"}</Badge>;
}

function DetailRow({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </span>
      <span className="text-sm text-slate-500">{label}</span>
      <span className="ml-auto truncate text-sm font-semibold text-slate-900">{children || "—"}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
      <p className="text-xl font-extrabold tracking-tight tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function BusinessDetailDialog({ business, onClose, onStatusChanged }) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    setSubmitting(true);
    setError("");
    try {
      const action = business.is_active ? "deactivate" : "reactivate";
      const { data } = await api.patch(`/businesses/${business.business_id}/${action}`);
      setConfirming(false);
      onStatusChanged(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not change the business status"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{business.name}</DialogTitle>
            <StatusBadge active={business.is_active} />
          </div>
          <p className="text-sm text-slate-500">Joined {formatDate(business.created_at)}</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="Bookings" value={business.bookings_count} />
          <Metric label="Active rentals" value={business.active_rentals} />
          <Metric label="Staff" value={business.staff_count} />
          <Metric label="Customers" value={business.customers_count} />
        </div>

        <div className="mt-5 rounded-2xl bg-slate-900 px-5 py-4 text-white">
          <p className="text-xs font-semibold text-slate-400">Revenue to date</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums text-honey-300">
            {formatMoney(business.revenue)}
          </p>
        </div>

        <p className="mb-1 mt-6 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          Business
        </p>
        <DetailRow icon={<Phone className="h-4 w-4" />} label="Business phone">{business.phone}</DetailRow>

        <p className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          Owner
        </p>
        <DetailRow icon={<UserRound className="h-4 w-4" />} label="Name">{business.owner_name}</DetailRow>
        <DetailRow icon={<Mail className="h-4 w-4" />} label="Email">{business.owner_email}</DetailRow>
        <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone">{business.owner_phone}</DetailRow>

        {confirming && business.is_active && (
          <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Deactivating <span className="font-bold">{business.name}</span> signs out its owner and
            staff and blocks them from logging in. Their data is kept, and you can activate the
            business again at any time.
          </p>
        )}

        {error && (
          <p className="mt-5 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={confirming ? () => setConfirming(false) : onClose}
          >
            {confirming ? "Cancel" : "Close"}
          </Button>
          {business.is_active ? (
            <Button
              type="button"
              variant="destructive"
              disabled={submitting}
              onClick={confirming ? handleToggle : () => setConfirming(true)}
            >
              {submitting ? <Spinner className="h-4 w-4 text-white" /> : <Power />}
              {confirming ? "Yes, deactivate" : "Deactivate business"}
            </Button>
          ) : (
            <Button type="button" variant="primary" disabled={submitting} onClick={handleToggle}>
              {submitting ? <Spinner className="h-4 w-4" /> : <Power />}
              Activate business
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/businesses");
      setBusinesses(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load businesses"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!businesses) return [];
    const byStatus =
      status === "all"
        ? businesses
        : businesses.filter((b) => (status === "active" ? b.is_active : !b.is_active));
    return filterBySearch(byStatus, search, (b) => [b.name, b.phone, b.owner_name, b.owner_email]);
  }, [businesses, status, search]);

  const { items, total, totalPages } = paginate(filtered, page, PAGE_SIZE);

  return (
    <div>
      <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-honey-700">Platform</p>
      <h1 className="page-title mt-1">Businesses</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Every business on DRMS, with its bookings and team size.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
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
          placeholder="Search business or owner…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="ml-auto w-64"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Staff</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-10">
                  <div className="flex justify-center">
                    <Spinner className="h-6 w-6" />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-rose-600">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT} className="py-10 text-center text-slate-500">
                  No businesses found.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              !error &&
              items.map((business) => (
                <TableRow
                  key={business.business_id}
                  className="cursor-pointer"
                  onClick={() => setSelected(business)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-extrabold text-honey-300">
                        {business.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">{business.name}</div>
                        <div className="text-xs text-slate-500">{business.phone || "No phone"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-700">{business.owner_name || "—"}</div>
                    <div className="text-xs text-slate-500">{business.owner_email}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold tabular-nums text-slate-900">{business.bookings_count}</span>
                    {business.active_rentals > 0 && (
                      <div className="text-xs text-slate-500">{business.active_rentals} active</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums text-slate-900">
                    {business.staff_count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(business.revenue)}</TableCell>
                  <TableCell>{formatDate(business.created_at)}</TableCell>
                  <TableCell>
                    <StatusBadge active={business.is_active} />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm">
          <span className="text-slate-500">
            {total} {total === 1 ? "business" : "businesses"} · Page {page} of {totalPages}
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

      {selected && (
        <BusinessDetailDialog
          business={selected}
          onClose={() => setSelected(null)}
          onStatusChanged={(updated) => {
            setBusinesses((prev) =>
              prev.map((b) => (b.business_id === updated.business_id ? updated : b))
            );
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}

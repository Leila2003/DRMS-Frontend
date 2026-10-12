import { useCallback, useEffect, useMemo, useState } from "react";
import { IdCard, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { api, apiErrorMessage, assetUrl } from "../lib/api";
import { filterBySearch, paginate } from "../lib/list";
import { BOOKING_STATUS_STYLES, formatDate, formatMoney } from "../lib/format";
import Spinner from "../components/Spinner";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Label from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
const EMPTY_FORM = { name: "", contact: "", referral_name: "", referral_phone: "" };

function AddCustomerDialog({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("contact", form.contact);
      if (form.referral_name) body.append("referral_name", form.referral_name);
      if (form.referral_phone) body.append("referral_phone", form.referral_phone);
      if (photo) body.append("national_id_photo", photo);
      const { data } = await api.post("/customers", body);
      onCreated(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create customer"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={form.name} onChange={update("name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact">Contact (phone)</Label>
            <Input id="contact" required value={form.contact} onChange={update("contact")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="referral_name">Referral name</Label>
              <Input id="referral_name" value={form.referral_name} onChange={update("referral_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="referral_phone">Referral phone</Label>
              <Input id="referral_phone" value={form.referral_phone} onChange={update("referral_phone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="national_id_photo">National ID photo </Label>
            <input
              id="national_id_photo"
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4 text-white" />}
              Add customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCustomerDialog({ customer, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: customer.name,
    contact: customer.contact,
    referral_name: customer.referral_name ?? "",
    referral_phone: customer.referral_phone ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.put(`/customers/${customer.customer_id}`, {
        name: form.name,
        contact: form.contact,
        referral_name: form.referral_name || null,
        referral_phone: form.referral_phone || null,
      });
      onUpdated(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update customer"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit_name">Name</Label>
            <Input id="edit_name" required value={form.name} onChange={update("name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit_contact">Contact (phone)</Label>
            <Input id="edit_contact" required value={form.contact} onChange={update("contact")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit_referral_name">Referral name</Label>
              <Input id="edit_referral_name" value={form.referral_name} onChange={update("referral_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_referral_phone">Referral phone</Label>
              <Input id="edit_referral_phone" value={form.referral_phone} onChange={update("referral_phone")} />
            </div>
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
      </DialogContent>
    </Dialog>
  );
}

function DeleteCustomerDialog({ customer, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setSubmitting(true);
    setError("");
    try {
      await api.delete(`/customers/${customer.customer_id}`);
      onDeleted(customer);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not delete customer"));
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete customer</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Delete <span className="font-medium text-slate-900">{customer.name}</span> (
          {customer.contact})? They will no longer appear in your customer list.
        </p>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={submitting} onClick={handleDelete}>
            {submitting && <Spinner className="h-4 w-4 text-white" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomerDetailDialog({ customer, onClose }) {
  const [reputation, setReputation] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [repRes, bookingsRes] = await Promise.all([
          api.get(`/customers/${customer.customer_id}/reputation`),
          api.get(`/customers/${customer.customer_id}/bookings`),
        ]);
        if (!cancelled) {
          setReputation(repRes.data);
          setBookings(bookingsRes.data);
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load customer details"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customer.customer_id]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer.name}</DialogTitle>
          <p className="text-sm text-slate-500">{customer.contact}</p>
        </DialogHeader>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {reputation && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-medium text-slate-900">{reputation.label}</span>
            <span className="text-slate-500">— {reputation.detail}</span>
          </div>
        )}

        <Tabs defaultValue="bookings" className="mt-4">
          <TabsList>
            <TabsTrigger value="bookings">Rental history</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            {bookings === null ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-5 w-5" />
              </div>
            ) : bookings.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No bookings yet.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Return</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.booking_id}>
                        <TableCell>{formatDate(b.pickup_date)}</TableCell>
                        <TableCell>{formatDate(b.return_date)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(b.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={BOOKING_STATUS_STYLES[b.status]}>{b.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 py-2">
              <span className="text-slate-500">Total rentals</span>
              <span className="font-medium text-slate-900">{customer.rentals_count}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-2">
              <span className="text-slate-500">Referral</span>
              <span className="font-medium text-slate-900">
                {customer.referral_name || "—"}
                {customer.referral_phone ? ` (${customer.referral_phone})` : ""}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 py-2">
              <span className="text-slate-500">Customer since</span>
              <span className="font-medium text-slate-900">{formatDate(customer.created_at)}</span>
            </div>

            <div className="pt-2">
              <p className="mb-2 flex items-center gap-1.5 text-slate-500">
                <IdCard className="h-4 w-4" />
                National ID photo
              </p>
              {customer.nationalID_Photo ? (
                <a
                  href={assetUrl(customer.nationalID_Photo)}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-40 overflow-hidden rounded-lg border border-slate-200"
                >
                  <img
                    src={assetUrl(customer.nationalID_Photo)}
                    alt={`${customer.name}'s national ID`}
                    className="h-28 w-40 object-cover transition hover:opacity-90"
                  />
                </a>
              ) : (
                <p className="text-slate-400">No ID photo on file.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "business_admin";
  const columnCount = isAdmin ? 6 : 5;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/customers");
      setCustomers(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load customers"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!customers) return [];
    return filterBySearch(customers, search, (c) => [c.name, c.contact]);
  }, [customers, search]);

  const { items, total, totalPages } = paginate(filtered, page, PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">{customers ? `${total} total` : " "}</p>
        </div>
        <Button type="button" variant="primary" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add customer
        </Button>
      </div>

      <div className="mt-6">
        <Input
          type="search"
          placeholder="Search name or contact…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Referral</TableHead>
              <TableHead className="text-right">Rentals</TableHead>
              <TableHead>Customer since</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-10">
                  <div className="flex justify-center">
                    <Spinner className="h-6 w-6" />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-10 text-center text-rose-600">
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-10 text-center text-slate-500">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              !error &&
              items.map((customer) => (
                <TableRow
                  key={customer.customer_id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <TableCell className="font-medium text-slate-900">{customer.name}</TableCell>
                  <TableCell>{customer.contact}</TableCell>
                  <TableCell>{customer.referral_name || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{customer.rentals_count}</TableCell>
                  <TableCell>{formatDate(customer.created_at)}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit ${customer.name}`}
                          onClick={() => setEditingCustomer(customer)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete ${customer.name}`}
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => setDeletingCustomer(customer)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  )}
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

      {showAdd && (
        <AddCustomerDialog
          onClose={() => setShowAdd(false)}
          onCreated={(customer) => {
            setCustomers((prev) => [customer, ...(prev ?? [])]);
            setShowAdd(false);
          }}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailDialog customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}

      {editingCustomer && (
        <EditCustomerDialog
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onUpdated={(updated) => {
            setCustomers((prev) =>
              prev.map((c) => (c.customer_id === updated.customer_id ? updated : c))
            );
            setEditingCustomer(null);
          }}
        />
      )}

      {deletingCustomer && (
        <DeleteCustomerDialog
          customer={deletingCustomer}
          onClose={() => setDeletingCustomer(null)}
          onDeleted={(deleted) => {
            setCustomers((prev) => prev.filter((c) => c.customer_id !== deleted.customer_id));
            setDeletingCustomer(null);
          }}
        />
      )}
    </div>
  );
}

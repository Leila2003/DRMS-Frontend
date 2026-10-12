import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { filterBySearch } from "../lib/list";
import { formatMoney } from "../lib/format";
import Spinner from "../components/Spinner";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Label from "../components/ui/label";
import Select from "../components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

let lineKey = 0;
function newLine() {
  lineKey += 1;
  return { key: lineKey, category_id: "", quantity: 1, unit_price: "" };
}

function CustomerCombobox({ customers, selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(
    () => filterBySearch(customers, query, (c) => [c.name, c.contact]).slice(0, 8),
    [customers, query]
  );

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-slate-900">{selected.name}</p>
          <p className="text-xs text-slate-500">{selected.contact}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-8"
          placeholder="Search by name or phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
        />
      </div>
      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {matches.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-400">No customers match.</p>
          )}
          {matches.map((c) => (
            <button
              key={c.customer_id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(c);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              <span className="font-medium text-slate-900">{c.name}</span>
              <span className="text-xs text-slate-500">{c.contact}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewBookingPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [customerMode, setCustomerMode] = useState("existing");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    referral_name: "",
    referral_phone: "",
  });
  const [newCustomerPhoto, setNewCustomerPhoto] = useState(null);

  const [eventDate, setEventDate] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [caution, setCaution] = useState("");
  const [lines, setLines] = useState([newLine()]);

  const [reputation, setReputation] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setReputation(null);
    if (!selectedCustomer) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/customers/${selectedCustomer.customer_id}/reputation`);
        if (!cancelled) setReputation(data);
      } catch {
        // Reputation is advisory — a failed lookup shouldn't block the booking.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCustomer]);

  const badReputation = customerMode === "existing" && reputation?.label === "Bad reputation";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [customersRes, categoriesRes] = await Promise.all([
          api.get("/customers"),
          api.get("/categories"),
        ]);
        if (!cancelled) {
          setCustomers(customersRes.data);
          setCategories(categoriesRes.data);
        }
      } catch (err) {
        if (!cancelled) setLoadError(apiErrorMessage(err, "Could not load customers/categories"));
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateLine(key, patch) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  function categoryFor(id) {
    return categories.find((c) => c.category_id === id);
  }

  const total = lines.reduce((sum, l) => {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.unit_price) || 0;
    return sum + qty * price;
  }, 0);
  const cautionAmount = Number(caution) || 0;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (customerMode === "existing" && !selectedCustomer) {
      setError("Select an existing customer, or switch to \"New customer\".");
      return;
    }
    if (customerMode === "new" && (!newCustomer.name.trim() || !newCustomer.contact.trim())) {
      setError("Enter the new customer's name and contact.");
      return;
    }
    if (!pickupDate || !returnDate) {
      setError("Pickup and return dates are required.");
      return;
    }
    if (returnDate < pickupDate) {
      setError("Return date must be on or after the pickup date.");
      return;
    }
    if (lines.some((l) => !l.category_id || !l.quantity || l.unit_price === "")) {
      setError("Every item line needs a category, quantity and unit price.");
      return;
    }

    const payload = {
      event_date: eventDate || undefined,
      pickup_date: pickupDate,
      return_date: returnDate,
      caution: cautionAmount,
      items: lines.map((l) => ({
        category_id: l.category_id,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price),
      })),
    };

    setSubmitting(true);
    try {
      let customerId = selectedCustomer?.customer_id;

      // The booking endpoint's new_customer field is JSON-only (no file
      // upload), so a new customer — and their ID photo — is created via
      // POST /customers first, then the booking references its customer_id.
      if (customerMode === "new") {
        const body = new FormData();
        body.append("name", newCustomer.name.trim());
        body.append("contact", newCustomer.contact.trim());
        if (newCustomer.referral_name) body.append("referral_name", newCustomer.referral_name);
        if (newCustomer.referral_phone) body.append("referral_phone", newCustomer.referral_phone);
        if (newCustomerPhoto) body.append("national_id_photo", newCustomerPhoto);

        const { data: createdCustomer } = await api.post("/customers", body);
        customerId = createdCustomer.customer_id;
        // Switch to "existing" with the new customer selected, so a booking
        // failure (e.g. stock) doesn't lose the customer we just created.
        setSelectedCustomer(createdCustomer);
        setCustomerMode("existing");
      }

      await api.post("/bookings", { ...payload, customer_id: customerId });
      navigate("/bookings");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create booking"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (loadError) {
    return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{loadError}</p>;
  }

  return (
    <div className="max-w-3xl">
      <Link to="/bookings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to bookings
      </Link>
      <h1 className="page-title mt-2">New booking</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={customerMode}
              onValueChange={(v) => {
                setCustomerMode(v);
                setError("");
              }}
            >
              <TabsList>
                <TabsTrigger value="existing">Existing customer</TabsTrigger>
                <TabsTrigger value="new">New customer</TabsTrigger>
              </TabsList>
            </Tabs>

            {customerMode === "existing" ? (
              <CustomerCombobox
                customers={customers}
                selected={selectedCustomer}
                onSelect={setSelectedCustomer}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new_name">Name</Label>
                    <Input
                      id="new_name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new_contact">Contact</Label>
                    <Input
                      id="new_contact"
                      value={newCustomer.contact}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, contact: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="referral_name">Referral name</Label>
                    <Input
                      id="referral_name"
                      value={newCustomer.referral_name}
                      onChange={(e) =>
                        setNewCustomer((p) => ({ ...p, referral_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="referral_phone">Referral phone </Label>
                    <Input
                      id="referral_phone"
                      value={newCustomer.referral_phone}
                      onChange={(e) =>
                        setNewCustomer((p) => ({ ...p, referral_phone: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="national_id_photo">National ID photo </Label>
                  <input
                    id="national_id_photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewCustomerPhoto(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  />
                </div>
              </div>
            )}

            {badReputation && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <p className="font-medium text-rose-800">{reputation.label}</p>
                  <p className="text-rose-700">{reputation.detail}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rental period</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="event_date">Event date </Label>
              <Input
                id="event_date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pickup_date">Pickup date</Label>
              <Input
                id="pickup_date"
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="return_date">Return date</Label>
              <Input
                id="return_date"
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, newLine()])}>
              <Plus className="h-3.5 w-3.5" />
              Add item
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.map((line) => {
              const cat = categoryFor(line.category_id);
              const subtotal = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
              return (
                <div key={line.key} className="grid grid-cols-12 items-end gap-2">
                  <div className="col-span-5 space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={line.category_id}
                      onChange={(e) => updateLine(line.key, { category_id: e.target.value })}
                    >
                      <option value="">Select…</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id} disabled={c.quantity_available === 0}>
                          {c.item_name} ({c.quantity_available} available)
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      max={cat?.quantity_available}
                      value={line.quantity}
                      onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3 space-y-1.5">
                    <Label>Unit price (RWF)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={line.unit_price}
                      onChange={(e) => updateLine(line.key, { unit_price: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1 pb-2 text-right text-xs text-slate-500">
                    {subtotal > 0 ? formatMoney(subtotal) : ""}
                  </div>
                  <div className="col-span-1 flex justify-end pb-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={lines.length === 1}
                      onClick={() => removeLine(line.key)}
                    >
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-w-xs space-y-1.5">
              <Label htmlFor="caution">Caution / deposit (RWF) — optional</Label>
              <Input
                id="caution"
                type="number"
                min={0}
                placeholder="0"
                value={caution}
                onChange={(e) => setCaution(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Refundable — returned to the customer if items come back on time and undamaged.
              </p>
            </div>
            <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Rental total</span>
                <span className="tabular-nums text-slate-900">{formatMoney(total)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Caution</span>
                <span className="tabular-nums text-slate-900">{formatMoney(cautionAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-slate-900">
                <span>Total due</span>
                <span className="tabular-nums">{formatMoney(total + cautionAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/bookings")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4 text-white" />}
            Create booking
          </Button>
        </div>
      </form>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { filterBySearch, paginate } from "../lib/list";
import { formatDate } from "../lib/format";
import Spinner from "../components/Spinner";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Label from "../components/ui/label";
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
const COLUMN_COUNT = 6;
const MIN_PASSWORD_LENGTH = 6;
const EMPTY_FORM = { name: "", email: "", phone: "", password: "" };

function AddStaffDialog({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/auth/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      onCreated(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create staff member"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add staff member</DialogTitle>
          <p className="text-sm text-slate-500">
            They'll sign in with this email and password.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={update("name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={update("email")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" required value={form.phone} onChange={update("phone")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={update("password")}
            />
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4 text-white" />}
              Add staff member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditStaffDialog({ staff, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: staff.name,
    phone: staff.phone ?? "",
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
      const { data } = await api.put(`/auth/users/${staff.user_id}`, {
        name: form.name.trim(),
        phone: form.phone.trim(),
      });
      onUpdated(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update staff member"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit staff member</DialogTitle>
          <p className="text-sm text-slate-500">{staff.email}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit_name">Full name</Label>
            <Input id="edit_name" required value={form.name} onChange={update("name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit_phone">Phone</Label>
            <Input id="edit_phone" type="tel" value={form.phone} onChange={update("phone")} />
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

function ToggleActiveDialog({ staff, onClose, onUpdated }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const activating = !staff.is_active;

  async function handleConfirm() {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.put(`/auth/users/${staff.user_id}`, { is_active: activating });
      onUpdated(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update staff member"));
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{activating ? "Reactivate" : "Deactivate"} staff member</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          {activating ? (
            <>
              <span className="font-medium text-slate-900">{staff.name}</span> will be able to sign
              in again.
            </>
          ) : (
            <>
              <span className="font-medium text-slate-900">{staff.name}</span> will no longer be
              able to sign in. Their bookings and history are kept, and you can reactivate them
              later.
            </>
          )}
        </p>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={activating ? "primary" : "destructive"}
            disabled={submitting}
            onClick={handleConfirm}
          >
            {submitting && <Spinner className="h-4 w-4 text-white" />}
            {activating ? "Reactivate" : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteStaffDialog({ staff, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setSubmitting(true);
    setError("");
    try {
      await api.delete(`/auth/users/${staff.user_id}`);
      onDeleted(staff);
    } catch (err) {
      // Staff who have recorded bookings can't be hard-deleted (the bookings
      // reference them), and the backend surfaces that as a generic 500.
      setError(
        err?.response?.status === 500
          ? "This staff member has booking history and can't be deleted. Deactivate them instead."
          : apiErrorMessage(err, "Could not delete staff member")
      );
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete staff member</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">
          Permanently delete <span className="font-medium text-slate-900">{staff.name}</span> (
          {staff.email})? This can't be undone. To keep their history, deactivate them instead.
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

export default function StaffPage() {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [togglingStaff, setTogglingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/auth/users");
      setStaff(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load staff"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!staff) return [];
    return filterBySearch(staff, search, (s) => [s.name, s.email, s.phone]);
  }, [staff, search]);

  const { items, total, totalPages } = paginate(filtered, page, PAGE_SIZE);
  const activeCount = staff?.filter((s) => s.is_active).length ?? 0;

  function replaceStaff(updated) {
    setStaff((prev) => prev.map((s) => (s.user_id === updated.user_id ? updated : s)));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="mt-1 text-sm text-slate-500">
            {staff ? `${total} total · ${activeCount} active` : " "}
          </p>
        </div>
        <Button type="button" variant="primary" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add staff member
        </Button>
      </div>

      <div className="mt-6">
        <Input
          type="search"
          placeholder="Search name, email or phone…"
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
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
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
                  {search ? "No staff match your search." : "No staff yet. Add your first team member."}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              !error &&
              items.map((member) => (
                <TableRow key={member.user_id} className={member.is_active ? "" : "opacity-60"}>
                  <TableCell className="font-medium text-slate-900">{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? "success" : "default"}>
                      {member.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(member.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${member.name}`}
                        title="Edit"
                        onClick={() => setEditingStaff(member)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`${member.is_active ? "Deactivate" : "Reactivate"} ${member.name}`}
                        title={member.is_active ? "Deactivate" : "Reactivate"}
                        className={
                          member.is_active
                            ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                            : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        }
                        onClick={() => setTogglingStaff(member)}
                      >
                        <Power />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${member.name}`}
                        title="Delete"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setDeletingStaff(member)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
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

      {showAdd && (
        <AddStaffDialog
          onClose={() => setShowAdd(false)}
          onCreated={(member) => {
            setStaff((prev) => [member, ...(prev ?? [])]);
            setShowAdd(false);
          }}
        />
      )}

      {editingStaff && (
        <EditStaffDialog
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onUpdated={(updated) => {
            replaceStaff(updated);
            setEditingStaff(null);
          }}
        />
      )}

      {togglingStaff && (
        <ToggleActiveDialog
          staff={togglingStaff}
          onClose={() => setTogglingStaff(null)}
          onUpdated={(updated) => {
            replaceStaff(updated);
            setTogglingStaff(null);
          }}
        />
      )}

      {deletingStaff && (
        <DeleteStaffDialog
          staff={deletingStaff}
          onClose={() => setDeletingStaff(null)}
          onDeleted={(deleted) => {
            setStaff((prev) => prev.filter((s) => s.user_id !== deleted.user_id));
            setDeletingStaff(null);
          }}
        />
      )}
    </div>
  );
}

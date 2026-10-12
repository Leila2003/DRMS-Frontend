import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";
import { api, apiErrorMessage, assetUrl } from "../lib/api";
import { filterBySearch } from "../lib/list";
import { formatDate } from "../lib/format";
import Spinner from "../components/Spinner";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Label from "../components/ui/label";
import Textarea from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const EMPTY_FORM = { item_name: "", item_type: "", description: "", total_owned: "" };

function stockVariant(category) {
  if (category.quantity_available === 0) return "danger";
  if (category.quantity_available <= Math.max(1, Math.round(category.total_owned * 0.2))) {
    return "warning";
  }
  return "success";
}

function CategoryImage({ src, alt, className, fit = "cover" }) {
  return (
    <div className={`flex items-center justify-center bg-slate-50 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={fit === "cover" ? "h-full w-full object-cover" : "max-h-full max-w-full object-contain"}
        />
      ) : (
        <Boxes className="h-10 w-10 text-slate-300" />
      )}
    </div>
  );
}

function CategoryDetailDialog({ category, onClose, onEdit }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{category.item_name}</DialogTitle>
          {category.item_type && <p className="text-sm text-slate-500">{category.item_type}</p>}
        </DialogHeader>

        <CategoryImage
          src={assetUrl(category.image_url)}
          alt={category.item_name}
          className="h-64 rounded-xl border border-slate-200"
          fit="contain"
        />

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-lg font-semibold text-slate-900">{category.total_owned}</p>
            <p className="text-xs text-slate-500">Total owned</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-lg font-semibold text-slate-900">{category.quantity_available}</p>
            <p className="text-xs text-slate-500">Available</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-lg font-semibold text-slate-900">{category.quantity_rented}</p>
            <p className="text-xs text-slate-500">Rented out</p>
          </div>
        </div>

        {category.description && (
          <p className="mt-4 text-sm text-slate-600">{category.description}</p>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Added on {formatDate(category.created_at)}
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryFormDialog({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState(
    initial
      ? {
          item_name: initial.item_name,
          item_type: initial.item_type || "",
          description: initial.description || "",
          total_owned: String(initial.total_owned),
        }
      : EMPTY_FORM
  );
  const [image, setImage] = useState(null);
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
      let saved;
      if (isEdit) {
        const { data } = await api.put(`/categories/${initial.category_id}`, {
          item_name: form.item_name,
          item_type: form.item_type || null,
          description: form.description || null,
          total_owned: Number(form.total_owned),
        });
        saved = data;
        if (image) {
          const imageBody = new FormData();
          imageBody.append("file", image);
          const { data: withImage } = await api.post(
            `/categories/${initial.category_id}/image`,
            imageBody
          );
          saved = withImage;
        }
      } else {
        const body = new FormData();
        body.append("item_name", form.item_name);
        if (form.item_type) body.append("item_type", form.item_type);
        if (form.description) body.append("description", form.description);
        body.append("total_owned", form.total_owned);
        if (image) body.append("image", image);
        const { data } = await api.post("/categories", body);
        saved = data;
      }
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save category"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="item_name">Item name</Label>
            <Input id="item_name" required value={form.item_name} onChange={update("item_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="item_type">Type (optional)</Label>
            <Input id="item_type" value={form.item_type} onChange={update("item_type")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" value={form.description} onChange={update("description")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="total_owned">Total owned</Label>
            <Input
              id="total_owned"
              type="number"
              min={1}
              required
              value={form.total_owned}
              onChange={update("total_owned")}
            />
            {isEdit && (
              <p className="text-xs text-slate-500">
                Currently {initial.quantity_rented} out on rental. Lowering this below that isn't
                allowed by the server.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image">{isEdit ? "Replace image (optional)" : "Image (optional)"}</Label>
            {isEdit && (
              <CategoryImage
                src={image ? URL.createObjectURL(image) : assetUrl(initial.image_url)}
                alt={image ? "New preview" : initial.item_name}
                className="h-24 w-24 rounded-lg border border-slate-200"
              />
            )}
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
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
              {isEdit ? "Save changes" : "Add category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/categories");
      setCategories(data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load categories"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filtered = useMemo(() => {
    if (!categories) return [];
    return filterBySearch(categories, searchInput, (c) => [c.item_name, c.item_type]);
  }, [categories, searchInput]);

  async function handleDelete(category) {
    if (!window.confirm(`Delete "${category.item_name}"? This can't be undone.`)) return;
    setDeletingId(category.category_id);
    try {
      await api.delete(`/categories/${category.category_id}`);
      setCategories((prev) => prev.filter((c) => c.category_id !== category.category_id));
    } catch (err) {
      window.alert(apiErrorMessage(err, "Could not delete category"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="mt-1 text-sm text-slate-500">
            {categories ? `${categories.length} total` : " "}
          </p>
        </div>
        <Button type="button" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      <div className="mt-6">
        <Input
          type="search"
          placeholder="Search categories…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-64"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && error && (
        <p className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">No categories found.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((category) => (
            <Card
              key={category.category_id}
              className="cursor-pointer overflow-hidden"
              onClick={() => setViewing(category)}
            >
              <CategoryImage
                src={assetUrl(category.image_url)}
                alt={category.item_name}
                className="aspect-[4/3]"
              />
              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{category.item_name}</p>
                  {category.item_type && (
                    <p className="text-xs text-slate-500">{category.item_type}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Badge variant={stockVariant(category)}>
                    {category.quantity_available} / {category.total_owned} available
                  </Badge>
                  <span className="text-xs text-slate-400">
                    since {formatDate(category.created_at)}
                  </span>
                </div>

                {category.description && (
                  <p className="line-clamp-2 text-sm text-slate-500">{category.description}</p>
                )}

                <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditing(category)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === category.category_id}
                    onClick={() => handleDelete(category)}
                    className="text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewing && (
        <CategoryDetailDialog
          category={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      )}

      {adding && (
        <CategoryFormDialog
          onClose={() => setAdding(false)}
          onSaved={(category) => {
            setCategories((prev) => [category, ...(prev ?? [])]);
            setAdding(false);
          }}
        />
      )}

      {editing && (
        <CategoryFormDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(category) => {
            setCategories((prev) =>
              prev.map((c) => (c.category_id === category.category_id ? category : c))
            );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

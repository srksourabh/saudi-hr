"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "@hrms-app/ui";
import { Plus, Trash2, Edit2, Briefcase, X, Loader2 } from "lucide-react";

export default function DesignationsPage() {
  const { data: list, isLoading, refetch } = api.designation.list.useQuery();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = api.designation.create.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    },
    onError: (err: { message: string }) => setErrorMsg(err.message),
  });

  const updateMutation = api.designation.update.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    },
    onError: (err: { message: string }) => setErrorMsg(err.message),
  });

  const deleteMutation = api.designation.delete.useMutation({
    onSuccess: () => refetch(),
    onError: (err: { message: string }) => alert(err.message),
  });

  function resetForm() {
    setShowModal(false);
    setEditId(null);
    setTitle("");
    setCode("");
    setDescription("");
    setErrorMsg(null);
  }

  function handleEdit(item: any) {
    setEditId(item.id);
    setTitle(item.title);
    setCode(item.code ?? "");
    setDescription(item.description ?? "");
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (editId) {
      updateMutation.mutate({ id: editId, data: { title, code, description } });
    } else {
      createMutation.mutate({ title, code, description });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-12 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading designations…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Designations</h1>
          <p className="text-sm text-slate-500">Add and manage job designations for company employees</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-slate-950 hover:bg-emerald-900">
          <Plus className="mr-2 h-4 w-4" /> New Designation
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list?.map((d: any) => (
              <tr key={d.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-600" /> {d.title}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{d.code || "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{d.description || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(d)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this designation?")) deleteMutation.mutate(d.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(!list || list.length === 0) && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No designations created yet. Click "New Designation" above to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editId ? "Edit Designation" : "Add Designation"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {errorMsg && <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{errorMsg}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Designation Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer / HR Business Partner"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Code (Optional)</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. ENG-01"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Responsibilities & scope"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                  {editId ? "Save Changes" : "Create Designation"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

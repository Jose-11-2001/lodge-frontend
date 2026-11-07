'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { useLodge } from '@/context/LodgeContext';
import {
  workersApi,
  WorkerDto,
  WorkerAssignmentDto,
} from '@/lib/api';
import { dateOnly } from '@/lib/format';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type EditDraft = {
  id: number;
  name: string;
  phone: string;
  role: string;
  active: boolean;
} | null;

type PdfRange = 'daily' | 'weekly';

export default function AdminWorkersPage() {
  const admin = useRequireAdmin();
  const { initializing, showToast } = useLodge();

  const [workers, setWorkers] = useState<WorkerDto[]>([]);
  const [assignments, setAssignments] = useState<WorkerAssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);

  // New worker form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Cleaner');

  // Assign task form
  const [taskWorkerId, setTaskWorkerId] = useState<number | ''>('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editing, setEditing] = useState<EditDraft>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // PDF export state
  const [pdfRange, setPdfRange] = useState<PdfRange>('daily');
  const [exporting, setExporting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ws, as] = await Promise.all([
        workersApi.list(),
        workersApi.allAssignments(),
      ]);
      setWorkers(ws);
      setAssignments(as);
    } catch (e) {
      showToast((e as Error).message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  if (initializing) return <div className="p-10 text-[var(--muted)]">Loading…</div>;
  if (!admin) return <div className="p-10 text-[var(--muted)]">Redirecting to login…</div>;

  const addWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return showToast('Name is required', true);
    setSubmitting(true);
    try {
      await workersApi.create({ name: newName.trim(), phone: newPhone.trim(), role: newRole });
      setNewName('');
      setNewPhone('');
      showToast('Worker added');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const assignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskWorkerId) return showToast('Pick a worker', true);
    if (!taskTitle.trim()) return showToast('Describe the task', true);
    setSubmitting(true);
    try {
      await workersApi.assign(Number(taskWorkerId), {
        task: taskTitle.trim(),
        dueDate: taskDue || undefined,
        status: 'PENDING',
      });
      setTaskTitle('');
      setTaskDue('');
      showToast('Task assigned');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, true);
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (id: number, status: string) => {
    try {
      await workersApi.updateAssignmentStatus(id, status);
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, true);
    }
  };

  const removeWorker = async (id: number) => {
    if (!confirm('Delete this worker and all their assignments?')) return;
    try {
      await workersApi.delete(id);
      showToast('Worker deleted');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, true);
    }
  };

  const removeAssignment = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    try {
      await workersApi.deleteAssignment(id);
      showToast('Task deleted');
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, true);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.name.trim()) return showToast('Name is required', true);
    setSavingEdit(true);
    try {
      await workersApi.update(editing.id, {
        name: editing.name.trim(),
        phone: editing.phone.trim(),
        role: editing.role,
        active: editing.active,
      });
      showToast('Worker updated');
      setEditing(null);
      await loadAll();
    } catch (err) {
      showToast((err as Error).message, true);
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredForPdf = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (pdfRange === 'daily') {
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    }
    return assignments.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= start && d <= now;
    });
  }, [assignments, pdfRange]);

  const downloadPdf = async () => {
    if (filteredForPdf.length === 0) {
      showToast(`No assignments in the selected ${pdfRange} range`, true);
      return;
    }
    setExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const title =
        pdfRange === 'daily'
          ? `Worker Assignments — Today (${new Date().toLocaleDateString()})`
          : `Worker Assignments — Last 7 Days (ending ${new Date().toLocaleDateString()})`;

      doc.setFontSize(16);
      doc.text(title, 40, 40);

      autoTable(doc, {
        startY: 60,
        head: [['Worker', 'Task', 'Due', 'Created', 'Status']],
        body: filteredForPdf.map((a) => [
          a.workerName,
          a.task,
          a.dueDate ? dateOnly(a.dueDate) : '—',
          dateOnly(a.createdAt),
          a.status,
        ]),
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [60, 60, 60] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      const stamp = new Date().toISOString().slice(0, 10);
      doc.save(`worker-assignments-${pdfRange}-${stamp}.pdf`);
      showToast('PDF downloaded');
    } catch (err) {
      showToast((err as Error).message, true);
    } finally {
      setExporting(false);
    }
  };

  const badge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'badge warn',
      IN_PROGRESS: 'badge',
      DONE: 'badge ok',
    };
    return map[status] ?? 'badge';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="m-0 font-fraunces font-bold text-[34px] tracking-tight">Workers</h2>
      <p className="mt-1 mb-6 text-sm text-[var(--muted)]">
        Add staff, see who is active, and assign them tasks.
      </p>

      {/* ⬇️ THE TWO FORMS — restored ⬇️ */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Add Worker */}
        <form
          onSubmit={addWorker}
          className="bg-white border border-[var(--line)] rounded-2xl p-6"
        >
          <h3 className="m-0 mb-4 font-fraunces font-bold text-lg">Add a worker</h3>
          <div className="field">
            <label>Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Phone (optional)</label>
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option>Cleaner</option>
              <option>Chef</option>
              <option>Waiter</option>
              <option>Manager</option>
              <option>Maintenance</option>
              <option>Other</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add worker'}
          </button>
        </form>

        {/* Assign Task */}
        <form
          onSubmit={assignTask}
          className="bg-white border border-[var(--line)] rounded-2xl p-6"
        >
          <h3 className="m-0 mb-4 font-fraunces font-bold text-lg">Assign a task</h3>
          <div className="field">
            <label>Worker</label>
            <select
              value={taskWorkerId}
              onChange={(e) => setTaskWorkerId(Number(e.target.value) || '')}
              required
            >
              <option value="">— pick a worker —</option>
              {workers.filter((w) => w.active).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {w.role || '—'}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Task</label>
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Clean rooms 12–14"
              required
            />
          </div>
          <div className="field">
            <label>Due date (optional)</label>
            <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Assigning…' : 'Assign'}
          </button>
        </form>
      </div>
      {/* ⬆️ END FORMS ⬆️ */}

      {/* Workers table */}
      <h3 className="m-0 mb-4 font-fraunces font-bold text-lg">All workers ({workers.length})</h3>
      {loading ? (
        <div className="text-[var(--muted)] text-sm">Loading…</div>
      ) : workers.length === 0 ? (
        <div className="empty"><div className="ico">🧑‍🔧</div>No workers yet.</div>
      ) : (
        <div className="table-wrap mb-8">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Role</th><th>Phone</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.role || '—'}</td>
                  <td>{w.phone || '—'}</td>
                  <td>
                    <span className={`badge ${w.active ? 'ok' : 'bad'}`}>
                      {w.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '6px 14px' }}
                        onClick={() =>
                          setEditing({
                            id: w.id,
                            name: w.name,
                            phone: w.phone ?? '',
                            role: w.role ?? '',
                            active: !!w.active,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 14px' }}
                        onClick={() => removeWorker(w.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assignments header + PDF controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="m-0 font-fraunces font-bold text-lg">
          Assignments ({assignments.length})
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={pdfRange}
            onChange={(e) => setPdfRange(e.target.value as PdfRange)}
            className="border border-[var(--line)] rounded-lg px-3 py-2 text-sm"
          >
            <option value="daily">Daily (today)</option>
            <option value="weekly">Weekly (last 7 days)</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={downloadPdf}
            disabled={exporting}
          >
            {exporting ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-[var(--muted)] text-sm">Loading…</div>
      ) : assignments.length === 0 ? (
        <div className="empty"><div className="ico">📋</div>No tasks assigned yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Worker</th><th>Task</th><th>Due</th>
                <th>Created</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.workerName}</td>
                  <td>{a.task}</td>
                  <td>{a.dueDate ? dateOnly(a.dueDate) : '—'}</td>
                  <td>{dateOnly(a.createdAt)}</td>
                  <td><span className={badge(a.status)}>{a.status}</span></td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
                      {a.status === 'PENDING' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 14px' }}
                          onClick={() => changeStatus(a.id, 'IN_PROGRESS')}
                        >
                          Start
                        </button>
                      )}
                      {a.status !== 'DONE' && (
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '6px 14px' }}
                          onClick={() => changeStatus(a.id, 'DONE')}
                        >
                          Done
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 14px' }}
                        onClick={() => removeAssignment(a.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit worker modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !savingEdit && setEditing(null)}
        >
          <form
            onSubmit={saveEdit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-md border border-[var(--line)]"
          >
            <h3 className="m-0 mb-4 font-fraunces font-bold text-lg">Edit worker</h3>

            <div className="field">
              <label>Name</label>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                value={editing.phone}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Role</label>
              <select
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
              >
                <option>Cleaner</option>
                <option>Chef</option>
                <option>Waiter</option>
                <option>Manager</option>
                <option>Maintenance</option>
                <option>Other</option>
              </select>
            </div>
            <div className="field flex items-center gap-2">
              <input
                id="active-toggle"
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
              />
              <label htmlFor="active-toggle" className="m-0">Active</label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditing(null)}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
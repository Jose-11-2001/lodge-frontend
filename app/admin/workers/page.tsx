'use client';

import React, { useEffect, useState } from 'react';
import { useRequireAdmin } from '@/lib/useRequireAdmin';
import { useLodge } from '@/context/LodgeContext';
import {
  workersApi,
  WorkerDto,
  WorkerAssignmentDto,
} from '@/lib/api';
import { dateOnly } from '@/lib/format';

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

      {/* Two forms row */}
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
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 14px' }}
                      onClick={() => removeWorker(w.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assignments table */}
      <h3 className="m-0 mb-4 font-fraunces font-bold text-lg">
        Assignments ({assignments.length})
      </h3>
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
    </div>
  );
}
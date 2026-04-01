import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import StickyDataTable, { type StickyColumn } from '../../components/StickyDataTable';

function fmtTime(sec: number): string {
  if (!sec || sec <= 0) return '-';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function AdminAttendance() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [form, setForm] = useState({ classId: '', studentId: '', date: new Date().toISOString().split('T')[0], status: 'MANUAL' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'sessions' | 'attendance'>('sessions');
  const [records, setRecords] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [recStatus, setRecStatus] = useState('');
  const [recDate, setRecDate] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/classes').then(r => setClasses(r.data)).catch(() => {}),
      api.get('/users/students').then(r => setStudents(r.data || [])).catch(() => {}),
      api.get('/attendance/watch-sessions').then(r => setSessions(r.data || [])).catch(() => {}),
      api.get('/attendance').then(r => setRecords(r.data || [])).catch(() => {}),
    ]).finally(() => setFetching(false));
  }, []);

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await api.post('/attendance/manual', { userId: form.studentId, eventName: `Manual - ${form.date}` });
      setSuccess('Attendance recorded');
      const r = await api.get('/attendance');
      setRecords(r.data || []);
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to save attendance'); }
    finally { setLoading(false); }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      INCOMPLETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      MANUAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return map[s] || '';
  };

  const sessionColumns: readonly StickyColumn<any>[] = [
    {
      id: 'student',
      label: 'Student',
      minWidth: 220,
      render: (s) => (
        <>
          <p className="font-medium text-slate-800 dark:text-slate-100">{s.user?.profile?.fullName || '-'}</p>
          <p className="text-xs text-slate-400">{s.user?.email}</p>
        </>
      ),
    },
    {
      id: 'recording',
      label: 'Recording',
      minWidth: 260,
      render: (s) => (
        <>
          <p className="text-slate-600 dark:text-slate-300">{s.recording?.title || '-'}</p>
          <p className="text-xs text-slate-400">{s.recording?.month?.class?.name} - {s.recording?.month?.name}</p>
        </>
      ),
    },
    {
      id: 'date',
      label: 'Date',
      minWidth: 130,
      render: (s) => (
        <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">
          {s.startedAt ? new Date(s.startedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
        </span>
      ),
    },
    {
      id: 'time',
      label: 'Time',
      minWidth: 170,
      render: (s) => (
        <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">
          {s.startedAt ? new Date(s.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '-'}
          {s.endedAt ? ` - ${new Date(s.endedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
        </span>
      ),
    },
    { id: 'watched', label: 'Watched', minWidth: 100, render: (s) => <span className="font-medium text-slate-700 dark:text-slate-200">{fmtTime(s.totalWatchedSec)}</span> },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      render: (s) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
          s.status === 'ENDED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          s.status === 'WATCHING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>{s.status}</span>
      ),
    },
  ];

  const recordColumns: readonly StickyColumn<any>[] = [
    {
      id: 'student',
      label: 'Student',
      minWidth: 220,
      render: (rec) => (
        <>
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{rec.user?.profile?.fullName || '-'}</p>
          <p className="text-xs text-slate-400">{rec.user?.email}</p>
        </>
      ),
    },
    {
      id: 'recordingClass',
      label: 'Recording / Class',
      minWidth: 260,
      render: (rec) => (
        <>
          <p className="text-slate-600 dark:text-slate-300 text-sm">{rec.recording?.title || rec.eventName || '-'}</p>
          <p className="text-xs text-slate-400">{rec.recording?.month?.class?.name || '-'}</p>
        </>
      ),
    },
    { id: 'date', label: 'Date', minWidth: 120, render: (rec) => <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">{rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span> },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      render: (rec) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(rec.status)}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{rec.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{sessions.length} watch sessions - {records.length} attendance records</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/25 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Mark Attendance
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{success}</span>
        </div>
      )}

      {/* Modal */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 rounded-t-2xl">
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100">Mark Attendance</h2>
                <p className="text-xs text-slate-400 mt-0.5">Record manual attendance for a student</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {error && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Class</label>
                <select value={form.classId} onChange={e => update('classId', e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">Select class</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Student</label>
                <select value={form.studentId} onChange={e => update('studentId', e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">Select student</option>
                  {students.map((s: any) => <option key={s.id} value={s.id}>{s.profile?.fullName || s.email}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Date</label>
                <input type="date" value={form.date} onChange={e => update('date', e.target.value)} required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      , document.body)}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700 w-full">
        <button onClick={() => setTab('sessions')}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === 'sessions' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
          Watch Sessions
        </button>
        <button onClick={() => setTab('attendance')}
          className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === 'attendance' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
          Legacy Attendance
        </button>
      </div>

      {/* Watch Sessions Table */}
      {tab === 'sessions' && (() => {
        const filtered = sessions.filter((s: any) => {
          if (filterStatus && s.status !== filterStatus) return false;
          if (filterDate) {
            const d = s.startedAt ? new Date(s.startedAt).toISOString().split('T')[0] : '';
            if (d !== filterDate) return false;
          }
          return true;
        });
        const hasFilters = filterDate || filterStatus;
        return (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date</label>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="">All Status</option>
                <option value="ENDED">Ended</option>
                <option value="WATCHING">Watching</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
            {hasFilters && (
              <button onClick={() => { setFilterDate(''); setFilterStatus(''); }}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-slate-400 self-end pb-2">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {fetching ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">{sessions.length === 0 ? 'No watch sessions yet' : 'No sessions match the selected filters'}</div>
          ) : (
            <StickyDataTable
              columns={sessionColumns}
              rows={filtered}
              getRowId={(row) => row.id}
              tableHeight="calc(100vh - 440px)"
            />
          )}
        </div>
        </>
        );
      })()}

      {/* Legacy Attendance Table */}
      {tab === 'attendance' && (() => {
        const filteredRecords = records.filter((rec: any) => {
          if (recStatus && rec.status !== recStatus) return false;
          if (recDate) {
            const d = rec.createdAt ? new Date(rec.createdAt).toISOString().split('T')[0] : '';
            if (d !== recDate) return false;
          }
          return true;
        });
        const hasRecFilters = recDate || recStatus;
        return (
          <>
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Date</label>
                <input type="date" value={recDate} onChange={e => setRecDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
                <select value={recStatus} onChange={e => setRecStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="INCOMPLETE">Incomplete</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
              {hasRecFilters && (
                <button onClick={() => { setRecDate(''); setRecStatus(''); }}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Clear
                </button>
              )}
              <span className="ml-auto text-xs text-slate-400 self-end pb-2">{filteredRecords.length} result{filteredRecords.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              {fetching ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />)}</div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No attendance records found</p>
                  <p className="text-xs text-slate-400 mt-1">{hasRecFilters ? 'Try adjusting or clearing the filters' : 'Add manual attendance using the button above'}</p>
                </div>
              ) : (
                <StickyDataTable
                  columns={recordColumns}
                  rows={filteredRecords}
                  getRowId={(row) => row.id}
                  tableHeight="calc(100vh - 440px)"
                />
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}



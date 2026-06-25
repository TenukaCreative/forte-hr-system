import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Pencil, CalendarDays, RefreshCw } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import { C, card, fieldLabel, inputStyle } from '../../components/theme';
import { Spinner, EmptyState, Button } from '../../components/ui';
import { SingleDatePicker } from '../../components/DatePicker';
import api from '../../api/axios';

const TYPES = [
  { value: 'PUBLIC', label: 'Public Holiday' },
  { value: 'COMPANY', label: 'Company Holiday' },
];

const TYPE_COLORS = {
  PUBLIC:  { bg: 'rgba(200,32,61,0.08)', color: C.accent },
  COMPANY: { bg: 'rgba(21,22,26,0.06)',  color: C.dark },
};

const fmtDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

export default function HolidayManagement() {
  const [year, setYear] = useState(currentYear);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApi, setLoadingApi] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const [form, setForm] = useState({
    date: '',
    name: '',
    type: 'PUBLIC',
    description: '',
  });

  const load = async (y = year) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/holidays?year=${y}`);
      setHolidays(data || []);
    } catch {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(year); }, [year]);

  const resetForm = () => {
    setForm({ date: '', name: '', type: 'PUBLIC', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleLoadFromApi = async () => {
    setLoadingApi(true);
    try {
      const { data } = await api.post('/holidays/load-from-api', { year });
      toast.success(data.message);
      load(year);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load from API');
    } finally {
      setLoadingApi(false);
    }
  };

  const handleClearPublic = async () => {
    setClearing(true);
    try {
      const { data } = await api.delete(`/holidays/year/${year}/public`);
      toast.success(data.message);
      load(year);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear holidays');
    } finally {
      setClearing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.name.trim()) {
      return toast.error('Date and name are required');
    }
    try {
      if (editingId) {
        await api.put(`/holidays/${editingId}`, form);
        toast.success('Holiday updated');
      } else {
        await api.post('/holidays', form);
        toast.success('Holiday added');
      }
      resetForm();
      load(year);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save holiday');
    }
  };

  const handleEdit = (h) => {
    setForm({
      date: h.date,
      name: h.name,
      type: h.type,
      description: h.description || '',
    });
    setEditingId(h.id);
    setShowForm(true);
    setConfirmDeleteId(null);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/holidays/${id}`);
      toast.success('Holiday deleted');
      setConfirmDeleteId(null);
      load(year);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    }
  };

  const publicHolidays = holidays.filter((h) => h.type === 'PUBLIC');
  const companyHolidays = holidays.filter((h) => h.type === 'COMPANY');

  return (
    <Shell>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Public Holidays
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
          Manage Cambodia public and company holidays
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          style={{ ...inputStyle, width: 120 }}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <Button
          onClick={handleLoadFromApi}
          disabled={loadingApi}
          variant="outline"
          style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: loadingApi ? 0.6 : 1 }}
        >
          <RefreshCw size={15} style={{ animation: loadingApi ? 'spin 1s linear infinite' : 'none' }} />
          {loadingApi ? 'Loading from API…' : 'Load Cambodia Holidays from API'}
        </Button>

        {publicHolidays.length > 0 && (
          <Button
            onClick={handleClearPublic}
            disabled={clearing}
            variant="ghost"
            style={{ color: C.red, opacity: clearing ? 0.6 : 1 }}
          >
            {clearing ? 'Clearing…' : `Clear ${year} Public Holidays`}
          </Button>
        )}

        <Button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}
        >
          <Plus size={15} /> Add Holiday
        </Button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{ ...card, maxWidth: 520, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, margin: '0 0 16px' }}>
            {editingId ? 'Edit Holiday' : 'Add Holiday'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Date</label>
              <SingleDatePicker
                value={form.date}
                onChange={(val) => setForm((p) => ({ ...p, date: val }))}
                placeholder="Select date"
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Holiday Name</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Khmer New Year"
                required
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Type</label>
              <select
                style={inputStyle}
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>Description (optional)</label>
              <input
                style={inputStyle}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit">
                {editingId ? 'Update Holiday' : 'Add Holiday'}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Holiday Lists */}
      {loading ? (
        <Spinner />
      ) : holidays.length === 0 ? (
        <div style={card}>
          <EmptyState
            icon={CalendarDays}
            title={`No holidays for ${year} yet`}
            subtitle="Load from API or add manually using the buttons above."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {publicHolidays.length > 0 && (
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: C.dark, margin: '0 0 16px' }}>
                Public Holidays · {publicHolidays.length}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {publicHolidays.map((h) => (
                  <HolidayRow
                    key={h.id}
                    holiday={h}
                    confirmDeleteId={confirmDeleteId}
                    setConfirmDeleteId={setConfirmDeleteId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    typeColors={TYPE_COLORS}
                  />
                ))}
              </div>
            </div>
          )}

          {companyHolidays.length > 0 && (
            <div style={card}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: C.dark, margin: '0 0 16px' }}>
                Company Holidays · {companyHolidays.length}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {companyHolidays.map((h) => (
                  <HolidayRow
                    key={h.id}
                    holiday={h}
                    confirmDeleteId={confirmDeleteId}
                    setConfirmDeleteId={setConfirmDeleteId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    typeColors={TYPE_COLORS}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Shell>
  );
}

function HolidayRow({ holiday, confirmDeleteId, setConfirmDeleteId, onEdit, onDelete, typeColors }) {
  const colors = typeColors[holiday.type] || typeColors.PUBLIC;
  const isConfirming = confirmDeleteId === holiday.id;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '10px 14px', border: `1px solid ${C.border}`,
      borderRadius: 10, background: '#FAFAF7',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span style={{
          background: colors.bg, color: colors.color,
          borderRadius: 6, padding: '2px 8px', fontSize: 11,
          fontWeight: 600, flexShrink: 0,
        }}>
          {fmtDate(holiday.date)}
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: C.dark }}>{holiday.name}</p>
          {holiday.description && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>{holiday.description}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {isConfirming ? (
          <>
            <span style={{ fontSize: 12, color: C.muted }}>Delete?</span>
            <Button
              variant="danger"
              onClick={() => onDelete(holiday.id)}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              Yes
            </Button>
            <Button
              variant="ghost"
              onClick={() => setConfirmDeleteId(null)}
              style={{ padding: '4px 10px', fontSize: 12 }}
            >
              No
            </Button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(holiday)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: C.muted, padding: 6, display: 'flex', alignItems: 'center',
              }}
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => setConfirmDeleteId(holiday.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: C.muted, padding: 6, display: 'flex', alignItems: 'center',
              }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Upload, Trash2, FileText, ArrowLeft } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import { useAuth } from '../../context/AuthContext';
import { C, formatDate } from '../../components/theme';
import api from '../../api/axios';

const DEPARTMENTS = ['IT', 'HR', 'PMO', 'Finance', 'Operations'];

// Values must match the User.role ENUM in the backend
// (backend/src/models/User.js) — the rest of the app routes off these codes.
const ROLES = [
  { value: 'HR_MANAGER',  label: 'HR Manager' },
  { value: 'HEAD_OF_PMO', label: 'Head of PMO' },
  { value: 'PM',          label: 'Project Manager' },
  { value: 'BA',          label: 'Business Analyst' },
  { value: 'IT',          label: 'IT Officer' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

const roleLabel = (value) =>
  ROLES.find((r) => r.value === value)?.label || value?.replace(/_/g, ' ');

const subLabel = {
  fontSize: 11, fontWeight: 600, color: 'rgba(21,22,26,0.4)',
  letterSpacing: '0.8px', margin: '0 0 12px',
};

const rolePill = {
  background: 'rgba(200,32,61,0.08)', color: '#C8203D',
  borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
};

const infoPill = {
  background: '#F5F4EF', color: '#5a5b61',
  borderRadius: 20, padding: '3px 10px', fontSize: 12,
};

const formatSize = (bytes) => {
  if (bytes == null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function EmployeeDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { resolvedRole } = useAuth();
  const canManageLeave = resolvedRole === 'HR_MANAGER' || resolvedRole === 'SUPER_ADMIN';

  const [userData, setUserData] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const [form, setForm] = useState({
    name: '',
    role: '',
    employeeCode: '', department: '', designation: '',
    joinDate: '', contactNumber: '', address: '',
    emergencyContact: '', emergencyPhone: '',
  });

  useEffect(() => { fetchData(); }, [userId]);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/employees/${userId}`);
      setUserData(data.user);
      setEmployee(data.employee);
      setDocuments(data.documents || []);
      if (data.employee) {
        setForm({
          name:            data.user?.name || '',
          role:            data.user?.role || '',
          employeeCode:    data.employee.employeeCode || '',
          department:      data.employee.department || '',
          designation:     data.employee.designation || '',
          joinDate:        data.employee.joinDate || '',
          contactNumber:   data.employee.contactNumber || '',
          address:         data.employee.address || '',
          emergencyContact: data.employee.emergencyContact || '',
          emergencyPhone:  data.employee.emergencyPhone || '',
        });
      } else {
        // No employee record yet — still seed name and role from the user account.
        setForm((prev) => ({ ...prev, name: data.user?.name || '', role: data.user?.role || '' }));
      }
    } catch { toast.error('Failed to load employee'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (employee) {
        await api.put(`/employees/${userId}`, form);
      } else {
        await api.post(`/employees/${userId}`, form);
      }
      toast.success('Employee profile saved');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleUpload = async (file) => {
    if (!employee) return toast.error('Save the employee profile first');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeId', employee.id);
    setUploading(true);
    try {
      await api.post('/documents/upload', formData, {
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });
      toast.success('Document uploaded');
      fetchData();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const handleDownload = async (docId) => {
    try {
      const { data } = await api.get(`/documents/${docId}/download`);
      window.open(data.downloadUrl, '_blank');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted');
      setDocuments((d) => d.filter((x) => x.id !== docId));
    } catch { toast.error('Delete failed'); }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  if (loading) return <Shell><div className="spinner-full"><div className="spinner" /></div></Shell>;

  const initials = getInitials(userData?.name);
  const manager = userData?.manager;

  return (
    <Shell>
      <style>{`
        .emp-detail-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .emp-detail-grid { grid-template-columns: 1fr; }
        }
        .forte-group { margin-bottom: 16px; }
        .forte-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 600px) {
          .forte-row { grid-template-columns: 1fr; }
        }
        .forte-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: rgba(21,22,26,0.55);
          margin-bottom: 5px;
          letter-spacing: 0.2px;
        }
        .forte-input {
          width: 100%;
          padding: 9px 12px;
          border: 1.5px solid #E4E3DC;
          border-radius: 8px;
          font-size: 14px;
          font-family: Inter, sans-serif;
          color: #15161A;
          background: #FAFAF7;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .forte-input:focus {
          border-color: #C8203D;
          box-shadow: 0 0 0 3px rgba(200,32,61,0.08);
          background: #FFFFFF;
        }
        .forte-input::placeholder { color: rgba(21,22,26,0.3); }
        .forte-input:disabled, .forte-input[readonly] {
          background: #F5F4EF;
          color: rgba(21,22,26,0.5);
          cursor: not-allowed;
        }
        .forte-select {
          width: 100%;
          padding: 9px 12px;
          border: 1.5px solid #E4E3DC;
          border-radius: 8px;
          font-size: 14px;
          font-family: Inter, sans-serif;
          color: #15161A;
          background: #FAFAF7;
          outline: none;
          cursor: pointer;
          appearance: auto;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .forte-select:focus {
          border-color: #C8203D;
          box-shadow: 0 0 0 3px rgba(200,32,61,0.08);
          background: #FFFFFF;
        }
        .forte-select:disabled {
          background: #F5F4EF;
          color: rgba(21,22,26,0.5);
          cursor: not-allowed;
        }
        .forte-textarea {
          width: 100%;
          padding: 9px 12px;
          border: 1.5px solid #E4E3DC;
          border-radius: 8px;
          font-size: 14px;
          font-family: Inter, sans-serif;
          color: #15161A;
          background: #FAFAF7;
          outline: none;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .forte-textarea:focus {
          border-color: #C8203D;
          box-shadow: 0 0 0 3px rgba(200,32,61,0.08);
          background: #FFFFFF;
        }
        .forte-textarea::placeholder { color: rgba(21,22,26,0.3); }
      `}</style>

      {/* Back to employees */}
      <div style={{ marginBottom: 16 }}>
        <button className="btn-ghost" onClick={() => navigate('/employees')}>
          <ArrowLeft size={15} /> Back to employees
        </button>
      </div>

      {/* Section 1 — Hero header */}
      <div
        style={{
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 24, marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24,
        }}
      >
        {/* Left — identity */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', minWidth: 0 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: C.accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, flexShrink: 0, letterSpacing: '0.02em',
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.dark }}>{userData?.name}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: '#6b7280' }}>{userData?.email}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {userData?.role && (
                <span style={{ background: C.accent, color: '#fff', fontSize: 12, padding: '4px 12px', borderRadius: 9999 }}>
                  {roleLabel(userData.role)}
                </span>
              )}
              {employee?.employeeCode && (
                <span style={{ border: `1px solid ${C.border}`, color: '#4b5563', fontSize: 12, padding: '4px 12px', borderRadius: 9999 }}>
                  {employee.employeeCode}
                </span>
              )}
              {(userData?.department || employee?.department) && (
                <span style={{ border: `1px solid ${C.border}`, color: '#4b5563', fontSize: 12, padding: '4px 12px', borderRadius: 9999 }}>
                  {userData?.department || employee?.department}
                </span>
              )}
            </div>
            {employee?.joinDate && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#9ca3af' }}>Joined {formatDate(employee.joinDate)}</p>
            )}
          </div>
        </div>

        {/* Right — Reporting Manager */}
        {manager && (
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Reporting Manager
            </p>
            <div style={{
              background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)', minWidth: 260,
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#3b82f6', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600,
                }}>
                  {getInitials(manager.name)}
                </div>
                <span style={{
                  position: 'absolute', bottom: 0, right: 0, width: 8, height: 8,
                  borderRadius: '50%', background: '#4ade80', border: '1.5px solid #fff',
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{manager.name}</span>
                {manager.jobTitle && (
                  <span style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{manager.jobTitle}</span>
                )}
                <span
                  onClick={() => navigate('/employees/' + manager.id)}
                  style={{ fontSize: 12, color: C.accent, fontWeight: 500, marginTop: 8, cursor: 'pointer' }}
                >
                  View profile →
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2 — Two columns */}
      <div className="emp-detail-grid">

        {/* Left — Profile form */}
        <div className="card">
          <h3 className="section-title">Employee Profile</h3>
          <form onSubmit={handleSave}>
            <p style={subLabel}>PERSONAL INFORMATION</p>
            <div className="forte-group">
              <label className="forte-label">Full Name<span style={{ color: '#C8203D', marginLeft: 2 }}>*</span></label>
              <input className="forte-input" value={form.name} onChange={f('name')} required placeholder="e.g. John Smith" />
            </div>
            <div className="forte-row">
              <div className="forte-group">
                <label className="forte-label">Employee Code<span style={{ color: '#C8203D', marginLeft: 2 }}>*</span></label>
                <input className="forte-input" value={form.employeeCode} onChange={f('employeeCode')} required placeholder="e.g. FT-001" />
              </div>
              <div className="forte-group">
                <label className="forte-label">Department</label>
                <select className="forte-select" value={form.department} onChange={f('department')}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="forte-row">
              <div className="forte-group">
                <label className="forte-label">Designation</label>
                <input className="forte-input" value={form.designation} onChange={f('designation')} placeholder="e.g. Software Engineer" />
              </div>
              <div className="forte-group">
                <label className="forte-label">Join Date</label>
                <input type="date" className="forte-input" value={form.joinDate} onChange={f('joinDate')} />
              </div>
            </div>
            <div className="forte-group">
              <label className="forte-label">Contact Number</label>
              <input className="forte-input" value={form.contactNumber} onChange={f('contactNumber')} placeholder="+94 77 000 0000" />
            </div>
            <div className="forte-group">
              <label className="forte-label">Address</label>
              <textarea className="forte-textarea" value={form.address} onChange={f('address')} placeholder="Home address" />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E4E3DC', margin: '20px 0' }} />

            <p style={subLabel}>EMERGENCY CONTACT</p>
            <div className="forte-row">
              <div className="forte-group">
                <label className="forte-label">Emergency Contact</label>
                <input className="forte-input" value={form.emergencyContact} onChange={f('emergencyContact')} placeholder="Contact name" />
              </div>
              <div className="forte-group">
                <label className="forte-label">Emergency Phone</label>
                <input className="forte-input" value={form.emergencyPhone} onChange={f('emergencyPhone')} placeholder="+94 77 000 0000" />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%', background: '#C8203D', color: '#fff',
                borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14,
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: 8, opacity: saving ? 0.6 : 1, fontFamily: 'inherit',
              }}
            >
              {saving ? 'Saving…' : (employee ? 'Update Profile' : 'Create Profile')}
            </button>
          </form>
        </div>

        {/* Right — Documents + Leave Entitlement */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card">
          <h3 className="section-title">Documents ({documents.length})</h3>

          {/* Drop zone */}
          {employee ? (
            <div
              style={{
                border: `2px dashed ${dragging ? '#C8203D' : '#E4E3DC'}`,
                borderRadius: 10,
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: 20,
                background: dragging ? 'rgba(200,32,61,0.03)' : '#FAFAF7',
                transition: 'border-color 0.18s, background 0.18s',
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
            >
              <Upload size={22} style={{ color: 'rgba(21,22,26,0.3)', marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(21,22,26,0.6)' }}>Drag & drop or <span style={{ color: '#C8203D', fontWeight: 500 }}>click to upload</span></p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(21,22,26,0.35)' }}>Any file type · Max 10 MB</p>
              <input ref={fileInputRef} type="file" hidden onChange={(e) => { if (e.target.files[0]) handleUpload(e.target.files[0]); e.target.value = ''; }} />
            </div>
          ) : (
            <div
              style={{
                border: '2px dashed #E4E3DC',
                borderRadius: 10,
                padding: '28px 20px',
                textAlign: 'center',
                cursor: 'not-allowed',
                marginBottom: 20,
                background: '#F2F1EC',
                opacity: 0.6,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
            >
              <Upload size={22} style={{ color: 'rgba(21,22,26,0.25)', marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(21,22,26,0.5)' }}>Save employee profile first before uploading documents</p>
            </div>
          )}

          {uploading && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(21,22,26,0.5)', marginBottom: 6 }}>
                <span>Uploading…</span><span>{uploadProgress}%</span>
              </div>
              <div style={{ height: 4, background: '#E4E3DC', borderRadius: 4 }}>
                <div style={{ height: 4, background: '#C8203D', borderRadius: 4, width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
              </div>
            </div>
          )}

          {documents.length === 0 ? (
            <div className="empty-state">
              <FileText size={24} style={{ color: 'rgba(21,22,26,0.2)' }} />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map((doc) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid #E4E3DC', borderRadius: 8, background: '#FAFAF7' }}>
                  <FileText size={16} style={{ color: '#C8203D', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#15161A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(21,22,26,0.4)' }}>
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                      {formatSize(doc.fileSize) && ` · ${formatSize(doc.fileSize)}`}
                    </p>
                  </div>
                  <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => handleDownload(doc.id)}>Download</button>
                  <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(doc.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {canManageLeave && <LeaveEntitlementCard userId={userId} />}
        {canManageLeave && <AssignRoleCard userId={userId} currentRoleId={userData?.assignedRoleId} />}
        </div>
      </div>
    </Shell>
  );
}

function LeaveEntitlementCard({ userId }) {
  const year = new Date().getFullYear();
  const [ent, setEnt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [totalDays, setTotalDays] = useState('18');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get(`/leaves/entitlement/${userId}`)
      .then((r) => { setEnt(r.data); setTotalDays(String(r.data?.totalDays ?? 18)); })
      .catch(() => setEnt(null))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/leaves/entitlement', { employeeId: userId, year, totalDays: parseFloat(totalDays) });
      toast.success('Entitlement saved');
      setEditing(false);
      setLoading(true);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save entitlement');
    } finally {
      setSaving(false);
    }
  };

  const total = parseFloat(ent?.totalDays ?? 0) || 0;
  const used = parseFloat(ent?.usedDays ?? 0) || 0;
  const assigned = ent && total > 0;

  const metaLabel = { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(21,22,26,0.4)', margin: 0 };
  const metaValue = { fontSize: 22, fontWeight: 600, color: C.dark, margin: '4px 0 0', lineHeight: 1 };
  const primaryBtn = {
    background: '#C8203D', color: '#fff', borderRadius: 8, padding: '9px 16px',
    fontWeight: 600, fontSize: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', opacity: saving ? 0.6 : 1,
  };

  return (
    <div className="card">
      <h3 className="section-title">Leave Entitlement · {year}</h3>
      {loading ? (
        <p style={{ fontSize: 13, color: C.muted }}>Loading…</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 28, marginBottom: 18 }}>
            <div>
              <p style={metaLabel}>Total</p>
              <p style={{ ...metaValue, fontSize: assigned ? 22 : 15, fontWeight: assigned ? 600 : 500, color: assigned ? C.dark : C.muted }}>
                {assigned ? total : 'Not assigned yet'}
              </p>
            </div>
            {assigned && (
              <>
                <div>
                  <p style={metaLabel}>Used</p>
                  <p style={metaValue}>{used}</p>
                </div>
                <div>
                  <p style={metaLabel}>Remaining</p>
                  <p style={{ ...metaValue, color: total - used > 0 ? C.green : C.red }}>{total - used}</p>
                </div>
              </>
            )}
          </div>

          {editing ? (
            <div>
              <label className="forte-label">Total Days</label>
              <input
                className="forte-input"
                type="number"
                step="0.5"
                min="0"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={save} disabled={saving} style={primaryBtn}>{saving ? 'Saving…' : 'Save'}</button>
                <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} style={primaryBtn}>Edit Entitlement</button>
          )}
        </>
      )}
    </div>
  );
}

function AssignRoleCard({ userId, currentRoleId }) {
  const [roles, setRoles] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/roles')
      .then((r) => setRoles(r.data || []))
      .catch(() => { setLoadError(true); setRoles([]); });
  }, []);

  // Keep the dropdown in sync if the parent's assigned role loads/changes.
  useEffect(() => { setSelectedRoleId(currentRoleId || ''); }, [currentRoleId]);

  const currentRole = (roles || []).find((r) => r.id === currentRoleId);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/roles/assign/${userId}`, { roleId: selectedRoleId || null });
      toast.success('Role assigned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign role');
    } finally {
      setSaving(false);
    }
  };

  const primaryBtn = {
    background: '#C8203D', color: '#fff', borderRadius: 8, padding: '9px 16px',
    fontWeight: 600, fontSize: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', opacity: saving ? 0.6 : 1, marginTop: 12,
  };

  return (
    <div className="card">
      <h3 className="section-title">Assign Role</h3>
      {roles === null ? (
        <p style={{ fontSize: 13, color: C.muted }}>Loading…</p>
      ) : loadError ? (
        <p style={{ fontSize: 13, color: C.red }}>Failed to load roles.</p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 12px' }}>
            Currently assigned:{' '}
            <strong style={{ color: C.dark }}>{currentRole ? currentRole.name : 'None'}</strong>
          </p>
          <label className="forte-label">Role</label>
          <select
            className="forte-select"
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
          >
            <option value="">No role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button onClick={save} disabled={saving} style={primaryBtn}>
            {saving ? 'Saving…' : 'Save Role'}
          </button>
          <p style={{ fontSize: 12, color: C.muted, margin: '12px 0 0' }}>
            User must log out and back in for role changes to take effect.
          </p>
        </>
      )}
    </div>
  );
}

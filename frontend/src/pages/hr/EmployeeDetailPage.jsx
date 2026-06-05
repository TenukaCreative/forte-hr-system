import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Upload, Trash2, FileText, ArrowLeft } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import { formatDate } from '../../components/theme';
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

export default function EmployeeDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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

  const initials = userData?.name
    ? userData.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

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

      {/* Section 1 — Header card */}
      <div
        className="card"
        style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#C8203D', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, flexShrink: 0, letterSpacing: '0.02em',
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{userData?.name}</h1>
            <p style={{ margin: '2px 0 0', fontSize: 14, color: 'rgba(21,22,26,0.5)' }}>{userData?.email}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {userData?.role && <span style={rolePill}>{roleLabel(userData.role)}</span>}
              {employee?.employeeCode && <span style={infoPill}>{employee.employeeCode}</span>}
              {employee?.department && <span style={infoPill}>{employee.department}</span>}
              {employee?.joinDate && <span style={infoPill}>Joined {formatDate(employee.joinDate)}</span>}
            </div>
          </div>
        </div>
        <button className="btn-ghost" style={{ alignSelf: 'flex-start', flexShrink: 0 }} onClick={() => navigate('/employees')}>
          <ArrowLeft size={15} /> Back to employees
        </button>
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
            <div className="forte-group">
              <label className="forte-label">System Role</label>
              <select className="forte-select" value={form.role} onChange={f('role')}>
                <option value="">Select role…</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
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

        {/* Right — Documents */}
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
      </div>
    </Shell>
  );
}

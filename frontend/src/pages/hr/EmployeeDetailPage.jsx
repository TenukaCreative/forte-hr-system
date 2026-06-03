import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Upload, Trash2, FileText, ArrowLeft } from 'lucide-react';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';

const DEPARTMENTS = ['IT', 'HR', 'PMO', 'Finance', 'Operations'];

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
        // No employee record yet — still seed the name from the user account.
        setForm((prev) => ({ ...prev, name: data.user?.name || '' }));
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

  return (
    <Shell>
      <div className="page-header">
        <div>
          <button className="btn-ghost" style={{ marginBottom: 8, paddingLeft: 0 }} onClick={() => navigate('/employees')}>
            <ArrowLeft size={15} /> Back to employees
          </button>
          <h1>{userData?.name}</h1>
          <p>{userData?.email} · <span style={{ textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>{userData?.role?.replace(/_/g, ' ')}</span></p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* Profile form */}
        <div className="card">
          <h3 className="section-title">Employee Profile</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={f('name')} required placeholder="e.g. John Smith" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Employee Code *</label>
                <input className="form-input" value={form.employeeCode} onChange={f('employeeCode')} required placeholder="e.g. FT-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={form.department} onChange={f('department')}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Designation</label>
                <input className="form-input" value={form.designation} onChange={f('designation')} placeholder="e.g. Software Engineer" />
              </div>
              <div className="form-group">
                <label className="form-label">Join Date</label>
                <input type="date" className="form-input" value={form.joinDate} onChange={f('joinDate')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input className="form-input" value={form.contactNumber} onChange={f('contactNumber')} placeholder="+94 77 000 0000" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-textarea" value={form.address} onChange={f('address')} placeholder="Home address" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Emergency Contact</label>
                <input className="form-input" value={form.emergencyContact} onChange={f('emergencyContact')} placeholder="Contact name" />
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Phone</label>
                <input className="form-input" value={form.emergencyPhone} onChange={f('emergencyPhone')} placeholder="+94 77 000 0000" />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? 'Saving…' : (employee ? 'Update Profile' : 'Create Profile')}
            </button>
          </form>
        </div>

        {/* Documents */}
        <div className="card">
          <h3 className="section-title">Documents</h3>

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

      <style>{`@media(max-width:900px){.emp-detail-grid{grid-template-columns:1fr!important}}`}</style>
    </Shell>
  );
}

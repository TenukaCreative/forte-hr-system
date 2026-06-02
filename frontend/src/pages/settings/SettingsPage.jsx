import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Shell from '../../components/layout/Shell';
import api from '../../api/axios';
import { C, card, scoreColor } from '../../components/theme';
import { Spinner, Button } from '../../components/ui';

export default function SettingsPage() {
  const [kpiWeight, setKpiWeight] = useState(50);
  const [ethicsWeight, setEthicsWeight] = useState(50);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings/performance')
      .then((r) => {
        setKpiWeight(Math.round(Number(r.data?.kpiWeight ?? 50)));
        setEthicsWeight(Math.round(Number(r.data?.ethicsWeight ?? 50)));
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const valid = kpiWeight + ethicsWeight === 100;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await api.post('/settings/performance', { kpiWeight, ethicsWeight });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Shell><Spinner /></Shell>;

  const finalScore = (70 * kpiWeight / 100) + (80 * ethicsWeight / 100);

  return (
    <Shell>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
          Configure performance calculation weights
        </p>
      </div>

      <div style={{ ...card, maxWidth: 600 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: '0 0 8px' }}>
          Performance Score Weights
        </h3>
        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 28px', lineHeight: 1.6 }}>
          Control how KPI completion and ethics review contribute to the final
          performance score. Total must equal 100%.
        </p>

        {/* KPI Weight */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>KPI Weight</label>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{kpiWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={kpiWeight}
            onChange={(e) => {
              const v = Number(e.target.value);
              setKpiWeight(v);
              setEthicsWeight(100 - v);
            }}
            style={{ width: '100%', accentColor: C.accent }}
          />
          <p style={{ fontSize: 12, color: C.muted, margin: '6px 0 0' }}>Task completion score weight</p>
        </div>

        {/* Ethics Weight */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>Ethics Review Weight</label>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{ethicsWeight}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={ethicsWeight}
            onChange={(e) => {
              const v = Number(e.target.value);
              setEthicsWeight(v);
              setKpiWeight(100 - v);
            }}
            style={{ width: '100%', accentColor: C.accent }}
          />
          <p style={{ fontSize: 12, color: C.muted, margin: '6px 0 0' }}>Ethics review score weight</p>
        </div>

        {/* Live preview */}
        <div style={{
          background: 'rgba(200,32,61,0.04)', border: '1px solid rgba(200,32,61,0.12)',
          borderRadius: 8, padding: 16, margin: '24px 0', fontSize: 13,
        }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, color: C.dark }}>Preview (KPI: 70, Ethics: 80)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
              <span>KPI contribution</span>
              <span>70 × {kpiWeight}% = {(70 * kpiWeight / 100).toFixed(1)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted }}>
              <span>Ethics contribution</span>
              <span>80 × {ethicsWeight}% = {(80 * ethicsWeight / 100).toFixed(1)}</span>
            </div>
            <div style={{ height: 1, background: C.border, margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: C.dark }}>
              <span>Final Score</span>
              <span style={{ color: scoreColor(finalScore) }}>{finalScore.toFixed(1)} / 100</span>
            </div>
          </div>
        </div>

        {/* Validation */}
        {valid ? (
          <p style={{ color: C.green, fontSize: 13, fontWeight: 500, margin: '0 0 16px' }}>
            ✅ Weights total 100% — valid
          </p>
        ) : (
          <p style={{ color: C.red, fontSize: 13, fontWeight: 500, margin: '0 0 16px' }}>
            ❌ Weights must total 100%
          </p>
        )}

        <Button
          variant="primary"
          disabled={saving || !valid}
          onClick={handleSave}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </Shell>
  );
}

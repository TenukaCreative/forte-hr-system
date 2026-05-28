import Shell from './layout/Shell';

export default function PlaceholderPage({ title }) {
  return (
    <Shell>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="card">
        <div className="empty-state" style={{ padding: '60px 0' }}>
          <p style={{ fontSize: 15 }}>Coming soon</p>
          <p style={{ fontSize: 13, color: 'rgba(21,22,26,0.4)', marginTop: 4 }}>This feature is under development</p>
        </div>
      </div>
    </Shell>
  );
}

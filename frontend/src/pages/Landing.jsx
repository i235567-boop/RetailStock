import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Nav */}
      <nav style={{ padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div className="flex gap-12 items-center">
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,var(--primary),var(--accent))', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', color: 'white', boxShadow: 'var(--shadow-glow)' }}>RS</div>
          <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>RetailStock</span>
        </div>
        <div className="flex gap-12">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: '80px 40px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }} className="fade-in-up">
        <div style={{ display: 'inline-block', padding: '5px 14px', background: 'var(--primary-glow)', border: '1px solid rgba(59,111,212,0.3)', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: 24 }}>
          ⚡ Just-in-Time Inventory Financing for Pakistan's 2M Kirana Stores
        </div>
        <h1 style={{ marginBottom: 20, background: 'linear-gradient(135deg, #E8EDF5 0%, #5B8FF9 50%, #00C2CC 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Never Miss a Sale<br />Due to Cash Flow
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
          RetailStock provides instant, Shariah-compliant Murabaha financing at point of order — so you can restock fast, grow your store, and leave informal lenders behind.
        </p>
        <div className="flex gap-16" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Start Free Today →</button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '60px 40px', maxWidth: 1000, margin: '0 auto' }}>
        <div className="grid grid-3" style={{ gap: 20 }}>
          {[
            { icon: '⚡', title: 'Instant Approval', desc: 'Credit decisions in under 500ms based on your transaction history — no collateral needed.' },
            { icon: '🕌', title: 'Shariah-Compliant', desc: 'Murabaha financing with transparent cost-plus-markup. Zero interest, full compliance.' },
            { icon: '📊', title: 'Smart Analytics', desc: 'Track spending, manage budgets, monitor financing — all in one dashboard.' },
            { icon: '🔒', title: 'Bank-Grade Security', desc: 'JWT authentication, encrypted storage, rule-based fraud detection, and full audit trails.' },
            { icon: '📱', title: 'Mobile-First', desc: 'Designed for budget Android devices. Fast, lightweight, works on 2G data.' },
            { icon: '🤝', title: 'B2B Integration', desc: 'Embedded financing widget integrates directly into Bazaar, Dastgyr, and partner checkouts.' },
          ].map((f, i) => (
            <div key={i} className={`card fade-in-up-${i % 4 + 1}`} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: '40px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>How it Works</h2>
          <p className="text-muted text-small mb-24">Get financing in 3 simple steps</p>
          <div className="grid grid-3" style={{ gap: 20 }}>
            {[
              { step: '01', title: 'Add to Cart', desc: 'Order from your distributor. RetailStock detects any shortfall automatically.' },
              { step: '02', title: 'Review Terms', desc: 'See the Murabaha markup and total upfront. Confirm with your PIN.' },
              { step: '03', title: 'Get Stocked', desc: 'Funds disbursed instantly. Repay when you sell — auto-debit or manual.' },
            ].map(s => (
              <div key={s.step} className="card">
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: '0.1em', marginBottom: 10 }}>STEP {s.step}</div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 12 }}>Ready to grow your store?</h2>
        <p className="text-muted mb-24">Join thousands of Kirana store owners using RetailStock</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>Create Free Account →</button>
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        © 2026 RetailStock · Just-in-Time Inventory Financing · FAST University Islamabad · CS3010 Web Engineering
      </footer>
    </div>
  );
}

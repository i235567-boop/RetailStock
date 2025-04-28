import { useNavigate } from 'react-router-dom';
import Icon from '../components/common/Icon';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-root)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', textAlign:'center', padding:24 }}>
      <div style={{ fontFamily:'Sora,sans-serif', fontSize:'6rem', fontWeight:800, letterSpacing:'-0.04em', color:'var(--border-strong)', lineHeight:1, marginBottom:24 }}>404</div>
      <h2 style={{ marginBottom:10 }}>Page not found</h2>
      <p style={{ fontSize:'0.9rem', color:'var(--text-muted)', marginBottom:32, maxWidth:360 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-12">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <Icon name="chevron_down" size={13} style={{ transform:'rotate(90deg)' }} /> Go Back
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <Icon name="home" size={14} /> Home
        </button>
      </div>
    </div>
  );
}

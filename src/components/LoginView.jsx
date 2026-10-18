import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, Building2, User } from 'lucide-react';
import { loginCustomer } from '../api/client';

export default function LoginView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const u = username.trim();
    const p = password.trim();

    if (!u) {
      setError('Lütfen TCKN, Müşteri No veya Kullanıcı Adınızı giriniz.');
      return;
    }

    if (!p) {
      setError('Lütfen şifrenizi giriniz.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginCustomer(u, p);
      if (res.status === 'success' && res.customer) {
        onLogin(res.customer);
      } else {
        setError(res.message || 'Kullanıcı adı veya şifre hatalı.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol ediniz.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '3rem auto',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      border: '1px solid #E5E7EB'
    }}>
      {/* Kırmızı Başlık Barı */}
      <div style={{
        backgroundColor: 'var(--akbank-red)',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Building2 size={32} />
          <span style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '1px' }}>AKBANK</span>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Direkt İnternet Bankacılığı</h2>
        <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
          Güvenli oturum açmak için kullanıcı bilgilerinizi ve şifrenizi giriniz.
        </p>
      </div>

      <div style={{ padding: '2rem' }}>
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Kullanıcı Adı / TCKN / Müşteri No:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Örn: serkan veya 0071948201"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              İnternet / Mobil Bankacılık Şifresi:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Şifrenizi giriniz"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: '10px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: 'var(--akbank-red)',
              color: 'white',
              border: 'none',
              padding: '14px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 12px rgba(220, 0, 26, 0.25)'
            }}
          >
            {loading ? (
              <span>Giriş Yapılıyor...</span>
            ) : (
              <>
                <span>Güvenli Giriş Yap</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid #F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: '#6B7280',
          fontSize: '0.8rem'
        }}>
          <ShieldCheck size={16} color="#10B981" />
          <span>Akbank Direkt 256-Bit SSL Uçtan Uca Şifreleme ile Korunmaktadır</span>
        </div>
      </div>
    </div>
  );
}

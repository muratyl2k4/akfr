import React from 'react';
import { Building2, UserPlus, LogOut, User } from 'lucide-react';

export default function Header({ currentUser, onLogout, onNewCustomer }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-section">
          <Building2 size={28} />
          <span className="brand-title">LAZ(MKA)</span>
          <span className="brand-subtitle">Direkt İnternet Bankacılığı</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  color: 'var(--akbank-red)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.75rem'
                }}>
                  {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'A'}
                </div>
                <span style={{ fontWeight: 600 }}>{currentUser.full_name}</span>
                <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>({currentUser.customer_no})</span>
              </div>

              <button
                onClick={onNewCustomer}
                className="btn"
                style={{ backgroundColor: 'white', color: 'var(--akbank-red)', padding: '0.45rem 0.85rem' }}
                title="Yeni Müşteri Tanımla"
              >
                <UserPlus size={16} />
                Yeni Müşteri
              </button>

              <button
                onClick={onLogout}
                className="btn"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '0.45rem 0.85rem'
                }}
                title="Oturumu Kapat"
              >
                <LogOut size={16} />
                Güvenli Çıkış
              </button>
            </>
          ) : (
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              🔒 Güvenli Giriş Alanı
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import React from 'react';
import { User, CreditCard, RefreshCw, Edit, MapPin, FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { getStatementPdfUrl, downloadStatementPdf } from '../api/client';

export default function CustomerCard({ customer, onEdit, onRecalculate, isRecalculating }) {
  const [statementPeriod, setStatementPeriod] = React.useState('1m'); // '1d', '1w', '1m'

  if (!customer) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--akbank-text-muted)' }}>Lütfen bir müşteri seçin veya yeni müşteri ekleyin.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' TL';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            backgroundColor: 'var(--akbank-light-red)',
            color: 'var(--akbank-red)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{customer.full_name}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--akbank-text-muted)' }}>
              Müşteri No: <strong>{customer.customer_no}</strong>{customer.username && <> | Kullanıcı Adı: <strong>{customer.username}</strong></>} | TCKN: <strong>{customer.tc_no}</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Ekstre Dönem Filtresi: 1 Gün, 1 Hafta, 1 Ay */}
          <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '3px', borderRadius: '8px', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setStatementPeriod('1d')}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: statementPeriod === '1d' ? 700 : 500,
                borderRadius: '6px',
                backgroundColor: statementPeriod === '1d' ? 'var(--akbank-red)' : 'transparent',
                color: statementPeriod === '1d' ? 'white' : '#374151',
              }}
            >
              1 Gün
            </button>
            <button
              type="button"
              onClick={() => setStatementPeriod('1w')}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: statementPeriod === '1w' ? 700 : 500,
                borderRadius: '6px',
                backgroundColor: statementPeriod === '1w' ? 'var(--akbank-red)' : 'transparent',
                color: statementPeriod === '1w' ? 'white' : '#374151',
              }}
            >
              1 Hafta
            </button>
            <button
              type="button"
              onClick={() => setStatementPeriod('1m')}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: statementPeriod === '1m' ? 700 : 500,
                borderRadius: '6px',
                backgroundColor: statementPeriod === '1m' ? 'var(--akbank-red)' : 'transparent',
                color: statementPeriod === '1m' ? 'white' : '#374151',
              }}
            >
              1 Ay
            </button>
            <button
              type="button"
              onClick={() => setStatementPeriod('all')}
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: statementPeriod === 'all' ? 700 : 500,
                borderRadius: '6px',
                backgroundColor: statementPeriod === 'all' ? 'var(--akbank-red)' : 'transparent',
                color: statementPeriod === 'all' ? 'white' : '#374151',
              }}
            >
              Tümü
            </button>
          </div>

          <button
            onClick={() => downloadStatementPdf(customer.id, `Akbank_Hesap_Ozeti_${customer.customer_no}_${statementPeriod}.pdf`, undefined, undefined, statementPeriod)}
            className="btn btn-receipt"
            style={{ fontWeight: 700 }}
            title={`${statementPeriod === '1d' ? 'Son 1 Gün' : statementPeriod === '1w' ? 'Son 1 Hafta' : statementPeriod === 'all' ? 'Tüm İşlemler' : '1 Aylık'} Akbank Hesap Özeti PDF İndir`}
          >
            <FileText size={15} />
            Hesap Özeti (PDF)
          </button>
          <a
            href={getStatementPdfUrl(customer.id, undefined, undefined, statementPeriod)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-receipt"
            style={{ padding: '0.55rem 0.65rem' }}
            title="Seçili Dönem Hesap Özetini Yeni Sekmede Aç"
          >
            <ExternalLink size={15} />
          </a>
          <button
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="btn btn-secondary"
            title="Otomatik bakiye ve masraf motorunu yeniden çalıştır"
          >
            <RefreshCw size={15} className={isRecalculating ? 'spin' : ''} />
            {isRecalculating ? 'Hesaplanıyor...' : 'Bakiyeyi Yenile'}
          </button>
          <button onClick={onEdit} className="btn btn-secondary">
            <Edit size={15} />
            Düzenle
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="customer-summary-grid">
          <div className="summary-item">
            <span className="summary-label">Güncel Bakiye</span>
            <span className="balance-highlight">{formatCurrency(customer.current_balance)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--akbank-text-muted)' }}>
              Başlangıç: {formatCurrency(customer.initial_balance)}
            </span>
          </div>

          <div className="summary-item">
            <span className="summary-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="#059669" />
              Artı Para Limiti
            </span>
            <span className="summary-value" style={{ fontSize: '1.4rem', color: '#111827', fontWeight: 800 }}>
              {formatCurrency(customer.overdraft_limit)}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
              Kullanılabilir: {formatCurrency(customer.available_overdraft_limit || customer.overdraft_limit)}
              {customer.overdraft_interest_rate && ` (Faiz: %${customer.overdraft_interest_rate})`}
            </span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Hesap & Şube Bilgisi</span>
            <span className="summary-value">{customer.account_no}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--akbank-text-muted)' }}>
              {customer.branch_name}
            </span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Akbank IBAN</span>
            <span className="summary-value" style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              {customer.iban}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--akbank-text-muted)' }}>
              Banka Kodu: 00046 (Akbank T.A.Ş.)
            </span>
          </div>

          <div className="summary-item">
            <span className="summary-label">Açık Adres</span>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: '0.825rem', color: '#4b5563' }}>
              <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{customer.address}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

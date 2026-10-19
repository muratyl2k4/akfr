import React, { useState } from 'react';
import { PlusCircle, FileText, Download, Trash2, ArrowUpRight, ArrowDownLeft, ExternalLink, FileEdit } from 'lucide-react';
import { getReceiptPdfUrl, downloadReceiptPdf } from '../api/client';

export default function TransactionList({ transactions, onNewTransaction, onDeleteTransaction, onEditReceipt }) {
  const [filter, setFilter] = useState('ALL'); // ALL, IN, OUT, FEE

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'IN') return tx.is_credit;
    if (filter === 'OUT') return !tx.is_credit && !tx.parent_transaction && tx.transaction_type !== 'EFT KOMİSYONU' && tx.transaction_type !== 'EFT BSMV';
    if (filter === 'FEE') return tx.parent_transaction != null || tx.transaction_type === 'KESİNTİ VE EKLERİ' || tx.transaction_type === 'EFT KOMİSYONU' || tx.transaction_type === 'EFT BSMV' || tx.tag === 'Masraf' || tx.tag === 'Vergi';
    return true;
  });

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' TL';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Hesap Hareketleri</h3>
          <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setFilter('ALL')}
              className="btn"
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.775rem',
                backgroundColor: filter === 'ALL' ? 'white' : 'transparent',
                boxShadow: filter === 'ALL' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Tümü ({transactions.length})
            </button>
            <button
              onClick={() => setFilter('IN')}
              className="btn"
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.775rem',
                backgroundColor: filter === 'IN' ? 'white' : 'transparent',
                boxShadow: filter === 'IN' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Gelen (+)
            </button>
            <button
              onClick={() => setFilter('OUT')}
              className="btn"
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.775rem',
                backgroundColor: filter === 'OUT' ? 'white' : 'transparent',
                boxShadow: filter === 'OUT' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Giden (-)
            </button>
            <button
              onClick={() => setFilter('FEE')}
              className="btn"
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.775rem',
                backgroundColor: filter === 'FEE' ? 'white' : 'transparent',
                boxShadow: filter === 'FEE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Kesintiler (EFT Kom/BSMV)
            </button>
          </div>
        </div>

        <button onClick={onNewTransaction} className="btn btn-primary">
          <PlusCircle size={16} />
          Yeni İşlem Ekle
        </button>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tarih / Saat</th>
              <th>İşlem Tipi & Açıklama</th>
              <th>Alıcı / Muhatap</th>
              <th style={{ textAlign: 'right' }}>Tutar</th>
              <th style={{ textAlign: 'right' }}>İşlem Sonrası Bakiye</th>
              <th style={{ textAlign: 'center' }}>Akbank Dekontu</th>
              <th style={{ textAlign: 'center' }}>Sil</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--akbank-text-muted)' }}>
                  Kayıtlı işlem bulunamadı.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const isFee = tx.parent_transaction != null ||
                  tx.transaction_type === 'KESİNTİ VE EKLERİ' ||
                  tx.transaction_type === 'EFT KOMİSYONU' ||
                  tx.transaction_type === 'EFT BSMV' ||
                  (tx.transaction_type && tx.transaction_type.toUpperCase().includes('KOMİSYON')) ||
                  (tx.transaction_type && tx.transaction_type.toUpperCase().includes('BSMV')) ||
                  (tx.transaction_type && tx.transaction_type.toUpperCase().includes('KESİNTİ')) ||
                  (tx.description && tx.description.toUpperCase().includes('KESİNTİ')) ||
                  (tx.description && tx.description.toUpperCase().includes('KOMISYON')) ||
                  (tx.description && tx.description.toUpperCase().includes('VERGI')) ||
                  tx.tag === 'Masraf' ||
                  tx.tag === 'Vergi';
                const isBsmv = tx.transaction_type === 'EFT BSMV' || tx.tag === 'Vergi';
                const isComm = tx.transaction_type === 'EFT KOMİSYONU' || tx.tag === 'Masraf';
                const isFormattedOutgoing = !tx.is_credit && tx.description && /^\d{3,}-\S+/.test(tx.description);
                const isFormattedIncoming = tx.is_credit && tx.description && /^(FAST|EFT|HAVALE):/i.test(tx.description);

                return (
                  <tr key={tx.id} style={{ backgroundColor: isFee ? '#fafaf9' : 'transparent' }}>
                    {/* Tarih ve Saat */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{tx.transaction_date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--akbank-text-muted)' }}>
                        {tx.transaction_time}
                      </div>
                    </td>

                    {/* İşlem Tipi ve Açıklama */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {tx.is_credit ? (
                          <span className="badge badge-credit">
                            <ArrowDownLeft size={10} style={{ display: 'inline', marginRight: '2px' }} />
                            Gelen
                          </span>
                        ) : isBsmv ? (
                          <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>BSMV</span>
                        ) : isComm ? (
                          <span className="badge badge-fee">Komisyon</span>
                        ) : isFee ? (
                          <span className="badge badge-fee">Masraf</span>
                        ) : (
                          <span className="badge badge-debit">
                            <ArrowUpRight size={10} style={{ display: 'inline', marginRight: '2px' }} />
                            Giden
                          </span>
                        )}
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{tx.transaction_type}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: (isFormattedOutgoing || isFormattedIncoming) ? '#111827' : 'var(--akbank-text-muted)', marginTop: '3px', fontFamily: (isFormattedOutgoing || isFormattedIncoming) ? 'monospace' : 'inherit', fontWeight: (isFormattedOutgoing || isFormattedIncoming) ? 600 : 400 }}>
                        {tx.description || tx.tag}
                        {tx.parent_transaction && (
                          <span style={{ fontSize: '0.75rem', color: '#b45309', marginLeft: '6px', fontFamily: 'sans-serif' }}>
                            (Bağlı Transfer #{tx.parent_transaction})
                          </span>
                        )}
                      </div>
                      {Number(tx.used_overdraft || 0) > 0 && (
                        <div style={{ marginTop: '3px' }}>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: '#fff1f2',
                              color: '#e11d48',
                              border: '1px solid #fecdd3',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            Kullanılan Artı Para: {formatCurrency(tx.used_overdraft)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Alıcı */}
                    <td>
                      <div style={{ fontWeight: 600 }}>{tx.receiver_name || '-'}</div>
                      {tx.receiver_iban && (
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--akbank-text-muted)' }}>
                          {tx.receiver_iban}
                        </div>
                      )}
                    </td>

                    {/* Tutar */}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span className={tx.is_credit ? 'amount-positive' : 'amount-negative'}>
                        {tx.is_credit ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                      {!tx.is_credit && !isFee && (tx.commission > 0 || tx.bsmv > 0) && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--akbank-text-muted)' }}>
                          Kom: {tx.commission} TL | BSMV: {tx.bsmv} TL
                        </div>
                      )}
                    </td>

                    {/* Bakiye */}
                    <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatCurrency(tx.balance_after)}
                    </td>

                    {/* Dekont Butonları */}
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {!isFee ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => onEditReceipt && onEditReceipt(tx)}
                            className="btn btn-receipt"
                            title="Dekont Bilgilerini Düzenle"
                            style={{ backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' }}
                          >
                            <FileEdit size={13} />
                            Düzenle
                          </button>
                          <button
                            onClick={() => downloadReceiptPdf(tx.id, `Akbank_Dekont_${tx.receipt_serial_no || tx.id}.pdf`)}
                            className="btn btn-receipt"
                            title="Birebir Orijinal Akbank Dekontunu PDF Olarak İndir"
                          >
                            <Download size={13} />
                            Dekont (PDF)
                          </button>
                          <a
                            href={getReceiptPdfUrl(tx.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-receipt"
                            title="Yeni Sekmede Aç"
                            style={{ padding: '0.35rem 0.45rem' }}
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--akbank-text-muted)', fontSize: '0.85rem' }}>-</span>
                      )}
                    </td>

                    {/* Sil Butonu */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="btn-icon-danger"
                        title="İşlemi Sil (Bakiyeler ve bağlı kesinti otomatik güncellenir)"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

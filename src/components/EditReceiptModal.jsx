import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Download,
  ExternalLink,
  Eye,
  FileEdit,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  User,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { TURKISH_BANKS, findBankByIban, findBankByCode } from '../utils/banks';
import { getReceiptPdfUrl, getReceiptPreviewUrl, downloadReceiptPdf } from '../api/client';

export default function EditReceiptModal({ isOpen, onClose, transaction, onSave }) {
  if (!isOpen || !transaction) return null;

  const defaultBank = TURKISH_BANKS[0]; // Garanti Bankası

  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'preview'
  const [maskPreview, setMaskPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const initialBank =
    findBankByCode(transaction.bank_code) ||
    findBankByIban(transaction.receiver_iban) ||
    defaultBank;

  const [formData, setFormData] = useState({
    amount: transaction.amount ? String(transaction.amount) : '0.00',
    is_credit: Boolean(transaction.is_credit),
    transaction_type: transaction.transaction_type || 'EFT BANKALAR ARASI HESABA HAVALE',
    sch_amount: '0.00',
    commission: transaction.commission != null && Number(transaction.commission) > 0 ? String(transaction.commission) : '15.96',
    bsmv: transaction.bsmv != null && Number(transaction.bsmv) > 0 ? String(transaction.bsmv) : '0.80',
    transaction_date: transaction.transaction_date || '',
    transaction_time: transaction.transaction_time || '',
    valor_date: transaction.valor_date || transaction.transaction_date || '',
    reference_no: transaction.reference_no || String(Math.floor(100000000 + Math.random() * 900000000)),
    receiver_name: transaction.receiver_name || '',
    receiver_iban: transaction.receiver_iban || 'TR',
    bank_code: transaction.bank_code || initialBank.code,
    bank_name: transaction.bank_name || initialBank.official_name,
    receiver_branch: transaction.receiver_branch || '-',
    receiver_vkn_tckn: transaction.receiver_vkn_tckn || '',
    receiver_address: transaction.receiver_address || '',
    operator: transaction.operator || 'KENDISI',
    operator_name: transaction.operator_name || '',
    operator_tckn: transaction.operator_tckn || '',
    channel_code: transaction.channel_code || '40033406 / 554193 /',
    qr_token: transaction.qr_token || 'OZDM6v57aYB601',
    description: transaction.description || '',
    user_note: transaction.user_note || '',
    tag: transaction.tag || 'Para Transferi',
  });

  useEffect(() => {
    if (transaction) {
      const b =
        findBankByCode(transaction.bank_code) ||
        findBankByIban(transaction.receiver_iban) ||
        defaultBank;
      setFormData({
        amount: transaction.amount ? String(transaction.amount) : '0.00',
        is_credit: Boolean(transaction.is_credit),
        transaction_type: transaction.transaction_type || 'EFT BANKALAR ARASI HESABA HAVALE',
        sch_amount: '0.00',
        commission: transaction.commission != null && Number(transaction.commission) > 0 ? String(transaction.commission) : '15.96',
        bsmv: transaction.bsmv != null && Number(transaction.bsmv) > 0 ? String(transaction.bsmv) : '0.80',
        transaction_date: transaction.transaction_date || '',
        transaction_time: transaction.transaction_time || '',
        valor_date: transaction.valor_date || transaction.transaction_date || '',
        reference_no: transaction.reference_no || String(Math.floor(100000000 + Math.random() * 900000000)),
        receiver_name: transaction.receiver_name || '',
        receiver_iban: transaction.receiver_iban || 'TR',
        bank_code: transaction.bank_code || b.code,
        bank_name: transaction.bank_name || b.official_name,
        receiver_branch: transaction.receiver_branch || '-',
        receiver_vkn_tckn: transaction.receiver_vkn_tckn || '',
        receiver_address: transaction.receiver_address || '',
        operator: transaction.operator || 'KENDISI',
        operator_name: transaction.operator_name || '',
        operator_tckn: transaction.operator_tckn || '',
        channel_code: transaction.channel_code || '40033406 / 554193 /',
        qr_token: transaction.qr_token || 'OZDM6v57aYB601',
        description: transaction.description || '',
        user_note: transaction.user_note || '',
        tag: transaction.tag || 'Para Transferi',
      });
      setError(null);
      setSuccess(null);
      setPreviewKey(Date.now());
    }
  }, [transaction]);

  const currentBank = findBankByCode(formData.bank_code) || defaultBank;

  // Tutar Hesaplamaları
  const baseAmt = parseFloat(formData.amount) || 0;
  const commAmt = parseFloat(formData.commission) || 0;
  const bsmvAmt = parseFloat(formData.bsmv) || 0;
  const grandTotal = baseAmt + commAmt + bsmvAmt;

  const formatTrCurrency = (val) => {
    return Number(val || 0).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;

    if (name === 'receiver_iban') {
      const detected = findBankByIban(value);
      if (detected) {
        setFormData((prev) => ({
          ...prev,
          receiver_iban: newVal,
          bank_code: detected.code,
          bank_name: detected.official_name,
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newVal,
    }));
  };

  const handleBankChange = (e) => {
    const code = e.target.value;
    const found = findBankByCode(code);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        bank_code: found.code,
        bank_name: found.official_name,
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Lütfen geçerli bir işlem tutarı girin.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      let ref = (formData.reference_no || '').trim();
      if (!ref) {
        ref = '000654698';
      } else if (ref.length < 9 && /^\d+$/.test(ref)) {
        ref = ref.padStart(9, '0');
      }

      const payload = {
        ...formData,
        customer: transaction.customer,
        reference_no: ref,
        bank_code: currentBank.code,
        bank_name: currentBank.official_name,
        amount: parseFloat(formData.amount),
        commission: parseFloat(formData.commission || 0),
        bsmv: parseFloat(formData.bsmv || 0),
        sch_amount: parseFloat(formData.sch_amount || 0),
      };

      await onSave(transaction.id, payload);
      setSuccess('Dekont ve hesap hareketi başarıyla güncellendi!');
      setPreviewKey(Date.now());
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      console.error('Dekont güncelleme hatası:', err);
      setError(err?.response?.data ? JSON.stringify(err.response.data) : 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ backdropFilter: 'blur(3px)' }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '880px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: 'var(--akbank-light-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--akbank-red)',
              }}
            >
              <FileEdit size={20} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.1rem', margin: 0 }}>
                Dekont Bilgilerini Düzenle
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--akbank-text-muted)', marginTop: '2px' }}>
                İşlem #{transaction.id} • Seri No: {transaction.receipt_serial_no || 'AKB-OTOMATİK'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Sekmeler */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                padding: '3px',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'form' ? 'white' : 'transparent',
                  color: activeTab === 'form' ? '#111827' : '#6b7280',
                  boxShadow: activeTab === 'form' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <FileEdit size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Bilgileri Düzenle
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className="btn"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'preview' ? 'white' : 'transparent',
                  color: activeTab === 'preview' ? '#111827' : '#6b7280',
                  boxShadow: activeTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Eye size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Canlı Dekont Önizleme
              </button>
            </div>

            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #fecdd3',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #a7f3d0',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'form' ? (
            <form id="editReceiptForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* 1. TUTAR VE MASRAFLAR BÖLÜMÜ */}
              <div
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '1.1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <DollarSign size={18} color="var(--akbank-red)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                    Tutar & Masraf Bilgileri (Dekont Tutar Tablosu)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Ana Tutar (MEVDUAT) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">GECEFT / FAST Komisyon (TL)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="commission"
                      value={formData.commission}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="15.96"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">BSMV Tutarı (TL)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="bsmv"
                      value={formData.bsmv}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="0.80"
                    />
                  </div>
                </div>

                {/* Dekont Toplam Tutar Özeti */}
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #fecdd3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: '#374151' }}>
                    <span style={{ fontWeight: 600 }}>Dekonta Basılacak TOPLAM:</span>{' '}
                    <span style={{ color: '#6b7280' }}>
                      ({formatTrCurrency(baseAmt)} + {formatTrCurrency(commAmt)} + {formatTrCurrency(bsmvAmt)} TL)
                    </span>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--akbank-red)' }}>
                    {formatTrCurrency(grandTotal)} TL
                  </div>
                </div>
              </div>

              {/* 2. ALICI VE BANKA BİLGİLERİ */}
              <div
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '1.1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Building2 size={18} color="var(--akbank-red)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                    Alıcı & Banka Bilgileri
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Alıcı Adı Soyadı / Unvan</label>
                    <input
                      type="text"
                      name="receiver_name"
                      value={formData.receiver_name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Örn: Havin Yıldız"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Banka Seçimi (Türkiye Bankaları)</label>
                    <select
                      value={formData.bank_code}
                      onChange={handleBankChange}
                      className="form-select"
                    >
                      {TURKISH_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} - {b.official_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alacaklı IBAN (Otomatik Banka Algılar)</label>
                    <input
                      type="text"
                      name="receiver_iban"
                      value={formData.receiver_iban}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Karşı Şube</label>
                    <input
                      type="text"
                      name="receiver_branch"
                      value={formData.receiver_branch}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="-"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alıcı VKN / TCKN</label>
                    <input
                      type="text"
                      name="receiver_vkn_tckn"
                      value={formData.receiver_vkn_tckn}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Boş bırakılabilir veya 11 haneli"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Alıcı Adresi</label>
                    <input
                      type="text"
                      name="receiver_address"
                      value={formData.receiver_address}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Boş bırakılabilir veya Şehir / Semt"
                    />
                  </div>
                </div>
              </div>

              {/* 3. TARİH, SAAT & VALÖR BİLGİLERİ */}
              <div
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '1.1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Calendar size={18} color="var(--akbank-red)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                    Tarih, Saat & Referans
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">İşlem Tarihi</label>
                    <input
                      type="date"
                      name="transaction_date"
                      value={formData.transaction_date}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">İşlem Saati</label>
                    <input
                      type="time"
                      step="1"
                      name="transaction_time"
                      value={formData.transaction_time}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valör Tarihi</label>
                    <input
                      type="date"
                      name="valor_date"
                      value={formData.valor_date}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Referans / Dekont No</label>
                    <input
                      type="text"
                      name="reference_no"
                      value={formData.reference_no}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="000654698"
                    />
                  </div>
                </div>
              </div>

              {/* 4. OPERATÖR & KANAL DETAYLARI */}
              <div
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '1.1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Shield size={18} color="var(--akbank-red)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>
                    Dekont Başlığı, Kanal & Operatör
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">İşlem Başlığı (Dekont Üstü)</label>
                    <select
                      name="transaction_type"
                      value={formData.transaction_type}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="EFT BANKALAR ARASI HESABA HAVALE">EFT BANKALAR ARASI HESABA HAVALE</option>
                      <option value="FAST BANKALAR ARASI ANLIK HAVALE">FAST BANKALAR ARASI ANLIK HAVALE</option>
                      <option value="HESAPLAR ARASI HAVALE">HESAPLAR ARASI HAVALE</option>
                      <option value="GELEN EFT">GELEN EFT</option>
                      <option value="GELEN FAST">GELEN FAST</option>
                      <option value="KREDİ KARTI ÖDEMESİ">KREDİ KARTI ÖDEMESİ</option>
                      <option value="ATM PARA YATIRMA">ATM PARA YATIRMA</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">İşlemi Yapan</label>
                    <input
                      type="text"
                      name="operator"
                      value={formData.operator}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="KENDISI"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Kanal Kodu</label>
                    <input
                      type="text"
                      name="channel_code"
                      value={formData.channel_code}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="40033406 / 554193 /"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">İşlem Detayındaki Açıklama / Not</label>
                    <input
                      type="text"
                      name="user_note"
                      value={formData.user_note}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Kullanıcının gönderirken yazdığı not (AÇIKLAMA alanı)"
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* CANLI ÖNİZLEME SEKMESİ */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f3f4f6',
                  padding: '10px 16px',
                  borderRadius: '10px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={maskPreview}
                    onChange={(e) => {
                      setMaskPreview(e.target.checked);
                      setPreviewKey(Date.now());
                    }}
                  />
                  <span>Adres ve Kimlik Bilgilerini Gizle (Maskele)</span>
                </label>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPreviewKey(Date.now())}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                    title="Önizlemeyi Yenile"
                  >
                    <RefreshCw size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Yenile
                  </button>
                  <a
                    href={getReceiptPdfUrl(transaction.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                  >
                    <ExternalLink size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Tam PDF Aç
                  </a>
                </div>
              </div>

              {/* Dekont Görsel Çerçevesi */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '680px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                }}
              >
                <img
                  src={`${getReceiptPreviewUrl(transaction.id, maskPreview)}&v=${previewKey}`}
                  alt="Akbank Dekont Önizleme"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none', padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  Önizleme yüklenirken hata oluştu veya işlem henüz kaydedilmedi. Lütfen önce formu kaydedin.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => downloadReceiptPdf(transaction.id, `Akbank_Dekont_${transaction.receipt_serial_no || transaction.id}.pdf`)}
              className="btn btn-receipt"
              style={{ padding: '0.5rem 0.9rem' }}
            >
              <Download size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Dekontu İndir (PDF)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ padding: '0.55rem 1.1rem' }}>
              Kapat
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Save size={15} />
              {submitting ? 'Kaydediliyor...' : 'Kaydet ve Dekontu Güncelle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

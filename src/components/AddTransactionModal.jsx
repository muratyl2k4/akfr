import React, { useState } from 'react';
import { X, Send, ArrowDownLeft, ArrowUpRight, Building2 } from 'lucide-react';
import { TURKISH_BANKS, findBankByIban, findBankByCode } from '../utils/banks';

export default function AddTransactionModal({ customer, isOpen, onClose, onCreated }) {
  if (!isOpen) return null;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  const defaultBank = TURKISH_BANKS[0]; // Garanti Bankası

  const [formData, setFormData] = useState({
    customer: customer.id,
    transaction_type: 'EFT BANKALAR ARASI HESABA HAVALE',
    amount: '',
    is_credit: false,
    receiver_name: '',
    receiver_iban: 'TR',
    bank_code: defaultBank.code,
    bank_name: defaultBank.official_name,
    receiver_branch: '-',
    reference_no: String(Math.floor(100000000 + Math.random() * 900000000)),
    commission: '15.96',
    bsmv: '0.80',
    sch_amount: '0.00',
    transaction_date: todayStr,
    transaction_time: timeStr,
    description: '',
    tag: 'Para Transferi',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentBank = findBankByCode(formData.bank_code) || defaultBank;

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
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Lütfen geçerli bir tutar girin.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Orijinal Akbank formatlama:
      // Giden için: [Alıcı Adı] - [Banka Kısa Adı]
      // Gelen için: FAST:GÖNDEREN ADI
      const bankShort = currentBank.short_name;
      let finalDescription = '';
      if (!formData.is_credit && formData.receiver_name) {
        const rec = formData.receiver_name.trim();
        finalDescription = `${rec} - ${bankShort}`;
      } else if (formData.is_credit && formData.receiver_name) {
        const rec = formData.receiver_name.trim();
        const prefix = formData.transaction_type.includes('EFT') ? 'EFT' : (formData.transaction_type.includes('HAVALE') ? 'HAVALE' : 'FAST');
        finalDescription = `${prefix}:${rec.toLocaleUpperCase('tr-TR')}`;
      }

      let ref = (formData.reference_no || '').trim();
      if (!ref) {
        ref = '000654698';
      } else if (ref.length < 9 && /^\d+$/.test(ref)) {
        ref = ref.padStart(9, '0');
      }

      const payload = {
        ...formData,
        customer: customer.id,
        reference_no: ref,
        bank_code: currentBank.code,
        bank_name: currentBank.official_name,
        description: finalDescription,
        user_note: (formData.description || '').trim(),
        amount: parseFloat(formData.amount),
        commission: parseFloat(formData.commission || 0),
        bsmv: parseFloat(formData.bsmv || 0),
        sch_amount: parseFloat(formData.sch_amount || 0),
      };

      await onCreated(payload);
      onClose();
    } catch (err) {
      console.error(err);
      setError('İşlem kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="var(--akbank-red)" />
            <h3 className="modal-title">Yeni İşlem & Dekont Ekle</h3>
          </div>
          <button onClick={onClose} style={{ color: '#9ca3af' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '0.6rem 0.8rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* İşlem Yönü (Gelen / Giden) */}
            <div className="form-group">
              <label className="form-label">İşlem Yönü</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, is_credit: false }))}
                  className="btn"
                  style={{
                    backgroundColor: !formData.is_credit ? '#fee2e2' : '#f3f4f6',
                    color: !formData.is_credit ? '#b91c1c' : '#4b5563',
                    border: `1px solid ${!formData.is_credit ? '#fca5a5' : '#e5e7eb'}`,
                    justifyContent: 'center',
                  }}
                >
                  <ArrowUpRight size={16} />
                  Giden Para (Borç / Transfer)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, is_credit: true, commission: '0.00', bsmv: '0.00' }))}
                  className="btn"
                  style={{
                    backgroundColor: formData.is_credit ? '#d1fae5' : '#f3f4f6',
                    color: formData.is_credit ? '#065f46' : '#4b5563',
                    border: `1px solid ${formData.is_credit ? '#6ee7b7' : '#e5e7eb'}`,
                    justifyContent: 'center',
                  }}
                >
                  <ArrowDownLeft size={16} />
                  Gelen Para (Alacak / Giriş)
                </button>
              </div>
            </div>

            {/* Tutar & İşlem Tipi */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tutar (TL) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="form-input"
                  style={{ fontWeight: 700, fontSize: '1rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">İşlem Başlığı</label>
                <select
                  name="transaction_type"
                  value={formData.transaction_type}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="EFT BANKALAR ARASI HESABA HAVALE">EFT BANKALAR ARASI HESABA HAVALE</option>
                  <option value="FAST BANKALAR ARASI ANLIK HAVALE">FAST BANKALAR ARASI ANLIK HAVALE</option>
                  <option value="HESAPTAN HAVALE">HESAPTAN HAVALE</option>
                  <option value="DÜZENLİ EFT">DÜZENLİ EFT</option>
                </select>
              </div>
            </div>

            {/* Alıcı Banka Seçimi (Türkiye'deki Tüm Bankalar) */}
            {!formData.is_credit && (
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={15} color="var(--akbank-red)" />
                  Alıcı Banka (Dekont & Hareket İsmi)
                </label>
                <select
                  name="bank_code"
                  value={formData.bank_code}
                  onChange={handleBankChange}
                  className="form-select"
                  style={{ fontWeight: 600 }}
                >
                  {TURKISH_BANKS.map((b) => (
                    <option key={b.code + b.official_name} value={b.code}>
                      {b.official_name}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  * IBAN girdiğinizde banka otomatik olarak tanınır. Hareket listesinde <strong>{currentBank.short_name}</strong>, detayda <strong>{currentBank.detail_name}</strong> yazılır.
                </span>
              </div>
            )}

            {/* Alıcı / Gönderen Adı & Referans No */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{formData.is_credit ? 'Gönderen Adı Soyadı' : 'Alıcı Adı Soyadı'}</label>
                <input
                  type="text"
                  name="receiver_name"
                  value={formData.receiver_name}
                  onChange={handleChange}
                  placeholder={formData.is_credit ? 'Örn: Ela Torunoğlu' : 'Örn: Murat Yıldırım'}
                  className="form-input"
                />
              </div>

              {!formData.is_credit ? (
                <div className="form-group">
                  <label className="form-label">Dekont No / Referans No</label>
                  <input
                    type="text"
                    name="reference_no"
                    value={formData.reference_no}
                    onChange={handleChange}
                    placeholder="000654698"
                    maxLength={15}
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontWeight: 700 }}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Gönderen IBAN (Opsiyonel)</label>
                  <input
                    type="text"
                    name="receiver_iban"
                    value={formData.receiver_iban}
                    onChange={handleChange}
                    placeholder="TR..."
                    className="form-input"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              )}
            </div>

            {!formData.is_credit && (
              <div className="form-group">
                <label className="form-label">Alıcı IBAN</label>
                <input
                  type="text"
                  name="receiver_iban"
                  value={formData.receiver_iban}
                  onChange={handleChange}
                  placeholder="TR87 0006 2000 4800 0006 6382 48"
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            )}

            {/* Gelen Para Çıktı Önizlemesi */}
            {formData.is_credit && (
              <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#166534', display: 'block', marginBottom: '4px' }}>
                  Hesap Hareketi & Ekstre Formatı (Orijinal Akbank)
                </span>
                <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#15803d' }}>
                  Satır: <strong>
                    {formData.transaction_type.includes('EFT') ? 'EFT' : (formData.transaction_type.includes('HAVALE') ? 'HAVALE' : 'FAST')}:
                    {(formData.receiver_name || 'ELA TORUNOĞLU').trim().toLocaleUpperCase('tr-TR')}
                  </strong>
                </div>
              </div>
            )}

            {/* Giden Para Çıktı Önizlemesi (Orijinal Akbank Birebir) */}
            {!formData.is_credit && (
              <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#166534', display: 'block', marginBottom: '4px' }}>
                  Hesap Hareketleri Görünümü (Orijinal Akbank Birebir)
                </span>
                <div style={{ fontFamily: 'monospace', fontSize: '0.84rem', color: '#15803d', fontWeight: 600 }}>
                  1. Transfer: <strong>{(formData.receiver_name || 'Murat Yıldırım').trim()} - {currentBank.short_name}</strong> (-{parseFloat(formData.amount || 0).toFixed(2)} TL) [Tekrarla Butonlu]
                </div>
                {parseFloat(formData.commission || 0) > 0 && (
                  <div style={{ fontFamily: 'monospace', fontSize: '0.84rem', color: '#b91c1c', marginTop: '3px' }}>
                    2. Komisyon: <strong>{(formData.receiver_name || 'Murat Yıldırım').trim()} - {currentBank.short_name}- Komisyon</strong> (-{parseFloat(formData.commission).toFixed(2)} TL)
                  </div>
                )}
                {parseFloat(formData.bsmv || 0) > 0 && (
                  <div style={{ fontFamily: 'monospace', fontSize: '0.84rem', color: '#b91c1c', marginTop: '3px' }}>
                    3. Vergi: <strong>{(formData.receiver_name || 'Murat Yıldırım').trim()} - {currentBank.short_name}- Vergi</strong> (-{parseFloat(formData.bsmv).toFixed(2)} TL)
                  </div>
                )}
                <div style={{ fontSize: '0.74rem', color: '#4b5563', marginTop: '6px', borderTop: '1px dashed #bbf7d0', paddingTop: '4px' }}>
                  İşlem Detayında Banka Adı: <strong>{currentBank.detail_name}</strong> | Dekont No: <strong>{formData.reference_no || '000654698'}</strong>
                </div>
              </div>
            )}

            {/* Masraf ve Kesinti Detayları (Orijinal Akbank Dekont Kalemleri) */}
            {!formData.is_credit && (
              <div style={{ backgroundColor: '#f9fafb', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--akbank-red)', display: 'block', marginBottom: '8px' }}>
                  Orijinal Akbank Kesintileri
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>EFT Komisyon (TL)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="commission"
                      value={formData.commission}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>EFT BSMV (TL)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="bsmv"
                      value={formData.bsmv}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '6px', display: 'block' }}>
                  * Komisyon ve BSMV için otomatik olarak bağlı <strong>- Komisyon</strong> ve <strong>- Vergi</strong> satırları üretilir ve bakiyeden sırayla düşülür.
                </span>
              </div>
            )}

            {/* Tarih ve Saat */}
            <div className="form-row">
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
            </div>

            {/* Açıklama (Opsiyonel) */}
            <div className="form-group">
              <label className="form-label">Ek Açıklama Notu (Opsiyonel - Boş Bırakılabilir)</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Boş bırakıldığında işlem detayında Açıklama satırı gösterilmez"
                className="form-input"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Vazgeç
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Kaydediliyor...' : 'İşlemi Kaydet & Dekont Üret'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

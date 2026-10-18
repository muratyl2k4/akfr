import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';

export default function CustomerModal({ isOpen, onClose, onSave, customer }) {
  if (!isOpen) return null;

  const isEdit = Boolean(customer && customer.id);

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    customer_no: '0071948201',
    tc_no: '39182746192',
    branch_name: '1277- TUZLA İÇMELER',
    account_no: '888-1277-0084920',
    iban: 'TR56 0004 6012 7788 8000 0849 20',
    address: 'AYDINLI MAH. BARIŞ CAD. NO:14 D:5 TUZLA İSTANBUL',
    initial_balance: '50000.00',
    overdraft_limit: '120000.00',
    overdraft_interest_rate: '4.25',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        username: customer.username || '',
        full_name: customer.full_name || '',
        customer_no: customer.customer_no || '',
        tc_no: customer.tc_no || '',
        branch_name: customer.branch_name || '',
        account_no: customer.account_no || '',
        iban: customer.iban || '',
        address: customer.address || '',
        initial_balance: customer.initial_balance || '0.00',
        overdraft_limit: customer.overdraft_limit != null ? customer.overdraft_limit : '120000.00',
        overdraft_interest_rate: customer.overdraft_interest_rate != null ? customer.overdraft_interest_rate : '4.25',
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setError('Lütfen müşteri adını girin.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSave(formData, customer ? customer.id : null);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Müşteri kaydedilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--akbank-red)" />
            <h3 className="modal-title">
              {isEdit ? 'Müşteri Bilgilerini Düzenle' : 'Yeni Akbank Müşterisi Ekle'}
            </h3>
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Adı Soyadı / Unvan *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Örn: SERKAN YILDIRIM"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kullanıcı Adı (Giriş İçin)</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Örn: serkan"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Müşteri No</label>
                <input
                  type="text"
                  name="customer_no"
                  value={formData.customer_no}
                  onChange={handleChange}
                  placeholder="0071948201"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">TC Kimlik / VKN (11 Hane)</label>
                <input
                  type="text"
                  name="tc_no"
                  value={formData.tc_no}
                  onChange={handleChange}
                  placeholder="39182746192"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Düzenleyen Şube</label>
                <input
                  type="text"
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleChange}
                  placeholder="7777 - AKBANK DİREKT MOBİL CEP"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Borçlu Hesap No</label>
                <input
                  type="text"
                  name="account_no"
                  value={formData.account_no}
                  onChange={handleChange}
                  placeholder="888-1277-0076358"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Akbank IBAN</label>
              <input
                type="text"
                name="iban"
                value={formData.iban}
                onChange={handleChange}
                placeholder="TR97 0004 6..."
                className="form-input"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Açık Adres (Dekont Adres Satırı)</label>
              <textarea
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                placeholder="GÖDENE CAD. BAĞLIK MAH. NO:103 D:23 ANTALYA"
                className="form-textarea"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Başlangıç Bakiyesi (TL)</label>
                <input
                  type="number"
                  step="0.01"
                  name="initial_balance"
                  value={formData.initial_balance}
                  onChange={handleChange}
                  className="form-input"
                  style={{ fontWeight: 700 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Artı Para Limiti (TL)</label>
                <input
                  type="number"
                  step="0.01"
                  name="overdraft_limit"
                  value={formData.overdraft_limit}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="115500.00"
                  style={{ fontWeight: 700, color: 'var(--akbank-red)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Artı Para Faiz Oranı (%)</label>
              <input
                type="number"
                step="0.01"
                name="overdraft_interest_rate"
                value={formData.overdraft_interest_rate}
                onChange={handleChange}
                className="form-input"
                placeholder="4.25"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Vazgeç
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

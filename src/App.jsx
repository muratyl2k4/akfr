import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CustomerCard from './components/CustomerCard';
import TransactionList from './components/TransactionList';
import AddTransactionModal from './components/AddTransactionModal';
import EditReceiptModal from './components/EditReceiptModal';
import CustomerModal from './components/CustomerModal';
import LoginView from './components/LoginView';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  recalculateCustomer,
} from './api/client';

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Modallar
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingReceiptTx, setEditingReceiptTx] = useState(null);

  // Oturum açmış kullanıcıyı kontrol et
  const loadInitialUser = async () => {
    try {
      setLoading(true);
      const savedUserId = sessionStorage.getItem('akbank_auth_user_id');
      if (savedUserId) {
        const cust = await getCustomer(parseInt(savedUserId, 10));
        if (cust) {
          setCurrentUser(cust);
          await loadTransactions(cust.id);
        } else {
          setCurrentUser(null);
          setTransactions([]);
        }
      } else {
        setCurrentUser(null);
        setTransactions([]);
      }
    } catch (err) {
      console.error('Kullanıcı doğrulanamadı:', err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  // İşlemleri yükle
  const loadTransactions = async (customerId) => {
    try {
      const data = await getTransactions(customerId);
      setTransactions(data);
    } catch (err) {
      console.error('İşlemler yüklenemedi:', err);
    }
  };

  useEffect(() => {
    loadInitialUser();
  }, []);

  // Giriş Yap
  const handleLogin = async (customer) => {
    sessionStorage.setItem('akbank_auth_user_id', customer.id.toString());
    setCurrentUser(customer);
    await loadTransactions(customer.id);
  };

  // Çıkış Yap
  const handleLogout = () => {
    sessionStorage.removeItem('akbank_auth_user_id');
    setCurrentUser(null);
    setTransactions([]);
  };

  // Bakiyeleri yeniden hesapla
  const handleRecalculate = async () => {
    if (!currentUser) return;
    try {
      setIsRecalculating(true);
      await recalculateCustomer(currentUser.id);
      const updated = await getCustomer(currentUser.id);
      setCurrentUser(updated);
      await loadTransactions(updated.id);
    } catch (err) {
      console.error('Bakiye hesaplama hatası:', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Yeni İşlem Ekle
  const handleCreateTransaction = async (payload) => {
    if (!currentUser) return;
    await createTransaction({ ...payload, customer: currentUser.id });
    const updated = await getCustomer(currentUser.id);
    setCurrentUser(updated);
    await loadTransactions(updated.id);
  };

  // Dekont / İşlem Güncelle
  const handleUpdateTransaction = async (id, payload) => {
    if (!currentUser) return;
    const updatedTx = await updateTransaction(id, payload);
    const updated = await getCustomer(currentUser.id);
    setCurrentUser(updated);
    await loadTransactions(updated.id);
    setEditingReceiptTx(updatedTx);
  };

  // İşlem Sil
  const handleDeleteTransaction = async (id) => {
    if (!currentUser) return;
    if (!window.confirm('Bu işlemi silmek istediğinize emin misiniz? (Otomatik olarak bağlı masraf ve bakiyeler güncellenecektir)')) {
      return;
    }
    try {
      await deleteTransaction(id);
      const updated = await getCustomer(currentUser.id);
      setCurrentUser(updated);
      await loadTransactions(updated.id);
    } catch (err) {
      console.error('İşlem silinemedi:', err);
    }
  };

  // Müşteri Kaydet / Güncelle
  const handleSaveCustomer = async (formData, id) => {
    let saved;
    if (id) {
      saved = await updateCustomer(id, formData);
    } else {
      saved = await createCustomer(formData);
    }
    await loadCustomers();
    if (saved && (!currentUser || currentUser.id === saved.id)) {
      handleLogin(saved);
    }
  };

  return (
    <div className="app-wrapper">
      <Header
        currentUser={currentUser}
        onLogout={handleLogout}
        onNewCustomer={() => {
          setEditingCustomer(null);
          setIsCustomerModalOpen(true);
        }}
      />

      <main className="main-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--akbank-text-muted)' }}>
            Yükleniyor...
          </div>
        ) : !currentUser ? (
          <LoginView
            onLogin={handleLogin}
          />
        ) : (
          <>
            <CustomerCard
              customer={currentUser}
              onEdit={() => {
                setEditingCustomer(currentUser);
                setIsCustomerModalOpen(true);
              }}
              onRecalculate={handleRecalculate}
              isRecalculating={isRecalculating}
            />

            <TransactionList
              transactions={transactions}
              onNewTransaction={() => setIsTxModalOpen(true)}
              onDeleteTransaction={handleDeleteTransaction}
              onEditReceipt={(tx) => setEditingReceiptTx(tx)}
            />
          </>
        )}
      </main>

      {/* Yeni İşlem Ekle Modalı (Sadece Giriş Yapılmışsa) */}
      {currentUser && (
        <AddTransactionModal
          customer={currentUser}
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          onCreated={handleCreateTransaction}
        />
      )}

      {/* Dekont Düzenle Modalı */}
      {editingReceiptTx && (
        <EditReceiptModal
          isOpen={Boolean(editingReceiptTx)}
          onClose={() => setEditingReceiptTx(null)}
          transaction={editingReceiptTx}
          onSave={handleUpdateTransaction}
        />
      )}

      {/* Müşteri Ekle / Düzenle Modalı */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
      />
    </div>
  );
}

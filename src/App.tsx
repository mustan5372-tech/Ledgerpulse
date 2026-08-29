import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction, Category, FilterOptions, User, DebtRecord, RecycleBinItem } from './types';
import { DEFAULT_CATEGORIES, SAMPLE_TRANSACTIONS } from './data/initialData';
import { generateMonthlyPDF } from './utils/pdfGenerator';
import { generateMonthlyExcel } from './utils/excelGenerator';
import { 
  subscribeToTransactions, 
  saveTransactionToCloud, 
  deleteTransactionFromCloud,
  subscribeToDebts,
  saveDebtToCloud,
  deleteDebtFromCloud,
  subscribeToAllUsers,
  subscribeToRecycleBin,
  saveToRecycleBinCloud,
  deleteFromRecycleBinCloud
} from './services/firebase';
import { getSavedUserSession, logoutAccount } from './services/auth';

import { Header } from './components/Header';
import { StatCards } from './components/StatCard';
import { Charts } from './components/Charts';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseModal } from './components/ExpenseModal';
import { BudgetModal } from './components/BudgetModal';
import { AuthModal } from './components/AuthModal';
import { DebtTracker } from './components/DebtTracker';
import { RecycleBinModal } from './components/RecycleBinModal';
import { AdminControlModal } from './components/AdminControlModal';

import { CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'ledger' | 'debts'>('ledger');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSavedUserSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(!currentUser);

  // Super Admin Control Center State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null);
  const [isAdminCenterOpen, setIsAdminCenterOpen] = useState<boolean>(false);

  // Recycle Bin State (15-day retention)
  const [recycleBinItems, setRecycleBinItems] = useState<RecycleBinItem[]>([]);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState<boolean>(false);

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const activeUser = getSavedUserSession();
      if (activeUser) {
        const saved = localStorage.getItem(`ledger_txs_${activeUser.uid}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return SAMPLE_TRANSACTIONS;
  });

  // Debts / IOUs State
  const [debts, setDebts] = useState<DebtRecord[]>([]);

  const [categories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('ledger_categories');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_CATEGORIES;
  });

  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ledger_monthly_budget_v2');
      if (saved) return parseFloat(saved) || 50000;
    } catch {
      // Fallback
    }
    return 50000;
  });

  const [currencySymbol, setCurrencySymbol] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ledger_currency_symbol_v2');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return saved;
        }
      }
    } catch {
      // Fallback
    }
    return '₹';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ledger_dark_mode');
      if (saved) return saved === 'true';
    } catch {
      // Fallback
    }
    return true;
  });

  // Calculate current month key in YYYY-MM format
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  // Modals & UI States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    category: 'ALL',
    type: 'all',
    paymentMethod: 'ALL',
    sortBy: 'date-desc',
  });

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  // 1. Real-time Subscriptions for Transactions, Debts, Recycle Bin & Super Admin Users List
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setDebts([]);
      setRecycleBinItems([]);
      setUsersList([]);
      setIsAuthModalOpen(true);
      return;
    }

    setIsAuthModalOpen(false);

    // Subscribe to Transactions
    const unsubTxs = subscribeToTransactions(
      currentUser.uid,
      currentUser.email,
      (cloudTxs) => {
        setIsCloudConnected(true);
        if (cloudTxs) setTransactions(cloudTxs);
      },
      (err) => {
        console.warn('Firestore transactions offline error:', err);
        setIsCloudConnected(false);
      }
    );

    // Subscribe to Debts / IOUs
    const unsubDebts = subscribeToDebts(
      currentUser.uid,
      currentUser.email,
      (cloudDebts) => {
        if (cloudDebts) setDebts(cloudDebts);
      },
      (err) => {
        console.warn('Firestore debts offline error:', err);
      }
    );

    // Subscribe to Recycle Bin
    const unsubRecycle = subscribeToRecycleBin(
      currentUser.uid,
      currentUser.email,
      (items) => {
        if (items) setRecycleBinItems(items);
      }
    );

    // Subscribe to User Accounts List (If Super Admin)
    let unsubUsers = () => {};
    if (currentUser.isSuperAdmin) {
      unsubUsers = subscribeToAllUsers((uList) => {
        setUsersList(uList);
      });
    }

    return () => {
      unsubTxs();
      unsubDebts();
      unsubRecycle();
      unsubUsers();
    };
  }, [currentUser]);

  // Sync LocalStorage as offline backup per user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`ledger_txs_${currentUser.uid}`, JSON.stringify(transactions));
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    localStorage.setItem('ledger_monthly_budget_v2', monthlyBudget.toString());
  }, [monthlyBudget]);

  useEffect(() => {
    localStorage.setItem('ledger_currency_symbol_v2', JSON.stringify(currencySymbol));
  }, [currencySymbol]);

  useEffect(() => {
    localStorage.setItem('ledger_dark_mode', darkMode.toString());
    if (darkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [darkMode]);

  // Filter transactions when Super Admin selects a specific user
  const userFilteredTransactions = useMemo(() => {
    if (!currentUser?.isSuperAdmin || !selectedUserFilter) {
      return transactions;
    }
    return transactions.filter((t) => t.userId === selectedUserFilter);
  }, [transactions, selectedUserFilter, currentUser]);

  // Filter debts when Super Admin selects a specific user
  const userFilteredDebts = useMemo(() => {
    if (!currentUser?.isSuperAdmin || !selectedUserFilter) {
      return debts;
    }
    return debts.filter((d) => d.userId === selectedUserFilter);
  }, [debts, selectedUserFilter, currentUser]);

  // Selected User Name helper for Super Admin Header display
  const selectedUserFilterName = useMemo(() => {
    if (!selectedUserFilter) return null;
    const u = usersList.find((usr) => usr.uid === selectedUserFilter);
    return u ? u.name : 'Filtered User';
  }, [selectedUserFilter, usersList]);

  // Compute list of available months in transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthKey); // Always include current month

    userFilteredTransactions.forEach((tx) => {
      if (tx.date) {
        monthsSet.add(tx.date.substring(0, 7)); // YYYY-MM
      }
    });

    const sorted = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));

    const monthOptions = sorted.map((mKey) => {
      const [year, month] = mKey.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
      const label = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      return { value: mKey, label };
    });

    return [{ value: 'ALL', label: 'All Time' }, ...monthOptions];
  }, [userFilteredTransactions, currentMonthKey]);

  // Active Month Display Label
  const activeMonthLabel = useMemo(() => {
    if (selectedMonth === 'ALL') return 'All Time';
    const [year, month] = selectedMonth.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    return dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  // Filter transactions by month first, then search, category, type, and sort
  const monthFilteredTransactions = useMemo(() => {
    if (selectedMonth === 'ALL') return userFilteredTransactions;
    return userFilteredTransactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [userFilteredTransactions, selectedMonth]);

  const finalFilteredTransactions = useMemo(() => {
    return monthFilteredTransactions
      .filter((tx) => {
        if (filters.type !== 'all' && tx.type !== filters.type) return false;
        if (filters.category !== 'ALL' && tx.category !== filters.category) return false;
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchTitle = tx.title.toLowerCase().includes(q);
          const matchNotes = tx.notes?.toLowerCase().includes(q);
          const matchCat = tx.category.toLowerCase().includes(q);
          if (!matchTitle && !matchNotes && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (filters.sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (filters.sortBy === 'amount-desc') {
          return b.amount - a.amount;
        }
        if (filters.sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [monthFilteredTransactions, filters]);

  // Calculate Metrics for selected month
  const totalIncome = useMemo(() => {
    return monthFilteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [monthFilteredTransactions]);

  const totalExpense = useMemo(() => {
    return monthFilteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [monthFilteredTransactions]);

  const topCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    monthFilteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    const entries = Object.entries(catMap);
    if (entries.length === 0) return null;
    entries.sort(([, a], [, b]) => b - a);
    return { name: entries[0][0], amount: entries[0][1] };
  }, [monthFilteredTransactions]);

  // Target User ID helper (Super Admin operating on selected user or self)
  const getTargetUserId = () => {
    if (currentUser?.isSuperAdmin && selectedUserFilter) {
      return selectedUserFilter;
    }
    return currentUser?.uid || '';
  };

  // Handlers for Transactions
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'> | Transaction) => {
    if (!currentUser) return;
    const targetUid = getTargetUserId();

    if ('id' in txData && txData.id) {
      const updated = { ...txData, userId: targetUid } as Transaction;
      setTransactions((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      saveTransactionToCloud(updated, targetUid);
      showToast('Transaction updated & synced across devices');
    } else {
      const newTx: Transaction = {
        ...(txData as Omit<Transaction, 'id'>),
        id: `tx-${Date.now()}`,
        userId: targetUid,
      };
      setTransactions((prev) => [newTx, ...prev]);
      saveTransactionToCloud(newTx, targetUid);
      showToast('New entry logged & synced across devices');
    }
  };

  // Move Transaction to Recycle Bin (15-day recovery)
  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (txToDelete) {
      const recycleItem: RecycleBinItem = {
        id: `recycle_${txToDelete.id}`,
        userId: txToDelete.userId || currentUser?.uid || '',
        itemType: 'transaction',
        title: txToDelete.title,
        amount: txToDelete.amount,
        details: `${txToDelete.type.toUpperCase()} • ${txToDelete.category}`,
        date: txToDelete.date,
        deletedAt: new Date().toISOString(),
        data: txToDelete,
      };

      // Save to Recycle Bin Firestore & local state
      saveToRecycleBinCloud(recycleItem);
      setRecycleBinItems((prev) => [recycleItem, ...prev]);

      // Remove from active transactions
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      deleteTransactionFromCloud(id);
      showToast('Moved to Recycle Bin (Recoverable for 15 days)');
    }
  };

  // Handlers for Debts / IOUs
  const handleSaveDebt = (debtData: Omit<DebtRecord, 'id'> | DebtRecord) => {
    if (!currentUser) return;
    const targetUid = getTargetUserId();

    if ('id' in debtData && debtData.id) {
      const updated = { ...debtData, userId: targetUid } as DebtRecord;
      setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      saveDebtToCloud(updated, targetUid);
      showToast('Debt record updated & synced to cloud');
    } else {
      const newDebt: DebtRecord = {
        ...(debtData as Omit<DebtRecord, 'id'>),
        id: `debt-${Date.now()}`,
        userId: targetUid,
      };
      setDebts((prev) => [newDebt, ...prev]);
      saveDebtToCloud(newDebt, targetUid);
      showToast('New debt/loan record added');
    }
  };

  // Move Debt Record to Recycle Bin (15-day recovery)
  const handleDeleteDebt = (id: string) => {
    const debtToDelete = debts.find((d) => d.id === id);
    if (debtToDelete) {
      const recycleItem: RecycleBinItem = {
        id: `recycle_${debtToDelete.id}`,
        userId: debtToDelete.userId || currentUser?.uid || '',
        itemType: 'debt',
        title: `${debtToDelete.personName} (${debtToDelete.type === 'lent' ? 'Lent' : 'Borrowed'})`,
        amount: debtToDelete.amount,
        details: `Status: ${debtToDelete.status.toUpperCase()} ${debtToDelete.phoneNumber ? '• ' + debtToDelete.phoneNumber : ''}`,
        date: debtToDelete.date,
        deletedAt: new Date().toISOString(),
        data: debtToDelete,
      };

      // Save to Recycle Bin Firestore & local state
      saveToRecycleBinCloud(recycleItem);
      setRecycleBinItems((prev) => [recycleItem, ...prev]);

      // Remove from active debts
      setDebts((prev) => prev.filter((d) => d.id !== id));
      deleteDebtFromCloud(id);
      showToast('Debt record moved to Recycle Bin (Recoverable for 15 days)');
    }
  };

  // Recycle Bin Recovery Handlers
  const handleRestoreRecycleBinItem = (item: RecycleBinItem) => {
    if (item.itemType === 'transaction') {
      const tx = item.data as Transaction;
      setTransactions((prev) => [tx, ...prev]);
      saveTransactionToCloud(tx, tx.userId || currentUser?.uid || '');
      showToast(`Restored transaction "${tx.title}" to active ledger!`);
    } else if (item.itemType === 'debt') {
      const debt = item.data as DebtRecord;
      setDebts((prev) => [debt, ...prev]);
      saveDebtToCloud(debt, debt.userId || currentUser?.uid || '');
      showToast(`Restored debt record for "${debt.personName}"!`);
    }

    // Delete from Recycle Bin Cloud & state
    deleteFromRecycleBinCloud(item.id);
    setRecycleBinItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handlePermanentDeleteRecycleBinItem = (id: string) => {
    deleteFromRecycleBinCloud(id);
    setRecycleBinItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Item permanently deleted');
  };

  const handleClearAllRecycleBin = () => {
    recycleBinItems.forEach((item) => deleteFromRecycleBinCloud(item.id));
    setRecycleBinItems([]);
    showToast('Recycle Bin cleared completely');
  };

  const handleLogout = async () => {
    await logoutAccount();
    setCurrentUser(null);
    setSelectedUserFilter(null);
    setTransactions([]);
    setDebts([]);
    setRecycleBinItems([]);
    setIsAuthModalOpen(true);
    showToast('Logged out of account');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    showToast(`Welcome, ${user.name || user.email}!`);
  };

  // PDF Export Trigger
  const handleDownloadPDF = () => {
    if (monthFilteredTransactions.length === 0) {
      alert(`No transactions logged for ${activeMonthLabel} to export.`);
      return;
    }

    generateMonthlyPDF({
      transactions: monthFilteredTransactions,
      selectedMonth,
      monthLabel: activeMonthLabel,
      currencySymbol,
    });

    showToast(`PDF Report downloaded for ${activeMonthLabel}!`);
  };

  // Excel Export Trigger
  const handleDownloadExcel = () => {
    if (monthFilteredTransactions.length === 0) {
      alert(`No transactions logged for ${activeMonthLabel} to export.`);
      return;
    }

    generateMonthlyExcel({
      transactions: monthFilteredTransactions,
      monthLabel: activeMonthLabel,
      currencySymbol,
    });

    showToast(`Excel Spreadsheet exported for ${activeMonthLabel}!`);
  };

  // JSON Export / Import
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userFilteredTransactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ledger_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON backup exported successfully');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const targetUid = getTargetUserId();
    const fileReader = new FileReader();

    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            const tagged = parsed.map((t) => ({ ...t, userId: targetUid }));
            setTransactions(tagged);
            tagged.forEach((t) => saveTransactionToCloud(t, targetUid));
            showToast('JSON data imported & synced to cloud');
          } else {
            alert('Invalid backup file format');
          }
        } catch {
          alert('Failed to parse JSON file');
        }
      };
    }
  };

  const handleClearAllData = () => {
    userFilteredTransactions.forEach((t) => deleteTransactionFromCloud(t.id));
    setTransactions([]);
    showToast('All transaction data cleared');
  };

  return (
    <div className="app-main-layout">
      {/* App Header */}
      <Header
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        availableMonths={availableMonths}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsExpenseModalOpen(true);
        }}
        onDownloadPDF={handleDownloadPDF}
        onDownloadExcel={handleDownloadExcel}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        activeMonthLabel={activeMonthLabel}
        isCloudConnected={isCloudConnected}
        user={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenRecycleBin={() => setIsRecycleBinOpen(true)}
        recycleBinCount={recycleBinItems.length}
        onOpenAdminCenter={() => setIsAdminCenterOpen(true)}
        selectedUserFilterName={selectedUserFilterName}
      />

      <main className="app-container">
        {activeTab === 'ledger' ? (
          <>
            {/* Metric Cards Summary */}
            <StatCards
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              monthlyBudget={monthlyBudget}
              topCategory={topCategory}
              transactionCount={monthFilteredTransactions.length}
              currencySymbol={currencySymbol}
            />

            {/* Donut & Bar Analytics */}
            <Charts
              transactions={monthFilteredTransactions}
              categories={categories}
              currencySymbol={currencySymbol}
            />

            {/* Transactions Table & Filters */}
            <ExpenseList
              transactions={finalFilteredTransactions}
              categories={categories}
              filterOptions={filters}
              onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsExpenseModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              currencySymbol={currencySymbol}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsExpenseModalOpen(true);
              }}
            />
          </>
        ) : (
          /* Debt & Loan Tracker View */
          <DebtTracker
            debts={userFilteredDebts}
            onSaveDebt={handleSaveDebt}
            onDeleteDebt={handleDeleteDebt}
            currencySymbol={currencySymbol}
          />
        )}
      </main>

      {/* Add / Edit Transaction Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
        categories={categories}
        currencySymbol={currencySymbol}
      />

      {/* Budget & Data Backup Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        monthlyBudget={monthlyBudget}
        onSaveBudget={setMonthlyBudget}
        currencySymbol={currencySymbol}
        onSaveCurrency={setCurrencySymbol}
        onExportData={handleExportJSON}
        onImportData={handleImportJSON}
        onResetData={handleClearAllData}
      />

      {/* Recycle Bin Modal (15-day recovery) */}
      <RecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        items={recycleBinItems}
        onRestore={handleRestoreRecycleBinItem}
        onPermanentDelete={handlePermanentDeleteRecycleBinItem}
        onClearAll={handleClearAllRecycleBin}
        currencySymbol={currencySymbol}
      />

      {/* Super Admin Control Center Modal */}
      <AdminControlModal
        isOpen={isAdminCenterOpen}
        onClose={() => setIsAdminCenterOpen(false)}
        users={usersList}
        allTransactions={transactions}
        allDebts={debts}
        selectedUserFilter={selectedUserFilter}
        onSelectUserFilter={(uid) => {
          setSelectedUserFilter(uid);
          setIsAdminCenterOpen(false);
          if (uid) {
            const uName = usersList.find((u) => u.uid === uid)?.name || 'User';
            showToast(`Inspecting records for ${uName}`);
          } else {
            showToast('Switched to Global View');
          }
        }}
        currentUser={currentUser}
        currencySymbol={currencySymbol}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 className="toast-icon" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


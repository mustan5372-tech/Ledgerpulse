import React, { useState } from 'react';
import type { User, Transaction, DebtRecord } from '../types';
import { 
  ShieldCheck, 
  Users, 
  X, 
  Search, 
  CheckCircle,
  TrendingUp,
  CreditCard,
  Crown
} from 'lucide-react';

interface AdminControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  allTransactions: Transaction[];
  allDebts: DebtRecord[];
  selectedUserFilter: string | null; // null means 'ALL USERS', or user.uid
  onSelectUserFilter: (uid: string | null) => void;
  currentUser: User | null;
  currencySymbol?: string;
}

export const AdminControlModal: React.FC<AdminControlModalProps> = ({
  isOpen,
  onClose,
  users,
  allTransactions,
  allDebts,
  selectedUserFilter,
  onSelectUserFilter,
  currentUser,
  currencySymbol = '₹',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen || !currentUser?.isSuperAdmin) return null;

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-card" style={{ maxWidth: '750px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="brand-section">
            <div className="brand-icon-wrapper" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
              <Crown className="modal-title-icon text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="modal-title">Super Admin Control Center</h2>
                <span className="pill-badge pill-purple flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
                  <ShieldCheck style={{ width: 12, height: 12 }} /> Super Admin
                </span>
              </div>
              <p className="brand-subtitle">Manage users & inspect global user financial records</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X className="btn-icon" />
          </button>
        </div>

        {/* Global Mode Switcher Notice */}
        <div className="auth-alert alert-success mb-3">
          <ShieldCheck className="alert-icon" />
          <div>
            <strong>Super Admin Privilege Active:</strong> As <code>mustan5372@gmail.com</code>, you have full access to view, edit, modify, and manage all users' records across the Ledger platform.
          </div>
        </div>

        {/* View Mode Pills */}
        <div className="form-group mb-3">
          <label className="form-label">
            <Users className="form-icon" /> Select User View Mode
          </label>
          <div className="auth-tabs-wrapper">
            <button
              className={`auth-tab-btn ${selectedUserFilter === null ? 'active' : ''}`}
              onClick={() => {
                onSelectUserFilter(null);
              }}
            >
              🌐 Global View (All Users Data)
            </button>
            <button
              className={`auth-tab-btn ${selectedUserFilter !== null ? 'active' : ''}`}
              onClick={() => {
                if (users.length > 0) {
                  onSelectUserFilter(users[0].uid);
                }
              }}
            >
              👤 Filter by Specific User
            </button>
          </div>
        </div>

        {/* Search Users Input */}
        <div className="search-input-wrapper mb-3">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* User Accounts List */}
        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table className="transactions-table">
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Transactions</th>
                <th>Debts</th>
                <th>Total Volume</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelected = selectedUserFilter === u.uid;
                const userTxs = allTransactions.filter((t) => t.userId === u.uid);
                const userDebts = allDebts.filter((d) => d.userId === u.uid);
                const totalVol = userTxs.reduce((sum, t) => sum + t.amount, 0);

                return (
                  <tr key={u.uid} className={`tx-row ${isSelected ? 'active-legend' : ''}`}>
                    <td>
                      <div className="tx-title-cell">
                        <div className="user-avatar-circle" style={{ width: 34, height: 34, fontSize: '0.85rem' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="tx-title-text flex items-center gap-1">
                            {u.name}
                            {u.isSuperAdmin && (
                              <span className="pill-badge pill-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                Super Admin
                              </span>
                            )}
                          </div>
                          <div className="tx-notes-text">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cat-pill pill-purple">
                        <TrendingUp style={{ width: 12, height: 12 }} /> {userTxs.length} entries
                      </span>
                    </td>
                    <td>
                      <span className="cat-pill lent-pill">
                        <CreditCard style={{ width: 12, height: 12 }} /> {userDebts.length} records
                      </span>
                    </td>
                    <td>
                      <span className="tx-amount">{currencySymbol}{totalVol.toFixed(2)}</span>
                    </td>
                    <td>
                      <button
                        className={`btn-settle-toggle ${isSelected ? 'settled-active' : 'pending-active'}`}
                        onClick={() => onSelectUserFilter(isSelected ? null : u.uid)}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle style={{ width: 14, height: 14 }} /> Active View
                          </>
                        ) : (
                          'Inspect & Edit Data'
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer mt-3">
          <button className="btn btn-secondary" onClick={onClose}>
            Close Control Center
          </button>
        </div>
      </div>
    </div>
  );
};

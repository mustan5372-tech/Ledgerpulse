import React, { useState } from 'react';
import type { User, Transaction, DebtRecord } from '../types';
import { updateUserProfileInCloud } from '../services/firebase';
import { 
  ShieldCheck, 
  X, 
  Search, 
  CheckCircle,
  TrendingUp,
  CreditCard,
  Crown,
  Edit3,
  Check
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
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !currentUser?.isSuperAdmin) return null;

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const handleStartEdit = (user: User) => {
    setEditingUid(user.uid);
    setEditName(user.name.startsWith('User (user_') ? '' : user.name);
    setEditEmail(user.email.endsWith('@user.ledger') ? '' : user.email);
  };

  const handleSaveProfile = async (uid: string) => {
    const finalName = editName.trim() || `User (${uid.substring(0, 8)})`;
    const finalEmail = editEmail.trim() || `${uid}@user.ledger`;

    const success = await updateUserProfileInCloud(uid, finalName, finalEmail);
    if (success) {
      setSaveSuccessMsg(`Updated profile for "${finalName}"`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      setEditingUid(null);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-card" style={{ maxWidth: '820px' }}>
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
              <p className="brand-subtitle">Manage users, update names/emails & inspect global financial records</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X className="btn-icon" />
          </button>
        </div>

        {/* Super Admin Notice */}
        <div className="auth-alert alert-success mb-3">
          <ShieldCheck className="alert-icon" />
          <div>
            <strong>Super Admin Control Active:</strong> Select any specific user below to inspect, add, or modify their financial records and update their profile details.
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="auth-alert alert-success mb-3" style={{ padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}>
            <CheckCircle className="alert-icon" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}


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
        <div className="table-responsive" style={{ maxHeight: '340px', overflowY: 'auto' }}>
          <table className="transactions-table">
            <thead>
              <tr>
                <th>User Profile & Name</th>
                <th>Transactions</th>
                <th>Debts</th>
                <th>Total Volume</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelected = selectedUserFilter === u.uid;
                const isEditing = editingUid === u.uid;
                const userTxs = allTransactions.filter((t) => t.userId === u.uid);
                const userDebts = allDebts.filter((d) => d.userId === u.uid);
                const totalVol = userTxs.reduce((sum, t) => sum + t.amount, 0);

                return (
                  <tr key={u.uid} className={`tx-row ${isSelected ? 'active-legend' : ''}`}>
                    <td>
                      <div className="tx-title-cell">
                        <div className="user-avatar-circle" style={{ width: 36, height: 36, fontSize: '0.85rem', flexShrink: 0 }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div style={{ width: '100%' }}>
                          {isEditing ? (
                            <div className="flex flex-col gap-1" style={{ width: '100%', maxWidth: '240px' }}>
                              <input
                                type="text"
                                className="form-input"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                placeholder="Enter Real Name..."
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                              />
                              <input
                                type="email"
                                className="form-input"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                placeholder="Enter Email..."
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                              />
                              <div className="flex gap-1 mt-1">
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => handleSaveProfile(u.uid)}
                                >
                                  <Check style={{ width: 12, height: 12 }} /> Save Name
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => setEditingUid(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="tx-title-text flex items-center gap-1">
                                <span>{u.name}</span>
                                {u.isSuperAdmin && (
                                  <span className="pill-badge pill-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                                    Super Admin
                                  </span>
                                )}
                                <button
                                  className="btn btn-secondary icon-only"
                                  style={{ padding: '0.15rem 0.35rem', marginLeft: '0.25rem', height: 'auto' }}
                                  onClick={() => handleStartEdit(u)}
                                  title="Edit User Name & Email"
                                >
                                  <Edit3 style={{ width: 12, height: 12, color: '#a78bfa' }} />
                                </button>
                              </div>
                              <div className="tx-notes-text">{u.email}</div>
                            </div>
                          )}
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
                        onClick={() => onSelectUserFilter(u.uid)}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle style={{ width: 14, height: 14 }} /> Selected
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


import React, { useState } from 'react';
import type { RecycleBinItem } from '../types';
import { RETENTION_PERIOD_MS } from '../services/firebase';
import { 
  Trash2, 
  RotateCcw, 
  X, 
  Clock, 
  AlertTriangle,
  Receipt,
  Users
} from 'lucide-react';

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: RecycleBinItem[];
  onRestore: (item: RecycleBinItem) => void;
  onPermanentDelete: (id: string) => void;
  onClearAll: () => void;
  currencySymbol?: string;
}

export const RecycleBinModal: React.FC<RecycleBinModalProps> = ({
  isOpen,
  onClose,
  items,
  onRestore,
  onPermanentDelete,
  onClearAll,
  currencySymbol = '₹',
}) => {
  const [filterType, setFilterType] = useState<'all' | 'transaction' | 'debt'>('all');

  if (!isOpen) return null;

  // Filter items
  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    return item.itemType === filterType;
  });

  // Calculate days remaining helper
  const getDaysRemaining = (deletedAt: string) => {
    const deletedMs = new Date(deletedAt).getTime();
    const elapsedMs = Date.now() - deletedMs;
    const remainingMs = RETENTION_PERIOD_MS - elapsedMs;
    const days = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="brand-section">
            <div className="brand-icon-wrapper bg-rose">
              <Trash2 className="modal-title-icon text-white" />
            </div>
            <div>
              <h2 className="modal-title">Recycle Bin</h2>
              <p className="brand-subtitle">Recover deleted items within 15 days</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X className="btn-icon" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="auth-alert alert-success mt-2 mb-3">
          <Clock className="alert-icon" />
          <span>
            Items in the Recycle Bin are automatically permanently erased after <strong>15 days</strong>.
          </span>
        </div>

        {/* Type Selector Tabs */}
        <div className="auth-tabs-wrapper mb-3">
          <button
            className={`auth-tab-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Items ({items.length})
          </button>
          <button
            className={`auth-tab-btn ${filterType === 'transaction' ? 'active' : ''}`}
            onClick={() => setFilterType('transaction')}
          >
            <Receipt className="auth-tab-icon" /> Transactions ({items.filter((i) => i.itemType === 'transaction').length})
          </button>
          <button
            className={`auth-tab-btn ${filterType === 'debt' ? 'active' : ''}`}
            onClick={() => setFilterType('debt')}
          >
            <Users className="auth-tab-icon" /> Debts ({items.filter((i) => i.itemType === 'debt').length})
          </button>
        </div>

        {/* List of Deleted Items */}
        {filteredItems.length === 0 ? (
          <div className="empty-list-state py-4">
            <div className="empty-icon-circle">
              <Trash2 className="empty-icon" />
            </div>
            <h4 style={{ fontWeight: 800 }}>Recycle Bin is Empty</h4>
            <p className="input-help mt-1">No deleted entries pending recovery.</p>
          </div>
        ) : (
          <div className="recycle-bin-list" style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {filteredItems.map((item) => {
              const daysLeft = getDaysRemaining(item.deletedAt);

              return (
                <div key={item.id} className="recycle-item-card">
                  <div className="recycle-item-header">
                    <div className="recycle-item-info">
                      <span className={`cat-pill ${item.itemType === 'transaction' ? 'pill-purple' : 'lent-pill'}`}>
                        {item.itemType === 'transaction' ? 'Transaction' : 'Debt / IOU'}
                      </span>
                      <h4 className="recycle-item-title">{item.title}</h4>
                      {item.details && <p className="recycle-item-sub">{item.details}</p>}
                    </div>

                    <div className="text-right">
                      <span className="recycle-item-amount">
                        {currencySymbol}{item.amount.toFixed(2)}
                      </span>
                      <div className="recycle-days-tag">
                        <Clock className="meta-icon" />
                        <span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left to recover</span>
                      </div>
                    </div>
                  </div>

                  <div className="recycle-item-actions">
                    <button
                      className="btn-settle-toggle settled-active"
                      onClick={() => onRestore(item)}
                    >
                      <RotateCcw className="meta-icon" />
                      Restore
                    </button>
                    <button
                      className="mobile-action-btn mobile-delete-btn"
                      onClick={() => onPermanentDelete(item.id)}
                    >
                      <Trash2 className="mobile-action-icon" />
                      Delete Permanently
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer */}
        <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
          {items.length > 0 && (
            <button
              className="btn btn-danger-outline"
              onClick={() => {
                if (window.confirm('Are you sure you want to permanently delete ALL items in the Recycle Bin? This action cannot be undone.')) {
                  onClearAll();
                }
              }}
            >
              <AlertTriangle className="btn-icon" />
              Empty Recycle Bin
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

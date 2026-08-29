import React, { useState } from 'react';
import type { Transaction, Category, FilterOptions } from '../types';
import { Search, Trash2, Edit3, Tag, CreditCard, ArrowUpRight, ArrowDownRight, Calendar, Image as ImageIcon, X } from 'lucide-react';

interface ExpenseListProps {
  transactions: Transaction[];
  categories: Category[];
  filterOptions: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  currencySymbol?: string;
  onOpenAddModal: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  transactions,
  categories,
  filterOptions,
  onFilterChange,
  onEditTransaction,
  onDeleteTransaction,
  currencySymbol = '₹',
  onOpenAddModal,
}) => {
  const [activeReceipt, setActiveReceipt] = useState<{ title: string; url: string } | null>(null);

  // Category helper
  const getCategoryMeta = (catName: string) => {
    const found = categories.find((c) => c.name === catName || c.id === catName);
    return {
      icon: found?.icon || '📦',
      color: found?.color || '#64748b',
    };
  };

  return (
    <div className="expense-list-section">
      {/* Controls Header & Search Filter Bar */}
      <div className="list-controls-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search description, notes, category..."
            value={filterOptions.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="search-input"
          />
        </div>

        <div className="filters-group">
          {/* Type Filter Buttons */}
          <div className="type-toggle-group">
            <button
              onClick={() => onFilterChange({ type: 'all' })}
              className={`type-btn ${filterOptions.type === 'all' ? 'active' : ''}`}
            >
              All
            </button>
            <button
              onClick={() => onFilterChange({ type: 'expense' })}
              className={`type-btn ${filterOptions.type === 'expense' ? 'active-expense' : ''}`}
            >
              Expenses
            </button>
            <button
              onClick={() => onFilterChange({ type: 'income' })}
              className={`type-btn ${filterOptions.type === 'income' ? 'active-income' : ''}`}
            >
              Income
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={filterOptions.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="filter-select"
            aria-label="Filter by Category"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          {/* Sort By Dropdown */}
          <select
            value={filterOptions.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as FilterOptions['sortBy'] })}
            className="filter-select"
            aria-label="Sort Transactions"
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="amount-desc">Amount (Highest First)</option>
            <option value="amount-asc">Amount (Lowest First)</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <div className="empty-list-state">
          <div className="empty-icon-circle">
            <Tag className="empty-icon text-indigo" />
          </div>
          <h3>No transactions match your search</h3>
          <p>Try clearing filters or add a new expense transaction to get started.</p>
          <button onClick={onOpenAddModal} className="btn btn-primary mt-4">
            + Add First Transaction
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="desktop-table-wrapper table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Type & Title</th>
                  <th>Category</th>
                  <th>Payment Mode</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const catMeta = getCategoryMeta(tx.category);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr key={tx.id} className="tx-row">
                      {/* Title & Type Icon */}
                      <td>
                        <div className="tx-title-cell">
                          <div
                            className={`tx-type-badge ${isIncome ? 'income-bg' : 'expense-bg'}`}
                            title={isIncome ? 'Income' : 'Expense'}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="tx-badge-icon text-emerald" />
                            ) : (
                              <ArrowDownRight className="tx-badge-icon text-rose" />
                            )}
                          </div>
                          <div>
                            <div className="tx-title-text flex items-center gap-2">
                              <span>{tx.title}</span>
                              {tx.receiptUrl && (
                                <button
                                  onClick={() => setActiveReceipt({ title: tx.title, url: tx.receiptUrl! })}
                                  className="receipt-badge-btn"
                                  title="View Receipt Image"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span>Receipt</span>
                                </button>
                              )}
                            </div>
                            {tx.notes && <div className="tx-notes-text">{tx.notes}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span
                          className="cat-pill"
                          style={{
                            backgroundColor: `${catMeta.color}18`,
                            color: catMeta.color,
                            borderColor: `${catMeta.color}40`,
                          }}
                        >
                          <span className="cat-pill-icon">{catMeta.icon}</span>
                          <span>{tx.category}</span>
                        </span>
                      </td>

                      {/* Payment Mode */}
                      <td>
                        <span className="payment-pill">
                          <CreditCard className="payment-icon" />
                          <span>{tx.paymentMethod}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="tx-date-cell">
                        {new Date(tx.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Amount */}
                      <td className="text-right">
                        <span className={`tx-amount ${isIncome ? 'text-emerald font-bold' : 'text-rose font-bold'}`}>
                          {isIncome ? '+' : '-'}{currencySymbol}
                          {tx.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="actions-cell">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="action-btn edit-btn"
                            title="Edit Transaction"
                          >
                            <Edit3 className="action-icon" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="action-btn delete-btn"
                            title="Delete Transaction"
                          >
                            <Trash2 className="action-icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="mobile-cards-wrapper">
            {transactions.map((tx) => {
              const catMeta = getCategoryMeta(tx.category);
              const isIncome = tx.type === 'income';

              return (
                <div key={tx.id} className="mobile-tx-card">
                  {/* Card Header: Category Pill & Amount */}
                  <div className="mobile-tx-header">
                    <span
                      className="cat-pill"
                      style={{
                        backgroundColor: `${catMeta.color}18`,
                        color: catMeta.color,
                        borderColor: `${catMeta.color}40`,
                      }}
                    >
                      <span className="cat-pill-icon">{catMeta.icon}</span>
                      <span>{tx.category}</span>
                    </span>

                    <span className={`mobile-tx-amount ${isIncome ? 'text-emerald' : 'text-rose'}`}>
                      {isIncome ? '+' : '-'}{currencySymbol}
                      {tx.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Card Body: Icon + Title & Notes */}
                  <div className="mobile-tx-body">
                    <div className={`tx-type-badge ${isIncome ? 'income-bg' : 'expense-bg'}`}>
                      {isIncome ? (
                        <ArrowUpRight className="tx-badge-icon text-emerald" />
                      ) : (
                        <ArrowDownRight className="tx-badge-icon text-rose" />
                      )}
                    </div>
                    <div className="mobile-tx-details">
                      <h4 className="mobile-tx-title">{tx.title}</h4>
                      {tx.notes && <p className="mobile-tx-notes">{tx.notes}</p>}
                      {tx.receiptUrl && (
                        <button
                          onClick={() => setActiveReceipt({ title: tx.title, url: tx.receiptUrl! })}
                          className="receipt-badge-btn mt-2"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Receipt Attachment</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Date, Payment Mode & Quick Action Buttons */}
                  <div className="mobile-tx-footer">
                    <div className="mobile-tx-meta">
                      <span className="mobile-meta-item">
                        <CreditCard className="meta-icon" />
                        <span>{tx.paymentMethod}</span>
                      </span>
                      <span className="mobile-meta-dot">•</span>
                      <span className="mobile-meta-item">
                        <Calendar className="meta-icon" />
                        <span>
                          {new Date(tx.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </span>
                    </div>

                    <div className="mobile-actions-group">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="mobile-action-btn mobile-edit-btn"
                        aria-label="Edit"
                      >
                        <Edit3 className="mobile-action-icon" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="mobile-action-btn mobile-delete-btn"
                        aria-label="Delete"
                      >
                        <Trash2 className="mobile-action-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Full-size Liquid Glass Receipt Viewer Modal */}
      {activeReceipt && (
        <div className="modal-backdrop" onClick={() => setActiveReceipt(null)}>
          <div className="modal-content modal-md text-center" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Receipt: {activeReceipt.title}</h3>
              <button onClick={() => setActiveReceipt(null)} className="modal-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              <img
                src={activeReceipt.url}
                alt={activeReceipt.title}
                className="w-full rounded-2xl max-h-[70vh] object-contain border border-slate-700/50 shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

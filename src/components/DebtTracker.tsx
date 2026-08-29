import React, { useState } from 'react';
import type { DebtRecord, DebtType, DebtStatus } from '../types';
import { Users, DollarSign, Calendar, CheckCircle2, Clock, Plus, Trash2, Edit3, X, ArrowUpRight, ArrowDownRight, AlignLeft, Phone, MessageSquare, Send } from 'lucide-react';

interface DebtTrackerProps {
  debts: DebtRecord[];
  onSaveDebt: (debt: Omit<DebtRecord, 'id'> | DebtRecord) => void;
  onDeleteDebt: (id: string) => void;
  currencySymbol?: string;
}

export const DebtTracker: React.FC<DebtTrackerProps> = ({
  debts,
  onSaveDebt,
  onDeleteDebt,
  currencySymbol = '₹',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null);

  // Form State
  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<DebtType>('lent');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DebtStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | DebtType>('all');

  // Stats Calculations
  const pendingLentTotal = debts
    .filter((d) => d.status === 'pending' && d.type === 'lent')
    .reduce((sum, d) => sum + d.amount, 0);

  const pendingBorrowedTotal = debts
    .filter((d) => d.status === 'pending' && d.type === 'borrowed')
    .reduce((sum, d) => sum + d.amount, 0);

  const settledTotalCount = debts.filter((d) => d.status === 'settled').length;

  const openAddModal = () => {
    setEditingDebt(null);
    setPersonName('');
    setPhoneNumber('');
    setAmount('');
    setType('lent');
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (debt: DebtRecord) => {
    setEditingDebt(debt);
    setPersonName(debt.personName);
    setPhoneNumber(debt.phoneNumber || '');
    setAmount(debt.amount.toString());
    setType(debt.type);
    setDate(debt.date);
    setDueDate(debt.dueDate || '');
    setNotes(debt.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    const payload = {
      ...(editingDebt ? { id: editingDebt.id, status: editingDebt.status } : { status: 'pending' as DebtStatus }),
      personName: personName.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      amount: parseFloat(amount),
      type,
      date,
      dueDate: dueDate ? dueDate : undefined,
      notes: notes.trim() || undefined,
    };

    onSaveDebt(payload as any);
    setIsModalOpen(false);
  };

  const toggleStatus = (debt: DebtRecord) => {
    const nextStatus: DebtStatus = debt.status === 'pending' ? 'settled' : 'pending';
    onSaveDebt({ ...debt, status: nextStatus });
  };

  // Pre-filled SMS / WhatsApp Message Template
  const getReminderMsg = (debt: DebtRecord) => {
    const formattedAmount = `${currencySymbol}${debt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (debt.type === 'lent') {
      return `Hi ${debt.personName}! Friendly reminder regarding our LedgerPulse entry of ${formattedAmount} for "${debt.notes || 'Debt/Loan'}". Date: ${debt.date}.${debt.dueDate ? ' Due Date: ' + debt.dueDate : ''} Thanks!`;
    } else {
      return `Hi ${debt.personName}! Just updating you regarding the payment entry of ${formattedAmount} for "${debt.notes || 'Debt/Loan'}". Date: ${debt.date}. Thank you!`;
    }
  };

  // Open Native SMS App with pre-filled message
  const handleSendSMS = (debt: DebtRecord) => {
    const phone = debt.phoneNumber?.trim() || prompt('Enter recipient phone number for SMS:');
    if (!phone) return;
    const msg = getReminderMsg(debt);
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    window.open(`sms:${cleanPhone}?body=${encodeURIComponent(msg)}`, '_self');
  };

  // Open WhatsApp with pre-filled message
  const handleSendWhatsApp = (debt: DebtRecord) => {
    const phone = debt.phoneNumber?.trim() || prompt('Enter recipient phone number with country code (e.g. +919876543210):');
    if (!phone) return;
    const msg = getReminderMsg(debt);
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filtered List
  const filteredDebts = debts.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="debt-tracker-section">
      {/* Overview Stat Cards Grid */}
      <div className="stat-cards-grid">
        {/* Owed To You (Lent) */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Owed To You (Lent)</span>
            <div className="stat-icon-badge income-badge">
              <ArrowUpRight className="stat-icon" />
            </div>
          </div>
          <div className="stat-value text-emerald">
            +{currencySymbol}{pendingLentTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-footer">
            <Clock className="footer-icon" />
            <span>Pending collection from friends</span>
          </div>
        </div>

        {/* You Owe (Borrowed) */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">You Owe (Borrowed)</span>
            <div className="stat-icon-badge expense-badge">
              <ArrowDownRight className="stat-icon text-rose" />
            </div>
          </div>
          <div className="stat-value text-rose">
            -{currencySymbol}{pendingBorrowedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="stat-footer">
            <DollarSign className="footer-icon" />
            <span>Pending repayment from you</span>
          </div>
        </div>

        {/* Settled Records */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Settled Debts</span>
            <div className="stat-icon-badge balance-badge">
              <CheckCircle2 className="stat-icon" />
            </div>
          </div>
          <div className="stat-value text-indigo">{settledTotalCount} Records</div>
          <div className="stat-footer">
            <Users className="footer-icon" />
            <span>Fully settled & paid records</span>
          </div>
        </div>
      </div>

      {/* Control Bar & Filter Tabs */}
      <div className="list-controls-bar">
        <div className="filters-group flex-1">
          {/* Type Toggle */}
          <div className="type-toggle-group">
            <button
              onClick={() => setTypeFilter('all')}
              className={`type-btn ${typeFilter === 'all' ? 'active' : ''}`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('lent')}
              className={`type-btn ${typeFilter === 'lent' ? 'active-income' : ''}`}
            >
              Lent (Owed To Me)
            </button>
            <button
              onClick={() => setTypeFilter('borrowed')}
              className={`type-btn ${typeFilter === 'borrowed' ? 'active-expense' : ''}`}
            >
              Borrowed (I Owe)
            </button>
          </div>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="settled">Settled Only</option>
          </select>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <Plus className="btn-icon" />
          <span>Add Debt / Loan Record</span>
        </button>
      </div>

      {/* Debt Pill Cards Grid */}
      {filteredDebts.length === 0 ? (
        <div className="empty-list-state">
          <div className="empty-icon-circle">
            <Users className="empty-icon text-indigo" />
          </div>
          <h3>No debt or loan records found</h3>
          <p>Keep track of money lent to friends or borrowed from others.</p>
          <button onClick={openAddModal} className="btn btn-primary mt-4">
            + Add First Record
          </button>
        </div>
      ) : (
        <div className="debt-cards-grid">
          {filteredDebts.map((debt) => {
            const isLent = debt.type === 'lent';
            const isSettled = debt.status === 'settled';

            return (
              <div
                key={debt.id}
                className={`debt-card ${isSettled ? 'debt-card-settled' : ''}`}
              >
                {/* Header */}
                <div className="debt-card-header">
                  <div className="debt-person-info">
                    <div className="debt-avatar">
                      {debt.personName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="debt-person-name">{debt.personName}</h4>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`debt-type-pill ${isLent ? 'lent-pill' : 'borrowed-pill'}`}>
                          {isLent ? '💸 You Lent' : '🤝 You Borrowed'}
                        </span>
                        {debt.phoneNumber && (
                          <span className="debt-phone-tag">
                            <Phone className="w-3 h-3 text-indigo" />
                            <span>{debt.phoneNumber}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`debt-amount ${isLent ? 'text-emerald' : 'text-rose'}`}>
                    {isLent ? '+' : '-'}{currencySymbol}
                    {debt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Body / Notes */}
                {debt.notes && (
                  <div className="debt-notes-box">
                    <AlignLeft className="w-3.5 h-3.5 text-muted" />
                    <span>{debt.notes}</span>
                  </div>
                )}

                {/* Instant SMS & WhatsApp Reminder Bar */}
                <div className="debt-reminder-bar">
                  <span className="reminder-label">Send Details:</span>
                  <div className="reminder-btns">
                    <button
                      onClick={() => handleSendSMS(debt)}
                      className="sms-action-btn"
                      title="Send SMS via phone messages app"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>SMS App</span>
                    </button>

                    <button
                      onClick={() => handleSendWhatsApp(debt)}
                      className="wa-action-btn"
                      title="Send WhatsApp message"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Footer / Dates & Actions */}
                <div className="debt-card-footer">
                  <div className="debt-date-info">
                    <span>Date: {debt.date}</span>
                    {debt.dueDate && (
                      <span className="due-date-tag">Due: {debt.dueDate}</span>
                    )}
                  </div>

                  <div className="debt-actions">
                    <button
                      onClick={() => toggleStatus(debt)}
                      className={`btn-settle-toggle ${isSettled ? 'settled-active' : 'pending-active'}`}
                      title={isSettled ? 'Mark as Pending' : 'Mark as Settled'}
                    >
                      {isSettled ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald" />
                          <span>Settled</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-amber" />
                          <span>Settle Now</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openEditModal(debt)}
                      className="action-btn edit-btn"
                      title="Edit Record"
                    >
                      <Edit3 className="action-icon" />
                    </button>

                    <button
                      onClick={() => onDeleteDebt(debt.id)}
                      className="action-btn delete-btn"
                      title="Delete Record"
                    >
                      <Trash2 className="action-icon" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Debt Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingDebt ? 'Edit Debt Record' : 'Add New Debt Record'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form">
              {/* Type Switcher */}
              <div className="form-group">
                <label className="form-label">Record Type</label>
                <div className="type-toggle-bar">
                  <button
                    type="button"
                    className={`toggle-option ${type === 'lent' ? 'selected-income' : ''}`}
                    onClick={() => setType('lent')}
                  >
                    💸 You Lent Money
                  </button>
                  <button
                    type="button"
                    className={`toggle-option ${type === 'borrowed' ? 'selected-expense' : ''}`}
                    onClick={() => setType('borrowed')}
                  >
                    🤝 You Borrowed Money
                  </button>
                </div>
              </div>

              {/* Person Name & Phone Row */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">
                    <Users className="form-icon text-indigo" /> Person Name / Friend
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul, Priya, Alex"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">
                    <Phone className="form-icon text-indigo" /> Phone Number (SMS / WA)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">
                  <DollarSign className="form-icon text-indigo" /> Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {/* Date & Optional Due Date */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">
                    <Calendar className="form-icon text-indigo" /> Record Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">
                    <Clock className="form-icon text-indigo" /> Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">
                  <AlignLeft className="form-icon text-indigo" /> Notes / Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dinner bill split, taxi fare, concert ticket"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <span>{editingDebt ? 'Update Record' : 'Save Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

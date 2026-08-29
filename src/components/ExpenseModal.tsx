import React, { useState, useEffect } from 'react';
import type { Transaction, Category, TransactionType, PaymentMethod } from '../types';
import { X, Check, DollarSign, Calendar, Tag, CreditCard, AlignLeft, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'> | Transaction) => void;
  editingTransaction?: Transaction | null;
  categories: Category[];
  currencySymbol?: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
  categories,
  currencySymbol = '₹',
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingTransaction) {
      setTitle(editingTransaction.title);
      setAmount(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setNotes(editingTransaction.notes || '');
      setReceiptUrl(editingTransaction.receiptUrl || undefined);
    } else {
      setTitle('');
      setAmount('');
      setType('expense');
      const defaultExpenseCat = categories.find((c) => c.type === 'expense')?.name || 'Food & Dining';
      setCategory(defaultExpenseCat);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Credit Card');
      setNotes('');
      setReceiptUrl(undefined);
    }
    setErrors({});
  }, [editingTransaction, isOpen, categories]);

  if (!isOpen) return null;

  const handleTypeToggle = (newType: TransactionType) => {
    setType(newType);
    const matchingCat = categories.find((c) => c.type === newType)?.name;
    if (matchingCat) setCategory(matchingCat);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!category) errs.category = 'Category is required';
    if (!date) errs.date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...(editingTransaction ? { id: editingTransaction.id } : {}),
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      type,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
      receiptUrl: receiptUrl || undefined,
    };

    onSave(payload as any);
    onClose();
  };

  const availableCategories = categories.filter((c) => c.type === type);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close Modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Type Switcher */}
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div className="type-toggle-bar">
              <button
                type="button"
                className={`toggle-option ${type === 'expense' ? 'selected-expense' : ''}`}
                onClick={() => handleTypeToggle('expense')}
              >
                💸 Expense
              </button>
              <button
                type="button"
                className={`toggle-option ${type === 'income' ? 'selected-income' : ''}`}
                onClick={() => handleTypeToggle('income')}
              >
                💰 Income
              </button>
            </div>
          </div>

          {/* Amount & Title Row */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">
                <DollarSign className="form-icon text-indigo" /> Amount ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`form-input ${errors.amount ? 'input-error' : ''}`}
              />
              {errors.amount && <span className="error-text">{errors.amount}</span>}
            </div>

            <div className="form-group flex-2">
              <label className="form-label">Title / Description</label>
              <input
                type="text"
                placeholder="e.g. Grocery store, Salary, Gas refill"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`form-input ${errors.title ? 'input-error' : ''}`}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>
          </div>

          {/* Category Chips */}
          <div className="form-group">
            <label className="form-label">
              <Tag className="form-icon text-indigo" /> Select Category
            </label>
            <div className="category-chips-grid">
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`chip-btn ${category === cat.name ? 'chip-active' : ''}`}
                  style={{
                    borderColor: category === cat.name ? cat.color : undefined,
                    backgroundColor: category === cat.name ? `${cat.color}20` : undefined,
                  }}
                >
                  <span className="chip-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            {errors.category && <span className="error-text">{errors.category}</span>}
          </div>

          {/* Date & Payment Method Row */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">
                <Calendar className="form-icon text-indigo" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
              />
              {errors.date && <span className="error-text">{errors.date}</span>}
            </div>

            <div className="form-group flex-1">
              <label className="form-label">
                <CreditCard className="form-icon text-indigo" /> Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="form-select"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI / NetBanking">UPI / NetBanking</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Digital Receipt Attachment Uploader */}
          <div className="form-group">
            <label className="form-label">
              <ImageIcon className="form-icon text-indigo" /> Digital Receipt / Bill Image (Optional)
            </label>
            {receiptUrl ? (
              <div className="receipt-preview-box">
                <img src={receiptUrl} alt="Receipt preview" className="receipt-thumbnail" />
                <button
                  type="button"
                  onClick={() => setReceiptUrl(undefined)}
                  className="btn btn-danger-outline btn-sm"
                >
                  <Trash2 className="w-4 h-4" /> Remove Receipt
                </button>
              </div>
            ) : (
              <label className="receipt-upload-btn">
                <ImageIcon className="w-5 h-5 text-indigo" />
                <span>Upload Bill / Receipt Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Optional Notes */}
          <div className="form-group">
            <label className="form-label">
              <AlignLeft className="form-icon text-indigo" /> Notes / Memo (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Receipt #1234 or dinner with colleagues"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check className="btn-icon" />
              <span>{editingTransaction ? 'Update Transaction' : 'Save Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

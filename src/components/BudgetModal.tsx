import React, { useState } from 'react';
import { X, Target, DollarSign, Download, Upload, RefreshCw, Check } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyBudget: number;
  onSaveBudget: (budget: number) => void;
  currencySymbol: string;
  onSaveCurrency: (symbol: string) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  monthlyBudget,
  onSaveBudget,
  currencySymbol,
  onSaveCurrency,
  onExportData,
  onImportData,
  onResetData,
}) => {
  const [budgetVal, setBudgetVal] = useState(monthlyBudget.toString());
  const [currencyVal, setCurrencyVal] = useState(currencySymbol);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(budgetVal);
    onSaveBudget(isNaN(num) || num < 0 ? 0 : num);
    onSaveCurrency(currencyVal.trim() || '$');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Target className="modal-title-icon text-indigo" />
            <h2 className="modal-title">Budget & Settings</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Monthly Budget Target */}
          <div className="form-group">
            <label className="form-label">
              <Target className="form-icon text-indigo" /> Monthly Target Expense Limit
            </label>
            <div className="input-with-symbol">
              <span className="symbol-prefix">{currencyVal}</span>
              <input
                type="number"
                step="50"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                placeholder="e.g. 2500"
                className="form-input symbol-padding"
              />
            </div>
            <p className="input-help">Set your spending ceiling for visual tracking & warning alerts.</p>
          </div>

          {/* Preferred Currency Symbol */}
          <div className="form-group">
            <label className="form-label">
              <DollarSign className="form-icon text-indigo" /> Currency Symbol
            </label>
            <div className="currency-selector-buttons">
              {['₹', '$', '€', '£', '¥', 'A$'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setCurrencyVal(sym)}
                  className={`symbol-btn ${currencyVal === sym ? 'active' : ''}`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <hr className="divider-line" />

          {/* Backup & Restore Data Options */}
          <div className="form-group">
            <label className="form-label">Data Management & Backup</label>
            <div className="backup-actions">
              <button type="button" onClick={onExportData} className="btn btn-secondary flex-1">
                <Download className="btn-icon" />
                <span>Export JSON</span>
              </button>

              <label className="btn btn-secondary flex-1 cursor-pointer">
                <Upload className="btn-icon" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Clear All Data */}
          <div className="form-group mt-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all expense records and start fresh?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="btn btn-danger-outline w-full"
            >
              <RefreshCw className="btn-icon" />
              <span>Clear All Data</span>
            </button>
          </div>

          {/* Save Button */}
          <div className="modal-footer mt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Check className="btn-icon" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

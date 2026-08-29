import React from 'react';
import { Download, Plus, Moon, Sun, Settings, FileSpreadsheet, CloudCheck, CloudOff, LogOut, Wallet, Users, Trash2, Crown, ShieldCheck } from 'lucide-react';
import type { User } from '../types';

interface HeaderProps {
  selectedMonth: string; // e.g. "2026-08" or "ALL"
  onMonthChange: (month: string) => void;
  availableMonths: { value: string; label: string }[];
  onOpenAddModal: () => void;
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
  onOpenBudgetModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeMonthLabel: string;
  isCloudConnected?: boolean;
  user: User | null;
  onLogout: () => void;
  activeTab: 'ledger' | 'debts';
  onTabChange: (tab: 'ledger' | 'debts') => void;
  onOpenRecycleBin: () => void;
  recycleBinCount: number;
  onOpenAdminCenter?: () => void;
  selectedUserFilterName?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  onMonthChange,
  availableMonths,
  onOpenAddModal,
  onDownloadPDF,
  onDownloadExcel,
  onOpenBudgetModal,
  darkMode,
  onToggleDarkMode,
  activeMonthLabel,
  isCloudConnected = true,
  user,
  onLogout,
  activeTab,
  onTabChange,
  onOpenRecycleBin,
  recycleBinCount,
  onOpenAdminCenter,
  selectedUserFilterName,
}) => {
  return (
    <header className="app-header">
      <div className="header-container">
        {/* Brand Logo & Name */}
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <img src="/logo.png" alt="LedgerPulse Logo" className="brand-logo-img" />
          </div>
          <div>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <h1 className="brand-title">LedgerPulse</h1>
              <span 
                className={`cloud-sync-badge ${isCloudConnected ? 'connected' : 'disconnected'}`}
                title={isCloudConnected ? "Real-time Firebase Cloud Sync Active across all devices" : "Cloud Sync Offline"}
              >
                {isCloudConnected ? (
                  <>
                    <CloudCheck className="cloud-badge-icon" />
                    <span>Cloud Sync</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="cloud-badge-icon" />
                    <span>Offline</span>
                  </>
                )}
              </span>

              {user?.isSuperAdmin && (
                <button
                  className="pill-badge pill-purple flex items-center gap-1 cursor-pointer"
                  onClick={onOpenAdminCenter}
                  title="Open Super Admin Control Center"
                  style={{ border: 'none', fontStyle: 'normal' }}
                >
                  <Crown className="cloud-badge-icon" />
                  <span>Super Admin</span>
                  {selectedUserFilterName && (
                    <span style={{ opacity: 0.9 }}>({selectedUserFilterName})</span>
                  )}
                </button>
              )}
            </div>
            <p className="brand-subtitle">Personal Expense Tracker & Cloud Financial Ledger</p>
          </div>
        </div>

        {/* Tab Selector Switcher */}
        <div className="main-nav-tabs">
          <button
            onClick={() => onTabChange('ledger')}
            className={`nav-tab-btn ${activeTab === 'ledger' ? 'active-tab' : ''}`}
          >
            <Wallet className="w-4 h-4" />
            <span>Expense Ledger</span>
          </button>

          <button
            onClick={() => onTabChange('debts')}
            className={`nav-tab-btn ${activeTab === 'debts' ? 'active-tab' : ''}`}
          >
            <Users className="w-4 h-4" />
            <span>Debt Tracker (IOUs)</span>
          </button>
        </div>

        {/* Action Controls & Month Picker */}
        <div className="header-controls">
          {activeTab === 'ledger' && (
            <>
              {/* Month Selector */}
              <div className="month-picker-wrapper">
                <span className="picker-label">Period:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(e.target.value)}
                  aria-label="Select Expense Period"
                  className="month-select"
                >
                  {availableMonths.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Download PDF Button */}
              <button
                onClick={onDownloadPDF}
                className="btn btn-pdf"
                title={`Download PDF Report for ${activeMonthLabel}`}
              >
                <Download className="btn-icon" />
                <span className="btn-text">PDF</span>
                <span className="pdf-badge">{activeMonthLabel.split(' ')[0]}</span>
              </button>

              {/* Download Excel Button */}
              <button
                onClick={onDownloadExcel}
                className="btn btn-secondary"
                style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                title={`Export Excel Sheet for ${activeMonthLabel}`}
              >
                <FileSpreadsheet className="btn-icon" />
                <span className="btn-text">Excel</span>
              </button>

              {/* Add Transaction Button */}
              <button onClick={onOpenAddModal} className="btn btn-primary">
                <Plus className="btn-icon" />
                <span>Add Entry</span>
              </button>
            </>
          )}

          {/* Recycle Bin Button with 15-day recovery */}
          <button
            onClick={onOpenRecycleBin}
            className="btn btn-secondary"
            style={{ position: 'relative', borderColor: recycleBinCount > 0 ? 'rgba(245, 158, 11, 0.5)' : undefined }}
            title="Recycle Bin (Restore deleted entries within 15 days)"
          >
            <Trash2 className="btn-icon text-amber" />
            <span className="btn-text">Recycle Bin</span>
            {recycleBinCount > 0 && (
              <span className="pill-badge bg-amber text-white" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                {recycleBinCount}
              </span>
            )}
          </button>

          {/* Super Admin Control Center Button */}
          {user?.isSuperAdmin && (
            <button
              onClick={onOpenAdminCenter}
              className="btn btn-secondary"
              style={{ borderColor: 'rgba(139, 92, 246, 0.5)', color: '#a78bfa' }}
              title="Super Admin Control Center: Manage users and access user data"
            >
              <ShieldCheck className="btn-icon text-purple" />
              <span className="btn-text">Admin Panel</span>
            </button>
          )}

          {/* Budget Settings */}
          <button
            onClick={onOpenBudgetModal}
            className="btn btn-secondary icon-only"
            title="Budget & Category Settings"
          >
            <Settings className="btn-icon" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="btn btn-secondary icon-only"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="btn-icon text-amber" /> : <Moon className="btn-icon" />}
          </button>

          {/* User Account Info & Logout */}
          {user && (
            <div className="user-account-badge" title={`Logged in as ${user.email}`}>
              <div className="user-avatar-circle">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="user-details-text">
                <span className="user-name-label">{user.name || user.email.split('@')[0]}</span>
                <span className="user-email-label">{user.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="btn btn-danger-outline icon-only"
                style={{ padding: '0.35rem 0.5rem', marginLeft: '0.25rem' }}
                title="Log out of account"
              >
                <LogOut className="btn-icon" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


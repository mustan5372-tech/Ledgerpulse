import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Award } from 'lucide-react';

interface StatCardsProps {
  totalIncome: number;
  totalExpense: number;
  monthlyBudget: number;
  topCategory: { name: string; amount: number } | null;
  transactionCount: number;
  currencySymbol?: string;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalIncome,
  totalExpense,
  monthlyBudget,
  topCategory,
  transactionCount,
  currencySymbol = '₹',
}) => {
  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0';
  const budgetPercent = monthlyBudget > 0 ? Math.min(100, Math.round((totalExpense / monthlyBudget) * 100)) : 0;
  const isBudgetExceeded = monthlyBudget > 0 && totalExpense > monthlyBudget;

  const formatCurrency = (val: number) => {
    return `${currencySymbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="stat-cards-grid">
      {/* Total Income Card */}
      <div className="stat-card income-card">
        <div className="stat-header">
          <span className="stat-title">Total Income</span>
          <div className="stat-icon-badge income-badge">
            <ArrowUpRight className="stat-icon" />
          </div>
        </div>
        <div className="stat-value text-emerald">{formatCurrency(totalIncome)}</div>
        <div className="stat-footer">
          <TrendingUp className="footer-icon text-emerald" />
          <span>Inflows this period</span>
        </div>
      </div>

      {/* Total Expenses Card */}
      <div className="stat-card expense-card">
        <div className="stat-header">
          <span className="stat-title">Total Expenses</span>
          <div className="stat-icon-badge expense-badge">
            <ArrowDownRight className="stat-icon" />
          </div>
        </div>
        <div className="stat-value text-rose">{formatCurrency(totalExpense)}</div>
        <div className="stat-footer">
          {monthlyBudget > 0 ? (
            <div className="budget-progress-container">
              <div className="budget-label-row">
                <span className={isBudgetExceeded ? 'text-rose font-bold' : ''}>
                  {budgetPercent}% of {formatCurrency(monthlyBudget)} budget
                </span>
              </div>
              <div className="budget-bar-bg">
                <div
                  className={`budget-bar-fill ${isBudgetExceeded ? 'bg-rose' : budgetPercent > 80 ? 'bg-amber' : 'bg-indigo'}`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <span>{transactionCount} total record{transactionCount === 1 ? '' : 's'}</span>
          )}
        </div>
      </div>

      {/* Net Balance Card */}
      <div className="stat-card balance-card">
        <div className="stat-header">
          <span className="stat-title">Net Savings</span>
          <div className="stat-icon-badge balance-badge">
            <DollarSign className="stat-icon" />
          </div>
        </div>
        <div className={`stat-value ${netBalance >= 0 ? 'text-indigo' : 'text-rose'}`}>
          {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
        </div>
        <div className="stat-footer">
          <span className="pill-badge pill-purple">
            {savingsRate}% Savings Rate
          </span>
        </div>
      </div>

      {/* Top Spending Category Card */}
      <div className="stat-card top-cat-card">
        <div className="stat-header">
          <span className="stat-title">Top Category</span>
          <div className="stat-icon-badge top-badge">
            <Award className="stat-icon" />
          </div>
        </div>
        <div className="stat-value text-primary">
          {topCategory ? topCategory.name : 'N/A'}
        </div>
        <div className="stat-footer">
          {topCategory ? (
            <span className="text-secondary font-medium">
              Spent {formatCurrency(topCategory.amount)}
            </span>
          ) : (
            <span>No expenses logged</span>
          )}
        </div>
      </div>
    </div>
  );
};

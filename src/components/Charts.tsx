import React, { useState } from 'react';
import type { Category, Transaction } from '../types';
import { PieChart, BarChart3 } from 'lucide-react';

interface ChartsProps {
  transactions: Transaction[];
  categories: Category[];
  currencySymbol?: string;
}

export const Charts: React.FC<ChartsProps> = ({
  transactions,
  categories,
  currencySymbol = '₹',
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [activeBarDay, setActiveBarDay] = useState<number | null>(null);

  // Filter only expenses
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);

  // Compute category totals
  const categoryTotals: { [key: string]: { amount: number; color: string; icon: string } } = {};

  expenses.forEach((tx) => {
    const catObj = categories.find((c) => c.name === tx.category || c.id === tx.category);
    const color = catObj?.color || '#64748b';
    const icon = catObj?.icon || '📦';

    if (!categoryTotals[tx.category]) {
      categoryTotals[tx.category] = { amount: 0, color, icon };
    }
    categoryTotals[tx.category].amount += tx.amount;
  });

  const categoryList = Object.entries(categoryTotals)
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      color: data.color,
      icon: data.icon,
      percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Prepare SVG Donut Chart Math
  let cumulativeAngle = 0;
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Compute Daily Spend for Bar Chart
  const dailyMap: { [day: number]: number } = {};
  expenses.forEach((tx) => {
    const day = new Date(tx.date).getDate();
    dailyMap[day] = (dailyMap[day] || 0) + tx.amount;
  });

  // Days 1..31
  const maxDaily = Math.max(...Object.values(dailyMap), 1);
  const activeDays = Object.keys(dailyMap)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="charts-grid">
      {/* Donut Chart Card */}
      <div className="chart-card">
        <div className="chart-header">
          <PieChart className="chart-header-icon text-indigo" />
          <div>
            <h3 className="chart-title">Expense Distribution</h3>
            <p className="mobile-chart-subtitle">Category breakdown & proportions</p>
          </div>
        </div>

        {totalExpense === 0 ? (
          <div className="chart-empty">No expense data available for this period.</div>
        ) : (
          <div className="donut-chart-wrapper">
            {/* SVG Donut */}
            <div className="donut-svg-container">
              <svg viewBox="0 0 200 200" className="donut-svg">
                {categoryList.map((cat) => {
                  const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((cumulativeAngle / 100) * circumference);
                  cumulativeAngle += cat.percentage;

                  const isHovered = hoveredCategory === cat.name;

                  return (
                    <circle
                      key={cat.name}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      onMouseEnter={() => setHoveredCategory(cat.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() => setHoveredCategory(hoveredCategory === cat.name ? null : cat.name)}
                      className="donut-segment"
                    />
                  );
                })}
              </svg>
              {/* Inner Donut Center Text */}
              <div className="donut-center-text">
                <span className="donut-center-label">
                  {hoveredCategory || 'Total Spend'}
                </span>
                <span className="donut-center-amount">
                  {hoveredCategory
                    ? `${currencySymbol}${categoryTotals[hoveredCategory]?.amount.toFixed(2)}`
                    : `${currencySymbol}${totalExpense.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Category Breakdown Legend */}
            <div className="chart-legend">
              {categoryList.map((cat) => (
                <div
                  key={cat.name}
                  className={`legend-item ${hoveredCategory === cat.name ? 'active-legend' : ''}`}
                  onMouseEnter={() => setHoveredCategory(cat.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => setHoveredCategory(hoveredCategory === cat.name ? null : cat.name)}
                >
                  <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                  <span className="legend-icon">{cat.icon}</span>
                  <span className="legend-name">{cat.name}</span>
                  <span className="legend-pct">{cat.percentage.toFixed(1)}%</span>
                  <span className="legend-val">
                    {currencySymbol}{cat.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Daily Spend Trend Bar Chart Card */}
      <div className="chart-card">
        <div className="chart-header">
          <BarChart3 className="chart-header-icon text-indigo" />
          <div>
            <h3 className="chart-title">Daily Expense Breakdown</h3>
            <p className="mobile-chart-subtitle">Spend trend across days (1 - 31)</p>
          </div>
        </div>

        {activeDays.length === 0 ? (
          <div className="chart-empty">No transactions recorded for bar chart view.</div>
        ) : (
          <div className="bar-chart-container">
            <div className="mobile-scroll-hint">
              <span>← Scroll horizontally to view all days →</span>
              {activeBarDay && (
                <span className="active-day-tooltip">
                  Day {activeBarDay}: {currencySymbol}{(dailyMap[activeBarDay] || 0).toFixed(2)}
                </span>
              )}
            </div>

            <div className="bar-chart-scroll-wrapper">
              <div className="bar-chart-bars">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                  const amount = dailyMap[day] || 0;
                  const heightPercent = amount > 0 ? Math.max(10, Math.round((amount / maxDaily) * 100)) : 0;
                  const isSelected = activeBarDay === day;

                  return (
                    <div
                      key={day}
                      className={`bar-column ${isSelected ? 'bar-column-selected' : ''}`}
                      title={`Day ${day}: ${currencySymbol}${amount.toFixed(2)}`}
                      onClick={() => setActiveBarDay(activeBarDay === day ? null : day)}
                    >
                      <div className="bar-wrapper">
                        {amount > 0 && (
                          <div
                            className="bar-fill"
                            style={{ height: `${heightPercent}%` }}
                          />
                        )}
                      </div>
                      <span className={`bar-day ${amount > 0 ? 'has-spend' : ''}`}>{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bar-chart-footer">
              <span>Day of Month (1 - 31)</span>
              <span>Peak Day: <strong>{currencySymbol}{maxDaily.toFixed(2)}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


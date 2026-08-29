import * as XLSX from 'xlsx';
import type { Transaction } from '../types';

interface GenerateExcelParams {
  transactions: Transaction[];
  monthLabel: string;
  currencySymbol?: string;
}

export const generateMonthlyExcel = ({
  transactions,
  monthLabel,
  currencySymbol = '₹',
}: GenerateExcelParams) => {
  // Sort transactions chronologically
  const sortedTx = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 1. Prepare Sheet 1 Data: Detailed Transactions
  const txDataRows = sortedTx.map((tx, idx) => ({
    'S.No': idx + 1,
    'Date': tx.date,
    'Title / Description': tx.title,
    'Category': tx.category,
    'Payment Method': tx.paymentMethod,
    'Type': tx.type.toUpperCase(),
    [`Amount (${currencySymbol})`]: tx.amount,
    'Notes': tx.notes || '-',
  }));

  // 2. Prepare Sheet 2 Data: Category Breakdown
  let totalExpense = 0;
  const categoryMap: Record<string, { amount: number; count: number }> = {};

  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      totalExpense += tx.amount;
      if (!categoryMap[tx.category]) {
        categoryMap[tx.category] = { amount: 0, count: 0 };
      }
      categoryMap[tx.category].amount += tx.amount;
      categoryMap[tx.category].count += 1;
    }
  });

  const catSummaryRows = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .map(([catName, data]) => {
      const pct = totalExpense > 0 ? ((data.amount / totalExpense) * 100).toFixed(1) : '0';
      return {
        'Category Name': catName,
        'Transactions Count': data.count,
        [`Total Spent (${currencySymbol})`]: data.amount,
        '% Share of Expenses': `${pct}%`,
      };
    });

  // Create Workbook
  const workbook = XLSX.utils.book_new();

  // Create Worksheets
  const txWorksheet = XLSX.utils.json_to_sheet(txDataRows);
  const catWorksheet = XLSX.utils.json_to_sheet(catSummaryRows);

  // Set column widths for readability
  txWorksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 12 }, // Date
    { wch: 30 }, // Title
    { wch: 22 }, // Category
    { wch: 18 }, // Payment Method
    { wch: 12 }, // Type
    { wch: 16 }, // Amount
    { wch: 30 }, // Notes
  ];

  catWorksheet['!cols'] = [
    { wch: 25 }, // Category
    { wch: 18 }, // Count
    { wch: 20 }, // Total Spent
    { wch: 20 }, // % Share
  ];

  // Append Sheets to Workbook
  XLSX.utils.book_append_sheet(workbook, txWorksheet, 'Transactions Log');
  XLSX.utils.book_append_sheet(workbook, catWorksheet, 'Category Summary');

  // Generate File Name & Trigger Download
  const fileName = `Expense_Report_${monthLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

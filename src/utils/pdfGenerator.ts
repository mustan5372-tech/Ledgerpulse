import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction } from '../types';

interface GeneratePDFParams {
  transactions: Transaction[];
  selectedMonth: string; // "2026-08" or "All Time"
  monthLabel: string;    // "August 2026"
  currencySymbol?: string;
  userName?: string;
}

export const generateMonthlyPDF = ({
  transactions,
  monthLabel,
  currencySymbol = '₹',
  userName = 'Personal Account',
}: GeneratePDFParams) => {
  // 1. Calculate Summary Financial Metrics
  let totalIncome = 0;
  let totalExpense = 0;

  const categoryTotals: Record<string, { amount: number; count: number }> = {};

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      if (!categoryTotals[tx.category]) {
        categoryTotals[tx.category] = { amount: 0, count: 0 };
      }
      categoryTotals[tx.category].amount += tx.amount;
      categoryTotals[tx.category].count += 1;
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0.0';

  // Sort categories by highest spend
  const sortedCategories = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b.amount - a.amount
  );

  // 2. Initialize jsPDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Header Banner ---
  doc.setFillColor(15, 23, 42); // Slate 900 (#0f172a)
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Decorative Accent Line
  doc.setFillColor(99, 102, 241); // Indigo 500 (#6366f1)
  doc.rect(0, 42, pageWidth, 3, 'F');

  // App Logo/Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PERSONAL EXPENSE LEDGER', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(`Monthly Financial Statement • ${monthLabel}`, 14, 26);
  doc.text(`Account: ${userName} | Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}`, 14, 33);

  // Top Right Month Tag
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(pageWidth - 60, 12, 46, 20, 3, 3, 'F');
  doc.setTextColor(129, 140, 248); // Indigo 400
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('STATEMENT PERIOD', pageWidth - 57, 19);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(monthLabel, pageWidth - 57, 27);

  let currentY = 54;

  // --- Executive Financial Summary Box ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Executive Financial Summary', 14, currentY);
  currentY += 6;

  // Draw 4 Metric Box Containers
  const boxWidth = (pageWidth - 28 - 9) / 4; // 4 boxes with 3mm gaps
  const boxHeight = 22;

  const metrics = [
    { title: 'TOTAL INCOME', value: `${currencySymbol}${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [22, 163, 74], bg: [240, 253, 244] }, // Green
    { title: 'TOTAL EXPENSES', value: `${currencySymbol}${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [220, 38, 38], bg: [254, 242, 242] }, // Red
    { title: 'NET SAVINGS', value: `${netSavings >= 0 ? '+' : ''}${currencySymbol}${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: netSavings >= 0 ? [37, 99, 235] : [220, 38, 38], bg: [240, 249, 255] }, // Blue
    { title: 'SAVINGS RATE', value: `${savingsRate}%`, color: [124, 58, 237], bg: [245, 243, 255] }, // Purple
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (boxWidth + 3);
    doc.setFillColor(m.bg[0], m.bg[1], m.bg[2]);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.title, x + 4, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, x + 4, currentY + 16);
  });

  currentY += boxHeight + 10;

  // --- Category Breakdown Summary Table ---
  if (sortedCategories.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Spending by Category', 14, currentY);
    currentY += 4;

    const catRows = sortedCategories.map(([catName, data]) => {
      const pct = totalExpense > 0 ? ((data.amount / totalExpense) * 100).toFixed(1) : '0';
      return [
        catName,
        `${data.count} transaction${data.count > 1 ? 's' : ''}`,
        `${currencySymbol}${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `${pct}%`
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Transactions', 'Total Amount', '% of Total Expense']],
      body: catRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 35, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- Detailed Itemized Transactions Table ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Detailed Transaction Log', 14, currentY);
  currentY += 4;

  const sortedTx = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const txRows = sortedTx.map((tx) => [
    tx.date,
    tx.title + (tx.notes ? ` (${tx.notes})` : ''),
    tx.category,
    tx.paymentMethod,
    tx.type.toUpperCase(),
    `${tx.type === 'income' ? '+' : '-'}${currencySymbol}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Description', 'Category', 'Payment Mode', 'Type', 'Amount']],
    body: txRows,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 55 },
      2: { cellWidth: 32 },
      3: { cellWidth: 28 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Color code Income (+) green and Expense (-) red in column 5
      if (data.section === 'body' && data.column.index === 5) {
        const raw = String(data.cell.raw);
        if (raw.startsWith('+')) {
          data.cell.styles.textColor = [22, 163, 74];
        } else if (raw.startsWith('-')) {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.text(`Personal Expense Ledger • Confidential Statement`, 14, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  // Trigger Save / Download
  const filename = `Expense_Report_${monthLabel.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
};

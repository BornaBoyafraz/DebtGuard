import jsPDF from 'jspdf';
import { SimulationResult } from '@/lib/types';
import { formatCurrency } from '@/lib/formatters';

const verdictLabels: Record<string, string> = {
  significantly_better: 'Significantly Better',
  better: 'Better',
  neutral: 'Neutral',
  worse: 'Worse',
  significantly_worse: 'Significantly Worse',
};

// Verdict → RGB color triple
const verdictColors: Record<string, [number, number, number]> = {
  significantly_better: [22, 163, 74],   // green-600
  better:               [34, 197, 94],   // green-500
  neutral:              [161, 161, 170], // zinc-400
  worse:                [234, 88, 12],   // orange-600
  significantly_worse:  [220, 38, 38],   // red-600
};

function verdictRgb(verdict: string): [number, number, number] {
  return verdictColors[verdict] ?? [100, 100, 100];
}

function deltaColor(delta: number, invertGood = false): [number, number, number] {
  const good: [number, number, number] = [22, 163, 74];
  const bad: [number, number, number] = [220, 38, 38];
  const neutral: [number, number, number] = [100, 100, 100];
  if (delta === 0) return neutral;
  if (invertGood) return delta < 0 ? good : bad;
  return delta > 0 ? good : bad;
}

export function generatePdfReport(result: SimulationResult): void {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  // ── Header ───────────────────────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('DebtGuard', margin, y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Financial Scenario Report', margin + 40, y);
  y += 7;

  doc.setFontSize(8);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated ${dateStr}`, margin, y);
  y += 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // ── Scenario + Decision Score ─────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(result.config.label, margin, y);
  y += 7;

  if (result.config.description) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(result.config.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4.5 + 3;
  }

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Horizon: ${result.config.horizonMonths} months`, margin, y);
  y += 12;

  // Decision Score — color-coded box
  const [vr, vg, vb] = verdictRgb(result.summary.verdict);
  doc.setFillColor(vr, vg, vb);
  doc.roundedRect(margin, y - 3, contentWidth, 18, 2, 2, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Decision Score: ${result.summary.decisionScore}/100`, margin + 5, y + 8);

  const verdictLabel = verdictLabels[result.summary.verdict] || result.summary.verdict;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(verdictLabel, pageWidth - margin - 5, y + 8, { align: 'right' });
  y += 26;

  // ── Financial Profile ─────────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Profile', margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const profileRows: [string, string][] = [
    ['Monthly Income', formatCurrency(result.profile.income)],
    ['Monthly Expenses', formatCurrency(result.profile.expenses)],
    ['Total Savings', formatCurrency(result.profile.savings)],
    ['Total Debt', formatCurrency(result.profile.totalDebt)],
    ['Interest Rate', `${result.profile.interestRate}%`],
    ['Minimum Payment', formatCurrency(result.profile.minimumPayment)],
  ];

  for (const [label, value] of profileRows) {
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.text(value, margin + 65, y);
    y += 5.5;
  }
  y += 8;

  // ── Scenario Configuration ────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Scenario Changes', margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const configRows: [string, string][] = [];
  if (result.config.extraPayment > 0) configRows.push(['Extra Payment', `${formatCurrency(result.config.extraPayment)}/mo`]);
  if (result.config.expenseChange !== 0) configRows.push(['Expense Change', `${formatCurrency(result.config.expenseChange)}/mo`]);
  if (result.config.incomeChange !== 0) configRows.push(['Income Change', `${formatCurrency(result.config.incomeChange)}/mo`]);
  if (result.config.oneTimeShock > 0) configRows.push(['One-Time Shock', formatCurrency(result.config.oneTimeShock)]);
  if (result.config.newLoanAmount > 0) configRows.push(['New Loan', `${formatCurrency(result.config.newLoanAmount)} at ${result.config.newLoanRate}%`]);
  if (result.config.refinanceRate !== null) configRows.push(['Refinance Rate', `${result.config.refinanceRate}%`]);

  if (configRows.length === 0) {
    configRows.push(['No adjustments', '—']);
  }

  for (const [label, value] of configRows) {
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin, y);
    doc.setTextColor(0, 0, 0);
    doc.text(value, margin + 65, y);
    y += 5.5;
  }
  y += 8;

  // Check for page break
  if (y > 210) {
    doc.addPage();
    y = margin;
  }

  // ── Key Results ───────────────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Results', margin, y);
  y += 7;

  const lastBaseline = result.baseline[result.baseline.length - 1];
  const lastScenario = result.scenario[result.scenario.length - 1];
  const netWorthDelta = lastScenario.netWorth - lastBaseline.netWorth;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Helper to draw a result row with colored delta
  const drawResultRow = (
    label: string,
    baseline: string,
    scenario: string,
    delta: number,
    invertGood = false
  ) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin, y);
    doc.setTextColor(60, 60, 60);
    doc.text(baseline, margin + 55, y);
    doc.setTextColor(0, 0, 0);
    doc.text(scenario, margin + 90, y);
    if (delta !== 0) {
      const [cr, cg, cb] = deltaColor(delta, invertGood);
      doc.setTextColor(cr, cg, cb);
      const sign = delta > 0 ? '+' : '';
      doc.text(`${sign}${formatCurrency(delta)}`, margin + 130, y);
    }
    y += 5.5;
  };

  // Column headers
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7.5);
  doc.text('Metric', margin, y);
  doc.text('Baseline', margin + 55, y);
  doc.text('Scenario', margin + 90, y);
  doc.text('Delta', margin + 130, y);
  y += 5;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y - 1, pageWidth - margin, y - 1);

  doc.setFontSize(9);
  drawResultRow('Final Debt', formatCurrency(lastBaseline.debt), formatCurrency(lastScenario.debt), result.summary.finalDebtDelta, true);
  drawResultRow('Final Savings', formatCurrency(lastBaseline.savings), formatCurrency(lastScenario.savings), result.summary.finalSavingsDelta);
  drawResultRow('Net Worth', formatCurrency(lastBaseline.netWorth), formatCurrency(lastScenario.netWorth), netWorthDelta);

  // Risk score row (no currency formatting)
  doc.setTextColor(100, 100, 100);
  doc.text('Avg Risk Score', margin, y);
  const avgBaselineRisk = result.baseline.reduce((s, m) => s + m.riskScore, 0) / result.baseline.length;
  const avgScenarioRisk = result.scenario.reduce((s, m) => s + m.riskScore, 0) / result.scenario.length;
  doc.setTextColor(60, 60, 60);
  doc.text(avgBaselineRisk.toFixed(1), margin + 55, y);
  doc.setTextColor(0, 0, 0);
  doc.text(avgScenarioRisk.toFixed(1), margin + 90, y);
  if (result.summary.avgRiskDelta !== 0) {
    const [cr, cg, cb] = deltaColor(result.summary.avgRiskDelta, true);
    doc.setTextColor(cr, cg, cb);
    const sign = result.summary.avgRiskDelta > 0 ? '+' : '';
    doc.text(`${sign}${result.summary.avgRiskDelta.toFixed(1)} pts`, margin + 130, y);
  }
  y += 5.5;

  // Payoff row
  doc.setTextColor(100, 100, 100);
  doc.text('Debt Payoff', margin, y);
  doc.setTextColor(60, 60, 60);
  doc.text(result.summary.baselineDebtPayoffMonth ? `Month ${result.summary.baselineDebtPayoffMonth}` : 'Not within horizon', margin + 55, y);
  doc.setTextColor(0, 0, 0);
  doc.text(result.summary.scenarioDebtPayoffMonth ? `Month ${result.summary.scenarioDebtPayoffMonth}` : 'Not within horizon', margin + 90, y);
  if (result.summary.timeToPayoffDelta !== null && result.summary.timeToPayoffDelta !== 0) {
    const [cr, cg, cb] = deltaColor(-result.summary.timeToPayoffDelta); // negative months = faster = good
    doc.setTextColor(cr, cg, cb);
    doc.text(`${result.summary.timeToPayoffDelta < 0 ? '' : '+'}${result.summary.timeToPayoffDelta} mo`, margin + 130, y);
  }
  y += 8;

  // ── Narrative ─────────────────────────────────────────────────────────────
  if (y > 220) {
    doc.addPage();
    y = margin;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis', margin, y);
  y += 7;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);

  const narrativeParagraphs = result.summary.narrative.split('\n\n').filter(Boolean);
  for (const para of narrativeParagraphs) {
    const lines = doc.splitTextToSize(para, contentWidth);
    if (y + lines.length * 4.5 > 270) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 4;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(
      'Generated by DebtGuard · Educational purposes only · Not financial advice · Projections are estimates based on your inputs',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
  }

  const fileName = `debtguard-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

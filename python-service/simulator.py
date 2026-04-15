"""
DebtGuard Simulation Engine (Python)
Mirrors TypeScript simulation-engine.ts logic exactly.
Tracks existing debt and new loan separately for correct interest calculation.
"""
from __future__ import annotations
from typing import Optional


def compute_risk_score(
    income: float,
    expenses: float,
    savings: float,
    debt: float,
    rate: float,
    min_payment: float,
) -> int:
    """Mirrors risk-engine.ts computeRiskScore() exactly."""
    score = 0
    cashflow = income - expenses - min_payment

    if cashflow < 0:
        score += 30
    elif cashflow < 200:
        score += 15

    dti = debt / (income * 12) if income > 0 else 1.0
    if dti > 0.4:
        score += 25
    elif dti > 0.2:
        score += 12

    payment_burden = min_payment / income if income > 0 else 1.0
    if payment_burden > 0.3:
        score += 20
    elif payment_burden > 0.15:
        score += 10

    # Mirrors TypeScript exactly: Infinity when cashflow >= 0
    if cashflow < 0:
        runway = savings / abs(cashflow)
    else:
        runway = float('inf')

    if runway < 3:
        score += 15
    elif runway < 6:
        score += 8

    annual_interest = debt * (rate / 100)
    annual_income = income * 12
    interest_pressure = annual_interest / annual_income if annual_income > 0 else 1.0
    if interest_pressure > 0.1:
        score += 10

    return min(100, score)


def simulate_path(
    profile: dict,
    adjustments: dict,
    months: int,
    is_baseline: bool = False,
) -> list[dict]:
    """
    Month-by-month financial simulation.
    Tracks existing debt and new loan separately for correct per-rate interest.
    Produces results within $1 of the TypeScript engine for identical inputs.
    """
    existing_debt = float(profile["totalDebt"])
    new_loan_debt = 0.0
    savings = float(profile["savings"])
    min_payment = float(profile["minimumPayment"])
    total_paid_acc = 0.0

    # Rate for existing debt (may be overridden by refinance)
    refinance_rate = adjustments.get("refinanceRate")
    if not is_baseline and refinance_rate is not None and refinance_rate > 0:
        existing_rate = float(refinance_rate)
    else:
        existing_rate = float(profile["interestRate"])

    # Rate for new loan (separate bucket, separate rate)
    new_loan_rate_val = adjustments.get("newLoanRate") or 0
    new_loan_rate = float(new_loan_rate_val) if not is_baseline and new_loan_rate_val > 0 else existing_rate

    income_change = 0.0 if is_baseline else float(adjustments.get("incomeChange") or 0)
    expense_change = 0.0 if is_baseline else float(adjustments.get("expenseChange") or 0)
    extra_payment = 0.0 if is_baseline else float(adjustments.get("extraPayment") or 0)

    adj_income = float(profile["income"]) + income_change
    adj_expenses = float(profile["expenses"]) + expense_change

    snapshots = []

    for month in range(1, months + 1):
        # Month 1 events
        if month == 1 and not is_baseline:
            shock = float(adjustments.get("oneTimeShock") or 0)
            if shock:
                savings -= shock
            loan_amount = float(adjustments.get("newLoanAmount") or 0)
            if loan_amount:
                new_loan_debt = loan_amount

        total_debt = existing_debt + new_loan_debt

        # Interest computed separately per bucket
        existing_interest = existing_debt * (existing_rate / 100.0 / 12.0) if existing_debt > 0 else 0.0
        new_interest = new_loan_debt * (new_loan_rate / 100.0 / 12.0) if new_loan_debt > 0 else 0.0
        monthly_interest = existing_interest + new_interest

        # Payment: min + extra, capped at total owed
        desired_payment = min_payment + extra_payment
        total_payment = min(total_debt + monthly_interest, desired_payment) if total_debt > 0 else 0.0

        # Allocate payments proportionally by outstanding balance
        if total_debt > 0:
            ef = existing_debt / total_debt
            nf = new_loan_debt / total_debt
            existing_debt = max(0.0, existing_debt + existing_interest - total_payment * ef)
            new_loan_debt = max(0.0, new_loan_debt + new_interest - total_payment * nf)

        debt = existing_debt + new_loan_debt
        cashflow = adj_income - adj_expenses - total_payment
        savings += cashflow
        total_paid_acc += total_payment

        # Dynamic minimum payment recalculation (mirrors TypeScript exactly)
        min_payment = max(float(profile["minimumPayment"]), debt * 0.02) if debt > 0 else 0.0

        risk = compute_risk_score(adj_income, adj_expenses, savings, debt, existing_rate, min_payment)

        snapshots.append({
            "month": month,
            "debt": round(debt, 2),
            "savings": round(savings, 2),
            "cashflow": round(cashflow, 2),
            "riskScore": risk,
            "interestPaid": round(monthly_interest, 2),
            "netWorth": round(savings - debt, 2),
            "totalPaid": round(total_paid_acc, 2),
            "minimumPayment": round(min_payment, 2),
        })

    return snapshots


def compute_decision_score(baseline: list[dict], scenario: list[dict]) -> float:
    """
    Mirrors decision-score.ts computeDecisionScore() exactly.
    Weights: 35% debt, 30% savings, 25% risk, 10% payoff speed.
    """
    last_b = baseline[-1]
    last_s = scenario[-1]

    # Debt improvement (35%) — mirrors: debtDelta / max(baselineDebt, scenarioDebt, 1)
    baseline_debt = last_b["debt"]
    scenario_debt = last_s["debt"]
    debt_delta = baseline_debt - scenario_debt  # positive = scenario has less debt = good
    max_debt_swing = max(baseline_debt, scenario_debt, 1)
    debt_ratio = max(-1.0, min(1.0, debt_delta / max_debt_swing))
    debt_score = 50 + debt_ratio * 50

    # Savings improvement (30%) — mirrors: savingsDelta / max(abs(baseline), abs(scenario), 1)
    baseline_savings = last_b["savings"]
    scenario_savings = last_s["savings"]
    savings_delta = scenario_savings - baseline_savings  # positive = scenario has more = good
    max_savings_swing = max(abs(baseline_savings), abs(scenario_savings), 1)
    savings_ratio = max(-1.0, min(1.0, savings_delta / max_savings_swing))
    savings_score = 50 + savings_ratio * 50

    # Risk reduction (25%) — mirrors: riskDelta / 50, clamped
    avg_b_risk = sum(s["riskScore"] for s in baseline) / len(baseline)
    avg_s_risk = sum(s["riskScore"] for s in scenario) / len(scenario)
    risk_delta = avg_b_risk - avg_s_risk  # positive = scenario has lower risk = good
    risk_ratio = max(-1.0, min(1.0, risk_delta / 50))
    risk_score = 50 + risk_ratio * 50

    # Payoff speed (10%) — mirrors: monthsSaved / (maxMonths * 0.5)
    b_payoff = next((i for i, s in enumerate(baseline) if s["debt"] <= 0), None)
    s_payoff = next((i for i, s in enumerate(scenario) if s["debt"] <= 0), None)
    max_months = len(baseline)
    if b_payoff is not None and s_payoff is not None:
        months_saved = b_payoff - s_payoff  # positive = scenario pays off sooner
        payoff_ratio = max(-1.0, min(1.0, months_saved / (max_months * 0.5)))
        speed_score = 50 + payoff_ratio * 50
    elif s_payoff is not None:
        speed_score = 95  # scenario pays off, baseline doesn't: big win
    elif b_payoff is not None:
        speed_score = 5   # baseline pays off, scenario doesn't: big loss
    else:
        speed_score = 50  # neither pays off: neutral

    composite = (
        debt_score * 0.35 +
        savings_score * 0.30 +
        risk_score * 0.25 +
        speed_score * 0.10
    )
    return round(max(0, min(100, composite)))

"""
DebtGuard Monte Carlo Simulation Engine
Stochastic financial projection with income/expense volatility.
Returns P10–P90 percentile bands to quantify uncertainty in projections.
"""
from __future__ import annotations

import numpy as np
from simulator import simulate_path


def run_monte_carlo(
    profile: dict,
    scenario: dict,
    months: int,
    n_simulations: int = 1000,
    income_volatility: float = 0.08,
    expense_volatility: float = 0.05,
) -> dict:
    """
    Run N stochastic simulations with normally-distributed income/expense shocks.

    income_volatility: fractional std dev of monthly income (0.08 = ±8%)
    expense_volatility: fractional std dev of monthly expenses (0.05 = ±5%)

    Returns month-by-month percentile distributions for debt, savings, and cashflow,
    plus aggregate probability statistics.
    """
    rng = np.random.default_rng(seed=42)

    income_std = float(profile["income"]) * income_volatility
    expense_std = float(profile["expenses"]) * expense_volatility

    # Pre-generate all noise: [n_simulations × months]
    income_noise = rng.normal(0.0, income_std, size=(n_simulations, months))
    expense_noise = rng.normal(0.0, expense_std, size=(n_simulations, months))

    debt_matrix = np.zeros((n_simulations, months))
    savings_matrix = np.zeros((n_simulations, months))
    cashflow_matrix = np.zeros((n_simulations, months))

    for sim_idx in range(n_simulations):
        path = _simulate_stochastic(
            profile, scenario, months,
            income_noise[sim_idx], expense_noise[sim_idx],
        )
        for snap in path:
            m = snap["month"] - 1
            debt_matrix[sim_idx, m] = snap["debt"]
            savings_matrix[sim_idx, m] = snap["savings"]
            cashflow_matrix[sim_idx, m] = snap["cashflow"]

    pcts = [10, 25, 50, 75, 90]
    monthly_stats = []
    for m in range(months):
        monthly_stats.append({
            "month": m + 1,
            "debt": {f"p{p}": round(float(np.percentile(debt_matrix[:, m], p)), 0) for p in pcts},
            "savings": {f"p{p}": round(float(np.percentile(savings_matrix[:, m], p)), 0) for p in pcts},
            "cashflow": {f"p{p}": round(float(np.percentile(cashflow_matrix[:, m], p)), 0) for p in pcts},
        })

    final_debts = debt_matrix[:, -1]
    final_savings = savings_matrix[:, -1]

    prob_debt_free = float(np.mean(final_debts <= 0)) * 100
    prob_savings_depleted = float(np.mean(final_savings <= 0)) * 100
    prob_savings_improved = float(np.mean(final_savings > float(profile["savings"]))) * 100

    # Distribution of payoff months
    payoff_months = []
    for sim_idx in range(n_simulations):
        for m in range(months):
            if debt_matrix[sim_idx, m] <= 0:
                payoff_months.append(m + 1)
                break

    median_payoff = float(np.median(payoff_months)) if payoff_months else None

    return {
        "monthlyStats": monthly_stats,
        "summary": {
            "probDebtFreeByEnd": round(prob_debt_free, 1),
            "probSavingsDepleted": round(prob_savings_depleted, 1),
            "probSavingsImproved": round(prob_savings_improved, 1),
            "medianFinalDebt": round(float(np.percentile(final_debts, 50)), 0),
            "medianFinalSavings": round(float(np.percentile(final_savings, 50)), 0),
            "p10FinalDebt": round(float(np.percentile(final_debts, 10)), 0),
            "p90FinalDebt": round(float(np.percentile(final_debts, 90)), 0),
            "p10FinalSavings": round(float(np.percentile(final_savings, 10)), 0),
            "p90FinalSavings": round(float(np.percentile(final_savings, 90)), 0),
            "medianPayoffMonth": round(median_payoff, 0) if median_payoff else None,
        },
        "inputs": {
            "nSimulations": n_simulations,
            "months": months,
            "incomeVolatility": income_volatility,
            "expenseVolatility": expense_volatility,
        },
    }


def _simulate_stochastic(
    profile: dict,
    scenario: dict,
    months: int,
    income_noise: np.ndarray,
    expense_noise: np.ndarray,
) -> list[dict]:
    """Single stochastic simulation run with pre-generated per-month noise."""
    existing_debt = float(profile["totalDebt"])
    new_loan_debt = 0.0
    savings = float(profile["savings"])
    min_payment = float(profile["minimumPayment"])

    refinance_rate = scenario.get("refinanceRate")
    existing_rate = float(refinance_rate) if refinance_rate and refinance_rate > 0 else float(profile["interestRate"])
    new_loan_rate_val = scenario.get("newLoanRate") or 0
    new_loan_rate = float(new_loan_rate_val) if new_loan_rate_val > 0 else existing_rate

    base_income = float(profile["income"]) + float(scenario.get("incomeChange") or 0)
    base_expenses = float(profile["expenses"]) + float(scenario.get("expenseChange") or 0)
    extra_payment = float(scenario.get("extraPayment") or 0)

    snapshots = []
    for i in range(months):
        month = i + 1

        if month == 1:
            shock = float(scenario.get("oneTimeShock") or 0)
            if shock:
                savings -= shock
            loan_amount = float(scenario.get("newLoanAmount") or 0)
            if loan_amount:
                new_loan_debt = loan_amount

        # Stochastic noise (clamp to non-negative)
        adj_income = max(0.0, base_income + float(income_noise[i]))
        adj_expenses = max(0.0, base_expenses + float(expense_noise[i]))

        total_debt = existing_debt + new_loan_debt
        existing_interest = existing_debt * (existing_rate / 100.0 / 12.0) if existing_debt > 0 else 0.0
        new_interest = new_loan_debt * (new_loan_rate / 100.0 / 12.0) if new_loan_debt > 0 else 0.0
        monthly_interest = existing_interest + new_interest

        desired = min_payment + extra_payment
        total_payment = min(total_debt + monthly_interest, desired) if total_debt > 0 else 0.0

        if total_debt > 0:
            ef = existing_debt / total_debt
            nf = new_loan_debt / total_debt
            existing_debt = max(0.0, existing_debt + existing_interest - total_payment * ef)
            new_loan_debt = max(0.0, new_loan_debt + new_interest - total_payment * nf)

        debt = existing_debt + new_loan_debt
        cashflow = adj_income - adj_expenses - total_payment
        savings += cashflow
        min_payment = max(float(profile["minimumPayment"]), debt * 0.02) if debt > 0 else 0.0

        snapshots.append({
            "month": month,
            "debt": debt,
            "savings": savings,
            "cashflow": cashflow,
        })

    return snapshots

"""
DebtGuard Financial Optimizer
scipy-powered optimization — replaces TypeScript binary search with Brent's method
and adds multi-objective Pareto frontier analysis (Replicate 3 preview).
"""
from __future__ import annotations

import math
from typing import Optional

import numpy as np
from scipy.optimize import brentq, minimize

from simulator import simulate_path, compute_decision_score


def _payoff_month(path: list[dict]) -> Optional[int]:
    for s in path:
        if s["debt"] <= 0:
            return s["month"]
    return None


def _avg_risk(path: list[dict]) -> float:
    return sum(s["riskScore"] for s in path) / len(path)


# ─── Goal: Debt-Free By ───────────────────────────────────────────────────────

def optimize_debt_payoff(profile: dict, by_month: int) -> dict:
    """
    Find minimum extra monthly payment to achieve debt payoff by target month.
    Uses scipy.optimize.brentq (Brent's method) — converges in ~10 iterations,
    vs 50 binary search iterations, with guaranteed convergence on bracketed root.
    """
    baseline = simulate_path(profile, {}, by_month, True)
    baseline_payoff = _payoff_month(baseline)

    if baseline_payoff is not None and baseline_payoff <= by_month:
        return {
            "achievable": True,
            "requiredExtraPayment": 0,
            "payoffMonth": baseline_payoff,
            "savingsGoNegative": False,
            "convergedIn": 0,
            "method": "baseline_achieves_goal",
        }

    def objective(x: float) -> float:
        path = simulate_path(profile, {"extraPayment": x}, by_month, False)
        return path[-1]["debt"]

    # Check feasibility: can we pay it off at all?
    max_extra = profile["totalDebt"]  # Paying entire debt in month 1
    if objective(max_extra) > 0:
        return {
            "achievable": False,
            "requiredExtraPayment": None,
            "payoffMonth": None,
            "savingsGoNegative": False,
            "convergedIn": 0,
            "method": "not_achievable_within_horizon",
        }

    # brentq finds root of objective(x) = 0 on [0, max_extra]
    result, r = brentq(objective, 0, max_extra, xtol=0.50, full_output=True)
    extra = math.ceil(max(0.0, result))

    path = simulate_path(profile, {"extraPayment": extra}, by_month, False)
    payoff_month = _payoff_month(path)
    achievable = payoff_month is not None and payoff_month <= by_month
    savings_negative = any(s["savings"] < 0 for s in path)

    return {
        "achievable": achievable,
        "requiredExtraPayment": extra,
        "payoffMonth": payoff_month,
        "savingsGoNegative": savings_negative,
        "convergedIn": r.iterations,
        "method": "brentq",
    }


# ─── Goal: Savings Target ────────────────────────────────────────────────────

def optimize_savings_target(profile: dict, target_savings: float, by_month: int) -> dict:
    """Find minimum (expenseCut, incomeBoost) to reach savings target."""

    baseline = simulate_path(profile, {}, by_month, True)
    if baseline[-1]["savings"] >= target_savings:
        return {
            "achievable": True,
            "requiredExpenseCut": 0,
            "requiredIncomeBoost": 0,
            "projectedSavings": round(baseline[-1]["savings"], 0),
            "method": "baseline_achieves_goal",
        }

    def objective(x: np.ndarray) -> float:
        expense_cut = float(x[0])
        income_boost = float(x[1])
        if expense_cut < 0 or income_boost < 0:
            return 1e9
        path = simulate_path(
            profile,
            {"expenseChange": -expense_cut, "incomeChange": income_boost},
            by_month,
            False,
        )
        final_savings = path[-1]["savings"]
        if final_savings >= target_savings:
            return expense_cut + income_boost
        return 1e6 + (target_savings - final_savings)

    result = minimize(
        objective,
        x0=np.array([100.0, 100.0]),
        method="Nelder-Mead",
        options={"xatol": 0.5, "fatol": 0.5, "maxiter": 800},
    )

    expense_cut = max(0.0, float(result.x[0]))
    income_boost = max(0.0, float(result.x[1]))
    path = simulate_path(
        profile,
        {"expenseChange": -expense_cut, "incomeChange": income_boost},
        by_month,
        False,
    )
    achievable = path[-1]["savings"] >= target_savings

    return {
        "achievable": achievable,
        "requiredExpenseCut": round(expense_cut, 0),
        "requiredIncomeBoost": round(income_boost, 0),
        "projectedSavings": round(path[-1]["savings"], 0),
        "method": "nelder_mead",
    }


# ─── Goal: Risk Score Target ─────────────────────────────────────────────────

def optimize_risk_target(profile: dict, target_score: float, by_month: int) -> dict:
    """Find minimum combined adjustments to bring risk score below target."""

    baseline = simulate_path(profile, {}, by_month, True)
    if baseline[-1]["riskScore"] <= target_score:
        return {
            "achievable": True,
            "requiredExtraPayment": 0,
            "requiredExpenseCut": 0,
            "requiredIncomeBoost": 0,
            "projectedRiskScore": baseline[-1]["riskScore"],
            "method": "baseline_achieves_goal",
        }

    def objective(x: np.ndarray) -> float:
        extra, expense_cut, income_boost = float(x[0]), float(x[1]), float(x[2])
        if any(v < 0 for v in [extra, expense_cut, income_boost]):
            return 1e9
        path = simulate_path(
            profile,
            {"extraPayment": extra, "expenseChange": -expense_cut, "incomeChange": income_boost},
            by_month,
            False,
        )
        final_risk = path[-1]["riskScore"]
        if final_risk <= target_score:
            return extra + expense_cut + income_boost
        return 1e6 + (final_risk - target_score) * 100

    result = minimize(
        objective,
        x0=np.array([100.0, 50.0, 50.0]),
        method="Nelder-Mead",
        options={"xatol": 0.5, "fatol": 0.5, "maxiter": 1000},
    )

    extra = max(0.0, float(result.x[0]))
    expense_cut = max(0.0, float(result.x[1]))
    income_boost = max(0.0, float(result.x[2]))
    path = simulate_path(
        profile,
        {"extraPayment": extra, "expenseChange": -expense_cut, "incomeChange": income_boost},
        by_month,
        False,
    )
    achievable = path[-1]["riskScore"] <= target_score

    return {
        "achievable": achievable,
        "requiredExtraPayment": round(extra, 0),
        "requiredExpenseCut": round(expense_cut, 0),
        "requiredIncomeBoost": round(income_boost, 0),
        "projectedRiskScore": path[-1]["riskScore"],
        "method": "nelder_mead",
    }


# ─── Pareto Frontier (Replicate 3 Preview) ───────────────────────────────────

def compute_pareto_frontier(profile: dict, horizon: int) -> dict:
    """
    Grid-search the (extraPayment, expenseCut) space and return Pareto-optimal
    strategies that no other evaluated strategy dominates on all three objectives:
    minimize final debt, maximize final savings, minimize average risk score.

    This is the Replicate 3 foundation — automated strategy discovery.
    """
    baseline = simulate_path(profile, {}, horizon, True)
    baseline_final = baseline[-1]

    max_extra = min(profile["income"] * 0.40, 2000.0)
    max_cut = profile["expenses"] * 0.25

    extra_range = np.linspace(0, max_extra, 20)
    cut_range = np.linspace(0, max_cut, 12)

    solutions = []
    for extra in extra_range:
        for cut in cut_range:
            adj = {"extraPayment": float(extra), "expenseChange": -float(cut)}
            path = simulate_path(profile, adj, horizon, False)
            final = path[-1]
            pm = _payoff_month(path)
            dm = next((s["month"] for s in path if s["savings"] <= 0), None)
            score = compute_decision_score(baseline, path)

            solutions.append({
                "extraPayment": round(float(extra), 0),
                "expenseCut": round(float(cut), 0),
                "monthlyCost": round(float(extra) + float(cut), 0),
                "finalDebt": round(final["debt"], 0),
                "finalSavings": round(final["savings"], 0),
                "finalNetWorth": round(final["netWorth"], 0),
                "avgRiskScore": round(_avg_risk(path), 1),
                "payoffMonth": pm,
                "savingsDepletionMonth": dm,
                "netWorthGain": round(final["netWorth"] - baseline_final["netWorth"], 0),
                "decisionScore": score,
            })

    # Pareto dominance: a solution is dominated if another is better in ALL objectives
    pareto = []
    for sol in solutions:
        dominated = False
        for other in solutions:
            if other is sol:
                continue
            if (
                other["finalDebt"] <= sol["finalDebt"]
                and other["finalSavings"] >= sol["finalSavings"]
                and other["avgRiskScore"] <= sol["avgRiskScore"]
                and (
                    other["finalDebt"] < sol["finalDebt"]
                    or other["finalSavings"] > sol["finalSavings"]
                    or other["avgRiskScore"] < sol["avgRiskScore"]
                )
            ):
                dominated = True
                break
        if not dominated:
            pareto.append(sol)

    pareto.sort(key=lambda x: x["decisionScore"], reverse=True)

    return {
        "paretoFrontier": pareto[:10],
        "totalEvaluated": len(solutions),
        "baseline": {
            "finalDebt": round(baseline_final["debt"], 0),
            "finalSavings": round(baseline_final["savings"], 0),
            "finalNetWorth": round(baseline_final["netWorth"], 0),
            "avgRiskScore": round(_avg_risk(baseline), 1),
        },
    }


# ─── Scenario Ranker ─────────────────────────────────────────────────────────

def rank_scenarios(profile: dict, scenarios: list[dict], horizon: int) -> dict:
    """
    Simulate each scenario and rank by composite decision score.
    Used by the UI to surface the best preset for a given profile.
    """
    baseline = simulate_path(profile, {}, horizon, True)
    baseline_final = baseline[-1]

    ranked = []
    for sc in scenarios:
        path = simulate_path(profile, sc, horizon, False)
        final = path[-1]
        pm = _payoff_month(path)
        score = compute_decision_score(baseline, path)

        ranked.append({
            "label": sc.get("label", "Unnamed"),
            "decisionScore": score,
            "finalDebt": round(final["debt"], 0),
            "finalSavings": round(final["savings"], 0),
            "finalNetWorth": round(final["netWorth"], 0),
            "avgRiskScore": round(_avg_risk(path), 1),
            "payoffMonth": pm,
            "debtDelta": round(final["debt"] - baseline_final["debt"], 0),
            "savingsDelta": round(final["savings"] - baseline_final["savings"], 0),
        })

    ranked.sort(key=lambda x: x["decisionScore"], reverse=True)
    for i, sc in enumerate(ranked):
        sc["rank"] = i + 1

    return {
        "ranked": ranked,
        "bestLabel": ranked[0]["label"] if ranked else None,
        "worstLabel": ranked[-1]["label"] if ranked else None,
    }

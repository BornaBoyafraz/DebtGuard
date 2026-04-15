"""
DebtGuard Python AI Engine
FastAPI service for advanced financial optimization and Monte Carlo simulation.

Endpoints:
  GET  /health                    — liveness check
  POST /simulate                  — single path simulation (mirrors TypeScript)
  POST /optimize/debt-payoff      — scipy Brent's method goal solver
  POST /optimize/savings-target   — Nelder-Mead multi-variable optimizer
  POST /optimize/risk-target      — Nelder-Mead multi-variable optimizer
  POST /optimize/pareto           — Pareto frontier (Replicate 3 preview)
  POST /rank-scenarios            — rank preset scenarios by decision score
  POST /simulate/monte-carlo      — stochastic Monte Carlo projection

Start with: uvicorn app:app --reload --port 8000
"""
from __future__ import annotations

from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from simulator import simulate_path
from optimizer import (
    optimize_debt_payoff,
    optimize_savings_target,
    optimize_risk_target,
    compute_pareto_frontier,
    rank_scenarios,
)
from monte_carlo import run_monte_carlo

app = FastAPI(
    title="DebtGuard AI Engine",
    description="Optimization and stochastic simulation for DebtGuard financial intelligence.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Shared Pydantic Models ───────────────────────────────────────────────────

class FinancialProfile(BaseModel):
    income: float = Field(..., gt=0)
    expenses: float = Field(..., ge=0)
    savings: float
    totalDebt: float = Field(..., ge=0)
    interestRate: float = Field(..., ge=0)
    minimumPayment: float = Field(..., ge=0)


class ScenarioAdjustments(BaseModel):
    extraPayment: float = 0.0
    expenseChange: float = 0.0
    incomeChange: float = 0.0
    oneTimeShock: float = 0.0
    newLoanAmount: float = 0.0
    newLoanRate: float = 0.0
    refinanceRate: Optional[float] = None
    label: Optional[str] = None


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "engine": "DebtGuard Python AI"}


# ─── Simulation ───────────────────────────────────────────────────────────────

@app.post("/simulate")
async def simulate(
    profile: FinancialProfile,
    adjustments: ScenarioAdjustments,
    months: int = Query(default=24, ge=1, le=120),
    is_baseline: bool = False,
):
    """Run a single simulation path. Mirrors TypeScript simulatePath() exactly."""
    try:
        path = simulate_path(profile.model_dump(), adjustments.model_dump(), months, is_baseline)
        return {"path": path, "months": months}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Optimization ─────────────────────────────────────────────────────────────

@app.post("/optimize/debt-payoff")
async def optimize_debt(
    profile: FinancialProfile,
    by_month: int = Query(default=24, ge=1, le=120),
):
    """Find minimum extra payment to become debt-free by target month (Brent's method)."""
    try:
        return optimize_debt_payoff(profile.model_dump(), by_month)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize/savings-target")
async def optimize_savings(
    profile: FinancialProfile,
    target_savings: float = Query(..., description="Target savings balance"),
    by_month: int = Query(default=24, ge=1, le=120),
):
    """Find minimum adjustments to reach a savings target (Nelder-Mead)."""
    try:
        return optimize_savings_target(profile.model_dump(), target_savings, by_month)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize/risk-target")
async def optimize_risk(
    profile: FinancialProfile,
    target_score: float = Query(..., ge=0, le=100),
    by_month: int = Query(default=24, ge=1, le=120),
):
    """Find minimum adjustments to reach a risk score target (Nelder-Mead)."""
    try:
        return optimize_risk_target(profile.model_dump(), target_score, by_month)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize/pareto")
async def pareto(
    profile: FinancialProfile,
    horizon_months: int = Query(default=24, ge=1, le=120),
):
    """
    Compute Pareto-optimal strategy frontier over (extraPayment, expenseCut) space.
    Returns up to 10 non-dominated strategies ranked by decision score.
    This is the Replicate 3 core feature — automated strategy discovery.
    """
    try:
        return compute_pareto_frontier(profile.model_dump(), horizon_months)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Scenario Ranking ─────────────────────────────────────────────────────────

class RankScenariosRequest(BaseModel):
    profile: FinancialProfile
    scenarios: list[ScenarioAdjustments]
    horizonMonths: int = Field(default=24, ge=1, le=120)


@app.post("/rank-scenarios")
async def rank(req: RankScenariosRequest):
    """
    Simulate each scenario and rank by composite decision score.
    Useful for surfacing the best preset scenario for a given profile.
    """
    try:
        scenario_dicts = [s.model_dump() for s in req.scenarios]
        return rank_scenarios(req.profile.model_dump(), scenario_dicts, req.horizonMonths)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Monte Carlo ──────────────────────────────────────────────────────────────

@app.post("/simulate/monte-carlo")
async def monte_carlo(
    profile: FinancialProfile,
    adjustments: ScenarioAdjustments,
    months: int = Query(default=24, ge=1, le=120),
    n_simulations: int = Query(default=1000, ge=100, le=5000),
    income_volatility: float = Query(default=0.08, ge=0.0, le=0.5),
    expense_volatility: float = Query(default=0.05, ge=0.0, le=0.5),
):
    """
    Monte Carlo simulation with stochastic income/expense variability.
    Returns P10/P25/P50/P75/P90 percentile bands per month for debt and savings,
    plus probability statistics for debt payoff and savings depletion.
    """
    try:
        return run_monte_carlo(
            profile.model_dump(),
            adjustments.model_dump(),
            months,
            n_simulations=n_simulations,
            income_volatility=income_volatility,
            expense_volatility=expense_volatility,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from typing import List, Dict, Any
from pydantic import BaseModel

class InvestmentProfile(BaseModel):
    investment_amount: float
    time_horizon_years: float
    sectors: List[str]
    risk_profile: str

class UserPromptRequest(BaseModel):
    prompt: str

class InvestmentRecommendationResponse(BaseModel):
    profile: InvestmentProfile
    optimized_portfolio: List[Dict[str, Any]]
    unallocated_cash: float
    portfolio_beta: float
    expected_portfolio_return: float
    backtest_trajectory: List[Dict[str, Any]]  # New: Monthly growth milestones
    report: str
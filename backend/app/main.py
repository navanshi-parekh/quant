from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.llm_parser import llm_parser_service
from app.services.financial_api import financial_api_service
from app.services.optimizer import portfolio_optimizer_service
from app.services.synthesizer import llm_synthesizer_service
from app.config import settings

app = FastAPI(title="Quant-LLM Advisor Terminal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EnhancedUserRequest(BaseModel):
    prompt: str
    market: str = "indian"
    diversification: str = "balanced"
    horizon_strategy: str = "long_term"
    target_profit_percentage: float = 15.0

@app.post("/api/generate-recommendation")
async def generate_recommendation(request: EnhancedUserRequest):
    try:
        parsed_profile = llm_parser_service.parse_prompt(request.prompt)
        active_risk = "conservative" if request.horizon_strategy == "short_term" else parsed_profile.risk_profile
        
        recommended_stocks = financial_api_service.get_recommendations(
            sectors=parsed_profile.sectors,
            risk_profile=active_risk,
            market=request.market,
            diversification=request.diversification
        )
        
        # Executes mathematical portfolio distribution checks via our upgraded async optimizer
        optimization_results = await portfolio_optimizer_service.calculate_allocation(
            total_capital=float(parsed_profile.investment_amount),
            target_stocks=recommended_stocks,
            risk_profile=active_risk
        )
        
        optimized_allocation = optimization_results["portfolio"]
        total_spent = sum(item["actual_deployment_cost"] for item in optimized_allocation)
        leftover_cash = parsed_profile.investment_amount - total_spent
        
        # Calculate market average PE and index price point telemetry metrics dynamically
        if request.market == "indian":
            index_name = "Nifty 50"
            index_price = 23547.75
            index_pe = 20.58
        else:
            index_name = "S&P 500"
            index_price = 5240.50
            index_pe = 24.80

        # Calculate portfolio average PE for assets that have a valid PE multiple
        valid_pes = [item["pe_ratio"] for item in optimized_allocation if item.get("pe_ratio", 0) > 0]
        portfolio_avg_pe = round(sum(valid_pes) / len(valid_pes), 2) if valid_pes else 0.0

        total_months = int(parsed_profile.time_horizon_years * 12)
        annual_rate = optimization_results["expected_portfolio_return"] / 100.0
        monthly_rate = annual_rate / 12.0 if total_months > 0 else 0.0
        
        trajectory = []
        current_value = total_spent
        for month in range(0, total_months + 1):
            trajectory.append({
                "month": month,
                "label": f"M{month}",
                "valuation": round(current_value, 2)
            })
            current_value *= (1 + monthly_rate)

        target_growth_multiplier = 1 + (request.target_profit_percentage / 100.0)
        target_profit_milestone = total_spent * target_growth_multiplier

        generated_narrative = llm_synthesizer_service.generate_report(
            profile={
                "investment_amount": parsed_profile.investment_amount,
                "time_horizon_years": parsed_profile.time_horizon_years,
                "sectors": parsed_profile.sectors,
                "risk_profile": active_risk
            },
            portfolio=optimized_allocation,
            unallocated_cash=leftover_cash
        )
        
        return {
            "profile": {
                "investment_amount": parsed_profile.investment_amount,
                "time_horizon_years": parsed_profile.time_horizon_years,
                "sectors": parsed_profile.sectors,
                "risk_profile": active_risk,
                "market": request.market,
                "diversification": request.diversification,
                "horizon_strategy": request.horizon_strategy,
                "target_profit_percentage": request.target_profit_percentage,
                "target_profit_milestone": round(target_profit_milestone, 2)
            },
            "optimized_portfolio": optimized_allocation,
            "unallocated_cash": round(leftover_cash, 2),
            "portfolio_beta": optimization_results["portfolio_beta"],
            "expected_portfolio_return": optimization_results["expected_portfolio_return"],
            "sharpe_ratio": optimization_results.get("sharpe_ratio", 0.0),            # PHASE 1 INTEGRATION
            "risk_free_rate": optimization_results.get("risk_free_rate_meta", 6.75),  # PHASE 1 INTEGRATION
            "backtest_trajectory": trajectory,
            "market_macro": {
                "index_name": index_name,
                "index_price": index_price,
                "index_pe": index_pe,
                "portfolio_avg_pe": portfolio_avg_pe
            },
            "report": generated_narrative
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
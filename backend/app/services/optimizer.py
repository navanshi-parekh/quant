from typing import List, Dict, Any

class PortfolioOptimizerService:
    def calculate_allocation(self, total_capital: float, target_stocks: List[Dict[str, Any]], risk_profile: str) -> Dict[str, Any]:
        """
        Advanced Multi-Asset Optimizer that builds capital weights dynamically
        by cross-referencing systematic asset risk (Beta) with strategic investor profiles.
        """
        if not target_stocks:
            return {"portfolio": [], "portfolio_beta": 0.0, "expected_portfolio_return": 0.0}

        raw_weights = []
        for stock in target_stocks:
            beta = stock.get("beta", 1.0)
            sector = stock.get("sector", "").lower()
            
            # --- Strategic Weight Adjustments ---
            if risk_profile == "conservative":
                # Favor lower-volatility assets heavily
                weight_factor = 1.0 / max(beta, 0.05)
            elif risk_profile == "aggressive":
                # High conviction on higher volatility amplification
                weight_factor = max(beta, 0.5)
            else:
                # Moderate/Balanced default benchmark baseline
                weight_factor = 1.0
                
            # If it's a defensive commodity, boost its baseline safety weight for conservative runs
            if sector == "commodities" and risk_profile == "conservative":
                weight_factor *= 1.5

            raw_weights.append(weight_factor)
            
        total_weight_score = sum(raw_weights)
        
        # Normalize weights to make sure they sum up to exactly 100%
        normalized_weights = [w / total_weight_score for w in raw_weights] if total_weight_score > 0 else [1.0 / len(target_stocks)] * len(target_stocks)

        allocated_portfolio = []
        portfolio_beta = 0.0
        portfolio_expected_return = 0.0

        for i, stock in enumerate(target_stocks):
            weight = normalized_weights[i]
            allocated_funds = total_capital * weight
            share_price = stock["price"]
            
            # Calculate executable whole units 
            suggested_shares = int(allocated_funds // share_price) if share_price > 0 else 0
            actual_spent = suggested_shares * share_price if suggested_shares > 0 else 0.0

            # Accumulate weighted mathematical indicators
            portfolio_beta += weight * stock.get("beta", 1.0)
            portfolio_expected_return += weight * stock.get("expected_return", 0.0)

            allocated_portfolio.append({
                "symbol": stock["symbol"],
                "name": stock["name"],
                "sector": stock["sector"],
                "current_price": share_price,
                "pe_ratio": stock.get("pe_ratio", 0.0),
                "beta": stock.get("beta", 1.0),
                "dividend_yield": stock.get("dividend_yield", 0.0),
                "allocation_percentage": round(weight * 100, 2),
                "suggested_capital_allocation": round(allocated_funds, 2),
                "suggested_shares_to_buy": suggested_shares,
                "actual_deployment_cost": round(actual_spent, 2)
            })

        return {
            "portfolio": allocated_portfolio,
            "portfolio_beta": round(portfolio_beta, 2),
            "expected_portfolio_return": round(portfolio_expected_return * 100, 2)
        }

portfolio_optimizer_service = PortfolioOptimizerService()
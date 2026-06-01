from typing import List, Dict, Any

class FinancialApiService:
    def __init__(self):
        # Indian Market Asset Desk (Equities + Commodity ETFs)
        # Premium/Growth alerts trigger if PE > 25.0 for Indian indices
        self.indian_market_database = {
            "TCS.NS": {"name": "Tata Consultancy Services", "price": 4150.0, "sector": "IT", "pe": 28.5, "beta": 0.75, "expected_return": 0.14, "dividend_yield": 1.25},
            "INFY.NS": {"name": "Infosys Limited", "price": 1620.0, "sector": "IT", "pe": 24.1, "beta": 0.88, "expected_return": 0.13, "dividend_yield": 2.10},
            "TATAMOTORS.NS": {"name": "Tata Motors Limited", "price": 980.0, "sector": "Automobile", "pe": 18.2, "beta": 1.25, "expected_return": 0.18, "dividend_yield": 0.60},
            "RELIANCE.NS": {"name": "Reliance Industries Ltd", "price": 1340.0, "sector": "Energy", "pe": 26.8, "beta": 0.85, "expected_return": 0.14, "dividend_yield": 0.70},
            "HDFCBANK.NS": {"name": "HDFC Bank Limited", "price": 1580.0, "sector": "Finance", "pe": 19.1, "beta": 0.90, "expected_return": 0.13, "dividend_yield": 1.10},
            
            # Commodities (PE boundaries are inherently 0)
            "GOLDBEES.NS": {"name": "Nippon India ETF Gold BeES", "price": 65.0, "sector": "Commodities", "pe": 0.0, "beta": 0.12, "expected_return": 0.09, "dividend_yield": 0.0},
            "SILVERBEES.NS": {"name": "Nippon India ETF Silver BeES", "price": 82.0, "sector": "Commodities", "pe": 0.0, "beta": 0.25, "expected_return": 0.11, "dividend_yield": 0.0},
        }

        # American Market Asset Desk (Equities + Commodity Proxies)
        # Premium alerts trigger if PE > 30.0 for US indices
        self.american_market_database = {
            "AAPL": {"name": "Apple Inc.", "price": 180.0, "sector": "Technology", "pe": 29.2, "beta": 1.12, "expected_return": 0.12, "dividend_yield": 0.55},
            "MSFT": {"name": "Microsoft Corp.", "price": 420.0, "sector": "Technology", "pe": 35.4, "beta": 0.89, "expected_return": 0.14, "dividend_yield": 0.72},
            "TSLA": {"name": "Tesla Inc.", "price": 175.0, "sector": "Automobile", "pe": 44.8, "beta": 1.42, "expected_return": 0.16, "dividend_yield": 0.00},
            "XOM": {"name": "Exxon Mobil Corp.", "price": 115.0, "sector": "Energy", "pe": 12.4, "beta": 0.78, "expected_return": 0.09, "dividend_yield": 3.30},
            "JPM": {"name": "JPMorgan Chase & Co.", "price": 195.0, "sector": "Finance", "pe": 11.8, "beta": 1.08, "expected_return": 0.11, "dividend_yield": 2.30},
            
            "GLD": {"name": "SPDR Gold Shares", "price": 220.0, "sector": "Commodities", "pe": 0.0, "beta": 0.08, "expected_return": 0.08, "dividend_yield": 0.0},
            "SLV": {"name": "iShares Silver Trust", "price": 28.0, "sector": "Commodities", "pe": 0.0, "beta": 0.18, "expected_return": 0.10, "dividend_yield": 0.0},
        }

    def get_recommendations(self, sectors: List[str], risk_profile: str, market: str = "indian", diversification: str = "balanced") -> List[Dict[str, Any]]:
        matched_stocks = []
        db = self.american_market_database if market.lower() == "american" else self.indian_market_database
        target_sectors = [s.lower() for s in sectors] if sectors else []

        if diversification == "diversified":
            target_sectors.append("commodities")

        if not target_sectors:
            target_sectors = ["technology", "it", "automobile", "energy", "finance", "commodities"]

        for ticker, data in db.items():
            is_sector_match = (
                data["sector"].lower() in target_sectors or 
                ("it" in target_sectors and data["sector"].lower() == "technology") or
                ("technology" in target_sectors and data["sector"].lower() == "it")
            )
            
            if is_sector_match:
                is_valid = False
                if risk_profile == "conservative" and data["beta"] <= 0.95:
                    is_valid = True
                elif risk_profile == "moderate" and 0.80 <= data["beta"] <= 1.20:
                    is_valid = True
                elif risk_profile == "aggressive" and data["beta"] >= 0.70:
                    is_valid = True

                if is_valid or not sectors:
                    matched_stocks.append({
                        "symbol": ticker,
                        "name": data["name"],
                        "price": data["price"],
                        "sector": data["sector"],
                        "pe_ratio": data["pe"],
                        "beta": data["beta"],
                        "expected_return": data["expected_return"],
                        "dividend_yield": data["dividend_yield"]
                    })

        slice_limit = 2 if diversification == "concentrated" else 5
        return matched_stocks[:slice_limit]

financial_api_service = FinancialApiService()
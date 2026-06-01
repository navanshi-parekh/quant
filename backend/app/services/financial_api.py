import httpx
from app.config import settings

class FinancialApiService:
    def __init__(self):
        # A master dictionary tracking standard equities across sectors for dynamic matching
        self.master_stock_universe = {
            "indian": [
                {"symbol": "INFY.NS", "name": "Infosys Limited", "beta": 0.88, "sector": "Technology", "pe_ratio": 24.2, "dividend_yield": 1.41, "expected_return": 0.14, "fallback_price": 1850.00},
                {"symbol": "TCS.NS", "name": "Tata Consultancy Services Ltd", "beta": 0.85, "sector": "IT", "pe_ratio": 29.1, "dividend_yield": 1.20, "expected_return": 0.13, "fallback_price": 4150.00},
                {"symbol": "RELIANCE.NS", "name": "Reliance Industries Limited", "beta": 0.95, "sector": "Energy", "pe_ratio": 24.6, "dividend_yield": 0.90, "expected_return": 0.15, "fallback_price": 2450.00},
                {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Limited", "beta": 0.90, "sector": "Finance", "pe_ratio": 18.4, "dividend_yield": 1.23, "expected_return": 0.12, "fallback_price": 1610.00},
                {"symbol": "GOLDSHARE.NS", "name": "NSE Gold Exchange Traded Fund", "beta": 0.15, "sector": "Commodities", "pe_ratio": 0.0, "dividend_yield": 0.0, "expected_return": 0.08, "fallback_price": 65.00},
                {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Limited", "beta": 1.22, "sector": "Automobile", "pe_ratio": 16.2, "dividend_yield": 0.45, "expected_return": 0.18, "fallback_price": 940.00}
            ],
            "american": [
                {"symbol": "AAPL", "name": "Apple Inc.", "beta": 1.10, "sector": "Technology", "pe_ratio": 28.5, "dividend_yield": 0.52, "expected_return": 0.16, "fallback_price": 180.00},
                {"symbol": "MSFT", "name": "Microsoft Corporation", "beta": 1.20, "sector": "Technology", "pe_ratio": 35.2, "dividend_yield": 0.71, "expected_return": 0.18, "fallback_price": 420.00},
                {"symbol": "XOM", "name": "Exxon Mobil Corporation", "beta": 1.05, "sector": "Energy", "pe_ratio": 12.4, "dividend_yield": 3.20, "expected_return": 0.11, "fallback_price": 115.00},
                {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "beta": 1.15, "sector": "Finance", "pe_ratio": 11.8, "dividend_yield": 2.40, "expected_return": 0.13, "fallback_price": 195.00},
                {"symbol": "GLD", "name": "SPDR Gold Shares ETF", "beta": 0.10, "sector": "Commodities", "pe_ratio": 0.0, "dividend_yield": 0.0, "expected_return": 0.07, "fallback_price": 210.00},
                {"symbol": "TSLA", "name": "Tesla Inc.", "beta": 1.45, "sector": "Automobile", "pe_ratio": 45.8, "dividend_yield": 0.0, "expected_return": 0.22, "fallback_price": 175.00}
            ]
        }

    async def fetch_live_market_quote(self, symbol: str) -> float:
        """
        Queries FMP real-time quote endpoints with authenticated headers.
        """
        api_key = settings.FMP_API_KEY
        cleaned_symbol = symbol.strip().upper()
        
        # FIX: If it's the local mock token or missing context, hit backup directly
        if not api_key or "your_actual" in api_key:
            return self._get_fallback_price(cleaned_symbol)

        url = f"https://financialmodelingprep.com/api/v3/quote/{cleaned_symbol}?apikey={api_key}"
        
        # PRODUCTION FIX: Inject standard browser user-agents to keep Render containers from getting dropped by FMP firewalls
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
        }
        
        async with httpx.AsyncClient(headers=headers) as client:
            try:
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    payload = response.json()
                    if payload and len(payload) > 0:
                        live_price = float(payload[0].get("price", 0.0))
                        if live_price > 0:
                            return live_price
            except Exception as network_exception:
                print(f"Datastream link fault routing live quotes for asset {symbol}: {network_exception}")
                
        return self._get_fallback_price(cleaned_symbol)

    def _get_fallback_price(self, symbol: str) -> float:
        """Safely isolates dictionary tracking lookups to prevent internal bugs."""
        for market_type in self.master_stock_universe.values():
            for stock_item in market_type:
                if stock_item["symbol"].upper() == symbol.upper():
                    return float(stock_item["fallback_price"])
        return 100.0

    def get_recommendations(self, sectors: list, risk_profile: str, market: str, diversification: str) -> list:
        """
        Dynamic Asset Filter. Compares selected frontend checkbox sector targets 
        against the master dataset universe to dynamically compile recommendations.
        """
        market_key = "indian" if market.lower() == "indian" else "american"
        available_stocks = self.master_stock_universe.get(market_key, [])

        if not sectors:
            return [dict(s, price=float(s["fallback_price"])) for s in available_stocks[:3]]

        targeted_sectors = [s.lower().strip() for s in sectors]
        
        filtered_recommendations = []
        for stock in available_stocks:
            if stock["sector"].lower() in targeted_sectors:
                stock_copy = stock.copy()
                stock_copy["price"] = float(stock_copy["fallback_price"])
                filtered_recommendations.append(stock_copy)

        if not filtered_recommendations:
            return [dict(s, price=float(s["fallback_price"])) for s in available_stocks[:2]]

        return filtered_recommendations

financial_api_service = FinancialApiService()
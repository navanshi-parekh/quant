import json
import httpx
import os
from openai import OpenAI
from app.config import settings
from app.schemas import InvestmentProfile


class LLMParserService:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
            http_client=httpx.Client(verify=True)
        )

    def parse_prompt(self, prompt: str) -> InvestmentProfile:
        response = self.client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Updated to the current stable Groq production model
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system", 
                    "content": (
                        "You are a precise financial data extraction engine. "
                        "Analyze the user's investment prompt and extract parameters accurately. "
                        "Convert time horizons given in months to years (e.g., 6 months = 0.5). "
                        "If no specific sectors are mentioned, default to an empty list.\n\n"
                        "You MUST respond with a raw JSON object matching this schema exactly:\n"
                        "{\n"
                        "  \"investment_amount\": float,\n"
                        "  \"time_horizon_years\": float,\n"
                        "  \"sectors\": list of strings,\n"
                        "  \"risk_profile\": \"conservative\" or \"moderate\" or \"aggressive\"\n"
                        "}"
                    )
                },
                {"role": "user", "content": prompt}
            ]
        )
        
        raw_json = json.loads(response.choices[0].message.content)
        return InvestmentProfile(**raw_json)

llm_parser_service = LLMParserService()
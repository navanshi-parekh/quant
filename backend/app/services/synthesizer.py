from typing import List, Dict, Any, Optional
import json
from openai import OpenAI
from app.config import settings

class LLMSynthesizerService:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=settings.GROQ_API_KEY
        )

    def generate_report(
        self, 
        profile: Dict[str, Any], 
        portfolio: List[Dict[str, Any]], 
        unallocated_cash: float,
        pdf_context: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Orchestrates an adversarial multi-agent analysis. If pdf_context is provided,
        it injects the corporate filing data to ground the agents' debate in hard document facts.
        """
        portfolio_summary_text = ""
        for asset in portfolio:
            portfolio_summary_text += (
                f"- {asset['name']} ({asset['symbol']}): Allocate {asset['allocation_percentage']}% "
                f"({asset['suggested_capital_allocation']}). Buy {asset['suggested_shares_to_buy']} shares "
                f"at {asset['current_price']} per share.\n"
            )

        user_context = (
            f"User Profile:\n"
            f"- Total Investment Amount: {profile.get('investment_amount')}\n"
            f"- Holding Period: {profile.get('time_horizon_years')} years\n"
            f"- Target Sectors: {', '.join(profile.get('sectors', []))}\n"
            f"- Risk Tolerance: {profile.get('risk_profile')}\n\n"
            f"Calculated Optimal Portfolio Allocation:\n"
            f"{portfolio_summary_text}"
            f"- Leftover Idle Cash: {unallocated_cash}\n"
        )

        # Build the dynamic core grounding rule based on whether extra PDF context exists
        document_grounding_clause = ""
        if pdf_context:
            document_grounding_clause = (
                "\nCRITICAL ADDENDUM: You are also being provided with verified text excerpts extracted directly "
                "from the company's latest corporate filing/earnings report PDF:\n"
                "-----------------------------------------\n"
                f"{pdf_context}\n"
                "-----------------------------------------\n"
                "You MUST reference specific financial data or operational notes from these excerpts to justify your arguments."
            )

        system_prompt = (
            "You are a sophisticated multi-agent quantitative evaluation framework. Your task is to analyze the user's portfolio and generate a JSON response containing two distinct adversarial market briefings.\n\n"
            "You MUST respond with a valid JSON object matching this schema exactly:\n"
            "{\n"
            "  \"bull_case\": \"Write detailed, high-conviction bullet points focusing on growth drivers, tailwinds, and compounding metrics.\",\n"
            "  \"bear_case\": \"Write detailed, defensive risk management briefing bullet points focusing on downside exposures, premiums, and volatility counter-arguments.\"\n"
            "}\n\n"
            f"Guidelines:{document_grounding_clause}"
        )

        try:
            response = self.client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_context}
                ],
                response_format={"type": "json_object"},
                temperature=0.7
            )
            
            parsed_json = json.loads(response.choices[0].message.content)
            return {
                "bull_case": parsed_json.get("bull_case", "Growth conviction briefing processing fault."),
                "bear_case": parsed_json.get("bear_case", "Risk mitigation briefing processing fault.")
            }
            
        except Exception as e:
            print(f"Adversarial multi-agent parsing error: {e}")
            return {
                "bull_case": f"Fallback Bull Case Strategy: Allocation matrix aligns with specified {profile.get('risk_profile')} parameters.",
                "bear_case": "Fallback Bear Case Strategy: Monitor macro sector adjustments and track trailing quarterly overvaluation multiples."
            }

llm_synthesizer_service = LLMSynthesizerService()
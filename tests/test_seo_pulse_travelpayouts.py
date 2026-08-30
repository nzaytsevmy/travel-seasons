import importlib.util
import unittest
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "seo_pulse", ROOT / ".github" / "scripts" / "seo_pulse.py"
)
SEO_PULSE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SEO_PULSE)


class TravelpayoutsWindowTest(unittest.TestCase):
    def test_processing_booking_is_not_lost_when_paid_revenue_is_zero(self):
        calls = []

        def fake_tpapi(body):
            calls.append(body)
            fields = body["fields"]
            if "open_actions_count" in fields:
                return None, "wrong field: open_actions_count"
            return {
                "results": [{
                    "campaign_name_ru": "Авиасейлс",
                    "redirects_count": 1,
                    "paid_actions_count": 0,
                    "paid_profit_rub_sum": "0.00",
                    "processing_actions_count": 1,
                    "processing_profit_rub_sum": "8084.64",
                }]
            }, None

        original = SEO_PULSE.tpapi
        SEO_PULSE.tpapi = fake_tpapi
        try:
            rows, error = SEO_PULSE._tp_window(
                date(2026, 8, 30), date(2026, 8, 31)
            )
        finally:
            SEO_PULSE.tpapi = original

        self.assertIsNone(error)
        self.assertEqual(rows["Авиасейлс"]["booked"], 1)
        self.assertEqual(rows["Авиасейлс"]["booked_rev"], 8084.64)
        self.assertIn("processing_actions_count", calls[0]["fields"])
        self.assertIn("processing_profit_rub_sum", calls[0]["fields"])
        self.assertNotIn("open_actions_count", calls[0]["fields"])

    def test_processing_revenue_leads_the_sub_id_slice(self):
        original_window = SEO_PULSE._tp_window
        original_tpapi = SEO_PULSE.tpapi
        SEO_PULSE._tp_window = lambda _start, _end: ({}, None)
        SEO_PULSE.tpapi = lambda _body: ({
            "results": [{
                "sub_id": "galapagos_2026",
                "redirects_count": 6,
                "paid_profit_rub_sum": "0.00",
                "processing_profit_rub_sum": "8084.64",
            }]
        }, None)
        try:
            result = SEO_PULSE.fetch_tp_stats()
        finally:
            SEO_PULSE._tp_window = original_window
            SEO_PULSE.tpapi = original_tpapi

        self.assertTrue(result["ok"])
        self.assertEqual(
            result["top_subs"][0],
            ("galapagos_2026", 6, 0.0, 8084.64),
        )


if __name__ == "__main__":
    unittest.main()

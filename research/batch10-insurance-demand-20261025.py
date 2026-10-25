from decimal import Decimal, ROUND_HALF_UP
import json
from datetime import datetime, timezone

rows = [("active_exact", 2, 3), ("ski_exact", 102, 116), ("ski_russia", 90, 177)]
print(json.dumps({"observed_at": datetime.now(timezone.utc).isoformat(), "calculation": "Wordcraft average clicks / average users; not site CTR", "results": [{"key": key, "numerator": n, "denominator": d, "percent": str((Decimal(n) / Decimal(d) * 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))} for key, n, d in rows]}, ensure_ascii=False, indent=2))

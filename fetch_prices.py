import os, json, time, requests

TOKEN = os.environ.get("TP_TOKEN")
if not TOKEN:
    raise RuntimeError("TP_TOKEN environment variable is not set")

# Все 39 направлений из калькулятора (синхронизировано с src/data/prices.js)
IATAS = [
    # Океания
    "SYD", "DRW",
    # Юго-Восточная Азия
    "DPS", "MES", "SOQ", "HKT", "CXR", "GOI", "CMB", "MLE",
    # Африка
    "NBO", "CPT", "HRG", "RAK",
    # Ближний Восток
    "DXB", "AYT",
    # Восточная Азия
    "TYO", "SEL",
    # Кавказ и Центральная Азия
    "TBS", "EVN", "OSS", "TAS", "DYU", "ALA",
    # Европа
    "ZRH", "MXP", "FCO", "BCN", "ATH", "SPU",
    # Северная Америка
    "YYC", "YUL",
    # Латинская Америка / Карибы
    "CUN", "HAV", "PUJ", "GUA", "SJO", "PUQ", "SCL",
]

OUTPUT = "public/prices.json"

try:
    with open(OUTPUT) as f:
        prices = json.load(f).get("prices", {})
except (FileNotFoundError, json.JSONDecodeError):
    prices = {}

for iata in IATAS:
    try:
        r = requests.get(
            f"https://api.travelpayouts.com/v1/prices/cheap?origin=MOW&destination={iata}&currency=usd&token={TOKEN}",
            headers={"User-Agent": "curl/8.7.1", "Accept": "*/*"},
            timeout=10,
        )
        d = r.json()
        if d.get("success") and d.get("data", {}).get(iata):
            vals = [v["price"] for v in d["data"][iata].values() if "price" in v]
            if vals:
                prices[iata] = min(vals)
    except Exception:
        pass
    time.sleep(0.3)

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, "w") as f:
    json.dump({"updated": time.strftime("%Y-%m-%d"), "prices": prices}, f, ensure_ascii=False)

print(f"Done: {len(prices)}/{len(IATAS)} prices fetched")

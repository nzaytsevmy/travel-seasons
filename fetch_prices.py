import os, json, time, requests

TOKEN = os.environ.get("TP_TOKEN", "b6085c316d4667a868718b755abcf5ec")
IATAS = ["SYD","DRW","DPS","MES","SOQ","NBO","CPT","DXB","TYO","SEL",
         "TBS","OSS","TAS","DYU","ALA","ZRH","MXP","YYC","YUL","CUN","GUA","SJO","PUQ","SCL"]

prices = {}
for iata in IATAS:
    try:
        r = requests.get(
            f"https://api.travelpayouts.com/v1/prices/cheap?origin=MOW&destination={iata}&currency=usd&token={TOKEN}",
            timeout=10
        )
        d = r.json()
        if d.get("success") and d.get("data", {}).get(iata):
            vals = [v["price"] for v in d["data"][iata].values() if "price" in v]
            if vals:
                prices[iata] = min(vals)
    except Exception:
        pass
    time.sleep(0.3)

with open("prices.json", "w") as f:
    json.dump({"updated": time.strftime("%Y-%m-%d"), "prices": prices}, f)

print(f"Done: {len(prices)}/{len(IATAS)} prices fetched")

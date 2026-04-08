# install requests
# phyton -m pip install requests

import json
import requests

# KRW-BTC 일 캔들 데이터 조회
url = "https://api.upbit.com/v1/candles/days"

market = "KRW-BTC"
to = "2026-04-07"
count = "100"

querystring = {
    "market": market,
    "count": count,
    "to": f"{to}T00:00:00Z",
}

response = requests.get(url, params=querystring)
data = response.json()

out_path = f"{market}_{to}_{count}.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(data)

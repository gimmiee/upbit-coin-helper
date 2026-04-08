function buildUpbitCandleUrl(unit) {
  if (unit === "day") return "https://api.upbit.com/v1/candles/days";
  if (typeof unit === "string" && unit.startsWith("minute:")) {
    const minute = Number(unit.split(":")[1]);
    if ([1, 3, 5, 10, 15, 30, 60, 240].includes(minute)) {
      return `https://api.upbit.com/v1/candles/minutes/${minute}`;
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const market = String(req.query.market || "");
  const count = String(req.query.count || "");
  const to = String(req.query.to || "");
  const unit = String(req.query.unit || "day");
  const endpoint = buildUpbitCandleUrl(unit);

  if (!endpoint || !market || !count) {
    res.status(400).json({ error: "invalid_query", required: ["market", "count", "unit"] });
    return;
  }

  const url = new URL(endpoint);
  url.searchParams.set("market", market);
  url.searchParams.set("count", count);
  if (to) url.searchParams.set("to", to);

  try {
    const upstream = await fetch(url.toString(), {
      headers: { accept: "application/json" },
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (_err) {
    res.status(502).json({ error: "upbit_candle_proxy_failed" });
  }
}

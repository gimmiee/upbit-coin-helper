const UPBIT_MARKET_ALL_URL = "https://api.upbit.com/v1/market/all?isDetails=false";

export default async function handler(_req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const upstream = await fetch(UPBIT_MARKET_ALL_URL, {
      headers: { accept: "application/json" },
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (_err) {
    res.status(502).json({ error: "upbit_market_proxy_failed" });
  }
}

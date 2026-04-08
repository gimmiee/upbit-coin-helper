const DAY_CANDLE_API_URL = "/api/upbit/candles?unit=day";
const MARKET_ALL_URL = "/api/upbit/market-all";
const WS_URL = "wss://api.upbit.com/websocket/v1";
const THEME_KEY = "upbit-dashboard-theme";

const nfKrw = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const nfVol = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 });

/** 가격 차트 범례에 표시할 시리즈별 설명(코린이 친화형) */
const PRICE_CHART_TOOLTIP_HELP = {
  종가: {
    title: "종가(하루 마감 가격)",
    desc: "하루 거래가 끝났을 때의 기준 가격입니다. 차트에서 가장 기본이 되는 선입니다.",
    tip: "오늘 종가가 최근 종가들보다 높아지는지 먼저 보세요.",
  },
  MA5: {
    title: "MA5(최근 5일 평균선)",
    desc: "최근 5일 종가의 평균입니다. 짧은 기간 흐름을 빠르게 보여줍니다.",
    tip: "가격이 MA5 위에 오래 있으면 단기 분위기가 비교적 강한 편입니다.",
  },
  MA20: {
    title: "MA20(최근 20일 평균선)",
    desc: "최근 20일 종가의 평균으로, MA5보다 느리지만 더 큰 방향을 보여줍니다.",
    tip: "코린이는 MA20을 '기준선'처럼 보고, 가격이 위/아래 어디에 있는지 확인하면 좋습니다.",
  },
  골든크로스: {
    title: "골든크로스",
    desc: "단기선(MA5)이 중기선(MA20)을 아래에서 위로 돌파한 신호입니다.",
    tip: "상승 전환 가능성 참고 신호입니다. 이것만으로 매수 결정을 내리지는 마세요.",
  },
  데드크로스: {
    title: "데드크로스",
    desc: "단기선(MA5)이 중기선(MA20)을 위에서 아래로 이탈한 신호입니다.",
    tip: "하락 압력 가능성 참고 신호입니다. 다른 지표와 같이 보세요.",
  },
};
const PRICE_LEGEND_HINT_DEFAULT =
  "범례에 마우스를 올리면 설명이 보이고, 필요 없는 범례를 클릭하면 해당 추세선(지표)을 숨기거나 다시 표시할 수 있습니다.";
const DIVERGENCE_LOOKBACK_DAYS = 20;
const DIVERGENCE_SPIKE_MULTIPLIER = 1.8;
const ESCAPE_LOOKBACK_DAYS = 30;
const ESCAPE_BIN_COUNT = 10;
const ESCAPE_MIN_DISTANCE_PCT = 1.0;
const ESCAPE_PREFERRED_DISTANCE_PCT = 2.0;
const ESCAPE_FALLBACK_SWING_LOOKBACK = 10;
const FAKEOUT_LOOKBACK_DAYS = 5;
const FAKEOUT_MIN_DROP_PCT = 2.0;
const FAKEOUT_MAX_DROP_PCT = 6.0;
const FAKEOUT_DROP_MULTIPLIER = 1.6;
const FAKEOUT_VOLUME_RATIO = 0.6;
const MAX_CANDLE_COUNT_PER_REQUEST = 200;
const REALTIME_UP_COLOR = "rgba(234,57,67,0.84)";
const REALTIME_DOWN_COLOR = "rgba(59,130,246,0.84)";
const REALTIME_WICK_COLOR = "rgba(148,163,184,0.9)";
const REALTIME_UP_HEX = "#EA3943";
const REALTIME_DOWN_HEX = "#3B82F6";
const REALTIME_VISUAL_PRESETS = {
  "minute:1": { wickBarPercentage: 0.12, bodyBarPercentage: 0.82 },
  "minute:5": { wickBarPercentage: 0.12, bodyBarPercentage: 0.82 },
  "minute:15": { wickBarPercentage: 0.12, bodyBarPercentage: 0.82 },
  "minute:30": { wickBarPercentage: 0.12, bodyBarPercentage: 0.82 },
  "minute:60": { wickBarPercentage: 0.12, bodyBarPercentage: 0.82 },
  "minute:240": { wickBarPercentage: 0.12, bodyBarPercentage: 0.82 },
  day: { wickBarPercentage: 0.12, bodyBarPercentage: 0.82 },
};

const el = {
  marketSearch: document.getElementById("marketSearch"),
  marketSelect: document.getElementById("marketSelect"),
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  themeToggleIcon: document.getElementById("themeToggleIcon"),
  realtimeUnit: document.getElementById("realtimeUnit"),
  realtimeCount: document.getElementById("realtimeCount"),
  realtimeTargetToggle: document.getElementById("realtimeTargetToggle"),
  realtimeStopToggle: document.getElementById("realtimeStopToggle"),
  realtimeInfoBar: document.getElementById("realtimeInfoBar"),
  preset: document.getElementById("preset"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  fetchBtn: document.getElementById("fetchBtn"),
  statusText: document.getElementById("statusText"),
  presetWrap: document.getElementById("presetWrap"),
  dateWrap: document.getElementById("dateWrap"),
  sClose: document.getElementById("sClose"),
  sRoi: document.getElementById("sRoi"),
  sHiLo: document.getElementById("sHiLo"),
  sPricePos: document.getElementById("sPricePos"),
  sPricePosBar: document.getElementById("sPricePosBar"),
  sPricePosMeter: document.getElementById("sPricePosMeter"),
  sPricePosPct: document.getElementById("sPricePosPct"),
  sAvgVol: document.getElementById("sAvgVol"),
  sUpDown: document.getElementById("sUpDown"),
  sForce: document.getElementById("sForce"),
  sForceInterpretation: document.getElementById("sForceInterpretation"),
  sForceMeter: document.getElementById("sForceMeter"),
  sForceMeterFill: document.getElementById("sForceMeterFill"),
  sVolatility: document.getElementById("sVolatility"),
  sVolBreakout: document.getElementById("sVolBreakout"),
  sVolRegime: document.getElementById("sVolRegime"),
  sTrend: document.getElementById("sTrend"),
  sCross: document.getElementById("sCross"),
  sMomentum: document.getElementById("sMomentum"),
  sVolumePressure: document.getElementById("sVolumePressure"),
  sBtcCorrelation: document.getElementById("sBtcCorrelation"),
  sVolPriceDivergence: document.getElementById("sVolPriceDivergence"),
  priceLegendHint: document.getElementById("priceLegendHint"),
  priceChartLegend: document.getElementById("priceChartLegend"),
  legendBubble: document.getElementById("legendBubble"),
  rConclusion: document.getElementById("rConclusion"),
  rReason: document.getElementById("rReason"),
  rInsights: document.getElementById("rInsights"),
  qPriceState: document.getElementById("qPriceState"),
  qPriceHint: document.getElementById("qPriceHint"),
  qPriceTooltip: document.getElementById("qPriceTooltip"),
  qHeatState: document.getElementById("qHeatState"),
  qHeatHint: document.getElementById("qHeatHint"),
  qHeatTooltip: document.getElementById("qHeatTooltip"),
  qVolState: document.getElementById("qVolState"),
  qVolHint: document.getElementById("qVolHint"),
  qVolTooltip: document.getElementById("qVolTooltip"),
  qEscapeCard: document.getElementById("qEscapeCard"),
  qEscapeState: document.getElementById("qEscapeState"),
  qEscapeHint: document.getElementById("qEscapeHint"),
  qEscapeTooltip: document.getElementById("qEscapeTooltip"),
  qFakeoutCard: document.getElementById("qFakeoutCard"),
  qFakeoutState: document.getElementById("qFakeoutState"),
  qFakeoutHint: document.getElementById("qFakeoutHint"),
  qFakeoutTooltip: document.getElementById("qFakeoutTooltip"),
  qBtcGameCard: document.getElementById("qBtcGameCard"),
  qBtcGameState: document.getElementById("qBtcGameState"),
  qBtcGameHint: document.getElementById("qBtcGameHint"),
  qBtcGameTooltip: document.getElementById("qBtcGameTooltip"),
  expertToggleBtn: document.getElementById("expertToggleBtn"),
  expertDetailPanel: document.getElementById("expertDetailPanel"),
};

let charts = {
  candleLite: null,
  price: null,
  volume: null,
  change: null,
};
let allKrwMarkets = [];
const dashboardState = {
  lastQuery: null,
  lastData: [],
  lastRelationship: null,
  lastDivergenceSummary: null,
};
const realtimeState = {
  realtimeUnit: "minute:30",
  realtimeCount: 120,
  lastData: [],
  lastRenderAt: 0,
  market: "KRW-BTC",
  oldestToCursor: "",
  panLoadInFlight: false,
  lastPanLoadAt: 0,
  panLoadThrottleMs: 700,
  initialWindowSize: 120,
  minWindowSize: 24,
  maxWindowSize: 500,
  extraLoadCount: 200,
  hoverIndex: null,
  showTargetLine: true,
  showStopLine: true,
  targetValue: null,
  stopValue: null,
};
const wsState = {
  socket: null,
  reconnectTimer: null,
  subscribedMarket: "",
  enabled: ["localhost", "127.0.0.1"].includes(window.location.hostname),
};

function trackAnalyticsEvent(eventName, params = {}) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}

function todayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function setDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  el.endDate.value = toDateInput(end);
  el.startDate.value = toDateInput(start);
}

function toDateInput(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function setStatus(text) {
  el.statusText.textContent = text;
}

function marketNameFromCode(code) {
  const base = (code || "").split("-")[1] || code;
  return `${base}`;
}

function renderMarketOptions(markets) {
  const preferred = "KRW-BTC";
  const current = el.marketSelect.value || preferred;
  const selected = markets.some((m) => m.market === current)
    ? current
    : preferred;

  el.marketSelect.innerHTML = "";

  markets.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.market;
    option.textContent = `${item.korean_name || marketNameFromCode(item.market)} (${marketNameFromCode(
      item.market,
    )})`;
    if (item.market === selected) option.selected = true;
    el.marketSelect.appendChild(option);
  });
}

function filterMarketOptions(query) {
  const q = (query || "").trim().toLowerCase();
  const filtered = q
    ? allKrwMarkets.filter((m) => {
        const code = (m.market || "").toLowerCase();
        const krName = (m.korean_name || "").toLowerCase();
        const enName = (m.english_name || "").toLowerCase();
        const symbol = marketNameFromCode(m.market).toLowerCase();
        return (
          code.includes(q) ||
          krName.includes(q) ||
          enName.includes(q) ||
          symbol.includes(q)
        );
      })
    : allKrwMarkets;

  renderMarketOptions(filtered);
}

async function loadMarketList() {
  const res = await fetch(MARKET_ALL_URL);
  if (!res.ok) {
    throw new Error(`마켓 목록 조회 실패 (${res.status})`);
  }

  const all = await res.json();
  const krwMarkets = all
    .filter((m) => m.market && m.market.startsWith("KRW-"))
    .sort((a, b) => a.market.localeCompare(b.market));

  if (!krwMarkets.length) {
    throw new Error("KRW 마켓 목록이 비어 있습니다.");
  }
  allKrwMarkets = krwMarkets;
  renderMarketOptions(allKrwMarkets);
}

function setTheme(mode) {
  const normalized = mode === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", normalized);
  if (el.themeToggleIcon) {
    el.themeToggleIcon.textContent = normalized === "dark" ? "🌙" : "☀️";
  }
  if (el.themeToggleBtn) {
    el.themeToggleBtn.setAttribute(
      "aria-pressed",
      String(normalized === "dark"),
    );
    el.themeToggleBtn.setAttribute(
      "title",
      normalized === "dark"
        ? "다크 모드 (클릭 시 라이트)"
        : "라이트 모드 (클릭 시 다크)",
    );
  }
  localStorage.setItem(THEME_KEY, normalized);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || "light";
  setTheme(saved);
}

function toggleMode() {
  const mode = document.querySelector('input[name="rangeMode"]:checked').value;
  const isPreset = mode === "preset";
  el.presetWrap.classList.toggle("hidden", !isPreset);
  el.dateWrap.classList.toggle("hidden", isPreset);
}

function destroyCharts() {
  Object.values(charts).forEach((chart) => {
    if (chart) chart.destroy();
  });
  charts = { candleLite: null, price: null, volume: null, change: null };
  hideLegendBubble();
}

function destroyDashboardCharts() {
  if (charts.price) charts.price.destroy();
  if (charts.volume) charts.volume.destroy();
  if (charts.change) charts.change.destroy();
  charts.price = null;
  charts.volume = null;
  charts.change = null;
  hideLegendBubble();
}

function showLegendBubble(key, anchorRect) {
  if (!el.legendBubble || !anchorRect) return;
  const help = PRICE_CHART_TOOLTIP_HELP[key];
  if (!help) {
    hideLegendBubble();
    return;
  }
  const chartWrap = el.legendBubble.parentElement;
  const wrapRect = chartWrap?.getBoundingClientRect();
  if (!wrapRect) return;

  el.legendBubble.innerHTML = `
    <div class="legend-bubble__title">${help.title}</div>
    <div class="legend-bubble__desc">${help.desc}</div>
    <div class="legend-bubble__tip">TIP: ${help.tip}</div>
  `;
  el.legendBubble.classList.remove("hidden");
  el.legendBubble.style.left = `${anchorRect.left - wrapRect.left + anchorRect.width / 2}px`;
  el.legendBubble.style.top = `${anchorRect.bottom - wrapRect.top + 10}px`;
}

function hideLegendBubble() {
  if (!el.legendBubble) return;
  el.legendBubble.classList.add("hidden");
}

function getLegendSwatchStyle(dataset) {
  const isPointOnly = dataset.type === "scatter";
  const borderColor = Array.isArray(dataset.borderColor)
    ? dataset.borderColor[0]
    : dataset.borderColor || dataset.pointBorderColor || "#8ba0c7";
  const pointColor = Array.isArray(dataset.pointBackgroundColor)
    ? dataset.pointBackgroundColor[0]
    : dataset.pointBackgroundColor || borderColor;
  return {
    borderColor,
    pointColor,
    isPointOnly,
  };
}

function renderPriceChartLegend(chart) {
  if (!el.priceChartLegend || !chart?.data?.datasets) return;
  const legendRoot = el.priceChartLegend;
  legendRoot.innerHTML = "";
  const breakAfterLabel = "데드크로스";

  chart.data.datasets.forEach((dataset, idx) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "price-chart-legend__item";
    const isVisible = chart.isDatasetVisible(idx);
    if (!isVisible) item.classList.add("is-hidden");

    const swatch = document.createElement("span");
    const { borderColor, pointColor, isPointOnly } =
      getLegendSwatchStyle(dataset);
    swatch.className = `price-chart-legend__swatch${isPointOnly ? " price-chart-legend__swatch--point" : ""}`;
    swatch.style.color = String(borderColor);
    if (isPointOnly) {
      swatch.style.backgroundColor = String(pointColor);
      swatch.style.borderColor = String(borderColor);
    }

    const text = document.createElement("span");
    text.textContent = dataset.label || `시리즈 ${idx + 1}`;

    item.append(swatch, text);
    item.addEventListener("click", () => {
      const currentlyVisible = chart.isDatasetVisible(idx);
      chart.setDatasetVisibility(idx, !currentlyVisible);
      chart.update();
      renderPriceChartLegend(chart);
    });
    item.addEventListener("mouseenter", () => {
      const key = dataset.label || "";
      showLegendBubble(key, item.getBoundingClientRect());
      setLegendSeriesFocus(chart, idx);
      chart.canvas.style.cursor = "pointer";
    });
    item.addEventListener("mouseleave", () => {
      if (el.priceLegendHint) {
        el.priceLegendHint.textContent = PRICE_LEGEND_HINT_DEFAULT;
      }
      hideLegendBubble();
      setLegendSeriesFocus(chart, null);
      chart.canvas.style.cursor = "default";
    });

    legendRoot.appendChild(item);
    if ((dataset.label || "") === breakAfterLabel) {
      const breaker = document.createElement("span");
      breaker.className = "price-chart-legend__break";
      legendRoot.appendChild(breaker);
    }
  });
}

function setLegendSeriesFocus(chart, activeDatasetIndex = null) {
  if (!chart?.data?.datasets) return;
  chart.data.datasets.forEach((dataset, idx) => {
    if (!dataset._legendBaseStyle) {
      dataset._legendBaseStyle = {
        borderWidth: dataset.borderWidth,
        pointRadius: dataset.pointRadius,
        pointHoverRadius: dataset.pointHoverRadius,
      };
    }
    const base = dataset._legendBaseStyle;
    const isActive = activeDatasetIndex == null || idx === activeDatasetIndex;

    if (isActive) {
      dataset.borderWidth =
        typeof base.borderWidth === "number"
          ? Math.max(2, base.borderWidth + 1)
          : base.borderWidth;
      if (typeof base.pointRadius === "number")
        dataset.pointRadius = base.pointRadius + 1;
      if (typeof base.pointHoverRadius === "number")
        dataset.pointHoverRadius = base.pointHoverRadius + 1;
    } else {
      dataset.borderWidth =
        typeof base.borderWidth === "number"
          ? Math.max(1, base.borderWidth - 1)
          : 1;
      if (typeof base.pointRadius === "number")
        dataset.pointRadius = Math.max(2, base.pointRadius - 1);
      if (typeof base.pointHoverRadius === "number")
        dataset.pointHoverRadius = Math.max(3, base.pointHoverRadius - 1);
    }
  });
  chart.update("none");
}

function formatSignedPercent(v) {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function formatKrwCompact(value) {
  const n = Math.round(Number(value) || 0);
  const abs = Math.abs(n);
  const eok = Math.floor(abs / 100000000);
  const man = Math.floor((abs % 100000000) / 10000);
  const sign = n < 0 ? "-" : "";

  if (eok > 0) {
    if (man > 0) return `${sign}${eok}억 ${nfKrw.format(man)}만 원`;
    return `${sign}${eok}억 원`;
  }
  if (man > 0) return `${sign}${nfKrw.format(man)}만 원`;
  return `${sign}${nfKrw.format(abs)}원`;
}

function setStatValueState(node, tone) {
  if (!node) return;
  node.classList.remove("up", "down");
  if (tone === "up" || tone === "down") {
    node.classList.add(tone);
  }
}

function buildAnalystInsights({
  pos,
  maSlope,
  avgAbsReturn,
  latestForce,
  volRatio,
  breakoutRatio,
}) {
  const insights = [];

  if (maSlope >= 0.5 && avgAbsReturn <= 2.5) {
    insights.push(
      "중기 추세는 우상향에 가깝고 변동성도 과열은 아니라, 추세 추종 전략의 품질이 비교적 좋습니다.",
    );
  } else if (maSlope <= -0.5) {
    insights.push(
      "중기 추세 기울기가 하방이라 반등 매매보다 리스크 관리 우선 접근이 유리합니다.",
    );
  } else {
    insights.push(
      "추세 기울기가 완만해 방향성이 약한 구간입니다. 신호 확인 후 진입하는 편이 안전합니다.",
    );
  }

  if (pos >= 80 && latestForce < 0) {
    insights.push(
      "가격이 상단권인데 당일 에너지가 음수라 단기 분배 가능성을 경계해야 합니다.",
    );
  } else if (pos <= 20 && latestForce > 0) {
    insights.push(
      "가격이 하단권에 있고 매수 에너지가 유입되어 기술적 반등 관찰 구간으로 볼 수 있습니다.",
    );
  }

  if (breakoutRatio >= 1.8 || avgAbsReturn >= 3) {
    insights.push(
      "변동성 확대 신호가 있어 포지션 크기를 평소보다 줄이고 손절 기준을 먼저 정하는 것이 좋습니다.",
    );
  } else if (volRatio >= 1.2 && maSlope >= 0) {
    insights.push(
      "거래량 유입이 증가하며 추세가 버티는 패턴이라 추세 지속 확률이 상대적으로 높습니다.",
    );
  }

  return insights.slice(0, 3);
}

function renderAnalystInsights(items) {
  const safeItems = items.length
    ? items
    : [
        "뚜렷한 우위 신호가 부족합니다. 추세와 변동성 변화가 동시에 확인될 때까지 관망이 합리적입니다.",
      ];
  const insightHtml = safeItems.map((text) => `<li>${text}</li>`).join("");
  if (el.rInsights) {
    el.rInsights.innerHTML = insightHtml;
  }
}

function movingAverage(values, period) {
  if (values.length < period) return [];
  const out = [];
  for (let i = period - 1; i < values.length; i += 1) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) sum += values[j];
    out.push(sum / period);
  }
  return out;
}

function paddedMovingAverage(values, period) {
  const ma = movingAverage(values, period);
  const padding = Array(Math.max(values.length - ma.length, 0)).fill(null);
  return padding.concat(ma);
}

function calculateRsi(closes, period = 14) {
  if (!closes || closes.length <= period) return null;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum += Math.abs(diff);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  for (let i = period + 1; i < closes.length; i += 1) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function buildBeginnerConclusion({ rsi, maSlope, corrClass, latestForce }) {
  let score = 0;
  const reasons = [];

  if (rsi != null) {
    if (rsi >= 70) {
      score -= 2;
      reasons.push(
        `RSI ${rsi.toFixed(1)}: 과열 구간에 가까워 단기 추격 매수는 주의가 필요해요.`,
      );
    } else if (rsi <= 30) {
      score += 1;
      reasons.push(
        `RSI ${rsi.toFixed(1)}: 과매도 구간으로 반등 가능성도 열려 있어요.`,
      );
    } else {
      reasons.push(
        `RSI ${rsi.toFixed(1)}: 과열/과매도는 아닌 중립 구간입니다.`,
      );
    }
  } else {
    reasons.push("RSI를 계산하기엔 데이터가 부족해요(최소 15일 이상 권장).");
  }

  if (typeof maSlope === "number") {
    if (maSlope > 0.3) {
      score += 1;
      reasons.push(
        `MA20 기울기 +${maSlope.toFixed(2)}%: 중기 흐름은 우상향입니다.`,
      );
    } else if (maSlope < -0.3) {
      score -= 1;
      reasons.push(
        `MA20 기울기 ${maSlope.toFixed(2)}%: 중기 흐름은 하방 압력이 있습니다.`,
      );
    } else {
      reasons.push(
        `MA20 기울기 ${maSlope.toFixed(2)}%: 뚜렷한 방향성은 약합니다.`,
      );
    }
  } else {
    reasons.push("MA20 기울기를 계산하기엔 데이터가 부족해요.");
  }

  if (corrClass === "up") {
    score += 0.5;
    reasons.push(
      "BTC와의 동조 흐름이 양호해 시장 추세를 따라갈 가능성이 있습니다.",
    );
  } else if (corrClass === "down") {
    score -= 0.5;
    reasons.push(
      "BTC와의 동조가 약하거나 불안정해 변동성 리스크를 주의해야 합니다.",
    );
  }

  if (typeof latestForce === "number") {
    if (latestForce > 0) score += 0.5;
    else if (latestForce < 0) score -= 0.5;
    reasons.push(
      latestForce >= 0
        ? "당일 매수 힘(Force)이 우세해 단기 반등 기대가 남아 있습니다."
        : "당일 매도 압력(Force)이 우세해 성급한 진입은 주의가 필요합니다.",
    );
  }

  const topReasons = reasons.slice(0, 3);

  if (score <= -1.5) {
    return {
      conclusion: "리스크 높음 · 지금은 관망 추천",
      className: "buy-no",
      reason: topReasons.join(" "),
    };
  }
  if (score < 1) {
    return {
      conclusion: "주의 구간 · 분할 진입 가능",
      className: "buy-wait",
      reason: topReasons.join(" "),
    };
  }
  return {
    conclusion: "안정 구간 · 계획된 분할 접근 가능",
    className: "buy-yes",
    reason: topReasons.join(" "),
  };
}

function detectCrossSignals(maShort, maLong, labels, prices) {
  const golden = [];
  const dead = [];

  for (let i = 1; i < maShort.length; i += 1) {
    const prevShort = maShort[i - 1];
    const prevLong = maLong[i - 1];
    const currShort = maShort[i];
    const currLong = maLong[i];

    if (
      prevShort == null ||
      prevLong == null ||
      currShort == null ||
      currLong == null
    ) {
      continue;
    }

    const prevDiff = prevShort - prevLong;
    const currDiff = currShort - currLong;

    if (prevDiff <= 0 && currDiff > 0) {
      golden.push({ index: i, label: labels[i], y: prices[i] });
    } else if (prevDiff >= 0 && currDiff < 0) {
      dead.push({ index: i, label: labels[i], y: prices[i] });
    }
  }

  return { golden, dead };
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function pearsonCorrelation(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 5) return null;
  const xMean = average(xs);
  const yMean = average(ys);
  let numerator = 0;
  let xDen = 0;
  let yDen = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    numerator += dx * dy;
    xDen += dx * dx;
    yDen += dy * dy;
  }
  if (xDen === 0 || yDen === 0) return null;
  return numerator / Math.sqrt(xDen * yDen);
}

function buildAlignedReturnSeries(coinCandles, btcCandles) {
  const coinMap = new Map(
    coinCandles.map((c) => [
      c.candle_date_time_kst.slice(0, 10),
      c.change_rate,
    ]),
  );
  const btcMap = new Map(
    btcCandles.map((c) => [c.candle_date_time_kst.slice(0, 10), c.change_rate]),
  );
  const commonDates = [...coinMap.keys()].filter((d) => btcMap.has(d)).sort();
  const coinReturns = commonDates.map((d) => coinMap.get(d));
  const btcReturns = commonDates.map((d) => btcMap.get(d));
  return { commonDates, coinReturns, btcReturns };
}

function classifyCorrelation(r) {
  if (r >= 0.7) return { text: "BTC와 강한 동조", className: "up" };
  if (r >= 0.4) return { text: "BTC와 부분 동조", className: "" };
  if (r >= 0) return { text: "상대적 독립 흐름 가능", className: "down" };
  return { text: "역행 흐름(음의 상관)", className: "down" };
}

function detectVolumePriceDivergence(
  data,
  lookback = DIVERGENCE_LOOKBACK_DAYS,
  spike = DIVERGENCE_SPIKE_MULTIPLIER,
) {
  const signals = [];
  for (let i = lookback; i < data.length; i += 1) {
    const prevVols = data
      .slice(i - lookback, i)
      .map((c) => c.candle_acc_trade_volume);
    const volAvg = average(prevVols);
    if (volAvg <= 0) continue;
    const candle = data[i];
    const ratio = candle.candle_acc_trade_volume / volAvg;
    if (ratio < spike) continue;

    if (candle.change_rate < 0) {
      signals.push({
        index: i,
        label: candle.candle_date_time_kst.slice(5, 10),
        y: candle.trade_price,
        type: "support",
        ratio,
        message: "가격 하락 중 거래량 급증: 지지선 확인 필요",
      });
    } else if (candle.change_rate > 0) {
      signals.push({
        index: i,
        label: candle.candle_date_time_kst.slice(5, 10),
        y: candle.trade_price,
        type: "breakout",
        ratio,
        message: "가격 상승 + 거래량 급증: 추세 강화 가능",
      });
    }
  }
  return signals;
}

function summarizeDivergence(signals) {
  if (!signals.length) {
    return {
      text: `특이 신호 없음 (기준: ${DIVERGENCE_LOOKBACK_DAYS}일 평균 대비 ${DIVERGENCE_SPIKE_MULTIPLIER}배)`,
      className: "",
    };
  }
  const latest = signals[signals.length - 1];
  const recentCount = signals.filter((s) => s.type === "support").length;
  return {
    text: `${latest.message} · 최근 신호 ${signals.length}건(하락형 ${recentCount}건)`,
    className: latest.type === "support" ? "up" : "down",
  };
}

function classifyVolumeStrength(ratio) {
  if (!Number.isFinite(ratio)) return "계산 불가";
  if (ratio >= 0.8) return "매우 단단함";
  if (ratio >= 0.45) return "보통";
  return "얇음";
}

function detectFakeoutDrop(data) {
  if (!Array.isArray(data) || data.length < FAKEOUT_LOOKBACK_DAYS + 1) {
    return {
      triggered: false,
      weakSignal: false,
      reason: "데이터 부족",
      thresholdPct: null,
      intradayDropPct: null,
      dayOverDayDropPct: null,
      volumeRatio: null,
      avg5Vol: null,
      todayVol: null,
    };
  }

  const latest = data[data.length - 1];
  const prev = data.slice(-(FAKEOUT_LOOKBACK_DAYS + 1), -1);
  const latestOpen = Number(latest?.opening_price);
  const latestClose = Number(latest?.trade_price);
  const todayVol = Number(latest?.candle_acc_trade_volume || 0);
  const prevClose = Number(prev[prev.length - 1]?.trade_price);

  if (
    !Number.isFinite(latestOpen) ||
    !Number.isFinite(latestClose) ||
    latestOpen <= 0
  ) {
    return {
      triggered: false,
      weakSignal: false,
      reason: "가격 데이터 부족",
      thresholdPct: null,
      intradayDropPct: null,
      dayOverDayDropPct: null,
      volumeRatio: null,
      avg5Vol: null,
      todayVol,
    };
  }

  const intradayDropPct = ((latestClose - latestOpen) / latestOpen) * 100;
  const dayOverDayDropPct =
    Number.isFinite(prevClose) && prevClose > 0
      ? ((latestClose - prevClose) / prevClose) * 100
      : 0;
  const avgAbsReturnPct =
    prev.reduce(
      (sum, candle) => sum + Math.abs((Number(candle?.change_rate) || 0) * 100),
      0,
    ) / prev.length;
  const thresholdPct = Math.min(
    FAKEOUT_MAX_DROP_PCT,
    Math.max(FAKEOUT_MIN_DROP_PCT, avgAbsReturnPct * FAKEOUT_DROP_MULTIPLIER),
  );
  const avg5Vol =
    prev.reduce(
      (sum, candle) => sum + (Number(candle?.candle_acc_trade_volume) || 0),
      0,
    ) / prev.length;
  const volumeRatio = avg5Vol > 0 ? todayVol / avg5Vol : null;
  const priceCondition =
    intradayDropPct <= -thresholdPct || dayOverDayDropPct <= -thresholdPct;
  const volumeCondition =
    Number.isFinite(volumeRatio) && volumeRatio < FAKEOUT_VOLUME_RATIO;
  const weakSignal =
    priceCondition &&
    Number.isFinite(volumeRatio) &&
    volumeRatio >= FAKEOUT_VOLUME_RATIO &&
    volumeRatio < FAKEOUT_VOLUME_RATIO + 0.15;

  return {
    triggered: priceCondition && volumeCondition,
    weakSignal,
    reason: "ok",
    thresholdPct,
    intradayDropPct,
    dayOverDayDropPct,
    volumeRatio,
    avg5Vol,
    todayVol,
  };
}

function findBestVolumeBin(
  candidates,
  preferredDistancePct = ESCAPE_PREFERRED_DISTANCE_PCT,
) {
  if (!candidates.length) return null;
  const preferred = candidates.filter(
    (item) => item.distancePct >= preferredDistancePct,
  );
  const source = preferred.length ? preferred : candidates;
  return source.reduce((best, cur) => {
    if (!best) return cur;
    if (cur.bin.volume > best.bin.volume) return cur;
    if (
      cur.bin.volume === best.bin.volume &&
      cur.distancePct > best.distancePct
    )
      return cur;
    return best;
  }, null);
}

function calculateEscapePlanByVolumeProfile(
  data,
  lookbackDays = ESCAPE_LOOKBACK_DAYS,
  binCount = ESCAPE_BIN_COUNT,
) {
  if (!Array.isArray(data) || data.length < 5) {
    return {
      targetPrice: null,
      stopPrice: null,
      upsidePct: null,
      riskPct: null,
      usedMa20Fallback: false,
      sampledDays: 0,
      rangeLow: null,
      rangeHigh: null,
      targetVolumeRatio: null,
      stopVolumeRatio: null,
      binCount,
      minDistancePct: ESCAPE_MIN_DISTANCE_PCT,
    };
  }

  const ref = data.slice(-Math.max(5, lookbackDays));
  const latest = ref[ref.length - 1];
  const current = Number(latest?.trade_price);
  if (!Number.isFinite(current) || current <= 0) {
    return {
      targetPrice: null,
      stopPrice: null,
      upsidePct: null,
      riskPct: null,
      usedMa20Fallback: false,
      sampledDays: ref.length,
      rangeLow: null,
      rangeHigh: null,
      targetVolumeRatio: null,
      stopVolumeRatio: null,
      binCount,
      minDistancePct: ESCAPE_MIN_DISTANCE_PCT,
    };
  }

  const refLow = Math.min(...ref.map((c) => Number(c.low_price)));
  const refHigh = Math.max(...ref.map((c) => Number(c.high_price)));
  const span = refHigh - refLow;
  if (!Number.isFinite(span) || span <= 0) {
    return {
      targetPrice: null,
      stopPrice: null,
      upsidePct: null,
      riskPct: null,
      usedMa20Fallback: false,
      sampledDays: ref.length,
      rangeLow: refLow,
      rangeHigh: refHigh,
      targetVolumeRatio: null,
      stopVolumeRatio: null,
      binCount,
      minDistancePct: ESCAPE_MIN_DISTANCE_PCT,
    };
  }

  const bins = Array.from({ length: binCount }, (_, i) => ({
    idx: i,
    low: refLow + (span * i) / binCount,
    high: refLow + (span * (i + 1)) / binCount,
    center: refLow + (span * (i + 0.5)) / binCount,
    volume: 0,
  }));

  ref.forEach((candle) => {
    const close = Number(candle.trade_price);
    const vol = Number(candle.candle_acc_trade_volume || 0);
    if (!Number.isFinite(close) || !Number.isFinite(vol)) return;
    let idx = Math.floor(((close - refLow) / span) * binCount);
    idx = Math.max(0, Math.min(binCount - 1, idx));
    bins[idx].volume += vol;
  });

  const minDistancePct = ESCAPE_MIN_DISTANCE_PCT;
  const aboveCandidates = bins
    .filter((b) => b.center > current)
    .map((bin) => ({
      bin,
      distancePct: ((bin.center - current) / current) * 100,
    }))
    .filter((item) => item.distancePct >= minDistancePct);
  const belowCandidates = bins
    .filter((b) => b.center < current)
    .map((bin) => ({
      bin,
      distancePct: ((current - bin.center) / current) * 100,
    }))
    .filter((item) => item.distancePct >= minDistancePct);

  const selectedTarget = findBestVolumeBin(aboveCandidates);
  const selectedStop = findBestVolumeBin(belowCandidates);
  const targetBin = selectedTarget?.bin || null;
  let stopBin = selectedStop?.bin || null;
  let usedMa20Fallback = false;
  let usedSwingFallback = false;

  if (!stopBin) {
    const ma20 = movingAverage(
      data.map((c) => c.trade_price),
      20,
    );
    const ma20Latest = ma20[ma20.length - 1];
    const ma20DistancePct = Number.isFinite(ma20Latest)
      ? ((current - ma20Latest) / current) * 100
      : null;
    if (
      Number.isFinite(ma20Latest) &&
      ma20Latest < current &&
      Number.isFinite(ma20DistancePct) &&
      ma20DistancePct >= minDistancePct
    ) {
      stopBin = { center: ma20Latest, volume: 0 };
      usedMa20Fallback = true;
    }
  }
  if (!stopBin) {
    const swingRef = ref.slice(-Math.max(3, ESCAPE_FALLBACK_SWING_LOOKBACK));
    const swingLow = Math.min(
      ...swingRef
        .map((c) => Number(c.low_price))
        .filter((v) => Number.isFinite(v)),
    );
    const swingDistancePct = Number.isFinite(swingLow)
      ? ((current - swingLow) / current) * 100
      : null;
    if (
      Number.isFinite(swingLow) &&
      swingLow < current &&
      Number.isFinite(swingDistancePct) &&
      swingDistancePct >= minDistancePct
    ) {
      stopBin = { center: swingLow, volume: 0 };
      usedSwingFallback = true;
    }
  }

  const targetPrice = Number.isFinite(targetBin?.center)
    ? targetBin.center
    : null;
  const stopPrice = Number.isFinite(stopBin?.center) ? stopBin.center : null;
  const upsidePct = targetPrice
    ? ((targetPrice - current) / current) * 100
    : null;
  const riskPct = stopPrice ? ((stopPrice - current) / current) * 100 : null;
  const maxVolume = Math.max(...bins.map((b) => b.volume), 0);
  const targetVolumeRatio =
    targetBin && maxVolume > 0 ? targetBin.volume / maxVolume : null;
  const stopVolumeRatio =
    stopBin && maxVolume > 0 ? stopBin.volume / maxVolume : null;

  return {
    targetPrice,
    stopPrice,
    upsidePct,
    riskPct,
    usedMa20Fallback,
    sampledDays: ref.length,
    rangeLow: refLow,
    rangeHigh: refHigh,
    targetVolumeRatio,
    stopVolumeRatio,
    usedSwingFallback,
    binCount,
    minDistancePct,
  };
}

function getStateClass(level) {
  if (level === "safe") return "state-safe";
  if (level === "risk") return "state-risk";
  return "state-caution";
}

function mapBtcGameMessage(relationship, market) {
  if (market === "KRW-BTC") {
    return {
      state: "기준 자산(비트코인)",
      hint: "현재 선택한 코인이 비트코인이므로 동조화 지수는 해당되지 않습니다.",
      level: "caution",
    };
  }
  const corr = Number(relationship?.corr);
  if (!Number.isFinite(corr)) {
    return {
      state: "판별 대기",
      hint: "BTC 동조화 지수를 계산할 데이터가 부족하거나 조회에 실패했습니다.",
      level: "caution",
    };
  }
  if (corr >= 0.8) {
    return {
      state: "커플(High)",
      hint: "지금 비트코인이 기침하면 이 코인은 독감에 걸릴 확률이 높아요.\n비트코인 차트부터 확인하세요.",
      level: "risk",
    };
  }
  if (corr <= 0.3) {
    return {
      state: "남남(Low)",
      hint: "비트코인과 따로 놀고 있어요.\n이 코인의 개별 호재/악재 뉴스를 먼저 확인해 보세요.",
      level: "safe",
    };
  }
  return {
    state: "썸 타는 중(Mid)",
    hint: "비트코인 눈치를 적당히 보고 있어요.\n시장 전체 분위기와 코인 개별 이슈를 함께 보세요.",
    level: "caution",
  };
}

function bindExpertToggle() {
  if (!el.expertToggleBtn || !el.expertDetailPanel) return;
  el.expertToggleBtn.addEventListener("click", () => {
    const isOpen = !el.expertDetailPanel.classList.contains("hidden");
    el.expertDetailPanel.classList.toggle("hidden", isOpen);
    el.expertToggleBtn.setAttribute("aria-expanded", String(!isOpen));
  });
}

function analyze(
  data,
  market,
  relationship = null,
  divergence = null,
  escapePlan = null,
) {
  const latest = data[data.length - 1];
  const oldest = data[0];
  const roi =
    ((latest.trade_price - oldest.trade_price) / oldest.trade_price) * 100;

  let hi = -Infinity;
  let lo = Infinity;
  let totalVol = 0;
  let upDays = 0;
  let downDays = 0;
  let maxRange = -Infinity;
  let maxRangeDate = "";
  const dailyReturns = [];
  const ranges = [];

  data.forEach((c) => {
    hi = Math.max(hi, c.high_price);
    lo = Math.min(lo, c.low_price);
    totalVol += c.candle_acc_trade_volume;
    if (c.change_rate > 0) upDays += 1;
    if (c.change_rate < 0) downDays += 1;
    const rangePct = ((c.high_price - c.low_price) / c.opening_price) * 100;
    ranges.push(rangePct);
    dailyReturns.push(c.change_rate * 100);
    if (rangePct > maxRange) {
      maxRange = rangePct;
      maxRangeDate = c.candle_date_time_kst.slice(0, 10);
    }
  });

  el.sClose.textContent = `${nfKrw.format(Math.round(latest.trade_price))} 원`;
  el.sRoi.textContent = formatSignedPercent(roi);
  setStatValueState(el.sRoi, roi >= 0 ? "up" : "down");
  el.sHiLo.textContent = `${formatKrwCompact(hi)} / ${formatKrwCompact(lo)}`;

  const recent30 = data.slice(-30);
  const ref = recent30.length ? recent30 : data;
  const refHi = Math.max(...ref.map((c) => c.high_price));
  const refLo = Math.min(...ref.map((c) => c.low_price));
  const width = Math.max(refHi - refLo, 0);
  const rawPos =
    width === 0 ? 50 : ((latest.trade_price - refLo) / width) * 100;
  const pos = Math.min(100, Math.max(0, rawPos));
  let posLabel = "중립권";
  if (pos <= 15) posLabel = "바닥권";
  else if (pos <= 35) posLabel = "저점권";
  else if (pos >= 85) posLabel = "천장권";
  else if (pos >= 65) posLabel = "고점권";
  el.sPricePos.textContent = `${posLabel} ${pos.toFixed(1)}%`;
  setStatValueState(el.sPricePos, pos >= 70 ? "down" : pos <= 30 ? "up" : "");
  el.sPricePosBar.style.width = `${pos}%`;
  if (el.sPricePosMeter) {
    el.sPricePosMeter.setAttribute("aria-valuenow", pos.toFixed(1));
  }
  if (el.sPricePosPct) {
    el.sPricePosPct.textContent = `${pos.toFixed(1)}%`;
    el.sPricePosPct.className = pos >= 70 ? "down" : pos <= 30 ? "up" : "";
  }
  if (el.qPriceState && el.qPriceHint) {
    let priceState = "중간 가격대";
    let priceHint = `최근 30일 범위 기준 ${pos.toFixed(1)}% 지점입니다.`;
    let level = "caution";
    if (pos <= 20) {
      priceState = "비교적 저렴한 구간";
      priceHint = `최근 30일 하단권(${pos.toFixed(1)}%)이라 가격 매력은 있는 편입니다.`;
      level = "safe";
    } else if (pos >= 80) {
      priceState = "비교적 비싼 구간";
      priceHint = `최근 30일 상단권(${pos.toFixed(1)}%)이라 추격 매수는 주의하세요.`;
      level = "risk";
    }
    el.qPriceState.textContent = priceState;
    el.qPriceState.className = getStateClass(level);
    el.qPriceHint.textContent = priceHint;
  }
  if (el.qPriceTooltip) {
    el.qPriceTooltip.innerHTML = [
      "현재가가 최근 30일 범위 어디쯤인지 보여줘요.",
      `현재 위치: ${pos.toFixed(1)}%`,
      "기준: 20% 이하면 하단권, 80% 이상이면 상단권",
    ].join("<br>");
  }

  el.sAvgVol.textContent = `${nfVol.format(totalVol / data.length)} BTC`;
  el.sUpDown.textContent = `${upDays}일 / ${downDays}일`;
  let latestForceForReport = null;

  if (data.length >= 2) {
    const forceValues = [];
    for (let i = 1; i < data.length; i += 1) {
      const priceDelta = data[i].trade_price - data[i - 1].trade_price;
      forceValues.push(priceDelta * data[i].candle_acc_trade_volume);
    }
    const latestForce = forceValues[forceValues.length - 1];
    latestForceForReport = latestForce;
    const avgForce7 = average(forceValues.slice(-7));
    const latestForceText = `${latestForce >= 0 ? "+" : ""}${nfKrw.format(Math.round(latestForce))}`;
    const avgForceText = `${avgForce7 >= 0 ? "+" : ""}${nfKrw.format(Math.round(avgForce7))}`;
    el.sForce.textContent = `당일 ${latestForceText} · 7일평균 ${avgForceText}`;
    el.sForce.className = `meter-subtext ${latestForce >= 0 ? "up" : "down"}`;

    const forceRef = forceValues.slice(-30);
    const maxAbsForce = Math.max(...forceRef.map((v) => Math.abs(v)), 0);
    const normalizedSigned =
      maxAbsForce > 0
        ? Math.max(-100, Math.min(100, (latestForce / maxAbsForce) * 100))
        : 0;
    const absNormalized = Math.abs(normalizedSigned);

    let directionText = "중립";
    let className = "neutral";
    if (normalizedSigned >= 10) {
      directionText = "상승 세력 우위";
      className = "up";
    } else if (normalizedSigned <= -10) {
      directionText = "하락 압력 우위";
      className = "down";
    }

    let strengthText = "약함";
    if (absNormalized >= 70) strengthText = "매우 강함";
    else if (absNormalized >= 40) strengthText = "강함";
    else if (absNormalized >= 20) strengthText = "보통";

    if (el.sForceInterpretation) {
      el.sForceInterpretation.textContent = `${directionText} · 강도 ${strengthText} (${normalizedSigned.toFixed(
        1,
      )})`;
      setStatValueState(
        el.sForceInterpretation,
        className === "neutral" ? "" : className,
      );
    }
    if (el.sForceMeter) {
      el.sForceMeter.setAttribute("aria-valuenow", normalizedSigned.toFixed(1));
    }
    if (el.sForceMeterFill) {
      const halfSpan = absNormalized / 2;
      const left = normalizedSigned >= 0 ? 50 : 50 - halfSpan;
      el.sForceMeterFill.style.left = `${left}%`;
      el.sForceMeterFill.style.width = `${halfSpan}%`;
      el.sForceMeterFill.className = `force-meter__fill ${className}`;
    }
  } else {
    el.sForce.textContent = "데이터 부족(2일 이상 필요)";
    el.sForce.className = "meter-subtext";
    if (el.sForceInterpretation) {
      el.sForceInterpretation.textContent = "데이터 부족(2일 이상 필요)";
      setStatValueState(el.sForceInterpretation, "");
    }
    if (el.sForceMeter) {
      el.sForceMeter.setAttribute("aria-valuenow", "0");
    }
    if (el.sForceMeterFill) {
      el.sForceMeterFill.style.left = "50%";
      el.sForceMeterFill.style.width = "0%";
      el.sForceMeterFill.className = "force-meter__fill neutral";
    }
  }

  el.sVolatility.textContent = `${maxRangeDate} (${maxRange.toFixed(2)}%)`;

  if (ranges.length >= 6) {
    const todayRange = ranges[ranges.length - 1];
    const recent5Avg = average(ranges.slice(-6, -1));
    const breakoutRatio = recent5Avg > 0 ? todayRange / recent5Avg : 0;
    if (breakoutRatio >= 2) {
      el.sVolBreakout.textContent = `주의: 변동성 확대 (${breakoutRatio.toFixed(2)}배)`;
      setStatValueState(el.sVolBreakout, "down");
    } else {
      el.sVolBreakout.textContent = `정상 범위 (${breakoutRatio.toFixed(2)}배)`;
      setStatValueState(el.sVolBreakout, "up");
    }
  } else {
    el.sVolBreakout.textContent = "데이터 부족(6일 이상 필요)";
    setStatValueState(el.sVolBreakout, "");
  }

  const avgRange = average(ranges);
  const avgAbsReturn = average(dailyReturns.map((v) => Math.abs(v)));
  let volRegime = "보통 변동성";
  if (avgAbsReturn >= 3 || avgRange >= 5) volRegime = "고변동성 구간";
  else if (avgAbsReturn <= 1.2 && avgRange <= 2)
    volRegime = "저변동성(박스권 가능성)";
  el.sVolRegime.textContent = `${volRegime} · 평균 일변동 ${avgAbsReturn.toFixed(2)}%`;
  if (el.qVolState && el.qVolHint) {
    let volState = "보통 흔들림";
    let volHint = `평균 일변동 ${avgAbsReturn.toFixed(2)}%로 관리 가능한 수준입니다.`;
    let level = "caution";
    if (avgAbsReturn >= 3 || avgRange >= 5) {
      volState = "많이 흔들리는 장";
      volHint =
        "변동이 커서 초보자는 진입 금액을 줄이고 손절 기준을 먼저 정하세요.";
      level = "risk";
    } else if (avgAbsReturn <= 1.2 && avgRange <= 2) {
      volState = "잔잔한 장";
      volHint = "급등락 위험은 상대적으로 낮지만, 방향성도 약할 수 있습니다.";
      level = "safe";
    }
    el.qVolState.textContent = volState;
    el.qVolState.className = getStateClass(level);
    el.qVolHint.textContent = volHint;
  }
  if (el.qVolTooltip) {
    el.qVolTooltip.innerHTML = [
      "최근 변동이 큰지/작은지를 확인하는 카드예요.",
      `평균 일변동: ${avgAbsReturn.toFixed(2)}%`,
      "기준: 3% 이상이면 고변동성, 1.2% 이하면 저변동성",
    ].join("<br>");
  }

  const fakeout = detectFakeoutDrop(data);
  if (el.qFakeoutState && el.qFakeoutHint) {
    if (fakeout.reason !== "ok") {
      el.qFakeoutState.textContent = "판별 대기";
      el.qFakeoutState.className = getStateClass("caution");
      el.qFakeoutHint.textContent =
        "최근 6일 데이터가 쌓이면 가짜 하락 여부를 판별해 드릴게요.";
    } else if (fakeout.triggered) {
      el.qFakeoutState.textContent = "개미 털기 주의보";
      el.qFakeoutState.className = getStateClass("safe");
      el.qFakeoutHint.textContent =
        "가격은 급락했지만 거래량이 얇아요.\n공포 손절보다 지지 구간 반응을 조금 더 지켜보세요.";
    } else if (fakeout.weakSignal) {
      el.qFakeoutState.textContent = "가짜 하락 가능성";
      el.qFakeoutState.className = getStateClass("caution");
      el.qFakeoutHint.textContent =
        "하락은 컸지만 거래량이 약간 부족합니다.\n한두 캔들 추가 확인이 좋아요.";
    } else {
      el.qFakeoutState.textContent = "정상 하락 또는 확인 필요";
      el.qFakeoutState.className = getStateClass("caution");
      el.qFakeoutHint.textContent =
        "하락 강도나 거래량 중 하나가 기준에 미달해\n일반 조정 가능성이 있습니다.";
    }
  }
  if (el.qFakeoutTooltip) {
    if (fakeout.reason !== "ok") {
      el.qFakeoutTooltip.innerHTML =
        "최근 6일(오늘 포함) 데이터가 부족해 판별을 보류했어요.";
    } else {
      const priceHit =
        fakeout.intradayDropPct <= -fakeout.thresholdPct ||
        fakeout.dayOverDayDropPct <= -fakeout.thresholdPct;
      const volumeHit =
        Number.isFinite(fakeout.volumeRatio) &&
        fakeout.volumeRatio < FAKEOUT_VOLUME_RATIO;
      const decisionText = fakeout.triggered
        ? "최종 판정: 개미 털기 주의보 (가격 급락 + 저거래량 동시 충족)"
        : `최종 판정: 미감지 (가격 조건 ${priceHit ? "충족" : "미충족"}, 거래량 조건 ${
            volumeHit ? "충족" : "미충족"
          })`;
      const detailText = [
        decisionText,
        `하락 임계치: ${fakeout.thresholdPct.toFixed(2)}% (최근 5일 평균 변동률 기반)`,
        `장중 하락: ${formatSignedPercent(fakeout.intradayDropPct)}`,
        `전일 종가 대비: ${formatSignedPercent(fakeout.dayOverDayDropPct)}`,
        Number.isFinite(fakeout.volumeRatio)
          ? `오늘 거래량: 5일 평균의 ${(fakeout.volumeRatio * 100).toFixed(1)}% (기준: ${(
              FAKEOUT_VOLUME_RATIO * 100
            ).toFixed(0)}% 미만)`
          : "거래량 비교: 계산 불가",
      ];
      el.qFakeoutTooltip.innerHTML = detailText.join("<br>");
    }
  }

  if (el.qBtcGameState && el.qBtcGameHint) {
    const btcGame = mapBtcGameMessage(relationship, market);
    el.qBtcGameState.textContent = btcGame.state;
    el.qBtcGameState.className = getStateClass(btcGame.level);
    el.qBtcGameHint.textContent = btcGame.hint;
  }
  if (el.qBtcGameTooltip) {
    const corr = Number(relationship?.corr);
    if (market === "KRW-BTC") {
      el.qBtcGameTooltip.innerHTML =
        "기준 자산(BTC) 자체는 동조화 비교 대상이 아니에요.<br>알트코인을 선택하면 BTC와의 눈치 게임 지수를 보여드릴게요.";
    } else if (!Number.isFinite(corr)) {
      el.qBtcGameTooltip.innerHTML =
        "상관계수를 계산할 공통 데이터가 부족하거나 BTC 데이터 조회에 실패했어요.<br>기간을 늘려 다시 조회해 보세요.";
    } else {
      const relationText =
        corr >= 0.8
          ? "최종 판정: High (비트코인과 매우 강한 동조)"
          : corr <= 0.3
            ? "최종 판정: Low (비트코인과 상대적 독립)"
            : "최종 판정: Mid (부분 동조)";
      el.qBtcGameTooltip.innerHTML = [
        relationText,
        `동조화 지수 r: ${corr.toFixed(2)}`,
        "기준: High ≥ 0.80 / Low ≤ 0.30 / 그 사이는 Mid",
        "해석: High일수록 비트코인 변동에 함께 흔들릴 가능성이 큽니다.",
      ].join("<br>");
    }
  }

  const plan = escapePlan || calculateEscapePlanByVolumeProfile(data);
  if (el.qEscapeState && el.qEscapeHint) {
    const targetText = Number.isFinite(plan.targetPrice)
      ? `목표가 ${nfKrw.format(Math.round(plan.targetPrice))}원 (약 ${formatSignedPercent(plan.upsidePct || 0)})`
      : "목표가: 현재가 위 매물대가 약해 추가 저항 확인이 필요해요.";
    const stopTail = plan.usedMa20Fallback ? " (MA20 대체 지지선)" : "";
    const stopText = Number.isFinite(plan.stopPrice)
      ? `손절가 ${nfKrw.format(Math.round(plan.stopPrice))}원 (약 ${formatSignedPercent(plan.riskPct || 0)})${stopTail}`
      : "손절가: 하단 지지 매물대가 약해 보수적으로 대응하세요.";

    let level = "caution";
    let stateText = "탈출 전략 점검";
    if (Number.isFinite(plan.riskPct) && plan.riskPct > -1) {
      level = "caution";
      stateText = "지지선 근처 - 주의 깊게 관찰";
    } else if (Number.isFinite(plan.riskPct) && plan.riskPct > -3) {
      level = "caution";
      stateText = "리스크 관리 필요";
    } else if (Number.isFinite(plan.riskPct) && plan.riskPct <= -3) {
      level = "risk";
      stateText = "도망칠 준비 구간";
    } else if (
      Number.isFinite(plan.upsidePct) &&
      plan.upsidePct <= 2 &&
      plan.upsidePct >= 0
    ) {
      level = "safe";
      stateText = "수익 실현 준비 구간";
    } else if (
      Number.isFinite(plan.upsidePct) &&
      plan.upsidePct > 2 &&
      Number.isFinite(plan.riskPct) &&
      plan.riskPct < -2
    ) {
      level = "safe";
      stateText = "상승 여력 우세";
    }

    el.qEscapeState.textContent = stateText;
    el.qEscapeState.className = getStateClass(level);
    el.qEscapeHint.innerHTML = `${targetText}<br>${stopText}`;

    if (el.qEscapeTooltip) {
      const fallbackText = plan.usedSwingFallback
        ? "하단 매물대와 MA20 조건이 약해 최근 스윙 저점을 손절 대체선으로 사용했어요."
        : plan.usedMa20Fallback
          ? "하단 매물대 부족으로 MA20을 손절 대체선으로 사용했어요."
          : "하단 주요 매물대를 손절 기준으로 사용했어요.";
      const targetRatioText = `상단 목표 매물 강도 ${classifyVolumeStrength(plan.targetVolumeRatio)}`;
      const stopRatioText = `하단 지지 매물 강도 ${classifyVolumeStrength(plan.stopVolumeRatio)}`;
      const sampledText =
        Number.isFinite(plan.rangeLow) && Number.isFinite(plan.rangeHigh)
          ? `최근 ${plan.sampledDays}일 · 가격 범위 ${nfKrw.format(Math.round(plan.rangeLow))} ~ ${nfKrw.format(
              Math.round(plan.rangeHigh),
            )}원을 ${plan.binCount || ESCAPE_BIN_COUNT}구간으로 나누고 현재가 대비 최소 ${(
              plan.minDistancePct || ESCAPE_MIN_DISTANCE_PCT
            ).toFixed(1)}% 이격된 매물대만 반영했어요.`
          : `최근 ${plan.sampledDays || 0}일 데이터를 기준으로 매물대를 계산했어요.`;

      el.qEscapeTooltip.innerHTML = `${sampledText}<br>${targetRatioText}<br>${stopRatioText}<br>${fallbackText}`;
      if (el.qEscapeCard) {
        el.qEscapeCard.setAttribute("aria-label", "탈출 기회 계산 근거 보기");
      }
    }
  }

  const closes = data.map((c) => c.trade_price);
  const rsi14 = calculateRsi(closes, 14);
  if (el.qHeatState && el.qHeatHint) {
    if (rsi14 == null) {
      el.qHeatState.textContent = "판단 데이터 부족";
      el.qHeatState.className = "state-caution";
      el.qHeatHint.textContent =
        "RSI 계산을 위해 최소 15일 이상 데이터가 필요합니다.";
    } else if (rsi14 >= 70) {
      el.qHeatState.textContent = "매우 뜨거움";
      el.qHeatState.className = "state-risk";
      el.qHeatHint.textContent = `RSI ${rsi14.toFixed(1)}로 과열권입니다. 추격 매수는 특히 주의하세요.`;
    } else if (rsi14 <= 30) {
      el.qHeatState.textContent = "차갑게 식음";
      el.qHeatState.className = "state-safe";
      el.qHeatHint.textContent = `RSI ${rsi14.toFixed(1)}로 과매도권입니다. 분할 관찰 구간으로 볼 수 있습니다.`;
    } else {
      el.qHeatState.textContent = "중립 온도";
      el.qHeatState.className = "state-caution";
      el.qHeatHint.textContent = `RSI ${rsi14.toFixed(1)}로 과열/과매도는 아닙니다. 방향 확인이 필요합니다.`;
    }
  }
  if (el.qHeatTooltip) {
    if (rsi14 == null) {
      el.qHeatTooltip.innerHTML =
        "RSI 계산을 위해 최소 15일 이상 데이터가 필요해요.";
    } else {
      el.qHeatTooltip.innerHTML = [
        "RSI로 시장 과열/과매도를 판단해요.",
        `현재 RSI: ${rsi14.toFixed(1)}`,
        "기준: 70 이상 과열, 30 이하 과매도",
      ].join("<br>");
    }
  }
  const ma20 = movingAverage(closes, 20);
  let maSlopeForReport = null;
  if (ma20.length >= 2) {
    const maSlope = ((ma20[ma20.length - 1] - ma20[0]) / ma20[0]) * 100;
    maSlopeForReport = maSlope;
    const trendText = maSlope >= 0 ? "상승 추세 우위" : "하락 추세 우위";
    el.sTrend.textContent = `${trendText} · MA20 기울기 ${formatSignedPercent(maSlope)}`;
    setStatValueState(el.sTrend, maSlope >= 0 ? "up" : "down");
  } else {
    el.sTrend.textContent = "데이터 부족(20일 이상 필요)";
    setStatValueState(el.sTrend, "");
  }

  const labels = data.map((c) => c.candle_date_time_kst.slice(0, 10));
  const ma5Padded = paddedMovingAverage(closes, 5);
  const ma20Padded = paddedMovingAverage(closes, 20);
  const crossSignals = detectCrossSignals(
    ma5Padded,
    ma20Padded,
    labels,
    closes,
  );
  const latestCross = [...crossSignals.golden, ...crossSignals.dead].sort(
    (a, b) => a.index - b.index,
  );
  const last = latestCross[latestCross.length - 1];
  if (last) {
    const isGolden = crossSignals.golden.some(
      (item) => item.index === last.index,
    );
    el.sCross.textContent = `${last.label} · ${isGolden ? "골든크로스" : "데드크로스"}`;
    setStatValueState(el.sCross, isGolden ? "up" : "down");
  } else {
    el.sCross.textContent = "교차 없음(20일 이상 데이터 필요)";
    setStatValueState(el.sCross, "");
  }

  if (closes.length >= 14) {
    const recent7 = closes.slice(-7);
    const prev7 = closes.slice(-14, -7);
    const recentRet =
      ((recent7[recent7.length - 1] - recent7[0]) / recent7[0]) * 100;
    const prevRet = ((prev7[prev7.length - 1] - prev7[0]) / prev7[0]) * 100;
    const momentumDelta = recentRet - prevRet;
    const momentumText =
      momentumDelta >= 0 ? "상승 모멘텀 강화" : "상승 모멘텀 둔화";
    el.sMomentum.textContent = `${momentumText} · ${formatSignedPercent(momentumDelta)}`;
    setStatValueState(el.sMomentum, momentumDelta >= 0 ? "up" : "down");
  } else {
    el.sMomentum.textContent = "데이터 부족(14일 이상 필요)";
    setStatValueState(el.sMomentum, "");
  }

  const recentVol = data.slice(-7).map((c) => c.candle_acc_trade_volume);
  const priorVol = data.slice(-14, -7).map((c) => c.candle_acc_trade_volume);
  if (recentVol.length >= 7 && priorVol.length >= 7) {
    const volRatio = average(recentVol) / average(priorVol);
    let pressure = "중립";
    if (volRatio >= 1.2) pressure = "거래량 유입 확대";
    else if (volRatio <= 0.8) pressure = "거래량 둔화";
    el.sVolumePressure.textContent = `${pressure} · 직전주 대비 ${(volRatio * 100).toFixed(1)}%`;
  } else {
    el.sVolumePressure.textContent = "데이터 부족(14일 이상 필요)";
  }

  if (el.sBtcCorrelation) {
    el.sBtcCorrelation.textContent = relationship?.text || "데이터 없음";
    setStatValueState(el.sBtcCorrelation, relationship?.className || "");
  }
  if (el.sVolPriceDivergence) {
    el.sVolPriceDivergence.textContent = divergence?.text || "데이터 없음";
    setStatValueState(el.sVolPriceDivergence, divergence?.className || "");
  }

  const volRatio =
    recentVol.length >= 7 && priorVol.length >= 7
      ? average(recentVol) / average(priorVol)
      : 1;
  const breakoutRatio =
    ranges.length >= 6
      ? average(ranges.slice(-6, -1)) > 0
        ? ranges[ranges.length - 1] / average(ranges.slice(-6, -1))
        : 0
      : 0;
  const insights = buildAnalystInsights({
    pos,
    maSlope: maSlopeForReport ?? 0,
    avgAbsReturn,
    latestForce: latestForceForReport ?? 0,
    volRatio,
    breakoutRatio,
  });
  renderAnalystInsights(insights);

  const report = buildBeginnerConclusion({
    rsi: rsi14,
    maSlope: maSlopeForReport,
    corrClass: relationship?.className || "",
    latestForce: latestForceForReport,
  });
  if (el.rConclusion) {
    el.rConclusion.textContent = report.conclusion;
    el.rConclusion.className = report.className;
  }
  if (el.rReason) {
    el.rReason.textContent =
      report.reason || "데이터를 종합해 신중하게 판단하세요.";
  }

  const from = oldest.candle_date_time_kst.slice(0, 10);
  const to = latest.candle_date_time_kst.slice(0, 10);
  setStatus(`${market} · ${from} ~ ${to} · 총 ${data.length}일 데이터`);
}

function formatCandleLabel(candle, unit = "day") {
  if (unit === "day") return candle.candle_date_time_kst.slice(5, 10);
  return candle.candle_date_time_kst.slice(5, 16).replace("T", " ");
}

function candleTimeKey(candle) {
  return candle?.candle_date_time_utc || candle?.candle_date_time_kst || "";
}

function getCandleDirectionColor(candle) {
  return candle.trade_price >= candle.opening_price
    ? REALTIME_UP_COLOR
    : REALTIME_DOWN_COLOR;
}

function getCandleDirectionClass(candle) {
  return candle.trade_price >= candle.opening_price ? "up" : "down";
}

function resetRealtimeInfoBar() {
  if (!el.realtimeInfoBar) return;
  const targetText = Number.isFinite(realtimeState.targetValue)
    ? nfKrw.format(Math.round(realtimeState.targetValue))
    : "-";
  const stopText = Number.isFinite(realtimeState.stopValue)
    ? nfKrw.format(Math.round(realtimeState.stopValue))
    : "-";
  el.realtimeInfoBar.innerHTML = `
    <span class="realtime-info-bar__symbol">${realtimeState.market || "-"}</span>
    <span class="realtime-info-bar__item">O -</span>
    <span class="realtime-info-bar__item">H -</span>
    <span class="realtime-info-bar__item">L -</span>
    <span class="realtime-info-bar__item">C -</span>
    <span class="realtime-info-bar__item">변동 -</span>
    <span class="realtime-info-bar__item">VOLUME -</span>
    <span class="realtime-info-bar__item">목표가 ${targetText}</span>
    <span class="realtime-info-bar__item">손절가 ${stopText}</span>
  `;
}

function renderRealtimeInfoBar(candle, prevCandle) {
  if (!el.realtimeInfoBar || !candle) return;
  const close = Number(candle.trade_price || 0);
  const open = Number(candle.opening_price || 0);
  const high = Number(candle.high_price || 0);
  const low = Number(candle.low_price || 0);
  const vol = Number(candle.candle_acc_trade_volume || 0);
  const base = Number(prevCandle?.trade_price ?? open);
  const changePct = base ? ((close - base) / base) * 100 : 0;
  const directionClass = getCandleDirectionClass(candle);
  const changeClass = changePct >= 0 ? "up" : "down";
  const targetText = Number.isFinite(realtimeState.targetValue)
    ? nfKrw.format(Math.round(realtimeState.targetValue))
    : "-";
  const stopText = Number.isFinite(realtimeState.stopValue)
    ? nfKrw.format(Math.round(realtimeState.stopValue))
    : "-";

  el.realtimeInfoBar.innerHTML = `
    <span class="realtime-info-bar__symbol">${realtimeState.market || "-"}</span>
    <span class="realtime-info-bar__item">O ${nfKrw.format(Math.round(open))}</span>
    <span class="realtime-info-bar__item ${directionClass}">H ${nfKrw.format(Math.round(high))}</span>
    <span class="realtime-info-bar__item ${directionClass}">L ${nfKrw.format(Math.round(low))}</span>
    <span class="realtime-info-bar__item ${directionClass}">C ${nfKrw.format(Math.round(close))}</span>
    <span class="realtime-info-bar__item ${changeClass}">변동 ${formatSignedPercent(changePct)}</span>
    <span class="realtime-info-bar__item">VOLUME ${nfVol.format(vol)}</span>
    <span class="realtime-info-bar__item">목표가 ${targetText}</span>
    <span class="realtime-info-bar__item">손절가 ${stopText}</span>
  `;
}

function updateRealtimeLineToggleAvailability(targetValue, stopValue) {
  const unavailableTitle =
    "계산 가능한 목표가/손절가가 없어 표시할 선이 없습니다.";
  const updateToggle = (input, isAvailable, setShowFlag) => {
    if (!input) return;
    const label = input.closest("label");
    const wasDisabled = input.disabled;
    input.disabled = !isAvailable;
    if (!isAvailable) {
      input.checked = false;
      setShowFlag(false);
      input.title = unavailableTitle;
      if (label) label.title = unavailableTitle;
      return;
    }
    if (wasDisabled) {
      input.checked = true;
      setShowFlag(true);
    }
    input.title = "";
    if (label) label.title = "";
  };

  updateToggle(
    el.realtimeTargetToggle,
    Number.isFinite(targetValue),
    (value) => {
      realtimeState.showTargetLine = value;
    },
  );
  updateToggle(
    el.realtimeStopToggle,
    Number.isFinite(stopValue),
    (value) => {
      realtimeState.showStopLine = value;
    },
  );
}

function dedupeAndSortCandles(candles) {
  const map = new Map();
  candles.forEach((candle) => {
    const key = candleTimeKey(candle);
    if (key) map.set(key, candle);
  });
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(candleTimeKey(a)).getTime() -
      new Date(candleTimeKey(b)).getTime(),
  );
}

function getRealtimeVisualPreset(unit = "minute:30") {
  return REALTIME_VISUAL_PRESETS[unit] || REALTIME_VISUAL_PRESETS["minute:30"];
}

function getWindowCountFor24h(unit = "minute:30") {
  if (unit === "day") return 1;
  if (!unit.startsWith("minute:")) return 120;
  const minute = Number(unit.split(":")[1]);
  if (!Number.isFinite(minute) || minute <= 0) return 120;
  return Math.max(1, Math.floor((24 * 60) / minute));
}

const realtimeVisualOverlayPlugin = {
  id: "realtimeVisualOverlay",
  afterDraw(chart) {
    if (!chart?.$realtimeCandles?.length) return;
    const activeIndex = Number.isInteger(realtimeState.hoverIndex)
      ? realtimeState.hoverIndex
      : chart.$realtimeCandles.length - 1;
    const activeCandle =
      chart.$realtimeCandles[
        Math.max(0, Math.min(activeIndex, chart.$realtimeCandles.length - 1))
      ];
    const latest = chart.$realtimeCandles[chart.$realtimeCandles.length - 1];
    const yScale = chart.scales?.y;
    const xScale = chart.scales?.x;
    const yVolumeScale = chart.scales?.yVolume;
    if (!latest || !yScale) return;

    const price = Number(latest.trade_price);
    if (!Number.isFinite(price)) return;

    const isUp = price >= Number(latest.opening_price);
    const y = yScale.getPixelForValue(price);
    const { left, right } = chart.chartArea || {};
    if (!Number.isFinite(y) || left == null || right == null) return;

    const ctx = chart.ctx;
    const prevForLatest =
      chart.$realtimeCandles[chart.$realtimeCandles.length - 2];
    const latestChangePct =
      prevForLatest?.trade_price != null &&
      Number(prevForLatest.trade_price) !== 0
        ? ((price - Number(prevForLatest.trade_price)) /
            Number(prevForLatest.trade_price)) *
          100
        : 0;
    const priceText = `${nfKrw.format(Math.round(price))} ${formatSignedPercent(latestChangePct)}`;
    const bg = isUp ? REALTIME_UP_HEX : REALTIME_DOWN_HEX;
    const line = isUp ? "rgba(234,57,67,0.7)" : "rgba(59,130,246,0.7)";
    const padX = 9;
    const boxH = 22;

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font =
      "600 11px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
    const textW = ctx.measureText(priceText).width;
    const boxW = textW + padX * 2;
    const unclampedBoxX = right + 8;
    const boxX = Math.max(
      left + 2,
      Math.min(unclampedBoxX, chart.width - boxW - 2),
    );
    const boxY = y - boxH / 2;

    ctx.fillStyle = bg;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(priceText, boxX + padX, y);

    if (activeCandle && xScale && yVolumeScale) {
      const hoverY = yScale.getPixelForValue(activeCandle.trade_price);
      const activeKey = candleTimeKey(activeCandle);
      const hoverIndex = chart.$realtimeCandles.findIndex(
        (c) => candleTimeKey(c) === activeKey,
      );
      if (hoverIndex >= 0) {
        const hoverX = xScale.getPixelForValue(hoverIndex);
        const volumeTopY = yVolumeScale.getPixelForValue(yVolumeScale.max);
        ctx.strokeStyle = "rgba(107,114,128,0.55)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(left, hoverY);
        ctx.lineTo(right, hoverY);
        ctx.moveTo(hoverX, chart.chartArea.top);
        ctx.lineTo(hoverX, chart.chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.globalCompositeOperation = "destination-over";
        ctx.strokeStyle = "rgba(148,163,184,0.5)";
        ctx.beginPath();
        ctx.moveTo(left, volumeTopY);
        ctx.lineTo(right, volumeTopY);
        ctx.stroke();

        ctx.fillStyle = "rgba(148,163,184,0.12)";
        ctx.fillRect(
          left,
          volumeTopY,
          right - left,
          chart.chartArea.bottom - volumeTopY,
        );
        ctx.globalCompositeOperation = "source-over";
      }
    }
    ctx.restore();
  },
};

async function maybeLoadMoreRealtimeCandles(chart) {
  if (!chart || realtimeState.panLoadInFlight) return;
  const xScale = chart.scales?.x;
  if (!xScale) return;
  const min = Number(xScale.min);
  if (!Number.isFinite(min) || min > 2) return;

  const now = Date.now();
  if (now - realtimeState.lastPanLoadAt < realtimeState.panLoadThrottleMs)
    return;
  if (!realtimeState.oldestToCursor) return;

  realtimeState.panLoadInFlight = true;
  realtimeState.lastPanLoadAt = now;
  try {
    const raw = await requestCandles({
      market: realtimeState.market,
      count: realtimeState.extraLoadCount,
      to: realtimeState.oldestToCursor,
      unit: realtimeState.realtimeUnit,
    });
    const olderCandles = raw.reverse();
    if (!olderCandles.length) return;

    const prevLen = realtimeState.lastData.length;

    const merged = dedupeAndSortCandles([
      ...olderCandles,
      ...realtimeState.lastData,
    ]);
    const added = Math.max(0, merged.length - prevLen);
    if (!added) return;

    realtimeState.lastData = merged;
    realtimeState.oldestToCursor = candleTimeKey(merged[0]);
    renderRealtimeCandleChart(merged, realtimeState.realtimeUnit, {
      shiftWindowBy: added,
    });
  } catch (_err) {
    // silently ignore transient pan-load failures
  } finally {
    realtimeState.panLoadInFlight = false;
  }
}

function renderRealtimeCandleChart(data, unit = "minute:30", options = {}) {
  const visualPreset = getRealtimeVisualPreset(unit);
  const labels = data.map((c) => formatCandleLabel(c, unit));
  const wickData = data.map((c) => [c.low_price, c.high_price]);
  const bodyData = data.map((c) => [c.opening_price, c.trade_price]);
  const bodyColors = data.map((c) => getCandleDirectionColor(c));
  const volData = data.map((c) => Number(c.candle_acc_trade_volume || 0));
  const volColors = data.map((c) => getCandleDirectionColor(c));
  const volMax = Math.max(...volData, 1);
  const volumeScaleMax = volMax / 0.2;
  const shiftWindowBy = Number(options?.shiftWindowBy || 0);
  const dashboardEscapePlan = calculateEscapePlanByVolumeProfile(
    dashboardState.lastData,
  );
  const baseEscapePlan =
    Number.isFinite(dashboardEscapePlan?.targetPrice) ||
    Number.isFinite(dashboardEscapePlan?.stopPrice)
      ? dashboardEscapePlan
      : calculateEscapePlanByVolumeProfile(data);
  const targetValue = Number.isFinite(baseEscapePlan?.targetPrice)
    ? baseEscapePlan.targetPrice
    : null;
  const stopValue = Number.isFinite(baseEscapePlan?.stopPrice)
    ? baseEscapePlan.stopPrice
    : null;
  realtimeState.targetValue = targetValue;
  realtimeState.stopValue = stopValue;
  updateRealtimeLineToggleAvailability(targetValue, stopValue);
  const guideValues = [];
  if (realtimeState.showTargetLine && Number.isFinite(targetValue)) {
    guideValues.push(targetValue);
  }
  if (realtimeState.showStopLine && Number.isFinite(stopValue)) {
    guideValues.push(stopValue);
  }
  const localLow = Math.min(
    ...data.map((c) => c.low_price),
    ...(guideValues.length ? guideValues : [Infinity]),
  );
  const localHigh = Math.max(
    ...data.map((c) => c.high_price),
    ...(guideValues.length ? guideValues : [-Infinity]),
  );
  const span = Math.max(localHigh - localLow, 1);
  const candleMin = Math.max(0, localLow - span * 0.08);
  const candleMax = localHigh + span * 0.08;
  const targetLine = labels.map(() =>
    realtimeState.showTargetLine ? targetValue : null,
  );
  const stopLine = labels.map(() =>
    realtimeState.showStopLine ? stopValue : null,
  );

  if (charts.candleLite) {
    const prevXMin = Number(charts.candleLite.options?.scales?.x?.min);
    const prevXMax = Number(charts.candleLite.options?.scales?.x?.max);
    charts.candleLite.data.labels = labels;
    charts.candleLite.data.datasets[0].data = wickData;
    charts.candleLite.data.datasets[0].barPercentage =
      visualPreset.wickBarPercentage;
    charts.candleLite.data.datasets[0].categoryPercentage = 1;
    charts.candleLite.data.datasets[1].data = bodyData;
    charts.candleLite.data.datasets[1].barPercentage =
      visualPreset.bodyBarPercentage;
    charts.candleLite.data.datasets[1].categoryPercentage = 1;
    charts.candleLite.data.datasets[1].backgroundColor = bodyColors;
    charts.candleLite.data.datasets[1].borderColor = bodyColors;
    charts.candleLite.data.datasets[2].data = volData;
    charts.candleLite.data.datasets[2].backgroundColor = volColors;
    charts.candleLite.data.datasets[2].borderColor = volColors;
    charts.candleLite.data.datasets[3].data = targetLine;
    charts.candleLite.data.datasets[4].data = stopLine;
    charts.candleLite.options.scales.y.min = candleMin;
    charts.candleLite.options.scales.y.max = candleMax;
    charts.candleLite.options.scales.yVolume.max = volumeScaleMax;
    if (
      Number.isFinite(prevXMin) &&
      Number.isFinite(prevXMax) &&
      shiftWindowBy > 0
    ) {
      charts.candleLite.options.scales.x.min = prevXMin + shiftWindowBy;
      charts.candleLite.options.scales.x.max = prevXMax + shiftWindowBy;
    }
    const infoIndex = Number.isInteger(realtimeState.hoverIndex)
      ? realtimeState.hoverIndex
      : data.length - 1;
    const candle = data[Math.max(0, Math.min(infoIndex, data.length - 1))];
    const prev = data[Math.max(0, Math.min(infoIndex - 1, data.length - 1))];
    renderRealtimeInfoBar(candle, prev);
    charts.candleLite.$realtimeCandles = data;
    charts.candleLite.update("none");

    return;
  }

  charts.candleLite = new Chart(document.getElementById("candleLiteChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "고저 범위",
          data: wickData,
          backgroundColor: REALTIME_WICK_COLOR,
          borderColor: REALTIME_WICK_COLOR,
          borderWidth: 1,
          barPercentage: visualPreset.wickBarPercentage,
          categoryPercentage: 1,
        },
        {
          label: "시가-종가",
          data: bodyData,
          backgroundColor: bodyColors,
          borderColor: bodyColors,
          borderWidth: 1,
          barPercentage: visualPreset.bodyBarPercentage,
          categoryPercentage: 1,
        },
        {
          label: "거래량",
          data: volData,
          yAxisID: "yVolume",
          backgroundColor: volColors,
          borderColor: volColors,
          borderWidth: 1,
          barPercentage: 0.94,
          categoryPercentage: 1,
          order: 3,
        },
        {
          type: "line",
          label: "목표가(매물대)",
          data: targetLine,
          borderColor: "rgba(34,197,94,0.72)",
          borderDash: [6, 4],
          borderWidth: 1.4,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
          fill: false,
          order: 1,
        },
        {
          type: "line",
          label: "손절가(지지선)",
          data: stopLine,
          borderColor: "rgba(239,68,68,0.72)",
          borderDash: [6, 4],
          borderWidth: 1.4,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
          fill: false,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: {
        padding: { right: 62 },
      },
      interaction: { mode: "index", intersect: false },
      onHover: (_event, activeElements, chart) => {
        const idx = activeElements?.[0]?.index;
        realtimeState.hoverIndex = Number.isInteger(idx) ? idx : null;
        if (Number.isInteger(idx)) {
          const candle = chart?.$realtimeCandles?.[idx];
          const prev = idx > 0 ? chart?.$realtimeCandles?.[idx - 1] : null;
          renderRealtimeInfoBar(candle, prev);
        } else {
          const latestArr = chart?.$realtimeCandles || [];
          const latest = latestArr[latestArr.length - 1];
          const prev = latestArr[latestArr.length - 2];
          renderRealtimeInfoBar(latest, prev);
        }
        chart.draw();
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter(item) {
            return item.dataset?.label !== "고저 범위";
          },
          callbacks: {
            title(items) {
              const idx = items?.[0]?.dataIndex;
              if (idx == null) return "";
              const candle = items?.[0]?.chart?.$realtimeCandles?.[idx];
              return (
                candle?.candle_date_time_kst?.slice(0, 16).replace("T", " ") ||
                ""
              );
            },
            label(ctx) {
              const idx = ctx.dataIndex;
              const candle = ctx.chart?.$realtimeCandles?.[idx];
              if (
                ctx.dataset?.label === "목표가(매물대)" ||
                ctx.dataset?.label === "손절가(지지선)"
              ) {
                const y = Number(ctx.parsed?.y);
                if (!Number.isFinite(y)) return "";
                return `${ctx.dataset.label} ${nfKrw.format(Math.round(y))} 원`;
              }
              if (!candle) return "";
              if (ctx.dataset?.label === "거래량") {
                return `거래량 ${nfVol.format(candle.candle_acc_trade_volume || 0)}`;
              }
              return [
                `시가 ${nfKrw.format(Math.round(candle.opening_price))} 원`,
                `고가 ${nfKrw.format(Math.round(candle.high_price))} 원`,
                `저가 ${nfKrw.format(Math.round(candle.low_price))} 원`,
                `종가 ${nfKrw.format(Math.round(candle.trade_price))} 원`,
              ];
            },
          },
        },
        zoom: {
          pan: {
            enabled: true,
            mode: "x",
            threshold: 8,
            onPanComplete: ({ chart }) => {
              maybeLoadMoreRealtimeCandles(chart);
            },
          },
          zoom: {
            wheel: { enabled: true, speed: 0.08 },
            pinch: { enabled: true },
            mode: "x",
          },
          limits: {
            x: {
              minRange: realtimeState.minWindowSize,
              maxRange: realtimeState.maxWindowSize,
            },
          },
        },
      },
      scales: {
        x: {
          offset: false,
          grid: {
            color: (ctx) =>
              ctx.index % 4 === 0
                ? "rgba(148,163,184,0.16)"
                : "rgba(148,163,184,0.08)",
          },
          min: Math.max(0, labels.length - realtimeState.initialWindowSize),
          max: Math.max(1, labels.length - 1),
          ticks: {
            maxTicksLimit: 10,
            color: "rgba(139,160,199,0.95)",
            font: { size: 11 },
          },
        },
        y: {
          min: candleMin,
          max: candleMax,
          afterFit(scale) {
            scale.width = 96;
          },
          grid: {
            color: (ctx) =>
              ctx.index % 2 === 0
                ? "rgba(148,163,184,0.22)"
                : "rgba(148,163,184,0.1)",
            lineWidth: (ctx) => (ctx.index % 2 === 0 ? 1 : 0.8),
          },
          ticks: {
            color: "rgba(139,160,199,0.98)",
            font: { size: 11 },
            callback(value) {
              return nfKrw.format(Math.round(value));
            },
          },
        },
        yVolume: {
          position: "right",
          min: 0,
          max: volumeScaleMax,
          grid: { display: false, drawOnChartArea: false },
          ticks: { display: false },
          border: { display: false },
        },
      },
    },
    plugins: [realtimeVisualOverlayPlugin],
  });
  renderRealtimeInfoBar(data[data.length - 1], data[data.length - 2]);
  charts.candleLite.$realtimeCandles = data;
}

function renderCharts(data, divergenceSignals = [], escapePlan = null) {
  if (el.priceLegendHint) {
    el.priceLegendHint.textContent = PRICE_LEGEND_HINT_DEFAULT;
  }
  const labels = data.map((c) => c.candle_date_time_kst.slice(5, 10));
  const closeData = data.map((c) => c.trade_price);
  const volData = data.map((c) => c.candle_acc_trade_volume);
  const changePct = data.map((c) => c.change_rate * 100);
  const ma5 = paddedMovingAverage(closeData, 5);
  const ma20 = paddedMovingAverage(closeData, 20);
  const crossSignals = detectCrossSignals(ma5, ma20, labels, closeData);
  const activeEscapePlan =
    escapePlan || calculateEscapePlanByVolumeProfile(data);
  const goldenCrossIndexSet = new Set(
    crossSignals.golden.map((item) => item.index),
  );
  const deadCrossIndexSet = new Set(
    crossSignals.dead.map((item) => item.index),
  );
  const targetLine = labels.map(() =>
    Number.isFinite(activeEscapePlan?.targetPrice)
      ? activeEscapePlan.targetPrice
      : null,
  );
  const stopLine = labels.map(() =>
    Number.isFinite(activeEscapePlan?.stopPrice)
      ? activeEscapePlan.stopPrice
      : null,
  );

  if (charts.price && charts.volume && charts.change) {
    charts.price.data.labels = labels;
    charts.price.data.datasets[0].data = closeData;
    charts.price.data.datasets[1].data = ma5;
    charts.price.data.datasets[2].data = ma20;
    charts.price.data.datasets[3].data = crossSignals.golden.map((item) => ({
      x: item.label,
      y: item.y,
    }));
    charts.price.data.datasets[4].data = crossSignals.dead.map((item) => ({
      x: item.label,
      y: item.y,
    }));
    charts.price.data.datasets[5].data = divergenceSignals
      .filter((s) => s.type === "support")
      .map((s) => ({ x: s.label, y: s.y, signal: s }));
    charts.price.data.datasets[6].data = divergenceSignals
      .filter((s) => s.type === "breakout")
      .map((s) => ({ x: s.label, y: s.y, signal: s }));
    charts.price.data.datasets[7].data = targetLine;
    charts.price.data.datasets[8].data = stopLine;
    charts.price.$goldenCrossIndexSet = goldenCrossIndexSet;
    charts.price.$deadCrossIndexSet = deadCrossIndexSet;
    charts.price.update("none");
    renderPriceChartLegend(charts.price);

    charts.volume.data.labels = labels;
    charts.volume.data.datasets[0].data = volData;
    charts.volume.update("none");

    charts.change.data.labels = labels;
    charts.change.data.datasets[0].data = changePct;
    charts.change.data.datasets[0].backgroundColor = changePct.map((v) =>
      v >= 0 ? "rgba(22,199,132,0.5)" : "rgba(234,57,67,0.5)",
    );
    charts.change.data.datasets[0].borderColor = changePct.map((v) =>
      v >= 0 ? "rgb(22,199,132)" : "rgb(234,57,67)",
    );
    charts.change.update("none");
    return;
  }

  charts.price = new Chart(document.getElementById("priceChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "종가",
          data: closeData,
          borderColor: "#f7931a",
          backgroundColor: "rgba(247,147,26,0.18)",
          fill: true,
          tension: 0,
          cubicInterpolationMode: "monotone",
          clip: 0,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: "MA5",
          data: ma5,
          borderColor: "#22c55e",
          pointRadius: 0,
          borderWidth: 2,
          tension: 0,
          cubicInterpolationMode: "monotone",
          clip: 0,
          fill: false,
        },
        {
          label: "MA20",
          data: ma20,
          borderColor: "#3b82f6",
          pointRadius: 0,
          borderWidth: 2,
          tension: 0,
          cubicInterpolationMode: "monotone",
          clip: 0,
          fill: false,
        },
        {
          type: "scatter",
          label: "골든크로스",
          data: crossSignals.golden.map((item) => ({
            x: item.label,
            y: item.y,
          })),
          pointRadius: 5,
          pointHoverRadius: 6,
          pointBackgroundColor: "#22c55e",
          pointBorderColor: "#14532d",
          pointBorderWidth: 1,
        },
        {
          type: "scatter",
          label: "데드크로스",
          data: crossSignals.dead.map((item) => ({ x: item.label, y: item.y })),
          pointRadius: 5,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ef4444",
          pointBorderColor: "#7f1d1d",
          pointBorderWidth: 1,
        },
        {
          type: "scatter",
          label: "다이버전스(하락+거래량급증)",
          data: divergenceSignals
            .filter((s) => s.type === "support")
            .map((s) => ({ x: s.label, y: s.y, signal: s })),
          pointRadius: 5,
          pointHoverRadius: 6,
          pointBackgroundColor: "#a855f7",
          pointBorderColor: "#581c87",
          pointBorderWidth: 1,
        },
        {
          type: "scatter",
          label: "거래량급증(상승형)",
          data: divergenceSignals
            .filter((s) => s.type === "breakout")
            .map((s) => ({ x: s.label, y: s.y, signal: s })),
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: "#f59e0b",
          pointBorderColor: "#78350f",
          pointBorderWidth: 1,
        },
        {
          type: "line",
          label: "목표가(매물대)",
          data: targetLine,
          borderColor: "rgba(34,197,94,0.72)",
          borderDash: [6, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
          fill: false,
        },
        {
          type: "line",
          label: "손절가(지지선)",
          data: stopLine,
          borderColor: "rgba(239,68,68,0.72)",
          borderDash: [6, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 0,
          tension: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { right: 62 },
      },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          filter: (item) => {
            const y = item.parsed?.y;
            return y != null && !Number.isNaN(y);
          },
          callbacks: {
            label(ctx) {
              const name = ctx.dataset.label || "";
              const y = ctx.parsed.y;
              if (name === "골든크로스" || name === "데드크로스") {
                return `${name} · 당일 종가 ${nfKrw.format(Math.round(y))} 원`;
              }
              if (
                name.startsWith("다이버전스") ||
                name.startsWith("거래량급증")
              ) {
                const signal = ctx.raw?.signal;
                if (signal) {
                  return `${signal.message} · 평균 대비 ${signal.ratio.toFixed(2)}배`;
                }
              }
              return `${name}: ${nfKrw.format(Math.round(y))} 원`;
            },
            afterBody(items) {
              const idx = items?.[0]?.dataIndex;
              const chartRef = items?.[0]?.chart;
              if (idx == null) return undefined;
              if (chartRef?.$goldenCrossIndexSet?.has(idx)) {
                return ["골든크로스 발생일 (MA5가 MA20을 상향 돌파)"];
              }
              if (chartRef?.$deadCrossIndexSet?.has(idx)) {
                return ["데드크로스 발생일 (MA5가 MA20을 하향 이탈)"];
              }
              return undefined;
            },
          },
        },
      },
      scales: {
        x: {
          offset: false,
        },
        y: {
          afterFit(scale) {
            scale.width = 96;
          },
        },
      },
    },
  });
  charts.price.$goldenCrossIndexSet = goldenCrossIndexSet;
  charts.price.$deadCrossIndexSet = deadCrossIndexSet;
  renderPriceChartLegend(charts.price);

  charts.volume = new Chart(document.getElementById("volumeChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "거래량",
          data: volData,
          backgroundColor: "rgba(59,130,246,0.5)",
          borderColor: "rgb(59,130,246)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });

  charts.change = new Chart(document.getElementById("changeChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "변동률",
          data: changePct,
          backgroundColor: changePct.map((v) =>
            v >= 0 ? "rgba(22,199,132,0.5)" : "rgba(234,57,67,0.5)",
          ),
          borderColor: changePct.map((v) =>
            v >= 0 ? "rgb(22,199,132)" : "rgb(234,57,67)",
          ),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
    },
  });
}

function buildCandleApiUrl(unit = "day") {
  if (unit === "day") return DAY_CANDLE_API_URL;
  if (unit.startsWith("minute:")) {
    const minute = Number(unit.split(":")[1]);
    if ([1, 3, 5, 10, 15, 30, 60, 240].includes(minute)) {
      return `/api/upbit/candles?unit=minute:${minute}`;
    }
  }
  throw new Error("지원하지 않는 차트 기준입니다.");
}

async function requestCandles({ market, count, to, unit = "day" }) {
  const url = new URL(buildCandleApiUrl(unit), window.location.origin);
  url.searchParams.set("market", market);
  url.searchParams.set("count", String(count));
  if (to) url.searchParams.set("to", to);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API 요청 실패 (${res.status})`);
  }
  return res.json();
}

async function fetchCandlesWithPaging({
  market,
  totalCount,
  to,
  unit = "day",
}) {
  const safeTotalCount = Math.max(0, Number(totalCount) || 0);
  if (safeTotalCount === 0) return [];

  let remain = safeTotalCount;
  let cursorTo = to;
  const merged = [];

  while (remain > 0) {
    const count = Math.min(remain, MAX_CANDLE_COUNT_PER_REQUEST);
    const raw = await requestCandles({ market, count, to: cursorTo, unit });
    if (!Array.isArray(raw) || raw.length === 0) break;

    merged.push(...raw);
    remain -= raw.length;
    if (raw.length < count) break;

    const oldest = raw[raw.length - 1];
    cursorTo = oldest?.candle_date_time_utc || oldest?.candle_date_time_kst;
    if (!cursorTo) break;
  }

  return dedupeAndSortCandles(merged);
}

async function fetchByPreset(market, days, unit = "day") {
  const to = `${todayString()}T00:00:00Z`;
  return fetchCandlesWithPaging({ market, totalCount: days, to, unit });
}

async function fetchByDateRange(market, startDate, endDate, unit = "day") {
  if (unit !== "day") {
    throw new Error(
      "분봉은 기간 조회만 지원합니다. 조회 방식을 '기간'으로 바꿔주세요.",
    );
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("시작일/종료일을 올바르게 입력하세요.");
  }
  if (start > end) {
    throw new Error("시작일은 종료일보다 이후일 수 없습니다.");
  }

  const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const to = `${endDate}T00:00:00Z`;
  const chronological = await fetchCandlesWithPaging({
    market,
    totalCount: diffDays,
    to,
    unit,
  });

  return chronological.filter((c) => {
    const d = c.candle_date_time_kst.slice(0, 10);
    return d >= startDate && d <= endDate;
  });
}

function getCurrentQueryFromControls() {
  const mode = document.querySelector('input[name="rangeMode"]:checked').value;
  return {
    market: el.marketSelect.value,
    mode,
    presetDays: Number(el.preset.value),
    startDate: el.startDate.value,
    endDate: el.endDate.value,
  };
}

function getRealtimeConfigFromControls() {
  const realtimeUnit = el.realtimeUnit?.value || realtimeState.realtimeUnit;
  const realtimeCount = Number(
    el.realtimeCount?.value || realtimeState.realtimeCount,
  );
  return {
    unit: realtimeUnit,
    count: Number.isFinite(realtimeCount) ? realtimeCount : 120,
  };
}

async function buildRelationshipForMarket(
  { market, mode, presetDays, startDate, endDate },
  data,
) {
  if (market === "KRW-BTC") {
    return { text: "해당 없음 (기준 자산)", className: "", corr: null };
  }

  try {
    let btcData;
    if (mode === "preset") {
      btcData = await fetchByPreset("KRW-BTC", presetDays, "day");
    } else {
      btcData = await fetchByDateRange("KRW-BTC", startDate, endDate, "day");
    }

    const aligned = buildAlignedReturnSeries(data, btcData);
    const corr = pearsonCorrelation(aligned.coinReturns, aligned.btcReturns);
    if (corr == null) {
      return {
        text: `데이터 부족 (교집합 ${aligned.commonDates.length}일)`,
        className: "",
        corr: null,
      };
    }

    const status = classifyCorrelation(corr);
    return {
      text: `r=${corr.toFixed(2)} · ${status.text} (교집합 ${aligned.commonDates.length}일)`,
      className: status.className,
      corr,
    };
  } catch (_err) {
    return { text: "BTC 데이터 조회 실패", className: "down", corr: null };
  }
}

async function fetchDashboardPayload(query) {
  let data;
  if (query.mode === "preset") {
    data = await fetchByPreset(query.market, query.presetDays, "day");
  } else {
    data = await fetchByDateRange(
      query.market,
      query.startDate,
      query.endDate,
      "day",
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return {
      data: [],
      relationship: null,
      divergenceSignals: [],
      divergenceSummary: null,
    };
  }

  const relationship = await buildRelationshipForMarket(query, data);
  const divergenceSignals = detectVolumePriceDivergence(data);
  const divergenceSummary = summarizeDivergence(divergenceSignals);
  const escapePlan = calculateEscapePlanByVolumeProfile(data);

  return {
    data,
    relationship,
    divergenceSignals,
    divergenceSummary,
    escapePlan,
  };
}

function renderDashboardPayload(query, payload) {
  renderCharts(payload.data, payload.divergenceSignals, payload.escapePlan);
  analyze(
    payload.data,
    query.market,
    payload.relationship,
    payload.divergenceSummary,
    payload.escapePlan,
  );
  dashboardState.lastQuery = query;
  dashboardState.lastData = payload.data;
  dashboardState.lastRelationship = payload.relationship;
  dashboardState.lastDivergenceSummary = payload.divergenceSummary;
}

async function fetchRealtimeCandles({ market, unit, count }) {
  const to = new Date().toISOString();
  const raw = await requestCandles({ market, count, to, unit });
  return raw.reverse();
}

function renderRealtimePayload(market, unit, candles) {
  realtimeState.market = market;
  realtimeState.realtimeUnit = unit;
  realtimeState.lastData = dedupeAndSortCandles(candles);
  realtimeState.oldestToCursor = candleTimeKey(realtimeState.lastData[0]);
  realtimeState.panLoadInFlight = false;
  realtimeState.hoverIndex = null;
  renderRealtimeCandleChart(realtimeState.lastData, unit);
}

// 퍼블릭 실시간(WebSocket ticker) 연동을 붙일 때 사용할 최소 훅.
function applyPublicTickerPatch(tickerPayload) {
  if (!tickerPayload || !realtimeState.lastData.length || !realtimeState.market)
    return;
  if (tickerPayload.market && tickerPayload.market !== realtimeState.market)
    return;
  const tradePrice = Number(tickerPayload.trade_price);
  if (!Number.isFinite(tradePrice)) return;

  const latest = realtimeState.lastData[realtimeState.lastData.length - 1];
  realtimeState.lastData[realtimeState.lastData.length - 1] = {
    ...latest,
    trade_price: tradePrice,
    high_price: Math.max(latest.high_price, tradePrice),
    low_price: Math.min(latest.low_price, tradePrice),
  };

  const now = Date.now();
  if (now - realtimeState.lastRenderAt < 250) return;
  realtimeState.lastRenderAt = now;
  renderRealtimeCandleChart(realtimeState.lastData, realtimeState.realtimeUnit);
}

function parseWsMessage(raw) {
  if (typeof raw === "string") return JSON.parse(raw);
  if (raw instanceof Blob) {
    return raw.text().then((text) => JSON.parse(text));
  }
  return null;
}

function getTickerTargetMarket() {
  return realtimeState.market || el.marketSelect.value || "KRW-BTC";
}

function sendTickerSubscription(socket, market) {
  if (!socket || socket.readyState !== WebSocket.OPEN || !market) return;
  const message = [
    { ticket: `upbit-dashboard-${Date.now()}` },
    { type: "ticker", codes: [market] },
    { format: "DEFAULT" },
  ];
  socket.send(JSON.stringify(message));
  wsState.subscribedMarket = market;
}

function scheduleTickerReconnect() {
  if (!wsState.enabled || wsState.reconnectTimer) return;
  wsState.reconnectTimer = setTimeout(() => {
    wsState.reconnectTimer = null;
    connectPublicTickerStream();
  }, 1200);
}

function connectPublicTickerStream() {
  if (!wsState.enabled) return;
  if (
    wsState.socket &&
    (wsState.socket.readyState === WebSocket.OPEN ||
      wsState.socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const socket = new WebSocket(WS_URL);
  wsState.socket = socket;

  socket.addEventListener("open", () => {
    sendTickerSubscription(socket, getTickerTargetMarket());
  });

  socket.addEventListener("message", async (event) => {
    try {
      const payload = await parseWsMessage(event.data);
      if (!payload || payload.type !== "ticker") return;
      applyPublicTickerPatch(payload);
    } catch (_err) {
      // ignore malformed ws payload
    }
  });

  socket.addEventListener("close", () => {
    wsState.socket = null;
    wsState.subscribedMarket = "";
    scheduleTickerReconnect();
  });

  socket.addEventListener("error", () => {
    socket.close();
  });
}

function resubscribeTickerIfNeeded() {
  const market = getTickerTargetMarket();
  if (!market) return;
  if (!wsState.socket || wsState.socket.readyState !== WebSocket.OPEN) {
    connectPublicTickerStream();
    return;
  }
  if (wsState.subscribedMarket === market) return;
  sendTickerSubscription(wsState.socket, market);
}

async function refreshRealtimeChart() {
  const market = el.marketSelect.value;
  if (!market) return;
  const { unit, count } = getRealtimeConfigFromControls();
  realtimeState.initialWindowSize = getWindowCountFor24h(unit);
  realtimeState.realtimeCount = count;
  const candles = await fetchRealtimeCandles({ market, unit, count });
  if (!Array.isArray(candles) || !candles.length) return;
  renderRealtimePayload(market, unit, candles);
  resubscribeTickerIfNeeded();
}

async function handleFetch() {
  const query = getCurrentQueryFromControls();
  trackAnalyticsEvent("fetch_click", {
    market: query.market || "unknown",
    range_mode: query.mode,
    preset_days: query.mode === "preset" ? query.presetDays : undefined,
  });
  if (!query.market) {
    setStatus("코인을 선택하세요.");
    return;
  }

  try {
    el.fetchBtn.disabled = true;
    setStatus("업비트 API에서 데이터를 조회 중입니다...");

    const payload = await fetchDashboardPayload(query);
    if (!payload.data.length) {
      setStatus("조회된 데이터가 없습니다. 기간 또는 마켓 코드를 확인하세요.");
      destroyDashboardCharts();
      return;
    }
    renderDashboardPayload(query, payload);
  } catch (err) {
    setStatus(`오류: ${err.message}`);
    destroyDashboardCharts();
  } finally {
    el.fetchBtn.disabled = false;
  }
}

document.querySelectorAll('input[name="rangeMode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    toggleMode();
    trackAnalyticsEvent("range_mode_change", {
      range_mode: radio.value,
    });
  });
});

el.fetchBtn.addEventListener("click", handleFetch);
if (el.themeToggleBtn) {
  el.themeToggleBtn.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    setTheme(current === "dark" ? "light" : "dark");
  });
}
if (el.realtimeUnit) {
  el.realtimeUnit.addEventListener("change", () => {
    refreshRealtimeChart().catch((err) =>
      setStatus(`실시간 차트 오류: ${err.message}`),
    );
  });
}
if (el.realtimeCount) {
  realtimeState.initialWindowSize =
    Number(el.realtimeCount.value) || realtimeState.initialWindowSize;
  el.realtimeCount.addEventListener("change", () => {
    realtimeState.initialWindowSize =
      Number(el.realtimeCount.value) || realtimeState.initialWindowSize;
    refreshRealtimeChart().catch((err) =>
      setStatus(`실시간 차트 오류: ${err.message}`),
    );
  });
}
if (el.realtimeTargetToggle) {
  el.realtimeTargetToggle.addEventListener("change", () => {
    realtimeState.showTargetLine = Boolean(el.realtimeTargetToggle.checked);
    if (realtimeState.lastData.length) {
      renderRealtimeCandleChart(
        realtimeState.lastData,
        realtimeState.realtimeUnit,
      );
    }
  });
}
if (el.realtimeStopToggle) {
  el.realtimeStopToggle.addEventListener("change", () => {
    realtimeState.showStopLine = Boolean(el.realtimeStopToggle.checked);
    if (realtimeState.lastData.length) {
      renderRealtimeCandleChart(
        realtimeState.lastData,
        realtimeState.realtimeUnit,
      );
    }
  });
}
el.marketSearch.addEventListener("input", (e) =>
  filterMarketOptions(e.target.value),
);
el.marketSelect.addEventListener("change", () => {
  trackAnalyticsEvent("market_change", {
    market: el.marketSelect.value || "unknown",
  });
  refreshRealtimeChart().catch((err) =>
    setStatus(`실시간 차트 오류: ${err.message}`),
  );
});
el.preset.addEventListener("change", () => {
  trackAnalyticsEvent("preset_change", {
    preset_days: Number(el.preset.value),
  });
});
bindExpertToggle();

setDefaultDates();
toggleMode();
initTheme();

// 디버그/확장용: 퍼블릭 WS ticker 연결 시 이 훅을 재사용한다.
window.publicDashboardHooks = {
  refetch: handleFetch,
  applyTickerPatch: applyPublicTickerPatch,
  connectTicker: connectPublicTickerStream,
  resubscribeTicker: resubscribeTickerIfNeeded,
};

loadMarketList()
  .then(() => {
    // 첫 화면이 빈 페이지처럼 보이지 않도록 BTC를 즉시 조회한다.
    connectPublicTickerStream();
    handleFetch();
    refreshRealtimeChart();
  })
  .catch((err) => {
    setStatus(`코인 목록 로드 실패: ${err.message}`);
    el.marketSelect.innerHTML =
      '<option value="KRW-BTC" selected>비트코인 (BTC)</option>';
    connectPublicTickerStream();
    handleFetch();
    refreshRealtimeChart();
  });

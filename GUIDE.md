# 코린이 구조대: 기술 지표 및 로직 가이드

본 프로젝트는 업비트(Upbit) Open API에서 받은 **일봉·분봉 캔들 데이터**를 바탕으로, 시장 맥락을 빠르게 훑어볼 수 있게 돕는 **정보용·휴리스틱 지표**를 보여 줍니다. 구현은 주로 `app.js`에 있으며, 아래는 화면에 나오는 판단 기준을 **사람이 읽기 쉽게** 정리한 설명입니다.

> **투자 자문이 아닙니다.** 수익·손실 책임은 이용자 본인에게 있습니다.

수치·수식·임계값을 코드와 1:1로 맞춰 보려면 [INDICATORS.md](./INDICATORS.md)를 함께 참고하세요.

---

## 1. 가격 위치와 시장 열기

최근 **최대 30일** 구간의 **저가~고가** 안에서 **현재 종가**가 어디쯤인지 **0~100%**로 환산합니다. 퀵 카드는 대략 **20% 이하·80% 이상**을 “싸다/비싸다” 쪽으로, 전문가 영역은 같은 수치를 **바닥·저점·중립·고점·천장**처럼 더 잘게 나눠 표시합니다.

**RSI(14)**는 흔히 쓰는 스무딩 방식으로 계산하고, **최소 15일** 정도의 종가가 필요합니다. **70 이상**은 과열, **30 이하**는 과매도로 읽고, 그 사이는 중립 온도로 둡니다.

---

## 2. 변동성과 추세·모멘텀

조회한 기간 전체에 대해, 날마다 **|등락률|×100**의 평균(**평균 일변동**)과 **(고가−시가)/시가×100**의 평균(**평균 일중 변동폭**)을 같이 봅니다. 둘 중 하나라도 크면 **고변동**, 둘 다 작으면 **저변동**, 나머지는 **보통**으로 나눕니다. 또 **오늘**의 일중 변동폭이 **직전 5일 평균의 2배 이상**이면 “변동성 확대” 쪽 메시지를 냅니다.

**MA20 기울기**는 조회 구간에서 잡힌 MA20의 **처음 값 대비 마지막 값** 변화율로 추세 방향을 말합니다. **모멘텀**은 **최근 7일 수익률**에서 **그 직전 7일 수익률**을 뺀 값으로, “가속/둔화”를 짧게 요약합니다(최소 약 14일 필요).

---

## 3. 매물대 스타일 탈출 참고(거래량 프로파일)

호가창이 아니라, **최근 30일** 가격 **저~고**를 **10구간**으로 나눈 뒤, 각 일의 **종가가 속한 구간**에 **그날 거래량**을 쌓습니다. 현재가보다 위·아래에서 **최소 1% 이상 떨어진** 구간만 후보로 하고, 가능하면 **2% 이상** 이격을 우선한 뒤, **거래량이 가장 많이 쌓인 구간**을 **목표·손절 참고선**으로 고릅니다. 아래 후보가 애매하면 **MA20**이나 **최근 스윙 저점**으로 대체할 수 있습니다. “매물 강도”는 해당 구간 거래량이 **전 구간 최대 대비 몇 %**인지로 얇다/보통/단단함 정도를 말합니다.

---

## 4. 에너지와 동조화

**Force**는 대략 **(전일 대비 종가 변화)×당일 거래량**으로 날마다 에너지를 만들고, **최근 30일** 안에서의 **최대 절댓값**으로 나눠 **대략 −100~100** 근처로 보여 줍니다.

**BTC 동조화**는 코인과 BTC의 **일간 등락률**로 **피어슨 상관**을 냅니다. **눈치 게임 카드**는 **0.8 이상·0.3 이하·그 사이**로 강/약/중간을 나눕니다. **맞춤 리포트**와 **전문가 패널** 쪽은 **같은 상관값이라도 문구와 구간이 다를 수 있으니**, 세부 숫자는 [INDICATORS.md](./INDICATORS.md)를 보시면 됩니다.

---

## 5. 이상 신호 휴리스틱(가짜 하락·다이버전스)

**개미털기 주의**는 **하락 폭이 동적 임계(직전 5일 평균 변동×1.6, 2~6%로 제한)**를 넘는지 본 뒤, **오늘 거래량이 직전 5일 평균의 60% 미만**일 때만 “가격 급락 + 거래량 부족”으로 묶어 경고합니다.

**거래량–가격 다이버전스**는 **직전 20일 평균 거래량의 1.8배**를 넘는 날을 잡고, 그날이 **음봉/양봉**인지에 따라 메시지를 달리합니다.

---

## 6. 맞춤 리포트(참고용 종합 점수)

RSI·MA20 기울기·BTC 상관 클래스·당일 Force 부호에 **소수 단위 가중**을 더해 하나의 점수로 합친 뒤, **대략 세 구간**으로 결론 문구를 고릅니다. 이는 **매매 신호가 아니라** 같은 화면의 여러 힌트를 한 줄로 압축한 것입니다.

---

## 주의

위 내용은 **업비트 API 필드와 코드에 적힌 규칙**을 설명한 것이며, 백테스트·최적화·통계적 검증으로 “증명된 전략”을 의미하지 않습니다. 모든 매매 결정과 결과는 **본인 책임**입니다.

---

## 관련 문서

| 문서 | 용도 |
|------|------|
| [INDICATORS.md](./INDICATORS.md) | 수식·임계값·분기 순서 (코드 대조용) |
| [PRD.md](./PRD.md) | 제품 범위·시나리오 |

---

# English

**Coin Newbie Rescue Squad — technical indicators and logic (guide)**

This project shows **informational, heuristic indicators** built from **daily and minute candles** fetched from the Upbit Open API, to help you scan market context quickly. Implementation lives mainly in `app.js`; below is a **human-readable** summary of what the UI is judging.

> **Not investment advice.** You are responsible for gains and losses.

For numbers, formulas, and thresholds matched 1:1 with the code, see [INDICATORS.md](./INDICATORS.md) as well.

---

## 1. Price position and market “heat”

Over the last **30 days at most**, we map **where the latest close sits** between the **low and high** of that window, scaled to **0–100%**. Quick cards treat roughly **≤20% / ≥80%** as “cheap / expensive” territory; the pro panel splits the same idea more finely (floor, low, neutral, high, ceiling, etc.).

**RSI(14)** uses a common smoothing recipe and needs about **15 closes** at minimum. **≥70** reads as overbought, **≤30** as oversold; between them is neutral “temperature”.

---

## 2. Volatility, trend, and momentum

Across the whole selected range, we look at the average of **|daily return|×100** (**average daily move**) and the average of **(high−open)/open×100** (**average intraday range**). If **either** is large → **high volatility**; if **both** are small → **low**; otherwise **normal**. If **today’s** intraday range is **≥2× the prior 5-day average**, we surface a “volatility expansion” style message.

**MA20 slope** is the **percent change from the first to the last MA20** value in the selected window. **Momentum** is **last 7-day return minus the previous 7-day return**, summarizing acceleration vs. slowdown (needs ~14 days minimum).

---

## 3. Supply-zone style breakout hints (volume profile)

Not the order book: we split the last **30 days’** **low–high** into **10 bins**, then **stack each day’s volume** into the bin where **that day’s close** falls. We only consider bins **≥1% away** from the current price (prefer **≥2%** when possible), then pick the **busiest bin** as **target / stop reference** lines. If the downside candidate is weak, we may fall back to **MA20** or a **recent swing low**. “Supply strength” is how that bin’s volume compares to the **max across bins** (thin / normal / heavy).

---

## 4. Energy and correlation

**Force** is roughly **(change in close vs. prior close)×volume** per day, then scaled by the **max absolute value in the last 30 days** so it lands near **about −100 to 100**.

**BTC correlation** is **Pearson correlation** of **daily returns** between the asset and BTC. The **quick “follow BTC” card** buckets **≥0.8, ≤0.3, and between** as strong / weak / middling. **Custom report** and **pro panel** may **word or bucket the same correlation differently**; see [INDICATORS.md](./INDICATORS.md) for exact numbers.

---

## 5. Anomaly heuristics (fake dip, divergence)

**Shakeout watch** checks whether the drop exceeds a **dynamic threshold (prior 5-day average move×1.6, clamped 2–6%)**, and only then, if **today’s volume is below 60% of the prior 5-day average**, flags “sharp price drop + thin volume”.

**Volume–price divergence** picks days above **1.8× the prior 20-day average volume** and varies the message for **red vs. green** candles.

---

## 6. Custom report (reference composite score)

We blend RSI, MA20 slope, BTC correlation class, and the sign of today’s Force with **fractional weights** into one score, then map it to **roughly three** conclusion lines. This **compresses several on-screen hints into one line**, not a trading signal.

---

## Important

The above explains **Upbit API fields and the rules encoded in the code**. It is **not** a backtested, optimized, or statistically validated “proven strategy.” All trading decisions and outcomes are **your responsibility**.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [INDICATORS.md](./INDICATORS.md) | Formulas, thresholds, branch order (for code cross-check) |
| [PRD.md](./PRD.md) | Product scope and scenarios |

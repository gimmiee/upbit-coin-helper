# 지표·점수 로직 설명서

이 문서는 **코린이 구조대** 화면에 나오는 수치와 문구가 **어떤 입력 데이터로, 어떤 식과 규칙으로 계산되는지**를 정리한 것입니다.  
구현 기준은 저장소의 `app.js`이며, 수치 일부는 업비트 API 필드 정의에 따릅니다.

줄글로 먼저 훑어보려면 [GUIDE.md](./GUIDE.md)를 보세요.

---

## 0. 먼저 읽어 주세요

- 본 서비스는 **투자 자문이 아닙니다.** 지표는 **교육·정보용 휴리스틱**에 가깝습니다.
- **“도출”의 의미**
  - **RSI, 이동평균, 상관계수** 등은 널리 쓰이는 **정의/공식**을 코드로 옮긴 것입니다.
  - **70/30, 20/80%, 3%·1.2%** 같은 **임계값**과 **맞춤 리포트 점수 규칙**은 “시장에서 자주 쓰는 감각 + UI에서 이해하기 쉬운 구간 나누기”를 위해 **제품 쪽에서 고정한 값**입니다. 통계학·금융공학에서 유도한 최적값이 아닙니다.
- 조회 기간이 짧으면 “데이터 부족” 분기로 빠지는 지표가 있습니다. 각 절에서 **최소 일수**를 적어 두었습니다.

**입력 캔들(일봉)**에서 주로 쓰는 필드:

- `trade_price`: 종가로 사용
- `opening_price`, `high_price`, `low_price`
- `change_rate`: API 기준 일간 등락률(코드에서 `%`로 쓸 때 `× 100`)
- `candle_acc_trade_volume`: 당일 누적 거래량

---

## 1. 💰 지금 가격이 싼가요? (30일 구간 위치)

### 1.1 무엇을 보는지

최근 **최대 30개** 일봉(데이터가 30개 미만이면 있는 만큼)의 **저가 최솟값** \(L\)과 **고가 최댓값** \(H\)을 잡고, **마지막 봉 종가** \(P\)가 그 구간에서 어디쯤인지 백분위로 환산합니다.

\[
\text{pos} = \begin{cases}
50 & H = L \ (\text{변동 없음}) \\
100 \times \dfrac{P - L}{H - L} & \text{그 외}
\end{cases}
\]

그다음 0~100으로 **클램프**(min/max)합니다.

### 1.2 퀵 카드 문구 (넓은 구간)

| 조건 | 상태 문구 |
|------|-----------|
| pos ≤ 20% | 비교적 저렴한 구간 |
| pos ≥ 80% | 비교적 비싼 구간 |
| 그 사이 | 중간 가격대 |

### 1.3 전문가 패널 라벨 (더 잘게 쪼갠 구간)

같은 `pos`로 텍스트만 세분화합니다. (코드는 위에서 아래 순으로 `if` 체인)

| 조건 | 라벨 |
|------|------|
| pos ≤ 15% | 바닥권 |
| pos ≤ 35% | 저점권 |
| pos ≥ 85% | 천장권 |
| pos ≥ 65% | 고점권 |
| 그 외 | 중립권 |

**색 강조**(상태 클래스): pos ≤ 30 → 상승 톤, pos ≥ 70 → 하락 톤(코드상 `up`/`down` 클래스).

---

## 2. 🌡️ 시장 열기 (RSI)

### 2.1 정의

전형적인 **RSI(14)**입니다. 연속된 **종가** 시퀀스에 대해, 첫 14구간은 단순 평균으로 평균 이익/평균 손실을 만들고, 이후는 **스무딩(이전 평균 기반 갱신)** 방식으로 갱신합니다. `avgLoss === 0`이면 RSI = 100으로 둡니다.

### 2.2 데이터 조건

- 종가 개수가 **period(14)보다 많아야** 계산합니다 → 실질적으로 **최소 15일** 이상 권장.

### 2.3 구간 문구

| 조건 | 퀵 카드 상태 |
|------|----------------|
| RSI ≥ 70 | 매우 뜨거움 (과열권) |
| RSI ≤ 30 | 차갑게 식음 (과매도권) |
| 그 사이 | 중립 온도 |

---

## 3. 🌊 흔들림 (변동성 레짐·퀵 카드)

조회된 **전체 일봉 구간**을 대상으로 두 종류의 평균을 냅니다.

### 3.1 평균 일변동 `avgAbsReturn`

각 일 `i`에 대해:

\[
r_i = |\texttt{change\_rate}_i| \times 100 \ (\%)
\]

구간 전체에 대해 \(r_i\)의 **산술 평균**이 `avgAbsReturn`입니다.

### 3.2 평균 일중 변동폭 `avgRange`

각 일 `i`에 대해:

\[
\text{range}_i = \frac{H_i - O_i}{O_i} \times 100 \ (\%)
\]

\(O_i\): 시가, \(H_i\): 고가. 구간 전체에 대한 **산술 평균**이 `avgRange`입니다.

### 3.3 레짐 분류 (OR / AND 주의)

| 레짐 | 조건 |
|------|------|
| 고변동성 | `avgAbsReturn ≥ 3` **또는** `avgRange ≥ 5` |
| 저변동성 | `avgAbsReturn ≤ 1.2` **그리고** `avgRange ≤ 2` |
| 보통 | 위 둘에 해당하지 않음 |

퀵 카드 문구는 위 레짐에 맞춰 “많이 흔들리는 장 / 잔잔한 장 / 보통”으로 매핑됩니다.

### 3.4 변동성 돌파(전문가 패널 한 줄)

- **최소 6일** 필요: **오늘(마지막 봉)**의 `range`를 **직전 5일 `range` 평균**으로 나눈 비율 `breakoutRatio`.
- `breakoutRatio ≥ 2` → “주의: 변동성 확대 (n배)”, 미만이면 “정상 범위”.

---

## 4. 🚪 탈출 기회 (매물대 스타일 목표가·손절가)

실제 호가창이 아니라, **최근 일봉 종가·거래량을 가격 구간에 쌓아 올린 히스토그램**으로 **참고용** 저항/지지 후보를 고릅니다.

### 4.1 파라미터 (코드 상수)

| 이름 | 값 | 의미 |
|------|-----|------|
| `ESCAPE_LOOKBACK_DAYS` | 30 | 최근 N일(실제로는 데이터가 적으면 그만큼만) |
| `ESCAPE_BIN_COUNT` | 10 | 저~고 구간을 몇 칸으로 나눌지 |
| `ESCAPE_MIN_DISTANCE_PCT` | 1.0 | 현재가와 후보 구간 중심이 **최소 이격**(%) |
| `ESCAPE_PREFERRED_DISTANCE_PCT` | 2.0 | 가능하면 이보다 **멀리** 떨어진 구간을 우선 |
| `ESCAPE_FALLBACK_SWING_LOOKBACK` | 10 | 스윙 저점 후보 탐색 시 최근 M일 |

### 4.2 절차 요약

1. 룩백 구간의 **저가 최솟값·고가 최댓값**으로 가로 막대 10개 구간을 만듦.
2. 각 일봉 **종가가 속한 구간**에 그 일의 **누적 거래량**을 더함.
3. **목표(위쪽)**: 현재가보다 위 구간 중, 중심가가 현재가에서 **≥ 1%** 위에 있는 것만 후보. 그중 **거래량 합이 최대**인 구간 선택(동률이면 **현재가에서 더 먼** 쪽). `PREFERRED 2%`는 후보 중 2% 이상 이격만 먼저 걸러 **그 안에서** 고름.
4. **손절(아래쪽)**: 대칭으로 아래 구간에서 동일.
5. 아래쪽을 못 고르면 **MA20**(전체 시계열로 계산한 20일 이평의 최신값)이 현재가 아래이고 1% 이상 이격이면 **MA20을 손절 대체선**으로 사용.
6. 그래도 없으면 룩백 구간의 **최근 10일 저가 중 최솟값**을 스윙 저점 후보로 사용(역시 이격 조건 충족 시).

### 4.3 표시되는 퍼센트

- `upsidePct = (targetPrice - current) / current × 100`
- `riskPct = (stopPrice - current) / current × 100` (지지가 아래이므로 보통 음수)

### 4.4 매물 “강도” 문구

선택된 구간 거래량 ÷ **전 구간 중 최대 거래량**:

| 비율 | 문구 |
|------|------|
| ≥ 0.8 | 매우 단단함 |
| ≥ 0.45 | 보통 |
| 그 미만 | 얇음 |

### 4.5 퀵 카드 상단 상태 문구 (분기 순서 중요)

코드는 **`if`를 위에서 아래로** 평가하고, **먼저 참이 된 분기가 채택**됩니다.

1. `riskPct`가 유한하고 **`> -1`** → “지지선 근처 - 주의 깊게 관찰”
2. 그렇지 않고 `riskPct > -3` → “리스크 관리 필요”
3. 그렇지 않고 `riskPct ≤ -3` → “도망칠 준비 구간”
4. 그렇지 않고 `0 ≤ upsidePct ≤ 2` → “수익 실현 준비 구간”
5. 그렇지 않고 `upsidePct > 2` **그리고** `riskPct < -2` → “상승 여력 우세”
6. 위 어느 것도 아니면 → “탈출 전략 점검”

`riskPct`가 없거나(NaN 등) 앞 조건들이 안 맞으면 아래쪽 `upside` 분기로 넘어갈 수 있습니다.

---

## 5. 🕵️ 개미털기 감별사 (가짜 하락 휴리스틱)

**급락 + 상대적으로 얇은 거래량**이 동시에 나온 날을 “주의”로 보는 **단순 규칙**입니다.

### 5.1 데이터

- **오늘 1봉 + 직전 5일** → 총 6일 분량 필요. 부족하면 “판별 대기”.

### 5.2 하락 임계치 `thresholdPct`

직전 5일 각 일의 \(|\texttt{change\_rate}| \times 100\) 평균을 `avgAbsReturnPct`라 하면:

\[
\text{thresholdPct} = \mathrm{clamp}\big( \text{avgAbsReturnPct} \times 1.6,\ 2,\ 6 \big)
\]

즉 **2%~6%** 사이로 자릅니다.

### 5.3 가격 조건

- **장중**: \((\text{종가}-\text{시가})/\text{시가} \times 100 ≤ -\text{thresholdPct}\)
- **또는** **전일 대비**: \((\text{종가}-\text{전일 종가})/\text{전일 종가} \times 100 ≤ -\text{thresholdPct}\)

### 5.4 거래량 조건

- 오늘 누적 거래량 ÷ **직전 5일 평균 거래량** = `volumeRatio`
- **개미 털기 주의보**: 가격 조건 **그리고** `volumeRatio < 0.6`
- **약한 신호**: 가격 조건 참이고 `0.6 ≤ volumeRatio < 0.75`
- 그 외 “정상 하락 또는 확인 필요” 등

---

## 6. 🎮 비트코인 눈치 게임 vs 전문가 BTC 동조화

둘 다 **공통 날짜**에 대해 코인·BTC의 **일간 `change_rate`**로 **피어슨 상관계수** \(r\)를 구합니다(쌍이 5개 미만이면 계산 안 함).

### 6.1 눈치 게임 카드 (알트 전용)

| \(r\) | 상태 |
|--------|------|
| \(r \ge 0.8\) | 커플(High) |
| \(r \le 0.3\) | 남남(Low) |
| 그 사이 | 썸 타는 중(Mid) |

`KRW-BTC` 선택 시에는 비교 대상이 없어 “해당 없음” 처리.

### 6.2 전문가 패널 `classifyCorrelation` (점수 연동에 쓰임)

| \(r\) | 문구 | `className` |
|--------|------|-------------|
| \(r \ge 0.7\) | BTC와 강한 동조 | up |
| \(r \ge 0.4\) | BTC와 부분 동조 | (중립) |
| \(r \ge 0\) | 상대적 독립 흐름 가능 | down |
| \(r < 0\) | 역행 흐름(음의 상관) | down |

**같은 상관값이라도 카드와 패널 문구가 다를 수 있습니다.** 임계값이 의도적으로 다릅니다.

---

## 7. 오늘의 코린이 맞춤 리포트 (점수)

여러 지표를 **가중치가 다른 점수**로 합산한 뒤, 구간으로 결론 문구를 고릅니다.

### 7.1 항목별 가감

| 항목 | 규칙 | 점수 |
|------|------|------|
| RSI | ≥ 70 | −2 |
| RSI | ≤ 30 | +1 |
| RSI | 그 사이 | 0 |
| MA20 기울기 | 전체 구간 MA20의 **첫 값→마지막 값** 변화율(%) > 0.3 | +1 |
| MA20 기울기 | < −0.3 | −1 |
| MA20 기울기 | 그 사이 | 0 |
| BTC 상관 | `className === "up"` | +0.5 |
| BTC 상관 | `className === "down"` | −0.5 |
| BTC 상관 | 빈 문자열 등 | 0 |
| 당일 Force | 부호 > 0 | +0.5 |
| 당일 Force | < 0 | −0.5 |
| 당일 Force | 0 또는 없음 | 0 |

화면에 보이는 **근거 문장**은 위에서 최대 3개까지 잘라 씁니다(`reasons.slice(0, 3)`).

### 7.2 결론 구간

| 합산 점수 | 결론 |
|-----------|------|
| ≤ −1.5 | 리스크 높음 · 지금은 관망 추천 |
| < 1 (그리고 > −1.5) | 주의 구간 · 분할 진입 가능 |
| ≥ 1 | 안정 구간 · 계획된 분할 접근 가능 |

### 7.3 💡 인사이트 (`buildAnalystInsights`)

맞춤 리포트와 별도로, 아래 같은 **조합 규칙**으로 최대 3줄까지 생성합니다(예시).

- MA 기울기 ≥ 0.5 **그리고** 평균 일변동 ≤ 2.5% → 추세 추종 품질 언급
- MA 기울기 ≤ −0.5 → 하방 압력·리스크 관리 언급
- 구간 위치 ≥ 80% **그리고** 당일 Force < 0 → 상단권+에너지 음수 언급
- 구간 위치 ≤ 20% **그리고** 당일 Force > 0 → 하단권+매수 에너지 언급
- 변동성 돌파 비율 ≥ 1.8 **또는** 평균 일변동 ≥ 3% → 변동성 확대 언급
- 거래량 비율(최근7/직전7) ≥ 1.2 **그리고** MA 기울기 ≥ 0 → 유입+추세 언급

해당 없으면 기본 한 줄(관망 권장)을 넣습니다.

---

## 8. 전문가 상세 지표 (요약)

### 8.1 기간 수익률·고저

- **수익률**: 조회 캔들 **첫 봉 종가** 대비 **마지막 봉 종가** 변화율(%).
- **고저**: 같은 구간 **전체 고가 최댓값 / 저가 최솟값**.

### 8.2 추세 (MA20 기울기)

- 전체 구간에서 계산한 **MA20 시계열**의 **첫 유효값→마지막 유효값** 변화율(%).
- 부호로 “상승/하락 추세 우위” 표시.

### 8.3 MA5 / MA20 교차

- 전일 `(MA5 - MA20)`과 당일 `(MA5 - MA20)`의 **부호가 바뀌는 지점**을 탐지.
- 음→양: 골든크로스, 양→음: 데드크로스.

### 8.4 모멘텀 (7일)

- **최근 7일** 종가 수익률 − **그 직전 7일** 종가 수익률.  
- **최소 14일** 데이터 필요.

### 8.5 거래량 압력

- **최근 7일** 평균 거래량 ÷ **직전 7일** 평균 거래량 = `volRatio`
- ≥ 1.2 → “거래량 유입 확대”, ≤ 0.8 → “거래량 둔화”, 그 사이 “중립”.

### 8.6 Force

- 일 \(i\): \((\text{종가}_i - \text{종가}_{i-1}) \times \text{거래량}_i\)
- **당일 값**과 **최근 7일 평균**을 원 단위로 표시.
- **미터용 정규화**: 최근 **30일** Force 절댓값 중 최댓값으로 나누고 −100~100으로 클램프.
- **방향**: 정규화값 ≥ 10 → 상승 세력 우위, ≤ −10 → 하락 압력 우위, 그 사이 중립.
- **강도**(절댓값): ≥ 70 매우 강함, ≥ 40 강함, ≥ 20 보통, 그 외 약함.

### 8.7 최대 변동폭(일)

- 매일 \((고가 - 저가) / 시가 \times 100\), 그중 **최댓값**이 나온 **날짜와 값**.

### 8.8 거래량–가격 다이버전스

- 파라미터: **직전 20일** 평균 거래량, 배수 **1.8**.
- 어떤 날 **당일 거래량 / 20일 평균 ≥ 1.8**이면 후보.
  - 그날 `change_rate < 0` → 하락 중 거래량 급증류 메시지
  - `change_rate > 0` → 상승+거래량 급증류 메시지
- 신호가 하나도 없으면: “특이 신호 없음 (20일 평균 대비 1.8배)”.

---

## 9. 구현 위치

- 대부분의 로직: `app.js` 내 `analyze`, `calculateRsi`, `calculateEscapePlanByVolumeProfile`, `detectFakeoutDrop`, `buildBeginnerConclusion`, `buildAnalystInsights`, `detectVolumePriceDivergence` 등.
- 상수: 파일 상단 `ESCAPE_*`, `FAKEOUT_*`, `DIVERGENCE_*` 등.

---

## 10. 개정 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| 0.1 | 2026-04-08 | 초안 — 코드 기준 정리 |

---

# English

## Technical indicators and scoring reference

This document describes **which input fields, formulas, and rules** produce the numbers and labels on the **Coin Newbie Rescue Squad** UI.  
The implementation source of truth is `app.js` in this repo; some fields follow Upbit API definitions.

For a narrative walkthrough first, see [GUIDE.md](./GUIDE.md).

---

## 0. Read this first

- This is **not investment advice.** Indicators are **educational / informational heuristics**.
- **What “derived” means**
  - **RSI, moving averages, correlation**, etc. implement widely used **definitions/formulas**.
  - Thresholds like **70/30, 20/80%, 3%·1.2%** and **custom report scoring** are **product-chosen constants** for familiar intuition and readable UI buckets—not statistically or financially “optimal.”
- Short lookback windows may hit “insufficient data” branches. Each section notes **minimum days** where relevant.

**Daily candle fields** used most often:

- `trade_price`: close
- `opening_price`, `high_price`, `low_price`
- `change_rate`: daily return per API (multiply by 100 when treating as percent in code)
- `candle_acc_trade_volume`: day cumulative volume

---

## 1. Is price “cheap” right now? (30-day range position)

### 1.1 What we compute

Take the **last up to 30** daily candles (fewer if unavailable). Let \(L\) = **min low**, \(H\) = **max high**, \(P\) = **last close**. Map \(P\) into a percentile along \([L,H]\):

\[
\text{pos} = \begin{cases}
50 & H = L \ (\text{no range}) \\
100 \times \dfrac{P - L}{H - L} & \text{otherwise}
\end{cases}
\]

Then **clamp** to 0–100.

### 1.2 Quick card copy (wide buckets)

| Condition | Status text |
|-----------|-------------|
| pos ≤ 20% | Relatively cheap band |
| pos ≥ 80% | Relatively expensive band |
| otherwise | Mid range |

### 1.3 Pro panel labels (finer buckets)

Same `pos`, finer text. (Code evaluates an `if` chain **top to bottom**.)

| Condition | Label |
|-----------|-------|
| pos ≤ 15% | Deep floor band |
| pos ≤ 35% | Low band |
| pos ≥ 85% | Ceiling band |
| pos ≥ 65% | High band |
| otherwise | Neutral band |

**Color accent** (state class): pos ≤ 30 → uptone, pos ≥ 70 → downtone (`up` / `down` classes in code).

---

## 2. Market “heat” (RSI)

### 2.1 Definition

Standard **RSI(14)** on consecutive **closes**: first 14 bars use simple averages for average gain/loss; afterwards **Wilder-style smoothing** updates from prior averages. If `avgLoss === 0`, RSI = 100.

### 2.2 Data requirement

- Need **more than period (14) closes** → effectively **≥ ~15 days**.

### 2.3 Bucket copy

| Condition | Quick card |
|-----------|------------|
| RSI ≥ 70 | Very hot (overbought) |
| RSI ≤ 30 | Cool (oversold) |
| otherwise | Neutral temperature |

---

## 3. Volatility (regime + quick card)

Over the **entire selected daily range**, compute two averages.

### 3.1 Average daily move `avgAbsReturn`

For each day \(i\):

\[
r_i = |\texttt{change\_rate}_i| \times 100 \ (\%)
\]

`avgAbsReturn` = **arithmetic mean** of \(r_i\) over the window.

### 3.2 Average intraday range `avgRange`

For each day \(i\):

\[
\text{range}_i = \frac{H_i - O_i}{O_i} \times 100 \ (\%)
\]

\(O_i\): open, \(H_i\): high. `avgRange` = **arithmetic mean** over the window.

### 3.3 Regime (watch OR vs AND)

| Regime | Rule |
|--------|------|
| High vol | `avgAbsReturn ≥ 3` **or** `avgRange ≥ 5` |
| Low vol | `avgAbsReturn ≤ 1.2` **and** `avgRange ≤ 2` |
| Normal | neither of the above |

Quick card maps these to “choppy / calm / normal” style wording.

### 3.4 Volatility breakout (pro panel one-liner)

- Needs **≥ 6 days**: **today (last bar)** `range` divided by **prior 5-day mean range** → `breakoutRatio`.
- `breakoutRatio ≥ 2` → “Caution: volatility expansion (~n×)”, else “Within normal range.”

---

## 4. Breakout hints (supply-zone style targets/stops)

Not the order book: a **histogram of volume stacked by close price** over recent days picks **reference** resistance/support candidates.

### 4.1 Parameters (code constants)

| Name | Value | Meaning |
|------|-------|---------|
| `ESCAPE_LOOKBACK_DAYS` | 30 | Last N days (or fewer if data short) |
| `ESCAPE_BIN_COUNT` | 10 | Bins from low to high |
| `ESCAPE_MIN_DISTANCE_PCT` | 1.0 | Min **distance** (%) from spot to bin center |
| `ESCAPE_PREFERRED_DISTANCE_PCT` | 2.0 | Prefer bins **farther** when possible |
| `ESCAPE_FALLBACK_SWING_LOOKBACK` | 10 | Lookback M days for swing-low fallback |

### 4.2 Procedure (summary)

1. Build 10 bins from **min low / max high** over the lookback.
2. For each day, add that day’s **cumulative volume** to the bin containing its **close**.
3. **Upside target**: among bins **above** spot, keep those with center **≥ 1%** above spot; pick **max total volume** (ties → **farther** from spot). **Preferred 2%**: if any candidate is **≥ 2%** away, filter to those first, then pick inside that set.
4. **Downside stop**: symmetric below spot.
5. If no downside bin, use **MA20** (20-day SMA over full series, latest value) as stop substitute if below spot and **≥ 1%** away.
6. Else use **min of last 10 lows** in lookback as swing-low candidate (still must satisfy distance rules).

### 4.3 Displayed percents

- `upsidePct = (targetPrice - current) / current × 100`
- `riskPct = (stopPrice - current) / current × 100` (usually negative when stop is below)

### 4.4 Supply “strength” copy

Selected bin volume ÷ **max bin volume**:

| Ratio | Label |
|-------|-------|
| ≥ 0.8 | Very thick |
| ≥ 0.45 | Normal |
| else | Thin |

### 4.5 Quick card top status (**order matters**)

Code walks **`if` top → bottom**; **first true branch wins**.

1. `riskPct` finite and **`> -1`** → “Near support — watch closely”
2. else `riskPct > -3` → “Risk management needed”
3. else `riskPct ≤ -3` → “Plan your exit”
4. else `0 ≤ upsidePct ≤ 2` → “Take-profit planning zone”
5. else `upsidePct > 2` **and** `riskPct < -2` → “Upside favored”
6. else → “Review exit plan”

If `riskPct` is missing (NaN, etc.), earlier branches may fail and flow may reach upside branches.

---

## 5. Shakeout watch (fake dip heuristic)

A **simple rule** flagging days with **sharp drop + relatively thin volume**.

### 5.1 Data

- **Today + prior 5 days** → 6 days required; else “waiting for data.”

### 5.2 Drop threshold `thresholdPct`

Let `avgAbsReturnPct` = mean of \(|\texttt{change\_rate}| \times 100\) over the prior 5 days:

\[
\text{thresholdPct} = \mathrm{clamp}\big( \text{avgAbsReturnPct} \times 1.6,\ 2,\ 6 \big)
\]

Clamped to **2%–6%**.

### 5.3 Price condition

- **Intraday**: \((\text{close}-\text{open})/\text{open} \times 100 \le -\text{thresholdPct}\)
- **or vs prior close**: \((\text{close}-\text{prior close})/\text{prior close} \times 100 \le -\text{thresholdPct}\)

### 5.4 Volume condition

- Today volume ÷ **mean volume of prior 5** = `volumeRatio`
- **Shakeout warning**: price condition **and** `volumeRatio < 0.6`
- **Weak signal**: price true and `0.6 ≤ volumeRatio < 0.75`
- Else “normal down move or needs confirmation,” etc.

---

## 6. BTC quick card vs pro correlation

Both use **Pearson \(r\)** on **daily `change_rate`** for **aligned dates** between asset and BTC (no calc if &lt; 5 pairs).

### 6.1 Quick card (alts only)

| \(r\) | Status |
|--------|--------|
| \(r \ge 0.8\) | Coupled (high) |
| \(r \le 0.3\) | Distant (low) |
| otherwise | In between (mid) |

For `KRW-BTC`, there is no pair → “N/A.”

### 6.2 Pro panel `classifyCorrelation` (feeds scoring)

| \(r\) | Label | `className` |
|--------|-------|-------------|
| \(r \ge 0.7\) | Strongly aligned with BTC | up |
| \(r \ge 0.4\) | Partially aligned | (neutral) |
| \(r \ge 0\) | Can move independently | down |
| \(r < 0\) | Negative correlation | down |

**Same \(r\) can read differently on the card vs panel**—thresholds differ on purpose.

---

## 7. Custom report (score)

Weighted sum of several hints, then bucketed conclusion text.

### 7.1 Per-item contributions

| Item | Rule | Points |
|------|------|--------|
| RSI | ≥ 70 | −2 |
| RSI | ≤ 30 | +1 |
| RSI | else | 0 |
| MA20 slope | % change **first→last** MA20 over full window **> 0.3** | +1 |
| MA20 slope | **< −0.3** | −1 |
| MA20 slope | else | 0 |
| BTC corr | `className === "up"` | +0.5 |
| BTC corr | `className === "down"` | −0.5 |
| BTC corr | empty string, etc. | 0 |
| Today Force | sign &gt; 0 | +0.5 |
| Today Force | &lt; 0 | −0.5 |
| Today Force | 0 or missing | 0 |

On-screen **reason lines** take at most **3** from the above (`reasons.slice(0, 3)`).

### 7.2 Conclusion buckets

| Total score | Conclusion |
|-------------|--------------|
| ≤ −1.5 | High risk · favor watching |
| &lt; 1 (and &gt; −1.5) | Caution · staged entries possible |
| ≥ 1 | Calmer · planned scaling possible |

### 7.3 Insights (`buildAnalystInsights`)

Separate from the score, up to **3 lines** from **combo rules** (examples):

- MA slope ≥ **0.5** **and** avg daily move ≤ **2.5%** → trend-follow quality note
- MA slope ≤ **−0.5** → downside pressure / risk note
- Range position ≥ **80%** **and** today Force &lt; 0 → upper band + negative energy
- Range position ≤ **20%** **and** today Force &gt; 0 → lower band + buy-side energy
- Vol breakout ratio ≥ **1.8** **or** avg daily move ≥ **3%** → volatility expansion
- Volume ratio (last7 / prev7) ≥ **1.2** **and** MA slope ≥ 0 → inflows + trend

If none match, a default “favor watching” line is used.

---

## 8. Pro detail block (summary)

### 8.1 Period return and range

- **Return**: % change from **first close** to **last close** in selection.
- **High/low**: **max high** and **min low** over the same window.

### 8.2 Trend (MA20 slope)

- % change from **first valid MA20** to **last valid MA20** over the full window.
- Sign drives “up/down tilt” wording.

### 8.3 MA5 / MA20 cross

- Detect sign change of `(MA5 − MA20)` from prior day to today.
- Negative→positive: golden cross; positive→negative: death cross.

### 8.4 Momentum (7-day)

- **Last 7-day** close return minus **previous 7-day** close return.  
- Needs **≥ 14** days.

### 8.5 Volume pressure

- Mean volume **last 7** ÷ mean **prior 7** = `volRatio`
- ≥ 1.2 → “Volume inflow”; ≤ 0.8 → “Volume drying”; else neutral.

### 8.6 Force

- Day \(i\): \((\text{close}_i - \text{close}_{i-1}) \times \text{volume}_i\)
- Show **today** and **7-day average** in raw units.
- **Gauge normalization**: divide by **max |Force| in last 30 days**, clamp −100…100.
- **Direction**: normalized ≥ 10 → buyers ahead; ≤ −10 → sellers ahead; else neutral.
- **Magnitude** (abs): ≥ 70 very strong; ≥ 40 strong; ≥ 20 moderate; else weak.

### 8.7 Max daily range

- Each day \((high - low) / open \times 100\); report **date and value** of the **maximum**.

### 8.8 Volume–price divergence

- Params: **prior 20-day** mean volume, multiplier **1.8**.
- If **today volume / 20-day mean ≥ 1.8**:
  - `change_rate < 0` → heavy volume on a down day message
  - `change_rate > 0` → heavy volume on an up day message
- If no hits: “No notable signal (vs 20-day mean ×1.8).”

---

## 9. Where it lives in code

- Most logic: `app.js` — `analyze`, `calculateRsi`, `calculateEscapePlanByVolumeProfile`, `detectFakeoutDrop`, `buildBeginnerConclusion`, `buildAnalystInsights`, `detectVolumePriceDivergence`, etc.
- Constants: top of file — `ESCAPE_*`, `FAKEOUT_*`, `DIVERGENCE_*`, etc.

---

## 10. Revision history

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-04-08 | Initial draft aligned with code |

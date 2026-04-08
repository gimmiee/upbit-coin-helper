# 코린이 구조대 — 프로젝트 안내

업비트(Upbit) **공개 API**로 받은 캔들 데이터를 한 화면에서 묶어 보여 주는 **정보용 대시보드**입니다.  
코인과 기간을 고르면 **가격·거래량·변동률 차트**와 함께, 같은 데이터로 만든 **초보자용 요약 카드**와 **상세 지표**를 볼 수 있습니다.

> **투자 자문이 아닙니다.** 모든 문구와 수치는 참고용이며, 매매 결정과 손익은 전적으로 본인 책임입니다.

---

## 무엇을 하나요?

| 영역 | 설명 |
|------|------|
| **조회** | KRW 마켓 코인 선택, 기간 프리셋 또는 시작일–종료일 |
| **리포트** | RSI·추세·동조화 등을 섞은 **한 줄 결론**과 인사이트(휴리스틱) |
| **퀵 카드** | “가격대”, “RSI 온도”, “변동성”, “목표/손절 참고(매물대 스타일)”, “가짜 하락 휴리스틱”, “BTC와의 동조(알트)” |
| **전문가 패널** | MA·Force·모멘텀·거래량·다이버전스 등 **숫자 원본 위주** |
| **차트** | 종가/MA/교차 표시, 거래량·변동률, 실시간 분봉(줌·팬 등) |
| **테마** | 다크 / 라이트 전환 |

자세한 **기능 범위·비범위·요구사항**은 [PRD.md](./PRD.md)를 참고하세요.  
**지표를 한 번에 읽는 설명**은 [GUIDE.md](./GUIDE.md)를, **수식·임계값(코드 대조)**은 [INDICATORS.md](./INDICATORS.md)를 참고하세요.

---

## 기술 스택

- **프론트**: HTML / CSS / JavaScript(모듈), Chart.js + zoom 플러그인 등
- **빌드**: [Vite](https://vitejs.dev/) 8.x
- **패키지 매니저**: [pnpm](https://pnpm.io/)
- **API**: 브라우저 → (배포 시) 서버리스 프록시 → `https://api.upbit.com`

---

## 로컬에서 실행하기

의존성 설치:

```bash
pnpm install
```

---

# English

**Coin Newbie Rescue Squad (코린이 구조대)** — project overview for international readers.

This is an **informational dashboard** that pulls candle data from the Upbit **public API** and presents it in one place.  
Pick a coin and a time range to see **price, volume, and return charts**, plus **beginner-friendly summary cards** and **detailed indicators** derived from the same data.

> **Not investment advice.** All copy and numbers are for reference only; trading decisions and P&L are entirely your responsibility.

---

## What it does

| Area | Description |
|------|-------------|
| **Lookup** | KRW-market coin selection, period presets or start–end dates |
| **Report** | A **one-line takeaway** mixing RSI, trend, correlation, etc., with heuristic insights |
| **Quick cards** | “Price band”, “RSI heat”, “volatility”, “target/stop hints (supply-zone style)”, “fake dip heuristic”, “BTC alignment (alts)” |
| **Pro panel** | **Raw numbers** for MA, Force, momentum, volume, divergences, and more |
| **Charts** | Close/MA/crossovers, volume and returns, live minute candles (zoom, pan, etc.) |
| **Theme** | Dark / light |

For **scope, non-goals, and requirements**, see [PRD.md](./PRD.md).  
For **how to read the indicators**, see [GUIDE.md](./GUIDE.md); for **formulas and thresholds (vs. code)**, see [INDICATORS.md](./INDICATORS.md). *(Those documents are mainly written in Korean.)*

---

## Tech stack

- **Front end**: HTML / CSS / JavaScript (modules), Chart.js + zoom plugin, etc.
- **Build**: [Vite](https://vitejs.dev/) 8.x
- **Package manager**: [pnpm](https://pnpm.io/)
- **API**: Browser → (when deployed) serverless proxy → `https://api.upbit.com`

---

## Run locally

Install dependencies:

```bash
pnpm install
```

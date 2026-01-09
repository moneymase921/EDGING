# EV Discipline Machine

This project is a Next.js application designed to calculate the implied probability from American odds.

## Getting Started

### Prerequisites

- Node.js (version 18 or later)
- npm (version 8 or later)

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    ```

2.  Navigate to the project directory:

    ```bash
    cd ev-discipline-machine
    ```

3.  Install the dependencies:

    ```bash
    npm install
    ```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Running Tests

To run the test suite, execute:

```bash
npm test
```

This will run all unit tests and display the results in the terminal.

## Project Structure

-   `src/app`: Next.js pages and layouts.
-   `src/lib/math`: Pure mathematical calculations (e.g., odds conversions).
-   `tests`: Unit and integration tests.

## Core Concepts

### Expected Value (EV)

Expected Value (EV) represents the average outcome of a bet if it were to be repeated many times. For a single-leg bet with a 1-unit stake, the EV is calculated as:

```
EV = pWin * (PayoutMultiplier - 1) - (1 - pWin)
```

Where:
- `pWin`: The probability of the bet winning (as a decimal).
- `PayoutMultiplier`: The total return on a winning bet, relative to your stake (e.g., 2.0 for 2x your stake back).

-   **Break-even intuition:** An EV of 0 indicates a break-even scenario over the long run. If EV > 0, the bet is favorable; if EV < 0, it's unfavorable.

### Return To Player (RTP)

Return To Player (RTP) is the theoretical percentage of all money wagered on a game that will be paid back to players over time. For a single-leg bet, it's calculated as:

```
RTP = pWin * PayoutMultiplier
```

-   RTP is expressed as a decimal (e.g., 1.0 for 100%). It represents how much you expect to get back for every unit risked.

### Two-Leg Slip Calculations

For a two-leg slip, we assume the outcomes of individual legs are independent. The overall slip win probability (`pSlip`) is the product of the individual leg probabilities (`p1`, `p2`):

```
pSlip = p1 * p2
```

Using `pSlip`, the Expected Value (EV) and Return To Player (RTP) for the entire slip are calculated using the same formulas as single-leg bets:

```
Slip EV = pSlip * (SlipPayoutMultiplier - 1) - (1 - pSlip)
Slip RTP = pSlip * SlipPayoutMultiplier
```

### De-Vigging Two-Way Markets

Vig (short for vigorish, also known as overround) is the commission or edge that sportsbooks build into their odds to ensure a profit. When you see American odds for both sides of a two-way market (e.g., Over/Under, Team A/Team B), the implied probabilities of those odds will sum to more than 100%. This excess is the vig.

De-vigging is the process of removing this sportsbook advantage to determine the "fair probability" of each outcome. This fair probability is a more accurate representation of the true likelihood of an event, assuming a perfectly balanced market with no house edge. Using de-vigged probabilities in EV calculations provides a more accurate assessment of a bet's true expected value.

We compute the fair probability from implied probabilities (`pImp`) for the Over and Under sides as follows:

```
Overround = pOverImp + pUnderImp - 1
Vig Percent = Overround * 100
pOverFair = pOverImp / (pOverImp + pUnderImp)
pUnderFair = pUnderImp / (pOverImp + pUnderImp)
```

**Note:** Single-sided American odds inherently include vig and are a rough proxy for the true probability when a two-way market is not provided.

### Calibration & Reports

Use the `/reports` page to evaluate how well predicted probabilities align with outcomes from your Bet Journal.

- **Leg-level calibration:** Compares each leg’s predicted `pChosen` vs. actual hit rate.
- **Slip-level calibration:** Compares each slip’s `pSlip` vs. actual slip win rate.
- **Brier score:** Mean squared error between predicted probability and outcome (0/1) for legs and slips.
- **Binned calibration:** Probabilities bucketed (default 0.05 bins) showing avg predicted, hit rate, and delta.
- **Segmentation:** Filter by probability source (`override`, `devigPair`, `singleOdds`) and date range (last 7/30/90 days).
- **Assumptions in UI:** Values shown are the stored snapshots at save time (pChosen/pSlip). Slip pSlip assumes leg independence. Probability precedence per leg: override > devig pair > single odds. All metrics are visible; nothing is hidden or collapsed by default.

### Slip Logging and Outcomes (Bet Journal)

This application now includes a "Bet Journal" feature, allowing you to save two-leg slips, track their status, and record their outcomes. This functionality is crucial for building a personal betting dataset that can later be used for calibration and performance analysis.

**What gets saved:**
When you save a slip, a snapshot of all relevant data at that moment is stored. This includes:
-   **Leg details:** Each leg's chosen side, the source of its probability (e.g., direct override, de-vigged pair, or single odds), the `pChosen` (the probability used in calculations), and if available, the implied probability (`pImp`), fair probability (`pFair`), and vig percentage (`vigPercent`). The original input odds/probabilities are also stored for reference.
-   **Slip details:** Creation timestamp, the payout multiplier, overall slip win probability (`pSlip`), Expected Value (`ev`), and Return To Player (`rtp`).
-   **Status:** Initially "pending." Once you settle the slip, the status changes to "settled."

**Why log even if you don't bet (optional note):**
Logging slips even if you don't physically place the bet can be valuable for backtesting your prediction models, understanding the historical EV of potential bets, and identifying biases in your assessment without financial risk.

**Realized Profit Units:**
When a slip is settled, the following are calculated:
-   `realizedReturnX`: The actual return multiplier. If the slip wins, this equals the `payoutMultiplierX`. If it loses, it's `0`.
-   `realizedProfitUnits`: This represents the profit or loss in units staked. It is calculated as `realizedReturnX - 1`.
    -   For a winning slip, `realizedProfitUnits = payoutMultiplierX - 1`.
    -   For a losing slip, `realizedProfitUnits = 0 - 1 = -1` (a loss of one unit).
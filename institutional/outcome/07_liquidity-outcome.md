# LIQUIDITY OUTCOME — MITHQAL PILOT A (v25.3.2 — PROMPT 72, Section K)

> **NOT PRODUCTION-AUTHORIZED.** Defines liquidity measurement. No
> liquidity was measured (Pilot A is `NOT_EXECUTED`; 0 banks engaged;
> `BANK_MONEY` with no real movement).

## 1. Measurement Surface (Section K)

Where liquidity was actually measured (it was not), the reviewer would
compare:

| Field | Description |
|---|---|
| `baseline_liquidity_condition` | bank's baseline liquidity state |
| `pilot_liquidity_condition` | pilot's liquidity state |
| `pre_positioning` | pre-positioning of funds |
| `utilization` | utilization rate |
| `idle_time` | idle time of funds |
| `funding_uncertainty` | funding uncertainty |

## 2. Classification (Section K)

| Class | Meaning |
|---|---|
| `OBSERVED_IMPROVEMENT` | liquidity measurably improved vs baseline |
| `NO_MATERIAL_CHANGE` | no material change |
| `WORSENED` | liquidity worsened |
| `INCONCLUSIVE` | inconclusive |
| `NOT_TESTED` | not tested |

## 3. Pre-Assessment Status

| Field | Value |
|---|---|
| `liquidity_measured` | false (NOT_TESTED) |
| `baseline_liquidity_condition` | UNKNOWN (0 banks engaged) |
| `pilot_liquidity_condition` | NOT_MEASURED (0 transactions) |
| `classification` | NOT_TESTED |

## 4. No Systemic Liquidity Benefit Claim (Section K — last paragraph)

> "Do not claim systemic liquidity benefits from a limited pilot."

No liquidity benefit is claimed. Pilot A uses `BANK_MONEY` (no reserves
held; no real movement because no bank engaged). Even if a pilot had
executed, systemic liquidity benefits could not be claimed from a
limited (16-scenario) pilot. No such claim is made.

## 5. Honest State

- `liquidity_outcome_defined`: true
- `liquidity_measured`: false
- `systemic_liquidity_benefit_claimed`: false (none)
- `production_authorized`: false
- `institutionally_validated`: false

NOT PRODUCTION-AUTHORIZED. Liquidity outcome designed; no liquidity
measured.

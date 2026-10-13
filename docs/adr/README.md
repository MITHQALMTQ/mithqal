# `docs/adr/` — Architecture Decision Records

**Blueprint ref:** v26.0 §10.5 (Required repository deliverables)

## Purpose

Per §10.5, `docs/adr/` holds:

> ADRs for authority hierarchy, database write authority,
> outbox/events, finality, MTQ optionality and data governance.

Each ADR follows the standard Architecture Decision Record format:

- **Title**
- **Status** (`PROPOSED` | `ACCEPTED` | `SUPERSEDED` | `DEPRECATED`)
- **Context**
- **Decision**
- **Consequences**
- **Alternatives Considered**
- **Blueprint Reference**

## Index

| ADR | Title | Blueprint ref |
|---|---|---|
| [0001](0001-database-writer-authority.md) | Database writer authority: Neon authoritative + Turso projection | v26.0 §6.1, §6.2, D-006 |
| [0002](0002-mtq-disabled-by-default.md) | MTQ disabled-by-default fail-closed gate | v26.0 §3.2, §0.1 |
| [0003](0003-f0-f7-finality-state-machine.md) | F0–F7 finality state machine + canonical BM-15/BM-16A/BM-16B | v26.0 §4.2, §4.4 |
| [0004](0004-eligible-backing-formula.md) | Eligible backing = MIN(Economic, Legal, Liquid, SettlementAvailable) | v26.0 §3.3 |
| [0005](0005-reconciliation-class-tolerance.md) | Class-specific reconciliation tolerance registry | v26.0 §5.3 |
| [0006](0006-external-claim-register.md) | External claim registration | v26.0 §5.5 |
| [0007](0007-outbox-pattern.md) | Outbox pattern: Neon transaction + outbox + Turso projector | v26.0 §6.2 |

## Authority level

ADRs are Level C (blueprint-derived) under §1.4. They cannot override
executed instruments (Level A) or deployed runtime invariants (Level B);
they describe how the engineering team has chosen to implement the
blueprint's normative requirements.

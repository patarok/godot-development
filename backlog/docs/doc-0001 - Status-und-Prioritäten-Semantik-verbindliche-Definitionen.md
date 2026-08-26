---
id: doc-0001
title: Status- und Prioritäten-Semantik (verbindliche Definitionen)
type: specification
created_date: '2026-08-26 12:03'
updated_date: '2026-08-26 12:03'
---
# Status- und Prioritäten-Semantik (verbindlich)

## Status-Flow

| Status | Bedeutung |
| --- | --- |
| `To Do` | erfasst, noch nicht begonnen |
| `In Progress` | aktiv in Arbeit |
| `Stalled` | temporär blockiert (externer Input nötig), wiedereintrittsfähig |
| `Waiting On Other` | wartet explizit auf jemand anderen / zweiten Task |
| `unknown dependency` | unklare/ungeklärte Abhängigkeit, muss zuerst geklärt werden |
| `Done` | alle DoD-Kriterien erfüllt |
| `code-churn` | wiederholte erfolglose Lösungsversuche (siehe Retry-Richtlinie) |
| `broken` | Umsetzung grundsätzlich fehlkonstruiert, nicht mehr reparierbar; informativ konserviert |
| `deprecated` | obsolet geworden / bewusst aufgegeben |
| `cancelled` | bewusst verworfen, kein Erkenntniswert |

## Retry-Richtlinie (code-churn)

Nach **3 erfolglosen Lösungsversuchen** an derselben Kernproblematik (Task nicht zum DoD-Erfüllungszustand bringbar): Status auf `code-churn` setzen, Versuchshistorie in den Implementation-Notes dokumentieren und Peter explizit informieren. Kein endloses Weiterbohren — Eskalation zur echten Entwickler-Interaktion.

Danach entscheidet Peter: reparieren (zurück auf `In Progress`) oder Status auf `broken` setzen (Fehldesign von Anfang an, nicht mehr zu vollenden).

## Prioritäten (6-stufig)

| Priorität | Bedeutung |
| --- | --- |
| `none` | weder nötig noch gewünscht; höchstens ein Vorteil, rein optional |
| `gold-plating` | unterhalb der DONE-Schwelle; keine Anforderung für übergabefertigen Zustand |
| `low` | echte Anforderung, niedrigste Dringlichkeit; **muss erfüllt sein** für kundenfertige Auslieferung |
| `mid` | normale Anforderung |
| `high` | wichtig, dringend |
| `urgent` | kritisch, sofort |

Wichtig: `low` ist KEIN Gold-Plating, sondern eine Pflicht-Anforderung mit niedrigster Dringlichkeit. Gold-Plating liegt explizit unterhalb von `low`.

## Labels

backend, frontend, db, auth, perf, a11y, docs, tests, seed, refactor, blocked

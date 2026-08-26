---
id: TASK-0005
title: Admin- & Feature-Vervollständigung
status: To Do
assignee: []
created_date: '2026-08-26 12:08'
updated_date: '2026-08-26 12:08'
labels: []
milestone: m-3
dependencies: []
priority: mid
type: epic
ordinal: 5000
---

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Build & Typecheck grün: `npm run check` und `npm run build` laufen fehlerfrei, keine neuen Warnungen im berührten Code.
- [ ] #2 Tests grün: `npm run test` (Jest/Vitest) läuft durch; neue Logik mit Unit-Tests abgedeckt wo sinnvoll. (Framework-Setup gilt als eigene initiale Arbeit, danach hart.)
- [ ] #3 Keine Svelte-4-Antipatterns: Runes-Idiome ($state/$derived/$effect), kein onMount-Overuse, kein Legacy-$store-/subscribe-Missbrauch, keine imperative DOM-Manipulation außerhalb $effect. Referenz ist Svelte 5.38, nicht ältere Svelte-Doku.
- [ ] #4 State-Grenze sauber: Server-State wo möglich in +page.server.ts/hooks, Client-State minimal; $derived statt manueller Sync-Kopien; kein Cross-Request-Leak in Stores.
- [ ] #5 Datenzugriff korrekt & N+1-frei: Relationen vorladen (relations:/Joins), Mutationen konsistent, Fehler behandelt statt verschluckt.
- [ ] #6 Selbst-Rezension + Verhaltenscheck: Diff selbst gelesen, betroffener Pfad in `npm run dev` geprüft, kein Console-Error, Happy Path funktioniert sichtbar.
- [ ] #7 Keine Regression: bestehende Funktionalität bleibt intakt; manueller Verhaltenscheck ersetzt Auto-Tests bis das Framework steht.
- [ ] #8 Performance-Neutral bis -verbessernd: keine neue unnötige Reaktivität; bestehende Langsamkeit nicht verschlimmern; Perf-Themen in eigenen perf-Task auslagern.
- [ ] #9 Doku nachgezogen: README/docs/TODO bei öffentlich- oder Setup-relevanten Änderungen; Inline-Kommentare bei nicht-offensichtlicher Logik.
- [ ] #10 Backlog-Metadaten vollständig + Retry-Richtlinie eingehalten: Final-Summary geschrieben, DoD-Items per --check-dod abgehakt, Status korrekt; bei wiederholtem Scheitern: nach 3 erfolglosen Versuchen an derselben Kernproblematik Status auf code-churn setzen, Versuchshistorie in den Notes dokumentieren und Peter explizit informieren.
<!-- DOD:END -->

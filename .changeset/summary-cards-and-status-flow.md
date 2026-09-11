---
'@shining-technologies/ui-kit-react': minor
---

Add summary and process components to cards & feedback.

- `CardIcon`: a tinted glyph tile that takes its own column in `CardHeader`.
- `MetricTile` and `MetricGrid`: filled figure tiles for headline numbers inside a card, with accent tones, deltas, loading and full-row spans.
- `BreakdownList`: a count per bucket with dots, optional share bars, percentages, a summary bar and an inline empty state.
- `SummaryCard`: the icon-header, metrics and breakdown block, assembled from the parts above.
- `StatusFlow`: a lifecycle drawn in `StatusBadge`'s vocabulary, with alternates and an optional `current` step for tracking.
- `StepCard`: one numbered stage of a process with a bottom-pinned condition footer and optional `upcoming` / `current` / `done` state.
- `StatusDot` and `SegmentedBar`: a minimal state marker with an optional live pulse, and a stacked distribution bar.
- `Empty` gains `variant="inline"` for a one-line empty state.
- New `AccentTone` type: the six status tones plus `chart-1` … `chart-5`.

# AI UI Enhancements (Post-Migration)

Focus: once AI SDK v5 baseline is stable, iterate on UX improvements that leverage new capabilities (UI message stream protocol, tool states, AI Elements).

## Potential Initiatives
- Adopt shadcn v3 + AI Elements components for conversation, prompt input, tool visualization, reasoning display.
- Implement resumable/abortable streams using `createUIMessageStream` helpers (reference Sparka + `resumable-stream`).
- Surface granular tool lifecycle states (input-streaming/output-available) in UI with loaders/status chips.
- Add advanced context panes (usage, citations) leveraging v5 `data-*` parts.
- Introduce AI gateway/provider registry UI controls and telemetry (Langfuse, analytics overlays).

## References
- Sparka AI (`franciscomoretti/sparka`) for multi-provider UX, Langfuse instrumentation, resumable streams.
- Matt Pocock's `ai-sdk-tips` patterns (`createUIMessageStream`, structured suggestions, guardrails).
- AI Elements docs: https://ai-sdk.dev/elements

Coordinate scheduling after minimal migration ships.

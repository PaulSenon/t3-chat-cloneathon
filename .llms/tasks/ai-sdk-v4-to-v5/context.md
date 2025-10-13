# AI SDK v4 → v5 Migration Research

_Last updated: 2025-10-13_

## Repository Baseline
- Current deps: `ai@^4.3.16`, `@ai-sdk/{react,openai,anthropic,google}@^1.x`, `@ai-sdk/provider@^1.1.3`, `zod@^3.25.56`, React 19.1, Next 15.4 canary, Convex backend.
- Frontend uses shadcn/ui + Radix primitives, AI SDK v4 hooks (likely `useChat`), Convex functions for persistence.
- No `@ai-sdk/rsc`/`@ai-sdk/provider-utils` packages yet; message persistence likely stores v4 `content`/`toolInvocations` shape.

## Official v5 Migration Highlights (Vercel Docs)
- **Package versions**: `ai@>=5.0`, `@ai-sdk/*@>=2.0`, `@ai-sdk/provider-utils@>=3.0`, `zod@>=4.1.8`. Add `@ai-sdk/rsc` if using RSC helpers; upgrade React hooks to `@ai-sdk/react@2.x`.
- **Codemods**: run `npx @ai-sdk/codemod upgrade` (or `v5`) from repo root before manual fixes. Notable transforms: rename stream helpers, move React imports, update tool schemas, restructure UI message parts, migrate data stream protocol.
- **Type + API renames**:
  - `CoreMessage` → `ModelMessage`; `Message`/`CreateMessage` → `UIMessage`/`CreateUIMessage`.
  - `convertToCoreMessages` → `convertToModelMessages`.
  - `maxTokens` → `maxOutputTokens`; `maxToolRoundtrips` → `maxSteps`.
  - `reasoning` text now `result.reasoningText`; `reasoningDetails` renamed `result.reasoning`.
  - Tool call payloads use `input`/`output` instead of `args`/`result`.
- **Message structure overhaul**:
  - `content` removed; use `parts` array (`{ type: 'text' | 'reasoning' | 'tool-<name>' | 'data-*' | ... }`).
  - `reasoning` becomes a `reasoning` part; `toolInvocations` replaced by typed `tool-*` parts with granular states (`input-streaming`, `input-available`, `output-available`, `output-error`).
  - Data role removed; use custom data parts written via `UIMessageStream`.
- **Streaming changes**:
  - `StreamData` removed → migrate to `createUIMessageStream` + `createUIMessageStreamResponse`.
  - `streamText` result helpers renamed: `toAIStreamResponse` → `toUIMessageStreamResponse`, `toAIStream` → `toDataStream`, etc.
  - New start/delta/end protocol for text/tool/reasoning chunks; chunk property `textDelta` → `delta`.
  - `toolCallStreaming` is implicit; tool input streaming exposes `tool-input-start/delta/end` events.
- **Tool definition updates**:
  - `parameters` → `inputSchema` (Zod). Add `toModelOutput` when shaping tool return values.
  - `dynamicTool` helper for runtime-defined tools; `LanguageModelV1/V1Middleware` moved/renamed under `@ai-sdk/provider`.
  - Provider options: move per-model settings (e.g., `topK`) into call-level `providerOptions`; `structuredOutputs` replaced by `providerOptions.openai.strictJsonSchema`.
- **React & transport**:
  - Hooks now from `@ai-sdk/react`; `useAssistant` removed (use `useChat`).
  - Hook config no longer accepts `options`; pass `headers/body` at top level. Request customization moves to `DefaultChatTransport` (`prepareSendMessagesRequest`, interceptors, etc.).
  - `createStreamableValue` now in `@ai-sdk/rsc`.
- **Provider utilities**: `@ai-sdk/langchain` and `@ai-sdk/llamaindex` host adapters; update imports accordingly.
- **Other renames**: `generateId` replaces `nanoid` export, `baseUrl` → `baseURL`, `parseStreamPart` → `parseDataStreamPart`, `formatStreamPart` → `formatDataStreamPart`, `LanguageModelV2` types moved to provider package.

## Data Migration Guidance (V5 Schema)
- Two-phase plan:
  1. **Runtime conversion**: install `ai-legacy` alias (`npm:ai@^4.3.x`), add v4↔v5 conversion utilities, convert on read/write while code migrates. Updates fetch/store flows without DB changes.
  2. **Schema migration**: create parallel `messages_v5` table (e.g., Drizzle). Dual-write v4 schema (after conversion) + v5 table, run background migration to backfill, verify counts, switch reads to v5 data, drop v4 tables.
- Conversion specifics:
  - Map `content` strings into `parts[{ type:'text', text }]`.
  - Transform `reasoning`, `toolInvocations`, `sources`, `files` into corresponding part structures (`reasoning`, `tool-<name>`, `source`, `file`).
  - Ensure message IDs preserved; adopt deterministic ID generation (`generateId`).
- Use migration scripts with batching + retry; verify via counts before flipping reads.

## New Capabilities & Opportunities in v5
- **UIMessageStream**: Compose multiple streams (LLM output + custom data). Enables progressive suggestions, streaming status updates, resumable UI (see `ai-sdk-tips` pattern).
- **Advanced tool UX**: Fine-grained tool state events (`input-streaming`, `output-available`) allow richer UI (status indicators, partial results).
- **Structured outputs**: `streamObject` integrates with UI streams; provider-level strict JSON schema ensures compliant JSON.
- **DefaultChatTransport**: centralizes auth, retries, payload shaping (only send delta, attach extra metadata, etc.).
- **Provider registry + dynamic tools**: unify multi-provider fallback, integrate MCP schema-less tools (`dynamicTool`) without type breakage.
- **Reasoning visibility**: reasoning parts separated for inspection/debug; align with reasoning-focused UI (chain-of-thought components).
- **RSC streaming**: `@ai-sdk/rsc` brings typed `createStreamableValue` for server components; easier to share between Convex + Next RSC.
- **AI Elements & shadcn v3 alignment**: prebuilt components (Conversation, Message, Tool, Context, etc.) match new UI message shapes; expedite UI overhaul while adopting v5 parts.
- **Resumable streams / state persistence**: v5 stream protocol supports resumability (Sparka demonstrates `resumable-stream` package) → opportunity to add abort/resume to UX.

## Reference Implementations
- **Sparka AI (franciscomoretti/sparka)**
  - Next.js 15 + `ai@^5.0.39`, multi-provider gateway, dual-feature bundling (chat, suggestions, resumable streams, Langfuse instrumentation).
  - Uses `UIMessage` parts, streaming follow-up suggestions, AI Elements styling, `resumable-stream` for reconnects.
  - Demonstrates multi-provider registry + `@ai-sdk/provider-utils` 3.x usage, `DefaultChatTransport` patterns, background migrations via Drizzle.
- **Matt Pocock’s ai-sdk-tips**
  - Exercises emphasize `createUIMessageStream` composition, `streamObject` for structured follow-ups, custom data parts, typed suggestions.
  - Patterns for guardrails, fallback provider orchestration, prompt caching (Anthropic, Google) aligned with v5 provider metadata rewrites.

## Migration Work Checklist (next steps)
1. Audit codebase for v4-only APIs:
   - `content`/`toolInvocations` usage, `useAssistant`, `StreamData`, `options` in `useChat`, `maxTokens`, `maxToolRoundtrips`, `structuredOutputs`, `providerMetadata`, etc.
   - Convex schema storing `content` fields; plan conversion utilities.
2. Prepare dependency upgrades + `pnpm up` strategy (consider workspace / lockfile impacts in monorepo future).
3. Plan codemod execution order (backup branch → run codemods → manual fixes → lint).
4. Design runtime conversion layer (Convex functions converting v4 records on read/write) before DB migration.
5. Draft test plan covering converters, API route, and chat UX regression (smoke + integration).

_Future enhancements (AI Elements, advanced streaming) tracked under `.llms/tasks/ai-ui-enhancements/`._

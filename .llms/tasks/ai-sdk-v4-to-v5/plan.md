# AI SDK v5 Migration Plan (Minimal Scope)

## Phase 0 – Assessment & Safeguards
- Snapshot current behaviour (chat flow, Convex storage shape, UI expectations) and ensure staging data backups before touching dependencies.
- Inventory v4-only APIs in repository (`message.content`, `appendClientMessage`, `experimental_*`, `LanguageModelV1`, etc.) and note required replacements.
- Document stored message formats and design temporary converters for existing Convex records.

## Phase 1 – Dependency Upgrade & Runtime Compatibility
- Bump packages to v5 family (`ai@5`, `@ai-sdk/*@2`, `@ai-sdk/provider-utils@3`, `zod@^4.1.8`) plus temporary `ai-legacy` alias for v4 types.
- Run `npx @ai-sdk/codemod upgrade` and address mechanical changes (imports, helper renames, stream helpers).
- Introduce runtime conversion layer so stored v4 messages (Convex + local parsing) are translated to v5 `UIMessage` shape on read/write without immediate schema changes.

## Phase 2 – Server & Client Adjustments (1:1 Functionality)
- Update API route to use new model/message utilities (`ModelMessage`, `appendResponseMessages`, `toUIMessageStreamResponse`, provider option renames) while keeping behaviour identical.
- Migrate React hooks to new `@ai-sdk/react` API (`DefaultChatTransport` replaces `experimental_prepareRequestBody`, throttle equivalent, status handling) ensuring existing UX remains.
- Refactor message helpers/components to rely on `parts` (derive `content` locally if needed) and maintain current UI/logic without larger redesigns.
- Validate tool/provider registry against v5 naming (`LanguageModelV2`, provider option changes) and keep model list intact.

## Phase 3 – Persistence Migration (Follow-up once app stable)
- Create side-by-side Convex schema or field for v5 message format; dual-write using converters after Phase 2 stabilises.
- Backfill existing threads, verify counts, flip reads to native v5 storage, then retire conversion layer and `ai-legacy`.

## Phase 4 – Validation & Release
- Re-run lint/build/tests (`pnpm lint`, `pnpm build`), add regression tests around converters and streaming endpoints.
- Smoke test chat flows (new thread, resume thread, error paths) to confirm 1:1 behaviour.
- Prepare rollback notes and release checklist.

_Out of scope_: UI overhauls (AI Elements, enhanced streaming UX, resumability) tracked separately under `.llms/tasks/ai-ui-enhancements/`.

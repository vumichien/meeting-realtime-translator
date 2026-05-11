# Output Language Probe — 2026-05-11

## Summary

Plan §Validation Session 1 Q1 required probe-and-pin of supported output languages before pinning the allowlist. OpenAI cookbook (`openai.md:532`, §"Supported languages") explicitly enumerates the 13 supported output languages by name; treat that as authoritative source-of-truth in lieu of live API probe (avoids spending API credits to re-confirm vendor-published list).

Live API probe deferred until cookbook list and live API diverge (signal: 400 from `client_secrets` for a code in this list).

## Pinned Allowlist (13 codes, ISO 639-1)

| Code | Language    |
|------|-------------|
| es   | Spanish     |
| pt   | Portuguese  |
| fr   | French      |
| ja   | Japanese    |
| ru   | Russian     |
| zh   | Chinese     |
| de   | German      |
| ko   | Korean      |
| hi   | Hindi       |
| id   | Indonesian  |
| vi   | Vietnamese  |
| it   | Italian     |
| en   | English     |

## Source

`openai.md:532` — "Realtime Translation currently supports 13 target output languages: Spanish, Portuguese, French, Japanese, Russian, Chinese, German, Korean, Hindi, Indonesian, Vietnamese, Italian, and English."

## Notes

- Codes follow ISO 639-1 standard. `zh` is generic Chinese (model handles dialect detection internally per cookbook).
- This list MUST be mirrored in `server/src/config/languages.ts` and `client/src/config/languages.ts`.
- If user reports an unsupported-language error for a code in this list, run live probe against `https://api.openai.com/v1/realtime/translations/client_secrets`.

## Unresolved

- None at v1.

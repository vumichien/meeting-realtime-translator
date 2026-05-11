# Cost and Limits

Honest expectations before you put this in front of a real meeting.

## Pricing

`gpt-realtime-translate` is metered per audio minute (input + output). Pricing changes — see <https://openai.com/pricing> for the current rate.

Budget rough planning:
- A 1-hour Zoom meeting = ~60 minutes of audio in + ~60 minutes audio out + transcription if enabled.
- For long meetings, consider toggling **Show source captions** off in the Advanced section to skip the `gpt-realtime-whisper` transcription pass on the source side.

The app does **not** do its own metering. Your OpenAI dashboard is the source-of-truth for spend.

## Latency reality

Typical end-to-end latency (you finish speaking → listener hears translation):

| Path        | Typical | Worst (poor network) |
|-------------|---------|----------------------|
| Captions    | 0.5–1.5s | 3s+ |
| Audio       | 1.0–3.0s | 5s+ |

Captions arrive slightly faster than translated audio, since audio synthesis adds a small final stage. Open the Debug panel and watch **Latency p50** for a live estimate.

The model batches audio internally — it waits for enough context across syntactically different languages (e.g. SOV like Japanese) before producing output. This is intentional behavior, not a bug. `turn_detection` is not a tunable parameter on `gpt-realtime-translate` sessions; the model decides chunking on its own.

## Supported input languages

`gpt-realtime-translate` auto-detects from 70+ input languages. Vietnamese is fully supported. The full list per OpenAI's cookbook (`openai.md` §"Supported languages"):

Arabic, Afrikaans, Azerbaijani, Belarusian, Bengali, Bosnian, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, Dzongkha, English, Esperanto, Estonian, Basque, Persian / Farsi, Finnish, Filipino, French, Galician, German, Greek, Gujarati, Haitian Creole, Hawaiian, Hebrew, Hindi, Hungarian, Armenian, Indonesian, Italian, Japanese, Javanese, Georgian, Kazakh, Korean, Kurdish, Latin, Latvian, Lithuanian, Macedonian, Malay, Malayalam, Maori, Mongolian, Burmese / Myanmar, Nepali, Norwegian, Nynorsk, Polish, Portuguese, Punjabi, Romanian, Russian, Serbian, Shona, Slovak, Slovenian, Albanian, Spanish, Swahili, Swedish, Tagalog, Telugu, Thai, Turkish, Ukrainian, Uzbek, **Vietnamese**, Welsh, Yoruba.

## Supported output languages (13)

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

If OpenAI adds more, update both `server/src/config/languages.ts` and `client/src/config/languages.ts`. See [`plans/reports/lang-probe-260511.md`](../plans/reports/lang-probe-260511.md) for the verification process.

## Browser support matrix

| Browser        | WebRTC | `setSinkId` | Verdict     |
|----------------|--------|-------------|-------------|
| Chrome ≥120    | ✅     | ✅          | Supported   |
| Edge ≥120      | ✅     | ✅          | Supported   |
| Brave (latest) | ✅     | ✅          | Likely (untested) |
| Firefox        | ✅     | partial (116+) | Not supported in v1 |
| Safari         | ✅     | ❌          | Not supported   |

`setSinkId` is the single hard requirement. Without it the translated audio cannot be routed to the virtual cable.

## Known model limitations

- **No custom prompts, glossaries, or pronunciation guides.** If your meeting depends on specific names or domain terms, expect substitutions. Test these terms before going live.
- **Mixed-language speech** may produce silence. If the speaker switches into the listener's selected output language mid-sentence, the model may stop translating that segment. (See [`troubleshooting.md`](./troubleshooting.md#translation-cuts-during-target-language-words).)
- **No voice cloning.** The translated voice is style-matched (tone/pitch/speed), not a clone of you.
- **Names and proper nouns** can be substituted incorrectly under load. Important names: write them in chat as backup.
- **No turn / conversation state.** Pure stream-in / stream-out. The app keeps no history beyond the visible captions.
- **Backend is local-only.** Do not deploy `server/` to a public origin. The `Authorization` header path is intended for trusted clients on your machine, not the open internet.

## Privacy

- API keys (env or in-app) live on your machine only.
- Translated audio + captions never leave your computer except for the encrypted WebRTC stream OpenAI returns to play locally.
- The Debug panel logs are local; the **Copy debug bundle** action redacts API keys and never includes audio.

---

↑ Back to [README](../README.md) · See also [troubleshooting](./troubleshooting.md)

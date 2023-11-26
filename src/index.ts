#!/usr/bin/env node
import dayjs from "dayjs";
import { DMV_TRANSLATE_REQUEST_KIND, DMV_TRANSLATE_RESULT_KIND } from "./const.js";
import { RELAYS, ensureConnection, pool } from "./pool.js";
import { Event, finishEvent } from "nostr-tools";
import { getInput, getInputParam, getInputTag, getOutputType, getRelays } from "./helpers/dvm.js";
import { appDebug } from "./debug.js";
import { LIBRETRANSLATE_API, LIBRETRANSLATE_KEY, NOSTR_PRIVATE_KEY } from "./env.js";
import { unique } from "./helpers/array.js";
import { createTokens, replaceTokens } from "./helpers/tokens.js";
import { getMatchCashu, getMatchEmoji, getMatchHashtag, getMatchLink, getMatchNostrLink } from "./helpers/regexp.js";

const supportedLanguages = await fetch(new URL("/languages", LIBRETRANSLATE_API)).then(
  (res) => res.json() as Promise<{ code: string; name: string; targets: string[] }[]>,
);

type JobContext = {
  request: Event<number>;
  input: string;
  lang: string;
};

async function shouldAcceptJob(request: Event<5002>): Promise<JobContext> {
  const input = getInput(request);
  const output = getOutputType(request);
  const lang = getInputParam(request, "language");

  if (output !== "text/plain") throw new Error(`Unsupported output type ${output}`);

  if (!supportedLanguages.some((l) => l.code === lang)) throw new Error(`Unsupported language ${lang}`);

  if (input.type === "text") {
    return { input: input.value, request, lang };
  } else if (input.type === "event") {
    const event = await pool.get(input.relay ? [...RELAYS, input.relay] : RELAYS, { ids: [input.value] });
    if (!event) throw new Error("Failed to fetch event");
    return { input: event.content, request, lang };
  } else throw new Error(`Unknown input type ${input.type}`);
}

async function doWork(context: JobContext) {
  appDebug(`Starting work for ${context.request.id}`);

  const tokens = new Map<string, string>();
  let stripped = context.input;

  stripped = createTokens(stripped, getMatchNostrLink(), tokens, 100);
  stripped = createTokens(stripped, getMatchLink(), tokens, 200);
  stripped = createTokens(stripped, getMatchHashtag(), tokens, 300);
  stripped = createTokens(stripped, getMatchEmoji(), tokens, 400);
  stripped = createTokens(stripped, getMatchCashu(), tokens, 500);

  const output = await fetch(new URL("/translate", LIBRETRANSLATE_API), {
    method: "POST",
    body: JSON.stringify({
      q: stripped,
      source: "auto",
      target: context.lang,
      format: "text",
      api_key: LIBRETRANSLATE_KEY,
    }),
    headers: { "Content-Type": "application/json" },
  }).then(
    (res) =>
      res.json() as Promise<{ detectedLanguage: { confidence: number; language: string }; translatedText: string }>,
  );

  if (!output.translatedText) throw new Error("Failed to translate");

  const repaired = replaceTokens(output.translatedText, tokens);

  const result = finishEvent(
    {
      kind: DMV_TRANSLATE_RESULT_KIND,
      tags: [
        ["request", JSON.stringify(context.request)],
        ["e", context.request.id],
        ["p", context.request.pubkey],
        getInputTag(context.request),
      ],
      content: repaired,
      created_at: dayjs().unix(),
    },
    NOSTR_PRIVATE_KEY,
  );

  appDebug(`Finished work for ${context.request.id}`);
  await Promise.all(
    pool.publish(unique([...getRelays(context.request), ...RELAYS]), result).map((p) => p.catch((e) => {})),
  );
}

const jobsSub = pool.sub(RELAYS, [{ kinds: [DMV_TRANSLATE_REQUEST_KIND], since: dayjs().unix() }]);
jobsSub.on("event", async (event) => {
  if (event.kind === DMV_TRANSLATE_REQUEST_KIND) {
    try {
      const context = await shouldAcceptJob(event);
      try {
        await doWork(context);
      } catch (e) {
        if (e instanceof Error) {
          appDebug(`Failed to process request ${event.id} because`, e.message);
          console.log(e);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        appDebug(`Skipped request ${event.id} because`, e.message);
      }
    }
  }
});

setInterval(ensureConnection, 1000 * 30);

async function shutdown() {
  process.exit();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.once("SIGUSR2", shutdown);

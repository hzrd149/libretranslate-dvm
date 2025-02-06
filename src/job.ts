import { firstValueFrom } from "rxjs";
import { isHex } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import { LIBRETRANSLATE_API, LIBRETRANSLATE_KEY, NOSTR_RELAYS } from "./env.js";
import { logger } from "./debug.js";
import { getInput, getInputParam, getOutputType, getRelays } from "./helpers/dvm.js";
import { createTokens, replaceTokens } from "./helpers/tokens.js";
import { getMatchCashu, getMatchEmoji, getMatchHashtag, getMatchLink, getMatchNostrLink } from "./helpers/regexp.js";
import { eventLoader, eventStore, factory } from "./core.js";
import { MachineStatus } from "./blueprints/machine-status.js";
import { MachineResult } from "./blueprints/machine-result.js";

logger("Fetching supported languages");
const supportedLanguages = await fetch(new URL("/languages", LIBRETRANSLATE_API)).then(
  (res) => res.json() as Promise<{ code: string; name: string; targets: string[] }[]>,
);

async function* executeJob(request: NostrEvent) {
  const log = logger.extend(request.id.slice(0, 10));
  log(`Starting`);

  const input = getInput(request);
  const output = getOutputType(request);
  const lang = getInputParam(request, "language");

  // make sure output type is text
  if (output !== "text/plain") throw new Error(`Unsupported output type ${output}`);

  if (!supportedLanguages.some((l) => l.code === lang)) throw new Error(`Unsupported language ${lang}`);

  log("Parsing input");
  let inputContent = "";

  // get text input
  if (input.type === "text") {
    inputContent = input.value;
  } else if (input.type === "event") {
    if (!isHex(input.value)) throw new Error("Event input is not a hex string");

    const relays = [...NOSTR_RELAYS, input.relay, ...getRelays(request)].filter(Boolean);
    log(`Fetching event from ${relays.length} relays`);

    // request event
    eventLoader.next({
      id: input.value,
      relays,
    });

    // send status update
    yield await factory.create(MachineStatus, request, "Fetching event...", "processing");

    // wait for the event to load
    const event = await firstValueFrom(eventStore.event(input.value));
    if (!event) throw new Error("Failed to fetch event");

    inputContent = event.content;
  } else {
    throw new Error(`Unknown input type ${input.type}`);
  }

  if (!inputContent) throw new Error("Failed to find input content");

  // send start status
  yield await factory.create(MachineStatus, request, "Translating...", "processing");

  // remove tokens from content
  const tokens = new Map<string, string>();
  let stripped = inputContent;

  stripped = createTokens(stripped, getMatchNostrLink(), tokens, 100);
  stripped = createTokens(stripped, getMatchLink(), tokens, 200);
  stripped = createTokens(stripped, getMatchHashtag(), tokens, 300);
  stripped = createTokens(stripped, getMatchEmoji(), tokens, 400);
  stripped = createTokens(stripped, getMatchCashu(), tokens, 500);

  // make translation request
  const translation = await fetch(new URL("/translate", LIBRETRANSLATE_API), {
    method: "POST",
    body: JSON.stringify({
      q: stripped,
      source: "auto",
      target: lang,
      format: "text",
      api_key: LIBRETRANSLATE_KEY,
    }),
    headers: { "Content-Type": "application/json" },
  }).then(
    (res) =>
      res.json() as Promise<{ detectedLanguage: { confidence: number; language: string }; translatedText: string }>,
  );

  // throw if translation failed
  if (!translation.translatedText) throw new Error("Failed to translate");

  // fix tokens
  const repaired = replaceTokens(translation.translatedText, tokens);

  // send result
  yield await factory.create(MachineResult, request, repaired);

  log(`Finished`);
}

export default async function* handleRequest(request: NostrEvent) {
  try {
    yield* executeJob(request);
  } catch (error) {
    if (error instanceof Error) yield await factory.create(MachineStatus, request, error.message, "error");
  }
}

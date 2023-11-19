import type { Event } from "nostr-tools";

export function getInputTag(e: Event) {
  const tag = e.tags.find((t) => t[0] === "i");
  if (!tag) throw new Error("Missing tag");
  return tag;
}

export function getInput(e: Event) {
  const tag = getInputTag(e);
  const [_, value, type, relay, marker] = tag;
  if (!value) throw new Error("Missing input value");
  if (!type) throw new Error("Missing input type");
  return { value, type, relay, marker };
}
export function getRelays(event: Event) {
  return event.tags.find((t) => t[0] === "relays")?.slice(1) ?? [];
}
export function getOutputType(event: Event): string | undefined {
  return event.tags.find((t) => t[0] === "output")?.[1];
}

export function getInputParams(e: Event, k: string) {
  return e.tags.filter((t) => t[0] === "param" && t[1] === k).map((t) => t[2]);
}

export function getInputParam(e: Event, k: string) {
  const value = getInputParams(e, k)[0];
  if (value === undefined) throw new Error(`Missing ${k} param`);
  return value;
}

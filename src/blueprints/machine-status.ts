import { EventFactory, EventFactoryBlueprint } from "applesauce-factory";
import { NostrEvent } from "nostr-tools";
import { DMV_STATUS_KIND } from "../const.js";
import { includeAltTag, includeNameValueTag, setContent } from "applesauce-factory/operations";

export function MachineStatus(
  request: NostrEvent,
  message: string,
  status: "processing" | "error" | "success" | "partial" | "payment-required",
): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: DMV_STATUS_KIND },
      ctx,
      setContent(message),
      includeNameValueTag(["status", status]),
      includeNameValueTag(["e", request.id]),
      includeNameValueTag(["p", request.pubkey]),
      includeAltTag("DVM response event"),
    );
}

import { EventFactory, EventFactoryBlueprint, EventFactoryOperation } from "applesauce-factory";
import { includeAltTag, includeNameValueTag, setContent } from "applesauce-factory/operations";
import { NostrEvent } from "nostr-tools";

import { DMV_TRANSLATE_RESULT_KIND } from "../const.js";

// include copied "i" tags from request
function includeInputTags(request: NostrEvent): EventFactoryOperation {
  return (draft) => {
    const tags = Array.from(draft.tags);
    for (const tag of request.tags) {
      if (tag[0] === "i") tags.push(tag);
    }
    return { ...draft, tags };
  };
}

/** Build a translation result event */
export function MachineResult(request: NostrEvent, payload: string): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: DMV_TRANSLATE_RESULT_KIND },
      ctx,
      setContent(payload),
      includeInputTags(request),
      includeNameValueTag(["e", request.id]),
      includeNameValueTag(["p", request.pubkey]),
      includeNameValueTag(["request", JSON.stringify(request)]),
      includeAltTag("translation result"),
    );
}

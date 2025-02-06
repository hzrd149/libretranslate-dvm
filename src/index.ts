#!/usr/bin/env node
import { distinct, from, map, mergeMap } from "rxjs";
import { createRxForwardReq } from "rx-nostr";
import { generatorSequence } from "applesauce-loaders/operators";
import { unixNow } from "applesauce-core/helpers";
import { nip19 } from "nostr-tools";
import exitHook from "exit-hook";

import { DMV_TRANSLATE_REQUEST_KIND } from "./const.js";
import { eventStore, rxNostr, signer } from "./core.js";
import { logger } from "./debug.js";
import handleRequest from "./job.js";
import { getRelays } from "./helpers/dvm.js";

logger(`Starting translation dvm ${nip19.npubEncode(await signer.getPublicKey())}`);

const request = createRxForwardReq("requests");
const subscription = rxNostr
  .use(request)
  .pipe(
    // get the event
    map((packet) => eventStore.add(packet.event, packet.from)),
    // ignore duplicate requests (from multiple relays)
    distinct((event) => event.id),
    // breakout each request into a job
    mergeMap((request) =>
      from([request]).pipe(
        // handle request
        generatorSequence(handleRequest),
        // send events back to client
        mergeMap((template) => {
          const relays = getRelays(request);
          // publish event to relays
          return rxNostr.send(template, relays.length > 0 ? { on: { relays } } : undefined);
        }),
      ),
    ),
  )
  .subscribe((packet) => {
    if (packet.ok) {
      logger(`Published ${packet.eventId} to ${packet.from}`);
    }
  });

// subscribe to new jobs
request.emit({ kinds: [DMV_TRANSLATE_REQUEST_KIND], since: () => unixNow() - 60 });

exitHook(() => {
  logger(`Stopping subscription`);
  subscription.unsubscribe();
});

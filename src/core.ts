import { createRxNostr, EventSigner } from "rx-nostr";
import { verifier } from "rx-nostr-crypto";
import { EventStore, logger, QueryStore } from "applesauce-core";
import { SingleEventLoader } from "applesauce-loaders";
import { EventFactory } from "applesauce-factory";
import { SimpleSigner } from "applesauce-signers/signers/simple-signer";

import { NOSTR_PRIVATE_KEY, NOSTR_RELAYS } from "./env.js";
import exitHook from "exit-hook";

export const signer = new SimpleSigner(NOSTR_PRIVATE_KEY);

const log = logger.extend("rx-nostr");
export const rxNostr = createRxNostr({
  verifier,
  signer: signer as EventSigner,
});

rxNostr.setDefaultRelays(NOSTR_RELAYS);

rxNostr.createConnectionStateObservable().subscribe((packet) => {
  log(`${packet.state} ${packet.from}`);
});

export const factory = new EventFactory({ signer });

export const eventStore = new EventStore();
export const queryStore = new QueryStore(eventStore);

// cleanup the event store every minute
setTimeout(() => {
  const removed = eventStore.database.prune();
  if (removed) logger(`Forgot about ${removed} events`);
}, 60_000);

export const eventLoader = new SingleEventLoader(rxNostr);

const subscription = eventLoader.subscribe((packet) => {
  eventStore.add(packet.event, packet.from);
});

exitHook(() => {
  // stop the loader when the process exists
  subscription.unsubscribe();
});

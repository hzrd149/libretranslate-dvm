import { LNBITS_ADMIN_KEY, LNBITS_URL } from "../env.js";
import LNBitsBackend from "./lnbits/lnbits.js";
import { LightningBackend } from "./type.js";

function createBackend() {
  if (LNBITS_URL && LNBITS_ADMIN_KEY) {
    return new LNBitsBackend(LNBITS_URL, LNBITS_ADMIN_KEY);
  }

  throw new Error("No lightning backend configured");
}

const lightning: LightningBackend = createBackend();
await lightning.setup();

export { lightning };

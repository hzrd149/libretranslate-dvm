import "dotenv/config";

const LIBRETRANSLATE_API = process.env.LIBRETRANSLATE_API;
if (!LIBRETRANSLATE_API) throw new Error("Missing LIBRETRANSLATE_API");
const LIBRETRANSLATE_KEY = process.env.LIBRETRANSLATE_KEY || "";

const NOSTR_PRIVATE_KEY = process.env.NOSTR_PRIVATE_KEY;
if (!NOSTR_PRIVATE_KEY) throw new Error("Missing NOSTR_PRIVATE_KEY");

// lnbits
const LNBITS_URL = process.env.LNBITS_URL;
const LNBITS_ADMIN_KEY = process.env.LNBITS_ADMIN_KEY;

// nostr
const NOSTR_RELAYS = process.env.NOSTR_RELAYS;
if (!NOSTR_RELAYS) throw new Error("Missing NOSTR_RELAYS");

export { LIBRETRANSLATE_API, LIBRETRANSLATE_KEY, NOSTR_PRIVATE_KEY, LNBITS_URL, LNBITS_ADMIN_KEY, NOSTR_RELAYS };

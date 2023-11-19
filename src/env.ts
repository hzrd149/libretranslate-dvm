import "dotenv/config";

export const DB_PATH = process.env.DB_PATH || "./splits.json";
export const LIBRETRANSLATE_API = process.env.LIBRETRANSLATE_API;
if (!LIBRETRANSLATE_API) throw new Error("missing LIBRETRANSLATE_API");
export const LIBRETRANSLATE_KEY = process.env.LIBRETRANSLATE_KEY || "";

export const NOSTR_PRIVATE_KEY = process.env.NOSTR_PRIVATE_KEY;
if (!NOSTR_PRIVATE_KEY) throw new Error("missing NOSTR_PRIVATE_KEY");

// lnbits
export const LNBITS_URL = process.env.LNBITS_URL;
export const LNBITS_ADMIN_KEY = process.env.LNBITS_ADMIN_KEY;

// nostr
export const NOSTR_RELAYS = process.env.NOSTR_RELAYS?.split(",") ?? [];

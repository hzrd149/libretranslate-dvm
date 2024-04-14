import { createHash } from "node:crypto";
import { InvoiceStatus, LightningBackend } from "../type.js";
import { logger } from "../../debug.js";

export default class LNBitsBackend implements LightningBackend {
  url: string;
  adminKey: string;

  constructor(url: string, adminKey: string) {
    this.url = url;
    this.adminKey = adminKey;
  }

  private log = logger.extend("lnbits");
  private request<T = any>(url: string, opts?: RequestInit) {
    return fetch(new URL(url, this.url), {
      ...opts,
      headers: {
        ...opts?.headers,
        "X-Api-Key": this.adminKey,
      },
    }).then(async (res) => {
      if (res.headers.get("content-type") === "application/json") {
        const result: T = await res.json();

        //@ts-ignore
        if (result.detail !== undefined) {
          //@ts-ignore
          throw new Error("LNBits:" + result.detail);
        }

        return result;
      } else throw new Error("Expected JSON");
    });
  }

  async setup() {
    const result = await this.request("/api/v1/wallet");

    this.log(`Connected to wallet "${result.name}"`);
  }

  async createInvoice(amount: number, description: string = "", webhook?: string) {
    const hash = createHash("sha256");
    hash.update(description);

    const encoder = new TextEncoder();
    const view = encoder.encode(description);
    const unhashedDescription = Buffer.from(view).toString("hex");
    const descriptionHash = hash.digest("hex");

    const result = await this.request("/api/v1/payments", {
      method: "POST",
      body: JSON.stringify({
        out: false,
        amount: Math.round(amount / 1000), //convert amount to sats, since LNBits only takes sats
        memo: "invoice",
        internal: false,
        description_hash: descriptionHash,
        unhashed_description: unhashedDescription,
        webhook,
      }),
      headers: { "content-type": "application/json" },
    });

    return {
      paymentHash: result.payment_hash as string,
      paymentRequest: result.payment_request as string,
    };
  }

  async getInvoiceStatus(hash: string) {
    try {
      const result = await this.request(`/api/v1/payments/${hash}`);
      if (result.paid) return InvoiceStatus.PAID;
      else return InvoiceStatus.PENDING;
    } catch (e) {
      // payment expired or no longer exists
      return InvoiceStatus.EXPIRED;
    }
  }
}

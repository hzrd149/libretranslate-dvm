type InvoiceDetails = {
  paymentRequest: string;
  paymentHash: string;
};

export enum InvoiceStatus {
  PENDING = "pending",
  PAID = "paid",
  EXPIRED = "expired",
}

export interface LightningBackend {
  setup(): Promise<void>;
  createInvoice(amount: number, description?: string, webhook?: string): Promise<InvoiceDetails>;
  getInvoiceStatus(hash: string): Promise<InvoiceStatus>;
}

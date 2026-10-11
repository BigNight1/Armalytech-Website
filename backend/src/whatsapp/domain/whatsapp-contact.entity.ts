export interface WhatsAppContact {
  /** E.164 without the leading `+`; unique. */
  phoneE164: string;
  /** Last time the customer wrote to the business (opens the 24 h window). */
  lastInboundAt?: Date;
  /** Set when the customer asked to stop receiving promotions. */
  marketingOptOutAt?: Date;
  updatedAt: Date;
}

/** Customer-service window length enforced by WhatsApp. */
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isServiceWindowOpen(
  lastInboundAt: Date | undefined | null,
  now: Date = new Date(),
): boolean {
  if (!lastInboundAt) return false;
  const age = now.getTime() - lastInboundAt.getTime();
  return age >= 0 && age < SERVICE_WINDOW_MS;
}

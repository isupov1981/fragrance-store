export type GrowNotifyPayload = {
  transactionId: string;
  transactionToken: string;
  transactionTypeId?: string;
  paymentType?: string;
  sum: string;
  firstPaymentSum?: string;
  periodicalPaymentSum?: string;
  paymentsNum?: string;
  allPaymentsNum?: string;
  asmachta?: string;
  description?: string;
  fullName?: string;
  payerPhone?: string;
  cardBrandCode?: string;
  cardExp?: string;
  processId?: string;
  processToken?: string;
  customFields?: { cField1?: string; cField2?: string };
  cField1?: string;
};

export type GrowWebhookAction =
  | { kind: "unauthorized" }
  | { kind: "duplicate" }
  | { kind: "ignore" }
  | { kind: "amount_mismatch"; orderId: string }
  | { kind: "mark_paid"; orderId: string; transactionId: string; notify: GrowNotifyPayload };

function field(source: Record<string, unknown>, ...names: string[]) {
  for (const name of names) {
    const value = source[name];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

export function parseGrowNotify(source: Record<string, unknown>): GrowNotifyPayload | null {
  const customRaw = source.customFields;
  let customFields: GrowNotifyPayload["customFields"];
  if (typeof customRaw === "string") {
    try {
      customFields = JSON.parse(customRaw) as GrowNotifyPayload["customFields"];
    } catch {
      customFields = undefined;
    }
  } else if (customRaw && typeof customRaw === "object") {
    customFields = customRaw as GrowNotifyPayload["customFields"];
  }
  const nestedField = field(source, "customFields[cField1]", "customFields.cField1");
  if (nestedField) {
    customFields = { ...customFields, cField1: nestedField };
  }

  const payload: GrowNotifyPayload = {
    transactionId: field(source, "transactionId", "transactionid"),
    transactionToken: field(source, "transactionToken", "transactiontoken"),
    transactionTypeId: field(source, "transactionTypeId", "TransactionTypeId") || undefined,
    paymentType: field(source, "paymentType") || undefined,
    sum: field(source, "sum"),
    firstPaymentSum: field(source, "firstPaymentSum") || undefined,
    periodicalPaymentSum: field(source, "periodicalPaymentSum") || undefined,
    paymentsNum: field(source, "paymentsNum") || undefined,
    allPaymentsNum: field(source, "allPaymentsNum") || undefined,
    asmachta: field(source, "asmachta") || undefined,
    description: field(source, "description") || undefined,
    fullName: field(source, "fullName") || undefined,
    payerPhone: field(source, "payerPhone") || undefined,
    cardBrandCode: field(source, "cardBrandCode") || undefined,
    cardExp: field(source, "cardExp") || undefined,
    processId: field(source, "processId") || undefined,
    processToken: field(source, "processToken") || undefined,
    customFields,
    cField1: field(source, "cField1") || customFields?.cField1,
  };

  if (!payload.transactionId || !payload.transactionToken || !payload.sum) return null;
  return payload;
}

export function growMajorAmount(agorot: number) {
  return (agorot / 100).toFixed(2);
}

export function growAmountsMatch(notifiedSum: string, ilsAgorot: number) {
  const expected = Number(growMajorAmount(ilsAgorot));
  const actual = Number(notifiedSum);
  if (!Number.isFinite(expected) || !Number.isFinite(actual)) return false;
  return Math.abs(expected - actual) < 0.009;
}

export function interpretGrowNotify(input: {
  authorized: boolean;
  alreadyProcessed: boolean;
  payload: GrowNotifyPayload | null;
  order?: { id: string; status: string; ilsTotal: number } | null;
}): GrowWebhookAction {
  if (!input.authorized) return { kind: "unauthorized" };
  if (!input.payload) return { kind: "ignore" };
  if (input.alreadyProcessed) return { kind: "duplicate" };

  const orderId = input.payload.cField1?.trim();
  if (!orderId || !input.order) return { kind: "ignore" };
  if (!growAmountsMatch(input.payload.sum, input.order.ilsTotal)) {
    return { kind: "amount_mismatch", orderId };
  }
  return {
    kind: "mark_paid",
    orderId,
    transactionId: input.payload.transactionId,
    notify: input.payload,
  };
}

export async function applyGrowWebhookAction(
  action: GrowWebhookAction,
  eventId: string,
  deps: {
    findOrder: (id: string) => Promise<{ id: string; status: string } | undefined>;
    updateOrder: (id: string, update: { status: "paid" | "payment_failed"; paymentReference?: string }) => Promise<unknown>;
    markProcessed: (id: string, provider: string) => Promise<void>;
    sendConfirmation: (order: { id: string; status: string }) => Promise<void>;
    approveTransaction: (notify: GrowNotifyPayload) => Promise<void>;
  },
) {
  if (action.kind === "unauthorized") {
    return { received: false as const, status: 401 };
  }
  if (action.kind === "duplicate") {
    return { received: true as const, duplicate: true as const, status: 200 };
  }
  if (action.kind === "ignore") {
    return { received: true as const, duplicate: false as const, status: 200 };
  }
  if (action.kind === "amount_mismatch") {
    return { received: false as const, status: 409 };
  }

  const order = await deps.findOrder(action.orderId);
  if (order && order.status !== "paid") {
    await deps.approveTransaction(action.notify);
    await deps.updateOrder(order.id, { status: "paid", paymentReference: action.transactionId });
    await deps.sendConfirmation({ ...order, status: "paid" });
  }
  await deps.markProcessed(eventId, "grow");
  return { received: true as const, duplicate: false as const, status: 200 };
}

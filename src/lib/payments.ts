export const ORANGE_MONEY_PROVIDER = "Orange Money";
export const ORANGE_MONEY_PAY_TO_NUMBER = "75111891";

export function orangeMoneyPaymentPrompt(amount: number, reference: string) {
  return [
    `${ORANGE_MONEY_PROVIDER} payment required`,
    "",
    `Pay P${amount} to ${ORANGE_MONEY_PROVIDER}: ${ORANGE_MONEY_PAY_TO_NUMBER}`,
    `Reference: ${reference}`,
    "",
    "Tap OK only after you have sent the Orange Money payment.",
    "Your request will be saved as pending until admin verification.",
  ].join("\n");
}

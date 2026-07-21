export type VerificationStatus = "unverified" | "pending" | "verified";

export type VerificationRecord = {
  status: VerificationStatus;
  provider: "harbourly-mock";
  verifiedAt?: string;
  reference?: string;
};

const keyFor = (userName: string) =>
  `harbourly-verification-${userName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getVerificationStatus(userName: string): Promise<VerificationRecord> {
  await wait(180);
  const stored = localStorage.getItem(keyFor(userName));
  return stored
    ? (JSON.parse(stored) as VerificationRecord)
    : { status: "unverified", provider: "harbourly-mock" };
}

export async function startVerification(userName: string): Promise<VerificationRecord> {
  const pending: VerificationRecord = {
    status: "pending",
    provider: "harbourly-mock",
    reference: `mock_${crypto.randomUUID()}`,
  };
  localStorage.setItem(keyFor(userName), JSON.stringify(pending));

  // Mirrors the asynchronous provider flow. A production adapter would create a
  // server-side verification session, redirect to the provider, then consume a webhook.
  await wait(1_200);
  const verified: VerificationRecord = {
    ...pending,
    status: "verified",
    verifiedAt: new Date().toISOString(),
  };
  localStorage.setItem(keyFor(userName), JSON.stringify(verified));
  return verified;
}

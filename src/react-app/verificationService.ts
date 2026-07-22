export type VerificationStatus = "unverified" | "pending" | "verified";

export type VerificationRecord = {
  status: VerificationStatus;
  provider: "harbourly-mock";
  verifiedAt?: string;
  reference?: string;
};

export type MemberVerificationChecks = {
  governmentId: boolean;
  email: boolean;
  phone: boolean;
};

const keyFor = (userName: string) =>
  `harbourly-verification-${userName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`;

const DEMO_GOVERNMENT_ID_VERIFIED = new Set([
  "maya-finn",
  "alex-morgan",
  "samira-costa",
  "theo-janssen",
]);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function demoKey(userName: string) {
  return userName.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
}

export function getVerificationStatusSync(userName: string): VerificationRecord {
  const stored = localStorage.getItem(keyFor(userName));
  return stored
    ? (JSON.parse(stored) as VerificationRecord)
    : { status: "unverified", provider: "harbourly-mock" };
}

export async function getVerificationStatus(userName: string): Promise<VerificationRecord> {
  await wait(180);
  return getVerificationStatusSync(userName);
}

/** Dev / mock helper: instantly set government-ID verification without the provider delay. */
export function setMockVerificationStatus(
  userName: string,
  status: VerificationStatus,
): VerificationRecord {
  if (status === "unverified") {
    localStorage.removeItem(keyFor(userName));
    return { status: "unverified", provider: "harbourly-mock" };
  }
  const record: VerificationRecord = {
    status,
    provider: "harbourly-mock",
    reference: `mock_${crypto.randomUUID()}`,
    ...(status === "verified" ? { verifiedAt: new Date().toISOString() } : {}),
  };
  localStorage.setItem(keyFor(userName), JSON.stringify(record));
  return record;
}

export async function getMemberVerificationChecks(
  memberName: string,
  options?: {
    isSelf?: boolean;
    email?: string;
    phoneNumber?: string;
  },
): Promise<MemberVerificationChecks> {
  const record = await getVerificationStatus(memberName);
  if (options?.isSelf) {
    return {
      governmentId: record.status === "verified",
      email: Boolean(options.email?.trim()),
      phone: Boolean(options.phoneNumber?.trim()),
    };
  }
  // Public profiles: seed members appear verified without revealing contact values.
  const governmentId =
    record.status === "verified" || DEMO_GOVERNMENT_ID_VERIFIED.has(demoKey(memberName));
  return {
    governmentId,
    email: governmentId,
    phone: governmentId,
  };
}

export function isFullyVerified(checks: MemberVerificationChecks) {
  return checks.governmentId && checks.email && checks.phone;
}

export async function requireMemberVerified(
  memberName: string,
  options: { email?: string; phoneNumber?: string },
  errorCode = "VERIFICATION_REQUIRED",
) {
  const checks = await getMemberVerificationChecks(memberName, {
    isSelf: true,
    email: options.email,
    phoneNumber: options.phoneNumber,
  });
  if (!isFullyVerified(checks)) {
    throw new Error(errorCode);
  }
  return checks;
}

export async function requireApplicantVerified(
  memberName: string,
  options: { email?: string; phoneNumber?: string },
) {
  return requireMemberVerified(memberName, options, "APPLICATION_VERIFICATION_REQUIRED");
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

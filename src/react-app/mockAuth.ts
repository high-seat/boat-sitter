export type SocialProvider = "apple" | "facebook" | "google";

export type MockAccount = {
  email: string;
  emailConfirmed?: boolean;
  hashAlgorithm?: "fnv1a" | "sha256";
  name: string;
  image: string;
  passwordHash: string;
  salt: string;
  provider?: "password" | SocialProvider;
  termsAcceptedAt?: string;
  termsVersion?: string;
};

const STORAGE_KEY = "harbourly-mock-accounts";
const TERMS_VERSION = "2026-07-21";

const SOCIAL_PROFILES: Record<SocialProvider, { email: string; name: string; image: string }> = {
  apple: {
    email: "alex.apple@icloud.mock",
    name: "Alex Apple",
    image: "https://api.dicebear.com/9.x/initials/svg?seed=Apple",
  },
  facebook: {
    email: "alex.facebook@facebook.mock",
    name: "Alex Facebook",
    image: "https://api.dicebear.com/9.x/initials/svg?seed=Facebook",
  },
  google: {
    email: "alex.google@gmail.mock",
    name: "Alex Google",
    image: "https://api.dicebear.com/9.x/initials/svg?seed=Google",
  },
};

function accounts(): MockAccount[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as MockAccount[];
  } catch {
    return [];
  }
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function supportsSha256() {
  return typeof crypto !== "undefined" && typeof crypto.subtle?.digest === "function";
}

function fallbackHash(value: string) {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

async function hashPassword(password: string, salt: string, algorithm: "fnv1a" | "sha256") {
  const value = `${salt}:${password}`;
  if (algorithm === "sha256") {
    if (!supportsSha256()) throw new Error("auth.secureLoginRequired");
    return bytesToHex(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))),
    );
  }
  return fallbackHash(value);
}

function createSalt() {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToHex(bytes);
}

function isEmailConfirmed(account: MockAccount) {
  if (typeof account.emailConfirmed === "boolean") return account.emailConfirmed;
  return account.provider !== undefined && account.provider !== "password";
}

function publicAccount(account: MockAccount) {
  return {
    email: account.email,
    emailConfirmed: isEmailConfirmed(account),
    image: account.image,
    name: account.name,
  };
}

export async function signUpMockAccount(input: {
  acceptedTerms: boolean;
  email: string;
  name: string;
  password: string;
}) {
  if (!input.acceptedTerms) throw new Error("auth.termsRequired");
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  const existing = accounts();
  const email = input.email.trim().toLowerCase();
  if (existing.some((account) => account.email === email)) throw new Error("auth.emailExists");
  const hashAlgorithm = supportsSha256() ? "sha256" : "fnv1a";
  const salt = createSalt();
  const account: MockAccount = {
    email,
    emailConfirmed: false,
    hashAlgorithm,
    name: input.name.trim(),
    image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(input.name)}`,
    passwordHash: await hashPassword(input.password, salt, hashAlgorithm),
    salt,
    termsAcceptedAt: new Date().toISOString(),
    termsVersion: TERMS_VERSION,
    provider: "password",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, account]));
  return publicAccount(account);
}

export async function continueWithSocialProvider(
  provider: SocialProvider,
  options: { acceptedTerms: boolean },
) {
  await new Promise((resolve) => window.setTimeout(resolve, 550));
  const profile = SOCIAL_PROFILES[provider];
  const existing = accounts().find((account) => account.email === profile.email);
  if (existing) return publicAccount(existing);
  if (!options.acceptedTerms) throw new Error("auth.termsRequired");

  const hashAlgorithm = supportsSha256() ? "sha256" : "fnv1a";
  const salt = createSalt();
  const account: MockAccount = {
    email: profile.email,
    emailConfirmed: true,
    hashAlgorithm,
    name: profile.name,
    image: profile.image,
    passwordHash: await hashPassword(`social:${provider}`, salt, hashAlgorithm),
    salt,
    provider,
    termsAcceptedAt: new Date().toISOString(),
    termsVersion: TERMS_VERSION,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...accounts(), account]));
  return publicAccount(account);
}

export async function loginMockAccount(emailInput: string, password: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  const account = accounts().find(
    (candidate) => candidate.email === emailInput.trim().toLowerCase(),
  );
  if (
    !account ||
    (await hashPassword(password, account.salt, account.hashAlgorithm ?? "sha256")) !==
      account.passwordHash
  ) {
    throw new Error("auth.invalidCredentials");
  }
  return publicAccount(account);
}

export async function deleteMockAccount(name: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(accounts().filter((account) => account.name !== name)),
  );
}

async function verifyAccountPassword(account: MockAccount, password: string) {
  return (
    (await hashPassword(password, account.salt, account.hashAlgorithm ?? "sha256")) ===
    account.passwordHash
  );
}

function saveAccounts(next: MockAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function changeMockAccountEmail(input: {
  currentEmail: string;
  newEmail: string;
  password: string;
}) {
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  const currentEmail = input.currentEmail.trim().toLowerCase();
  const newEmail = input.newEmail.trim().toLowerCase();
  const existing = accounts();
  const account = existing.find((candidate) => candidate.email === currentEmail);
  if (!account) throw new Error("settings.accountCredentialsUnavailable");
  if (!(await verifyAccountPassword(account, input.password))) {
    throw new Error("auth.invalidCredentials");
  }
  if (newEmail === currentEmail) throw new Error("settings.sameEmail");
  if (existing.some((candidate) => candidate.email === newEmail)) {
    throw new Error("auth.emailExists");
  }
  const updated = { ...account, email: newEmail, emailConfirmed: false };
  saveAccounts(
    existing.map((candidate) =>
      candidate.email === currentEmail ? updated : candidate,
    ),
  );
  return publicAccount(updated);
}

export async function resendMockEmailConfirmation(emailInput: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 500));
  const email = emailInput.trim().toLowerCase();
  if (!email) throw new Error("settings.confirmationResendFailed");
  const account = accounts().find((candidate) => candidate.email === email);
  if (account && isEmailConfirmed(account)) throw new Error("settings.emailAlreadyConfirmed");
  return { sent: true as const };
}

export async function changeMockAccountPassword(input: {
  email: string;
  currentPassword: string;
  newPassword: string;
}) {
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  const email = input.email.trim().toLowerCase();
  const existing = accounts();
  const account = existing.find((candidate) => candidate.email === email);
  if (!account) throw new Error("settings.accountCredentialsUnavailable");
  if (!(await verifyAccountPassword(account, input.currentPassword))) {
    throw new Error("auth.invalidCredentials");
  }
  if (input.newPassword.length < 8) throw new Error("auth.passwordInvalid");
  const hashAlgorithm = supportsSha256() ? "sha256" : "fnv1a";
  const salt = createSalt();
  const passwordHash = await hashPassword(input.newPassword, salt, hashAlgorithm);
  saveAccounts(
    existing.map((candidate) =>
      candidate.email === email
        ? {
            ...candidate,
            hashAlgorithm,
            passwordHash,
            salt,
            provider: "password",
          }
        : candidate,
    ),
  );
  return publicAccount(account);
}

export type MockAccount = {
  email: string;
  name: string;
  image: string;
  passwordHash: string;
  salt: string;
};

const STORAGE_KEY = "harbourly-mock-accounts";

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

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return bytesToHex(new Uint8Array(await crypto.subtle.digest("SHA-256", data)));
}

function publicAccount(account: MockAccount) {
  return {
    email: account.email,
    image: account.image,
    name: account.name,
  };
}

export async function signUpMockAccount(input: { email: string; name: string; password: string }) {
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  const existing = accounts();
  const email = input.email.trim().toLowerCase();
  if (existing.some((account) => account.email === email)) throw new Error("auth.emailExists");
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const account: MockAccount = {
    email,
    name: input.name.trim(),
    image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(input.name)}`,
    passwordHash: await hashPassword(input.password, salt),
    salt,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, account]));
  return publicAccount(account);
}

export async function loginMockAccount(emailInput: string, password: string) {
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  const account = accounts().find(
    (candidate) => candidate.email === emailInput.trim().toLowerCase(),
  );
  if (!account || (await hashPassword(password, account.salt)) !== account.passwordHash) {
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

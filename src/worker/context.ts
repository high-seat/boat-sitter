/** Shared Hono environment: bindings plus the auth user/session on context. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface AppEnv {
  Bindings: Env;
  Variables: {
    user: SessionUser | null;
    session: unknown | null;
  };
}

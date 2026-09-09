import { getSmeApiBaseUrl } from "@/apis/config";
import type {
  AccountMeApiEnvelope,
  LoginApiEnvelope,
  LoginCredentials,
  LoginSuccessData,
  GetAccountMeResult,
  PostLoginResult,
  LogoutApiEnvelope,
  PostLogoutResult,
  RegisterApiEnvelope,
  RegisterBusinessInput,
  PostRegisterResult,
  VerifyEmailApiEnvelope,
  VerifyEmailResult,
} from "@/types/auth";

export type {
  LoginCredentials,
  LoginSuccessData,
  AccountProfileData,
  GetAccountMeResult,
  PostLoginResult,
  PostLogoutResult,
  RegisterBusinessInput,
  RegisterSuccessData,
  PostRegisterResult,
  VerifyEmailResult,
} from "@/types/auth";

function normalizeLoginData(raw: unknown): LoginSuccessData {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const num = (v: unknown) => (typeof v === "number" ? v : undefined);
  return {
    userId: str(o.userId) ?? str(o.user_id),
    businessId: str(o.businessId) ?? str(o.business_id),
    accessToken: str(o.accessToken) ?? str(o.access_token) ?? str(o.token),
    refreshToken: str(o.refreshToken) ?? str(o.refresh_token),
    expiresIn: num(o.expiresIn) ?? num(o.expires_in),
  };
}

/** POST /auth/register — call from server actions or trusted server code. */
export async function postRegister(
  business: RegisterBusinessInput,
): Promise<PostRegisterResult> {
  const url = `${getSmeApiBaseUrl()}/auth/register`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business }),
    });
  } catch {
    return {
      ok: false,
      errorMessage:
        "Could not reach the server. Check your connection and try again.",
    };
  }

  let json: RegisterApiEnvelope;
  try {
    json = (await res.json()) as RegisterApiEnvelope;
  } catch {
    return {
      ok: false,
      errorMessage: `Unexpected response (${res.status}). Please try again.`,
    };
  }

  if (json.success && json.data) {
    return { ok: true, data: json.data };
  }

  const errorMessage =
    json.error?.message ??
    (res.ok ? "Registration could not be completed." : `Request failed (${res.status}).`);

  return {
    ok: false,
    errorMessage,
    errorCode: json.error?.code,
  };
}

/** POST /auth/login */
export async function postLogin(
  credentials: LoginCredentials,
): Promise<PostLoginResult> {
  const url = `${getSmeApiBaseUrl()}/auth/login`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return {
      ok: false,
      errorMessage: timedOut
        ? "The API did not respond in time. Check that the backend is running."
        : "Could not reach the server. Check your connection and try again.",
    };
  }

  let json: LoginApiEnvelope;
  try {
    json = (await res.json()) as LoginApiEnvelope;
  } catch {
    return {
      ok: false,
      errorMessage: `Unexpected response (${res.status}). Please try again.`,
    };
  }

  if (json.success && json.data != null) {
    return { ok: true, data: normalizeLoginData(json.data) };
  }

  const errorMessage =
    json.error?.message ??
    (res.ok ? "Sign in could not be completed." : `Request failed (${res.status}).`);

  return {
    ok: false,
    errorMessage,
    errorCode: json.error?.code,
  };
}

/** GET /account/me */
export async function getAccountMe(
  accessToken: string,
): Promise<GetAccountMeResult> {
  const url = `${getSmeApiBaseUrl()}/account/me`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      errorMessage:
        "Could not load your account profile. Check your connection and try again.",
    };
  }

  let json: AccountMeApiEnvelope;
  try {
    json = (await res.json()) as AccountMeApiEnvelope;
  } catch {
    return {
      ok: false,
      errorMessage: `Unexpected profile response (${res.status}). Please try again.`,
    };
  }

  if (json.success && json.data) {
    return { ok: true, data: json.data };
  }

  const errorMessage =
    json.error?.message ??
    (res.ok
      ? "Your account profile could not be loaded."
      : `Profile request failed (${res.status}).`);

  return {
    ok: false,
    errorMessage,
    errorCode: json.error?.code,
  };
}

/** POST /auth/logout */
export async function postLogout(
  refreshToken: string,
): Promise<PostLogoutResult> {
  const url = `${getSmeApiBaseUrl()}/auth/logout`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return {
      ok: false,
      errorMessage:
        "Could not reach the server to log out. Your local session can still be cleared.",
    };
  }

  let json: LogoutApiEnvelope;
  try {
    json = (await res.json()) as LogoutApiEnvelope;
  } catch {
    return {
      ok: false,
      errorMessage: `Unexpected logout response (${res.status}).`,
    };
  }

  if (json.success) {
    return { ok: true, message: json.data ?? "Logged out successfully" };
  }

  const errorMessage =
    json.error?.message ??
    (res.ok ? "Logout could not be completed." : `Logout failed (${res.status}).`);

  return {
    ok: false,
    errorMessage,
    errorCode: json.error?.code,
  };
}

/** GET /auth/verify?token=... */
export async function verifyEmailToken(
  token: string,
): Promise<VerifyEmailResult> {
  const url = `${getSmeApiBaseUrl()}/auth/verify?token=${encodeURIComponent(token)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "*/*" },
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      errorMessage:
        "Could not reach the server to verify your email. Check your connection and try again.",
    };
  }

  let json: VerifyEmailApiEnvelope;
  try {
    json = (await res.json()) as VerifyEmailApiEnvelope;
  } catch {
    return {
      ok: false,
      errorMessage: `Unexpected verification response (${res.status}).`,
    };
  }

  if (json.success) {
    return { ok: true, message: json.data ?? "Email verified successfully." };
  }

  const errorMessage =
    json.error?.message ??
    (res.ok
      ? "Email verification could not be completed."
      : `Verification failed (${res.status}).`);

  return {
    ok: false,
    errorMessage,
    errorCode: json.error?.code,
  };
}

// ── Password reset ────────────────────────────────────────────────────────────

type SimpleApiEnvelope = { success: boolean; data?: string; error?: { code?: string; message?: string } };

export type PasswordResetResult =
  | { ok: true; message: string }
  | { ok: false; errorMessage: string; errorCode?: string };

/** POST /auth/forgot-password — always returns 200; never reveals whether email exists. */
export async function postForgotPassword(email: string): Promise<PasswordResetResult> {
  const url = `${getSmeApiBaseUrl()}/auth/forgot-password`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    return {
      ok: false,
      errorMessage: "Could not reach the server. Check your connection and try again.",
    };
  }

  let json: SimpleApiEnvelope;
  try {
    json = (await res.json()) as SimpleApiEnvelope;
  } catch {
    return { ok: false, errorMessage: `Unexpected response (${res.status}).` };
  }

  if (json.success) {
    return { ok: true, message: json.data ?? "Reset email sent if that address is registered." };
  }

  return {
    ok: false,
    errorMessage: json.error?.message ?? `Request failed (${res.status}).`,
    errorCode: json.error?.code,
  };
}

/** POST /auth/reset-password — validates token and sets the new password. */
export async function postResetPassword(
  token: string,
  newPassword: string,
): Promise<PasswordResetResult> {
  const url = `${getSmeApiBaseUrl()}/auth/reset-password`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
  } catch {
    return {
      ok: false,
      errorMessage: "Could not reach the server. Check your connection and try again.",
    };
  }

  let json: SimpleApiEnvelope;
  try {
    json = (await res.json()) as SimpleApiEnvelope;
  } catch {
    return { ok: false, errorMessage: `Unexpected response (${res.status}).` };
  }

  if (json.success) {
    return { ok: true, message: json.data ?? "Password reset successfully." };
  }

  return {
    ok: false,
    errorMessage: json.error?.message ?? `Request failed (${res.status}).`,
    errorCode: json.error?.code,
  };
}

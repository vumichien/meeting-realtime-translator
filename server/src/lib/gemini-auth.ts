// Vertex AI OAuth-token minting from service-account JSON.
// Implementation lands in phase 03 once `google-auth-library` is installed.
// Phase 02 ships a stub that returns a clear error so the AI Studio path
// still works in isolation.

const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

export interface MintVertexOptions {
  serviceAccountJson: string;
  project: string;
  region: string;
  requestId: string;
}

export interface MintVertexResult {
  ok: true;
  accessToken: string;
  expires_at: number;
  wsBaseUrl: string;
}

export interface MintVertexFailure {
  ok: false;
  status: number;
  errorCode: string;
  message: string;
  requestId: string;
}

export async function mintGeminiVertexToken(
  opts: MintVertexOptions,
): Promise<MintVertexResult | MintVertexFailure> {
  // Dynamic import so AI-Studio-only users don't pay for google-auth-library
  // when it isn't installed. If the dep is missing we surface a clear error.
  let GoogleAuthCtor: any;
  try {
    // @ts-ignore - optional dep installed in phase 03
    const mod = await import("google-auth-library");
    GoogleAuthCtor = (mod as any).GoogleAuth;
  } catch (err) {
    return {
      ok: false,
      status: 501,
      errorCode: "vertex_not_configured",
      message:
        "Vertex AI mode requires `google-auth-library`. Run `npm i -w server google-auth-library`.",
      requestId: opts.requestId,
    };
  }

  let credentials: unknown;
  try {
    credentials = JSON.parse(opts.serviceAccountJson);
  } catch (err) {
    return {
      ok: false,
      status: 400,
      errorCode: "invalid_service_account",
      message: "serviceAccountJson is not valid JSON.",
      requestId: opts.requestId,
    };
  }

  try {
    const auth = new GoogleAuthCtor({ credentials, scopes: SCOPES });
    const client = await auth.getClient();
    const tokenResp = await client.getAccessToken();
    const accessToken: string | null | undefined = tokenResp?.token;
    if (!accessToken) {
      return {
        ok: false,
        status: 500,
        errorCode: "vertex_token_missing",
        message: "google-auth-library returned no access token.",
        requestId: opts.requestId,
      };
    }
    // OAuth access tokens default to ~1 hour TTL.
    const expires_at = Date.now() + 55 * 60 * 1000;
    const wsBaseUrl = `wss://${opts.region}-aiplatform.googleapis.com`;
    return { ok: true, accessToken, expires_at, wsBaseUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return {
      ok: false,
      status: 502,
      errorCode: "vertex_auth_failed",
      message,
      requestId: opts.requestId,
    };
  }
}

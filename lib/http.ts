export async function readApiJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`Request failed (${res.status}).`);
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      res.ok
        ? "The server returned an unexpected response."
        : "Sign-in is temporarily unavailable. Please try again.",
    );
  }
}

export type AuthApiResponse = {
  ok?: boolean;
  error?: string;
  step?: "otp" | "pin" | "pin-setup";
  email?: string;
  delivered?: boolean;
  devOtp?: string;
};

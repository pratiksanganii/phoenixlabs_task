import { apiUrl } from "./api-config";
import type { SessionStateResponse, SubmitAnswerPayload } from "./session-types";

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function startSession(): Promise<SessionStateResponse> {
  return fetch(apiUrl("/api/session/start"), { method: "POST" }).then(
    (res) => parseJson<SessionStateResponse>(res)
  );
}

export function getSession(sessionId: string): Promise<SessionStateResponse> {
  return fetch(apiUrl(`/api/session/${sessionId}`)).then((res) =>
    parseJson<SessionStateResponse>(res)
  );
}

export function submitAnswer(
  payload: SubmitAnswerPayload
): Promise<SessionStateResponse> {
  return fetch(apiUrl("/api/session/answer"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((res) => parseJson<SessionStateResponse>(res));
}

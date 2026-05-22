import type {
  SessionStateResponse,
  SubmitAnswerPayload,
} from "@phoenixlabs/form-engine";

export type { SessionStateResponse, SubmitAnswerPayload };

export const SESSION_STORAGE_KEY = "phoenix_session_id";

export function draftStorageKey(sessionId: string, screenId: string): string {
  return `phoenix_draft_${sessionId}_${screenId}`;
}

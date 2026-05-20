import type {
  EvaluationResult,
  FormResponse,
  ScreenId,
} from "@phoenixlabs/form-engine";

export interface SessionStateResponse {
  sessionId: string;
  currentScreenId: ScreenId;
  savedAnswers: Partial<FormResponse>;
  evaluationResult: EvaluationResult | null;
}

export interface SubmitAnswerPayload {
  sessionId: string;
  screenId: ScreenId;
  answer: unknown;
}

export const SESSION_STORAGE_KEY = "phoenix_session_id";

export function draftStorageKey(sessionId: string, screenId: string): string {
  return `phoenix_draft_${sessionId}_${screenId}`;
}

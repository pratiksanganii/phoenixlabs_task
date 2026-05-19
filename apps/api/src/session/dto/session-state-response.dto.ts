import type {
  EvaluationResult,
  FormResponse,
  ScreenId,
} from '@phoenix/form-engine';

export interface SessionStateResponse {
  sessionId: string;
  currentScreenId: ScreenId;
  savedAnswers: Partial<FormResponse>;
  evaluationResult: EvaluationResult | null;
}

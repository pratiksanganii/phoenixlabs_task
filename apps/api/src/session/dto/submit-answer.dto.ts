import { ScreenId } from '@phoenix/form-engine';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  sessionId!: string;

  @IsEnum(ScreenId)
  screenId!: ScreenId;

  @IsNotEmpty()
  answer!: unknown;
}

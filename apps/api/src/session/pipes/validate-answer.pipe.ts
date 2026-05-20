import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ScreenId } from '@phoenixlabs/form-engine';
import { z } from 'zod';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';

const yesNoSchema = z.enum(['Yes', 'No']);

const answerSchemas: Partial<Record<ScreenId, z.ZodType>> = {
  [ScreenId.AGE]: z.number(),
  [ScreenId.WEIGHT]: z.number(),
  [ScreenId.HEIGHT]: z.number(),
  [ScreenId.PREGNANCY_STATUS]: yesNoSchema,
  [ScreenId.COMORBID_CONDITIONS]: z.array(
    z.enum([
      'Hypertension',
      'Dyslipidemia',
      'Sleep Apnea',
      'GERD',
      'Thyroid Disorder',
    ]),
  ),
  [ScreenId.DIABETES_HISTORY]: yesNoSchema,
  [ScreenId.MOST_RECENT_HbA1c]: z.number(),
  [ScreenId.BLOOD_PRESSURE_CATEGORIES]: z.array(
    z.enum([
      'Normal (< 120/80)',
      'Elevated (120-129/<80)',
      'Stage 1 Hypertension (130-139/80-89)',
      'Stage 2 Hypertension (>=140/>=90)',
      'Hypertensive Crisis (>180/>120)',
    ]),
  ),
  [ScreenId.CURRENT_MEDICATIONS]: z.array(
    z.enum([
      'ACE inhibitors',
      'Beta blockers',
      'Statins',
      'Thyroid medication',
      'GLP-1 receptor agonist',
    ]),
  ),
  [ScreenId.SMOKING_STATUS]: yesNoSchema,
  [ScreenId.ALCOHOL_USE_FREQUENCY]: z.enum([
    'Never',
    'Monthly',
    'Weekly',
    'Daily',
  ]),
  [ScreenId.PHYSICAL_ACTIVITY_LEVEL]: z.enum([
    'Sedentary',
    'Light (1-2x/week)',
    'Moderate (3-4x/week)',
    'Vigorous (5+x/week)',
  ]),
  [ScreenId.DIETARY_HABITS]: z.array(
    z.enum([
      'High sugar intake',
      'High processed foods',
      'Frequent sugary beverages',
      'High fiber diet',
      'Balanced diet',
    ]),
  ),
};

const nonSubmittableScreens = new Set<ScreenId>([
  ScreenId.BMI,
  ScreenId.FINAL_SCREEN,
]);

@Injectable()
export class ValidateAnswerPipe implements PipeTransform {
  transform(value: SubmitAnswerDto, _metadata: ArgumentMetadata): SubmitAnswerDto {
    if (nonSubmittableScreens.has(value.screenId)) {
      throw new BadRequestException(
        `Screen "${value.screenId}" cannot accept direct answers.`,
      );
    }

    const schema = answerSchemas[value.screenId];
    if (!schema) {
      throw new BadRequestException(`Unknown screen id: ${value.screenId}`);
    }

    const result = schema.safeParse(value.answer);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }

    return { ...value, answer: result.data };
  }
}

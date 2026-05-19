import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UsePipes,
} from '@nestjs/common';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { SessionStateResponse } from './dto/session-state-response.dto';
import { ValidateAnswerPipe } from './pipes/validate-answer.pipe';
import { SessionService } from './session.service';

@Controller('api/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('start')
  startSession(): Promise<SessionStateResponse> {
    return this.sessionService.startSession();
  }

  @Post('answer')
  @UsePipes(ValidateAnswerPipe)
  submitAnswer(@Body() dto: SubmitAnswerDto): Promise<SessionStateResponse> {
    return this.sessionService.submitAnswer(dto);
  }

  @Get(':id')
  getSession(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SessionStateResponse> {
    return this.sessionService.getSession(id);
  }
}

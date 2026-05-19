import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [PrismaModule, SessionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

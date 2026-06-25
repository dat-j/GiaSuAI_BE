import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolveController } from './solve.controller';
import { SolveService } from './solve.service';
import { VerifierService } from './verifier.service';
import { ModelsModule } from '../models/models.module';
import { QuotaModule } from '../quota/quota.module';
import { AuthModule } from '../auth/auth.module';
import { SolveRequest } from '../database/entities/solve-request.entity';
import { SolveFeedback } from '../database/entities/solve-feedback.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolveRequest, SolveFeedback, User]),
    ModelsModule,
    QuotaModule,
    AuthModule,
  ],
  controllers: [SolveController],
  providers: [SolveService, VerifierService],
})
export class SolveModule {}

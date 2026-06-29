import { Module } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [FirebaseAuthGuard, AuthService],
  exports: [FirebaseAuthGuard],
})
export class AuthModule {}

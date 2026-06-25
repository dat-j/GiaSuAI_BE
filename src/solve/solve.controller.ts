import {
  Body, Controller, Get, HttpCode, Param, Post,
  Req, UseGuards, HttpException, HttpStatus,
} from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { SolveService } from './solve.service';
import { QuotaService } from '../quota/quota.service';
import { SolveFeedbackDto, SolveRequestDto } from './solve.dto';

@Controller()
export class SolveController {
  constructor(
    private solve: SolveService,
    private quota: QuotaService,
  ) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Post('solve')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard)
  async solveEndpoint(@Body() dto: SolveRequestDto, @Req() req: any) {
    const { uid, isPremium } = req.user;
    const ip = req.ip ?? req.headers['x-forwarded-for'] ?? '0.0.0.0';

    try {
      await this.quota.checkIpLimit(ip);
      await this.quota.checkUserQuota(uid, isPremium);
    } catch (err: any) {
      const msg =
        err.code === 'QUOTA_EXCEEDED'
          ? 'Hết lượt hôm nay'
          : 'Quá nhiều yêu cầu';
      throw new HttpException(
        { statusCode: 429, code: err.code, message: msg },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return this.solve.solve(dto, uid, isPremium, ip);
  }

  @Post('solve/:id/feedback')
  @HttpCode(201)
  @UseGuards(FirebaseAuthGuard)
  async feedback(
    @Param('id') id: string,
    @Body() dto: SolveFeedbackDto,
    @Req() req: any,
  ) {
    await this.solve.submitFeedback(id, dto, req.user.uid);
    return { success: true };
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async me(@Req() req: any) {
    return this.solve.getMe(req.user.uid, req.user.isPremium);
  }
}

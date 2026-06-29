import {
  Body, Controller, Get, HttpCode, Param, Post,
  Req, UseGuards, HttpException, HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiBadRequestResponse,
  ApiTooManyRequestsResponse, ApiUnauthorizedResponse, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { SolveService } from './solve.service';
import { QuotaService } from '../quota/quota.service';
import { SolveFeedbackDto, SolveRequestDto } from './solve.dto';
import {
  ErrorResponseDto, FeedbackResponseDto, HealthResponseDto,
  MeResponseDto, SolveResponseDto,
} from './solve-response.dto';

@ApiTags('Solve')
@Controller()
export class SolveController {
  constructor(
    private solve: SolveService,
    private quota: QuotaService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Kiểm tra trạng thái hoạt động của hệ thống' })
  @ApiOkResponse({ type: HealthResponseDto })
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
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({
    summary: 'Giải bài tập bằng AI',
    description:
      'Nhận đề bài dạng văn bản hoặc ảnh, trả về lời giải từng bước, đáp án và mức độ tin cậy. ' +
      'Áp dụng giới hạn lượt theo IP và theo tài khoản (5 lượt/ngày cho free, 50 lượt/ngày cho premium).',
  })
  @ApiOkResponse({ type: SolveResponseDto })
  @ApiBadRequestResponse({ description: 'Đầu vào không hợp lệ (thiếu text/ảnh, ảnh sai định dạng hoặc quá lớn)', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token Firebase không hợp lệ hoặc đã hết hạn' })
  @ApiTooManyRequestsResponse({ description: 'Vượt giới hạn lượt theo IP hoặc đã hết lượt giải trong ngày', type: ErrorResponseDto })
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
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Gửi phản hồi/báo lỗi cho một kết quả giải bài' })
  @ApiCreatedResponse({ type: FeedbackResponseDto })
  @ApiBadRequestResponse({ description: 'Không tìm thấy bài giải tương ứng với id' })
  @ApiUnauthorizedResponse({ description: 'Token Firebase không hợp lệ hoặc đã hết hạn' })
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
  @ApiBearerAuth('firebase-auth')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản và quota hiện tại' })
  @ApiOkResponse({ type: MeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token Firebase không hợp lệ hoặc đã hết hạn' })
  async me(@Req() req: any) {
    return this.solve.getMe(req.user.uid, req.user.isPremium);
  }
}

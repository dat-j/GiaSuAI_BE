import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2026-06-29T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;
}

export class SolveStepDto {
  @ApiProperty({ example: 'Chuyển vế' })
  title: string;

  @ApiProperty({ example: 'Chuyển 3 sang vế phải: 2x = 7 - 3' })
  explanation: string;

  @ApiPropertyOptional({ example: '2x = 7 - 3', nullable: true })
  formula_latex?: string;
}

export class SimilarQuestionDto {
  @ApiProperty({ example: 'Giải phương trình: 3x - 5 = 10' })
  question: string;

  @ApiProperty({ example: 'easy' })
  difficulty: string;
}

export class VerificationPayloadDto {
  @ApiPropertyOptional({ example: '2*2 + 3' })
  equation_lhs?: string;

  @ApiPropertyOptional({ example: '7' })
  equation_rhs?: string;
}

export class SolveResponseDto {
  @ApiProperty({ description: 'ID của bản ghi giải bài (dùng để gửi feedback)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Nội dung đề bài (trích từ text hoặc OCR từ ảnh)', example: 'Giải phương trình: 2x + 3 = 7' })
  problem_text: string;

  @ApiProperty({ example: 'linear_equation' })
  problem_type: string;

  @ApiProperty({ enum: ['easy', 'medium', 'hard'], example: 'easy' })
  difficulty: string;

  @ApiProperty({ type: [SolveStepDto] })
  steps: SolveStepDto[];

  @ApiProperty({ example: 'x = 2' })
  final_answer: string;

  @ApiProperty({ example: 'numeric' })
  answer_type: string;

  @ApiProperty({
    description: 'Các biến số trích xuất từ bài toán',
    type: 'object',
    additionalProperties: true,
    example: { x: 2 },
  })
  variables: Record<string, any>;

  @ApiPropertyOptional({ type: VerificationPayloadDto, nullable: true })
  verification_payload?: VerificationPayloadDto;

  @ApiProperty({ description: 'Độ tin cậy của kết quả (0-1)', example: 0.95 })
  confidence: number;

  @ApiProperty({ description: 'Kết quả đã được xác minh bằng công cụ tính toán hay chưa', example: true })
  verified: boolean;

  @ApiProperty({ type: [String], description: 'Các cảnh báo (nếu có)', example: [] })
  warnings: string[];

  @ApiProperty({ example: 'Lớp 8' })
  grade_level: string;

  @ApiProperty({ example: 'Phương trình bậc nhất một ẩn' })
  curriculum_topic: string;

  @ApiProperty({ type: [String], example: ['Quên đổi dấu khi chuyển vế'] })
  common_mistakes: string[];

  @ApiProperty({ type: [SimilarQuestionDto] })
  similar_questions: SimilarQuestionDto[];

  @ApiProperty({ description: 'Model AI được sử dụng để giải bài', example: 'gemini-2.0-flash' })
  model_used: string;

  @ApiProperty({ description: 'Số lượt giải còn lại trong ngày', example: 4 })
  quota_remaining: number;
}

export class FeedbackResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class QuotaInfoDto {
  @ApiProperty({ example: 1 })
  used: number;

  @ApiProperty({ example: 5 })
  limit: number;

  @ApiProperty({ example: 4 })
  remaining: number;

  @ApiProperty({ example: '2026-06-30T17:00:00.000Z', description: 'Thời điểm reset quota (00:00 giờ Việt Nam)' })
  reset_at: string;
}

export class MeResponseDto {
  @ApiProperty({ example: 'gJ8sK2dQpZx...' })
  uid: string;

  @ApiProperty({ enum: ['free', 'premium'], example: 'free' })
  tier: string;

  @ApiProperty({ type: QuotaInfoDto })
  quota: QuotaInfoDto;

  @ApiPropertyOptional({ nullable: true, example: null, description: 'Thời điểm hết hạn premium (nếu có)' })
  premium_until: string | null;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiPropertyOptional({ example: 'INVALID_INPUT' })
  code?: string;

  @ApiProperty({ example: 'input_type hoặc text/image thiếu' })
  message: string;
}

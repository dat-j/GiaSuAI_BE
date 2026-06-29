import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SolveRequestDto {
  @ApiProperty({
    enum: ['text', 'image'],
    description: 'Loại đầu vào của bài tập: nhập văn bản hoặc ảnh chụp đề bài',
    example: 'text',
  })
  @IsIn(['text', 'image'])
  input_type: 'text' | 'image';

  @ApiPropertyOptional({
    description: 'Nội dung đề bài dạng văn bản. Bắt buộc khi input_type = "text"',
    maxLength: 2000,
    example: 'Giải phương trình: 2x + 3 = 7',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  text?: string;

  @ApiPropertyOptional({
    description:
      'Ảnh đề bài dạng base64 (JPEG hoặc PNG, tối đa 2MB). Bắt buộc khi input_type = "image"',
  })
  @IsString()
  @IsOptional()
  image_base64?: string;

  @ApiProperty({
    enum: ['fast', 'accurate', 'explain_more'],
    description:
      'Chế độ giải bài: fast (nhanh), accurate (chính xác cao), explain_more (giải thích chi tiết hơn)',
    example: 'fast',
  })
  @IsIn(['fast', 'accurate', 'explain_more'])
  mode: 'fast' | 'accurate' | 'explain_more';
}

export class SolveFeedbackDto {
  @ApiProperty({
    enum: [
      'wrong_answer',
      'bad_explanation',
      'bad_ocr',
      'offensive_content',
      'privacy_issue',
      'other',
    ],
    description: 'Loại phản hồi/báo lỗi về kết quả giải bài',
    example: 'wrong_answer',
  })
  @IsIn([
    'wrong_answer',
    'bad_explanation',
    'bad_ocr',
    'offensive_content',
    'privacy_issue',
    'other',
  ])
  type: string;

  @ApiPropertyOptional({
    description: 'Ghi chú chi tiết thêm về phản hồi',
    maxLength: 500,
    example: 'Bước 2 tính sai dấu',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

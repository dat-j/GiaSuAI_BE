import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SolveRequestDto {
  @IsIn(['text', 'image'])
  input_type: 'text' | 'image';

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  text?: string;

  @IsString()
  @IsOptional()
  image_base64?: string;

  @IsIn(['fast', 'accurate', 'explain_more'])
  mode: 'fast' | 'accurate' | 'explain_more';
}

export class SolveFeedbackDto {
  @IsIn(['wrong_answer', 'bad_explanation', 'bad_ocr', 'offensive_content', 'privacy_issue', 'other'])
  type: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

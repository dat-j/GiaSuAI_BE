import { ApiProperty } from '@nestjs/swagger';

export class AuthTokenResponseDto {
  @ApiProperty({
    description:
      'Firebase ID token, dùng cho header Authorization: Bearer <idToken>',
  })
  idToken: string;

  @ApiProperty({ description: 'Firebase refresh token' })
  refreshToken: string;

  @ApiProperty({
    description: 'Thời gian hết hạn của idToken (giây)',
    example: '3600',
  })
  expiresIn: string;

  @ApiProperty()
  localId: string;
}

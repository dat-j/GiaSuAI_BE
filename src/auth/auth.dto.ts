import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'yourpassword', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'yourpassword' })
  @IsString()
  @MinLength(6)
  password: string;
}

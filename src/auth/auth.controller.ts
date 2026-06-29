import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequestDto, RegisterRequestDto } from './auth.dto';
import { AuthTokenResponseDto } from './auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Đăng ký tài khoản bằng email và mật khẩu',
    description:
      'Tạo tài khoản mới qua Firebase và trả về idToken. ' +
      'Dùng idToken này cho header Authorization: Bearer <idToken> hoặc nút Authorize trên Swagger.',
  })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  @ApiBadRequestResponse({
    description: 'Email đã được sử dụng hoặc mật khẩu quá yếu',
  })
  async register(@Body() dto: RegisterRequestDto) {
    return this.auth.registerWithEmailPassword(dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Đăng nhập bằng email và mật khẩu',
    description:
      'Xác thực email/password qua Firebase và trả về idToken. ' +
      'Dùng idToken này cho header Authorization: Bearer <idToken> ở các endpoint khác hoặc nút Authorize trên Swagger.',
  })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'Email hoặc mật khẩu không đúng' })
  async login(@Body() dto: LoginRequestDto) {
    return this.auth.loginWithEmailPassword(dto.email, dto.password);
  }
}

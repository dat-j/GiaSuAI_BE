import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface IdentityToolkitResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  error?: { message: string };
}

@Injectable()
export class AuthService {
  constructor(private config: ConfigService) {}

  private async callIdentityToolkit(
    endpoint: 'signInWithPassword' | 'signUp',
    body: { email: string; password: string },
  ): Promise<{ ok: boolean; data: IdentityToolkitResponse }> {
    const apiKey = this.config.get<string>('FIREBASE_WEB_API_KEY');
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, returnSecureToken: true }),
      },
    );
    const data = (await res.json()) as IdentityToolkitResponse;
    return { ok: res.ok, data };
  }

  async loginWithEmailPassword(email: string, password: string) {
    const { ok, data } = await this.callIdentityToolkit('signInWithPassword', {
      email,
      password,
    });
    if (!ok) {
      throw new UnauthorizedException(
        data.error?.message ?? 'Email hoặc mật khẩu không đúng',
      );
    }

    return {
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      localId: data.localId,
    };
  }

  async registerWithEmailPassword(email: string, password: string) {
    const { ok, data } = await this.callIdentityToolkit('signUp', {
      email,
      password,
    });
    if (!ok) {
      throw new BadRequestException(
        data.error?.message ?? 'Không thể tạo tài khoản',
      );
    }

    return {
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      localId: data.localId,
    };
  }
}

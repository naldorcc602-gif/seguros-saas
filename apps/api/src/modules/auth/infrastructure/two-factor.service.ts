import { Injectable } from '@nestjs/common';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class TwoFactorService {
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  async generateQrCodeDataUrl(email: string, secret: string): Promise<string> {
    const issuer = 'Regulação de Sinistros';
    const otpauthUrl = authenticator.keyuri(email, issuer, secret);
    return qrcode.toDataURL(otpauthUrl);
  }

  verifyCode(code: string, secret: string): boolean {
    return authenticator.verify({ token: code, secret });
  }
}

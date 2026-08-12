// @ts-nocheck
import { IsString, Length } from 'class-validator';

export class VerifyTwoFactorLoginDto {
  @IsString()
  tempToken!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}


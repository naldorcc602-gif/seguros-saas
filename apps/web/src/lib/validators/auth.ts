import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe sua senha.'),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const twoFactorFormSchema = z.object({
  code: z.string().length(6, 'O código tem 6 dígitos.'),
});
export type TwoFactorFormValues = z.infer<typeof twoFactorFormSchema>;

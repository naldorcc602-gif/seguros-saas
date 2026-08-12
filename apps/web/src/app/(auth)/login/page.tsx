'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { ApiError } from '@/lib/api-client';
import { authApi } from '@/lib/auth-api';
import { LoginFormValues, loginFormSchema, TwoFactorFormValues, twoFactorFormSchema } from '@/lib/validators/auth';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [step, setStep] = useState<'credentials' | 'two-factor'>('credentials');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const credentialsForm = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });
  const twoFactorForm = useForm<TwoFactorFormValues>({ resolver: zodResolver(twoFactorFormSchema) });

  const onSubmitCredentials = async (values: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const result = await authApi.login(values.email, values.password);
      if (result.requiresTwoFactor && result.tempToken) {
        setTempToken(result.tempToken);
        setStep('two-factor');
        return;
      }
      if (result.accessToken && result.refreshToken) {
        setTokens(result.accessToken, result.refreshToken);
        router.push('/dashboard');
      }
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.');
    }
  };

  const onSubmitTwoFactor = async (values: TwoFactorFormValues) => {
    if (!tempToken) return;
    setErrorMessage(null);
    try {
      const result = await authApi.verifyTwoFactorLogin(tempToken, values.code);
      if (result.accessToken && result.refreshToken) {
        setTokens(result.accessToken, result.refreshToken);
        router.push('/dashboard');
      }
    } catch (err) {
      setErrorMessage(err instanceof ApiError ? err.message : 'Código inválido. Tente novamente.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-ink">Regulação de Sinistros</h1>
        <p className="mt-1 text-sm text-muted">
          {step === 'credentials' ? 'Entre com sua conta.' : 'Digite o código do seu aplicativo autenticador.'}
        </p>

        {errorMessage && (
          <p className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{errorMessage}</p>
        )}

        {step === 'credentials' ? (
          <form className="mt-6 space-y-4" onSubmit={credentialsForm.handleSubmit(onSubmitCredentials)}>
            <div>
              <label className="text-sm font-medium text-ink" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                {...credentialsForm.register('email')}
              />
              {credentialsForm.formState.errors.email && (
                <p className="mt-1 text-xs text-danger">{credentialsForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-ink" htmlFor="password">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                {...credentialsForm.register('password')}
              />
              {credentialsForm.formState.errors.password && (
                <p className="mt-1 text-xs text-danger">{credentialsForm.formState.errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={credentialsForm.formState.isSubmitting}
              className="w-full rounded-md bg-primary py-2 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {credentialsForm.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={twoFactorForm.handleSubmit(onSubmitTwoFactor)}>
            <div>
              <label className="text-sm font-medium text-ink" htmlFor="code">
                Código de verificação
              </label>
              <input
                id="code"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-center font-mono text-lg tracking-[0.5em] text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                {...twoFactorForm.register('code')}
              />
              {twoFactorForm.formState.errors.code && (
                <p className="mt-1 text-xs text-danger">{twoFactorForm.formState.errors.code.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={twoFactorForm.formState.isSubmitting}
              className="w-full rounded-md bg-primary py-2 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
              {twoFactorForm.formState.isSubmitting ? 'Verificando…' : 'Verificar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp, resendSignUpCode, signOut } from 'aws-amplify/auth';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AuthMode = 'SIGN_IN' | 'SIGN_UP' | 'CONFIRM_SIGN_UP';

export default function LoginPage() {
  const { refreshAuth } = useAuth();

  const [mode, setMode] = useState<AuthMode>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      localStorage.setItem('mock_logged_in', 'true');
      localStorage.setItem('auth_token', 'demo_token');
      await refreshAuth();
    } catch (err: any) {
      setError('Failed to launch guest mode');
    } finally {
      setLoading(false);
    }
  };

  const translateError = (err: any, fallback: string) => {
    const errorCode = err?.name || err?.code;
    const msg = err?.message || '';

    switch (errorCode) {
      case 'NotAuthorizedException':
        return 'Incorrect email or password. Please try again.';
      case 'UserNotFoundException':
        return 'Account not found. Please check your email.';
      case 'UsernameExistsException':
        return 'An account with this email already exists. Please sign in.';
      case 'InvalidParameterException':
      case 'InvalidPasswordException':
        return 'Invalid password format (requires at least 8 characters, numbers, and symbols).';
      case 'CodeMismatchException':
        return 'Invalid verification code. Please check your email.';
      case 'ExpiredCodeException':
        return 'Verification code expired. Please request a new one.';
      case 'LimitExceededException':
      case 'TooManyRequestsException':
        return 'Too many attempts. Please try again later.';
      default:
        return msg || fallback;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      // Clear any stale tokens from previous sessions (e.g. if the user was deleted in AWS Console)
      await signOut().catch(() => {});

      await signIn({ username: email, password });

      // 觸發全局狀態更新，AuthProvider 的路由保護會自動將我們導向首頁
      await refreshAuth();
    } catch (err: any) {
      setError(translateError(err, 'Sign in failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      // Clear any stale tokens before signing up
      await signOut().catch(() => {});

      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
      setMode('CONFIRM_SIGN_UP');
    } catch (err: any) {
      setError(translateError(err, 'Sign up failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      setMode('SIGN_IN');
      setSuccessMsg('Verification successful! Please sign in.');
    } catch (err: any) {
      setError(translateError(err, 'Invalid or expired verification code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await resendSignUpCode({ username: email });
      setSuccessMsg('Verification code resent! Please check your email.');
    } catch (err: any) {
      setError(translateError(err, 'Failed to resend code. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="z-10 w-full max-w-md">
        <Card className="shadow-2xl border-stone-200 bg-white rounded-2xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="flex justify-center mb-2">
              <Image
                src="/logo.svg"
                width={56}
                height={56}
                alt="Pantry AI Logo"
                className="drop-shadow-md"
              />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-stone-800">
              {mode === 'SIGN_IN'
                ? 'Pantry AI'
                : mode === 'SIGN_UP'
                  ? 'Create Account'
                  : 'Verify Email'}
            </CardTitle>
            <CardDescription className="text-stone-500 font-medium">
              {mode === 'SIGN_IN'
                ? 'Sign in to access your smart pantry'
                : mode === 'SIGN_UP'
                  ? 'Join us and start tracking your food'
                  : 'Enter the code sent to your email'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold text-center">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-semibold text-center">
                {successMsg}
              </div>
            )}

            {mode === 'SIGN_IN' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-stone-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-white border-stone-200 focus-visible:ring-amber-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-stone-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-white border-stone-200 focus-visible:ring-amber-600"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg shadow-sm"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                <div className="pt-2 border-t border-stone-100 mt-4 text-center">
                  <p className="text-sm text-stone-500 mb-3">Or just looking around?</p>
                  <Button
                    type="button"
                    onClick={handleDemoLogin}
                    className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-md"
                    disabled={loading}
                  >
                    Try Demo
                  </Button>
                </div>
              </form>
            )}

            {mode === 'SIGN_UP' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-stone-700">
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-white border-stone-200 focus-visible:ring-amber-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-stone-700">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-white border-stone-200 focus-visible:ring-amber-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-stone-700">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 bg-white border-stone-200 focus-visible:ring-amber-600"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg shadow-sm"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            )}

            {mode === 'CONFIRM_SIGN_UP' && (
              <form onSubmit={handleConfirmSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-stone-700">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="h-11 bg-white border-stone-200 text-center tracking-widest text-lg font-bold focus-visible:ring-amber-600"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg shadow-sm"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-sm font-semibold text-stone-500 hover:text-amber-700 underline underline-offset-4 disabled:opacity-50"
                  >
                    Didn&apos;t receive the code? Resend
                  </button>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col border-t border-stone-100 p-6 mt-2 bg-stone-50 rounded-b-2xl">
            {mode === 'SIGN_IN' ? (
              <p className="text-sm text-stone-500 font-medium">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('SIGN_UP');
                    setError('');
                  }}
                  className="text-amber-700 hover:text-amber-800 hover:underline font-bold transition-colors"
                >
                  Sign up
                </button>
              </p>
            ) : mode === 'SIGN_UP' ? (
              <p className="text-sm text-stone-500 font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('SIGN_IN');
                    setError('');
                  }}
                  className="text-amber-700 hover:text-amber-800 hover:underline font-bold transition-colors"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-sm text-stone-500 font-medium text-center">
                Check your email inbox for the verification code.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

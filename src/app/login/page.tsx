"use client";

import React, { useState } from 'react';
import { signIn, signUp, confirmSignUp } from 'aws-amplify/auth';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = 'SIGN_IN' | 'SIGN_UP' | 'CONFIRM_SIGN_UP';

export default function LoginPage() {
  const { refreshAuth } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
        // 模擬登入成功
        localStorage.setItem('mock_logged_in', 'true');
      } else {
        await signIn({ username: email, password });
      }
      
      // 觸發全局狀態更新，AuthProvider 的路由保護會自動將我們導向首頁
      await refreshAuth();
    } catch (err: any) {
      setError(err.message || '登入失敗，請確認帳號密碼。');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
        // 模擬註冊成功
        setMode('CONFIRM_SIGN_UP');
      } else {
        await signUp({
          username: email,
          password,
          options: { userAttributes: { email } }
        });
        setMode('CONFIRM_SIGN_UP');
      }
    } catch (err: any) {
      setError(err.message || '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (process.env.NEXT_PUBLIC_MOCK_AUTH !== 'true') {
        await confirmSignUp({ username: email, confirmationCode: code });
      }
      setMode('SIGN_IN');
      setError('驗證成功！請登入你的帳號。'); 
    } catch (err: any) {
      setError(err.message || '驗證碼錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      <div className="z-10 w-full max-w-md">
        <Card className="shadow-2xl shadow-sky-500/10 border-border/50 bg-white/90 backdrop-blur-sm rounded-2xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="flex justify-center mb-2">
              <Image src="/logo.svg" width={56} height={56} alt="Pantry AI Logo" className="drop-shadow-md" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-sky-600">
              {mode === 'SIGN_IN' ? 'Welcome Back' : mode === 'SIGN_UP' ? 'Create Account' : 'Verify Email'}
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              {mode === 'SIGN_IN' ? 'Sign in to access your smart pantry' : mode === 'SIGN_UP' ? 'Join us and start tracking your food' : 'Enter the code sent to your email'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold text-center">
                {error}
              </div>
            )}

            {mode === 'SIGN_IN' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 bg-slate-50/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">Password</Label>
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 bg-slate-50/50" />
                </div>
                <Button type="submit" className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg shadow-md" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            )}

            {mode === 'SIGN_UP' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-700">Email Address</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 bg-slate-50/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-700">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 bg-slate-50/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-700">Confirm Password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-11 bg-slate-50/50" />
                </div>
                <Button type="submit" className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-md" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            )}

            {mode === 'CONFIRM_SIGN_UP' && (
              <form onSubmit={handleConfirmSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-slate-700">Verification Code</Label>
                  <Input id="code" type="text" placeholder="123456" value={code} onChange={e => setCode(e.target.value)} required className="h-11 bg-slate-50/50 text-center tracking-widest text-lg font-bold" />
                </div>
                <Button type="submit" className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg shadow-md" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col border-t border-slate-100 p-6 mt-2 bg-slate-50/80 rounded-b-2xl">
            {mode === 'SIGN_IN' ? (
              <p className="text-sm text-slate-500 font-medium">
                Don't have an account?{' '}
                <button type="button" onClick={() => { setMode('SIGN_UP'); setError(''); }} className="text-sky-600 hover:text-sky-700 hover:underline font-bold transition-colors">
                  Sign up
                </button>
              </p>
            ) : mode === 'SIGN_UP' ? (
              <p className="text-sm text-slate-500 font-medium">
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('SIGN_IN'); setError(''); }} className="text-sky-600 hover:text-sky-700 hover:underline font-bold transition-colors">
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-500 font-medium text-center">
                Check your email inbox for the verification code.
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
    </div>
  );
}

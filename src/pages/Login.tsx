import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { signInWithEmailAndPassword, signInWithPopup, getMultiFactorResolver, TotpMultiFactorGenerator, MultiFactorResolver } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, githubProvider, facebookProvider } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

import { Search, LogIn, Mail, Lock, Github, Facebook, Key } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [isMfaVerifying, setIsMfaVerifying] = useState(false);
  const navigate = useNavigate();

  const handleAuthError = (error: any) => {
    if (error.code === 'auth/multi-factor-auth-required') {
      const resolver = getMultiFactorResolver(auth, error);
      setMfaResolver(resolver);
      toast.info('Two-factor authentication required');
    } else {
      toast.error(error.message || 'Login failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check role
      const docRef = doc(db, 'users', userCredential.user.uid);
      const docSnap = await getDoc(docRef);
      
      toast.success('Logged in successfully');
      
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver) return;
    setIsMfaVerifying(true);
    try {
      const hint = mfaResolver.hints[0];
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, totpCode);
      await mfaResolver.resolveSignIn(assertion);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsMfaVerifying(false);
    }
  };

  const handleProviderLogin = async (provider: any, providerName: string) => {
    try {
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check role
      const docRef = doc(db, 'users', userCredential.user.uid);
      const docSnap = await getDoc(docRef);
      
      toast.success('Logged in successfully');
      
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-orange rounded-xl flex items-center justify-center shadow-lg shadow-brand-orange/20">
              <Search className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Khoj<span className="text-brand-orange">Talas</span>
            </span>
          </Link>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-slate-500">Log in to manage your reports and matches.</p>
          </div>
        </div>

        <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
          {mfaResolver ? (
            <form onSubmit={handleMfaSubmit} className="space-y-6">
              <div className="text-center space-y-2 mb-6">
                <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-6 h-6 text-brand-orange" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h3>
                <p className="text-slate-500 text-sm">Enter the 6-digit code from your authenticator app.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50 font-mono text-center text-2xl tracking-widest"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={isMfaVerifying || totpCode.length !== 6}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isMfaVerifying ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => setMfaResolver(null)}
                className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-400" /> Password
                    </label>
                    <a href="#" className="text-xs font-bold text-brand-orange hover:underline">Forgot?</a>
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none transition-all bg-slate-50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing In...' : (
                    <>
                      <LogIn className="w-5 h-5" /> Sign In
                    </>
                  )}
                </button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                  <span className="px-4 bg-white text-slate-400">Or continue with</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleProviderLogin(googleProvider, 'Google')}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  onClick={() => handleProviderLogin(githubProvider, 'GitHub')}
                  className="w-full flex items-center justify-center gap-3 bg-slate-900 border border-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-sm"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </button>
                <button
                  onClick={() => handleProviderLogin(facebookProvider, 'Facebook')}
                  className="w-full flex items-center justify-center gap-3 bg-[#1877F2] border border-[#1877F2] text-white py-3 rounded-xl font-bold hover:bg-[#1877F2]/90 transition-all shadow-sm"
                >
                  <Facebook className="w-5 h-5" />
                  Facebook
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-orange hover:underline font-bold">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}

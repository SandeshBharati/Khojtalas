import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { signInWithEmailAndPassword, getMultiFactorResolver, TotpMultiFactorGenerator, MultiFactorResolver } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../firebase';
import { Shield, LogIn, Mail, Lock, Key, AlertTriangle, KeyRound } from 'lucide-react';

/**
 * Admin credentials are loaded from the ADMIN_CREDENTIALS env var.
 * Format: "email1:key1,email2:key2"
 */
function loadAdminCredentials(): Record<string, string> {
  const raw = process.env.ADMIN_CREDENTIALS ?? '';
  const creds: Record<string, string> = {};
  if (!raw) return creds;
  for (const pair of raw.split(',')) {
    const [email, key] = pair.split(':');
    if (email && key) creds[email.trim().toLowerCase()] = key.trim().toLowerCase();
  }
  return creds;
}
const ADMIN_CREDENTIALS = loadAdminCredentials();

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [isMfaVerifying, setIsMfaVerifying] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateAdminAccess = (userEmail: string, key: string): boolean => {
    const normalizedKey = key.replace(/\s/g, '').toLowerCase();
    const expectedKey = ADMIN_CREDENTIALS[userEmail.toLowerCase()];
    return !!expectedKey && normalizedKey === expectedKey;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (!validateAdminAccess(email, adminKey)) {
      setError('Invalid admin credentials. Access denied.');
      setIsSubmitting(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userRef = ref(db, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists() || snapshot.val().role !== 'admin') {
        await auth.signOut();
        setError('Access denied. This account is not an admin.');
        return;
      }

      toast.success('Welcome back, Admin');
      navigate('/admin');
    } catch (err: any) {
      if (err.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, err);
        setMfaResolver(resolver);
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaResolver) return;
    setIsMfaVerifying(true);
    setError('');
    try {
      const hint = mfaResolver.hints[0];
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, totpCode);
      const userCredential = await mfaResolver.resolveSignIn(assertion);

      const userRef = ref(db, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists() || snapshot.val().role !== 'admin') {
        await auth.signOut();
        setError('Access denied. This account is not an admin.');
        return;
      }

      toast.success('Welcome back, Admin');
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsMfaVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-brand-orange/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Khoj<span className="text-brand-orange">Talas</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>

        <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {mfaResolver ? (
            <form onSubmit={handleMfaSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6 text-brand-orange" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Two-Factor Authentication</h3>
                <p className="text-slate-500 text-sm">Enter the 6-digit code from your authenticator app.</p>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none bg-slate-50 font-mono text-center text-2xl tracking-widest"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
              <button
                type="submit"
                disabled={isMfaVerifying || totpCode.length !== 6}
                className="w-full bg-brand-orange text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-orange/90 transition-all shadow-xl shadow-brand-orange/20 disabled:opacity-50"
              >
                {isMfaVerifying ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => { setMfaResolver(null); setTotpCode(''); setError(''); }}
                className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all"
              >
                Back
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Email
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none bg-slate-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" /> Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none bg-slate-50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-400" /> Admin Key
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange outline-none bg-slate-50 font-mono tracking-wider"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                />
                <p className="text-xs text-slate-400">16-character key assigned to your admin account</p>
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
          )}
        </div>
      </div>
    </div>
  );
}

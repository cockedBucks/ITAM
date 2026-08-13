'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Monitor, Loader2, Shield } from 'lucide-react';

// Particle component for background animation
function Particles() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-0"
          style={{
            width: Math.random() * 4 + 1 + 'px',
            height: Math.random() * 4 + 1 + 'px',
            background: i % 2 === 0 ? '#06B6D4' : '#14B8A6',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animation: `particle-float ${8 + Math.random() * 12}s linear infinite`,
            animationDelay: `${Math.random() * 8}s`,
            ['--tx' as string]: `${(Math.random() - 0.5) * 300}px`,
            ['--ty' as string]: `${-200 - Math.random() * 400}px`,
          }}
        />
      ))}
    </div>
  );
}

// Animated grid background
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow spots */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-glow/5 rounded-full blur-[120px] animate-float" />
      <div
        className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-teal-glow/5 rounded-full blur-[100px] animate-float"
        style={{ animationDelay: '3s' }}
      />
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('لم يتم تأكيد البريد الإلكتروني بعد.');
        } else {
          setError('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
        }
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('حدث خطأ غير متوقع. حاول مرة أخرى.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-oasis-950 overflow-hidden">
      {/* Animated Backgrounds */}
      <GridBackground />
      <Particles />

      {/* Login Card */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        {/* Glow behind card */}
        <div className="absolute -inset-1 bg-gradient-to-bl from-cyan-glow/20 via-transparent to-teal-glow/20 rounded-3xl blur-xl opacity-60" />

        <div className="relative rounded-2xl bg-oasis-900/80 backdrop-blur-2xl border border-oasis-700/50 shadow-2xl overflow-hidden">
          {/* Top gradient line */}
          <div className="h-1 bg-gradient-to-l from-cyan-glow via-teal-glow to-cyan-glow" 
               style={{ backgroundSize: '200% 100%', animation: 'gradient-shift 3s linear infinite' }} />

          <div className="p-8 sm:p-10">
            {/* Logo Section */}
            <div className="text-center mb-8">
              <div
                className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-bl from-cyan-glow to-teal-glow shadow-lg shadow-cyan-glow/25 mb-5 transition-all duration-1000 delay-300 ${
                  mounted ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-12'
                }`}
              >
                <Monitor size={30} className="text-white" />
              </div>
              <h1
                className={`text-2xl font-bold text-white mb-2 transition-all duration-700 delay-400 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                Smart Oasis IT Portal
              </h1>
              <p
                className={`text-sm text-oasis-400 transition-all duration-700 delay-500 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                نظام إدارة الأصول التقنية — واحة الذكاء
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-scale-in">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div
                className={`transition-all duration-700 delay-[600ms] ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <label htmlFor="email" className="block text-sm font-medium text-oasis-300 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smartoasis.sa"
                  className="input-field"
                  required
                  autoComplete="email"
                  dir="ltr"
                />
              </div>

              <div
                className={`transition-all duration-700 delay-[700ms] ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <label htmlFor="password" className="block text-sm font-medium text-oasis-300 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-11"
                    required
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-oasis-500 hover:text-oasis-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div
                className={`transition-all duration-700 delay-[800ms] ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>جارِ الدخول...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      <span>تسجيل الدخول</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div
              className={`mt-8 pt-6 border-t border-oasis-800 transition-all duration-700 delay-[900ms] ${
                mounted ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-xs text-oasis-500">
                <Shield size={14} className="text-cyan-glow/50" />
                <span>نظام محمي — الدخول للمخولين فقط</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

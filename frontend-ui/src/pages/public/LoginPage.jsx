// frontend-ui/src/pages/public/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

import { useAuthStore } from '../../stores/useAuthStore';
import ParticleText from '../../components/ui/ParticleText';
import DotGrid from '../../components/ui/DotGrid';

export default function LoginPage() {
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginAction(email, password);
      const userRole = response?.user?.role || useAuthStore.getState().user?.role;

      // Navigate based on assigned system role
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'technician') {
        navigate('/tech/tasks');
      } else if (userRole === 'resident') {
        navigate('/resident/water');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Unable to connect to security gateway. Verify backend API is online.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f4f7fb] selection:bg-[#bae6fd] selection:text-[#0369a1]">
      
      {/* =======================================================================
          LEFT HALF (50%): AQUILA VISUAL IDENTITY & PARTICLES
          ======================================================================= */}
      <div className="relative w-full lg:w-1/2 bg-[#ebf2fa] flex items-center justify-center min-h-[440px] lg:min-h-screen overflow-hidden select-none p-8 sm:p-12 lg:p-16">
        
        {/* Interactive DotGrid Matrix Backdrop */}
        <div className="absolute inset-0 opacity-80 pointer-events-none">
          <DotGrid
            dotSize={2.5}
            gap={30}
            baseColor="#6093d1"
            activeColor="#1d4ed8"
            proximity={130}
            shockRadius={0}
            resistance={150}
          />
        </div>

        {/* Stacked Particle Typography */}
        <div className="relative z-10 w-full h-full min-h-[400px] lg:min-h-[82vh] flex items-center justify-center">
          <ParticleText
            text={"A Q\nU I\nL A"}
            color="#0c1b2f"
            highlightColor="#0284c7"
            trigger="none"
            fitContainer={true}
            fontWeight={1000}
            fontFamily='"Plus Jakarta Sans", -apple-system, sans-serif'
            particleSize={5}
            density={6.5}
            glow={false}
            pointerRepel={55}
            repelRadius={105}
            className="w-full h-full"
          />
        </div>

      </div>

      {/* =======================================================================
          RIGHT HALF: CLEAN SAAS SIGN IN
          ======================================================================= */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center px-8 sm:px-14 lg:px-20 xl:px-28 py-16 lg:py-0 min-h-screen border-t lg:border-t-0 lg:border-l border-[#e2eaf4]">
        <div className="w-full max-w-[380px] space-y-6">
          
          {/* Header */}
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold text-[#0c1b2f] tracking-tight">
              Sign in
            </h1>
            <p className="text-sm text-slate-500">
              Welcome back! Enter your details below.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full bg-white border border-slate-300 focus:border-[#0c1b2f] text-slate-900 px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white border border-slate-300 focus:border-[#0c1b2f] text-slate-900 px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Keep me logged in */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-slate-300 text-[#0c1b2f] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer select-none">
                Keep me logged in
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#0c1b2f] hover:bg-slate-800 text-white text-sm font-semibold py-3 px-5 rounded-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>

          </form>

          {/* Quick Demo Autofill (Replaces OAuth buttons) */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>Demo:</span>
            <button
              type="button"
              onClick={() => handleAutofill('admin@bawasa.gov.ph')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('technician@bawasa.gov.ph')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
            >
              Tech
            </button>
            <button
              type="button"
              onClick={() => handleAutofill('resident1@gmail.com')}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
            >
              Resident
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
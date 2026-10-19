import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const user = await login(email, password);

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Role-based destination redirection
      switch (user.role) {
        case 'FARMER':
          navigate('/farmer/dashboard');
          break;
        case 'BUSINESS':
          navigate('/business/dashboard');
          break;
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'CONSUMER':
        default:
          navigate('/consumer/dashboard');
          break;
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'Unable to sign in. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-background">
      <Card className="w-full max-w-md p-8 sm:p-10 border border-surface-variant bg-surface soil-shadow">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[32px]">
              psychiatry
            </span>
            <span className="font-display font-bold text-2xl uppercase tracking-tighter text-primary">
              KHETISETU
            </span>
          </Link>
          <h2 className="font-display font-semibold text-xl text-primary">
            Sign In to Ecosystem
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            "Khet Se Bazaar Tak, Ek Hi Setu."
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-[12px] bg-error-container/40 border border-error/30 text-error flex items-start gap-3 text-xs leading-relaxed">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Email Address"
            type="email"
            required
            icon="mail"
            placeholder="farmer@khetisetu.demo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-label-md">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-secondary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              required
              icon="lock"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
            Sign In
          </Button>
        </form>

        {/* Demo Credentials Quick-Fill helper for convenience */}
        <div className="mt-8 pt-6 border-t border-surface-variant/70">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider text-center mb-3">
            One-Click Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('farmer@khetisetu.demo');
                setPassword('KhetiSetu@2026!');
              }}
              className="p-2 rounded-[8px] bg-surface-container text-primary hover:bg-surface-variant text-left font-medium border border-surface-variant"
            >
              🌱 Demo Farmer
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('consumer@khetisetu.demo');
                setPassword('KhetiSetu@2026!');
              }}
              className="p-2 rounded-[8px] bg-surface-container text-primary hover:bg-surface-variant text-left font-medium border border-surface-variant"
            >
              🛒 Demo Consumer
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('business@khetisetu.demo');
                setPassword('KhetiSetu@2026!');
              }}
              className="p-2 rounded-[8px] bg-surface-container text-primary hover:bg-surface-variant text-left font-medium border border-surface-variant"
            >
              🏢 Demo Business
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@khetisetu.demo');
                setPassword('KhetiSetu@2026!');
              }}
              className="p-2 rounded-[8px] bg-surface-container text-primary hover:bg-surface-variant text-left font-medium border border-surface-variant"
            >
              🛡️ Demo Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary underline">
            Register as Farmer / Buyer
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;

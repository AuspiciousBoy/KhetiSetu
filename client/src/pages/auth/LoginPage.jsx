import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { useTranslation } from '../../i18n/LanguageContext';

const LoginPage = () => {
  const { t } = useTranslation();
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
        t('auth.loginErrorDefault');
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
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="font-display font-bold text-2xl uppercase tracking-tighter text-primary">
              KHETISETU
            </span>
          </Link>
          <h2 className="font-display font-semibold text-xl text-primary">
            {t('auth.signInEcosystem')}
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            {t('common.tagline')}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-[12px] bg-error-container/40 border border-error/30 text-error flex items-start gap-3 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label={t('auth.emailAddress')}
            type="email"
            required
            icon={<Mail className="w-4 h-4" />}
            placeholder="farmer@khetisetu.demo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-label-md">
                {t('auth.password')}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-secondary hover:underline font-medium"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <Input
              type="password"
              required
              icon={<Lock className="w-4 h-4" />}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2 flex items-center justify-center gap-2">
            <span>{t('auth.signInBtn')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Demo Credentials Quick-Fill helper */}
        <div className="mt-8 pt-6 border-t border-surface-variant/70">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider text-center mb-3">
            {t('auth.demoRolesTitle')}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('farmer@khetisetu.demo');
              }}
              className="p-2 rounded-[8px] bg-surface-container text-primary hover:bg-surface-variant text-left font-medium border border-surface-variant"
            >
              {t('auth.demoFarmer')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('consumer@khetisetu.demo');
              }}
              className="p-2 rounded-[8px] bg-surface-container text-primary hover:bg-surface-variant text-left font-medium border border-surface-variant"
            >
              {t('auth.demoConsumer')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('business@khetisetu.demo');
              }}
              className="p-2 rounded-[8px] bg-surface-container text-primary hover:bg-surface-variant text-left font-medium border border-surface-variant"
            >
              {t('auth.demoBusiness')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@khetisetu.demo');
              }}
              className="p-2 rounded-[8px] bg-surface-container text-primary hover:bg-surface-variant text-left font-medium border border-surface-variant"
            >
              {t('auth.demoAdmin')}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          {t('auth.noAccountPrompt')}{' '}
          <Link to="/register" className="font-semibold text-primary underline">
            {t('auth.registerPrompt')}
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default LoginPage;

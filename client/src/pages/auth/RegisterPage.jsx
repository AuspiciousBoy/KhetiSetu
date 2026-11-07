import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Tractor,
  ShoppingBag,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('FARMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Role specific fields
  const [farmName, setFarmName] = useState('');
  const [district, setDistrict] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long with uppercase, lowercase, and numbers.');
      return;
    }

    setLoading(true);

    try {
      const profileData = {};
      if (role === 'FARMER') {
        profileData.farmName = farmName || `${fullName}'s Farm`;
        profileData.district = district;
        profileData.state = state;
      } else if (role === 'BUSINESS') {
        profileData.businessName = businessName || `${fullName} Agro Ventures`;
        profileData.gstNumber = gstNumber;
      }

      const user = await register({
        fullName,
        email,
        phone,
        password,
        role,
        profileData,
      });

      if (user.role === 'FARMER') {
        navigate('/farmer/dashboard');
      } else if (user.role === 'BUSINESS') {
        navigate('/business/dashboard');
      } else {
        navigate('/consumer/dashboard');
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        err.message ||
        'Registration failed. Please check your information.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 sm:p-6 bg-background">
      <Card className="w-full max-w-xl p-8 sm:p-10 border border-surface-variant bg-surface soil-shadow my-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="font-display font-bold text-2xl uppercase tracking-tighter text-primary">
              KHETISETU
            </span>
          </Link>
          <h2 className="font-display font-semibold text-xl text-primary">
            Join the KhetiSetu Network
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Select your role to access customized farm-to-market tools
          </p>
        </div>

        {/* Role Selector Card Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            type="button"
            onClick={() => setRole('FARMER')}
            className={`p-3.5 rounded-[16px] text-center border transition-all flex flex-col items-center justify-center ${
              role === 'FARMER'
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container border-surface-variant text-on-surface hover:bg-surface-variant'
            }`}
          >
            <Tractor className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold block">Farmer</span>
            <span className="text-[10px] opacity-80 block">Sell & Assess</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('CONSUMER')}
            className={`p-3.5 rounded-[16px] text-center border transition-all flex flex-col items-center justify-center ${
              role === 'CONSUMER'
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container border-surface-variant text-on-surface hover:bg-surface-variant'
            }`}
          >
            <ShoppingBag className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold block">Consumer</span>
            <span className="text-[10px] opacity-80 block">Fresh Harvest</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('BUSINESS')}
            className={`p-3.5 rounded-[16px] text-center border transition-all flex flex-col items-center justify-center ${
              role === 'BUSINESS'
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container border-surface-variant text-on-surface hover:bg-surface-variant'
            }`}
          >
            <Building2 className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold block">Business</span>
            <span className="text-[10px] opacity-80 block">Bulk Mandi</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-[12px] bg-error-container/40 border border-error/30 text-error flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            required
            icon={<User className="w-4 h-4" />}
            placeholder="e.g. Rameshwar Patil"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              required
              icon={<Mail className="w-4 h-4" />}
              placeholder="farmer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Phone Number"
              type="tel"
              required
              icon={<Phone className="w-4 h-4" />}
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Conditional Role-Specific Fields */}
          {role === 'FARMER' && (
            <div className="p-4 rounded-[16px] bg-surface-container border border-surface-variant flex flex-col gap-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Tractor className="w-3.5 h-3.5 text-secondary" />
                Farm Information
              </span>
              <Input
                label="Farm / Orchard Name"
                placeholder="e.g. Sahyadri Organic Farm"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="District"
                  placeholder="Pune"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>
          )}

          {role === 'BUSINESS' && (
            <div className="p-4 rounded-[16px] bg-surface-container border border-surface-variant flex flex-col gap-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Building2 className="w-3.5 h-3.5 text-secondary" />
                Enterprise Information
              </span>
              <Input
                label="Company / Firm Name"
                placeholder="e.g. FreshDirect Agro Enterprises"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <Input
                label="GSTIN (Optional)"
                placeholder="27AABCF1234F1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              required
              icon={<Lock className="w-4 h-4" />}
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirm Password"
              type="password"
              required
              icon={<Lock className="w-4 h-4" />}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-4 flex items-center justify-center gap-2">
            <span>Create {role.toLowerCase()} Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary underline">
            Sign In to your account
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;

import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Tractor,
  MapPin,
  QrCode,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Upload,
  Calendar,
  Phone,
  Mail,
  Home,
  Briefcase,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton, EmptyState } from '../../components/ui/Skeleton';
import LocationPicker from '../../components/location/LocationPicker';

const ProfileDashboardPage = () => {
  const { user: authUser, updateUser } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  // Status & Feedback
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms State
  const [personalForm, setPersonalForm] = useState({ fullName: '', phone: '' });
  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    contactPerson: '',
    businessType: 'WHOLESALER',
    gstNumber: '',
    billingInformation: {
      billingName: '',
      billingAddress: '',
      taxId: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
    },
  });
  const [farmForm, setFarmForm] = useState({
    farmName: '',
    landSizeAcres: 1,
    soilType: 'ALLUVIAL',
    cropsGrown: '',
    bio: '',
    location: {
      farmAddress: '',
      village: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      landmark: '',
      coordinates: { latitude: '', longitude: '' },
    },
  });
  const [upiForm, setUpiForm] = useState({ upiId: '', accountHolderName: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Address Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    contactNumber: '',
    companyName: '',
    contactPerson: '',
    houseNo: '',
    streetArea: '',
    line1: '',
    line2: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false,
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFullProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users/profile');
      const { user, profile } = res.data.data;
      setProfileData({ user, profile });

      // Init personal form
      setPersonalForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
      });

      // Role specific inits
      if (user.role === 'BUSINESS' && profile) {
        setBusinessForm({
          businessName: profile.businessName || '',
          contactPerson: profile.contactPerson || '',
          businessType: profile.businessType || 'WHOLESALER',
          gstNumber: profile.gstNumber || '',
          billingInformation: {
            billingName: profile.billingInformation?.billingName || '',
            billingAddress: profile.billingInformation?.billingAddress || '',
            taxId: profile.billingInformation?.taxId || '',
            bankName: profile.billingInformation?.bankName || '',
            accountNumber: profile.billingInformation?.accountNumber || '',
            ifscCode: profile.billingInformation?.ifscCode || '',
          },
        });
      }

      if (user.role === 'FARMER' && profile) {
        setFarmForm({
          farmName: profile.farmName || '',
          landSizeAcres: profile.landSizeAcres || 1,
          soilType: profile.soilType || 'ALLUVIAL',
          cropsGrown: Array.isArray(profile.cropsGrown) ? profile.cropsGrown.join(', ') : '',
          bio: profile.bio || '',
          location: {
            farmAddress: profile.location?.farmAddress || '',
            village: profile.location?.village || '',
            city: profile.location?.city || '',
            district: profile.location?.district || '',
            state: profile.location?.state || '',
            pincode: profile.location?.pincode || '',
            landmark: profile.location?.landmark || '',
            coordinates: {
              latitude: profile.location?.coordinates?.latitude || '',
              longitude: profile.location?.coordinates?.longitude || '',
            },
          },
        });

        // Farmer payment inits
        if (profile.paymentSettings) {
          setPaymentSettings(profile.paymentSettings);
          setUpiForm({
            upiId: profile.paymentSettings.upiId || '',
            accountHolderName: profile.paymentSettings.accountHolderName || '',
          });
        }
      }

      // Fetch addresses for Consumer & Business
      if (['CONSUMER', 'BUSINESS'].includes(user.role)) {
        const addrRes = await apiClient.get('/users/addresses');
        setAddresses(addrRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load profile', err);
      showToast(err.response?.data?.error?.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFullProfile();
  }, []);

  // Save Personal Info
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiClient.put('/users/profile', personalForm);
      if (updateUser) updateUser(res.data.data.user);
      showToast(t('profile.personalSuccessMsg'));
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Error updating profile', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Business Info
  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiClient.put('/users/profile', businessForm);
      showToast(t('profile.businessSuccessMsg'));
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Error updating business profile', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Farm & Location Info
  const handleSaveFarm = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...farmForm,
        cropsGrown: farmForm.cropsGrown
          ? farmForm.cropsGrown.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
      };
      await apiClient.put('/users/profile', payload);
      showToast(t('profile.farmSuccessMsg'));
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Error saving farm details', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Save Farmer UPI Payment Settings
  const handleSavePayment = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiClient.put('/farmer/payment', upiForm);
      setPaymentSettings(res.data.data);
      showToast(t('profile.paymentSuccessMsg'));
    } catch (err) {
      showToast(err.response?.data?.error?.message || t('profile.invalidUpiMsg'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Upload QR Code Image
  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('qrImage', file);

    setActionLoading(true);
    try {
      const res = await apiClient.post('/farmer/payment/qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPaymentSettings(res.data.data);
      showToast(t('profile.qrUploadSuccessMsg'));
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to upload QR code', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove QR Code
  const handleRemoveQr = async () => {
    if (!window.confirm('Are you sure you want to remove your UPI QR code?')) return;
    setActionLoading(true);
    try {
      const res = await apiClient.delete('/farmer/payment/qr');
      setPaymentSettings(res.data.data);
      showToast(t('profile.qrRemoveSuccessMsg'));
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to remove QR code', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(t('profile.passwordMismatch'), 'error');
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast(t('profile.passwordSuccessMsg'));
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Failed to change password', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Address Modal Helpers
  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: profileData?.user?.role === 'BUSINESS' ? 'Warehouse' : 'Home',
      fullName: profileData?.user?.fullName || '',
      contactNumber: profileData?.user?.phone || '',
      companyName: businessForm.businessName || '',
      contactPerson: businessForm.contactPerson || profileData?.user?.fullName || '',
      houseNo: '',
      streetArea: '',
      line1: '',
      line2: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: addresses.length === 0,
    });
    setAddressModalOpen(true);
  };

  const openEditAddressModal = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      label: addr.label || addr.title || 'Home',
      fullName: addr.fullName || '',
      contactNumber: addr.contactNumber || '',
      companyName: addr.companyName || '',
      contactPerson: addr.contactPerson || '',
      houseNo: addr.houseNo || '',
      streetArea: addr.streetArea || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      district: addr.district || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      landmark: addr.landmark || '',
      isDefault: Boolean(addr.isDefault),
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingAddressId) {
        const res = await apiClient.put(`/users/addresses/${editingAddressId}`, addressForm);
        setAddresses((prev) =>
          prev.map((a) => (a._id === editingAddressId ? res.data.data : a))
        );
      } else {
        const res = await apiClient.post('/users/addresses', addressForm);
        setAddresses((prev) => [...prev, res.data.data]);
      }
      setAddressModalOpen(false);
      showToast(t('profile.addressSuccessMsg'));
      // Refetch addresses to ensure correct default flag
      const freshRes = await apiClient.get('/users/addresses');
      setAddresses(freshRes.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Error saving address', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm(t('profile.confirmDeletePrompt'))) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/users/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      showToast(t('profile.addressDeleteMsg'));
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Error deleting address', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    setActionLoading(true);
    try {
      const res = await apiClient.patch(`/users/addresses/${id}/default`);
      setAddresses(res.data.data);
      showToast('Default address updated');
    } catch (err) {
      showToast(err.response?.data?.error?.message || 'Error updating default address', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-6 p-6">
        <Skeleton className="h-40 rounded-[20px]" />
        <Skeleton className="h-96 rounded-[20px]" />
      </div>
    );
  }

  const currentUser = profileData?.user || authUser;
  const isFarmer = currentUser?.role === 'FARMER';
  const isBusiness = currentUser?.role === 'BUSINESS';
  const isConsumer = currentUser?.role === 'CONSUMER';

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-[12px] shadow-xl flex items-center gap-3 animate-fade-in text-xs sm:text-sm font-medium border ${
            toast.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-800'
              : 'bg-[#08241a] text-emerald-300 border-emerald-500/40'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <Card className="p-6 sm:p-8 soil-shadow bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-display font-bold text-2xl sm:text-3xl shrink-0">
            {currentUser?.fullName ? currentUser.fullName[0].toUpperCase() : <User className="w-8 h-8" />}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-primary">
                {currentUser?.fullName}
              </h1>
              <Badge variant="warning">{currentUser?.role}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-secondary" />
                {currentUser?.email}
              </span>
              {currentUser?.phone && (
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-secondary" />
                  {currentUser?.phone}
                </span>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant/80 mt-1 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3 text-secondary" />
              {t('profile.memberSince', {
                date: new Date(currentUser?.createdAt || Date.now()).toLocaleDateString(),
              })}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchFullProfile}
          disabled={loading}
          className="flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('common.refresh')}</span>
        </Button>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-surface-variant overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'personal'
              ? 'bg-primary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t('profile.personalTab')}</span>
        </button>

        {isBusiness && (
          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'business'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('profile.businessTab')}</span>
          </button>
        )}

        {isFarmer && (
          <button
            onClick={() => setActiveTab('farm')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'farm'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            <Tractor className="w-4 h-4" />
            <span>{t('profile.farmTab')}</span>
          </button>
        )}

        {(isConsumer || isBusiness) && (
          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'addresses'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{t('profile.addressesTab')}</span>
          </button>
        )}

        {isFarmer && (
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'payment'
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{t('profile.paymentTab')}</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'security'
              ? 'bg-primary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('profile.securityTab')}</span>
        </button>
      </div>

      {/* TAB CONTENT 1: PERSONAL INFORMATION */}
      {activeTab === 'personal' && (
        <Card className="p-8 flex flex-col gap-6">
          <div>
            <h3 className="font-display font-semibold text-lg text-primary">
              {t('profile.personalTab')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Authoritative identification recorded across your KhetiSetu ecosystem operations
            </p>
          </div>

          <form onSubmit={handleSavePersonal} className="flex flex-col gap-5 max-w-xl">
            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.fullNameLabel')} *
              </label>
              <input
                type="text"
                required
                value={personalForm.fullName}
                onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.emailLabel')}
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container-high/60 border border-surface-variant text-on-surface-variant cursor-not-allowed font-mono"
              />
              <span className="text-[10px] text-on-surface-variant mt-1 block">
                Email address is anchored to your cryptographic authentication credential.
              </span>
            </div>

            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.phoneLabel')}
              </label>
              <input
                type="tel"
                value={personalForm.phone}
                onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.roleLabel')}
              </label>
              <div className="px-3.5 py-2 rounded-[10px] bg-surface-container-low border border-surface-variant text-xs font-semibold text-primary">
                {currentUser?.role}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" disabled={actionLoading}>
                {actionLoading ? t('common.processing') : t('profile.savePersonalBtn')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB CONTENT 2: B2B BUSINESS PROFILE */}
      {activeTab === 'business' && isBusiness && (
        <Card className="p-8 flex flex-col gap-6">
          <div>
            <h3 className="font-display font-semibold text-lg text-primary">
              {t('profile.businessTab')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Verified corporate entity details, compulsory GSTIN, and institutional procurement info
            </p>
          </div>

          <form onSubmit={handleSaveBusiness} className="flex flex-col gap-5 max-w-xl">
            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.businessNameLabel')} *
              </label>
              <input
                type="text"
                required
                value={businessForm.businessName}
                onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.contactPersonLabel')}
              </label>
              <input
                type="text"
                value={businessForm.contactPerson}
                onChange={(e) => setBusinessForm({ ...businessForm, contactPerson: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.businessTypeLabel')}
                </label>
                <select
                  value={businessForm.businessType}
                  onChange={(e) => setBusinessForm({ ...businessForm, businessType: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
                >
                  <option value="WHOLESALER">Wholesaler</option>
                  <option value="RETAILER">Retailer</option>
                  <option value="FOOD_PROCESSOR">Food Processor</option>
                  <option value="SUPERMARKET_CHAIN">Supermarket Chain</option>
                  <option value="EXPORTER">Exporter</option>
                  <option value="RESTAURANT">Restaurant / Horeca</option>
                  <option value="INSTITUTION">Institution / Hospital / College</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.gstinLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={businessForm.gstNumber}
                  onChange={(e) => setBusinessForm({ ...businessForm, gstNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface font-mono font-bold focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Billing Information Section */}
            <div className="pt-4 border-t border-surface-variant/60 flex flex-col gap-4">
              <span className="text-xs uppercase font-bold text-secondary font-label-md">
                Registered Billing Details
              </span>

              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.billingAddressLabel')}
                </label>
                <textarea
                  rows={2}
                  value={businessForm.billingInformation.billingAddress}
                  onChange={(e) =>
                    setBusinessForm({
                      ...businessForm,
                      billingInformation: { ...businessForm.billingInformation, billingAddress: e.target.value },
                    })
                  }
                  placeholder="Official tax billing address"
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-xs text-primary block mb-1">
                    {t('profile.bankNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={businessForm.billingInformation.bankName}
                    onChange={(e) =>
                      setBusinessForm({
                        ...businessForm,
                        billingInformation: { ...businessForm.billingInformation, bankName: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-primary block mb-1">
                    {t('profile.accountNumberLabel')}
                  </label>
                  <input
                    type="text"
                    value={businessForm.billingInformation.accountNumber}
                    onChange={(e) =>
                      setBusinessForm({
                        ...businessForm,
                        billingInformation: { ...businessForm.billingInformation, accountNumber: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-[8px] bg-surface-container border border-surface-variant text-on-surface font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-primary block mb-1">
                    {t('profile.ifscCodeLabel')}
                  </label>
                  <input
                    type="text"
                    value={businessForm.billingInformation.ifscCode}
                    onChange={(e) =>
                      setBusinessForm({
                        ...businessForm,
                        billingInformation: { ...businessForm.billingInformation, ifscCode: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-[8px] bg-surface-container border border-surface-variant text-on-surface font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" disabled={actionLoading}>
                {actionLoading ? t('common.processing') : t('profile.saveBusinessBtn')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB CONTENT 3: FARMER FARM & LOCATION */}
      {activeTab === 'farm' && isFarmer && (
        <Card className="p-8 flex flex-col gap-6">
          <div>
            <h3 className="font-display font-semibold text-lg text-primary">
              {t('profile.farmTab')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Geographic coordinates and farm parcel specifics used for logistics dispatch and mandi matching
            </p>
          </div>

          <form onSubmit={handleSaveFarm} className="flex flex-col gap-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.farmNameLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={farmForm.farmName}
                  onChange={(e) => setFarmForm({ ...farmForm, farmName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.landSizeLabel')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={farmForm.landSizeAcres}
                  onChange={(e) => setFarmForm({ ...farmForm, landSizeAcres: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.soilTypeLabel')}
                </label>
                <select
                  value={farmForm.soilType}
                  onChange={(e) => setFarmForm({ ...farmForm, soilType: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
                >
                  <option value="ALLUVIAL">Alluvial (जलोढ़)</option>
                  <option value="BLACK_REGUR">Black Regur (काली मिट्टी)</option>
                  <option value="RED_YELLOW">Red & Yellow (लाल-पीली)</option>
                  <option value="LATERITE">Laterite (लैटेराइट)</option>
                  <option value="LOAMY">Loamy (दोमट)</option>
                  <option value="SANDY">Sandy (बलुई)</option>
                  <option value="CLAY">Clay (चिकनी)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.cropsGrownLabel')}
                </label>
                <input
                  type="text"
                  value={farmForm.cropsGrown}
                  onChange={(e) => setFarmForm({ ...farmForm, cropsGrown: e.target.value })}
                  placeholder="e.g. Tomato, Onion, Potato, Spinach"
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.bioLabel')}
              </label>
              <textarea
                rows={2}
                value={farmForm.bio}
                onChange={(e) => setFarmForm({ ...farmForm, bio: e.target.value })}
                placeholder="Brief summary of organic or natural practices followed..."
                className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Farm Location Details */}
            <div className="pt-4 border-t border-surface-variant/60 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-secondary font-label-md">
                  Farm Gate Geographic Location
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Detect GPS or Search on Interactive Map
                </span>
              </div>

              <LocationPicker
                initialLocation={{
                  line1: farmForm.location.farmAddress,
                  city: farmForm.location.city || farmForm.location.district,
                  district: farmForm.location.district,
                  state: farmForm.location.state,
                  pincode: farmForm.location.pincode,
                  latitude: Number(farmForm.location.coordinates?.latitude) || 18.5204,
                  longitude: Number(farmForm.location.coordinates?.longitude) || 73.8567,
                }}
                showFullForm={false}
                onLocationSelect={(loc) => {
                  setFarmForm((prev) => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      farmAddress: loc.address || prev.location.farmAddress,
                      district: loc.district || prev.location.district,
                      state: loc.state || prev.location.state,
                      pincode: loc.pincode || prev.location.pincode,
                      coordinates: {
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                      },
                    },
                  }));
                }}
              />

              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.farmAddressLabel')}
                </label>
                <input
                  type="text"
                  value={farmForm.location.farmAddress}
                  onChange={(e) =>
                    setFarmForm({
                      ...farmForm,
                      location: { ...farmForm.location, farmAddress: e.target.value },
                    })
                  }
                  placeholder="Gat No. / Survey No. / Road"
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-xs text-primary block mb-1">
                    {t('profile.villageLabel')}
                  </label>
                  <input
                    type="text"
                    value={farmForm.location.village}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        location: { ...farmForm.location, village: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-primary block mb-1">
                    {t('profile.districtLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmForm.location.district}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        location: { ...farmForm.location, district: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-primary block mb-1">
                    {t('profile.stateLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmForm.location.state}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        location: { ...farmForm.location, state: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-xs text-primary block mb-1">
                    {t('profile.pincodeLabel')}
                  </label>
                  <input
                    type="text"
                    value={farmForm.location.pincode}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        location: { ...farmForm.location, pincode: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-[8px] bg-surface-container border border-surface-variant text-on-surface font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-primary block mb-1">
                    {t('profile.latitudeLabel')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={farmForm.location.coordinates.latitude}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        location: {
                          ...farmForm.location,
                          coordinates: { ...farmForm.location.coordinates, latitude: e.target.value },
                        },
                      })
                    }
                    placeholder="18.35"
                    className="w-full px-3 py-1.5 text-xs rounded-[8px] bg-surface-container border border-surface-variant text-on-surface font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-primary block mb-1">
                    {t('profile.longitudeLabel')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={farmForm.location.coordinates.longitude}
                    onChange={(e) =>
                      setFarmForm({
                        ...farmForm,
                        location: {
                          ...farmForm.location,
                          coordinates: { ...farmForm.location.coordinates, longitude: e.target.value },
                        },
                      })
                    }
                    placeholder="73.85"
                    className="w-full px-3 py-1.5 text-xs rounded-[8px] bg-surface-container border border-surface-variant text-on-surface font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" disabled={actionLoading}>
                {actionLoading ? t('common.processing') : t('profile.saveFarmBtn')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB CONTENT 4: SAVED ADDRESSES (CONSUMER & BUSINESS) */}
      {activeTab === 'addresses' && (isConsumer || isBusiness) && (
        <Card className="p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-display font-semibold text-lg text-primary">
                {t('profile.addressesTitle')}
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t('profile.addressesSubtitle')}
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={openAddAddressModal}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('profile.addNewAddressBtn')}</span>
            </Button>
          </div>

          {addresses.length === 0 ? (
            <EmptyState
              icon={<MapPin className="w-8 h-8 text-secondary" />}
              title="No Saved Addresses"
              description={t('profile.noAddressesFound')}
              action={
                <Button variant="primary" size="md" onClick={openAddAddressModal}>
                  {t('profile.addNewAddressBtn')}
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => {
                const isDefault = Boolean(addr.isDefault);
                const labelText = addr.label || addr.warehouseName || addr.title || 'Address';

                return (
                  <div
                    key={addr._id}
                    className={`p-5 rounded-[16px] border flex flex-col justify-between gap-4 transition-all ${
                      isDefault
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'bg-surface-container-low border-surface-variant hover:border-outline-variant/60'
                    }`}
                  >
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary flex items-center gap-1.5 text-sm">
                            {labelText.toLowerCase().includes('home') ? (
                              <Home className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <Briefcase className="w-3.5 h-3.5 text-primary" />
                            )}
                            {labelText}
                          </span>
                          {isDefault && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-primary text-white font-bold">
                              {t('profile.defaultBadge')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditAddressModal(addr)}
                            className="p-1 text-on-surface-variant hover:text-primary transition-colors"
                            title={t('profile.editBtn')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="p-1 text-on-surface-variant hover:text-error transition-colors"
                            title={t('profile.deleteBtn')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-on-surface pt-1">
                        {(addr.fullName || addr.contactPerson || addr.companyName) && (
                          <p className="font-semibold text-primary">
                            {addr.companyName
                              ? `${addr.companyName} (${addr.contactPerson || addr.fullName})`
                              : addr.fullName}
                          </p>
                        )}
                        <p className="text-on-surface-variant mt-0.5">
                          {addr.houseNo ? `${addr.houseNo}, ` : ''}
                          {addr.streetArea ? `${addr.streetArea}, ` : ''}
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ''}
                        </p>
                        <p className="text-on-surface-variant">
                          {addr.city}, {addr.district ? `${addr.district}, ` : ''}
                          {addr.state} - <span className="font-mono font-semibold">{addr.pincode}</span>
                        </p>
                        {addr.landmark && (
                          <p className="text-[11px] text-on-surface-variant/80 italic mt-0.5">
                            📍 Landmark: {addr.landmark}
                          </p>
                        )}
                        {(addr.contactNumber || addr.phone) && (
                          <p className="text-[11px] text-on-surface-variant font-mono mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-secondary" />
                            {addr.contactNumber || addr.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isDefault && (
                      <div className="pt-2 border-t border-surface-variant/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefaultAddress(addr._id)}
                          className="text-xs text-secondary hover:text-primary"
                        >
                          {t('profile.setDefaultBtn')}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB CONTENT 5: FARMER UPI PAYMENT SETTINGS */}
      {activeTab === 'payment' && isFarmer && (
        <Card className="p-8 flex flex-col gap-6">
          <div>
            <h3 className="font-display font-semibold text-lg text-primary">
              {t('profile.paymentTitle')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {t('profile.paymentSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left: UPI VPA Form */}
            <form onSubmit={handleSavePayment} className="md:col-span-7 flex flex-col gap-5">
              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.upiIdLabel')} *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={upiForm.upiId}
                    onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                    placeholder={t('profile.upiIdPlaceholder')}
                    className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface font-mono font-bold focus:ring-1 focus:ring-primary"
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant mt-1 block">
                  Valid UPI formats include yourname@upi, mobilenumber@okaxis, shop@icici, etc.
                </span>
              </div>

              <div>
                <label className="font-semibold text-xs text-primary block mb-1">
                  {t('profile.accountHolderLabel')}
                </label>
                <input
                  type="text"
                  value={upiForm.accountHolderName}
                  onChange={(e) => setUpiForm({ ...upiForm, accountHolderName: e.target.value })}
                  placeholder="e.g. Rameshwar Patil / Sahyadri Agro"
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" disabled={actionLoading}>
                  {actionLoading ? t('common.processing') : t('profile.savePaymentBtn')}
                </Button>
              </div>
            </form>

            {/* Right: UPI QR Code Display & Upload */}
            <div className="md:col-span-5 p-6 rounded-[20px] bg-surface-container-low border border-surface-variant flex flex-col items-center text-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
                {t('profile.upiQrTitle')}
              </span>

              {paymentSettings?.upiQrCodeUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-48 h-48 rounded-[16px] overflow-hidden bg-white p-2 border-2 border-primary/20 shadow-md">
                    <img
                      src={paymentSettings.upiQrCodeUrl}
                      alt="Farmer UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    ✓ Active UPI QR Code
                  </span>
                </div>
              ) : (
                <div className="w-48 h-48 rounded-[16px] bg-surface-variant/40 border-2 border-dashed border-surface-variant flex flex-col items-center justify-center p-4 text-on-surface-variant">
                  <QrCode className="w-12 h-12 text-secondary mb-2" />
                  <p className="text-[11px] leading-tight text-on-surface-variant/80">
                    {t('profile.noQrUploaded')}
                  </p>
                </div>
              )}

              <p className="text-[10px] text-on-surface-variant max-w-xs">
                {t('profile.upiQrDesc')}
              </p>

              <div className="flex items-center gap-3 w-full justify-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleQrUpload}
                    disabled={actionLoading}
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-primary text-white text-xs font-medium hover:bg-primary-dim transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {paymentSettings?.upiQrCodeUrl
                        ? t('profile.replaceQrBtn')
                        : t('profile.uploadQrBtn')}
                    </span>
                  </span>
                </label>

                {paymentSettings?.upiQrCodeUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveQr}
                    disabled={actionLoading}
                    className="text-xs text-error hover:bg-error-container/30"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>{t('profile.removeQrBtn')}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB CONTENT 6: SECURITY & PASSWORD CHANGE */}
      {activeTab === 'security' && (
        <Card className="p-8 flex flex-col gap-6">
          <div>
            <h3 className="font-display font-semibold text-lg text-primary">
              {t('profile.changePasswordTitle')}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {t('profile.changePasswordSubtitle')}
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-5 max-w-md">
            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.currentPasswordLabel')} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.newPasswordLabel')} *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="font-semibold text-xs text-primary block mb-1">
                {t('profile.confirmPasswordLabel')} *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full px-3.5 py-2 text-xs rounded-[10px] bg-surface-container border border-surface-variant text-on-surface focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" disabled={actionLoading}>
                {actionLoading ? t('common.processing') : t('profile.savePasswordBtn')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ADDRESS MODAL (ADD / EDIT) */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[20px] max-w-lg w-full p-6 shadow-2xl border border-surface-variant flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3">
              <h3 className="font-display font-bold text-lg text-primary">
                {editingAddressId ? t('profile.modalEditTitle') : t('profile.modalAddTitle')}
              </h3>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="text-on-surface-variant hover:text-primary text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-primary block mb-1">
                    {t('profile.labelField')}
                  </label>
                  <select
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                  >
                    <option value="Home">Home (घर)</option>
                    <option value="Work">Work / Office (कार्यालय)</option>
                    <option value="Warehouse">Warehouse (गोदाम)</option>
                    <option value="Other">Other (अन्य)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-primary block mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                  />
                </div>
              </div>

              {isBusiness && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-primary block mb-1">
                      Company / Warehouse Name
                    </label>
                    <input
                      type="text"
                      value={addressForm.companyName}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, companyName: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary block mb-1">
                      Warehouse Contact Person
                    </label>
                    <input
                      type="text"
                      value={addressForm.contactPerson}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, contactPerson: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-surface-variant/40">
                <label className="font-semibold text-primary block mb-1 text-xs">
                  Pinpoint Location on Map / Use GPS
                </label>
                <LocationPicker
                  initialLocation={{
                    line1: addressForm.line1,
                    city: addressForm.city,
                    state: addressForm.state,
                    pincode: addressForm.pincode,
                    latitude: Number(addressForm.coordinates?.latitude) || 18.5204,
                    longitude: Number(addressForm.coordinates?.longitude) || 73.8567,
                  }}
                  showFullForm={false}
                  onLocationSelect={(loc) => {
                    setAddressForm((prev) => ({
                      ...prev,
                      line1: loc.address || prev.line1,
                      city: loc.city || prev.city,
                      state: loc.state || prev.state,
                      pincode: loc.pincode || prev.pincode,
                      coordinates: {
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                      },
                    }));
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-primary block mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={addressForm.contactNumber}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, contactNumber: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-primary block mb-1">
                    Flat / House / Unit No.
                  </label>
                  <input
                    type="text"
                    value={addressForm.houseNo}
                    onChange={(e) => setAddressForm({ ...addressForm, houseNo: e.target.value })}
                    placeholder="e.g. Flat 301, Plot 14"
                    className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-primary block mb-1">
                  Street / Area / Colony
                </label>
                <input
                  type="text"
                  value={addressForm.streetArea}
                  onChange={(e) => setAddressForm({ ...addressForm, streetArea: e.target.value })}
                  placeholder="e.g. Near Baner High Street"
                  className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                />
              </div>

              <div>
                <label className="font-semibold text-primary block mb-1">
                  {t('profile.line1Field')} *
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                  placeholder="Primary building, complex or street name"
                  className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-primary block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Pune"
                    className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-semibold text-primary block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-semibold text-primary block mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    placeholder="411045"
                    className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-primary block mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="e.g. Behind Metro Pillar 42"
                  className="w-full px-3 py-2 rounded-[8px] bg-surface-container border border-surface-variant text-on-surface"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheckbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, isDefault: e.target.checked })
                  }
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="isDefaultCheckbox" className="text-xs text-on-surface font-medium cursor-pointer">
                  {t('profile.isDefaultCheckbox')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-variant/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddressModalOpen(false)}
                >
                  {t('profile.cancelBtn')}
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  {actionLoading ? t('common.processing') : t('profile.saveAddressBtn')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDashboardPage;

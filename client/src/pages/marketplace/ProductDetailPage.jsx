import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Check,
  ShoppingBag,
  MapPin,
  QrCode,
  Copy,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Phone,
  User as UserIcon,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ProgressRing from '../../components/ui/ProgressRing';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';

const ProductDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);

  // Checkout Modal & Delivery Address State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressMode, setAddressMode] = useState('saved'); // 'saved' | 'new'
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    houseNo: '',
    streetArea: '',
    line1: '',
    city: '',
    district: '',
    state: 'Maharashtra',
    pincode: '',
    landmark: '',
  });
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/marketplace/products/${id}`);
        setProduct(res.data.data);
        setQuantity(res.data.data.minOrderQuantity || 1);
      } catch (err) {
        console.error('Failed to load product detail', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const loadUserAddresses = async () => {
    try {
      setAddressesLoading(true);
      const res = await apiClient.get('/users/addresses');
      const list = res.data?.data?.addresses || [];
      setSavedAddresses(list);
      if (list.length > 0) {
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId(defaultAddr._id);
        setAddressMode('saved');
      } else {
        setAddressMode('new');
      }
    } catch (err) {
      console.error('Failed to load user addresses', err);
      setAddressMode('new');
    } finally {
      setAddressesLoading(false);
    }
  };

  const openCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setCheckoutError(null);
    setNewAddress((prev) => ({
      ...prev,
      fullName: user?.fullName || '',
      phone: user?.phone || '',
    }));
    loadUserAddresses();
    setCheckoutModalOpen(true);
  };

  const handleCopyUpi = (upiId) => {
    if (!upiId) return;
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleConfirmOrder = async () => {
    setCheckoutError(null);

    let finalDeliveryAddress = null;

    if (addressMode === 'saved') {
      const chosen = savedAddresses.find((a) => a._id === selectedAddressId);
      if (!chosen) {
        setCheckoutError('Please select a delivery address or enter a new one.');
        return;
      }
      finalDeliveryAddress = {
        fullName: chosen.fullName || user?.fullName || 'Valued Buyer',
        phone: chosen.contactNumber || chosen.phone || user?.phone || '+91 9876543210',
        houseNo: chosen.houseNo || '',
        streetArea: chosen.streetArea || '',
        line1: chosen.line1 || 'Primary Farm Delivery',
        line2: chosen.line2 || '',
        city: chosen.city || 'Pune',
        district: chosen.district || chosen.city || 'Pune',
        state: chosen.state || 'Maharashtra',
        pincode: chosen.pincode || '411001',
        landmark: chosen.landmark || '',
      };
    } else {
      // Validate new address fields
      if (!newAddress.fullName.trim()) {
        setCheckoutError('Recipient full name is required.');
        return;
      }
      if (!newAddress.phone.trim() || newAddress.phone.trim().length < 10) {
        setCheckoutError('Valid 10-digit contact number is required.');
        return;
      }
      if (!newAddress.line1.trim()) {
        setCheckoutError('Delivery address line 1 is required.');
        return;
      }
      if (!newAddress.city.trim()) {
        setCheckoutError('City is required.');
        return;
      }
      if (!newAddress.state.trim()) {
        setCheckoutError('State is required.');
        return;
      }
      if (!newAddress.pincode.trim() || !/^\d{6}$/.test(newAddress.pincode.trim())) {
        setCheckoutError('Valid 6-digit postal pincode is required.');
        return;
      }

      finalDeliveryAddress = {
        fullName: newAddress.fullName.trim(),
        phone: newAddress.phone.trim(),
        houseNo: newAddress.houseNo.trim(),
        streetArea: newAddress.streetArea.trim(),
        line1: newAddress.line1.trim(),
        city: newAddress.city.trim(),
        district: newAddress.district.trim() || newAddress.city.trim(),
        state: newAddress.state.trim(),
        pincode: newAddress.pincode.trim(),
        landmark: newAddress.landmark.trim(),
      };

      // If user checked "Save to profile", save asynchronously without blocking
      if (saveToProfile) {
        try {
          await apiClient.post('/users/addresses', {
            label: 'HOME',
            fullName: newAddress.fullName.trim(),
            contactNumber: newAddress.phone.trim(),
            houseNo: newAddress.houseNo.trim(),
            streetArea: newAddress.streetArea.trim(),
            line1: newAddress.line1.trim(),
            city: newAddress.city.trim(),
            district: newAddress.district.trim() || newAddress.city.trim(),
            state: newAddress.state.trim(),
            pincode: newAddress.pincode.trim(),
            landmark: newAddress.landmark.trim(),
            isDefault: false,
          });
        } catch (saveErr) {
          console.warn('Could not save address to profile:', saveErr);
        }
      }
    }

    setOrdering(true);
    try {
      await apiClient.post('/orders', {
        items: [{ productId: product.id, quantity: Number(quantity) }],
        deliveryAddress: finalDeliveryAddress,
        paymentMethod: 'DIRECT_ORDER',
      });

      setCheckoutModalOpen(false);

      // Redirect to role-appropriate orders page
      const role = user?.role;
      if (role === 'BUSINESS') {
        navigate('/business/orders');
      } else if (role === 'FARMER') {
        navigate('/farmer/orders');
      } else if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/consumer/orders');
      }
    } catch (err) {
      setCheckoutError(err.response?.data?.error?.message || 'Order creation failed. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <Skeleton className="h-96 rounded-[24px]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 text-center">
        <p className="text-sm text-on-surface-variant">{t('productDetail.produceNotFound')}</p>
        <Link to="/marketplace" className="text-xs text-primary font-bold underline mt-2 inline-block">
          {t('productDetail.returnToMarketplace')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 flex flex-col gap-10">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link to="/marketplace" className="hover:text-primary">
          {t('productDetail.breadcrumbMarketplace')}
        </Link>
        <span>/</span>
        <span className="text-primary font-medium">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Produce Image Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-[24px] overflow-hidden border border-surface-variant soil-shadow h-96 sm:h-[480px]">
            <img
              src={
                product.images?.[0] ||
                'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=1200'
              }
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* AI Quality Verification Banner */}
          {product.qualityAssessment && (
            <Card className="bg-surface-container-low p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3">
                <div className="flex items-center gap-3">
                  <ProgressRing
                    progress={Math.round((product.qualityAssessment.confidence || 0.9) * 100)}
                    size={48}
                    strokeWidth={5}
                  />
                  <div>
                    <h4 className="font-display font-semibold text-primary text-sm">
                      {t('productDetail.aiVerifiedGrade', { grade: product.qualityAssessment.classification.replace(/_/g, ' ') })}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant">
                      {t('productDetail.assessedOn', { date: new Date(product.qualityAssessment.assessedAt).toLocaleDateString() })}
                    </p>
                  </div>
                </div>
                <Badge variant="success">
                  {t('productDetail.confidenceScore', { percent: Math.round((product.qualityAssessment.confidence || 0.9) * 100) })}
                </Badge>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-secondary block mb-1">
                  {t('productDetail.morphologicalObservations')}
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-on-surface">
                  {product.qualityAssessment.observations?.map((obs, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[10px] text-on-surface-variant italic border-t border-surface-variant/40 pt-2">
                {product.qualityAssessment.disclaimer}
              </p>
            </Card>
          )}
        </div>

        {/* Right Column: Purchasing & Batch Traceability Details */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="p-8 flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="warning">{product.category}</Badge>
                <span className="text-xs text-on-surface-variant">
                  📍 {product.location?.district}, {product.location?.state}
                </span>
              </div>

              <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mb-2">
                {product.title}
              </h1>

              <div className="flex items-baseline gap-2 mt-4">
                <span className="font-display font-bold text-4xl text-primary">
                  ₹{product.pricePerUnit}
                </span>
                <span className="text-sm text-on-surface-variant font-medium">
                  / {product.unit} {t('marketplace.inclusiveHandling')}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {product.description}
            </p>

            {/* Farm-Gate Traceability Metadata Card */}
            {product.batchTraceability && (
              <div className="p-4 rounded-[16px] bg-surface-container border border-surface-variant/60 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between font-mono font-bold text-primary">
                  <span>{t('productDetail.batchCodeLabel')}</span>
                  <span>{product.batchTraceability.batchId}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span>{t('farmerDashboard.harvestDateCol')}:</span>
                  <span>{new Date(product.batchTraceability.harvestDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span>{t('productDetail.storageProtocolLabel')}</span>
                  <span>{product.batchTraceability.storageMethod || t('productDetail.ventilatedFarmStorage')}</span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span>{t('productDetail.projectedShelfLifeLabel')}</span>
                  <span className="font-semibold text-secondary">
                    {product.batchTraceability.shelfLifeDays} {t('productDetail.days')}
                  </span>
                </div>
              </div>
            )}

            {/* Quantity Stepper & Buy Action */}
            <div className="pt-4 border-t border-surface-variant/60 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface">{t('productDetail.orderQuantityLabel')}</span>
                <div className="flex items-center gap-3 bg-surface-container rounded-full px-3 py-1 border border-surface-variant">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(product.minOrderQuantity, prev - 1))}
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-primary hover:bg-surface-variant"
                  >
                    -
                  </button>
                  <span className="font-semibold text-sm text-primary w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(product.availableQuantity, prev + 1))}
                    className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-primary hover:bg-surface-variant"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>{t('productDetail.subtotalEstimate')}</span>
                <span className="font-display font-bold text-xl text-primary">
                  ₹{product.pricePerUnit * quantity}
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                loading={ordering}
                onClick={openCheckout}
                className="w-full mt-2"
              >
                <ShoppingBag className="w-5 h-5 shrink-0" />
                {isAuthenticated ? t('productDetail.placeOrderBtn') : t('productDetail.signInToOrderBtn')}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Direct Farm Order & Delivery Address Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl rounded-[24px] shadow-soil-lg border border-surface-variant p-6 sm:p-8 my-8 flex flex-col gap-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-variant/60 pb-4">
              <div>
                <h3 className="font-display font-bold text-xl text-primary">
                  {t('checkout.orderConfirmationTitle')}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {product.title} • {quantity} {product.unit} • ₹{product.pricePerUnit * quantity}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Notification */}
            {checkoutError && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Section 1: Delivery Location */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-semibold text-sm text-primary flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-secondary" />
                  {t('checkout.deliveryLocationTitle')}
                </h4>
                {savedAddresses.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAddressMode('saved')}
                      className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        addressMode === 'saved'
                          ? 'bg-primary text-white'
                          : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80'
                      }`}
                    >
                      {t('checkout.selectSavedAddress')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressMode('new')}
                      className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        addressMode === 'new'
                          ? 'bg-primary text-white'
                          : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80'
                      }`}
                    >
                      + {t('checkout.addNewAddress')}
                    </button>
                  </div>
                )}
              </div>

              {/* Mode: Saved Addresses */}
              {addressMode === 'saved' && (
                <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {addressesLoading ? (
                    <Skeleton className="h-20 rounded-xl" count={2} />
                  ) : savedAddresses.length === 0 ? (
                    <p className="text-xs text-on-surface-variant italic py-2">
                      {t('checkout.noSavedAddresses')}
                    </p>
                  ) : (
                    savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id;
                      return (
                        <div
                          key={addr._id}
                          onClick={() => setSelectedAddressId(addr._id)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-surface-variant bg-surface-container/50 hover:border-primary/40'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-primary bg-primary' : 'border-outline'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="info">{addr.label || 'ADDRESS'}</Badge>
                              <span className="font-semibold text-primary">{addr.fullName}</span>
                              {addr.isDefault && (
                                <span className="text-[10px] text-secondary font-bold uppercase">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-on-surface-variant leading-relaxed">
                              {[addr.houseNo, addr.streetArea, addr.line1, addr.landmark, addr.city, addr.state, addr.pincode]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                            <p className="text-on-surface-variant mt-1 text-[11px]">
                              📞 {addr.contactNumber || addr.phone}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Mode: Add New Address */}
              {addressMode === 'new' && (
                <div className="p-4 rounded-xl bg-surface-container/40 border border-surface-variant flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                        {t('checkout.fullNamePlaceholder')} *
                      </label>
                      <input
                        type="text"
                        value={newAddress.fullName}
                        onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3 py-2 rounded-lg border border-surface-variant bg-surface text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                        {t('checkout.phonePlaceholder')} *
                      </label>
                      <input
                        type="tel"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        placeholder="10-digit mobile"
                        className="w-full px-3 py-2 rounded-lg border border-surface-variant bg-surface text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                        {t('checkout.houseNoPlaceholder')}
                      </label>
                      <input
                        type="text"
                        value={newAddress.houseNo}
                        onChange={(e) => setNewAddress({ ...newAddress, houseNo: e.target.value })}
                        placeholder="Plot 42, Green Valley"
                        className="w-full px-3 py-2 rounded-lg border border-surface-variant bg-surface text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                        {t('checkout.streetAreaPlaceholder')}
                      </label>
                      <input
                        type="text"
                        value={newAddress.streetArea}
                        onChange={(e) => setNewAddress({ ...newAddress, streetArea: e.target.value })}
                        placeholder="Near APMC Yard, Baramati"
                        className="w-full px-3 py-2 rounded-lg border border-surface-variant bg-surface text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                      {t('checkout.line1Placeholder')} *
                    </label>
                    <input
                      type="text"
                      value={newAddress.line1}
                      onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                      placeholder="Street address or delivery location"
                      className="w-full px-3 py-2 rounded-lg border border-surface-variant bg-surface text-on-surface text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-medium text-on-surface-variant mb-1">
                        {t('checkout.cityPlaceholder')} *
                      </label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="City"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-surface-variant bg-surface text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-on-surface-variant mb-1">
                        {t('checkout.districtPlaceholder')}
                      </label>
                      <input
                        type="text"
                        value={newAddress.district}
                        onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                        placeholder="District"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-surface-variant bg-surface text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-on-surface-variant mb-1">
                        {t('checkout.statePlaceholder')} *
                      </label>
                      <input
                        type="text"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        placeholder="State"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-surface-variant bg-surface text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-on-surface-variant mb-1">
                        {t('checkout.pincodePlaceholder')} *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={newAddress.pincode}
                        onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '') })}
                        placeholder="6 digits"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-surface-variant bg-surface text-on-surface text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>{t('checkout.saveAddressToProfile')}</span>
                  </label>
                </div>
              )}
            </div>

            {/* Section 2: Farmer Direct UPI Payment Details */}
            <div className="p-4 rounded-xl bg-surface-container border border-surface-variant/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display font-semibold text-xs text-primary flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-secondary" />
                  {t('checkout.farmerPaymentTitle')}
                </h4>
                <Badge variant="warning">DIRECT_ORDER</Badge>
              </div>

              {product.farmer?.payment?.isConfigured ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {product.farmer.payment.upiQrCodeUrl && (
                    <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-sm border border-surface-variant flex items-center justify-center shrink-0">
                      <img
                        src={product.farmer.payment.upiQrCodeUrl}
                        alt="Farmer UPI QR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                        {t('checkout.upiId')}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-primary text-sm">
                          {product.farmer.payment.upiId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyUpi(product.farmer.payment.upiId)}
                          className="px-2 py-0.5 rounded bg-surface-variant hover:bg-surface-variant/80 text-[10px] font-semibold text-primary flex items-center gap-1 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedUpi ? t('checkout.copied') : t('checkout.copyUpi')}
                        </button>
                      </div>
                      {product.farmer.payment.accountHolderName && (
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {product.farmer.payment.accountHolderName} ({product.farmer.farmName || 'Grower'})
                        </p>
                      )}
                    </div>

                    <p className="text-[11px] text-secondary leading-relaxed font-medium">
                      {t('checkout.scanQrCode')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t('checkout.directOrderNote')}
                </p>
              )}
            </div>

            {/* Total and Action Buttons */}
            <div className="pt-3 border-t border-surface-variant/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                  {t('checkout.orderTotal')}
                </span>
                <span className="font-display font-bold text-2xl text-primary">
                  ₹{product.pricePerUnit * quantity}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="flex-1 sm:flex-initial"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  loading={ordering}
                  onClick={handleConfirmOrder}
                  className="flex-1 sm:flex-initial"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('checkout.confirmOrder')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;

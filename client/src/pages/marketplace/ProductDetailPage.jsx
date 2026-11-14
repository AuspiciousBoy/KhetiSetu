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
  Navigation,
  Search,
  Upload,
  FileText,
  Loader2,
  ShieldCheck,
  Truck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ProgressRing from '../../components/ui/ProgressRing';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LocationPicker from '../../components/location/LocationPicker';
import InvoiceModal from '../../components/orders/InvoiceModal';

const ProductDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [ordering, setOrdering] = useState(false);

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressMode, setAddressMode] = useState('saved'); // 'saved' | 'current' | 'search'
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: '',
    phone: '',
    houseNo: '',
    streetArea: '',
    line1: '',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    landmark: '',
    coordinates: { latitude: 18.5204, longitude: 73.8567 },
  });
  const [saveToProfile, setSaveToProfile] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Quote & Payment State
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

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
        applyAddress(defaultAddr);
      } else {
        setAddressMode('search');
        fetchQuote(deliveryAddress, deliveryAddress.coordinates);
      }
    } catch (err) {
      console.error('Failed to load user addresses', err);
      setAddressMode('search');
      fetchQuote(deliveryAddress, deliveryAddress.coordinates);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      fetchQuote(deliveryAddress, deliveryAddress.coordinates);
    }
  }, [product?.id, quantity]);

  const applyAddress = (addr) => {
    const updated = {
      fullName: addr.fullName || user?.fullName || '',
      phone: addr.contactNumber || addr.phone || user?.phone || '',
      houseNo: addr.houseNo || '',
      streetArea: addr.streetArea || '',
      line1: addr.line1 || addr.address || '',
      city: addr.city || 'Pune',
      district: addr.district || addr.city || 'Pune',
      state: addr.state || 'Maharashtra',
      pincode: addr.pincode || '411001',
      landmark: addr.landmark || '',
      coordinates: addr.coordinates || { latitude: 18.5204, longitude: 73.8567 },
    };
    setDeliveryAddress(updated);
    fetchQuote(updated, updated.coordinates);
  };

  const fetchQuote = async (targetAddr, targetCoords) => {
    if (!product) return;
    try {
      setQuoteLoading(true);
      const res = await apiClient.post('/orders/preview-quote', {
        items: [{ productId: product.id, quantity: Number(quantity) }],
        deliveryAddress: targetAddr || deliveryAddress,
        coordinates: targetCoords || targetAddr?.coordinates || deliveryAddress.coordinates,
      });
      setQuote(res.data.data);
    } catch (err) {
      console.warn('Failed to calculate preview quote:', err);
    } finally {
      setQuoteLoading(false);
    }
  };

  const openCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setCheckoutError(null);
    setPaymentProofUrl('');
    setDeliveryAddress((prev) => ({
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

  const handleLocationPicked = (loc) => {
    const updated = {
      ...deliveryAddress,
      line1: loc.address || loc.line1 || deliveryAddress.line1,
      city: loc.city || deliveryAddress.city,
      district: loc.district || deliveryAddress.district,
      state: loc.state || deliveryAddress.state,
      pincode: loc.pincode || deliveryAddress.pincode,
      landmark: loc.landmark || deliveryAddress.landmark,
      coordinates: {
        latitude: loc.latitude,
        longitude: loc.longitude,
      },
    };
    setDeliveryAddress(updated);
    fetchQuote(updated, { latitude: loc.latitude, longitude: loc.longitude });
  };

  const handleUploadProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setCheckoutError('Payment proof must be a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCheckoutError('Payment screenshot must be under 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('paymentProof', file);

    try {
      setUploadingProof(true);
      setCheckoutError(null);
      const res = await apiClient.post('/orders/upload-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPaymentProofUrl(res.data.data.paymentProofUrl);
    } catch (err) {
      setCheckoutError(err.response?.data?.error?.message || 'Failed to upload payment proof.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleConfirmOrder = async () => {
    setCheckoutError(null);

    // Validation 1: Delivery Address Fields
    if (!deliveryAddress.fullName?.trim()) {
      setCheckoutError('Recipient full name is required.');
      return;
    }
    if (!deliveryAddress.phone?.trim() || deliveryAddress.phone.trim().length < 10) {
      setCheckoutError('Valid 10-digit contact number is required.');
      return;
    }
    if (!deliveryAddress.line1?.trim()) {
      setCheckoutError('Delivery address line 1 is required.');
      return;
    }
    if (!deliveryAddress.city?.trim()) {
      setCheckoutError('City is required.');
      return;
    }
    if (!deliveryAddress.state?.trim()) {
      setCheckoutError('State is required.');
      return;
    }
    if (!deliveryAddress.pincode?.trim() || !/^\d{6}$/.test(deliveryAddress.pincode.trim())) {
      setCheckoutError('Valid 6-digit postal pincode is required.');
      return;
    }

    // Validation 2: Payment Proof Screenshot Required
    if (!paymentProofUrl) {
      setCheckoutError('Please scan the farmer QR, pay the 40% advance, and upload the payment screenshot proof to proceed.');
      return;
    }

    // Optional: Save to user profile
    if (saveToProfile) {
      try {
        await apiClient.post('/users/addresses', {
          label: 'HOME',
          fullName: deliveryAddress.fullName.trim(),
          contactNumber: deliveryAddress.phone.trim(),
          houseNo: deliveryAddress.houseNo?.trim() || '',
          streetArea: deliveryAddress.streetArea?.trim() || '',
          line1: deliveryAddress.line1.trim(),
          city: deliveryAddress.city.trim(),
          district: deliveryAddress.district?.trim() || deliveryAddress.city.trim(),
          state: deliveryAddress.state.trim(),
          pincode: deliveryAddress.pincode.trim(),
          landmark: deliveryAddress.landmark?.trim() || '',
          coordinates: deliveryAddress.coordinates,
          isDefault: false,
        });
      } catch (saveErr) {
        console.warn('Could not save address to profile:', saveErr);
      }
    }

    setOrdering(true);
    try {
      const res = await apiClient.post('/orders', {
        items: [{ productId: product.id, quantity: Number(quantity) }],
        deliveryAddress,
        paymentProofUrl,
        paymentMethod: 'DIRECT_ORDER',
      });

      setCompletedOrder(res.data.data);
      setCheckoutModalOpen(false);
      setInvoiceModalOpen(true);
    } catch (err) {
      setCheckoutError(err.response?.data?.error?.message || 'Order creation failed. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  const handleCloseInvoice = () => {
    setInvoiceModalOpen(false);
    if (user?.role === 'BUSINESS') {
      navigate('/business/orders');
    } else {
      navigate('/consumer/orders');
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
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 text-center">
        <h2 className="text-xl font-display font-bold text-primary mb-2">Produce Not Found</h2>
        <p className="text-sm text-on-surface-variant mb-6">The agricultural listing you requested is unavailable.</p>
        <Link to="/marketplace">
          <Button variant="primary">Browse Marketplace</Button>
        </Link>
      </div>
    );
  }

  const primaryFarmer = quote?.primaryFarmer || quote?.farmerPaymentInfo?.[0] || product.farmer || {};
  const distanceKm = quote?.distanceKm || 15;
  const subtotal = quote?.subtotal || product.pricePerUnit * quantity;
  const deliveryFee = quote?.deliveryFee || 40;
  const tax = quote?.tax || Math.round(subtotal * 0.05);
  const grandTotal = quote?.total || subtotal + deliveryFee + tax;
  const advanceAmount = quote?.advanceAmount || Math.round(grandTotal * 0.40);
  const pendingAmount = quote?.pendingAmount || grandTotal - advanceAmount;

  // Resolve Farmer Profile and Payment Information
  const farmerDisplayName =
    primaryFarmer?.farmerName ||
    primaryFarmer?.fullName ||
    product.farmer?.fullName ||
    product.farmer?.farmName ||
    'Verified Farmer';
  const farmerFarmName =
    primaryFarmer?.farmName ||
    product.farmer?.farmName ||
    `${farmerDisplayName}'s Farm`;
  const farmerUpiId =
    primaryFarmer?.upiId ||
    primaryFarmer?.payment?.upiId ||
    product.farmer?.payment?.upiId ||
    product.farmer?.upiId ||
    '';
  const farmerQrUrl =
    primaryFarmer?.upiQrCodeUrl ||
    primaryFarmer?.payment?.upiQrCodeUrl ||
    product.farmer?.payment?.upiQrCodeUrl ||
    product.farmer?.upiQrCodeUrl ||
    '';
  const farmerLocationText = [
    product.farmer?.village || product.farmer?.location?.village,
    product.farmer?.city || product.farmer?.location?.city,
    product.farmer?.district || product.farmer?.location?.district || product.location?.district,
    product.farmer?.state || product.farmer?.location?.state || product.location?.state,
  ].filter(Boolean).join(', ') || product.farmer?.farmAddress || product.farmer?.location?.farmAddress || 'Maharashtra';

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 sm:py-12">
      {/* Product Display Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left: Image Card */}
        <div className="rounded-[24px] overflow-hidden border border-surface-variant bg-surface-container relative soil-shadow">
          <div className="aspect-[4/3] w-full bg-surface-container flex items-center justify-center overflow-hidden">
            {product.imageUrl || product.images?.[0] ? (
              <img
                src={product.imageUrl || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-8">
                <ShoppingBag className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-2" />
                <span className="text-xs text-on-surface-variant">Farm Fresh Produce</span>
              </div>
            )}
          </div>
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant="success">{product.cropName || 'Fresh Harvest'}</Badge>
            {product.grade && <Badge variant="info">Grade {product.grade}</Badge>}
          </div>
        </div>

        {/* Right: Info & Pricing */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-secondary">
              Direct Farm Produce
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary mt-1">
              {product.title}
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              {product.description || 'Harvested directly from certified farms. Verified freshness and trace origin recorded on KhetiSetu.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container/60 border border-surface-variant/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-semibold text-on-surface-variant block">Farm Gate Rate</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-display font-bold text-primary">₹{product.pricePerUnit}</span>
                <span className="text-xs text-on-surface-variant font-medium">/ {product.unit}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] uppercase font-semibold text-on-surface-variant block">Available Stock</span>
              <span className="text-sm font-bold text-secondary">{product.availableQuantity} {product.unit}</span>
            </div>
          </div>

          {/* Farmer Card */}
          <div className="p-4 rounded-2xl bg-surface border border-surface-variant flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                {(product.farmer?.fullName || product.farmer?.farmName || 'F')[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm text-primary">
                  {product.farmer?.fullName || product.farmer?.farmName || 'Certified Farmer'}
                </p>
                {product.farmer?.farmName && product.farmer.farmName !== product.farmer.fullName && (
                  <p className="text-[11px] text-secondary font-medium -mt-0.5">
                    {product.farmer.farmName}
                  </p>
                )}
                <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-secondary shrink-0" />
                  <span>{farmerLocationText}</span>
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {product.farmer?.isVerified ? 'Verified Grower' : 'Certified Farmer'}
            </Badge>
          </div>

          {/* Quantity Selector & Order CTA */}
          <div className="p-5 rounded-2xl bg-surface border border-surface-variant flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">Order Quantity:</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(product.minOrderQuantity || 1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-variant font-bold text-primary flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="font-mono font-bold text-base text-primary px-2">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.availableQuantity || 9999, q + 1))}
                  className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-variant font-bold text-primary flex items-center justify-center transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-on-surface-variant">{product.unit}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={openCheckout}
              className="w-full flex items-center justify-center gap-2 py-3.5 shadow-md"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Direct Farm Checkout • ₹{product.pricePerUnit * quantity}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Production-Ready 40% Advance Payment & Location Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl max-h-[90vh] my-auto rounded-[24px] shadow-2xl border border-surface-variant flex flex-col relative overflow-hidden">
            {/* Modal Header (Fixed at top) */}
            <div className="p-4 sm:p-6 pb-3 border-b border-surface-variant/60 flex items-center justify-between shrink-0 bg-surface">
              <div>
                <h3 className="font-display font-bold text-base sm:text-xl text-primary flex items-center gap-2">
                  <span>Farm Order & Advance Settlement</span>
                  <Badge variant="warning">40% ADVANCE</Badge>
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {product.title} • {quantity} {product.unit} • Subtotal ₹{product.pricePerUnit * quantity}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
                aria-label="Close checkout modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto min-h-0 flex-1 flex flex-col gap-5 overscroll-contain">
              {/* Error Notification */}
              {checkoutError && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* STEP 1: Delivery Location with 3 Options */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-display font-semibold text-xs sm:text-sm text-primary flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-secondary" />
                    <span>1. Delivery Destination Location</span>
                  </h4>

                  <div className="flex items-center gap-1.5 text-xs">
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAddressMode('saved')}
                        className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                          addressMode === 'saved'
                            ? 'bg-primary text-white'
                            : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80'
                        }`}
                      >
                        Saved Address
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAddressMode('current')}
                      className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        addressMode === 'current'
                          ? 'bg-primary text-white'
                          : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80'
                      }`}
                    >
                      Use GPS
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressMode('search')}
                      className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        addressMode === 'search'
                          ? 'bg-primary text-white'
                          : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80'
                      }`}
                    >
                      Search on Map
                    </button>
                  </div>
                </div>

                {/* Mode: Saved Address list */}
                {addressMode === 'saved' && savedAddresses.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id;
                      return (
                        <div
                          key={addr._id}
                          onClick={() => {
                            setSelectedAddressId(addr._id);
                            applyAddress(addr);
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-surface-variant bg-surface-container/40 hover:border-primary/40'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-primary bg-primary' : 'border-outline'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold text-primary">{addr.fullName}</span> •{' '}
                            <span className="text-on-surface-variant font-mono">{addr.contactNumber || addr.phone}</span>
                            <p className="text-on-surface-variant line-clamp-1 mt-0.5">
                              {[addr.houseNo, addr.streetArea, addr.line1, addr.city, addr.state, addr.pincode]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Mode: Interactive LocationPicker (Current GPS / Search on Map) */}
                {(addressMode === 'current' || addressMode === 'search') && (
                  <LocationPicker
                    initialLocation={deliveryAddress}
                    showFullForm={true}
                    onLocationSelect={handleLocationPicked}
                  />
                )}

                {/* Recipient Contact fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-0.5">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress.fullName}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, fullName: e.target.value })}
                      placeholder="Recipient person or business"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-on-surface-variant uppercase mb-0.5">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={deliveryAddress.phone}
                      onChange={(e) => setDeliveryAddress({ ...deliveryAddress, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-surface-variant bg-surface text-on-surface font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-on-surface-variant">Save this delivery location to my profile</span>
                </label>
              </div>

              {/* STEP 2: Real-time Distance, Delivery Fee & 40% Advance Breakdown */}
              <div className="p-4 rounded-xl bg-surface-container border border-surface-variant/80 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-xs text-primary flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-secondary" />
                    <span>2. Distance-Based Delivery & Financial Breakdown</span>
                  </h4>
                  {quoteLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-surface border border-surface-variant/60">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Distance</span>
                    <span className="font-mono font-bold text-primary text-sm">{distanceKm} km</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-surface-variant/60">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Freight Charge</span>
                    <span className="font-mono font-bold text-primary text-sm">₹{deliveryFee}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-surface-variant/60">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">GST (5%)</span>
                    <span className="font-mono font-bold text-primary text-sm">₹{tax}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface border border-surface-variant/60">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Grand Total</span>
                    <span className="font-mono font-bold text-primary text-sm">₹{grandTotal}</span>
                  </div>
                </div>

                {/* 40% Advance Payment Highlight */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs block">
                      40% Advance Payment Required: ₹{advanceAmount}
                    </span>
                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 block">
                      Remaining 60% (₹{pendingAmount}) is payable upon produce dispatch/delivery.
                    </span>
                  </div>
                  <Badge variant="success">PAY ₹{advanceAmount} NOW</Badge>
                </div>
              </div>

              {/* STEP 3: Farmer UPI QR & Payment Screenshot Proof Upload */}
              <div className="p-4 rounded-xl bg-surface-container border border-surface-variant/80 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-semibold text-xs text-primary flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-secondary" />
                    <span>3. Scan Farmer QR & Pay 40% Advance</span>
                  </h4>
                  <span className="text-[10px] font-mono font-semibold text-secondary">
                    Grower: {farmerDisplayName}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {farmerQrUrl ? (
                    <div className="w-28 sm:w-32 h-28 sm:h-32 bg-white p-2 rounded-xl border border-surface-variant shrink-0 flex items-center justify-center shadow-sm">
                      <img
                        src={farmerQrUrl}
                        alt={`${farmerDisplayName} UPI QR Code`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-28 sm:w-32 h-28 sm:h-32 bg-surface p-2 rounded-xl border border-dashed border-surface-variant shrink-0 flex flex-col items-center justify-center text-center text-on-surface-variant/60">
                      <QrCode className="w-8 h-8 mb-1 text-primary/40" />
                      <span className="text-[9px] font-medium">Direct UPI Transfer</span>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-2 w-full">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Farmer UPI ID (VPA)</span>
                      {farmerUpiId ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-primary text-sm bg-surface px-2.5 py-1 rounded-lg border border-surface-variant/60 select-all">
                            {farmerUpiId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyUpi(farmerUpiId)}
                            className="px-2.5 py-1 rounded-lg bg-surface-variant hover:bg-surface-variant/80 text-[10px] font-semibold text-primary flex items-center gap-1 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedUpi ? 'Copied' : 'Copy UPI'}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          UPI ID not configured by grower. Direct settlement on delivery.
                        </p>
                      )}
                    </div>

                    {/* Screenshot Upload File Control */}
                    <div className="pt-2 border-t border-surface-variant/50">
                      <label className="block text-[10px] font-bold text-on-surface uppercase mb-1">
                        Upload 40% Payment Screenshot *
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-colors">
                            {uploadingProof ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingProof ? 'Uploading Proof...' : paymentProofUrl ? 'Replace Screenshot' : 'Choose Payment Screenshot'}</span>
                          </div>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleUploadProof}
                            disabled={uploadingProof}
                          />
                        </label>
                      </div>

                      {paymentProofUrl && (
                        <div className="mt-2 p-2 rounded-lg bg-surface border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-medium text-[11px]">Payment proof uploaded successfully</span>
                          </div>
                          <a
                            href={paymentProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] underline font-semibold flex items-center gap-0.5"
                          >
                            <span>Preview</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls (Fixed at bottom) */}
            <div className="p-4 sm:p-6 pt-3 border-t border-surface-variant/60 bg-surface shrink-0 rounded-b-[24px] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Advance Required Now</span>
                <span className="font-display font-bold text-2xl text-emerald-700 dark:text-emerald-400">
                  ₹{advanceAmount}
                </span>
                <span className="text-[10px] text-on-surface-variant ml-1 font-mono">(Total: ₹{grandTotal})</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="flex-1 sm:flex-initial text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  loading={ordering}
                  disabled={!paymentProofUrl || ordering}
                  onClick={handleConfirmOrder}
                  className="flex-1 sm:flex-initial text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Advance & Confirm Order</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Invoice Modal Displayed After Successful Order Confirmation */}
      <InvoiceModal
        order={completedOrder}
        isOpen={invoiceModalOpen}
        onClose={handleCloseInvoice}
      />
    </div>
  );
};

export default ProductDetailPage;

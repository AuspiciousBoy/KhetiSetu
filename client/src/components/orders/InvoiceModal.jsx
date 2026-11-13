import React from 'react';
import { Printer, X, CheckCircle2, Sprout, MapPin, Phone, Mail, FileText, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Printable A4 Tax Invoice Modal for KhetiSetu
 * Renders complete order financial snapshot with 40% advance, distance-based delivery, and print stylesheet.
 */
const InvoiceModal = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = order.invoiceNumber || `INV-${order.orderId || 'DIRECT'}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const buyer = order.buyerDetails || {
    fullName: order.deliveryAddress?.fullName || 'Valued Buyer',
    phone: order.deliveryAddress?.phone || 'N/A',
    email: order.buyerId?.email || '',
    role: order.buyerRole || 'CONSUMER',
  };

  const seller = order.sellerDetails || {
    fullName: order.farmerPaymentInfo?.[0]?.farmerName || order.farmerId?.fullName || 'Registered Farmer',
    farmName: order.farmerId?.farmName || 'KhetiSetu Certified Farm',
    phone: order.farmerId?.phone || '',
    upiId: order.farmerPaymentInfo?.[0]?.upiId || '',
  };

  const subtotal = order.subtotal || 0;
  const deliveryFee = order.deliveryFee || 0;
  const distanceKm = order.distanceKm || 15;
  const tax = order.tax || Math.round(subtotal * 0.05);
  const total = order.total || subtotal + deliveryFee + tax;
  const advanceAmount = order.advanceAmount || Math.round(total * 0.40);
  const pendingAmount = order.pendingAmount || total - advanceAmount;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="bg-surface text-on-surface w-full max-w-3xl rounded-[24px] shadow-2xl border border-surface-variant my-6 overflow-hidden flex flex-col relative print:border-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Top Control Bar (Hidden during printing) */}
        <div className="bg-surface-container px-6 py-3.5 border-b border-surface-variant flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-semibold text-xs text-primary">KhetiSetu Official Tax Invoice</span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
              {invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Content Area */}
        <div id="khetisetu-invoice" className="p-6 sm:p-10 bg-surface flex flex-col gap-6 text-xs text-on-surface print:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-surface-variant/80 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5 text-emerald-300" />
                </div>
                <span className="font-display font-bold text-xl uppercase tracking-tight text-primary">
                  KHETISETU
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant font-medium">
                Farm-to-Market Direct Agricultural Commerce Platform
              </p>
              <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                GSTIN: 27AABCK1234F1Z8 • contact@khetisetu.in • Maharashtra, India
              </p>
            </div>

            <div className="sm:text-right">
              <h2 className="font-display font-bold text-lg text-primary uppercase tracking-wide">
                TAX INVOICE
              </h2>
              <p className="font-mono font-bold text-xs text-secondary mt-0.5">{invoiceNumber}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Order ID: <span className="font-mono font-semibold">{order.orderId}</span>
              </p>
              <p className="text-[11px] text-on-surface-variant">Date: {orderDate}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase">
                <CheckCircle2 className="w-3 h-3" />
                <span>{order.paymentStatus || 'ADVANCE_PAID'}</span>
              </div>
            </div>
          </div>

          {/* Parties: Buyer & Seller Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-surface-container/50 border border-surface-variant/60">
            {/* Seller */}
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                FARMER / SELLER
              </span>
              <p className="font-semibold text-sm text-primary">{seller.fullName}</p>
              {seller.farmName && (
                <p className="text-secondary font-medium text-[11px]">{seller.farmName}</p>
              )}
              {seller.phone && (
                <p className="text-on-surface-variant flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {seller.phone}
                </p>
              )}
              {seller.upiId && (
                <p className="text-[11px] font-mono text-primary/80 mt-0.5">UPI ID: {seller.upiId}</p>
              )}
              {seller.location?.state && (
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Location: {seller.location.district || seller.location.city || ''}, {seller.location.state}
                </p>
              )}
            </div>

            {/* Buyer */}
            <div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                BUYER / BILL TO
              </span>
              <p className="font-semibold text-sm text-primary">{buyer.fullName}</p>
              <p className="text-on-surface-variant text-[11px]">Type: {buyer.role || 'CONSUMER'}</p>
              {buyer.phone && (
                <p className="text-on-surface-variant flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" /> {buyer.phone}
                </p>
              )}
              {buyer.email && (
                <p className="text-on-surface-variant flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {buyer.email}
                </p>
              )}
              <div className="mt-2 text-on-surface-variant leading-relaxed">
                <span className="font-medium text-primary flex items-start gap-1">
                  <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-secondary" />
                  <span>
                    {[
                      order.deliveryAddress?.houseNo,
                      order.deliveryAddress?.streetArea,
                      order.deliveryAddress?.line1,
                      order.deliveryAddress?.landmark,
                      order.deliveryAddress?.city,
                      order.deliveryAddress?.state,
                      order.deliveryAddress?.pincode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </span>
                {order.deliveryAddress?.coordinates?.latitude && (
                  <span className="text-[10px] font-mono text-on-surface-variant/70 block pl-4">
                    Coords: {order.deliveryAddress.coordinates.latitude.toFixed(4)}°N,{' '}
                    {order.deliveryAddress.coordinates.longitude.toFixed(4)}°E
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Order Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-variant bg-surface-container font-semibold text-primary text-[11px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Crop / Produce Item</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant/60">
                {(order.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-container/30">
                    <td className="py-2.5 px-3 text-on-surface-variant font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-primary">
                      {item.title || item.cropName}
                      {item.unit && <span className="text-on-surface-variant text-[10px] ml-1">({item.unit})</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {item.quantity} {item.unit || ''}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">₹{item.unitPrice}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-primary">
                      ₹{item.lineTotal || item.unitPrice * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="p-3.5 rounded-xl bg-surface-container/40 border border-surface-variant/60 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Logistics & Dispatch Information
              </span>
              <div className="flex justify-between py-0.5">
                <span className="text-on-surface-variant">Farm to Buyer Distance:</span>
                <span className="font-mono font-semibold text-primary">{distanceKm} km</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-on-surface-variant">Carrier Method:</span>
                <span className="font-medium">Direct Farm-Gate Aggregated Logistics</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-on-surface-variant">Fulfillment Status:</span>
                <span className="font-bold text-secondary">{order.status || 'PLACED'}</span>
              </div>
              {order.paymentProofUrl && (
                <div className="pt-2 border-t border-surface-variant/40 flex items-center justify-between">
                  <span className="text-on-surface-variant">Payment Screenshot:</span>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>View Proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-container/50 border border-surface-variant/80 font-medium">
              <div className="flex justify-between py-0.5">
                <span className="text-on-surface-variant">Produce Subtotal:</span>
                <span className="font-mono font-semibold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-on-surface-variant">
                  Delivery Freight ({distanceKm} km):
                </span>
                <span className="font-mono font-semibold">₹{deliveryFee}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-on-surface-variant">GST / Agricultural Tax (5%):</span>
                <span className="font-mono font-semibold">₹{tax}</span>
              </div>
              <div className="border-t border-surface-variant pt-2 mt-1 flex justify-between text-sm font-bold text-primary">
                <span>Grand Total Amount:</span>
                <span className="font-mono text-base">₹{total}</span>
              </div>
              <div className="border-t border-dashed border-surface-variant/80 pt-2 mt-1 flex flex-col gap-1">
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>40% Advance Payment (Paid):</span>
                  <span className="font-mono">₹{advanceAmount}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
                  <span>60% Remaining on Delivery:</span>
                  <span className="font-mono">₹{pendingAmount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Declarations */}
          <div className="pt-4 border-t border-surface-variant/70 text-[10px] text-on-surface-variant leading-relaxed flex flex-col gap-1">
            <p className="font-medium text-primary">Declaration & Terms:</p>
            <p>
              1. This electronic tax invoice is generated under KhetiSetu Direct Agricultural Market Guidelines.
            </p>
            <p>
              2. 40% advance payment has been pre-authorized to the designated farmer VPA account. Remaining 60%
              is payable upon farm produce delivery verification.
            </p>
            <p className="text-center pt-3 text-[10px] text-on-surface-variant font-mono">
              Thank you for supporting India's direct farm-to-fork agricultural ecosystem! • www.khetisetu.in
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;

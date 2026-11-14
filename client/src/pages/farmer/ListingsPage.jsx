import React, { useState, useEffect } from 'react';
import { PlusCircle, Store, Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Skeleton, EmptyState } from '../../components/ui/Skeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const ListingsPage = () => {
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Listing Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState(30);
  const [availableQuantity, setAvailableQuantity] = useState(200);
  const [minOrderQuantity, setMinOrderQuantity] = useState(2);
  const [isB2C, setIsB2C] = useState(true);
  const [isB2B, setIsB2B] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchListingsAndBatches = async () => {
    try {
      setLoading(true);
      const [listingsRes, batchesRes] = await Promise.all([
        apiClient.get('/marketplace/products?limit=50'),
        apiClient.get('/farmer/batches'),
      ]);
      setListings(listingsRes.data.data);
      setBatches(batchesRes.data.data);
      if (batchesRes.data.data.length > 0) {
        setSelectedBatchId(batchesRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListingsAndBatches();
  }, []);

  const handleUploadProductImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Please select a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image file must be under 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('productImage', file);

    try {
      setUploadingImage(true);
      setImageError(null);
      const res = await apiClient.post('/farmer/listings/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.data.imageUrl);
    } catch (err) {
      console.error('Failed to upload produce photo', err);
      setImageError(err.response?.data?.error?.message || 'Failed to upload produce image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await apiClient.post('/farmer/listings', {
        batchId: selectedBatchId,
        title,
        description,
        pricePerUnit: Number(pricePerUnit),
        availableQuantity: Number(availableQuantity),
        minOrderQuantity: Number(minOrderQuantity),
        isB2C,
        isB2B,
        imageUrl: imageUrl || undefined,
        images: imageUrl ? [imageUrl] : undefined,
      });

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setImageUrl('');
      setImageError(null);
      fetchListingsAndBatches();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to publish listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
            {t('listingsPage.directCommerce')}
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            {t('listingsPage.pageTitle')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('listingsPage.pageSubtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          disabled={batches.length === 0}
          className="flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('listingsPage.publishFromBatch')}</span>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-[24px]" count={3} />
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<Store className="w-8 h-8 text-secondary" />}
          title={t('listingsPage.noListingsTitle')}
          description={t('listingsPage.noListingsDesc')}
          action={
            <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
              {t('listingsPage.publishFirstListing')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between overflow-hidden">
              <div>
                <div className="h-44 -mx-6 -mt-6 mb-4 overflow-hidden relative">
                  <img
                    src={item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {item.isB2C && <Badge variant="primary">B2C</Badge>}
                    {item.isB2B && <Badge variant="warning">B2B</Badge>}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider font-label-md">
                    {item.category}
                  </span>
                  <Badge variant="success">{item.qualityGrade}</Badge>
                </div>

                <h3 className="font-display font-bold text-lg text-primary line-clamp-1 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">
                  {item.description}
                </p>

                <div className="flex items-baseline justify-between pt-2 border-t border-surface-variant/50">
                  <div>
                    <span className="text-xs text-on-surface-variant">{t('listingsPage.priceLabel')} </span>
                    <span className="font-display font-bold text-xl text-primary">
                      ₹{item.pricePerUnit}
                    </span>
                    <span className="text-xs text-on-surface-variant"> / {item.unit}</span>
                  </div>
                  <span className="text-xs font-medium text-on-surface">
                    {t('listingsPage.stockLabel')} {item.availableQuantity} {item.unit}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                <span>{t('listingsPage.moqLabel')} {item.minOrderQuantity} {item.unit}</span>
                <span className="font-semibold text-primary">{item.status}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Publish Listing Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('listingsPage.modalTitle')}
        subtitle={t('listingsPage.modalSubtitle')}
      >
        <form onSubmit={handleCreateListing} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-label-md">
              {t('listingsPage.selectBatch')}
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full bg-surface-container text-on-surface rounded-[12px] py-3 px-4 text-sm border-none focus:ring-1 focus:ring-primary"
            >
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batchId} — {b.cropName} ({b.availableQuantity} {b.unit} available)
                </option>
              ))}
            </select>
          </div>

          <Input
            label={t('listingsPage.listingTitle')}
            required
            placeholder={t('listingsPage.listingTitlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label={t('listingsPage.produceDesc')}
            placeholder={t('listingsPage.produceDescPlaceholder')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('listingsPage.pricePerUnit')}
              type="number"
              step="0.5"
              min="1"
              required
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
            />
            <Input
              label={t('listingsPage.availableStock')}
              type="number"
              min="1"
              required
              value={availableQuantity}
              onChange={(e) => setAvailableQuantity(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('listingsPage.moq')}
              type="number"
              min="1"
              required
              value={minOrderQuantity}
              onChange={(e) => setMinOrderQuantity(e.target.value)}
            />
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={isB2C}
                  onChange={(e) => setIsB2C(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                {t('listingsPage.retailB2C')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={isB2B}
                  onChange={(e) => setIsB2B(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                {t('listingsPage.bulkB2B')}
              </label>
            </div>
          </div>

          {/* Produce Photograph Upload */}
          <div className="flex flex-col gap-2 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-label-md flex items-center justify-between">
              <span>Produce Photo (Visible to Buyers)</span>
              {uploadingImage && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
            </label>

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-surface-variant bg-surface-container h-36 flex items-center justify-center">
                <img src={imageUrl} alt="Uploaded produce" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-surface-variant hover:border-primary/60 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-surface-container/30 hover:bg-surface-container/60 transition-colors">
                <Upload className="w-6 h-6 text-primary/60 mb-1" />
                <span className="text-xs font-semibold text-primary">Upload Produce Photograph</span>
                <span className="text-[10px] text-on-surface-variant mt-0.5">JPG, PNG, or WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUploadProductImage}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            )}

            {imageError && (
              <span className="text-[11px] text-error font-medium">{imageError}</span>
            )}
          </div>

          <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={uploadingImage} className="mt-4">
            {t('listingsPage.publishLiveBtn')}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default ListingsPage;

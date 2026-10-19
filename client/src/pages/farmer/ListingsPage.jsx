import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Skeleton, EmptyState } from '../../components/ui/Skeleton';

const ListingsPage = () => {
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
      });

      setIsModalOpen(false);
      setTitle('');
      setDescription('');
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
            Direct Commerce
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            Marketplace Produce Listings
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Publish harvest lots to B2C retail consumers and B2B wholesale buyers
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          disabled={batches.length === 0}
        >
          <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
          Publish Listing from Batch
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-[24px]" count={3} />
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon="storefront"
          title="No active marketplace listings"
          description="Select an available produce harvest batch to list on KhetiSetu's consumer and B2B marketplace."
          action={
            <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
              Publish First Listing
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
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'}
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
                    <span className="text-xs text-on-surface-variant">Price: </span>
                    <span className="font-display font-bold text-xl text-primary">
                      ₹{item.pricePerUnit}
                    </span>
                    <span className="text-xs text-on-surface-variant"> / {item.unit}</span>
                  </div>
                  <span className="text-xs font-medium text-on-surface">
                    Stock: {item.availableQuantity} {item.unit}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
                <span>MOQ: {item.minOrderQuantity} {item.unit}</span>
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
        title="Publish Marketplace Listing"
        subtitle="Link listing to a verified harvest batch for automatic provenance & stock tracking"
      >
        <form onSubmit={handleCreateListing} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-label-md">
              Select Produce Batch
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
            label="Listing Title"
            required
            placeholder="e.g. Farm Fresh Grade-A Hybrid Tomatoes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="Produce Description"
            placeholder="Describe harvest attributes, ripeness, packaging"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price per Unit (INR)"
              type="number"
              step="0.5"
              min="1"
              required
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
            />
            <Input
              label="Available Stock"
              type="number"
              min="1"
              required
              value={availableQuantity}
              onChange={(e) => setAvailableQuantity(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Order Qty (MOQ)"
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
                Retail B2C
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={isB2B}
                  onChange={(e) => setIsB2B(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                Bulk B2B
              </label>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={submitting} className="mt-4">
            Publish Live Listing
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default ListingsPage;

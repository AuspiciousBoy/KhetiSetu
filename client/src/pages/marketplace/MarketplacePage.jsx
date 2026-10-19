import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Skeleton, EmptyState } from '../../components/ui/Skeleton';

const MarketplacePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [isB2B, setIsB2B] = useState(searchParams.get('type') === 'b2b');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const categories = [
    { label: 'All Crops', value: '' },
    { label: 'Vegetables', value: 'VEGETABLE' },
    { label: 'Fruits', value: 'FRUIT' },
    { label: 'Grains & Cereals', value: 'GRAIN_CEREAL' },
    { label: 'Pulses', value: 'PULSE' },
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (isB2B) params.append('isB2B', 'true');
      else params.append('isB2C', 'true');
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiClient.get(`/marketplace/products?${params.toString()}`);
      setProducts(res.data.data);
    } catch (err) {
      console.error('Failed to load marketplace products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, isB2B, searchQuery]);

  return (
    <div className="flex flex-col gap-8 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-surface-variant">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
            Direct Farm-to-Market
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-primary mt-1">
            {isB2B ? 'B2B Wholesale Procurement' : 'Fresh Harvest Marketplace'}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {isB2B
              ? 'Procure full truckloads and commercial lots with verified APMC grade standards'
              : 'Direct from Maharashtra & Northern farms to your doorstep with batch traceability'}
          </p>
        </div>

        {/* B2C / B2B Segmented Pill Switcher */}
        <div className="flex items-center bg-surface-container rounded-full p-1 border border-surface-variant">
          <button
            onClick={() => {
              setIsB2B(false);
              setSearchParams({});
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              !isB2B
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface hover:text-primary'
            }`}
          >
            🛒 Retail B2C
          </button>
          <button
            onClick={() => {
              setIsB2B(true);
              setSearchParams({ type: 'b2b' });
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              isB2B
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface hover:text-primary'
            }`}
          >
            🏢 Wholesale B2B
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3.5 py-1.5 rounded-[12px] text-xs font-semibold transition-all ${
                selectedCategory === cat.value
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface border border-surface-variant'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="Search crop or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant/70 rounded-[12px] py-2 pl-9 pr-3 text-xs border border-transparent focus:border-primary focus:outline-none"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-on-surface-variant">
            search
          </span>
        </div>
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <Skeleton className="h-80 rounded-[24px]" count={6} />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="eco"
          title="No produce found"
          description="Try adjusting your category filter or search keywords."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between overflow-hidden hover:border-primary/50 transition-all duration-300 soil-shadow"
            >
              <div>
                {/* Image Banner with Badges */}
                <div className="h-52 -mx-6 -mt-6 mb-4 overflow-hidden relative">
                  <img
                    src={
                      item.images?.[0] ||
                      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'
                    }
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <Badge
                      variant={item.qualityGrade === 'GOOD_QUALITY' ? 'success' : 'default'}
                    >
                      {item.qualityGrade}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                  <span className="font-semibold text-secondary uppercase tracking-wider font-label-md">
                    {item.category}
                  </span>
                  <span>{item.location?.district}, {item.location?.state}</span>
                </div>

                <h3 className="font-display font-bold text-lg text-primary mb-1 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                  {item.description}
                </p>

                {/* Price and Stock row */}
                <div className="flex items-baseline justify-between pt-3 border-t border-surface-variant/60">
                  <div>
                    <span className="text-xs text-on-surface-variant">Price: </span>
                    <span className="font-display font-bold text-2xl text-primary">
                      ₹{item.pricePerUnit}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium"> / {item.unit}</span>
                  </div>
                  <span className="text-xs font-semibold text-on-surface">
                    Available: {item.availableQuantity} {item.unit}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-surface-variant/60 flex items-center justify-between gap-3">
                <span className="text-[11px] text-on-surface-variant font-medium">
                  Min order: {item.minOrderQuantity} {item.unit}
                </span>

                <Link to={`/marketplace/${item.id}`}>
                  <Button variant="primary" size="sm">
                    View Produce & Buy
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;

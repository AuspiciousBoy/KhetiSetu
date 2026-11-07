import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Camera, Check, Upload, CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ProgressRing from '../../components/ui/ProgressRing';
import { Skeleton, EmptyState } from '../../components/ui/Skeleton';

const BatchesPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Batch Modal State
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [cropName, setCropName] = useState('Tomato');
  const [quantity, setQuantity] = useState(500);
  const [unit, setUnit] = useState('kg');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submittingBatch, setSubmittingBatch] = useState(false);

  // AI Quality Modal State
  const [selectedBatchForAssessment, setSelectedBatchForAssessment] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [assessing, setAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/farmer/batches');
      setBatches(res.data.data);
    } catch (err) {
      console.error('Failed to load batches', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setSubmittingBatch(true);
    try {
      await apiClient.post('/farmer/batches', {
        cropName,
        quantity: Number(quantity),
        unit,
        harvestDate,
        notes,
      });
      setIsNewBatchOpen(false);
      setNotes('');
      fetchBatches();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create batch');
    } finally {
      setSubmittingBatch(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setAssessmentResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAssessment = async () => {
    if (!imageFile || !selectedBatchForAssessment) return;

    setAssessing(true);
    setAssessmentResult(null);

    const formData = new FormData();
    formData.append('produceImage', imageFile);

    try {
      const res = await apiClient.post(
        `/farmer/batches/${selectedBatchForAssessment._id}/quality-assess`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      setAssessmentResult(res.data.data.assessment);
      fetchBatches();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Quality assessment failed');
    } finally {
      setAssessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary font-label-md">
            Produce Provenance
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary mt-1">
            Harvest Batch Traceability
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Log, assess and trace farm produce from gate harvest to mandi sale
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsNewBatchOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Batch</span>
        </Button>
      </div>

      {/* Batch Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-[24px]" count={3} />
        </div>
      ) : batches.length === 0 ? (
        <EmptyState
          icon="inventory_2"
          title="No harvest batches recorded"
          description="Register your first produce harvest lot to unlock AI visual grading and direct marketplace listings."
          action={
            <Button variant="primary" size="md" onClick={() => setIsNewBatchOpen(true)}>
              Register Harvest
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <Card key={batch._id} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-primary tracking-wider">
                    {batch.batchId}
                  </span>
                  <Badge
                    variant={
                      batch.qualityGrade === 'GOOD_QUALITY'
                        ? 'success'
                        : batch.qualityGrade === 'APPROACHING_SHELF_LIFE'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {batch.qualityGrade.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <h3 className="font-display font-bold text-xl text-primary mb-1">
                  {batch.cropName}
                </h3>
                <p className="text-xs text-on-surface-variant mb-4">
                  Harvested on {new Date(batch.harvestDate).toLocaleDateString()} • {batch.originLocation.district}, {batch.originLocation.state}
                </p>

                <div className="bg-surface-container rounded-[16px] p-3.5 mb-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 block">
                      Stock Volume
                    </span>
                    <span className="font-semibold text-primary text-sm">
                      {batch.availableQuantity} / {batch.quantity} {batch.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 block">
                      Est. Shelf Life
                    </span>
                    <span className="font-semibold text-primary text-sm">
                      {batch.shelfLifeDays} Days
                    </span>
                  </div>
                </div>

                {batch.notes && (
                  <p className="text-xs text-on-surface-variant italic mb-4 line-clamp-2">
                    "{batch.notes}"
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-surface-variant/60 flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedBatchForAssessment(batch);
                    setImageFile(null);
                    setImagePreview(null);
                    setAssessmentResult(batch.qualityAssessmentId || null);
                  }}
                  className="w-full flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{batch.qualityGrade === 'PENDING_ASSESSMENT' ? 'Assess Quality' : 'View Assessment'}</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Batch Modal */}
      <Modal
        isOpen={isNewBatchOpen}
        onClose={() => setIsNewBatchOpen(false)}
        title="Register Harvest Batch"
        subtitle="Log farm-gate harvest details for quality tracking and commercial listing"
      >
        <form onSubmit={handleCreateBatch} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-label-md">
                Crop
              </label>
              <select
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-[12px] py-3 px-4 text-sm border-none focus:ring-1 focus:ring-primary"
              >
                <option value="Tomato">Tomato (टमाटर)</option>
                <option value="Onion">Onion (प्याज)</option>
                <option value="Potato">Potato (आलू)</option>
                <option value="Wheat">Wheat (गेहूं)</option>
                <option value="Rice">Rice (चावल)</option>
                <option value="Banana">Banana (केला)</option>
                <option value="Mango">Mango (आम)</option>
                <option value="Spinach">Spinach (पालक)</option>
              </select>
            </div>

            <Input
              label="Quantity"
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-label-md">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-surface-container text-on-surface rounded-[12px] py-3 px-4 text-sm border-none focus:ring-1 focus:ring-primary"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="quintal">quintal (100 kg)</option>
                <option value="ton">ton (1000 kg)</option>
                <option value="box">box / crate</option>
              </select>
            </div>

            <Input
              label="Harvest Date"
              type="date"
              required
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
            />
          </div>

          <Input
            label="Harvest Notes (Optional)"
            placeholder="e.g. Breaker stage, vine-ripened, organic compost nourished"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button type="submit" variant="primary" size="lg" loading={submittingBatch} className="mt-4">
            Create Batch Record
          </Button>
        </form>
      </Modal>

      {/* AI Quality Assessment Modal with Result Card */}
      <Modal
        isOpen={!!selectedBatchForAssessment}
        onClose={() => setSelectedBatchForAssessment(null)}
        title={`AI Quality Doctor • ${selectedBatchForAssessment?.cropName}`}
        subtitle={`Batch: ${selectedBatchForAssessment?.batchId}`}
        maxWidth="max-w-2xl"
      >
        <div className="flex flex-col gap-6">
          {/* Assessment Form if not assessed */}
          {!assessmentResult ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-surface-variant rounded-[20px] p-8 text-center bg-surface-container-low">
              {imagePreview ? (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={imagePreview}
                    alt="Uploaded harvest preview"
                    className="w-48 h-48 object-cover rounded-[16px] soil-shadow border border-surface-variant"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      loading={assessing}
                      onClick={handleRunAssessment}
                      className="flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Run Gemini Quality Assessment</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      Choose Different Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center text-primary">
                    <Camera className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      Upload produce harvest photo
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      JPG, PNG or WEBP (Max 5MB). Photo must clearly capture skin texture.
                    </p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <span className="inline-flex items-center justify-center bg-primary text-on-primary font-medium text-xs px-4 py-2 rounded-[12px] hover:bg-primary-container">
                      Select Image
                    </span>
                  </label>
                </div>
              )}
            </div>
          ) : (
            /* Structured Assessment Result Card directly conforming to prompt requirements */
            <div className="flex flex-col gap-5 bg-surface-container-low rounded-[24px] p-6 border border-surface-variant soil-shadow">
              <div className="flex items-center justify-between border-b border-surface-variant/60 pb-4">
                <div className="flex items-center gap-3">
                  <ProgressRing
                    progress={Math.round((assessmentResult.confidence || 0.9) * 100)}
                    size={64}
                    strokeWidth={6}
                  />
                  <div>
                    <Badge
                      variant={
                        assessmentResult.classification === 'GOOD_QUALITY'
                          ? 'success'
                          : assessmentResult.classification === 'APPROACHING_SHELF_LIFE'
                          ? 'warning'
                          : 'error'
                      }
                      className="text-xs"
                    >
                      {assessmentResult.classification.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium">
                      Confidence Level: {Math.round((assessmentResult.confidence || 0.9) * 100)}%
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-on-surface-variant">
                  {new Date(assessmentResult.assessedAt || Date.now()).toLocaleDateString()}
                </span>
              </div>

              {/* Observations list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary font-label-md mb-2">
                  Key Pathology Observations
                </h4>
                <ul className="flex flex-col gap-2">
                  {assessmentResult.observations?.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-on-surface leading-relaxed">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Shelf Life & Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-surface rounded-[12px] border border-surface-variant">
                  <span className="text-[10px] uppercase font-bold text-secondary block">
                    Estimated Shelf-Life
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {assessmentResult.estimatedShelfLife}
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-[12px] border border-surface-variant">
                  <span className="text-[10px] uppercase font-bold text-secondary block">
                    Recommended Action
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {assessmentResult.recommendedAction}
                  </span>
                </div>
              </div>

              {/* Strict Food-Safety Legal Disclaimer as required by prompt */}
              <div className="p-3.5 rounded-[12px] bg-surface-container border border-outline-variant/30 text-[11px] text-on-surface-variant leading-relaxed">
                <span className="font-semibold text-primary block mb-0.5">
                  ⚠️ AI Visual Analysis Notice:
                </span>
                This assessment is an AI-assisted visual estimate based on surface morphology. It is NOT laboratory food-safety certification or chemical residue testing.
              </div>

              {/* Action to upload new photo and re-run */}
              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAssessmentResult(null);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload New Photo & Re-Assess</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BatchesPage;

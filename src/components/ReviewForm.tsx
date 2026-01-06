import { useState } from 'react';
import { Star, Send, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSpecialVisits } from '@/hooks/useGoogleSheets';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWUdWcAWMrQznpib9F5lVjJQW0Fbh6We4kwDVVO27F4WBFCoIXiG1BzYbF-QSjPWI/exec';

interface ReviewFormData {
  name: string;
  rating: number;
  comment: string;
  special_visits_category: string;
}

const ReviewForm = () => {
  const { data: specialVisits, loading: visitsLoading } = useSpecialVisits();
  const [formData, setFormData] = useState<ReviewFormData>({
    name: '',
    rating: 5,
    comment: '',
    special_visits_category: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [showThankYou, setShowThankYou] = useState(false);

  const triggerConfetti = () => {
    // Fire confetti from both sides
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.6 }
    });
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.6 }
    });
    // Center burst
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { x: 0.5, y: 0.5 }
      });
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!formData.comment.trim()) {
      toast.error('Please enter your review');
      return;
    }
    if (!formData.special_visits_category) {
      toast.error('Please select a destination');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        body: JSON.stringify({ ...formData, type: 'review' }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      // no-cors doesn't give us response status, assume success
      setShowThankYou(true);
      triggerConfetti();
      setFormData({
        name: '',
        rating: 5,
        comment: '',
        special_visits_category: '',
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseThankYou = () => {
    setShowThankYou(false);
  };

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, i) => {
      const starValue = i + 1;
      const isFilled = starValue <= (hoveredStar || formData.rating);
      
      return (
        <button
          key={i}
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, rating: starValue }))}
          onMouseEnter={() => setHoveredStar(starValue)}
          onMouseLeave={() => setHoveredStar(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={`transition-colors ${
              isFilled 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-muted-foreground hover:text-yellow-400/50'
            }`}
          />
        </button>
      );
    });
  };

  return (
    <section id="submit-review" className="py-24 px-4 bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
            Share Your Experience
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Write a <span className="text-primary">Review</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Help other travelers by sharing your experience in Sri Lanka
          </p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-8 md:p-10 shadow-xl">
          {/* Name */}
          <div className="mb-6">
            <label htmlFor="reviewer-name" className="block text-sm font-medium text-foreground mb-2">
              Your Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="reviewer-name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-background"
              required
            />
          </div>

          {/* Destination */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Destination Visited <span className="text-destructive">*</span>
            </label>
            <Select
              value={formData.special_visits_category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, special_visits_category: value }))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={visitsLoading ? "Loading destinations..." : "Select destination"} />
              </SelectTrigger>
              <SelectContent>
                {specialVisits.map((visit) => (
                  <SelectItem key={visit.name} value={visit.name}>
                    {visit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Your Rating <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              {renderStars()}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-8">
            <label htmlFor="review-comment" className="block text-sm font-medium text-foreground mb-2">
              Your Review <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="review-comment"
              placeholder="Share your experience... What did you love about your visit?"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              className="bg-background min-h-[120px] resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Submit Review
              </>
            )}
          </Button>
        </form>

        {/* Thank You Dialog */}
        <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
          <DialogContent className="sm:max-w-md text-center">
            <div className="flex flex-col items-center py-6">
              <div className="relative mb-6">
                <PartyPopper className="w-20 h-20 text-yellow-400" />
                <div className="absolute -top-2 -right-2">
                  <span className="text-3xl">🎉</span>
                </div>
                <div className="absolute -top-2 -left-2">
                  <span className="text-3xl">🎊</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Thank You!
              </h3>
              <p className="text-muted-foreground text-lg mb-6">
                Thanks for Giving Review for Us.
              </p>
              <Button 
                onClick={handleCloseThankYou}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default ReviewForm;

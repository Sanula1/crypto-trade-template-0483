import { useReviews } from '@/hooks/useGoogleSheets';
import { Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ReviewsPage = () => {
  const { data: reviews, loading } = useReviews();

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        size={18} 
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'} 
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-24 px-4 bg-primary/5">
        <div className="max-w-7xl mx-auto">
          {/* Back Link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>

          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              All Testimonials
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              What Travelers <span className="text-secondary">Say</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Read all the experiences shared by our guests about their unforgettable journeys in Sri Lanka
            </p>
          </div>

          {/* Reviews Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-24 mb-4" />
                  <div className="h-20 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, index) => (
                <article 
                  key={index}
                  className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {renderStars(review.rating)}
                  </div>

                  {/* Comment */}
                  <blockquote className="text-foreground mb-6 leading-relaxed">
                    "{review.comment}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="font-bold text-foreground">
                        {review.name}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Visited: {review.special_visits_category}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {review.date}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ReviewsPage;

import { useSpecialVisits } from '@/hooks/useGoogleSheets';
import { MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Destinations = () => {
  const { data: visits, loading } = useSpecialVisits();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-32 pb-24 px-4 bg-background pattern-lotus">
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
              All Destinations
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Special <span className="text-secondary">Visits</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover all the enchanting destinations that showcase the rich cultural heritage and natural beauty of Sri Lanka
            </p>
          </div>

          {/* Visits Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-64 bg-muted" />
                  <div className="p-6">
                    <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                    <div className="h-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : visits.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visits.map((visit, index) => (
                <article 
                  key={index}
                  className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={visit.cover_image || 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=600&q=80'}
                      alt={visit.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Floating badge */}
                    <div className="absolute top-4 right-4 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                      Must Visit
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-accent mb-2">
                      <MapPin size={16} />
                      <span className="text-sm font-medium">{visit.sub_heading}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {visit.name}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {visit.description}
                    </p>

                    {/* View More Link */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <button className="text-primary font-medium text-sm hover:text-primary/80 transition-colors flex items-center gap-1">
                        Explore More
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>No destinations available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Destinations;

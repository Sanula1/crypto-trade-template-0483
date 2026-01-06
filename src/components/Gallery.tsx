import { useGallery, useOtherContent } from '@/hooks/useGoogleSheets';
import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

const Gallery = () => {
  const { data: images, loading } = useGallery();
  const { data: otherContent } = useOtherContent();
  const [selectedImage, setSelectedImage] = useState<{ name: string; image_url: string } | null>(null);
  const isMobile = useIsMobile();

  // Get max items from sheet, default to 4 mobile, 8 desktop
  const mobileMax = parseInt(otherContent['in_mobile_max_gallery'] || '4');
  const desktopMax = parseInt(otherContent['in_desktop_max_gallery'] || '8');
  const maxItems = isMobile ? mobileMax : desktopMax;

  const displayedImages = images.slice(0, maxItems);
  const hasMore = images.length > maxItems;

  return (
    <section id="gallery" className="py-24 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Gallery
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Capture the <span className="text-secondary">Beauty</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A visual journey through the breathtaking landscapes and cultural treasures of Sri Lanka
          </p>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div 
                key={i} 
                className={`bg-muted rounded-2xl animate-pulse ${
                  i === 1 || i === 6 ? 'md:col-span-2 md:row-span-2 h-64 md:h-auto' : 'h-48'
                }`}
              />
            ))}
          </div>
        ) : displayedImages.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
              {displayedImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={`relative overflow-hidden rounded-2xl group cursor-pointer ${
                    index === 0 || index === 5 ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                >
                  <img 
                    src={image.image_url || 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=400&q=80'}
                    alt={image.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-primary-foreground font-medium">{image.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* See More Button */}
            {hasMore && (
              <div className="text-center mt-12">
                <Link 
                  to="/gallery"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
                >
                  View Full Gallery
                  <ChevronRight size={20} />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p>Gallery coming soon!</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-foreground/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-primary-foreground hover:text-secondary transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          
          <div className="max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedImage.image_url}
              alt={selectedImage.name}
              className="w-full h-full object-contain"
            />
            <div className="bg-card p-4">
              <p className="text-foreground font-medium text-center">{selectedImage.name}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;

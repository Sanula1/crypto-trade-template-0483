import { useOtherContent } from '@/hooks/useGoogleSheets';
import { ChevronDown } from 'lucide-react';

const Hero = () => {
  const { data: content, loading } = useOtherContent();

  const title = content['hero_title'] || 'Discover Sri Lanka';
  const subtitle = content['hero_subtitle'] || 'The Pearl of the Indian Ocean';
  const description = content['hero_description'] || 'Experience ancient temples, pristine beaches, lush tea plantations, and warm hospitality';
  const heroBackgroundImage = content['hero_background_image'] || 'https://images.unsplash.com/photo-1586523969764-f4e2b6bc92e6?auto=format&fit=crop&w=1920&q=80';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${heroBackgroundImage}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-background" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 border-2 border-secondary/30 rounded-full animate-float opacity-50" />
      <div className="absolute bottom-40 right-20 w-24 h-24 border border-secondary/20 rotate-45 animate-float opacity-30" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-secondary/20 backdrop-blur-sm rounded-full text-secondary text-sm font-medium tracking-wider uppercase">
            Welcome to Paradise
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-primary-foreground mb-6 leading-tight">
          {loading ? (
            <span className="animate-shimmer inline-block w-96 h-20 bg-muted rounded" />
          ) : (
            <>
              {title.split(' ')[0]}{' '}
              <span className="text-secondary">{title.split(' ').slice(1).join(' ')}</span>
            </>
          )}
        </h1>

        <p className="text-xl md:text-2xl text-primary-foreground/90 mb-4 font-light">
          {subtitle}
        </p>

        <p className="text-lg text-primary-foreground/70 mb-12 max-w-2xl mx-auto">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="#special-visits" 
            className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-lg"
          >
            Explore Destinations
          </a>
          <a 
            href="#contact" 
            className="px-8 py-4 bg-secondary/20 backdrop-blur-sm text-primary-foreground border border-secondary/50 rounded-full font-medium hover:bg-secondary/30 transition-all"
          >
            Plan Your Journey
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <a 
        href="#special-visits" 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-primary-foreground/60 hover:text-primary-foreground transition-colors animate-bounce"
      >
        <ChevronDown size={32} />
      </a>
    </section>
  );
};

export default Hero;

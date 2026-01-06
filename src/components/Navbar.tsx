import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useOtherContent } from '@/hooks/useGoogleSheets';

const Navbar = () => {
  const { data: content } = useOtherContent();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const siteName = content['site_name'] || 'Sri Lanka Travels';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'Destinations', href: '#special-visits' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/95 backdrop-blur-md shadow-lg py-3' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center`}>
            <span className="text-primary-foreground font-bold text-lg">🪷</span>
          </div>
          <span className={`font-bold text-xl transition-colors ${
            isScrolled ? 'text-foreground' : 'text-primary-foreground'
          }`}>
            {siteName}
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link.name}
              href={link.href}
              className={`font-medium transition-colors hover:text-secondary ${
                isScrolled ? 'text-foreground' : 'text-primary-foreground'
              }`}
            >
              {link.name}
            </a>
          ))}
          <a 
            href="#contact"
            className="px-5 py-2 bg-secondary text-secondary-foreground rounded-full font-medium hover:bg-secondary/90 transition-all hover:scale-105"
          >
            Book Now
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className={isScrolled ? 'text-foreground' : 'text-primary-foreground'} size={28} />
          ) : (
            <Menu className={isScrolled ? 'text-foreground' : 'text-primary-foreground'} size={28} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background shadow-lg border-t border-border">
          <div className="flex flex-col p-4 gap-4">
            {navLinks.map(link => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-foreground font-medium py-2 hover:text-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
            <a 
              href="#contact"
              onClick={() => setIsMenuOpen(false)}
              className="px-5 py-3 bg-secondary text-secondary-foreground rounded-full font-medium text-center hover:bg-secondary/90 transition-all"
            >
              Book Now
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

import { useOtherContent } from '@/hooks/useGoogleSheets';
import { Facebook, Instagram, Twitter, Youtube, Heart } from 'lucide-react';

const Footer = () => {
  const { data: content } = useOtherContent();
  
  const siteName = content['site_name'] || 'Sri Lanka Travels';
  const footerText = content['footer_text'] || 'Discover the magic of the Pearl of the Indian Ocean';

  return (
    <footer className="bg-foreground text-primary-foreground py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg">🪷</span>
              </div>
              <span className="font-bold text-xl">{siteName}</span>
            </div>
            <p className="text-primary-foreground/70 mb-6 max-w-md">
              {footerText}
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">Home</a></li>
              <li><a href="#special-visits" className="text-primary-foreground/70 hover:text-secondary transition-colors">Destinations</a></li>
              <li><a href="#gallery" className="text-primary-foreground/70 hover:text-secondary transition-colors">Gallery</a></li>
              <li><a href="#reviews" className="text-primary-foreground/70 hover:text-secondary transition-colors">Reviews</a></li>
              <li><a href="#contact" className="text-primary-foreground/70 hover:text-secondary transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Popular Destinations */}
          <div>
            <h4 className="font-bold text-lg mb-4">Popular Places</h4>
            <ul className="space-y-3">
              <li><span className="text-primary-foreground/70">Sigiriya</span></li>
              <li><span className="text-primary-foreground/70">Kandy</span></li>
              <li><span className="text-primary-foreground/70">Galle</span></li>
              <li><span className="text-primary-foreground/70">Ella</span></li>
              <li><span className="text-primary-foreground/70">Mirissa</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p className="text-primary-foreground/60 text-sm flex items-center gap-1">
            Made with <Heart size={14} className="text-secondary fill-secondary" /> for Sri Lanka
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

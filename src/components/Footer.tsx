import { useOtherContent } from '@/hooks/useGoogleSheets';
import { Facebook, Instagram, Heart } from 'lucide-react';

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
              <a 
                href="https://www.facebook.com/share/1A8BsBr6tc/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-[#1877F2] transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://www.instagram.com/travel.lakshitha?igsh=eWN6MTBsNzd1a3J6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://www.tiktok.com/@kalumprasad1500?_r=1&_t=ZS-92pzsVataFw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-black transition-colors"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
            
            {/* Contact Info */}
            <div className="mt-6 space-y-2">
              <a 
                href="tel:+94766776015" 
                className="flex items-center gap-2 text-primary-foreground/70 hover:text-secondary transition-colors text-sm"
              >
                📞 +94 76 677 6015
              </a>
              <a 
                href="mailto:Kalumprasad1500@gmail.com" 
                className="flex items-center gap-2 text-primary-foreground/70 hover:text-secondary transition-colors text-sm"
              >
                ✉️ Kalumprasad1500@gmail.com
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

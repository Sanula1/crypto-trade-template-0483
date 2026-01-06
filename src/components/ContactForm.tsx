import { useState } from 'react';
import { useOtherContent } from '@/hooks/useGoogleSheets';
import { Send, Phone, Mail, MapPin, Loader2, Sparkles, Heart, Plane } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import confetti from 'canvas-confetti';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email").max(255, "Email must be less than 255 characters"),
  phone_number: z.string().trim().min(1, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
});

const ContactForm = () => {
  const { data: content } = useOtherContent();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showThankYou, setShowThankYou] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    message: '',
  });

  const triggerConfetti = () => {
    // Star-shaped confetti burst
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.5,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star'],
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
    };

    confetti({
      ...defaults,
      particleCount: 50,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.3 }
    });

    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 30,
        scalar: 0.75,
        origin: { x: 0.3, y: 0.5 }
      });
    }, 150);

    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 30,
        scalar: 0.75,
        origin: { x: 0.7, y: 0.5 }
      });
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form data
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Submit to Google Sheets via Google Apps Script web app (type=contact_us is default)
      const scriptUrl = "https://script.google.com/macros/s/AKfycbyRU-Smg1m5dsJXS6EPDsKYylIXHlGsoK9342zzZQCzeZywWymxaDkyx-EGt0R6DSM/exec";

      // Send data to Google Apps Script
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone_number,
          message: formData.message,
        }),
      });

      setShowThankYou(true);
      triggerConfetti();
      setFormData({ name: '', email: '', phone_number: '', message: '' });
    } catch (error) {
      toast({
        title: "Oops!",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 px-4 bg-primary/5 pattern-lotus">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Get In Touch
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Plan Your <span className="text-secondary">Adventure</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ready to explore Sri Lanka? Contact us to start planning your unforgettable journey
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-foreground mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Phone</p>
                    <a href="tel:+94766776015" className="text-muted-foreground hover:text-primary transition-colors">
                      +94 76 677 6015
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <a href="mailto:Kalumprasad1500@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                      Kalumprasad1500@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Location</p>
                    <p className="text-muted-foreground">{content['contact_address'] || 'Colombo, Sri Lanka'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative element */}
            <div className="hidden lg:block relative h-48 rounded-2xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1580892037498-cfafa83ed50b?auto=format&fit=crop&w=600&q=80"
                alt="Sri Lanka landscape"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-lg space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all ${
                      errors.name ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="John Doe"
                    maxLength={100}
                  />
                  {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all ${
                      errors.email ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder="john@example.com"
                    maxLength={255}
                  />
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all ${
                    errors.phone_number ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="+94 77 123 4567"
                  maxLength={20}
                />
                {errors.phone_number && <p className="text-destructive text-sm mt-1">{errors.phone_number}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className={`w-full px-4 py-3 bg-background border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all resize-none ${
                    errors.message ? 'border-destructive' : 'border-border'
                  }`}
                  placeholder="Tell us about your dream trip to Sri Lanka..."
                  maxLength={1000}
                />
                {errors.message && <p className="text-destructive text-sm mt-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Thank You Dialog */}
        <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
          <DialogContent className="sm:max-w-md text-center">
            <div className="flex flex-col items-center py-6">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plane className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="absolute -bottom-1 -left-1">
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Thank You!
              </h3>
              <p className="text-muted-foreground text-lg mb-6">
                Thank you for Contact Us.
              </p>
              <Button 
                onClick={() => setShowThankYou(false)}
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

export default ContactForm;
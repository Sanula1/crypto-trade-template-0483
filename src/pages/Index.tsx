import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import SpecialVisits from '@/components/SpecialVisits';
import Reviews from '@/components/Reviews';
import ReviewForm from '@/components/ReviewForm';
import Gallery from '@/components/Gallery';
import ContactForm from '@/components/ContactForm';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <SpecialVisits />
      <Gallery />
      <Reviews />
      <ReviewForm />
      <ContactForm />
      <Footer />
    </div>
  );
};

export default Index;

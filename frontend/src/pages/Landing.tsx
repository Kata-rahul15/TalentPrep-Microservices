import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/sections/Hero'
import JobSearchSection from '@/components/sections/JobSearchSection'
import AIAgentSection from '@/components/sections/AIAgentSection'
import HowItWorks from '@/components/sections/HowItWorks'
import FAQ from '@/components/sections/FAQ'
import CTA from '@/components/sections/CTA'
import Footer from '@/components/layout/Footer'
import OAuthCallback from '@/pages/OAuthCallback'

export default function Landing() {
  const isOAuthReturn =
    typeof window !== 'undefined' &&
    (window.location.search.includes('code=') ||
      window.location.search.includes('oauth=success') ||
      (sessionStorage.getItem('oauth_pending') === 'true' &&
        (window.location.search.includes('oauth') || window.location.search.includes('state='))))

  if (isOAuthReturn) {
    return <OAuthCallback />
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Sticky Top Navigation Bar */}
      <Navbar />

      {/* Main Landing Page Sections */}
      <main>
        {/* 1. Hero Section */}
        <Hero />

        {/* 2. AI Job Search Section */}
        <JobSearchSection />

        {/* 3. AI Career Agent Section */}
        <AIAgentSection />

        {/* 4. How It Works Section */}
        <HowItWorks />

        {/* 5. Frequently Asked Questions */}
        <FAQ />

        {/* 6. Final Call to Action */}
        <CTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}


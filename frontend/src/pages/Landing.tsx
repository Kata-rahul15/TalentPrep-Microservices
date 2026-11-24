import Navbar from '@/components/layout/Navbar'
import Hero from '@/components/sections/Hero'
import ThreeFeaturesSection from '@/components/sections/ThreeFeaturesSection'
import HowItWorks from '@/components/sections/HowItWorks'
import FAQ from '@/components/sections/FAQ'
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
    <div className="min-h-screen bg-[#FAF8F3] dark:bg-[#080908] text-[#080908] dark:text-[#FAF8F3] antialiased selection:bg-[#CDF22B] selection:text-[#080908]">
      {/* 1. Minimal Top Navbar */}
      <Navbar />

      {/* Main Landing Sections */}
      <main>
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Three Main Features */}
        <ThreeFeaturesSection />

        {/* 4. How It Works Workflow */}
        <HowItWorks />

        {/* 5. Frequently Asked Questions */}
        <FAQ />
      </main>

      {/* 6. Minimal Footer */}
      <Footer />
    </div>
  )
}

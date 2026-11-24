import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Compass, ArrowLeft, Home, LayoutDashboard, Search } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuthenticatedNavbar from '@/components/layout/AuthenticatedNavbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/services/authService'

export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      {user ? <AuthenticatedNavbar /> : <Navbar />}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="space-y-6 max-w-lg"
        >
          {/* Subtle Graphic */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-xs border border-primary/20">
              <Compass className="w-12 h-12 animate-pulse text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary-bg border border-border flex items-center justify-center text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
          </div>

          {/* Large 404 Typography */}
          <div>
            <h1 className="font-heading font-black text-7xl sm:text-8xl lg:text-9xl text-primary tracking-tight leading-none">
              404
            </h1>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mt-2">
              Page Not Found
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              We couldn't find the page you're looking for. It might have been renamed, moved, or doesn't exist.
            </p>
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/home')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home</span>
              </button>
            )}

            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-card border border-border text-foreground hover:bg-secondary-bg font-semibold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}

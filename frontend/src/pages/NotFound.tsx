import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AuthenticatedNavbar from '@/components/layout/AuthenticatedNavbar'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/services/authService'

export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3] dark:bg-[#080908] text-[#080908] dark:text-[#FAF8F3] transition-colors">
      {user ? <AuthenticatedNavbar /> : <Navbar />}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center">
        <div className="space-y-6 max-w-md">
          {/* Large 404 Typography */}
          <div>
            <span className="font-mono font-bold text-7xl sm:text-8xl text-[#080908] dark:text-[#FAF8F3] tracking-tighter leading-none tabular-nums">
              404
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#080908] dark:text-[#FAF8F3] mt-3">
              Page not found
            </h1>
            <p className="text-xs sm:text-sm text-[#2C2E2B] dark:text-[#E2DFD7] mt-2 leading-relaxed">
              The requested page could not be located. It may have moved or the route is unavailable.
            </p>
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Go to home</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to home</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFFFFF] dark:bg-[#121311] border border-[#E5E0D5] dark:border-[#232621] text-[#080908] dark:text-[#FAF8F3] hover:bg-[#F2EFE9] dark:hover:bg-[#1A1C18] font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go back</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

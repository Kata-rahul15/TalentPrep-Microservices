import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CTA() {
  return (
    <section id="cta" className="py-16 sm:py-24 bg-background relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl bg-slate-950 dark:bg-slate-900 border border-slate-800 text-white p-8 sm:p-12 md:p-16 text-center overflow-hidden shadow-2xl">
          
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-[-25%] left-[-10%] w-80 h-80 bg-primary/20 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-25%] right-[-10%] w-80 h-80 bg-blue-500/15 rounded-full filter blur-3xl pointer-events-none" />

          {/* Sparkles Badge */}
          <div className="mx-auto w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-6 backdrop-blur-md shadow-inner">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>

          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight mb-4 leading-tight">
            Ready to Accelerate Your Career with AI?
          </h2>
          
          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Discover relevant job opportunities matched to your real experience and collaborate with your dedicated AI Career Agent today.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5">
            <Link
              to="/signup"
              id="cta-get-started-btn"
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base rounded-xl shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link
              to="/login"
              id="cta-signin-btn"
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm sm:text-base rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              Sign In to Your Workspace
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Free to get started · Instant resume parsing · No credit card required</span>
          </div>

        </div>
      </div>
    </section>
  )
}

import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CTA() {
  return (
    <section id="cta" className="py-16 sm:py-24 bg-[#FAF8F3] dark:bg-[#080908] border-t border-[#E5E0D5] dark:border-[#232621]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#080908] border border-[#232621] text-[#FAF8F3] p-8 sm:p-12 md:p-14 text-center shadow-md">
          
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#181A16] border border-[#282B24] text-[#CDF22B] text-xs font-mono mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CDF22B]" />
            Career Intelligence Platform
          </div>

          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight mb-4 leading-tight text-[#FAF8F3]">
            Start preparing for your next engineering milestone
          </h2>
          
          <p className="text-[#E2DFD7] text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Run realistic multi-round mock interviews, optimize your resume against actual ATS filters, and surface jobs calibrated to your skillset.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              to="/signup"
              id="cta-get-started-btn"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#CDF22B] hover:bg-[#BCE01E] text-[#080908] font-bold text-sm sm:text-base rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <span>Get started free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            
            <Link
              to="/login"
              id="cta-signin-btn"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#181A16] hover:bg-[#20221E] border border-[#282B24] text-[#FAF8F3] font-semibold text-sm sm:text-base rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              Sign in to workspace
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#BDB9AF]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#CDF22B]" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#CDF22B]" />
              Instant resume parsing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#CDF22B]" />
              4 interview formats
            </span>
          </div>

        </div>
      </div>
    </section>
  )
}

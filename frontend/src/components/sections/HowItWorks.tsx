import {
  FileText,
  Search,
  Video,
} from 'lucide-react'

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Upload Your Resume',
      description:
        'Upload your resume and let TalentPrep understand your skills, experience, and projects.',
      icon: FileText,
      detail: 'PDF or DOCX parsed into verified technical skills and ATS benchmarks.',
    },
    {
      number: '02',
      title: 'Discover Your Opportunities',
      description:
        'Get resume insights and explore job opportunities that match your profile.',
      icon: Search,
      detail: 'Live technical openings ranked transparently by your experience leverage.',
    },
    {
      number: '03',
      title: 'Prepare and Practice',
      description:
        'Practice interviews, improve your answers, and get ready for your next opportunity.',
      icon: Video,
      detail: 'Multi-round simulations with real-time feedback and structured scoring.',
    },
  ]

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-[#FAF8F3] dark:bg-[#080908] border-t border-[#E5E0D5] dark:border-[#232621] scroll-mt-20"
      aria-label="How TalentPrep Works"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#080908] dark:text-[#FAF8F3] tracking-tight leading-[1.12]">
            From Resume to Ready.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
            Three simple steps to take control of your career journey.
          </p>
        </div>

        {/* Connected Steps Grid: Horizontal on Desktop, Vertical on Mobile */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* Subtle Desktop Connector Line */}
          <div
            className="hidden md:block absolute top-[45px] left-[16%] right-[16%] h-[2px] bg-[#E5E0D5] dark:bg-[#232621] z-0"
            aria-hidden="true"
          />

          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="relative z-10 flex flex-col justify-between rounded-xl border border-[#080908]/12 dark:border-[#232621] bg-[#FFFFFF] dark:bg-[#121311] p-6 sm:p-7 shadow-xs hover:border-[#080908]/30 dark:hover:border-[#CDF22B]/40 transition-colors"
              >
                <div className="space-y-4">
                  {/* Step Header: Icon & Number Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[#080908] text-[#CDF22B] flex items-center justify-center font-bold shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono font-bold text-sm text-[#080908] dark:text-[#CDF22B] bg-[#FAF8F3] dark:bg-[#181A16] px-2.5 py-1 rounded-md border border-[#E5E0D5] dark:border-[#232621]">
                      STEP {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-[#080908] dark:text-[#FAF8F3]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#2C2E2B] dark:text-[#E2DFD7] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Micro Detail Pill */}
                <div className="mt-6 pt-4 border-t border-[#E5E0D5] dark:border-[#232621]">
                  <p className="text-[11px] text-[#383B36] dark:text-[#BDB9AF] leading-snug">
                    {step.detail}
                  </p>
                </div>
              </div>
            )
          })}

        </div>

      </div>
    </section>
  )
}

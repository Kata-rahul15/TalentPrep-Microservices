import { motion } from 'framer-motion'

const companies = [
  { name: 'Google', wordmark: 'Google' },
  { name: 'Microsoft', wordmark: 'Microsoft' },
  { name: 'Amazon', wordmark: 'Amazon' },
  { name: 'Meta', wordmark: 'Meta' },
]

export default function TrustedCompanies() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="mt-10 pt-8 border-t border-border"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-5">
        Trusted by top professionals at
      </p>
      <div className="flex items-center gap-8 flex-wrap">
        {companies.map((company, idx) => (
          <span
            key={company.name}
            className="font-heading font-bold text-[1.1rem] text-muted-foreground/60 hover:text-foreground transition-colors duration-300 cursor-default select-none"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {company.wordmark}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

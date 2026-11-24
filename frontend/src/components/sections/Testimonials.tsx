import { Star } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Frontend Architect at Vercel',
      review: "The AI tech simulations were incredibly close to my actual interviews. The instant code complexity critiques and speech pacing suggestions helped me land my dream role.",
      rating: 5,
      avatar: 'SJ',
      avatarClass: 'bg-primary/15 text-primary border border-primary/10',
    },
    {
      name: 'David Chen',
      role: 'Staff Engineer at Stripe',
      review: "I hadn't interviewed in 6 years and had severe anxiety. The behavioral training with targeted follow-up prompts was exactly what I needed to re-learn how to structure my answers using STAR.",
      rating: 5,
      avatar: 'DC',
      avatarClass: 'bg-success/15 text-success border border-success/10',
    },
    {
      name: 'Elena Rostova',
      role: 'Technical Product Manager at Amazon',
      review: "The diversity of mock questions was surprising. I practiced HR negotiations, technical system designs, and product roadmap scenarios. It is basically like having a personal coach 24/7.",
      rating: 5,
      avatar: 'ER',
      avatarClass: 'bg-warning/15 text-warning border border-warning/10',
    },
  ]

  return (
    <section id="testimonials" className="py-20 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Success Stories</p>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            Loved by Successful Candidates
          </h2>
          <p className="text-secondary-foreground text-base sm:text-lg">
            See how job seekers are mastering their interviews and securing positions at top-tier companies.
          </p>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-secondary-bg/30 rounded-3xl border border-border p-8 flex flex-col gap-6 relative"
            >
              {/* Rating Stars */}
              <div className="flex gap-1">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-muted-foreground text-sm leading-relaxed italic flex-1">
                "{t.review}"
              </p>

              {/* Profile Block */}
              <div className="flex items-center gap-3.5 border-t border-border pt-4">
                <div className={`w-11 h-11 rounded-full ${t.avatarClass} font-heading font-extrabold text-sm flex items-center justify-center shadow-sm`}>
                  {t.avatar}
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-foreground leading-tight">
                    {t.name}
                  </h4>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    {t.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

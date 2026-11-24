import type { PersonalInfo } from '../../types/builder.types'
import { User, Mail, Phone, MapPin, Globe, Briefcase } from 'lucide-react'
import { LinkedinIcon, GithubIcon } from './ResumeIcons'

interface Props {
  data: PersonalInfo
  onChange: (data: PersonalInfo) => void
}

export default function PersonalInfoEditor({ data, onChange }: Props) {
  const updateField = (field: keyof PersonalInfo, value: string) => {
    onChange({ ...data, [field]: value })
  }

  const inputClass =
    'w-full pl-8 pr-3 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:border-[#080908] text-foreground'

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading font-bold text-sm text-foreground">
          Personal & Contact Information
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Provide your core identity and contact channels so recruiters can reach you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Full Name <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <User className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="e.g. Alex Morgan"
              className={inputClass}
            />
          </div>
        </div>

        {/* Job Title / Headline */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Professional Title / Headline
          </label>
          <div className="relative">
            <Briefcase className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={data.jobTitle}
              onChange={(e) => updateField('jobTitle', e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className={inputClass}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Email Address <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="e.g. alex.morgan@example.com"
              className={inputClass}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="e.g. +1 (555) 234-5678"
              className={inputClass}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Location
          </label>
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={data.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className={inputClass}
            />
          </div>
        </div>

        {/* Website / Portfolio */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Website / Portfolio
          </label>
          <div className="relative">
            <Globe className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={data.portfolio}
              onChange={(e) => updateField('portfolio', e.target.value)}
              placeholder="e.g. https://alexmorgan.dev"
              className={inputClass}
            />
          </div>
        </div>

        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            LinkedIn Profile
          </label>
          <div className="relative">
            <LinkedinIcon className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={data.linkedin}
              onChange={(e) => updateField('linkedin', e.target.value)}
              placeholder="e.g. linkedin.com/in/alexmorgan"
              className={inputClass}
            />
          </div>
        </div>

        {/* GitHub */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            GitHub Profile
          </label>
          <div className="relative">
            <GithubIcon className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={data.github}
              onChange={(e) => updateField('github', e.target.value)}
              placeholder="e.g. github.com/alexmorgan"
              className={inputClass}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

import type { ResumeBuilderData } from '../types/builder.types'
import { Mail, Phone, MapPin, Globe } from 'lucide-react'
import { LinkedinIcon } from '../components/builder/ResumeIcons'

interface TemplateProps {
  data: ResumeBuilderData
}

export default function ExecutiveTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, achievements, customSections, sectionVisibility } = data

  return (
    <div className="w-full bg-white text-slate-800 font-sans p-0 leading-relaxed text-[13px] print:text-[12px]">
      {/* ── Executive Navy Banner Header ── */}
      {sectionVisibility.personal && (
        <header className="bg-slate-900 text-white p-7 sm:p-8 print:bg-slate-900 print:text-white">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-extrabold text-2xl sm:text-3xl tracking-tight text-white uppercase">
              {personalInfo.fullName || 'Your Full Name'}
            </h1>
            {personalInfo.jobTitle && (
              <p className="text-blue-300 font-medium text-sm sm:text-base tracking-wide mt-0.5">
                {personalInfo.jobTitle}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-300 border-t border-slate-700/80 pt-2.5">
              {personalInfo.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-400" />
                  <span>{personalInfo.email}</span>
                </span>
              )}
              {personalInfo.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 text-blue-400" />
                  <span>{personalInfo.phone}</span>
                </span>
              )}
              {personalInfo.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span>{personalInfo.location}</span>
                </span>
              )}
              {personalInfo.linkedin && (
                <span className="inline-flex items-center gap-1">
                  <LinkedinIcon className="w-3 h-3 text-blue-400" />
                  <span>{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </span>
              )}
              {personalInfo.portfolio && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-400" />
                  <span>{personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── Main Body ── */}
      <div className="p-7 sm:p-8 space-y-4">
        {/* ── Executive Summary ── */}
        {sectionVisibility.summary && summary && (
          <section className="bg-slate-50 border-l-4 border-slate-900 p-3 rounded-r">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
              Executive Profile
            </h2>
            <p className="text-slate-700 leading-normal text-justify">
              {summary}
            </p>
          </section>
        )}

        {/* ── Core Competencies & Skills Grid ── */}
        {sectionVisibility.skills && skills && skills.some((c) => c.skills.length > 0) && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-1 mb-2.5">
              Core Competencies & Expertise
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {skills
                .filter((c) => c.skills.length > 0)
                .map((cat) => (
                  <div key={cat.id} className="bg-slate-50/70 p-2 rounded border border-slate-100">
                    <span className="font-bold text-slate-900 block mb-0.5">
                      {cat.categoryName}
                    </span>
                    <span className="text-slate-600">
                      {cat.skills.join(' • ')}
                    </span>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* ── Leadership & Professional Experience ── */}
        {sectionVisibility.experience && experience && experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-1 mb-3">
              Leadership & Work Experience
            </h2>
            <div className="space-y-3.5">
              {experience.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-[13.5px]">
                        {exp.role}
                      </span>
                      <span className="text-slate-500 font-semibold ml-1.5">
                        | {exp.company}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                      {exp.location ? ` • ${exp.location}` : ''}
                    </span>
                  </div>
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-slate-700">
                      {exp.highlights.filter(Boolean).map((bullet, idx) => (
                        <li key={idx} className="leading-snug">{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Key Initiatives & Projects ── */}
        {sectionVisibility.projects && projects && projects.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-1 mb-2.5">
              Strategic Projects & Initiatives
            </h2>
            <div className="space-y-2.5">
              {projects.map((proj) => (
                <div key={proj.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-[13px]">{proj.name}</span>
                    {(proj.startDate || proj.endDate) && (
                      <span className="text-xs text-slate-500">
                        {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-slate-700 text-xs mt-0.5 leading-snug">{proj.description}</p>
                  )}
                  {proj.highlights && proj.highlights.length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700 text-xs">
                      {proj.highlights.filter(Boolean).map((h, hIdx) => (
                        <li key={hIdx} className="leading-snug">{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Education & Credentials ── */}
        {sectionVisibility.education && education && education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-1 mb-2">
              Education & Academic Credentials
            </h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="break-inside-avoid flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-slate-900 text-[13px]">{edu.degree}</span>
                    {edu.field && <span className="text-slate-700"> in {edu.field}</span>}
                    <span className="text-slate-500"> — {edu.institution}</span>
                    {edu.gpa && <span className="text-slate-600 text-xs font-semibold"> (GPA: {edu.gpa})</span>}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {edu.startYear} – {edu.graduationYear || 'Present'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Certifications & Honors ── */}
        {((sectionVisibility.certifications && certifications && certifications.length > 0) ||
          (sectionVisibility.achievements && achievements && achievements.length > 0)) && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-1 mb-2">
              Certifications & Industry Recognition
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {certifications?.map((c) => (
                <div key={c.id}>
                  <strong className="text-slate-900 font-semibold">{c.name}</strong>
                  <div className="text-[11px] text-slate-500">{c.issuer} {c.issueDate ? `• ${c.issueDate}` : ''}</div>
                </div>
              ))}
              {achievements?.map((a) => (
                <div key={a.id}>
                  <strong className="text-slate-900 font-semibold">{a.title}</strong>
                  {a.description && <p className="text-[11px] text-slate-600">{a.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Custom Sections ── */}
        {sectionVisibility.custom && customSections && customSections.length > 0 && (
          <div className="space-y-3">
            {customSections.map((sec) => (
              <section key={sec.id} className="break-inside-avoid">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b-2 border-slate-200 pb-1 mb-1.5">
                  {sec.title}
                </h2>
                <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700 text-xs">
                  {sec.items.filter(Boolean).map((item, iIdx) => (
                    <li key={iIdx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

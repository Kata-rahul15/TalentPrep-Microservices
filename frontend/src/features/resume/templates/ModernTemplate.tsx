import type { ResumeBuilderData } from '../types/builder.types'
import { Mail, Phone, MapPin, Globe, ExternalLink } from 'lucide-react'
import { LinkedinIcon, GithubIcon } from '../components/builder/ResumeIcons'

interface TemplateProps {
  data: ResumeBuilderData
}

export default function ModernTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, achievements, customSections, sectionVisibility } = data

  return (
    <div className="w-full bg-white text-slate-800 font-sans p-8 sm:p-10 leading-relaxed text-[13px] print:p-8 print:text-[12px] print:text-black">
      {/* ── Header ── */}
      {sectionVisibility.personal && (
        <header className="border-b-2 border-blue-600 pb-4 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h1 className="font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight print:text-2xl">
              {personalInfo.fullName || 'Your Full Name'}
            </h1>
            {personalInfo.jobTitle && (
              <span className="text-blue-600 font-semibold text-sm sm:text-base tracking-wide">
                {personalInfo.jobTitle}
              </span>
            )}
          </div>

          {/* Contact Bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-600 print:text-[11px]">
            {personalInfo.email && (
              <a href={`mailto:${personalInfo.email}`} className="inline-flex items-center gap-1 hover:text-blue-600">
                <Mail className="w-3 h-3 text-blue-600" />
                <span>{personalInfo.email}</span>
              </a>
            )}
            {personalInfo.phone && (
              <a href={`tel:${personalInfo.phone}`} className="inline-flex items-center gap-1 hover:text-blue-600">
                <Phone className="w-3 h-3 text-blue-600" />
                <span>{personalInfo.phone}</span>
              </a>
            )}
            {personalInfo.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-600" />
                <span>{personalInfo.location}</span>
              </span>
            )}
            {personalInfo.linkedin && (
              <a
                href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-blue-600"
              >
                <LinkedinIcon className="w-3 h-3 text-blue-600" />
                <span>{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </a>
            )}
            {personalInfo.github && (
              <a
                href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-blue-600"
              >
                <GithubIcon className="w-3 h-3 text-blue-600" />
                <span>{personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </a>
            )}
            {personalInfo.portfolio && (
              <a
                href={personalInfo.portfolio.startsWith('http') ? personalInfo.portfolio : `https://${personalInfo.portfolio}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-blue-600"
              >
                <Globe className="w-3 h-3 text-blue-600" />
                <span>{personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </a>
            )}
          </div>
        </header>
      )}

      {/* ── Summary ── */}
      {sectionVisibility.summary && summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-slate-700 leading-normal text-justify print:text-black">
            {summary}
          </p>
        </section>
      )}

      {/* ── Work Experience ── */}
      {sectionVisibility.experience && experience && experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-3">
            Work Experience
          </h2>
          <div className="space-y-3.5">
            {experience.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                  <div className="font-bold text-slate-900 text-[13.5px] print:text-[12.5px]">
                    {exp.role} <span className="text-slate-500 font-normal">|</span> <span className="text-blue-600">{exp.company}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                    {exp.location && ` • ${exp.location}`}
                  </div>
                </div>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1.5 space-y-1 text-slate-700 print:text-black">
                    {exp.highlights.filter(Boolean).map((bullet, idx) => (
                      <li key={idx} className="leading-snug">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Technical Skills ── */}
      {sectionVisibility.skills && skills && skills.some((cat) => cat.skills.length > 0) && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-2.5">
            Technical Skills
          </h2>
          <div className="space-y-1.5">
            {skills
              .filter((cat) => cat.skills.length > 0)
              .map((cat) => (
                <div key={cat.id} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                  <span className="font-bold text-slate-900 text-xs sm:w-44 flex-shrink-0">
                    {cat.categoryName}:
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {cat.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-block bg-slate-100 text-slate-800 text-[11px] px-2 py-0.5 rounded font-medium border border-slate-200/60 print:border-none print:bg-transparent print:p-0 print:after:content-[','] last:print:after:content-none"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── Projects ── */}
      {sectionVisibility.projects && projects && projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-3">
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-[13px]">
                      {proj.name}
                    </span>
                    {proj.repoUrl && (
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        Code <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        Live Demo <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="text-xs text-slate-500 font-medium">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                    </span>
                  )}
                </div>

                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-[11px] text-slate-600 italic mt-0.5">
                    <span className="font-semibold text-slate-700 not-italic">Tech Stack: </span>
                    {proj.technologies.join(', ')}
                  </p>
                )}

                {proj.description && (
                  <p className="text-slate-700 text-xs mt-1 leading-snug">
                    {proj.description}
                  </p>
                )}

                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-700 text-xs print:text-black">
                    {proj.highlights.filter(Boolean).map((h, hIdx) => (
                      <li key={hIdx} className="leading-snug">
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Education ── */}
      {sectionVisibility.education && education && education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-2.5">
            Education
          </h2>
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                  <div className="font-bold text-slate-900 text-[13px]">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {edu.startYear} – {edu.graduationYear || 'Present'}
                  </div>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="font-medium text-slate-700">{edu.institution}</span>
                  {edu.location && <span>• {edu.location}</span>}
                  {edu.gpa && <span className="text-blue-700 font-semibold">• GPA: {edu.gpa}</span>}
                </div>
                {edu.coursework && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    <span className="font-medium text-slate-600">Coursework:</span> {edu.coursework}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Certifications ── */}
      {sectionVisibility.certifications && certifications && certifications.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-2">
            Certifications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {certifications.map((cert) => (
              <div key={cert.id} className="text-xs break-inside-avoid">
                <div className="font-semibold text-slate-900">
                  {cert.name}
                  {cert.credentialUrl && (
                    <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="ml-1 text-blue-600 inline-block">
                      ↗
                    </a>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  {cert.issuer} {cert.issueDate ? `• ${cert.issueDate}` : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Achievements ── */}
      {sectionVisibility.achievements && achievements && achievements.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-2">
            Honors & Achievements
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-1 text-slate-700 text-xs">
            {achievements.map((ach) => (
              <li key={ach.id} className="leading-snug">
                <strong className="text-slate-900 font-semibold">{ach.title}</strong>
                {ach.description ? `: ${ach.description}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Custom Sections ── */}
      {sectionVisibility.custom && customSections && customSections.length > 0 && (
        <div className="space-y-4">
          {customSections.map((sec) => (
            <section key={sec.id} className="break-inside-avoid">
              <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 border-b border-slate-200 pb-1 mb-2">
                {sec.title}
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-1 text-slate-700 text-xs">
                {sec.items.filter(Boolean).map((item, iIdx) => (
                  <li key={iIdx} className="leading-snug">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

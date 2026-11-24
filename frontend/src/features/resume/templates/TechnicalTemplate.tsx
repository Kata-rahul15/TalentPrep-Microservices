import type { ResumeBuilderData } from '../types/builder.types'
import { Mail, Phone, MapPin, Globe, ExternalLink, Code2, Terminal } from 'lucide-react'
import { LinkedinIcon, GithubIcon } from '../components/builder/ResumeIcons'

interface TemplateProps {
  data: ResumeBuilderData
}

export default function TechnicalTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, achievements, customSections, sectionVisibility } = data

  return (
    <div className="w-full bg-white text-slate-800 font-sans p-8 sm:p-9 leading-relaxed text-[12.5px] print:p-8 print:text-[11.5px]">
      {/* ── Technical Header ── */}
      {sectionVisibility.personal && (
        <header className="border-b border-slate-300 pb-3.5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h1 className="font-mono font-bold text-2xl sm:text-3xl text-slate-950 tracking-tight flex items-center gap-1.5">
                <Terminal className="w-5 h-5 text-sky-600 inline" />
                <span>{personalInfo.fullName || 'Developer Name'}</span>
              </h1>
              {personalInfo.jobTitle && (
                <p className="font-mono text-sky-700 font-semibold text-xs sm:text-sm mt-0.5">
                  &gt; {personalInfo.jobTitle}
                </p>
              )}
            </div>

            {/* Links Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              {personalInfo.github && (
                <a
                  href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 px-2 py-0.5 rounded inline-flex items-center gap-1 transition-colors"
                >
                  <GithubIcon className="w-3 h-3 text-slate-700" />
                  <span>GitHub</span>
                </a>
              )}
              {personalInfo.linkedin && (
                <a
                  href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 px-2 py-0.5 rounded inline-flex items-center gap-1 transition-colors"
                >
                  <LinkedinIcon className="w-3 h-3 text-sky-700" />
                  <span>LinkedIn</span>
                </a>
              )}
              {personalInfo.portfolio && (
                <a
                  href={personalInfo.portfolio.startsWith('http') ? personalInfo.portfolio : `https://${personalInfo.portfolio}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded inline-flex items-center gap-1 transition-colors"
                >
                  <Globe className="w-3 h-3 text-emerald-700" />
                  <span>Portfolio</span>
                </a>
              )}
            </div>
          </div>

          {/* Contact details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
            {personalInfo.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3 h-3 text-sky-600" /> {personalInfo.email}
              </span>
            )}
            {personalInfo.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3 h-3 text-sky-600" /> {personalInfo.phone}
              </span>
            )}
            {personalInfo.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-600" /> {personalInfo.location}
              </span>
            )}
          </div>
        </header>
      )}

      {/* ── Summary ── */}
      {sectionVisibility.summary && summary && (
        <section className="mb-4">
          <p className="text-slate-700 leading-normal text-justify border-l-2 border-sky-600 pl-3 italic">
            {summary}
          </p>
        </section>
      )}

      {/* ── Technical Skills Grid (Prominent) ── */}
      {sectionVisibility.skills && skills && skills.some((c) => c.skills.length > 0) && (
        <section className="mb-4 bg-slate-50/80 border border-slate-200 rounded-lg p-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5 mb-2">
            <Code2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Technical Skills Matrix</span>
          </h2>
          <div className="space-y-1.5">
            {skills
              .filter((c) => c.skills.length > 0)
              .map((cat) => (
                <div key={cat.id} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                  <span className="font-mono font-bold text-slate-900 text-xs sm:w-44 flex-shrink-0">
                    {cat.categoryName}:
                  </span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {cat.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-white border border-slate-200 text-slate-800 font-mono text-[11px] px-1.5 py-0.2 rounded shadow-2xs"
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

      {/* ── Engineering Experience ── */}
      {sectionVisibility.experience && experience && experience.length > 0 && (
        <section className="mb-4">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2.5">
            Engineering & Professional Experience
          </h2>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-mono text-xs">
                  <span className="font-bold text-slate-900 text-[13px]">
                    {exp.role} <span className="text-sky-700 font-normal">@ {exp.company}</span>
                  </span>
                  <span className="text-slate-500 font-normal">
                    {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                    {exp.location ? ` [${exp.location}]` : ''}
                  </span>
                </div>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-slate-700 text-[12px]">
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

      {/* ── Projects (High prominence for technical roles) ── */}
      {sectionVisibility.projects && projects && projects.length > 0 && (
        <section className="mb-4">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2.5">
            Featured Projects & Open Source
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900 text-[13px]">
                      {proj.name}
                    </span>
                    {proj.repoUrl && (
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-sky-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        [source <ExternalLink className="w-2.5 h-2.5" />]
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-emerald-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        [demo <ExternalLink className="w-2.5 h-2.5" />]
                      </a>
                    )}
                  </div>
                  {(proj.startDate || proj.endDate) && (
                    <span className="font-mono text-[11px] text-slate-500">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                    </span>
                  )}
                </div>

                {proj.technologies && proj.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 my-1">
                    {proj.technologies.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="bg-sky-50 text-sky-800 border border-sky-100 font-mono text-[10px] px-1 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {proj.description && (
                  <p className="text-slate-700 text-xs leading-snug">{proj.description}</p>
                )}

                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-700 text-[12px]">
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

      {/* ── Education & Certifications ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sectionVisibility.education && education && education.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Education
            </h2>
            <div className="space-y-1.5 text-xs">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="font-bold text-slate-900">{edu.degree}</div>
                  <div className="text-slate-600">{edu.institution}</div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {edu.startYear} – {edu.graduationYear || 'Present'} {edu.gpa ? `| GPA: ${edu.gpa}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {sectionVisibility.certifications && certifications && certifications.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Certifications
            </h2>
            <div className="space-y-1.5 text-xs">
              {certifications.map((c) => (
                <div key={c.id}>
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {c.issuer} {c.issueDate ? `(${c.issueDate})` : ''}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Custom / Achievements ── */}
      {sectionVisibility.achievements && achievements && achievements.length > 0 && (
        <section className="mt-3 break-inside-avoid">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
            Key Achievements
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700 text-xs">
            {achievements.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong>{a.description ? `: ${a.description}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sectionVisibility.custom && customSections && customSections.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {customSections.map((sec) => (
            <section key={sec.id} className="break-inside-avoid">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1">
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
  )
}

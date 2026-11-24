import type { ResumeBuilderData } from '../types/builder.types'
import { Mail, Phone, MapPin, Globe, ExternalLink } from 'lucide-react'
import { LinkedinIcon, GithubIcon } from '../components/builder/ResumeIcons'

interface TemplateProps {
  data: ResumeBuilderData
}

export default function ContemporaryTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, achievements, customSections, sectionVisibility } = data

  return (
    <div className="w-full bg-white text-slate-800 font-sans p-6 sm:p-8 leading-relaxed text-[12.5px] print:p-6 print:text-[11.5px]">
      {/* ── Top Header Banner ── */}
      {sectionVisibility.personal && (
        <header className="border-b-2 border-indigo-600 pb-3 mb-4">
          <h1 className="font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            {personalInfo.fullName || 'Your Full Name'}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-indigo-600 font-semibold text-sm sm:text-base mt-0.5">
              {personalInfo.jobTitle}
            </p>
          )}
        </header>
      )}

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 print:grid-cols-12">
        {/* Left Column (Sidebar: Contact, Skills, Education, Certifications) */}
        <aside className="md:col-span-4 space-y-4 border-r border-slate-200/80 pr-4 print:col-span-4">
          {/* Contact Details */}
          {sectionVisibility.personal && (
            <div className="space-y-1.5 text-xs text-slate-600">
              <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5">
                Contact
              </h3>
              {personalInfo.email && (
                <div className="flex items-center gap-1.5 break-all">
                  <Mail className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                  <span>{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                  <span>{personalInfo.location}</span>
                </div>
              )}
              {personalInfo.linkedin && (
                <div className="flex items-center gap-1.5 break-all">
                  <LinkedinIcon className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                  <span>{personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </div>
              )}
              {personalInfo.github && (
                <div className="flex items-center gap-1.5 break-all">
                  <GithubIcon className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                  <span>{personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </div>
              )}
              {personalInfo.portfolio && (
                <div className="flex items-center gap-1.5 break-all">
                  <Globe className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                  <span>{personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '')}</span>
                </div>
              )}
            </div>
          )}

          {/* Technical Skills */}
          {sectionVisibility.skills && skills && skills.some((c) => c.skills.length > 0) && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5">
                Skills
              </h3>
              {skills
                .filter((c) => c.skills.length > 0)
                .map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <span className="font-semibold text-slate-900 text-xs block">
                      {cat.categoryName}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-indigo-50 text-indigo-900 text-[11px] px-1.5 py-0.2 rounded font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Education */}
          {sectionVisibility.education && education && education.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5">
                Education
              </h3>
              {education.map((edu) => (
                <div key={edu.id} className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-900">{edu.degree}</div>
                  {edu.field && <div className="text-indigo-900 font-medium">{edu.field}</div>}
                  <div className="text-slate-600">{edu.institution}</div>
                  <div className="text-[11px] text-slate-500">
                    {edu.startYear} – {edu.graduationYear || 'Present'} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Certifications */}
          {sectionVisibility.certifications && certifications && certifications.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5">
                Certifications
              </h3>
              {certifications.map((c) => (
                <div key={c.id} className="text-xs">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.issuer}</div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Right Column (Main Content: Summary, Experience, Projects, Achievements, Custom) */}
        <main className="md:col-span-8 space-y-4 print:col-span-8">
          {/* Summary */}
          {sectionVisibility.summary && summary && (
            <section>
              <h2 className="font-bold text-xs uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5 mb-1.5">
                Profile Summary
              </h2>
              <p className="text-slate-700 leading-normal text-justify">
                {summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {sectionVisibility.experience && experience && experience.length > 0 && (
            <section>
              <h2 className="font-bold text-xs uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5 mb-2.5">
                Experience
              </h2>
              <div className="space-y-3">
                {experience.map((exp) => (
                  <div key={exp.id} className="break-inside-avoid">
                    <div className="flex justify-between items-baseline font-bold text-[13px] text-slate-900">
                      <span>{exp.role}</span>
                      <span className="text-xs text-slate-500 font-normal">
                        {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-600 mb-1">
                      {exp.company} {exp.location ? `• ${exp.location}` : ''}
                    </div>
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700 text-xs">
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

          {/* Projects */}
          {sectionVisibility.projects && projects && projects.length > 0 && (
            <section>
              <h2 className="font-bold text-xs uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5 mb-2.5">
                Projects
              </h2>
              <div className="space-y-2.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="break-inside-avoid">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-[13px]">{proj.name}</span>
                        {proj.repoUrl && (
                          <a href={proj.repoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 inline-flex items-center gap-0.5">
                            Code <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {proj.liveUrl && (
                          <a href={proj.liveUrl} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-600 inline-flex items-center gap-0.5">
                            Demo <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      {(proj.startDate || proj.endDate) && (
                        <span className="text-[11px] text-slate-500">
                          {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                        </span>
                      )}
                    </div>
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="text-[11px] text-slate-600 italic">
                        {proj.technologies.join(', ')}
                      </div>
                    )}
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

          {/* Achievements */}
          {sectionVisibility.achievements && achievements && achievements.length > 0 && (
            <section>
              <h2 className="font-bold text-xs uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5 mb-1.5">
                Achievements
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-700 text-xs">
                {achievements.map((a) => (
                  <li key={a.id}>
                    <strong className="text-slate-900">{a.title}</strong>{a.description ? `: ${a.description}` : ''}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Custom Sections */}
          {sectionVisibility.custom && customSections && customSections.length > 0 && (
            <div className="space-y-2.5">
              {customSections.map((sec) => (
                <section key={sec.id} className="break-inside-avoid">
                  <h2 className="font-bold text-xs uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-0.5 mb-1">
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
        </main>
      </div>
    </div>
  )
}

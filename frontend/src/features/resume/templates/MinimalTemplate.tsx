import type { ResumeBuilderData } from '../types/builder.types'

interface TemplateProps {
  data: ResumeBuilderData
}

export default function MinimalTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, achievements, customSections, sectionVisibility } = data

  return (
    <div className="w-full bg-white text-black font-sans p-8 sm:p-10 leading-relaxed text-[12.5px] print:p-8 print:text-[11.5px]">
      {/* ── Header ── */}
      {sectionVisibility.personal && (
        <header className="border-b border-black pb-3 mb-4">
          <h1 className="font-bold text-2xl sm:text-3xl tracking-tight uppercase text-black">
            {personalInfo.fullName || 'Your Full Name'}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-xs font-semibold tracking-wider uppercase text-neutral-700 mt-0.5">
              {personalInfo.jobTitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11.5px] text-neutral-600">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.location && <span>• {personalInfo.location}</span>}
            {personalInfo.linkedin && (
              <span>• {personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
            {personalInfo.github && (
              <span>• {personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
            {personalInfo.portfolio && (
              <span>• {personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, '')}</span>
            )}
          </div>
        </header>
      )}

      {/* ── Summary ── */}
      {sectionVisibility.summary && summary && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-1.5 text-neutral-900">
            Summary
          </h2>
          <p className="text-neutral-800 leading-normal text-justify">
            {summary}
          </p>
        </section>
      )}

      {/* ── Experience ── */}
      {sectionVisibility.experience && experience && experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-2.5 text-neutral-900">
            Experience
          </h2>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-neutral-900 text-[12.5px]">
                  <span>
                    {exp.role}, <span className="font-semibold text-neutral-800">{exp.company}</span>
                  </span>
                  <span className="text-[11px] font-normal text-neutral-600">
                    {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}
                    {exp.location ? ` | ${exp.location}` : ''}
                  </span>
                </div>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5 text-neutral-800 text-[12px]">
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

      {/* ── Skills ── */}
      {sectionVisibility.skills && skills && skills.some((c) => c.skills.length > 0) && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-2 text-neutral-900">
            Technical Skills
          </h2>
          <div className="space-y-1 text-[12px]">
            {skills
              .filter((c) => c.skills.length > 0)
              .map((cat) => (
                <div key={cat.id} className="flex flex-col sm:flex-row gap-1">
                  <span className="font-semibold text-neutral-900 sm:w-44 flex-shrink-0">
                    {cat.categoryName}:
                  </span>
                  <span className="text-neutral-800">
                    {cat.skills.join(', ')}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── Projects ── */}
      {sectionVisibility.projects && projects && projects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-2 text-neutral-900">
            Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-neutral-900 text-[12.5px]">
                    {proj.name}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <span className="font-normal text-neutral-600 text-[11.5px] ml-1.5">
                        ({proj.technologies.join(', ')})
                      </span>
                    )}
                  </span>
                  {(proj.startDate || proj.endDate) && (
                    <span className="text-[11px] text-neutral-500">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                    </span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-neutral-800 text-[12px] mt-0.5 leading-snug">
                    {proj.description}
                  </p>
                )}
                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-neutral-800 text-[12px]">
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

      {/* ── Education ── */}
      {sectionVisibility.education && education && education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-2 text-neutral-900">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-neutral-900">
                  <span>
                    {edu.degree} {edu.field ? `in ${edu.field}` : ''} – {edu.institution}
                  </span>
                  <span className="text-[11px] font-normal text-neutral-600">
                    {edu.startYear} – {edu.graduationYear || 'Present'}
                  </span>
                </div>
                <div className="text-[11.5px] text-neutral-600 flex gap-2">
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                  {edu.coursework && <span>• Relevant: {edu.coursework}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Certifications & Achievements ── */}
      {sectionVisibility.certifications && certifications && certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-1.5 text-neutral-900">
            Certifications
          </h2>
          <div className="space-y-1 text-[12px]">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between">
                <span className="font-medium text-neutral-900">{cert.name} — {cert.issuer}</span>
                <span className="text-neutral-500 text-[11px]">{cert.issueDate}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {sectionVisibility.achievements && achievements && achievements.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-1.5 text-neutral-900">
            Honors & Achievements
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-neutral-800 text-[12px]">
            {achievements.map((ach) => (
              <li key={ach.id} className="leading-snug">
                <strong>{ach.title}</strong>{ach.description ? `: ${ach.description}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Custom Sections ── */}
      {sectionVisibility.custom && customSections && customSections.length > 0 && (
        <div className="space-y-3">
          {customSections.map((sec) => (
            <section key={sec.id} className="break-inside-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-neutral-300 pb-0.5 mb-1.5 text-neutral-900">
                {sec.title}
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-0.5 text-neutral-800 text-[12px]">
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

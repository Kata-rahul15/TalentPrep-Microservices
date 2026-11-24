import type { ResumeBuilderData } from '../types/builder.types'

interface TemplateProps {
  data: ResumeBuilderData
}

export default function ClassicTemplate({ data }: TemplateProps) {
  const { personalInfo, summary, experience, education, skills, projects, certifications, achievements, customSections, sectionVisibility } = data

  return (
    <div className="w-full bg-white text-slate-900 font-serif p-8 sm:p-10 leading-relaxed text-[13px] print:p-8 print:text-[12px]">
      {/* ── Centered Header ── */}
      {sectionVisibility.personal && (
        <header className="text-center pb-3 mb-4 border-b-2 border-slate-800">
          <h1 className="font-bold text-2xl sm:text-3xl tracking-normal text-slate-900 uppercase">
            {personalInfo.fullName || 'Your Full Name'}
          </h1>
          {personalInfo.jobTitle && (
            <p className="font-sans text-xs font-semibold tracking-wider uppercase text-slate-700 mt-1">
              {personalInfo.jobTitle}
            </p>
          )}

          <div className="font-sans flex flex-wrap justify-center items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-600">
            {personalInfo.location && <span>{personalInfo.location}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.email && (
              <span>
                • <a href={`mailto:${personalInfo.email}`} className="text-slate-800 underline">{personalInfo.email}</a>
              </span>
            )}
            {personalInfo.linkedin && (
              <span>
                • <a href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`} target="_blank" rel="noreferrer" className="text-slate-800 underline">LinkedIn</a>
              </span>
            )}
            {personalInfo.github && (
              <span>
                • <a href={personalInfo.github.startsWith('http') ? personalInfo.github : `https://${personalInfo.github}`} target="_blank" rel="noreferrer" className="text-slate-800 underline">GitHub</a>
              </span>
            )}
          </div>
        </header>
      )}

      {/* ── Professional Summary ── */}
      {sectionVisibility.summary && summary && (
        <section className="mb-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
            Executive Summary
          </h2>
          <p className="text-slate-800 leading-normal text-justify">
            {summary}
          </p>
        </section>
      )}

      {/* ── Professional Experience ── */}
      {sectionVisibility.experience && experience && experience.length > 0 && (
        <section className="mb-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 font-sans">
            Professional Experience
          </h2>
          <div className="space-y-3">
            {experience.map((exp) => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-[13.5px]">
                    {exp.company}
                  </span>
                  <span className="font-sans text-xs italic text-slate-600">
                    {exp.location}
                  </span>
                </div>
                <div className="flex justify-between items-baseline font-sans text-xs italic text-slate-700 mb-1">
                  <span>{exp.role}</span>
                  <span>{exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'Present'}</span>
                </div>
                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-800 text-[12.5px]">
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

      {/* ── Education ── */}
      {sectionVisibility.education && education && education.length > 0 && (
        <section className="mb-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 font-sans">
            Education
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{edu.institution}</span>
                  <span className="font-sans text-xs italic text-slate-600">{edu.location}</span>
                </div>
                <div className="flex justify-between items-baseline font-sans text-xs text-slate-700">
                  <span>{edu.degree}{edu.field ? `, ${edu.field}` : ''} {edu.gpa ? `(GPA: ${edu.gpa})` : ''}</span>
                  <span>{edu.startYear} – {edu.graduationYear || 'Present'}</span>
                </div>
                {edu.coursework && (
                  <p className="font-sans text-[11px] text-slate-600 mt-0.5">
                    <em>Selected Coursework:</em> {edu.coursework}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Skills ── */}
      {sectionVisibility.skills && skills && skills.some((c) => c.skills.length > 0) && (
        <section className="mb-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 font-sans">
            Skills & Competencies
          </h2>
          <div className="space-y-1 font-sans text-xs">
            {skills
              .filter((c) => c.skills.length > 0)
              .map((cat) => (
                <div key={cat.id} className="flex flex-col sm:flex-row gap-1">
                  <span className="font-bold text-slate-900 sm:w-48 flex-shrink-0">
                    {cat.categoryName}:
                  </span>
                  <span className="text-slate-800">
                    {cat.skills.join(', ')}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── Key Projects ── */}
      {sectionVisibility.projects && projects && projects.length > 0 && (
        <section className="mb-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 font-sans">
            Key Projects
          </h2>
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{proj.name}</span>
                  {(proj.startDate || proj.endDate) && (
                    <span className="font-sans text-xs italic text-slate-600 font-normal">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                    </span>
                  )}
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="font-sans text-[11px] text-slate-600 italic">
                    Tools: {proj.technologies.join(', ')}
                  </p>
                )}
                {proj.description && (
                  <p className="text-slate-800 text-[12.5px] mt-0.5 leading-snug">
                    {proj.description}
                  </p>
                )}
                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="list-disc list-outside ml-4 mt-0.5 space-y-0.5 text-slate-800 text-[12px]">
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

      {/* ── Certifications & Honors ── */}
      {((sectionVisibility.certifications && certifications && certifications.length > 0) ||
        (sectionVisibility.achievements && achievements && achievements.length > 0)) && (
        <section className="mb-4">
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
            Certifications & Honors
          </h2>
          <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-800 text-xs font-sans">
            {certifications?.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> — {c.issuer} {c.issueDate ? `(${c.issueDate})` : ''}
              </li>
            ))}
            {achievements?.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong>{a.description ? `: ${a.description}` : ''}
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
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 font-sans">
                {sec.title}
              </h2>
              <ul className="list-disc list-outside ml-4 space-y-0.5 text-slate-800 text-xs font-sans">
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

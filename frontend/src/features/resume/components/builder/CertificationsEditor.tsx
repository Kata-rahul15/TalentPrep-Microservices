import type { CertificationItem } from '../../types/builder.types'
import { generateId } from '../../utils/builderUtils'
import { Plus, Trash2, Award, ExternalLink } from 'lucide-react'

interface Props {
  certifications: CertificationItem[]
  onChange: (certifications: CertificationItem[]) => void
}

export default function CertificationsEditor({ certifications, onChange }: Props) {
  const addCert = () => {
    const newItem: CertificationItem = {
      id: generateId('cert'),
      name: '',
      issuer: '',
      issueDate: '',
      credentialUrl: '',
    }
    onChange([...certifications, newItem])
  }

  const updateItem = (id: string, updates: Partial<CertificationItem>) => {
    onChange(certifications.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const removeItem = (id: string) => {
    onChange(certifications.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
            Licenses & Certifications
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Add recognized industry certifications (e.g. AWS, CKA, PMP, Scrum Master).
          </p>
        </div>

        <button
          type="button"
          onClick={addCert}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs cursor-pointer h-7.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Certification</span>
        </button>
      </div>

      {certifications.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center space-y-2">
          <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No certifications added yet
          </p>
          <button
            type="button"
            onClick={addCert}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
          >
            <Plus className="w-3 h-3" /> Add certification
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs text-slate-900 dark:text-white">
                  {cert.name || 'New Certification'}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(cert.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Certification Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => updateItem(cert.id, { name: e.target.value })}
                    placeholder="e.g. AWS Certified Solutions Architect"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issuing Organization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cert.issuer}
                    onChange={(e) => updateItem(cert.id, { issuer: e.target.value })}
                    placeholder="e.g. Amazon Web Services, CNCF"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="text"
                    value={cert.issueDate}
                    onChange={(e) => updateItem(cert.id, { issueDate: e.target.value })}
                    placeholder="e.g. May 2023"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credential URL (Optional)
                  </label>
                  <div className="relative">
                    <ExternalLink className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={cert.credentialUrl || ''}
                      onChange={(e) => updateItem(cert.id, { credentialUrl: e.target.value })}
                      placeholder="https://verification.link"
                      className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

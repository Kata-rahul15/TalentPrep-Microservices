import type { ResumeBuilderData } from '../types/builder.types'
import ModernTemplate from './ModernTemplate'
import MinimalTemplate from './MinimalTemplate'
import ClassicTemplate from './ClassicTemplate'
import ExecutiveTemplate from './ExecutiveTemplate'
import TechnicalTemplate from './TechnicalTemplate'
import ContemporaryTemplate from './ContemporaryTemplate'

interface TemplateRendererProps {
  data: ResumeBuilderData
}

export default function TemplateRenderer({ data }: TemplateRendererProps) {
  switch (data.selectedTemplate) {
    case 'minimal':
      return <MinimalTemplate data={data} />
    case 'classic':
      return <ClassicTemplate data={data} />
    case 'executive':
      return <ExecutiveTemplate data={data} />
    case 'technical':
      return <TechnicalTemplate data={data} />
    case 'contemporary':
      return <ContemporaryTemplate data={data} />
    case 'modern':
    default:
      return <ModernTemplate data={data} />
  }
}

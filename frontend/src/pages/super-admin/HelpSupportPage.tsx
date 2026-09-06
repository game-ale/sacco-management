import { useState } from 'react'
import { BookOpen, MessageSquare, ShieldCheck, ChevronDown, Mail, ArrowRight } from 'lucide-react'

const faqs = [
  {
    question: 'How do I approve or review a SACCO application?',
    answer: 'Open the SACCO dashboard from the left navigation, review the pending entries, and approve or reject them from the SACCO detail screen. Pending applications are also visible from the main SACCO management list.',
  },
  {
    question: 'How can I manage platform users?',
    answer: 'Use the All Users page to filter by role and status, review member activity, suspend or activate accounts, and reset passwords when required.',
  },
  {
    question: 'Where do I review platform performance and reports?',
    answer: 'Navigate to Platform Reports to inspect SACCO comparison metrics, growth trends, and geographic distribution. These reports help with platform monitoring and operational decisions.',
  },
  {
    question: 'How do I update platform-wide settings?',
    answer: 'Visit Platform Settings to control global defaults, notifications, support email, and SACCO registration rules. Save changes after review to apply them immediately.',
  },
]

const supportCards = [
  {
    icon: ShieldCheck,
    title: 'Platform Governance',
    description: 'Review registrations, manage SACCO approval workflows, and monitor compliance.',
  },
  {
    icon: MessageSquare,
    title: 'Escalation Support',
    description: 'Route operational issues to technical support, platform admins, and relevant stakeholders.',
  },
  {
    icon: BookOpen,
    title: 'Operational Guidance',
    description: 'Use the FAQs below to find quick answers for common Super Admin tasks and platform administration.',
  },
]

export default function SuperAdminHelpSupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Help & Support</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Get quick guidance for platform operations, governance, and support workflows.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {supportCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{card.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{card.description}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={faq.question} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {faq.question}
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Support Contacts</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
              <Mail className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Platform Support</div>
                <a href="mailto:support@saccomanager.com" className="text-sm text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  support@saccomanager.com
                </a>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950/30">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Recommended actions</div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />Review pending SACCOs and user issues daily.</li>
                <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />Confirm platform settings before major release or outreach changes.</li>
                <li className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />Use Reports to monitor growth, approvals, and active platform health.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

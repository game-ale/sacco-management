import { useState } from 'react'
import { toast } from 'sonner'
import { BookOpen, MessageSquare, Phone, ChevronDown, Send, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../stores/auth'
import { Button } from '../../components/ui/button'
import { Label } from '../../components/ui/label'
import { submitSupportTicket } from '../../services/memberPortalService'

const FAQS = [
  {
    q: 'How do I apply for a loan?',
    a: 'Go to "Apply for Loan" from the sidebar, choose a loan purpose, enter the amount and term you need, then submit. Your SACCO administrator will review and approve or reject your request.',
  },
  {
    q: 'What are the current interest rates?',
    a: 'Interest rates depend on the loan product and are set by your SACCO administrator. The rate that applies to your loan is shown on the loan details page and on your loan statement.',
  },
  {
    q: 'How can I check my dividend payout?',
    a: 'Open "My Dividends" from the sidebar to see your full dividend history, or generate a Combined Statement from the Statements page for an official record.',
  },
  {
    q: 'How do I update my savings information?',
    a: 'Savings deposits and withdrawals are recorded by your SACCO administrator. You can review every transaction under "My Savings" and download a Savings Statement at any time.',
  },
]

const contactOptions = [
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    desc: 'Browse our comprehensive FAQ and guides.',
  },
  {
    icon: MessageSquare,
    title: 'Contact Admin',
    desc: 'Send us a direct message for specific inquiries.',
    highlight: true,
  },
  {
    icon: Phone,
    title: 'Call Support',
    desc: 'Available Mon-Fri, 8 AM - 5 PM (EAT).',
  },
]

export default function HelpSupportPage() {
  const { user } = useAuthStore()
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [subject, setSubject] = useState('General Inquiry')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please describe your issue before sending.')
      return
    }
    setSending(true)
    try {
      await submitSupportTicket(user?.id, subject, message.trim())
      toast.success("Message sent - we'll get back to you within 24 hours.")
      setMessage('')
    } catch {
      toast.error('Could not send your message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0B6B3A] dark:text-emerald-400">How can we help you?</h1>
      <p className="text-slate-500 dark:text-slate-400 mt-1 mb-6">
        Find answers, contact our team, or browse our knowledge base.
      </p>

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {contactOptions.map((opt) => {
          const Icon = opt.icon
          return (
            <div
              key={opt.title}
              className={`bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm transition-colors ${
                opt.highlight
                  ? 'border-emerald-400 ring-1 ring-emerald-400/40'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-[#0B6B3A] dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{opt.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* FAQ */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={faq.q} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {faq.q}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Send a Message</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">We'll get back to you within 24 hours.</p>

          <div className="space-y-4">
            <div>
              <Label className="text-xs">Subject</Label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-1 h-10 rounded-md border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 text-sm"
              >
                <option>General Inquiry</option>
                <option>Loan Question</option>
                <option>Savings Question</option>
                <option>Dividend Question</option>
                <option>Technical Issue</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue in detail..."
                rows={6}
                className="w-full mt-1 rounded-md border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm resize-none"
              />
            </div>
            <Button
              className="w-full bg-[#0B6B3A] hover:bg-[#095430]"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

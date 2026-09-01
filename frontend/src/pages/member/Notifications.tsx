import { Bell, CheckCircle, AlertCircle, Info, ArrowRight } from 'lucide-react'

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      title: 'Loan Approved',
      message: 'Your emergency loan application of 5,000 ETB has been approved and disbursed to your savings account.',
      type: 'success',
      date: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: 'Upcoming Repayment',
      message: 'Reminder: Your monthly loan installment of 1,250 ETB is due in 3 days.',
      type: 'warning',
      date: '1 day ago',
      read: false
    },
    {
      id: 3,
      title: 'Dividend Distributed',
      message: 'Congratulations! A dividend of 450 ETB has been credited to your account for the fiscal year.',
      type: 'info',
      date: '3 days ago',
      read: true
    }
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />
      default: return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#0B6B3A]/10 p-2 rounded-lg">
            <Bell className="w-6 h-6 text-[#0B6B3A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
            <p className="text-sm text-slate-500">Stay updated on your account activity.</p>
          </div>
        </div>
        <button className="text-sm font-semibold text-[#0B6B3A] hover:underline">
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {notifications.map((notif) => (
            <div key={notif.id} className={`p-5 flex items-start gap-4 transition-colors hover:bg-slate-50 ${!notif.read ? 'bg-emerald-50/30' : ''}`}>
              <div className="shrink-0 mt-1">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h3 className={`text-sm font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{notif.date}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1 pr-8">
                  {notif.message}
                </p>
                {!notif.read && (
                  <button className="text-xs font-semibold text-[#0B6B3A] mt-3 flex items-center gap-1 hover:underline">
                    View Details <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-[#0B6B3A] shrink-0 mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

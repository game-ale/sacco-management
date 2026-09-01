import { useState } from 'react'
import { FileText, Download, Calendar, Filter } from 'lucide-react'

export default function Statements() {
  const [filterYear, setFilterYear] = useState('2026')

  // Mock data for statements
  const statements = [
    { id: 1, month: 'August', year: '2026', type: 'Consolidated Statement', size: '245 KB', date: '2026-08-31' },
    { id: 2, month: 'July', year: '2026', type: 'Consolidated Statement', size: '230 KB', date: '2026-07-31' },
    { id: 3, month: 'June', year: '2026', type: 'Consolidated Statement', size: '241 KB', date: '2026-06-30' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Account Statements</h1>
          <p className="text-sm text-slate-500">Download your monthly consolidated account statements.</p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer"
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {statements.map((stmt) => (
            <div key={stmt.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 shrink-0">
                  <FileText className="w-6 h-6 text-[#0B6B3A]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{stmt.month} {stmt.year} - {stmt.type}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Issued: {stmt.date}</span>
                    <span>•</span>
                    <span>PDF ({stmt.size})</span>
                  </div>
                </div>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors w-full sm:w-auto justify-center">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
          {statements.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              No statements found for {filterYear}.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

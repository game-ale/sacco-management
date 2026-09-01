import React, { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { Search, FileText, User as UserIcon, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import * as Dialog from '@radix-ui/react-dialog'

export const GlobalSearch: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const navigate = useNavigate()

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: results, isLoading } = useQuery({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: () => adminService.search(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  })

  const hasResults = results && (results.members?.length > 0 || results.loans?.length > 0)

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent dark:border-slate-700/50"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
          ⌘K
        </kbd>
      </button>

      {/* Mobile search icon */}
      <button 
        onClick={() => setOpen(true)}
        className="sm:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <Search className="w-5 h-5" />
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800">
            
            <Command className="flex flex-col w-full h-full bg-transparent" label="Global Command Menu" shouldFilter={false}>
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <Command.Input 
                  autoFocus
                  placeholder="Search members, loans, or transactions..."
                  className="flex-1 px-4 py-4 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <button onClick={() => setOpen(false)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">ESC</button>
              </div>

              <Command.List className="max-h-[400px] overflow-y-auto p-2 scroll-smooth">
                {isLoading && debouncedQuery.length > 1 && (
                  <div className="py-14 flex items-center justify-center text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#0B6B3A]" /> Searching...
                  </div>
                )}
                
                {!isLoading && debouncedQuery.length > 1 && !hasResults && (
                  <Command.Empty className="py-14 text-center text-sm text-slate-500">
                    No results found for "{debouncedQuery}".
                  </Command.Empty>
                )}

                {hasResults && (
                  <>
                    {results.members?.length > 0 && (
                      <Command.Group heading={<div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Members</div>}>
                        {results.members.map((member: any) => (
                          <Command.Item
                            key={`member-${member.id}`}
                            value={`member-${member.id}`}
                            onSelect={() => {
                              setOpen(false)
                              navigate('/admin/members') // Assuming you handle opening a specific member via state/params if needed later
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-[#0B6B3A]/10 aria-selected:text-[#0B6B3A] dark:aria-selected:bg-emerald-500/10 dark:aria-selected:text-emerald-400 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-aria-selected:bg-[#0B6B3A]/20">
                              <UserIcon className="w-4 h-4 text-slate-500 group-aria-selected:text-[#0B6B3A] dark:group-aria-selected:text-emerald-400" />
                            </div>
                            <div className="flex flex-col flex-1 truncate">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{member.name}</span>
                              <span className="text-xs text-slate-500">@{member.username} • {member.email}</span>
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {results.loans?.length > 0 && (
                      <Command.Group heading={<div className="px-2 py-1.5 mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Loans</div>}>
                        {results.loans.map((loan: any) => (
                          <Command.Item
                            key={`loan-${loan.id}`}
                            value={`loan-${loan.id}`}
                            onSelect={() => {
                              setOpen(false)
                              navigate('/admin/loans') // In a full implementation, you'd pass ?loanId=...
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-blue-500/10 aria-selected:text-blue-600 dark:aria-selected:bg-blue-500/20 dark:aria-selected:text-blue-400 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-aria-selected:bg-blue-500/20">
                              <FileText className="w-4 h-4 text-slate-500 group-aria-selected:text-blue-600 dark:group-aria-selected:text-blue-400" />
                            </div>
                            <div className="flex flex-col flex-1 truncate">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{loan.loan_number}</span>
                              <span className="text-xs text-slate-500">{loan.user?.name} • ETB {Number(loan.principal_amount).toLocaleString()}</span>
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                              {loan.status}
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}
              </Command.List>
            </Command>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

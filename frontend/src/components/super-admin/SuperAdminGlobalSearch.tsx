import React, { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { Search, Building2, Users, UserRoundPlus, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { superAdminSearchService } from '../../services/superAdminSearchService'

export const SuperAdminGlobalSearch: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((current) => !current)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: results, isLoading } = useQuery({
    queryKey: ['superadmin-platform-search', debouncedQuery],
    queryFn: () => superAdminSearchService.search(debouncedQuery),
    enabled: debouncedQuery.trim().length > 1,
  })

  const normalizedResults = {
    saccos: results?.saccos ?? [],
    users: results?.users ?? [],
    membership_requests: results?.membership_requests ?? [],
  }

  const hasResults =
    normalizedResults.saccos.length > 0 ||
    normalizedResults.users.length > 0 ||
    normalizedResults.membership_requests.length > 0

  const closeSearch = () => {
    setOpen(false)
    setSearchQuery('')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent dark:border-slate-700/50"
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-sm">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        aria-label="Open platform search"
      >
        <Search className="w-5 h-5" />
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity" />
          <Dialog.Content className="fixed top-[18%] left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-slate-800">
            <Command className="flex flex-col w-full h-full bg-transparent" label="Platform search" shouldFilter={false}>
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <Command.Input
                  autoFocus
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  placeholder="Search SACCOs, users, or applications..."
                  className="flex-1 px-4 py-4 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={closeSearch}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded"
                >
                  ESC
                </button>
              </div>

              <Command.List className="max-h-[420px] overflow-y-auto p-2 scroll-smooth">
                {isLoading && debouncedQuery.trim().length > 1 && (
                  <div className="py-14 flex items-center justify-center text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#F59E0B]" /> Searching...
                  </div>
                )}

                {!isLoading && debouncedQuery.trim().length > 1 && !hasResults && (
                  <Command.Empty className="py-14 text-center text-sm text-slate-500">
                    No results found for “{debouncedQuery}”.
                  </Command.Empty>
                )}

                {hasResults && (
                  <>
                    {normalizedResults.saccos.length > 0 && (
                      <Command.Group heading={<div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">SACCOs</div>}>
                        {normalizedResults.saccos.map((sacco: any) => (
                          <Command.Item
                            key={`sacco-${sacco.id}`}
                            value={`sacco-${sacco.id}`}
                            onSelect={() => {
                              closeSearch()
                              navigate(`/super-admin/saccos/${sacco.id}`)
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-amber-500/10 aria-selected:text-amber-700 dark:aria-selected:bg-amber-500/10 dark:aria-selected:text-amber-300 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-aria-selected:bg-amber-500/20">
                              <Building2 className="w-4 h-4 text-slate-500 group-aria-selected:text-amber-600 dark:group-aria-selected:text-amber-400" />
                            </div>
                            <div className="flex flex-col flex-1 truncate">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sacco.name}</span>
                              <span className="text-xs text-slate-500">{sacco.registration_number || 'No registration number'} • {sacco.status || 'unknown'}</span>
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {normalizedResults.users.length > 0 && (
                      <Command.Group heading={<div className="px-2 py-1.5 mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Users</div>}>
                        {normalizedResults.users.map((user: any) => (
                          <Command.Item
                            key={`user-${user.id}`}
                            value={`user-${user.id}`}
                            onSelect={() => {
                              closeSearch()
                              navigate('/super-admin/users')
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-sky-500/10 aria-selected:text-sky-700 dark:aria-selected:bg-sky-500/20 dark:aria-selected:text-sky-300 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-aria-selected:bg-sky-500/20">
                              <Users className="w-4 h-4 text-slate-500 group-aria-selected:text-sky-600 dark:group-aria-selected:text-sky-300" />
                            </div>
                            <div className="flex flex-col flex-1 truncate">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>
                              <span className="text-xs text-slate-500">{user.email || user.username || 'No email'} • {user.role || 'user'}</span>
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {normalizedResults.membership_requests.length > 0 && (
                      <Command.Group heading={<div className="px-2 py-1.5 mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Membership Requests</div>}>
                        {normalizedResults.membership_requests.map((request: any) => (
                          <Command.Item
                            key={`request-${request.id}`}
                            value={`request-${request.id}`}
                            onSelect={() => {
                              closeSearch()
                              navigate('/super-admin/saccos?status=pending')
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer aria-selected:bg-emerald-500/10 aria-selected:text-emerald-700 dark:aria-selected:bg-emerald-500/10 dark:aria-selected:text-emerald-300 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-aria-selected:bg-emerald-500/20">
                              <UserRoundPlus className="w-4 h-4 text-slate-500 group-aria-selected:text-emerald-600 dark:group-aria-selected:text-emerald-300" />
                            </div>
                            <div className="flex flex-col flex-1 truncate">
                              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{request.full_name}</span>
                              <span className="text-xs text-slate-500">{request.email || request.phone_number || 'No contact'} • {request.status || 'pending'}</span>
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {request.status || 'pending'}
                            </div>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}

                {debouncedQuery.trim().length <= 1 && (
                  <div className="py-14 text-center text-sm text-slate-500">
                    Type at least 2 characters to search the platform.
                  </div>
                )}
              </Command.List>
            </Command>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

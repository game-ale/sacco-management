import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { LogOut, Loader2 } from 'lucide-react'

export interface LogoutConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
  isLoading?: boolean
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false)
  const isSubmitting = isLoading || internalLoading

  const handleConfirm = async () => {
    if (isSubmitting) return
    try {
      setInternalLoading(true)
      await onConfirm()
    } finally {
      setInternalLoading(false)
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(val) => {
        if (!isSubmitting) {
          onOpenChange(val)
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/50">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-bold text-slate-900 dark:text-white">
                Log out of your account?
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                You can sign in again anytime.
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Logout</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

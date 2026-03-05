import { Home } from 'lucide-react'
import Link from 'next/link'
import { Toaster } from '@/components/ui/sonner'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="p-2 rounded-xl bg-primary">
            <Home className="h-6 w-6 text-primary-foreground" />
          </div>
          <Link href="/" className="text-2xl font-bold">
            NestSeeker
          </Link>
        </div>
        {children}
      </div>
      <Toaster position="bottom-center" />
    </div>
  )
}

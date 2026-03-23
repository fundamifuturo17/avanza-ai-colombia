import { APP_NAME } from '@/lib/constants'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Link href="/" className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-blue-700">{APP_NAME}</h1>
        <p className="text-sm text-muted-foreground mt-1">Colombia</p>
      </Link>
      {children}
    </div>
  )
}

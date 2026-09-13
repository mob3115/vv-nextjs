import Link from 'next/link'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: 'This confirmation link is invalid or has expired. Please register again.',
  confirmation_failed: 'We could not confirm your email. The link may have expired.',
  invalid_reset_link: 'This password reset link is invalid or has expired. Please request a new one.',
  forbidden: 'You don\'t have permission to access that page.',
  default: 'Something went wrong. Please try again.',
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { code?: string }
}) {
  const message = ERROR_MESSAGES[searchParams.code ?? 'default'] ?? ERROR_MESSAGES.default

  return (
    <div className="min-h-screen bg-black-deep flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-5">⚠️</div>
        <h1 className="text-xl font-bold text-white mb-3">Authentication Error</h1>
        <p className="text-sm text-grey-dark leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          {searchParams.code === 'invalid_reset_link' ? (
            <Link href="/auth/forgot-password" className="btn-primary">Request New Link</Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost">Sign In</Link>
              <Link href="/auth/register" className="btn-primary">Create Account</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

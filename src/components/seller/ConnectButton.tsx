'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { recordSwipe } from '@/lib/actions/marketplace'

export function ConnectButton({ buyerId, matchId }: { buyerId: string; matchId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    if (loading) return
    setLoading(true)
    const result = await recordSwipe({ targetBuyerId: buyerId, direction: 'like' })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("It's a match! Opening chat…")
    router.push(`/seller/chat/${matchId}`)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-primary btn-sm"
      style={{ opacity: loading ? 0.6 : 1 }}
    >
      {loading ? 'Connecting…' : 'Connect → Unlock Messaging'}
    </button>
  )
}

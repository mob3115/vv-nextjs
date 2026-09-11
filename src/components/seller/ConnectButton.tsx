'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { recordSwipe } from '@/lib/actions/marketplace'
import { Confetti } from '@/components/shared/Confetti'

export function ConnectButton({ buyerId, matchId }: { buyerId: string; matchId: string }) {
  const [loading, setLoading] = useState(false)
  const [celebrate, setCelebrate] = useState(0)
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

    if (result.matched) {
      toast.success("It's a match! Opening chat…")
      setCelebrate(c => c + 1)
      // Let the confetti actually play before navigating away from this page.
      setTimeout(() => {
        router.push(`/seller/chat/${matchId}`)
        router.refresh()
      }, 900)
    } else {
      toast.success('Connected')
      router.refresh()
    }
  }

  return (
    <>
      <Confetti trigger={celebrate} />
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-primary btn-sm"
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Connecting…' : 'Connect → Unlock Messaging'}
      </button>
    </>
  )
}

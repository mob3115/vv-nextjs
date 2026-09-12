'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { recordSwipe } from '@/lib/actions/marketplace'

// Records a 'pass' swipe against this buyer — the seller/interests query
// excludes buyers the seller has already passed on, so this just removes
// the card from view on refresh. Doesn't touch match/mutual state at all;
// a buyer who was passed on can still become a mutual match independently
// if they like this listing and the seller separately reconsiders via
// Discover Buyers.
export function PassButton({ buyerId }: { buyerId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    if (loading) return
    setLoading(true)
    const result = await recordSwipe({ targetBuyerId: buyerId, direction: 'pass' })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Passed')
    router.refresh()
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-ghost btn-sm" style={{ opacity: loading ? 0.6 : 1 }}>
      {loading ? 'Passing…' : 'Pass'}
    </button>
  )
}

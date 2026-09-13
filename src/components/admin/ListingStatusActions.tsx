'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { setListingStatusAction } from '@/lib/actions/admin'
import type { ListingStatus } from '@/types'

// Admin can move a listing between active/paused/sold — 'draft' is
// excluded since nothing in the current flow ever leaves a listing in
// that state (sellers publish live from registration/ListingForm).
const STATUSES: ListingStatus[] = ['active', 'paused', 'sold']

export function ListingStatusActions({ listingId, status }: { listingId: string; status: ListingStatus }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ListingStatus
    if (next === status) return
    setLoading(true)
    const result = await setListingStatusAction(listingId, next)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Listing updated')
    router.refresh()
  }

  if (status === 'draft') {
    return <span className="badge-grey">draft</span>
  }

  return (
    <select
      className="form-select"
      value={status}
      disabled={loading}
      onChange={handleChange}
      style={{ width: 'auto', padding: '5px 10px', fontSize: '0.76rem' }}
    >
      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  )
}

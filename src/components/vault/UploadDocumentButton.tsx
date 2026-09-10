'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { uploadVaultDocument } from '@/lib/actions/vault'

export function UploadDocumentButton({ tier }: { tier: 'pre-nda' | 'post-nda' }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('tier', tier)
    const result = await uploadVaultDocument(formData)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''

    if (result.error) toast.error(result.error)
    else { toast.success('Document uploaded'); router.refresh() }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="btn-ghost btn-sm"
      >
        {uploading ? 'Uploading…' : '+ Upload'}
      </button>
    </>
  )
}

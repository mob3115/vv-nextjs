'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FileText, Trash2 } from 'lucide-react'
import { getVaultDownloadUrl, deleteVaultDocument } from '@/lib/actions/vault'

interface DocumentRowProps {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  canDelete?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentRow({ id, fileName, fileSize, uploadedAt, canDelete }: DocumentRowProps) {
  const [opening, setOpening] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleOpen() {
    setOpening(true)
    const result = await getVaultDownloadUrl(id)
    setOpening(false)
    if (result.error || !result.url) { toast.error(result.error ?? 'Failed to open document'); return }
    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  async function handleDelete() {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return
    setDeleting(true)
    const result = await deleteVaultDocument(id)
    setDeleting(false)
    if (result.error) toast.error(result.error)
    else { toast.success('Document deleted'); router.refresh() }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #2e2e2e', fontSize: '0.84rem' }}>
      <FileText size={18} strokeWidth={1.75} style={{ color: '#C46A00', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
        <div style={{ fontSize: '0.72rem', color: '#6a6a6a', marginTop: 2 }}>
          {formatBytes(fileSize)} · Uploaded {new Date(uploadedAt).toLocaleDateString()}
        </div>
      </div>
      <button onClick={handleOpen} disabled={opening} className="btn-ghost btn-sm" style={{ flexShrink: 0 }}>
        {opening ? 'Opening…' : 'View →'}
      </button>
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete document"
          className="btn-ghost btn-sm"
          style={{ flexShrink: 0, color: '#d45f5f', padding: '6px 8px' }}
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}

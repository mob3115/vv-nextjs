import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'
import { AccordionCard } from '@/components/shared/AccordionCard'
import { BuyerProfileForm } from '@/components/buyer/BuyerProfileForm'
import { BUYER_NAV } from '@/lib/nav'

export const metadata: Metadata = { title: 'My Profile' }

export default async function BuyerProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileRes, buyerRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('buyer_profiles').select('*').eq('buyer_id', user.id).single(),
  ])

  if (!profileRes.data) redirect('/auth/login')
  const profile = profileRes.data
  const buyer = buyerRes.data

  return (
    <AppShell profile={profile} navItems={BUYER_NAV} role="buyer">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            {buyer ? 'Edit My Buyer Profile' : 'Complete Your Buyer Profile'}
          </h1>
          <p style={{ fontSize: '0.8rem', color: '#929292', marginTop: 2 }}>
            {buyer
              ? 'This is what sellers see in their match queue'
              : 'Fill in your profile to start appearing in seller match queues'}
          </p>
        </div>
      </div>

      <div className="page-body" style={{ maxWidth: 720 }}>
        <AccordionCard title="Personal Info" summary={`${profile.full_name} · ${profile.email}`}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#929292', marginBottom: 4 }}>Full Name</div>
              <div style={{ fontSize: '0.88rem', color: '#fff' }}>{profile.full_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#929292', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: '0.88rem', color: '#fff' }}>{profile.email}</div>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#6a6a6a', margin: 0 }}>
              Changing your name or email isn&apos;t supported here yet — contact support if you need either updated.
            </p>
          </div>
        </AccordionCard>
        <BuyerProfileForm existing={buyer} fullName={profile.full_name} mode="accordion" />
      </div>
    </AppShell>
  )
}

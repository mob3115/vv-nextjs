import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SafeListing, AnonymityLevel } from '@/types'

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Score color based on compatibility
export function scoreColor(score: number): string {
  if (score >= 85) return '#4caf7d'   // success
  if (score >= 70) return '#C46A00'   // orange
  return '#929292'                     // grey
}

// Anonymity-aware display helpers — enforced server-side too
export function getDisplayBusiness(listing: SafeListing): string {
  if (listing.anonymity_level === 1) return '[Business Name Hidden]'
  if (listing.anonymity_level === 2) return '[Full Name Unlocks After NDA]'
  return listing.business_name ?? '[Business Name Hidden]'
}

export function getDisplayName(listing: SafeListing): string {
  if (listing.anonymity_level === 1) return `Anonymous ${listing.industry} Owner`
  if (listing.anonymity_level === 2) return `${listing.owner_first_name ?? ''} — ${listing.industry} Owner`
  return listing.owner_full_name ?? 'Unknown'
}

export function getDisplayLocation(listing: SafeListing): string {
  if (listing.anonymity_level === 1) return listing.location_region
  return listing.location_city ?? listing.location_region
}

export function getDisplayRevenue(listing: SafeListing): string {
  if (listing.anonymity_level === 3 && listing.revenue_exact) return listing.revenue_exact
  return listing.revenue_band
}

export function anonLabel(level: AnonymityLevel): string {
  return ['', 'Anonymous', 'Partial ID', 'Full Reveal'][level]
}

// Format currency
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

// Compatibility score breakdown
export function scoreBreakdown(score: number) {
  return [
    { label: 'Values Match',  value: Math.round(score) },
    { label: 'Industry Fit',  value: Math.min(100, Math.round(score * 0.95)) },
    { label: 'Price Overlap', value: Math.min(100, Math.round(score * 0.88)) },
    { label: 'Geography',     value: Math.min(100, Math.round(score * 0.92)) },
  ]
}

// Server-side anonymity enforcement
// Called in server actions / route handlers before sending data to client
export function enforceAnonymity(listing: SellerListing, ndaSigned: boolean): SafeListing {
  const level = ndaSigned ? 3 : listing.anonymity_level
  return {
    ...listing,
    anonymity_level: level as AnonymityLevel,
    business_name:      level >= 3 ? listing.business_name : null,
    owner_full_name:    level >= 3 ? listing.owner_full_name : null,
    revenue_exact:      level >= 3 ? listing.revenue_exact : null,
    asking_price_exact: level >= 3 ? listing.asking_price_exact : null,
    ebitda:             level >= 3 ? listing.ebitda : null,
    owner_first_name:   level >= 2 ? listing.owner_first_name : null,
    location_city:      level >= 2 ? listing.location_city : null,
    compatibility_score: 0, // set by caller
  }
}

// Needs import for the above
import type { SellerListing } from '@/types'

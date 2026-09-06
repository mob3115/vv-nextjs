// Centralized nav configs — import these into every page
// so nav is always in sync across buyer, seller, and admin

export const BUYER_NAV = [
  { href: '/buyer/discover',  label: 'Discover',    icon: '◈' },
  { href: '/buyer/matches',   label: 'My Matches',  icon: '♥' },
  { href: '/buyer/chat',      label: 'Messages',    icon: '◻' },
  { href: '/buyer/nda',       label: 'NDAs',        icon: '◇' },
  { href: '/buyer/profile',   label: 'My Profile',  icon: '○' },
  { href: '/seller/dashboard',label: 'Seller Mode', icon: '⇄' },
]

export const SELLER_NAV = [
  { href: '/seller/dashboard', label: 'Dashboard',       icon: '▤' },
  { href: '/seller/listing',   label: 'My Listing',      icon: '▣' },
  { href: '/seller/discover',  label: 'Discover Buyers', icon: '◈' },
  { href: '/seller/interests', label: 'Buyer Interest',  icon: '◉' },
  { href: '/seller/vault',     label: 'Document Vault',  icon: '▦' },
  { href: '/seller/chat',      label: 'Messages',        icon: '◻' },
  { href: '/buyer/discover',   label: 'Buyer Mode',      icon: '⇄' },
]

export const ADMIN_NAV = [
  { href: '/admin/overview',  label: 'Overview',   icon: '▤' },
  { href: '/admin/users',     label: 'Users',      icon: '○' },
  { href: '/admin/listings',  label: 'Listings',   icon: '▣' },
  { href: '/admin/audit',     label: 'Audit Log',  icon: '◇' },
  { href: '/auth/login',      label: 'Exit Admin', icon: '←' },
]

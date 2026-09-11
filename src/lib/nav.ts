// Centralized nav configs — import these into every page
// so nav is always in sync across buyer, seller, and admin
//
// `icon` keys into NAV_ICONS (src/lib/icons.tsx) — see AppShell for rendering.

export const BUYER_NAV = [
  { href: '/buyer/discover',  label: 'Discover',    icon: 'discover' },
  { href: '/buyer/matches',   label: 'My Matches',  icon: 'matches' },
  { href: '/buyer/chat',      label: 'Messages',    icon: 'messages' },
  { href: '/buyer/nda',       label: 'NDAs',        icon: 'ndas' },
  { href: '/buyer/profile',   label: 'My Profile',  icon: 'profile' },
  { href: '/seller/dashboard',label: 'Seller Mode', icon: 'switchMode' },
]

export const SELLER_NAV = [
  { href: '/seller/dashboard', label: 'Dashboard',       icon: 'dashboard' },
  { href: '/seller/listing',   label: 'My Listing',      icon: 'listing' },
  { href: '/seller/discover',  label: 'Discover Buyers', icon: 'discover' },
  { href: '/seller/interests', label: 'Buyer Interest',  icon: 'interests' },
  { href: '/seller/vault',     label: 'Document Vault',  icon: 'vault' },
  { href: '/seller/chat',      label: 'Messages',        icon: 'messages' },
  { href: '/buyer/discover',   label: 'Buyer Mode',      icon: 'switchMode' },
]

export const ADMIN_NAV = [
  { href: '/admin/overview',  label: 'Overview',   icon: 'dashboard' },
  { href: '/admin/users',     label: 'Users',      icon: 'profile' },
  { href: '/admin/listings',  label: 'Listings',   icon: 'listing' },
  { href: '/admin/audit',     label: 'Audit Log',  icon: 'auditLog' },
  { href: '/auth/login',      label: 'Exit Admin', icon: 'exit' },
]

// ============================================================
// Central icon registry — one consistent icon set (Lucide) instead of a
// mix of literal emoji and ad-hoc Unicode glyphs scattered across pages.
// ============================================================

import {
  Compass, Heart, MessageCircle, FileSignature, User, ArrowLeftRight,
  LayoutDashboard, Store, Users, FolderLock, ScrollText, LogOut,
  Factory, HeartPulse, UtensilsCrossed, GraduationCap, Leaf, PartyPopper,
  Trees, Newspaper, PawPrint, ShieldCheck, Briefcase, HandHeart, Cpu,
  ShoppingBag, HardHat, Truck, Landmark, MoreHorizontal,
  Eye, EyeOff, CheckCircle2, X, Inbox, FileText, type LucideIcon,
} from 'lucide-react'

// ---- Nav icons ----
export const NAV_ICONS: Record<string, LucideIcon> = {
  discover: Compass,
  matches: Heart,
  messages: MessageCircle,
  ndas: FileSignature,
  profile: User,
  switchMode: ArrowLeftRight,
  dashboard: LayoutDashboard,
  listing: Store,
  interests: Users,
  vault: FolderLock,
  auditLog: ScrollText,
  exit: LogOut,
}

// ---- Industry icons ----
export const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  'Manufacturing': Factory,
  'Healthcare': HeartPulse,
  'Food & Beverage': UtensilsCrossed,
  'Education Technology': GraduationCap,
  'Environmental Services': Leaf,
  'Events & Hospitality': PartyPopper,
  'Landscaping & Property Services': Trees,
  'Media & Publishing': Newspaper,
  'Veterinary / Animal Health': PawPrint,
  'Security & Risk': ShieldCheck,
  'Professional Services': Briefcase,
  'Senior Care': HandHeart,
  'Technology': Cpu,
  'Retail': ShoppingBag,
  'Construction': HardHat,
  'Transportation & Logistics': Truck,
  'Finance & Insurance': Landmark,
  'Other': MoreHorizontal,
}

export function getIndustryIcon(industry: string | null | undefined): LucideIcon {
  return (industry && INDUSTRY_ICONS[industry]) || MoreHorizontal
}

// ---- Anonymity levels ----
export const ANON_ICONS: Record<1 | 2 | 3, LucideIcon> = {
  1: EyeOff,
  2: Eye,
  3: CheckCircle2,
}

// ---- Swipe actions ----
export const SWIPE_ICONS = { like: Heart, pass: X }

// ---- Misc / empty states ----
export const MISC_ICONS = { inbox: Inbox, document: FileText }

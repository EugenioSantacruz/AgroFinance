import React from 'react';
import {
  Landmark,
  Wallet,
  CreditCard,
  Wheat,
  Sprout,
  Fuel,
  Truck,
  Tractor,
  Beef,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  SlidersHorizontal,
  Receipt,
  Coins,
  CalendarClock,
  Layers,
  Wrench,
  Droplets,
  Scale,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Fingerprint,
  RefreshCw,
  ChevronRight,
  Plus,
  Filter,
  Sun,
  Moon,
  Briefcase,
  Home,
  User,
  Banknote,
  Calendar,
  Clock,
  XCircle,
  Trash2,
  ShoppingBag,
  HeartPulse,
  Car,
  Check,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  LucideProps,
} from 'lucide-react-native';

export type AgroIconName =
  | 'Landmark'
  | 'Wallet'
  | 'CreditCard'
  | 'Wheat'
  | 'Sprout'
  | 'Fuel'
  | 'Truck'
  | 'Tractor'
  | 'Beef'
  | 'ShieldCheck'
  | 'TrendingUp'
  | 'TrendingDown'
  | 'ArrowLeftRight'
  | 'SlidersHorizontal'
  | 'Receipt'
  | 'Coins'
  | 'CalendarClock'
  | 'Layers'
  | 'Wrench'
  | 'Droplets'
  | 'Scale'
  | 'Building2'
  | 'CheckCircle2'
  | 'AlertTriangle'
  | 'Eye'
  | 'EyeOff'
  | 'Lock'
  | 'Fingerprint'
  | 'RefreshCw'
  | 'ChevronRight'
  | 'Plus'
  | 'Filter'
  | 'Sun'
  | 'Moon'
  | 'Briefcase'
  | 'Home'
  | 'User'
  | 'Banknote'
  | 'Calendar'
  | 'Clock'
  | 'XCircle'
  | 'Trash2'
  | 'ShoppingBag'
  | 'HeartPulse'
  | 'Car'
  | 'Check'
  | 'FileText'
  | 'ArrowUpRight'
  | 'ArrowDownLeft';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Landmark,
  Wallet,
  CreditCard,
  Wheat,
  Sprout,
  Fuel,
  Truck,
  Tractor,
  Beef,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  SlidersHorizontal,
  Receipt,
  Coins,
  CalendarClock,
  Layers,
  Wrench,
  Droplets,
  Scale,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Lock,
  Fingerprint,
  RefreshCw,
  ChevronRight,
  Plus,
  Filter,
  Sun,
  Moon,
  Briefcase,
  Home,
  User,
  Banknote,
  Calendar,
  Clock,
  XCircle,
  Trash2,
  ShoppingBag,
  HeartPulse,
  Car,
  Check,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
};

export function getAgroIcon(
  name?: string
): React.ComponentType<LucideProps> {
  if (!name) return Layers;
  return ICON_MAP[name] || Layers;
}

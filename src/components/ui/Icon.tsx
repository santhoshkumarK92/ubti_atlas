import {
  Building2, HardHat, Factory, Ship, HeartPulse, Landmark, ShieldCheck, ShoppingBag, Flame, Wheat, Car, Hotel, Plane,
  GraduationCap, TrendingUp, Briefcase, Cpu, Database, Globe, Zap, type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  Building2, HardHat, Factory, Ship, HeartPulse, Landmark, ShieldCheck, ShoppingBag, Flame, Wheat, Car, Hotel, Plane,
  GraduationCap, TrendingUp, Briefcase, Cpu, Database, Globe, Zap,
};
export const ICON_NAMES = Object.keys(MAP);

export function Icon({ name, className }: { name?: string; className?: string }) {
  const C = (name && MAP[name]) || Briefcase;
  return <C className={className} strokeWidth={1.6} />;
}

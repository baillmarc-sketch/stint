import {
  Camera,
  ChefHat,
  Flower2,
  Music,
  PartyPopper,
  Sparkles,
  SprayCan,
  Users,
  type LucideProps,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  ChefHat,
  Music,
  Sparkles,
  PartyPopper,
  Users,
  SprayCan,
  Flower2,
  Camera,
};

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon {...props} />;
}

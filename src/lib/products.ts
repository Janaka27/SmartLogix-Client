import {
  BoxIcon,
  CameraIcon,
  CoffeeIcon,
  EarbudsIcon,
  HeadphonesIcon,
  LaptopIcon,
  PhoneStandIcon,
  PianoIcon,
  PurifierIcon,
  SpeakerIcon,
  VacuumIcon,
} from "@/components/icons";

export type WeightClass = "Standard" | "Heavy";
export type ProductIcon = (props: { className?: string }) => React.JSX.Element;

export interface DisplayProduct {
  id: string;
  name: string;
  category: string;
  seller: string;
  rating: number;
  reviews: number;
  price: number;
  weightClass: WeightClass;
  eta: string;
  icon: ProductIcon;
  images: string[];
}

export interface DbProduct {
  id: string;
  name: string;
  category: string | null;
  price: number;
  weight_kg: number;
  status: string;
  images: string[] | null;
}

const KEYWORD_ICONS: [RegExp, ProductIcon][] = [
  [/phone.?stand|phone holder/i, PhoneStandIcon],
  [/headphone|headset/i, HeadphonesIcon],
  [/earbud|tws/i, EarbudsIcon],
  [/speaker/i, SpeakerIcon],
  [/camera|cctv/i, CameraIcon],
  [/piano|keyboard/i, PianoIcon],
  [/purifier/i, PurifierIcon],
  [/coffee|brew/i, CoffeeIcon],
  [/vacuum|cleaner/i, VacuumIcon],
  [/laptop|macbook|notebook|tuf|asus|dell|lenovo/i, LaptopIcon],
];

function iconForProduct(name: string): ProductIcon {
  const match = KEYWORD_ICONS.find(([pattern]) => pattern.test(name));
  return match ? match[1] : BoxIcon;
}

// Deterministic pseudo rating/reviews/eta derived from the product id, since
// the schema doesn't store these yet (see CLAUDE.md — not part of the
// buyer-facing product fields spec). Stable across renders, not random.
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pseudoRating(id: string): number {
  const h = hashString(id);
  return Math.round((4.3 + (h % 71) / 100) * 10) / 10; // 4.3 - 5.0
}

function pseudoReviews(id: string): number {
  const h = hashString(id + "reviews");
  return 40 + (h % 2200);
}

function pseudoEta(id: string): string {
  const h = hashString(id + "eta");
  return `${15 + (h % 34)} min`;
}

export function toDisplayProduct(p: DbProduct, sellerName: string): DisplayProduct {
  return {
    id: p.id,
    name: p.name,
    category: p.category ?? "Other",
    seller: sellerName,
    rating: pseudoRating(p.id),
    reviews: pseudoReviews(p.id),
    price: Number(p.price),
    weightClass: p.weight_kg > 5 ? "Heavy" : "Standard",
    eta: pseudoEta(p.id),
    icon: iconForProduct(p.name),
    images: p.images ?? [],
  };
}

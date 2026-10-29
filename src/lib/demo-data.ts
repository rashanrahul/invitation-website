import type { Category, Invitation, Review } from "@/lib/types";

export const demoCategories: Category[] = [
  { id: "wedding", name_en: "Weddings", name_si: "මංගල", slug: "weddings", active: true },
  { id: "birthday", name_en: "Birthdays", name_si: "උපන්දිනය", slug: "birthdays", active: true },
  { id: "corporate", name_en: "Corporate", name_si: "ආයතනික", slug: "corporate", active: true },
  { id: "cricket", name_en: "Cricket", name_si: "ක්‍රිකට්", slug: "cricket", active: true },
];

export const demoInvitations: Invitation[] = [
  {
    id: "wedding-blush",
    category_id: "wedding",
    title_en: "The Blush Garden",
    title_si: "රෝස මල් උයන",
    description_en: "Soft florals, warm paper & a little bit of magic.",
    description_si: "සියුම් මල්, උණුසුම් පැහැ සහ පුංචි මැජික්.",
    price: 4500,
    image_url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85",
    featured: true,
  },
  {
    id: "birthday-sunshine",
    category_id: "birthday",
    title_en: "A Little Sunshine",
    title_si: "හිරු එළියේ සතුට",
    description_en: "A bright, happy hello for your favourite person.",
    description_si: "ඔබේ ප්‍රියතම පුද්ගලයා වෙනුවෙන් සතුටින් පිරුණු ආරාධනාවක්.",
    price: 2800,
    image_url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=85",
    featured: false,
  },
  {
    id: "wedding-sundown",
    category_id: "wedding",
    title_en: "Sundown Promise",
    title_si: "හිරු බැස යන පොරොන්දුව",
    description_en: "A little golden hour, captured on paper.",
    description_si: "රන්වන් සැන්දෑවක සොඳුරු මතකයක්.",
    price: 5200,
    image_url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=85",
    featured: false,
  },
  {
    id: "corporate-modern",
    category_id: "corporate",
    title_en: "The Good Gathering",
    title_si: "සොඳුරු හමුව",
    description_en: "A polished invite for the people who make it happen.",
    description_si: "ඔබේ විශේෂ ආයතනික හමුව සඳහා නවීන ආරාධනාවක්.",
    price: 6000,
    image_url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85",
    featured: false,
  },
  {
    id: "cricket-match",
    category_id: "cricket",
    title_en: "Game Day",
    title_si: "තරග දිනය",
    description_en: "Bring your team together for a match to remember.",
    description_si: "මතකයේ රැඳෙන තරගයකට ඔබේ කණ්ඩායම එක් කරන්න.",
    price: 3200,
    image_url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1000&q=85",
    featured: true,
  },
  {
    id: "birthday-candle",
    category_id: "birthday",
    title_en: "One More Candle",
    title_si: "තවත් ඉටිපන්දමක්",
    description_en: "A sweet little something for their biggest day.",
    description_si: "ඔවුන්ගේ විශේෂ දවසට පුංචි මිහිරි තිළිණයක්.",
    price: 2500,
    image_url: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1000&q=85",
    featured: false,
  },
];

export const demoReviews: Review[] = [];

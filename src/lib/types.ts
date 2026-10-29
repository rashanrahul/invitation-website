export type Category = {
  id: string;
  name_en: string;
  name_si: string;
  slug: string;
  active: boolean;
};

export type Invitation = {
  id: string;
  category_id: string;
  title_en: string;
  title_si: string;
  description_en: string;
  description_si: string;
  price: number;
  image_url: string;
  featured: boolean;
  active?: boolean;
};

export type OrderStatus = "received" | "designing" | "review" | "completed";

export type TrackedOrder = {
  tracking_code: string;
  invitation_title: string;
  customer_name: string;
  status: OrderStatus;
  created_at: string;
  event_date: string | null;
};

export type AdminOrder = TrackedOrder & {
  id: string;
  contact_details: string;
  event_details: string;
};

export type Review = {
  id: string;
  customer_name: string;
  rating: number;
  feedback: string;
  created_at?: string;
  approved?: boolean;
};

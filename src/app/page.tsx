"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Flower2,
  Gift,
  Heart,
  LoaderCircle,
  Menu,
  PackageCheck,
  PartyPopper,
  Search,
  Send,
  Sparkles,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  demoCategories,
  demoInvitations,
  demoReviews,
} from "@/lib/demo-data";
import type {
  Category,
  Invitation,
  OrderStatus,
  Review,
  TrackedOrder,
} from "@/lib/types";

type Language = "en" | "si";

const categoryIcons = [Flower2, Gift, PartyPopper, Trophy];

const statusLabels: Record<Language, Record<OrderStatus, string>> = {
  en: {
    received: "Order received",
    designing: "Designing",
    review: "Your approval",
    completed: "Completed",
  },
  si: {
    received: "à¶‡à¶«à·€à·”à¶¸ à¶½à·à¶¶à·”à¶«à·",
    designing: "à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶šà¶»à¶¸à·’à¶±à·Š",
    review: "à¶”à¶¶à·š à¶…à¶±à·”à¶¸à·à¶­à·’à¶º",
    completed: "à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶«à¶ºà·’",
  },
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [invitations, setInvitations] =
    useState<Invitation[]>(demoInvitations);
  const [reviews, setReviews] = useState<Review[]>(demoReviews);
  const [language, setLanguage] = useState<Language>("en");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null);
  const [notice, setNotice] = useState("");
  const [orderBusy, setOrderBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [trackBusy, setTrackBusy] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [trackCode, setTrackCode] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const supabase = useMemo(() => getSupabase(), []);
  const text = (english: string, sinhala: string) =>
    language === "si" ? sinhala : english;

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
  }

  useEffect(() => {
    async function loadContent(client: NonNullable<typeof supabase>) {
      const [categoryResult, invitationResult, reviewResult] =
        await Promise.all([
          client
            .from("categories")
            .select("id,name_en,name_si,slug,active")
            .eq("active", true)
            .order("name_en"),
          client
            .from("invitations")
            .select(
              "id,category_id,title_en,title_si,description_en,description_si,price,image_url,featured",
            )
            .eq("active", true)
            .order("featured", { ascending: false })
            .order("created_at", { ascending: false }),
          client
            .from("reviews")
            .select("id,customer_name,rating,feedback,created_at")
            .eq("approved", true)
            .order("created_at", { ascending: false })
            .limit(6),
        ]);

      if (categoryResult.error || invitationResult.error || reviewResult.error) {
        setNotice(
          "Couldn't connect to the shop right now. Please try again later.",
        );
        return;
      }

      setCategories(categoryResult.data ?? []);
      if (invitationResult.data) setInvitations(invitationResult.data);
      setReviews(reviewResult.data ?? []);
    }

    if (supabase) void loadContent(supabase);
  }, [supabase]);

  const visibleInvitations = invitations.filter((invitation) => {
    const matchesCategory =
      activeCategory === "all" || invitation.category_id === activeCategory;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${invitation.title_en} ${invitation.title_si} ${invitation.description_en} ${invitation.description_si}`
        .toLowerCase()
        .includes(query);
    return matchesCategory && matchesSearch;
  });

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedInvitation) return;
    if (!supabase) {
      setNotice(
        text("Connect your Supabase project to place an order.", "à¶‡à¶«à·€à·”à¶¸à·Š à¶½à¶¶à·à¶œà·à¶±à·“à¶¸à¶§ Supabase à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶° à¶šà¶»à¶±à·Šà¶±."),
      );
      return;
    }

    const formData = new FormData(event.currentTarget);
    const trackingCode = crypto.randomUUID();
    setOrderBusy(true);
    setNotice("");

    const { error } = await supabase.from("orders").insert({
      tracking_code: trackingCode,
      invitation_id: selectedInvitation.id,
      invitation_title: selectedInvitation.title_en,
      customer_name: String(formData.get("name") ?? "").trim(),
      contact_details: String(formData.get("contact") ?? "").trim(),
      event_date: String(formData.get("event_date") ?? "") || null,
      event_details: String(formData.get("details") ?? "").trim(),
    });

    setOrderBusy(false);
    if (error) {
      setNotice(`${text("Order couldn't be placed", "à¶‡à¶«à·€à·”à¶¸ à¶ºà·à·€à·“à¶¸à¶§ à¶±à·œà·„à·à¶šà·’ à·€à·’à¶º")}: ${error.message}`);
      return;
    }

    setSelectedInvitation(null);
    setTrackCode(trackingCode);
    setTrackedOrder(null);
    setNotice(
      `${text("Order placed! Save your tracking code", "à¶‡à¶«à·€à·”à¶¸ à·ƒà·à¶»à·Šà¶®à¶šà¶ºà·’! à¶”à¶¶à·š tracking code à¶‘à¶š à·ƒà·”à¶»à¶šà·’à¶±à·Šà¶±")}: ${trackingCode}`,
    );
    document.getElementById("track-order")?.scrollIntoView({ behavior: "smooth" });
  }

  async function trackOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setNotice(
        text("Connect your Supabase project to track orders.", "à¶‡à¶«à·€à·”à¶¸à·Š à¶´à¶»à·“à¶šà·Šà·‚à· à¶šà·’à¶»à·“à¶¸à¶§ Supabase à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶° à¶šà¶»à¶±à·Šà¶±."),
      );
      return;
    }

    setTrackBusy(true);
    setTrackedOrder(null);
    setNotice("");
    const { data, error } = await supabase.rpc("track_order", {
      order_code: trackCode.trim(),
    });
    setTrackBusy(false);

    if (error) {
      setNotice(`${text("Couldn't look up the order", "à¶‡à¶«à·€à·”à¶¸ à·ƒà·œà¶ºà·à¶œà·à¶±à·“à¶¸à¶§ à¶±à·œà·„à·à¶šà·’ à·€à·’à¶º")}: ${error.message}`);
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      setNotice(
        text("No order found. Check the tracking code and try again.", "à¶‡à¶«à·€à·”à¶¸à¶šà·Š à·„à¶¸à·” à¶±à·œà·€à·“à¶º. tracking code à¶‘à¶š à¶´à¶»à·“à¶šà·Šà·‚à· à¶šà¶» à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±."),
      );
      return;
    }
    setTrackedOrder(result as TrackedOrder);
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!supabase) {
      setNotice(
        text("Connect your Supabase project to send a review.", "à¶…à¶¯à·„à·ƒà¶šà·Š à¶ºà·à·€à·“à¶¸à¶§ Supabase à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶° à¶šà¶»à¶±à·Šà¶±."),
      );
      return;
    }

    const formData = new FormData(event.currentTarget);
    setReviewBusy(true);
    setNotice("");
    const { error } = await supabase.from("reviews").insert({
      customer_name: String(formData.get("review_name") ?? "").trim(),
      rating: Number(formData.get("rating")),
      feedback: String(formData.get("feedback") ?? "").trim(),
    });
    setReviewBusy(false);

    if (error) {
      setNotice(`${text("Review couldn't be sent", "à¶…à¶¯à·„à·ƒ à¶ºà·à·€à·“à¶¸à¶§ à¶±à·œà·„à·à¶šà·’ à·€à·’à¶º")}: ${error.message}`);
      return;
    }
    form.reset();
    setNotice(
      text("Thank you! Your review will appear after approval.", "à·ƒà·Šà¶­à·”à¶­à·’à¶ºà·’! à¶…à¶±à·”à¶¸à·à¶­à·’à¶ºà·™à¶±à·Š à¶´à·ƒà·” à¶”à¶¶à·š à¶…à¶¯à·„à·ƒ à¶´à·… à¶šà·™à¶»à·š."),
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home" aria-label={text("Aradhana home", "à¶†à¶»à·à¶°à¶±à· à¶¸à·”à¶½à·Š à¶´à·’à¶§à·”à·€")}>
          <span className="brand-mark"><Flower2 size={21} strokeWidth={1.7} /></span>
          <span className="brand-name"><span className="brand-word">ARADHANA<span className="brand-period">.</span></span><small className="brand-tag">INVITATION</small></span>
        </a>
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={text("Toggle navigation", "à¶¸à·™à¶±à·”à·€ à·€à·’à·€à·˜à¶­ à¶šà¶»à¶±à·Šà¶±")}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`main-nav ${mobileMenuOpen ? "is-open" : ""}`}>
          <a href="#collection" onClick={() => setMobileMenuOpen(false)}>{text("Our designs", "à¶…à¶´à·š à¶±à·’à¶»à·Šà¶¸à·à¶«")}</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>{text("How it works", "à·ƒà·šà·€à·à·€")}</a>
          <a href="#reviews" onClick={() => setMobileMenuOpen(false)}>{text("Reviews", "à¶´à·à¶»à·’à¶·à·à¶œà·’à¶š à¶…à¶¯à·„à·ƒà·Š")}</a>
        </nav>
        <div className="header-actions">
          <div className="language-switch" role="group" aria-label={text("Choose language", "à¶·à·à·‚à·à·€ à¶­à·à¶»à¶±à·Šà¶±")}>
            <button type="button" className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => changeLanguage("en")}>EN</button>
            <button type="button" className={language === "si" ? "active" : ""} aria-pressed={language === "si"} onClick={() => changeLanguage("si")}>à·ƒà·’à¶‚</button>
          </div>
          <a className="header-cta" href="#track-order">{text("Track an order", "à¶‡à¶«à·€à·”à¶¸ à·ƒà·œà¶ºà¶±à·Šà¶±")} <ArrowUpRight size={15} /></a>
        </div>
      </header>
      {!supabase && <div className="preview-mode-banner" role="note">{text("Preview mode â€” connect Supabase to accept orders, track progress and manage your studio.", "à¶´à·™à¶»à¶¯à·ƒà·”à¶±à·Š à¶´à·Šâ€à¶»à¶šà·à¶»à¶º â€” à¶‡à¶«à·€à·”à¶¸à·Š à¶·à·à¶» à¶œà·à¶±à·“à¶¸à¶§, à¶­à¶­à·Šà¶­à·Šà·€à¶º à¶´à¶»à·“à¶šà·Šà·‚à· à¶šà·’à¶»à·“à¶¸à¶§ à·ƒà·„ à¶šà·…à¶¸à¶±à·à¶šà¶»à¶«à¶ºà¶§ Supabase à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶° à¶šà¶»à¶±à·Šà¶±.")}</div>}

      <section className="hero-section" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> {text("MADE FOR YOUR MOMENTS", "à¶”à¶¶à·š à·€à·’à·à·šà·‚ à¶¸à·œà·„à·œà¶­à¶§")}</div>
          <h1>{text("Your day.", "à¶”à¶¶à·š à¶¯à·’à¶±à¶º.")}<br /><em>{text("Your invitation.", "à¶”à¶¶à·š à¶†à¶»à·à¶°à¶±à·à·€.")}</em></h1>
          <p className="hero-lead">{text("Beautiful invitations, made personal.", "à¶”à¶¶ à·€à·™à¶±à·”à·€à·™à¶±à·Šà¶¸ à·ƒà·à¶šà·ƒà·– à¶½à·ƒà·Šà·ƒà¶± à¶†à¶»à·à¶°à¶±à·.")}</p>
          <p className="hero-description">
            {text("Thoughtfully designed invitations for the moments youâ€™ll remember forever. Choose a design, make it yours, and let the celebrating begin.", "à¶”à¶¶à¶§ à·„à·à¶¸à¶¯à·à¶¸ à¶¸à¶­à¶šà¶ºà·š à¶»à·à¶³à·™à¶± à¶¸à·œà·„à·œà¶­à·€à¶½à·Š à·ƒà¶³à·„à· à¶†à¶¯à¶»à¶ºà·™à¶±à·Š à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶šà·… à¶†à¶»à·à¶°à¶±à·. à¶”à¶¶ à¶šà·à¶¸à¶­à·’ à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶­à·à¶»à·, à¶”à¶¶à·š à·€à·’à·ƒà·Šà¶­à¶» à¶‘à¶šà·Š à¶šà¶», à·ƒà·à¶¸à¶»à·”à¶¸ à¶…à¶»à¶¹à¶±à·Šà¶±.")}
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="#collection">{text("Explore invitations", "à¶†à¶»à·à¶°à¶±à· à¶¶à¶½à¶±à·Šà¶±")} <ArrowRight size={17} /></a>
            <a className="text-link" href="#how-it-works">{text("How it works", "à·ƒà·šà·€à·à·€")} <ArrowDown size={14} /></a>
          </div>
          <div className="hero-proof"><div className="proof-avatars"><span>à¶±</span><span>à¶†</span><span>à·ƒ</span></div><p><strong>{text("Made with a little extra love", "à¶†à¶¯à¶»à¶ºà·™à¶±à·Š à·ƒà·à¶šà·ƒà·– à¶±à·’à¶»à·Šà¶¸à·à¶«")}</strong><br />{text("Thoughtful details, just for you", "à¶”à¶¶ à·€à·™à¶±à·”à·€à·™à¶±à·Šà¶¸ à·ƒà·’à¶­à·– à·€à·’à·à·šà·‚à¶­à·Šà·€à¶º")}</p><div className="proof-stars"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div></div>
        </div>

        <div className="hero-art" aria-label={text("A selection of elegant invitation designs", "à¶…à¶½à¶‚à¶šà·à¶» à¶†à¶»à·à¶°à¶±à· à¶±à·’à¶»à·Šà¶¸à·à¶« à¶‘à¶šà¶­à·”à·€à¶šà·Š")}>
          <div className="hero-image hero-image-large">
            <div className="hero-image-wash" />
            <div className="floating-note">
              <span className="note-sparkle"><Sparkles size={15} /></span>
              <span>{text("Made with love", "à¶†à¶¯à¶»à¶ºà·™à¶±à·Š à·ƒà·à¶šà·ƒà·–")}<small>{text("Just for your day", "à¶”à¶¶à·š à¶¯à·’à¶±à¶º à·€à·™à¶±à·”à·€à·™à¶±à·Š")}</small></span>
              <Heart size={16} className="note-heart" />
            </div>
          </div>
          <div className="hero-image hero-image-small" />
          <div className="hero-sticker"><span>{language === "si" ? <>à¶”à¶¶à·š<br />à¶¯à·€à·ƒ,<br /><em>à¶”à¶¶à·š à·€à·’à¶¯à·’à·„à¶§</em></> : <>your<br />day, your<br /><em>way</em></>}</span><Sparkles size={13} /></div>
          <div className="hero-caption">{text("01 â€” A LITTLE PREVIEW", "01 â€” à¶šà·”à¶©à· à¶´à·™à¶»à¶¯à·ƒà·”à¶±à¶šà·Š")}</div>
        </div>
        <div className="hero-side-label">{text("DESIGNED IN SRI LANKA Â· MADE FOR YOU", "à·à·Šâ€à¶»à·“ à¶½à¶‚à¶šà·à·€à·š à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º Â· à¶”à¶¶ à·€à·™à¶±à·”à·€à·™à¶±à·Š")}</div>
      </section>

      <section className="category-strip" aria-label="Invitation categories">
        <div className="category-intro"><span>{text("CELEBRATE YOUR WAY", "à·ƒà¶­à·”à¶§à·” à¶¸à·œà·„à·œà¶­à¶šà·Š à·ƒà¶¸à¶»à¶¸à·”")}</span><p>{text("What are we", "à¶…à¶¯ à¶…à¶´à·’")}<br />{text("celebrating?", "à·ƒà¶¸à¶»à¶±à·Šà¶±à·š à¶šà·”à¶¸à¶šà·Šà¶¯?")}</p></div>
        {categories.map((category, index) => {
          const Icon = categoryIcons[index % categoryIcons.length];
          return (
            <button
              className={`category-tile ${activeCategory === category.id ? "is-selected" : ""}`}
              key={category.id}
              type="button"
              onClick={() => {
                setActiveCategory(activeCategory === category.id ? "all" : category.id);
                document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <span className="category-icon"><Icon size={20} strokeWidth={1.5} /></span>
              <span className="category-name">{language === "si" ? category.name_si : category.name_en}<small>{language === "si" ? category.name_en : category.name_si}</small></span>
              <ArrowUpRight size={15} className="category-arrow" />
            </button>
          );
        })}
      </section>

      <section className="collection-section section-shell" id="collection">
        <div className="section-heading">
          <div><span className="eyebrow">{text("A LITTLE SOMETHING FOR EVERY OCCASION", "à·ƒà·‘à¶¸ à¶…à·€à·ƒà·Šà¶®à·à·€à¶šà¶§à¶¸ à¶†à¶»à·à¶°à¶±à·à·€à¶šà·Š")}</span><h2>{text("Find the", "à¶”à¶¶à·š")} <em>{text("feeling.", "à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶­à·à¶»à¶±à·Šà¶±.")}</em></h2><p>{text("Browse the collection, choose a favourite, and make it yours.", "à¶±à·’à¶»à·Šà¶¸à·à¶« à¶¶à¶½à¶±à·Šà¶±, à¶”à¶¶ à¶šà·à¶¸à¶­à·’ à¶‘à¶š à¶­à·à¶»à· à¶”à¶¶à·š à·€à·’à·ƒà·Šà¶­à¶» à¶‘à¶šà·Š à¶šà¶»à¶±à·Šà¶±.")}</p></div>
          <a className="text-link" href="#track-order">{text("Already placed an order?", "à¶‡à¶«à·€à·”à¶¸à¶šà·Š à¶šà·…à·à¶¯?")} <ArrowUpRight size={15} /></a>
        </div>
        <div className="collection-toolbar">
          <div className="filter-pills">
            <button type="button" className={activeCategory === "all" ? "filter-pill active" : "filter-pill"} onClick={() => setActiveCategory("all")}>{text("All designs", "à·ƒà·’à¶ºà¶½à·” à¶±à·’à¶»à·Šà¶¸à·à¶«")}</button>
            {categories.map((category) => <button type="button" className={activeCategory === category.id ? "filter-pill active" : "filter-pill"} key={category.id} onClick={() => setActiveCategory(category.id)}>{language === "si" ? category.name_si : category.name_en}</button>)}
          </div>
          <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text("Find your perfect invite...", "à¶”à¶¶ à¶šà·à¶¸à¶­à·’ à¶†à¶»à·à¶°à¶±à·à·€ à·ƒà·œà¶ºà¶±à·Šà¶±...")} aria-label={text("Search invitations", "à¶†à¶»à·à¶°à¶±à· à·ƒà·œà¶ºà¶±à·Šà¶±")} /><ChevronDown size={14} className="search-chevron" /></label>
        </div>

        <div className="invitation-grid">
          {visibleInvitations.map((invitation, index) => (
            <article className="invitation-card" key={invitation.id}>
              <div className={`invitation-image invitation-image-${index % 6}`} style={{ backgroundImage: `url("${invitation.image_url}")` }}>
                <span className="card-category">{language === "si" ? categories.find((category) => category.id === invitation.category_id)?.name_si ?? "à¶”à¶¶ à·€à·™à¶±à·”à·€à·™à¶±à·Š" : categories.find((category) => category.id === invitation.category_id)?.name_en ?? "Made for you"}</span>
                <button type="button" className="save-button" aria-label={text(`Save ${invitation.title_en}`, `${invitation.title_si} à·ƒà·”à¶»à¶šà·’à¶±à·Šà¶±`)} onClick={() => setNotice(text("Saved for inspiration", "à¶”à¶¶ à¶šà·à¶¸à¶­à·’ à¶±à·’à¶»à·Šà¶¸à·à¶« à¶…à¶­à¶»à¶§ à¶‘à¶šà·Š à¶šà·…à·"))}><Heart size={16} /></button>
                {invitation.featured && <span className="featured-label"><Sparkles size={11} /> {text("MOST LOVED", "à¶¢à¶±à¶´à·Šâ€à¶»à·’à¶ºà¶¸")}</span>}
              </div>
              <div className="invitation-card-info">
                <div><h3>{language === "si" ? invitation.title_si : invitation.title_en}</h3><span className="card-sinhala">{language === "si" ? invitation.title_en : invitation.title_si}</span></div>
                <span className="card-price">{formatPrice(invitation.price)}</span>
              </div>
              <p className="card-description">{language === "si" ? invitation.description_si : invitation.description_en}</p>
              <button type="button" className="card-order-link" onClick={() => setSelectedInvitation(invitation)}>{text("Make it yours", "à¶”à¶¶à·š à¶šà¶»à¶œà¶±à·Šà¶±")} <ArrowRight size={15} /></button>
            </article>
          ))}
          {visibleInvitations.length === 0 && <div className="empty-collection"><Search size={24} /><p>{text("No designs found. Try a different search.", "à¶±à·’à¶»à·Šà¶¸à·à¶« à·„à¶¸à·” à¶±à·œà·€à·“à¶º. à·€à·™à¶±à¶­à·Š à·€à¶ à¶±à¶ºà¶šà·Š à·ƒà·œà¶ºà¶±à·Šà¶±.")}</p><button className="text-link" type="button" onClick={() => { setSearch(""); setActiveCategory("all"); }}>{text("Show all designs", "à·ƒà·’à¶ºà¶½à·” à¶±à·’à¶»à·Šà¶¸à·à¶« à¶´à·™à¶±à·Šà·€à¶±à·Šà¶±")}</button></div>}
        </div>
        <div className="collection-footnote"><Flower2 size={14} /> {text("Every design is made personal, just for you.", "à·ƒà·‘à¶¸ à¶±à·’à¶»à·Šà¶¸à·à¶«à¶ºà¶šà·Šà¶¸ à¶”à¶¶ à·€à·™à¶±à·”à·€à·™à¶±à·Šà¶¸ à·ƒà¶šà·ƒà·Š à¶šà¶»à¶ºà·’.")}</div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <div className="how-heading"><span className="eyebrow">{text("THREE SIMPLE STEPS", "à¶´à·„à·ƒà·” à¶´à·’à¶ºà·€à¶» à¶­à·”à¶±à¶šà·Š")}</span><h2>{text("From", "à¶”à¶¶à·š")} <em>{text("idea", "à¶…à¶¯à·„à·ƒà·š")}</em> {text("to", "à·ƒà·’à¶§")}<br />{text("invitation.", "à¶†à¶»à·à¶°à¶±à·à·€ à¶¯à¶šà·Šà·€à·.")}</h2><p>{text("We make the design easy. You bring the reason to celebrate.", "à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶šà·’à¶»à·“à¶¸ à¶…à¶´à·’ à¶´à·„à·ƒà·” à¶šà¶»à¶±à·Šà¶±à¶¸à·Š. à·ƒà·à¶¸à¶»à·“à¶¸à¶§ à·„à·šà¶­à·”à·€ à¶”à¶¶ à¶»à·à¶œà·™à¶± à¶‘à¶±à·Šà¶±.")}</p></div>
          <div className="steps-grid">
            <article className="step-card"><span className="step-number">01</span><div className="step-icon"><Search size={21} /></div><h3>{text("Pick your favourite", "à¶”à¶¶ à¶šà·à¶¸à¶­à·’ à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶­à·à¶»à¶±à·Šà¶±")}</h3><p>{text("Browse the collection and choose a design for your celebration.", "à¶”à¶¶à·š à·ƒà·à¶¸à¶»à·”à¶¸à¶§ à¶œà·à·…à¶´à·™à¶± à¶±à·’à¶»à·Šà¶¸à·à¶«à¶ºà¶šà·Š à¶­à·à¶»à·à¶œà¶±à·Šà¶±.")}</p></article>
            <article className="step-card"><span className="step-number">02</span><div className="step-icon"><CalendarDays size={21} /></div><h3>{text("Tell us the details", "à·€à·’à·ƒà·Šà¶­à¶» à¶…à¶´à¶§ à¶šà·’à¶ºà¶±à·Šà¶±")}</h3><p>{text("Share the event date, names and the little details that make it yours.", "à¶¯à·’à¶±à¶º, à¶±à¶¸à·Š à·ƒà·„ à¶”à¶¶à·š à·ƒà·à¶¸à¶»à·”à¶¸à¶§ à¶…à¶¯à·à·… à·€à·’à·à·šà·‚ à·€à·’à·ƒà·Šà¶­à¶» à¶…à¶´à¶§ à¶‘à·€à¶±à·Šà¶±.")}</p></article>
            <article className="step-card"><span className="step-number">03</span><div className="step-icon"><Sparkles size={21} /></div><h3>{text("We make it special", "à¶…à¶´à·’ à·€à·’à·à·šà·‚à·€ à·ƒà¶šà·ƒà¶±à·Šà¶±à¶¸à·Š")}</h3><p>{text("We personalise your invitation and share it for your approval.", "à¶”à¶¶à·š à¶†à¶»à·à¶°à¶±à·à·€ à·ƒà¶šà·ƒà· à¶…à¶±à·”à¶¸à·à¶­à·’à¶º à·ƒà¶³à·„à· à¶”à¶¶à¶§ à¶‘à·€à¶±à·Šà¶±à¶¸à·Š.")}</p></article>
          </div>
        </div>
      </section>

      <section className="tracking-section section-shell" id="track-order">
        <div className="tracking-card">
          <div className="tracking-art"><span className="tracking-art-number">02 / 03</span><div className="tracking-postcard"><span className="postcard-flower"><Flower2 size={45} strokeWidth={1} /></span><span className="postcard-label">{text("a little update", "à¶šà·”à¶©à· à¶ºà·à·€à¶­à·Šà¶šà·à¶½à·“à¶±à¶ºà¶šà·Š")}<br /><em>{text("just for you", "à¶”à¶¶ à·€à·™à¶±à·”à·€à·™à¶±à·Š")}</em></span><div className="postcard-lines"><i /><i /><i /></div><div className="postcard-stamp">A</div></div><span className="tracking-art-caption">{text("YOUR INVITE IS IN GOOD HANDS", "à¶”à¶¶à·š à¶†à¶»à·à¶°à¶±à·à·€ à·ƒà·”à¶»à¶šà·Šà·‚à·’à¶­à¶ºà·’")}</span></div>
          <div className="tracking-content">
            <span className="eyebrow">{text("THE EXCITING BIT", "à¶”à¶¶à·š à¶‡à¶«à·€à·”à¶¸à·š à¶´à·’à¶ºà·€à¶»")}</span>
            <h2>{text("Whereâ€™s your", "à¶”à¶¶à·š à¶†à¶»à·à¶°à¶±à·à·€")}<br /><em>{text("invitation?", "à¶¯à·à¶±à·Š à¶šà·œà¶­à·à¶±à¶¯?")}</em></h2>
            <p>{text("Enter your tracking code to see the latest update on your invitation.", "à¶”à¶¶à·š à¶†à¶»à·à¶°à¶±à·à·€à·š à¶±à·€à¶­à¶¸ à¶­à¶­à·Šà¶­à·Šà·€à¶º à¶¯à·à¶±à¶œà·à¶±à·“à¶¸à¶§ tracking code à¶‘à¶š à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±.")}</p>
            <form className="tracking-form" onSubmit={trackOrder}>
              <label htmlFor="tracking-code">{text("YOUR TRACKING CODE", "à¶”à¶¶à·š TRACKING CODE à¶‘à¶š")}</label>
              <div className="tracking-input-wrap"><input id="tracking-code" value={trackCode} onChange={(event) => setTrackCode(event.target.value)} placeholder="e.g. 8c0f1f5a-..." required /><button className="button button-dark" type="submit" disabled={trackBusy}>{trackBusy ? <LoaderCircle className="spin" size={16} /> : <>{text("Track it", "à·ƒà·œà¶ºà¶±à·Šà¶±")} <ArrowRight size={15} /></>}</button></div>
            </form>
            {trackedOrder && <div className="tracked-result"><div className="tracked-result-heading"><PackageCheck size={19} /><div><strong>{trackedOrder.invitation_title}</strong><span>{text("For", "à¶´à·à¶»à·’à¶·à·à¶œà·’à¶šà¶ºà·")} {trackedOrder.customer_name}</span></div></div><div className="status-steps">{(Object.keys(statusLabels.en) as OrderStatus[]).map((status, index) => { const statuses: OrderStatus[] = ["received", "designing", "review", "completed"]; const currentIndex = statuses.indexOf(trackedOrder.status); return <div className={`status-step ${index <= currentIndex ? "done" : ""}`} key={status}><span>{index < currentIndex ? <Check size={11} /> : index + 1}</span><small>{statusLabels[language][status]}</small></div>; })}</div></div>}
            <div className="tracking-footnote"><Clock3 size={14} /> {text("Weâ€™ll keep you in the loop.", "à·ƒà·‘à¶¸ à¶´à·’à¶ºà·€à¶»à¶šà¶¯à·“à¶¸ à¶”à¶¶à¶§ à¶¯à·à¶±à·”à¶¸à·Š à¶¯à·™à¶±à·Šà¶±à¶¸à·Š.")}</div>
          </div>
        </div>
      </section>

      <section className="reviews-section section-shell" id="reviews">
        <div className="reviews-heading"><span className="eyebrow">{text("KIND WORDS, HAPPY HEARTS", "à·ƒà¶­à·”à¶§à·” à¶´à·à¶»à·’à¶·à·à¶œà·’à¶š à¶…à¶¯à·„à·ƒà·Š")}</span><h2>{text("They said", "à¶”à·€à·”à¶±à·Šà¶œà·š")} <em>{text("it best.", "à·€à¶ à¶±à·€à¶½à·’à¶±à·Šà¶¸.")}</em></h2><p>{text("A little love from the people who made their moments with us.", "à¶…à¶´ à·ƒà¶¸à¶Ÿ à¶”à·€à·”à¶±à·Šà¶œà·š à·€à·’à·à·šà·‚ à¶¸à·œà·„à·œà¶­ à·ƒà·à¶¸à¶»à·– à¶…à¶ºà¶œà·š à¶…à¶¯à·„à·ƒà·Š.")}</p></div>
        <div className="review-grid">
          {reviews.slice(0, 3).map((review, index) => <article className="review-card" key={review.id}><div className="review-stars">{Array.from({ length: review.rating }, (_, starIndex) => <Star size={13} fill="currentColor" key={starIndex} />)}</div><p className="review-quote">&ldquo;{review.feedback}&rdquo;</p><div className="review-person"><span className={`review-avatar avatar-${index}`}>{review.customer_name.charAt(0)}</span><div><strong>{review.customer_name}</strong><span>{text("Happy customer", "à·ƒà¶­à·”à¶§à·”à¶¯à·à¶ºà¶š à¶´à·à¶»à·’à¶·à·à¶œà·’à¶šà¶ºà·™à¶šà·Š")}</span></div><Sparkles size={15} className="review-sparkle" /></div></article>)}
          {reviews.length === 0 && <p className="review-empty">{text("Your kind words will feel right at home here.", "à¶”à¶¶à·š à¶…à¶¯à·„à·ƒ à¶¸à·™à·„à·’ à¶´à·… à·€à·šà·€à·’.")}</p>}
        </div>
        <form className="review-form" onSubmit={submitReview}>
          <div className="review-form-copy"><span className="eyebrow">{text("YOUR TURN", "à¶”à¶¶à·š à·€à·à¶»à¶º")}</span><h3>{text("Made something with us?", "à¶…à¶´ à·ƒà¶¸à¶Ÿ à¶±à·’à¶»à·Šà¶¸à·à¶«à¶ºà¶šà·Š à¶šà·…à·à¶¯?")}</h3><p>{text("Weâ€™d love to hear how it went.", "à¶”à¶¶à·š à¶…à¶­à·Šà¶¯à·à¶šà·“à¶¸ à¶…à¶´ à·ƒà¶¸à¶Ÿ à¶¶à·™à¶¯à·à¶œà¶±à·Šà¶±.")}</p></div>
          <div className="review-form-fields"><input name="review_name" placeholder={text("Your name", "à¶”à¶¶à·š à¶±à¶¸")} aria-label={text("Your name", "à¶”à¶¶à·š à¶±à¶¸")} required /><select name="rating" aria-label={text("Rating", "à¶‡à¶œà¶ºà·“à¶¸")} defaultValue="5"><option value="5">â˜…â˜…â˜…â˜…â˜… â€” {text("Loved it!", "à¶‰à¶­à·à¶¸à¶­à·Š à¶šà·à¶¸à¶­à·’à¶ºà·’!")}</option><option value="4">â˜…â˜…â˜…â˜…â˜† â€” {text("Really lovely", "à¶‰à¶­à· à¶½à·ƒà·Šà·ƒà¶±à¶ºà·’")}</option><option value="3">â˜…â˜…â˜…â˜†â˜† â€” {text("It was nice", "à·„à·œà¶³à¶ºà·’")}</option><option value="2">â˜…â˜…â˜†â˜†â˜† â€” {text("Could be better", "à¶­à·€à¶­à·Š à·„à·œà¶³ à·€à·’à¶º à·„à·à¶š")}</option><option value="1">â˜…â˜†â˜†â˜†â˜† â€” {text("Not for me", "à¶¸à¶œà·š à¶šà·à¶¸à·à¶­à·Šà¶­ à¶±à·œà·€à·š")}</option></select><textarea name="feedback" placeholder={text("Tell us a little about it...", "à¶”à¶¶à·š à¶…à¶¯à·„à·ƒ à¶šà·’à¶ºà¶±à·Šà¶±...")} required rows={2} /><button className="button button-dark" type="submit" disabled={reviewBusy}>{reviewBusy ? <LoaderCircle className="spin" size={16} /> : <>{text("Send a review", "à¶…à¶¯à·„à·ƒ à¶ºà·€à¶±à·Šà¶±")} <Send size={14} /></>}</button></div>
        </form>
      </section>

      <section className="closing-banner"><div className="closing-flower"><Flower2 size={29} strokeWidth={1.2} /></div><span className="eyebrow">{text("YOUR MOMENT IS WAITING", "à¶”à¶¶à·š à·€à·’à·à·šà·‚ à¶¸à·œà·„à·œà¶­ à¶¶à¶½à· à·ƒà·’à¶§à·’à¶ºà·’")}</span><h2>{text("Letâ€™s make it", "à¶‘à¶º à¶…à¶¸à¶­à¶š à¶±à·œà·€à¶±")} <em>{text("memorable.", "à¶¸à¶­à¶šà¶ºà¶šà·Š à¶šà¶»à¶¸à·”.")}</em></h2><p>{text("à¶”à¶¶à·š à·€à·’à·à·šà·‚ à¶¯à·€à·ƒà¶§ à¶½à·ƒà·Šà·ƒà¶± à¶†à¶»à·à¶°à¶±à·à·€à¶šà·Š à·„à¶¯à¶¸à·”.", "à¶”à¶¶à·š à·€à·’à·à·šà·‚ à¶¯à·€à·ƒà¶§ à¶½à·ƒà·Šà·ƒà¶± à¶†à¶»à·à¶°à¶±à·à·€à¶šà·Š à·„à¶¯à¶¸à·”.")}</p><a className="button button-light" href="#collection">{text("Explore invitations", "à¶†à¶»à·à¶°à¶±à· à¶¶à¶½à¶±à·Šà¶±")} <ArrowRight size={16} /></a><span className="closing-decoration decoration-one">âœ³</span><span className="closing-decoration decoration-two">âœ³</span></section>

      <footer className="site-footer"><div className="footer-main"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Flower2 size={20} /></span><span className="brand-name"><span className="brand-word">ARADHANA<span className="brand-period">.</span></span><small className="brand-tag">INVITATION</small></span></a><p>{text("Thoughtful invitations for", "à¶¢à·“à·€à·’à¶­à¶ºà·š à·ƒà¶­à·”à¶§à·” à¶¸à·œà·„à·œà¶­à¶§")}<br />{text("all the big things in life.", "à¶†à¶¯à¶»à¶«à·“à¶º à¶†à¶»à·à¶°à¶±à·.")}<br /><span>{text("Made with care in Sri Lanka.", "à·à·Šâ€à¶»à·“ à¶½à¶‚à¶šà·à·€à·š à¶†à¶¯à¶»à¶ºà·™à¶±à·Š à·ƒà·à¶šà·ƒà·–.")}</span></p><a className="footer-social" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Camera size={17} /></a></div><div className="footer-links"><div><span className="footer-heading">{text("EXPLORE", "à¶¶à¶½à¶±à·Šà¶±")}</span><a href="#collection">{text("The collection", "à¶±à·’à¶»à·Šà¶¸à·à¶« à¶‘à¶šà¶­à·”à·€")}</a><a href="#how-it-works">{text("How it works", "à·ƒà·šà·€à·à·€")}</a><a href="#reviews">{text("Customer reviews", "à¶´à·à¶»à·’à¶·à·à¶œà·’à¶š à¶…à¶¯à·„à·ƒà·Š")}</a></div><div><span className="footer-heading">{text("HERE TO HELP", "à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶° à·€à¶±à·Šà¶±")}</span><a href="#track-order">{text("Track your order", "à¶‡à¶«à·€à·”à¶¸ à·ƒà·œà¶ºà¶±à·Šà¶±")}</a><a href="mailto:hello@aradhana.lk">hello@aradhana.lk</a><a href="tel:+94771234567">+94 77 123 4567</a></div><div><span className="footer-heading">{text("A LITTLE NOTE", "à·€à·’à·à·šà·‚ à·ƒà¶§à·„à¶±à¶šà·Š")}</span><p>{text("Designed with love", "à¶†à¶¯à¶»à¶ºà·™à¶±à·Š à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶šà·…")}<br />{text("in Sri Lanka", "à·à·Šâ€à¶»à·“ à¶½à¶‚à¶šà·à·€à·š")} <Heart size={11} fill="currentColor" /></p></div></div><div className="footer-bottom"><span>Â© 2026 ARADHANA INVITATION</span><span>{text("MADE FOR THE MOMENTS THAT MATTER", "à¶”à¶¶à·š à·€à¶§à·’à¶±à· à¶¸à·œà·„à·œà¶­ à·€à·™à¶±à·”à·€à·™à¶±à·Š")} <Flower2 size={12} /></span></div></footer>

      {notice && <div className="notice-toast" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label={text("Dismiss message", "à¶´à¶«à·’à·€à·’à¶©à¶º à·€à·ƒà¶±à·Šà¶±")}><X size={16} /></button></div>}

      {selectedInvitation && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedInvitation(null); }}><section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title"><button className="modal-close" type="button" onClick={() => setSelectedInvitation(null)} aria-label={text("Close order form", "à¶‡à¶«à·€à·”à¶¸à·Š à¶´à·à¶»à¶¸à¶º à·€à·ƒà¶±à·Šà¶±")}><X size={19} /></button><div className="modal-image" style={{ backgroundImage: `url("${selectedInvitation.image_url}")` }} /><div className="modal-form-side"><span className="eyebrow">{text("LETâ€™S MAKE IT YOURS", "à¶”à¶¶à·šà¶¸ à¶±à·’à¶»à·Šà¶¸à·à¶«à¶ºà¶šà·Š à¶šà¶»à¶¸à·”")}</span><h2 id="order-title">{text("Your invitation", "à¶”à¶¶à·š à¶†à¶»à·à¶°à¶±à·à·€")}<br /><em>{text("starts here.", "à¶¸à·™à¶­à·à¶±à·’à¶±à·Š à¶‡à¶»à¶¹à·š.")}</em></h2><p className="modal-selected">{language === "si" ? selectedInvitation.title_si : selectedInvitation.title_en} <span>{formatPrice(selectedInvitation.price)}</span></p><form className="order-form" onSubmit={submitOrder}><label>{text("Your name", "à¶”à¶¶à·š à¶±à¶¸")}<input name="name" autoComplete="name" required placeholder="e.g. Amaya Perera" /></label><label>{text("Phone or email", "à¶¯à·”à¶»à¶šà¶®à¶± à¶…à¶‚à¶šà¶º à·„à· à¶Šà¶¸à·šà¶½à·Š")}<input name="contact" autoComplete="email" required placeholder="+94 77 123 4567" /></label><label>{text("Event date", "à¶‹à¶­à·Šà·ƒà·€ à¶¯à·’à¶±à¶º")}<input name="event_date" type="date" /></label><label>{text("A little about your event", "à¶”à¶¶à·š à¶‹à¶­à·Šà·ƒà·€à¶º à¶œà·à¶±")}<textarea name="details" rows={3} placeholder={text("Names, venue, colours, guest count...", "à¶±à¶¸à·Š, à·ƒà·Šà¶®à·à¶±à¶º, à·€à¶»à·Šà¶«, à¶…à¶¸à·”à¶­à·Šà¶­à¶±à·Š à¶œà¶«à¶±...")} /></label><button className="button button-dark modal-submit" type="submit" disabled={orderBusy}>{orderBusy ? <LoaderCircle className="spin" size={17} /> : <>{text("Place my order", "à¶‡à¶«à·€à·”à¶¸ à¶ºà·€à¶±à·Šà¶±")} <ArrowRight size={16} /></>}</button><span className="modal-note">{text("Weâ€™ll be in touch to make the details just right.", "à·€à·à¶©à·’ à·€à·’à·ƒà·Šà¶­à¶» à·ƒà¶³à·„à· à¶…à¶´à·’ à¶”à¶¶à·€ à¶…à¶¸à¶­à¶±à·Šà¶±à¶¸à·Š.")}</span></form></div></section></div>}
    </main>
  );
}

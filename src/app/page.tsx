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

const categoryIcons = [Flower2, Gift, PartyPopper, Trophy];
const statusLabels: Record<OrderStatus, string> = {
  received: "Order received · ඇණවුම ලැබුණා",
  designing: "Designing · නිර්මාණය කරමින්",
  review: "Your approval · ඔබේ අනුමැතිය",
  completed: "Completed · සම්පූර්ණයි",
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
          "Couldn't connect to the shop right now. Please try again later. · ගබඩාවට සම්බන්ධ වීමට නොහැකි විය.",
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
        "Connect your Supabase project to place an order. · ඇණවුම් ලබාගැනීමට Supabase සම්බන්ධ කරන්න.",
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
      setNotice(`Order couldn't be placed: ${error.message}`);
      return;
    }

    setSelectedInvitation(null);
    setTrackCode(trackingCode);
    setTrackedOrder(null);
    setNotice(
      `Order placed! Save your tracking code: ${trackingCode} · ඇණවුම සාර්ථකයි! ඔබේ tracking code එක සුරකින්න.`,
    );
    document.getElementById("track-order")?.scrollIntoView({ behavior: "smooth" });
  }

  async function trackOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setNotice(
        "Connect your Supabase project to track orders. · ඇණවුම් පරීක්ෂා කිරීමට Supabase සම්බන්ධ කරන්න.",
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
      setNotice(`Couldn't look up the order: ${error.message}`);
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) {
      setNotice(
        "No order found. Check the tracking code and try again. · ඇණවුමක් හමු නොවීය. code එක නැවත පරීක්ෂා කරන්න.",
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
        "Connect your Supabase project to send a review. · අදහස් යැවීමට Supabase සම්බන්ධ කරන්න.",
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
      setNotice(`Review couldn't be sent: ${error.message}`);
      return;
    }
    form.reset();
    setNotice(
      "Thank you! Your review will appear after approval. · ස්තුතියි! අනුමැතියෙන් පසු ඔබේ අදහස පළ කෙරේ.",
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Mali home">
          <span className="brand-mark"><Flower2 size={21} strokeWidth={1.7} /></span>
          <span>MALI<span className="brand-period">.</span></span>
        </a>
        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`main-nav ${mobileMenuOpen ? "is-open" : ""}`}>
          <a href="#collection" onClick={() => setMobileMenuOpen(false)}>Our designs <span>නිර්මාණ</span></a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works <span>සේවාව</span></a>
          <a href="#reviews" onClick={() => setMobileMenuOpen(false)}>Reviews <span>අදහස්</span></a>
        </nav>
        <a className="header-cta" href="#track-order">Track an order <ArrowUpRight size={15} /></a>
      </header>
      {!supabase && <div className="preview-mode-banner" role="note">Preview mode — connect Supabase to accept orders, track progress and manage your studio. · ඇණවුම් සඳහා Supabase සම්බන්ධ කරන්න.</div>}

      <section className="hero-section" id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> MADE FOR YOUR MOMENTS <span>· ඔබේ මොහොතට</span></div>
          <h1>Little things.<br /><em>Big feelings.</em></h1>
          <p className="hero-lead">
            Invitations that feel like <span>you.</span><br />
            <span className="sinhala-lead">ඔබේ කතාව කියන ලස්සන ආරාධනා.</span>
          </p>
          <p className="hero-description">
            Thoughtfully designed invites for the moments you&apos;ll remember forever.
            Pick a design, make it yours, and let the celebrating begin.
          </p>
          <div className="hero-actions">
            <a className="button button-dark" href="#collection">Find your invitation <ArrowRight size={17} /></a>
            <a className="text-link" href="#how-it-works">How it works <ArrowDown size={14} /></a>
          </div>
          <div className="hero-proof"><div className="proof-avatars"><span>න</span><span>ආ</span><span>ස</span></div><p><strong>Made with a little extra love</strong><br />හදවතින්ම සැකසූ නිර්මාණ</p><div className="proof-stars"><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /></div></div>
        </div>

        <div className="hero-art" aria-label="A selection of elegant invitation designs">
          <div className="hero-image hero-image-large">
            <div className="hero-image-wash" />
            <div className="floating-note">
              <span className="note-sparkle"><Sparkles size={15} /></span>
              <span>Made with love<small>හදවතින්ම සැකසූ</small></span>
              <Heart size={16} className="note-heart" />
            </div>
          </div>
          <div className="hero-image hero-image-small" />
          <div className="hero-sticker"><span>your<br />day, your<br /><em>way</em></span><Sparkles size={13} /></div>
          <div className="hero-caption">01 — A LITTLE PREVIEW</div>
        </div>
        <div className="hero-side-label">DESIGNED IN SRI LANKA · MADE FOR YOU</div>
      </section>

      <section className="category-strip" aria-label="Invitation categories">
        <div className="category-intro"><span>THE GOOD STUFF</span><p>What are we<br />celebrating?</p></div>
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
              <span className="category-name">{category.name_en}<small>{category.name_si}</small></span>
              <ArrowUpRight size={15} className="category-arrow" />
            </button>
          );
        })}
      </section>

      <section className="collection-section section-shell" id="collection">
        <div className="section-heading">
          <div><span className="eyebrow">A LITTLE SOMETHING FOR EVERY OCCASION</span><h2>Find the <em>feeling.</em></h2><p>Scroll through the designs. Fall in love. Make it yours.</p></div>
          <a className="text-link" href="#track-order">Already placed an order? <ArrowUpRight size={15} /></a>
        </div>
        <div className="collection-toolbar">
          <div className="filter-pills">
            <button type="button" className={activeCategory === "all" ? "filter-pill active" : "filter-pill"} onClick={() => setActiveCategory("all")}>All designs</button>
            {categories.map((category) => <button type="button" className={activeCategory === category.id ? "filter-pill active" : "filter-pill"} key={category.id} onClick={() => setActiveCategory(category.id)}>{category.name_en}</button>)}
          </div>
          <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find your perfect invite..." aria-label="Search invitations" /><ChevronDown size={14} className="search-chevron" /></label>
        </div>

        <div className="invitation-grid">
          {visibleInvitations.map((invitation, index) => (
            <article className="invitation-card" key={invitation.id}>
              <div className={`invitation-image invitation-image-${index % 6}`} style={{ backgroundImage: `url("${invitation.image_url}")` }}>
                <span className="card-category">{categories.find((category) => category.id === invitation.category_id)?.name_en ?? "Made for you"}</span>
                <button type="button" className="save-button" aria-label={`Save ${invitation.title_en}`} onClick={() => setNotice("Saved for inspiration · ඔබේ කැමති නිර්මාණ අතරට එක් කළා")}><Heart size={16} /></button>
                {invitation.featured && <span className="featured-label"><Sparkles size={11} /> MOST LOVED</span>}
              </div>
              <div className="invitation-card-info">
                <div><h3>{invitation.title_en}</h3><span className="card-sinhala">{invitation.title_si}</span></div>
                <span className="card-price">{formatPrice(invitation.price)}</span>
              </div>
              <p className="card-description">{invitation.description_en}</p>
              <button type="button" className="card-order-link" onClick={() => setSelectedInvitation(invitation)}>Make it yours <ArrowRight size={15} /></button>
            </article>
          ))}
          {visibleInvitations.length === 0 && <div className="empty-collection"><Search size={24} /><p>No designs found. Try a different search. · නිර්මාණ හමු නොවීය.</p><button className="text-link" type="button" onClick={() => { setSearch(""); setActiveCategory("all"); }}>Show all designs</button></div>}
        </div>
        <div className="collection-footnote"><Flower2 size={14} /> Every design is made personal, just for you. <span>සෑම නිර්මාණයක්ම ඔබ වෙනුවෙන්මයි.</span></div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <div className="how-heading"><span className="eyebrow">EASY AS ONE, TWO, YOU</span><h2>From <em>idea</em> to<br />invitation.</h2><p>We make the pretty part easy. You bring the reason to celebrate.</p></div>
          <div className="steps-grid">
            <article className="step-card"><span className="step-number">01</span><div className="step-icon"><Search size={21} /></div><h3>Pick your favourite</h3><p>Find a design that feels like your kind of celebration. Browse, fall in love, repeat.</p><span className="step-si">ඔබ කැමතිම නිර්මාණය තෝරන්න.</span></article>
            <article className="step-card"><span className="step-number">02</span><div className="step-icon"><CalendarDays size={21} /></div><h3>Tell us the details</h3><p>Share your event details, names and the little things that make it yours.</p><span className="step-si">ඔබේ විශේෂ විස්තර අපට කියන්න.</span></article>
            <article className="step-card"><span className="step-number">03</span><div className="step-icon"><Sparkles size={21} /></div><h3>We make it magic</h3><p>We personalise your invite and share it for your approval before it&apos;s ready.</p><span className="step-si">අපි ලස්සනට සකසා ඔබට එවන්නම්.</span></article>
          </div>
        </div>
      </section>

      <section className="tracking-section section-shell" id="track-order">
        <div className="tracking-card">
          <div className="tracking-art"><span className="tracking-art-number">02 / 03</span><div className="tracking-postcard"><span className="postcard-flower"><Flower2 size={45} strokeWidth={1} /></span><span className="postcard-label">a little update<br /><em>just for you</em></span><div className="postcard-lines"><i /><i /><i /></div><div className="postcard-stamp">M</div></div><span className="tracking-art-caption">YOUR INVITE IS IN GOOD HANDS</span></div>
          <div className="tracking-content">
            <span className="eyebrow">THE EXCITING BIT</span>
            <h2>Where&apos;s your<br /><em>invitation?</em></h2>
            <p>Pop in your tracking code and see what we&apos;re up to. Good things are on their way.</p>
            <p className="tracking-sinhala">ඔබේ ඇණවුමේ තත්ත්වය දැනගන්න tracking code එක ඇතුළත් කරන්න.</p>
            <form className="tracking-form" onSubmit={trackOrder}>
              <label htmlFor="tracking-code">YOUR TRACKING CODE</label>
              <div className="tracking-input-wrap"><input id="tracking-code" value={trackCode} onChange={(event) => setTrackCode(event.target.value)} placeholder="e.g. 8c0f1f5a-..." required /><button className="button button-dark" type="submit" disabled={trackBusy}>{trackBusy ? <LoaderCircle className="spin" size={16} /> : <>Track it <ArrowRight size={15} /></>}</button></div>
            </form>
            {trackedOrder && <div className="tracked-result"><div className="tracked-result-heading"><PackageCheck size={19} /><div><strong>{trackedOrder.invitation_title}</strong><span>For {trackedOrder.customer_name}</span></div></div><div className="status-steps">{(Object.keys(statusLabels) as OrderStatus[]).map((status, index) => { const statuses: OrderStatus[] = ["received", "designing", "review", "completed"]; const currentIndex = statuses.indexOf(trackedOrder.status); return <div className={`status-step ${index <= currentIndex ? "done" : ""}`} key={status}><span>{index < currentIndex ? <Check size={11} /> : index + 1}</span><small>{statusLabels[status]}</small></div>; })}</div></div>}
            <div className="tracking-footnote"><Clock3 size={14} /> We&apos;ll keep you in the loop. <span>හැම පියවරකදීම ඔබට දන්වන්නම්.</span></div>
          </div>
        </div>
      </section>

      <section className="reviews-section section-shell" id="reviews">
        <div className="reviews-heading"><span className="eyebrow">KIND WORDS, HAPPY HEARTS</span><h2>They said <em>it best.</em></h2><p>A little love from the people who made their moments with us.</p></div>
        <div className="review-grid">
          {reviews.slice(0, 3).map((review, index) => <article className="review-card" key={review.id}><div className="review-stars">{Array.from({ length: review.rating }, (_, starIndex) => <Star size={13} fill="currentColor" key={starIndex} />)}</div><p className="review-quote">&ldquo;{review.feedback}&rdquo;</p><div className="review-person"><span className={`review-avatar avatar-${index}`}>{review.customer_name.charAt(0)}</span><div><strong>{review.customer_name}</strong><span>Happy customer · සතුටුදායක පාරිභෝගිකයෙක්</span></div><Sparkles size={15} className="review-sparkle" /></div></article>)}
          {reviews.length === 0 && <p className="review-empty">Your kind words will feel right at home here. · ඔබේ අදහස මෙහි පළ වේවි.</p>}
        </div>
        <form className="review-form" onSubmit={submitReview}>
          <div className="review-form-copy"><span className="eyebrow">YOUR TURN</span><h3>Made something with us?</h3><p>We&apos;d love to hear how it went. · ඔබේ අත්දැකීම අප සමඟ බෙදාගන්න.</p></div>
          <div className="review-form-fields"><input name="review_name" placeholder="Your name · ඔබේ නම" aria-label="Your name" required /><select name="rating" aria-label="Rating" defaultValue="5"><option value="5">★★★★★ — Loved it!</option><option value="4">★★★★☆ — Really lovely</option><option value="3">★★★☆☆ — It was nice</option><option value="2">★★☆☆☆ — Could be better</option><option value="1">★☆☆☆☆ — Not for me</option></select><textarea name="feedback" placeholder="Tell us a little about it... · ඔබේ අදහස..." required rows={2} /><button className="button button-dark" type="submit" disabled={reviewBusy}>{reviewBusy ? <LoaderCircle className="spin" size={16} /> : <>Send a little love <Send size={14} /></>}</button></div>
        </form>
      </section>

      <section className="closing-banner"><div className="closing-flower"><Flower2 size={29} strokeWidth={1.2} /></div><span className="eyebrow">YOUR MOMENT IS WAITING</span><h2>Let&apos;s make it <em>memorable.</em></h2><p>ඔබේ විශේෂ දවසට ලස්සන ආරාධනාවක් හදමු.</p><a className="button button-light" href="#collection">Explore the collection <ArrowRight size={16} /></a><span className="closing-decoration decoration-one">✳</span><span className="closing-decoration decoration-two">✳</span></section>

      <footer className="site-footer"><div className="footer-main"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Flower2 size={20} /></span><span>MALI<span className="brand-period">.</span></span></a><p>A little invitation studio for<br />all the big things in life.<br /><span>ජීවිතයේ සතුටු මොහොතට ආරාධනා.</span></p><a className="footer-social" href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Camera size={17} /></a></div><div className="footer-links"><div><span className="footer-heading">EXPLORE</span><a href="#collection">The collection</a><a href="#how-it-works">How it works</a><a href="#reviews">Kind words</a></div><div><span className="footer-heading">HERE TO HELP</span><a href="#track-order">Track your order</a><a href="mailto:hello@mali.lk">hello@mali.lk</a><a href="tel:+94771234567">+94 77 123 4567</a></div><div><span className="footer-heading">A LITTLE NOTE</span><p>Designed with love<br />in Sri Lanka <Heart size={11} fill="currentColor" /></p><a className="admin-link" href="/admin">Studio admin</a></div></div><div className="footer-bottom"><span>© 2026 MALI INVITATION STUDIO</span><span>MADE FOR THE MOMENTS THAT MATTER <Flower2 size={12} /></span></div></footer>

      {notice && <div className="notice-toast" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={16} /></button></div>}

      {selectedInvitation && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedInvitation(null); }}><section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title"><button className="modal-close" type="button" onClick={() => setSelectedInvitation(null)} aria-label="Close order form"><X size={19} /></button><div className="modal-image" style={{ backgroundImage: `url("${selectedInvitation.image_url}")` }} /><div className="modal-form-side"><span className="eyebrow">LET&apos;S MAKE IT YOURS</span><h2 id="order-title">Your lovely little<br /><em>order starts here.</em></h2><p className="modal-selected">{selectedInvitation.title_en} <span>{formatPrice(selectedInvitation.price)}</span></p><form className="order-form" onSubmit={submitOrder}><label>Your name · ඔබේ නම<input name="name" autoComplete="name" required placeholder="e.g. Amaya Perera" /></label><label>Phone or email · දුරකථන / ඊමේල්<input name="contact" autoComplete="email" required placeholder="+94 77 123 4567" /></label><label>Event date · දිනය<input name="event_date" type="date" /></label><label>A little about your event · විශේෂ විස්තර<textarea name="details" rows={3} placeholder="Names, venue, colours, guest count..." /></label><button className="button button-dark modal-submit" type="submit" disabled={orderBusy}>{orderBusy ? <LoaderCircle className="spin" size={17} /> : <>Send my order <ArrowRight size={16} /></>}</button><span className="modal-note">We&apos;ll be in touch to make the details just right. · වැඩි විස්තර සඳහා අපි ඔබව අමතන්නම්.</span></form></div></section></div>}
    </main>
  );
}

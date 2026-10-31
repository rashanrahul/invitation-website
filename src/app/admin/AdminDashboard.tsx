"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { AdminOrder, Category, Invitation, Review } from "@/lib/types";

type AdminTab = "invitations" | "categories" | "orders" | "reviews";
type InvitationForm = {
  id?: string;
  category_id: string;
  title_en: string;
  title_si: string;
  description_en: string;
  description_si: string;
  price: string;
  image_url: string;
  featured: boolean;
  active: boolean;
};

const emptyInvitation: InvitationForm = {
  category_id: "",
  title_en: "",
  title_si: "",
  description_en: "",
  description_si: "",
  price: "",
  image_url: "",
  featured: false,
  active: true,
};

const tabs: { id: AdminTab; label: string }[] = [
  { id: "invitations", label: "Invitations" },
  { id: "categories", label: "Categories" },
  { id: "orders", label: "Orders" },
  { id: "reviews", label: "Reviews" },
];

export default function AdminDashboard() {
  const supabase = useMemo(() => getSupabase(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [working, setWorking] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("invitations");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [invitationForm, setInvitationForm] =
    useState<InvitationForm>(emptyInvitation);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name_en: "",
    name_si: "",
    slug: "",
  });

  const loadData = useCallback(async (userId: string) => {
    if (!supabase) return;
    setChecking(true);
    const { data: adminRecord, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminError) {
      setMessage(`Couldn't verify admin access: ${adminError.message}`);
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    if (!adminRecord) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }
    setIsAdmin(true);

    const [categoryResult, invitationResult, orderResult, reviewResult] =
      await Promise.all([
        supabase
          .from("categories")
          .select("id,name_en,name_si,slug,active")
          .order("name_en"),
        supabase
          .from("invitations")
          .select(
            "id,category_id,title_en,title_si,description_en,description_si,price,image_url,featured,active",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select(
            "id,tracking_code,invitation_title,customer_name,contact_details,event_details,event_date,status,created_at",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("reviews")
          .select("id,customer_name,rating,feedback,created_at,approved")
          .order("created_at", { ascending: false }),
      ]);

    const failedResult = [
      categoryResult,
      invitationResult,
      orderResult,
      reviewResult,
    ].find((result) => result.error);
    if (failedResult?.error) {
      setMessage(`Couldn't load studio data: ${failedResult.error.message}`);
    } else {
      setCategories(categoryResult.data ?? []);
      setInvitations(invitationResult.data ?? []);
      setOrders(orderResult.data ?? []);
      setReviews(reviewResult.data ?? []);
      setMessage("");
    }
    setChecking(false);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMessage(`Couldn't read your session: ${error.message}`);
        setChecking(false);
        return;
      }
      setSession(data.session);
      if (data.session) void loadData(data.session.user.id);
      else setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession) void loadData(nextSession.user.id);
        else {
          setIsAdmin(false);
          setChecking(false);
        }
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadData, supabase]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const formData = new FormData(event.currentTarget);
    setWorking(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });
    setWorking(false);
    if (error) {
      setMessage(`Sign-in failed: ${error.message}`);
      return;
    }
    setSession(data.session);
    if (data.session) await loadData(data.session.user.id);
  }

  async function signOut() {
    if (!supabase) return;
    setWorking(true);
    const { error } = await supabase.auth.signOut();
    setWorking(false);
    if (error) setMessage(`Couldn't sign out: ${error.message}`);
  }

  function editInvitation(invitation: Invitation) {
    setInvitationForm({
      id: invitation.id,
      category_id: invitation.category_id,
      title_en: invitation.title_en,
      title_si: invitation.title_si,
      description_en: invitation.description_en,
      description_si: invitation.description_si,
      price: String(invitation.price),
      image_url: invitation.image_url,
      featured: invitation.featured,
      active: invitation.active ?? true,
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setWorking(true);
    setMessage("");

    let imageUrl = invitationForm.image_url.trim();
    if (imageFile) {
      const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("invitations")
        .upload(path, imageFile, {
          cacheControl: "3600",
          contentType: imageFile.type,
          upsert: false,
        });
      if (uploadError) {
        setWorking(false);
        setMessage(`Image upload failed: ${uploadError.message}`);
        return;
      }
      imageUrl = supabase.storage.from("invitations").getPublicUrl(path).data
        .publicUrl;
    }

    if (!imageUrl) {
      setWorking(false);
      setMessage("Add an image URL or upload an image before saving.");
      return;
    }

    const payload = {
      category_id: invitationForm.category_id || null,
      title_en: invitationForm.title_en.trim(),
      title_si: invitationForm.title_si.trim(),
      description_en: invitationForm.description_en.trim(),
      description_si: invitationForm.description_si.trim(),
      price: Number(invitationForm.price),
      image_url: imageUrl,
      featured: invitationForm.featured,
      active: invitationForm.active,
    };
    const result = invitationForm.id
      ? await supabase
          .from("invitations")
          .update(payload)
          .eq("id", invitationForm.id)
      : await supabase.from("invitations").insert(payload);
    setWorking(false);
    if (result.error) {
      setMessage(`Couldn't save invitation: ${result.error.message}`);
      return;
    }
    setInvitationForm(emptyInvitation);
    setImageFile(null);
    if (session) await loadData(session.user.id);
    setMessage("Invitation saved.");
  }

  async function deleteInvitation(id: string) {
    if (!supabase || !window.confirm("Delete this invitation?")) return;
    const { error } = await supabase.from("invitations").delete().eq("id", id);
    if (error) {
      setMessage(`Couldn't delete invitation: ${error.message}`);
      return;
    }
    setInvitations((current) => current.filter((item) => item.id !== id));
    setMessage("Invitation deleted.");
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setWorking(true);
    setMessage("");
    const payload = {
      name_en: categoryForm.name_en.trim(),
      name_si: categoryForm.name_si.trim(),
      slug: categoryForm.slug.trim().toLowerCase(),
    };
    const result = categoryForm.id
      ? await supabase.from("categories").update(payload).eq("id", categoryForm.id)
      : await supabase.from("categories").insert(payload);
    setWorking(false);
    if (result.error) {
      setMessage(`Couldn't save category: ${result.error.message}`);
      return;
    }
    setCategoryForm({ id: "", name_en: "", name_si: "", slug: "" });
    if (session) await loadData(session.user.id);
    setMessage("Category saved.");
  }

  async function deleteCategory(id: string) {
    if (
      !supabase ||
      !window.confirm("Delete this category? Invitations will be kept.")
    )
      return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      setMessage(`Couldn't delete category: ${error.message}`);
      return;
    }
    setCategories((current) => current.filter((item) => item.id !== id));
    setMessage("Category deleted.");
  }

  async function updateOrder(id: string, status: AdminOrder["status"]) {
    if (!supabase) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      setMessage(`Couldn't update order: ${error.message}`);
      return;
    }
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status } : order)),
    );
    setMessage("Order status updated.");
  }

  async function updateReview(review: Review, approved: boolean) {
    if (!supabase) return;
    const { error } = await supabase
      .from("reviews")
      .update({ approved })
      .eq("id", review.id);
    if (error) {
      setMessage(`Couldn't update review: ${error.message}`);
      return;
    }
    setReviews((current) =>
      current.map((item) => (item.id === review.id ? { ...item, approved } : item)),
    );
    setMessage(approved ? "Review approved." : "Review hidden.");
  }

  async function deleteReview(id: string) {
    if (!supabase || !window.confirm("Permanently delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      setMessage(`Couldn't delete review: ${error.message}`);
      return;
    }
    setReviews((current) => current.filter((item) => item.id !== id));
    setMessage("Review deleted.");
  }

  if (!supabase) {
    return (
      <main className="admin-gate">
        <div className="admin-gate-card">
          <Link href="/" className="admin-back"><ArrowLeft size={15} /> Back to the studio</Link>
          <span className="admin-eyebrow">ARADHANA Â· STUDIO ADMIN</span>
          <h1>One little setup step.</h1>
          <p>Add the Supabase project URL and publishable key to your <code>.env.local</code>, then restart the app to manage your studio.</p>
          <Link href="/" className="admin-gate-link">Visit the invitation studio <ArrowLeft size={15} /></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="admin-brand" href="/"><span className="admin-brand-mark">A</span><span>ARADHANA <small>INVITATION STUDIO</small></span></Link>
        {session && <button className="admin-signout" type="button" onClick={signOut} disabled={working}><LogOut size={15} /> Sign out</button>}
      </header>

      {checking ? (
        <div className="admin-loading"><LoaderCircle className="spin" size={22} /> Checking your studio access...</div>
      ) : !session ? (
        <section className="admin-login">
          <Link href="/" className="admin-back"><ArrowLeft size={14} /> Back to the studio</Link>
          <div className="admin-login-mark">A</div>
          <span className="admin-eyebrow">JUST FOR THE STUDIO TEAM</span>
          <h1>Good to see you.</h1>
          <p>Sign in to manage your invitations, orders and lovely reviews.</p>
          <form onSubmit={signIn}>
            <label>Email address<input name="email" type="email" autoComplete="username" required placeholder="you@example.com" /></label>
            <label>Password<input name="password" type="password" autoComplete="current-password" required placeholder="Your password" /></label>
            <button type="submit" className="admin-primary-button" disabled={working}>{working ? <LoaderCircle className="spin" size={16} /> : <>Sign in <ArrowLeft size={15} /></>}</button>
          </form>
          <span className="admin-login-hint">Only an account added to the studio admin list can access this dashboard.</span>
        </section>
      ) : !isAdmin ? (
        <section className="admin-login">
          <div className="admin-login-mark">!</div>
          <span className="admin-eyebrow">STUDIO ACCESS</span>
          <h1>Not on the list yet.</h1>
          <p>This signed-in account does not have studio admin access. Ask the project owner to add your user ID to the <code>admin_users</code> table.</p>
          <button type="button" className="admin-primary-button" onClick={signOut}>Sign out <LogOut size={15} /></button>
        </section>
      ) : (
        <div className="admin-dashboard">
          <div className="admin-welcome"><div><span className="admin-eyebrow">YOUR LITTLE CORNER OF ARADHANA</span><h1>Good things, <em>in progress.</em></h1><p>Manage the details that make every moment feel special.</p></div><div className="admin-stats"><span><strong>{invitations.length}</strong> designs</span><span><strong>{orders.length}</strong> orders</span><span><strong>{reviews.filter((review) => !review.approved).length}</strong> reviews to check</span></div></div>
          <nav className="admin-tabs">{tabs.map((tab) => <button type="button" key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => { setActiveTab(tab.id); setMessage(""); }}>{tab.label}<span>{tab.id === "orders" ? orders.length : tab.id === "reviews" ? reviews.filter((review) => !review.approved).length : ""}</span></button>)}</nav>
          {message && <div className={`admin-message ${message.toLowerCase().includes("couldn't") || message.toLowerCase().includes("failed") ? "error" : ""}`} role="status">{message.toLowerCase().includes("couldn't") || message.toLowerCase().includes("failed") ? <X size={15} /> : <CheckCircle2 size={15} />}{message}</div>}

          {activeTab === "invitations" && <section className="admin-content"><div className="admin-section-heading"><div><span className="admin-eyebrow">YOUR DESIGNS</span><h2>{invitationForm.id ? "Edit this invitation" : "Add a new invitation"}</h2></div></div>
            <form className="admin-form admin-invitation-form" onSubmit={saveInvitation}>
              <label>Title in English<input value={invitationForm.title_en} onChange={(event) => setInvitationForm({ ...invitationForm, title_en: event.target.value })} required /></label>
              <label>Title in Sinhala<input value={invitationForm.title_si} onChange={(event) => setInvitationForm({ ...invitationForm, title_si: event.target.value })} required /></label>
              <label>Category<select value={invitationForm.category_id} onChange={(event) => setInvitationForm({ ...invitationForm, category_id: event.target.value })}><option value="">No category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name_en}</option>)}</select></label>
              <label>Price (LKR)<input type="number" min="0" step="100" value={invitationForm.price} onChange={(event) => setInvitationForm({ ...invitationForm, price: event.target.value })} required /></label>
              <label className="admin-wide">Description in English<textarea rows={2} value={invitationForm.description_en} onChange={(event) => setInvitationForm({ ...invitationForm, description_en: event.target.value })} required /></label>
              <label className="admin-wide">Description in Sinhala<textarea rows={2} value={invitationForm.description_si} onChange={(event) => setInvitationForm({ ...invitationForm, description_si: event.target.value })} required /></label>
              <label className="admin-wide">Image URL<input type="url" value={invitationForm.image_url} onChange={(event) => setInvitationForm({ ...invitationForm, image_url: event.target.value })} placeholder="https://..." /></label>
              <label className="admin-wide admin-upload-label"><span>Or upload a new image (JPG, PNG or WebP; up to 5 MB)</span><span className="admin-upload-control"><ImagePlus size={16} />{imageFile?.name ?? "Choose image"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} /></span></label>
              <label className="admin-check"><input type="checkbox" checked={invitationForm.featured} onChange={(event) => setInvitationForm({ ...invitationForm, featured: event.target.checked })} /> Mark as featured</label>
              <label className="admin-check"><input type="checkbox" checked={invitationForm.active} onChange={(event) => setInvitationForm({ ...invitationForm, active: event.target.checked })} /> Visible in the gallery</label>
              <div className="admin-form-actions"><button className="admin-primary-button" type="submit" disabled={working}>{working ? <LoaderCircle className="spin" size={15} /> : <>{invitationForm.id ? "Save changes" : "Add invitation"} <Plus size={15} /></>}</button>{invitationForm.id && <button className="admin-secondary-button" type="button" onClick={() => { setInvitationForm(emptyInvitation); setImageFile(null); }}>Cancel edit <X size={14} /></button>}</div>
            </form>
            <div className="admin-list-heading"><h3>Your invitations</h3><span>{invitations.length} total</span></div>
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Design</th><th>Category</th><th>Price</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>{invitations.map((invitation) => <tr key={invitation.id}><td><div className="admin-design-cell"><span className="admin-design-image" style={{ backgroundImage: `url("${invitation.image_url}")` }} /><span><strong>{invitation.title_en}</strong><small>{invitation.title_si}</small></span></div></td><td>{categories.find((category) => category.id === invitation.category_id)?.name_en ?? "â€”"}</td><td>LKR {Number(invitation.price).toLocaleString("en-LK")}</td><td><span className={`admin-pill ${invitation.active ? "green" : "gray"}`}>{invitation.active ? "Live" : "Hidden"}</span></td><td><div className="admin-actions"><button type="button" aria-label="Edit invitation" onClick={() => editInvitation(invitation)}><Pencil size={14} /></button><button type="button" aria-label="Delete invitation" onClick={() => void deleteInvitation(invitation.id)}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table>{invitations.length === 0 && <p className="admin-empty">Your design gallery is waiting for its first invitation.</p>}</div>
          </section>}

          {activeTab === "categories" && <section className="admin-content"><div className="admin-section-heading"><div><span className="admin-eyebrow">MAKE ROOM FOR EVERY OCCASION</span><h2>{categoryForm.id ? "Edit this category" : "Create a category"}</h2></div></div><form className="admin-form admin-category-form" onSubmit={saveCategory}><label>Category name<input value={categoryForm.name_en} onChange={(event) => setCategoryForm({ ...categoryForm, name_en: event.target.value })} required placeholder="e.g. Weddings" /></label><label>Name in Sinhala<input value={categoryForm.name_si} onChange={(event) => setCategoryForm({ ...categoryForm, name_si: event.target.value })} required placeholder="e.g. à¶¸à¶‚à¶œà¶½" /></label><label>URL slug<input value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} required placeholder="e.g. weddings" /></label><div className="admin-form-actions"><button type="submit" className="admin-primary-button" disabled={working}>{working ? <LoaderCircle className="spin" size={15} /> : <>{categoryForm.id ? "Save category" : "Add category"} <Plus size={15} /></>}</button>{categoryForm.id && <button type="button" className="admin-secondary-button" onClick={() => setCategoryForm({ id: "", name_en: "", name_si: "", slug: "" })}>Cancel <X size={14} /></button>}</div></form><div className="admin-category-grid">{categories.map((category) => <article className="admin-category-card" key={category.id}><div><strong>{category.name_en}</strong><span>{category.name_si}</span><small>/{category.slug}</small></div><div className="admin-actions"><button type="button" aria-label="Edit category" onClick={() => { setCategoryForm({ id: category.id, name_en: category.name_en, name_si: category.name_si, slug: category.slug }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={14} /></button><button type="button" aria-label="Delete category" onClick={() => void deleteCategory(category.id)}><Trash2 size={14} /></button></div></article>)}</div></section>}

          {activeTab === "orders" && <section className="admin-content"><div className="admin-section-heading"><div><span className="admin-eyebrow">A LITTLE PROGRESS, EVERY DAY</span><h2>Customer orders</h2></div><span className="admin-count">{orders.length} total</span></div><div className="admin-table-wrap"><table className="admin-table admin-orders-table"><thead><tr><th>Customer & design</th><th>Contact</th><th>Event date</th><th>Tracking code</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><div className="admin-customer-cell"><strong>{order.customer_name}</strong><span>{order.invitation_title}</span><small>{new Date(order.created_at).toLocaleDateString()}</small>{order.event_details && <small>{order.event_details}</small>}</div></td><td>{order.contact_details}</td><td>{order.event_date || "Not set"}</td><td><code>{order.tracking_code}</code></td><td><select className="admin-status-select" value={order.status} onChange={(event) => void updateOrder(order.id, event.target.value as AdminOrder["status"])}><option value="received">Received</option><option value="designing">Designing</option><option value="review">Your approval</option><option value="completed">Completed</option></select></td></tr>)}</tbody></table>{orders.length === 0 && <p className="admin-empty">No orders just yet. They&apos;ll find their way here.</p>}</div></section>}

          {activeTab === "reviews" && <section className="admin-content"><div className="admin-section-heading"><div><span className="admin-eyebrow">A FEW KIND WORDS</span><h2>Customer reviews</h2></div><span className="admin-count">{reviews.filter((review) => !review.approved).length} waiting for approval</span></div><div className="admin-review-list">{reviews.map((review) => <article className="admin-review-card" key={review.id}><div className="admin-review-header"><div><strong>{review.customer_name}</strong><span>{review.rating} / 5 stars Â· {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}</span></div><span className={`admin-pill ${review.approved ? "green" : "amber"}`}>{review.approved ? "Published" : "Needs approval"}</span></div><p>{review.feedback}</p><div className="admin-review-actions"><button type="button" className="admin-secondary-button" onClick={() => void updateReview(review, !review.approved)}>{review.approved ? <X size={14} /> : <Check size={14} />}{review.approved ? "Hide review" : "Approve review"}</button><button type="button" className="admin-danger-button" onClick={() => void deleteReview(review.id)}><Trash2 size={14} /> Delete</button></div></article>)}{reviews.length === 0 && <p className="admin-empty">No reviews yet. A little love is on its way.</p>}</div></section>}
        </div>
      )}
    </main>
  );
}

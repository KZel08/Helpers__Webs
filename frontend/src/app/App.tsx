import { useState, useEffect } from "react";
import { useCategories } from "../hooks/useCategories";
import { useServices, useService } from "../hooks/useServices";
import { useAddresses } from "../hooks/useAddresses";
import { useBookings } from "../hooks/useBookings";
import { useAdminStats, useAdminUsers, useAdminBookings, useAdminCategories, useAdminServiceRequests } from "../hooks/useAdmin";
import { useHelperProfile } from "../hooks/useHelperProfile";
import { useHelperServiceRequests } from "../hooks/useHelperServiceRequests";
import { useAuth } from "../contexts/AuthContext";
import type { ServiceData, AddressData, CreateAddressRequest, UpdateAddressRequest, BookingData, AdminStatsData, AdminUserData, AdminBookingData, AdminCategoryData, AdminServiceRequestData, CreateCategoryPayload, UpdateCategoryPayload, ReviewServiceRequestPayload, ServiceRequestData, CreateServiceRequestPayload, CreateAdminServicePayload } from "../lib/api";
import { bookingsApi, paymentsApi, helpersApi, adminApi, servicesApi } from "../lib/api";
import { loadRazorpayScript } from "../lib/razorpay";
import {
  MapPin, Bell, Search, Star, ChevronRight, Home, Grid,
  CalendarCheck, User, Sparkles, Zap, Shield, Clock,
  CheckCircle2, ArrowLeft, Filter,
  Plus, Minus, Heart, TrendingUp, Flame, Award, ThumbsUp,
  Repeat2, Gift, Timer, X, Share2, Copy, SlidersHorizontal,
  Edit2, Users, Folder, ClipboardList, Trash2, Check,
} from "lucide-react";

// ─── Date/Time helpers ────────────────────────────────────────────────────────────────

/** Convert UI date label ("12 Jul") + time label ("10:00 AM") into an ISO 8601 string.
 *  Uses the current year. No external library needed.
 *  Returns null if parsing fails.
 */
function buildBookingIso(dateLabel: string, timeLabel: string): string | null {
  const MONTHS: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const [dayStr, monthStr] = dateLabel.trim().split(" ");
  const day = parseInt(dayStr, 10);
  const monthNum = MONTHS[monthStr];
  if (isNaN(day) || monthNum === undefined) return null;

  // Parse time: e.g. "08:00 AM", "2:00 PM", "12:00 PM"
  const timeParts = timeLabel.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!timeParts) return null;
  let hours = parseInt(timeParts[1], 10);
  const minutes = parseInt(timeParts[2], 10);
  const meridiem = timeParts[3].toUpperCase();
  if (meridiem === "AM" && hours === 12) hours = 0;
  if (meridiem === "PM" && hours !== 12) hours += 12;

  const year = new Date().getFullYear();
  const d = new Date(year, monthNum, day, hours, minutes, 0, 0);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "home" | "explore" | "bookings" | "profile" | "detail" | "booking" | "addresses" | "booking-detail" | "helper-dashboard" | "helper-profile" | "helper-services" | "helper-bookings" | "admin-dashboard" | "admin-users" | "admin-bookings" | "admin-categories" | "admin-services" | "admin-service-requests" | "helper-booking-detail" | "helper-service-requests";

interface Provider {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  price: string;
  img: string;
  badge?: string;
  tags: string[];
  category: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const ALL_PROVIDERS: Provider[] = [
  { id:"1", name:"Arjun Mehta",  role:"Deep Cleaning Expert",    rating:4.9, reviews:312, price:"₹599", img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format", badge:"Top Rated", tags:["Verified","5+ yrs"], category:"Cleaning"    },
  { id:"2", name:"Priya Sharma", role:"Salon & Beauty Pro",      rating:4.8, reviews:189, price:"₹449", img:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format", badge:"Popular",   tags:["Certified","3+ yrs"], category:"Salon"       },
  { id:"3", name:"Ravi Kumar",   role:"Plumbing Specialist",     rating:4.7, reviews:241, price:"₹349", img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format",               tags:["Verified","7+ yrs"], category:"Plumbing"    },
  { id:"4", name:"Sunita Patel", role:"AC Repair Technician",    rating:4.9, reviews:98,  price:"₹699", img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&auto=format", badge:"New",       tags:["Certified","2+ yrs"], category:"AC Repair"   },
  { id:"5", name:"Deepak Nair",  role:"Electrician & Wiring",    rating:4.6, reviews:155, price:"₹399", img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format",               tags:["Verified","4+ yrs"], category:"Electrical"  },
  { id:"6", name:"Meena Joshi",  role:"Painting & Wall Expert",  rating:4.8, reviews:87,  price:"₹799", img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&auto=format",               tags:["Certified","6+ yrs"], category:"Painting"    },
];

const flashDeals = [
  { id:"f1", service:"AC Deep Clean",       originalPrice:"₹999",   salePrice:"₹599", discount:"40% OFF", endsIn:47*60+22,      img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=160&h=120&fit=crop&auto=format", color:"#06B6D4" },
  { id:"f2", service:"Full Home Cleaning",  originalPrice:"₹1,299", salePrice:"₹799", discount:"38% OFF", endsIn:2*3600+14*60,  img:"https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=160&h=120&fit=crop&auto=format", color:"#5B6CFF" },
  { id:"f3", service:"Salon at Home",       originalPrice:"₹799",   salePrice:"₹449", discount:"44% OFF", endsIn:5*3600+58*60,  img:"https://images.unsplash.com/photo-1560066984-138dadb4c035?w=160&h=120&fit=crop&auto=format", color:"#EC4899" },
];

const testimonials = [
  { id:"t1", name:"Neha R.",   avatar:"N", avatarColor:"#5B6CFF", text:"Arjun was on time, super professional. My apartment has never been this clean. Booking again next week!", service:"Deep Cleaning", rating:5 },
  { id:"t2", name:"Sameer K.", avatar:"S", avatarColor:"#22C55E", text:"Ravi fixed our leaking pipe in under 30 minutes. Fair pricing, no hidden charges. Highly recommend!",   service:"Plumbing",      rating:5 },
  { id:"t3", name:"Anjali M.", avatar:"A", avatarColor:"#EC4899", text:"Priya is an absolute gem! Got a bridal package done at home and I looked stunning. 10/10.",             service:"Salon",         rating:5 },
];

const trendingSearches = ["AC Repair","Deep Clean","Electrician","Haircut at Home","Plumber","Pest Control"];

const recentlyBooked = [
  { id:"r1", label:"Cleaning", provider:"Arjun M.", img:"https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=100&h=100&fit=crop&auto=format", providerId:"1" },
  { id:"r2", label:"Salon",    provider:"Priya S.", img:"https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop&auto=format", providerId:"2" },
  { id:"r3", label:"Plumbing", provider:"Ravi K.",  img:"https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=100&h=100&fit=crop&auto=format", providerId:"3" },
];

const promos = [
  { label:"Limited offer",  title:"30% off your first\nhome cleaning!",        cta:"Claim Now",    gradient:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" },
  { label:"Members only",   title:"Free priority booking\nwith Helpers Plus",  cta:"Upgrade Free", gradient:"linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)" },
  { label:"Refer & earn",   title:"Get ₹200 credit for\nevery friend you refer",cta:"Share Now",   gradient:"linear-gradient(135deg,#22C55E 0%,#06B6D4 100%)" },
];

const liveActivity = [
  { msg:"Vikram just booked a Plumber in Andheri",           time:"2m ago", dot:"#5B6CFF" },
  { msg:"Ananya rated Priya Sharma ⭐⭐⭐⭐⭐",              time:"5m ago", dot:"#F59E0B" },
  { msg:"12 helpers available near Bandra right now",        time:"Live",   dot:"#22C55E" },
  { msg:"Rohan rebooked Deep Cleaning for this Sunday",      time:"8m ago", dot:"#5B6CFF" },
];

// ─── Toast system ─────────────────────────────────────────────────────────────

interface Toast { id: number; msg: string; color?: string }

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="absolute top-14 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white text-xs font-semibold shadow-lg pointer-events-auto"
          style={{ background: t.color ?? "#20242D", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <CheckCircle2 size={13} className="shrink-0" />
          <span>{t.msg}</span>
          <button onClick={() => dismiss(t.id)} className="ml-1 opacity-60 hover:opacity-100">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(initialSeconds: number) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2,"0")}m` : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function getCategoryStyle(name: string) {
  const map: Record<string, { icon: string; color: string; bg: string }> = {
    Cleaning:    { icon: "🧹", color: "#5B6CFF", bg: "rgba(91,108,255,0.15)"  },
    Plumbing:    { icon: "🔧", color: "#22C55E", bg: "rgba(34,197,94,0.15)"   },
    Electrical:  { icon: "⚡", color: "#F59E0B", bg: "rgba(245,158,11,0.15)"  },
    Salon:       { icon: "✂️", color: "#EC4899", bg: "rgba(236,72,153,0.15)"  },
    Painting:    { icon: "🎨", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)"  },
    "AC Repair": { icon: "❄️", color: "#06B6D4", bg: "rgba(6,182,212,0.15)"   },
    "Pest Control": { icon: "🐛", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  };
  return map[name] || { icon: "➕", color: "#A5A9B5", bg: "rgba(165,169,181,0.15)" };
}

// ─── Shared sub-components ────────────────────────────────────────────────────

// Backend status → display mapping for BookingsScreen
type ApiBookingStatus = "PENDING" | "ACCEPTED" | "ONGOING" | "COMPLETED" | "CANCELLED";

function BookingStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: "Pending",   cls: "text-[#F59E0B] bg-[rgba(245,158,11,0.15)]"  },
    ACCEPTED:  { label: "Accepted",  cls: "text-[#5B6CFF] bg-[rgba(91,108,255,0.15)]"  },
    ONGOING:   { label: "Ongoing",   cls: "text-[#06B6D4] bg-[rgba(6,182,212,0.15)]"   },
    COMPLETED: { label: "Completed", cls: "text-[#22C55E] bg-[rgba(34,197,94,0.15)]"   },
    CANCELLED: { label: "Cancelled", cls: "text-[#EF4444] bg-[rgba(239,68,68,0.15)]"   },
  };
  const entry = map[status] ?? { label: status, cls: "text-[#A5A9B5] bg-[rgba(165,169,181,0.15)]" };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${entry.cls}`}>{entry.label}</span>;
}

function StarRow({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={12} fill="#F59E0B" stroke="none" />
      <span className="text-xs font-semibold text-white">{rating}</span>
      <span className="text-xs text-[#A5A9B5]">({reviews})</span>
    </div>
  );
}

function ProviderCard({ p, onClick }: { p: Provider; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#171A21] rounded-2xl p-4 flex items-center gap-4 text-left w-full hover:bg-[#1E2229] active:scale-[0.98] transition-all"
    >
      <img src={p.img} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#20242D]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-white text-sm truncate" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.name}</span>
          {p.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(91,108,255,0.2)] text-[#5B6CFF] shrink-0">{p.badge}</span>}
        </div>
        <p className="text-[#A5A9B5] text-xs mb-1.5">{p.role}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <StarRow rating={p.rating} reviews={p.reviews} />
          {p.tags.map((t) => <span key={t} className="text-[10px] text-[#A5A9B5] bg-[#20242D] px-2 py-0.5 rounded-full">{t}</span>)}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-white font-bold text-sm">{p.price}</p>
        <p className="text-[#A5A9B5] text-[10px]">/ visit</p>
      </div>
    </button>
  );
}

function ServiceCard({ s, onClick }: { s: ServiceData; onClick: () => void }) {
  const title = s.title ?? s.name ?? 'Service';
  const price = typeof s.price === 'number' ? `₹${s.price.toLocaleString()}` : s.price ?? '—';
  const helperName = s.helper?.user ? `${s.helper.user.firstName} ${s.helper.user.lastName ?? ''}`.trim() : '';
  const rating = s.helper?.rating ?? 0;

  return (
    <button
      onClick={onClick}
      className="bg-[#171A21] rounded-2xl p-4 flex items-center gap-4 text-left w-full hover:bg-[#1E2229] active:scale-[0.98] transition-all"
    >
      <div className="w-14 h-14 rounded-xl bg-[#20242D] flex items-center justify-center text-white font-bold text-sm shrink-0">
        {s.media?.[0]?.url ? <img src={s.media[0].url} alt={title} className="w-full h-full object-cover rounded-xl" /> : <span className="text-xl">{(s.category?.name||'S')[0]}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-white text-sm truncate" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{title}</span>
        </div>
        <p className="text-[#A5A9B5] text-xs mb-1.5">{helperName || s.category?.name}</p>
        <div className="flex items-center gap-2">
          <StarRow rating={rating} reviews={0} />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-white font-bold text-sm">{price}</p>
        <p className="text-[#A5A9B5] text-[10px]">per visit</p>
      </div>
    </button>
  );
}

function FlashDealCard({ deal, onNavigate }: { deal: typeof flashDeals[0]; onNavigate: (s: Screen) => void }) {
  const countdown = useCountdown(deal.endsIn);
  return (
    <button
      onClick={() => onNavigate("explore")}
      className="shrink-0 w-44 rounded-2xl overflow-hidden bg-[#171A21] flex flex-col text-left active:scale-[0.97] transition-transform"
    >
      <div className="relative h-24 bg-[#20242D]">
        <img src={deal.img} alt={deal.service} className="w-full h-full object-cover" />
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-lg text-white" style={{ background:deal.color }}>{deal.discount}</span>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="text-white font-bold text-xs leading-snug" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{deal.service}</p>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">{deal.salePrice}</span>
          <span className="text-[#A5A9B5] text-xs line-through">{deal.originalPrice}</span>
        </div>
        <div className="flex items-center gap-1">
          <Timer size={10} className="text-[#F59E0B]" />
          <span className="text-[#F59E0B] text-[10px] font-bold">{countdown} left</span>
        </div>
      </div>
    </button>
  );
}

// ─── Login screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin, onNavigate, toast }: { onLogin: (email: string, password: string) => Promise<void>; onNavigate: (s: Screen) => void; toast: (msg: string, color?: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onLogin(email, password);
      setEmail("");
      setPassword("");
      toast("Welcome back!", "#22C55E");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Login failed. Please try again.", "#EF4444");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-8 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ background:"linear-gradient(135deg,#5B6CFF,#7E57FF)" }}>H</div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Helpers</h1>
        <p className="text-[#A5A9B5] text-sm">Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-4 py-3 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-4 py-3 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-60"
          style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}
        >
          {isSubmitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-center text-[#A5A9B5] text-xs mt-2">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={() => onNavigate("register")} className="text-[#5B6CFF] font-semibold">Create one</button>
      </p>
    </div>
  );
}

// ─── Register screen ──────────────────────────────────────────────────────────

function RegisterScreen({ onNavigate, onRegistered, toast }: { onNavigate: (s: Screen) => void; onRegistered: (email: string) => void; toast: (msg: string, color?: string) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await register(form);
      toast(res.message ?? "Registration successful. Please verify your email.", "#22C55E");
      onRegistered(form.email);
      onNavigate("verify-email");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Registration failed. Please try again.", "#EF4444");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-8 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ background:"linear-gradient(135deg,#5B6CFF,#7E57FF)" }}>H</div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Create account</h1>
        <p className="text-[#A5A9B5] text-sm">Start booking trusted helpers</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5]">First name</label>
          <input type="text" value={form.firstName} onChange={update("firstName")} placeholder="Aisha" required className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-4 py-3 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5]">Last name</label>
          <input type="text" value={form.lastName} onChange={update("lastName")} placeholder="Khan" required className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-4 py-3 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5]">Email</label>
          <input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" required className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-4 py-3 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5]">Password</label>
          <input type="password" value={form.password} onChange={update("password")} placeholder="Min 8 chars, 1 upper, 1 number, 1 symbol" required className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-4 py-3 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5]">Phone <span className="normal-case tracking-normal text-[#A5A9B5]">(optional)</span></label>
          <input type="tel" value={form.phone} onChange={update("phone")} placeholder="+91 98765 43210" className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-4 py-3 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]" />
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-60" style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}>
          {isSubmitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-[#A5A9B5] text-xs mt-2">
        Already have an account?{' '}
        <button type="button" onClick={() => onNavigate("login")} className="text-[#5B6CFF] font-semibold">Sign in</button>
      </p>
    </div>
  );
}

// ─── OTP verification screen ──────────────────────────────────────────────────

function OTPScreen({ email, onVerified, toast }: { email: string; onVerified: () => void; toast: (msg: string, color?: string) => void }) {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verifyEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await verifyEmail(email, otp);
      toast("Email verified! Welcome to Helpers.", "#22C55E");
      onVerified();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Verification failed. Please try again.", "#EF4444");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-8 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl" style={{ background:"linear-gradient(135deg,#5B6CFF,#7E57FF)" }}>H</div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Verify your email</h1>
        <p className="text-[#A5A9B5] text-sm text-center">Enter the 6-digit code sent to<br/><span className="text-white font-semibold">{email}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5]">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            required
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-4 py-3 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF] text-center tracking-[0.5em]"
          />
        </div>
        <button type="submit" disabled={isSubmitting || otp.length !== 6} className="w-full h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-60" style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}>
          {isSubmitting ? "Verifying…" : "Verify Email"}
        </button>
      </form>

      <p className="text-center text-[#A5A9B5] text-xs mt-2">
        Didn&apos;t receive it? Check your spam folder or try registering again.
      </p>
    </div>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────

function HomeScreen({ onNavigate, toast, user }: { onNavigate: (s: Screen, id?: string) => void; toast: (msg: string, color?: string) => void; user: { firstName?: string; lastName?: string; email?: string } | null }) {
  const [promoIdx, setPromoIdx] = useState(0);
  const { categories, isLoading: categoriesLoading, error: categoriesError, refetch } = useCategories();

  useEffect(() => {
    const t = setInterval(() => setPromoIdx((i) => (i + 1) % promos.length), 3500);
    return () => clearInterval(t);
  }, []);

  const promo = promos[promoIdx];
  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  const greeting = displayName ? `Hello, ${displayName}` : "Welcome to Helpers";

  const handlePromoCta = () => {
    if (promoIdx === 0) toast("Promo code FIRST30 applied! 30% off your first booking.", "#5B6CFF");
    else if (promoIdx === 1) onNavigate("profile");
    else toast("Referral link copied! Share with friends to earn ₹200.", "#22C55E");
  };

  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <button onClick={() => toast("Location services coming soon")} className="flex items-center gap-1.5 text-[#A5A9B5] text-sm mb-0.5">
            <MapPin size={13} className="text-[#5B6CFF]" />
            <span>Mumbai, India</span>
            <ChevronRight size={13} />
          </button>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{greeting}</h1>
        </div>
        <button onClick={() => toast("Notifications coming soon")} className="relative w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
          <Bell size={18} className="text-white" />
        </button>
      </div>

      {/* Search */}
      <button onClick={() => onNavigate("explore")} className="flex items-center gap-3 bg-[#20242D] rounded-2xl px-4 py-3.5 w-full text-left active:scale-[0.98] transition-transform">
        <Search size={18} className="text-[#A5A9B5] shrink-0" />
        <span className="flex-1 text-[#A5A9B5] text-sm">Search for a service or helper…</span>
        <div className="w-8 h-8 rounded-xl bg-[#5B6CFF] flex items-center justify-center shrink-0">
          <Filter size={14} className="text-white" />
        </div>
      </button>

      {/* Trending searches */}
      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth:"none" }}>
        {trendingSearches.map((term) => (
          <button key={term} onClick={() => onNavigate("explore")} className="shrink-0 flex items-center gap-1.5 bg-[#20242D] text-[#A5A9B5] text-xs font-medium px-3 py-2 rounded-full hover:text-white active:scale-95 transition-all">
            <TrendingUp size={11} className="text-[#5B6CFF]" />
            {term}
          </button>
        ))}
      </div>

      {/* Auto-rotating promo */}
      <div>
        <div className="rounded-2xl p-5 relative overflow-hidden cursor-pointer" style={{ background:promo.gradient }} onClick={handlePromoCta}>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20 bg-white" />
          <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full opacity-10 bg-white" />
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{promo.label}</span>
          <p className="text-white font-bold text-lg mt-1 leading-snug whitespace-pre-line" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{promo.title}</p>
          <div className="mt-3 inline-block bg-white text-xs font-bold px-4 py-2 rounded-xl" style={{ color:"#5B6CFF" }}>{promo.cta}</div>
        </div>
        <div className="flex justify-center gap-1.5 mt-2.5">
          {promos.map((_, i) => (
            <button key={i} onClick={() => setPromoIdx(i)} className="rounded-full transition-all duration-300" style={{ width:i===promoIdx?20:6, height:6, background:i===promoIdx?"#5B6CFF":"#20242D" }} />
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Services</h2>
          <button onClick={() => onNavigate("explore")} className="text-[#5B6CFF] text-sm font-semibold">See all</button>
        </div>
        {categoriesLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-full aspect-square rounded-2xl bg-[#20242D] animate-pulse" />
                <div className="h-3 w-12 bg-[#20242D] rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : categoriesError ? (
          <div className="text-center py-8">
            <p className="text-[#EF4444] text-sm">Failed to load categories</p>
            <button onClick={() => refetch()} className="mt-2 text-[#5B6CFF] text-sm font-semibold">Retry</button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#A5A9B5] text-sm">No categories available</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {categories.map((c) => {
              const style = getCategoryStyle(c.name);
              return (
                <button key={c.id} onClick={() => onNavigate("explore")} className="flex flex-col items-center gap-2 group">
                  <div className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl group-active:scale-90 transition-transform" style={{ background:style.bg }}>{style.icon}</div>
                  <span className="text-xs text-[#A5A9B5] font-medium text-center leading-tight">{c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Helpers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Top Helpers Nearby</h2>
          <button onClick={() => onNavigate("explore")} className="text-[#5B6CFF] text-sm font-semibold">See all</button>
        </div>
        <div className="flex flex-col gap-3">
          {ALL_PROVIDERS.slice(0,3).map((p) => <ProviderCard key={p.id} p={p} onClick={() => onNavigate("detail", p.id)} />)}
        </div>
      </div>

      {/* Testimonials */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ThumbsUp size={15} className="text-[#22C55E]" />
          <h2 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>What Customers Say</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
          {testimonials.map((t) => (
            <div key={t.id} className="shrink-0 w-60 bg-[#171A21] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background:t.avatarColor }}>{t.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-xs">{t.name}</p>
                  <p className="text-[#A5A9B5] text-[10px]">{t.service}</p>
                </div>
                <div className="flex gap-0.5 shrink-0">{Array.from({length:t.rating}).map((_,i)=><Star key={i} size={10} fill="#F59E0B" stroke="none"/>)}</div>
              </div>
              <p className="text-[#A5A9B5] text-xs leading-relaxed">&ldquo;{t.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Helpers */}
      <div className="bg-[#171A21] rounded-2xl p-5">
        <h3 className="font-bold text-white mb-4" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Why Helpers?</h3>
        <div className="flex flex-col gap-3">
          {[
            { icon:Shield,   text:"Background-verified professionals", color:"#22C55E" },
            { icon:Zap,      text:"Same-day service, 60-min response", color:"#F59E0B" },
            { icon:Sparkles, text:"Satisfaction guarantee on every job",color:"#5B6CFF" },
          ].map(({ icon:Icon, text, color }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${color}20` }}><Icon size={16} style={{ color }} /></div>
              <p className="text-sm text-[#A5A9B5]">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Refer & Earn */}
      <div className="rounded-2xl p-5" style={{ background:"linear-gradient(135deg,rgba(34,197,94,0.12) 0%,rgba(6,182,212,0.12) 100%)", border:"1px solid rgba(34,197,94,0.25)" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background:"rgba(34,197,94,0.15)" }}><Gift size={22} className="text-[#22C55E]" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Refer friends, earn ₹200 each</p>
            <p className="text-[#A5A9B5] text-xs mt-0.5">They get ₹100 off their first booking too!</p>
          </div>
          <button onClick={() => toast("Referral link copied! Share it to earn ₹200.", "#22C55E")} className="shrink-0 bg-[#22C55E] text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-90 transition-transform flex items-center gap-1">
            <Share2 size={12} />Invite
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Explore screen ───────────────────────────────────────────────────────────

function ExploreScreen({ onNavigate, toast }: { onNavigate: (s: Screen, id?: string) => void; toast: (msg: string, color?: string) => void }) {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 8;
  const { categories } = useCategories();

  // map active category name to categoryId param
  const activeCategory = active === 'All' ? undefined : categories.find((c) => c.name === active)?.id;

  const { services, total, isLoading, error, refetch } = useServices({ page, limit, categoryId: activeCategory, search: query || undefined });

  useEffect(() => {
    // reset page when filters change
    setPage(1);
  }, [activeCategory, query]);

  const onRetry = () => refetch();

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Search */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-3 flex-1 bg-[#20242D] rounded-2xl px-4 py-3.5">
          <Search size={18} className="text-[#A5A9B5] shrink-0" />
          <input className="bg-transparent flex-1 text-white text-sm outline-none placeholder:text-[#A5A9B5]" placeholder="Search services…" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query.length > 0 && <button onClick={() => setQuery("")} className="text-[#A5A9B5] hover:text-white"><X size={14}/></button>}
        </div>
        <button onClick={() => setShowFilter(!showFilter)} className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${showFilter ? "bg-[#5B6CFF]" : "bg-[#20242D]"}`}>
          <SlidersHorizontal size={18} className={showFilter ? "text-white" : "text-[#A5A9B5]"} />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
        {["All", ...categories.map((c) => c.name)].map((f) => (
          <button key={f} onClick={() => setActive(f)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${active===f?"bg-[#5B6CFF] text-white":"bg-[#20242D] text-[#A5A9B5] hover:text-white"}`}>{f}</button>
        ))}
      </div>

      <p className="text-[#A5A9B5] text-sm">{total} service{total!==1?"s":""} found{active!=="All"?` for ${active}`:""}</p>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center py-12">
            <Search size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
            <p className="text-[#A5A9B5]">Loading services…</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-[#EF4444] text-sm">{error}</p>
            <button onClick={onRetry} className="mt-2 text-[#5B6CFF] text-sm font-semibold">Retry</button>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <Search size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
            <p className="text-[#A5A9B5]">No services match your search</p>
            <button onClick={() => { setQuery(""); setActive("All"); }} className="mt-3 text-[#5B6CFF] text-sm font-semibold">Clear filters</button>
          </div>
        ) : (
          services.map((s) => <ServiceCard key={s.id} s={s} onClick={() => onNavigate("detail", s.id)} />)
        )}
      </div>

      {/* Pagination / Load more */}
      {!isLoading && services.length < total && (
        <div className="flex justify-center mt-3">
          <button onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl bg-[#5B6CFF] text-white font-semibold">Load more</button>
        </div>
      )}
    </div>
  );
}

// ─── Detail screen ────────────────────────────────────────────────────────────

function DetailScreen({ providerId, onBack, onBook, toast }: { providerId: string; onBack: () => void; onBook: () => void; toast: (msg: string, color?: string) => void }) {
  const { service, isLoading, error, refetch } = useService(providerId);
  const [liked, setLiked] = useState(false);

  const onRetry = () => refetch();

  if (isLoading) {
    return (
      <div className="flex flex-col pb-4">
        <div className="relative -mx-5 h-56 bg-[#20242D] animate-pulse" />
        <div className="p-4">
          <div className="h-6 bg-[#20242D] rounded w-3/4 mb-3 animate-pulse" />
          <div className="h-4 bg-[#20242D] rounded w-1/2 mb-3 animate-pulse" />
          <div className="space-y-2">
            <div className="h-12 bg-[#20242D] rounded animate-pulse" />
            <div className="h-12 bg-[#20242D] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#EF4444] text-sm">{error}</p>
        <div className="mt-3 flex justify-center gap-2">
          <button onClick={onRetry} className="text-[#5B6CFF] text-sm font-semibold">Retry</button>
          <button onClick={onBack} className="text-[#A5A9B5] text-sm">Back</button>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <Search size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
        <p className="text-[#A5A9B5]">Service not found</p>
        <button onClick={onBack} className="mt-3 text-[#5B6CFF] text-sm font-semibold">Back</button>
      </div>
    );
  }

  const name = service.title ?? 'Service';
  const subtitle = service.category?.name ?? 'Service details';
  const price = typeof service.price === 'number' ? `₹${service.price.toLocaleString()}` : 'Price available on request';
  const rating = typeof service.helper?.rating === 'number' ? `${service.helper.rating.toFixed(1)}★` : '—';
  const helperName = service.helper?.user ? `${service.helper.user.firstName} ${service.helper.user.lastName ?? ''}`.trim() : '';
  const helperInfoAvailable = Boolean(helperName || (typeof service.helper?.rating === 'number'));
  const description = service.description?.trim() || 'No description available.';

  return (
    <div className="flex flex-col pb-4">
      <div className="relative -mx-5 h-56 bg-[#20242D]">
        {service.media?.[0]?.url ? (
          <>
            <img src={service.media[0].url} alt={name} className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0" style={{ background:"linear-gradient(to bottom,rgba(15,17,21,0.3) 0%,rgba(15,17,21,0.85) 100%)" }} />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(91,108,255,0.35),_transparent_55%)]" />
        )}
        <button onClick={onBack} className="absolute top-4 left-5 w-10 h-10 rounded-full bg-[rgba(15,17,21,0.6)] backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <button onClick={() => { setLiked(!liked); if(!liked) toast(`${name} saved to favourites ❤️`, "#EF4444"); }} className="absolute top-4 right-5 w-10 h-10 rounded-full bg-[rgba(15,17,21,0.6)] backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
          <Heart size={18} fill={liked?"#EF4444":"none"} className={liked?"text-[#EF4444]":"text-white"} />
        </button>
      </div>

      <div className="flex flex-col gap-5 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{name}</h2>
            <p className="text-[#A5A9B5] text-sm mt-0.5">{service.description ?? subtitle}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{price}</p>
            <p className="text-[#A5A9B5] text-xs">{service.priceType ?? 'per visit'}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Rating", value:rating, color:"#F59E0B" },
            { label:"Category", value:service.category?.name ?? '—', color:"#5B6CFF" },
            { label:"Duration", value:service.duration ? `${service.duration}m` : '—', color:"#22C55E" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#20242D] rounded-xl p-3 text-center">
              <p className="font-bold text-base" style={{ color }}>{value}</p>
              <p className="text-[#A5A9B5] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {helperInfoAvailable ? (
          <div className="bg-[#171A21] rounded-2xl p-4">
            <h3 className="font-bold text-white mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Helper</h3>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-white font-semibold">{helperName || 'Helper details available'}</p>
                <p className="text-[#A5A9B5] text-sm">{service.category?.name ?? 'Service'} provider</p>
              </div>
              {typeof service.helper?.rating === 'number' && (
                <div className="flex items-center gap-1 text-[#F59E0B] text-sm font-semibold">
                  <Star size={12} fill="#F59E0B" stroke="none" />
                  {service.helper.rating.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#171A21] rounded-2xl p-4">
            <h3 className="font-bold text-white mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Helper information unavailable</h3>
            <p className="text-[#A5A9B5] text-sm">This service is currently missing helper details.</p>
          </div>
        )}

        <div className="bg-[#171A21] rounded-2xl p-4">
          <h3 className="font-bold text-white mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>About</h3>
          <p className="text-[#A5A9B5] text-sm leading-relaxed">{description}</p>
        </div>

        <div className="mt-2">
          <button onClick={onBook} className="w-full h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity" style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking screen ───────────────────────────────────────────────────────────

function BookingScreen({
  serviceId,
  onBack,
  onBookingCreated,
  toast,
  onNavigate,
}: {
  serviceId: string;
  onBack: () => void;
  /** Called with the successfully created BookingData. */
  onBookingCreated: (booking: BookingData) => void;
  toast: (msg: string, color?: string) => void;
  onNavigate: (s: Screen, id?: string) => void;
}) {
  const { addresses, isLoading: addressesLoading, error: addressesError, refetch } = useAddresses();
  const { service, isLoading: serviceLoading, error: serviceError, refetch: refetchService } = useService(serviceId);
  const [selectedDate, setSelectedDate] = useState("12 Jul");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dates = ["11 Jul","12 Jul","13 Jul","14 Jul","15 Jul"];
  const times = ["08:00 AM","10:00 AM","12:00 PM","2:00 PM","4:00 PM","6:00 PM"];

  const servicePrice = typeof service?.price === "number" ? service.price : 0;
  const discount = promoApplied ? 180 : 0;
  const displayTotal = Math.max(0, servicePrice + 49 - discount);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null;

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId(null);
      return;
    }
    if (!selectedAddressId || !addresses.some((a) => a.id === selectedAddressId)) {
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId]);

  const applyPromo = () => {
    if (promoInput.trim().toUpperCase() === "FIRST30") { setPromoApplied(true); toast("Promo FIRST30 applied! −₹180 discount added.", "#22C55E"); }
    else toast("Invalid promo code. Try FIRST30.", "#EF4444");
  };

  const formatAddress = (addr: AddressData | null) => {
    if (!addr) return null;
    const parts = [addr.label, addr.houseNo, addr.street, addr.city, addr.state, addr.country, addr.postalCode].filter(Boolean);
    return parts.join(", ");
  };

  const handleConfirm = async () => {
    if (isSubmitting) return; // prevent duplicate submissions

    if (!serviceId) {
      toast("Service information is missing. Please go back and try again.", "#EF4444");
      return;
    }

    if (addressesLoading) {
      toast("Still loading your addresses. Please wait.", "#F59E0B");
      return;
    }

    if (addresses.length === 0) {
      toast("No saved addresses. Please add an address first.", "#EF4444");
      onNavigate("addresses");
      return;
    }

    if (!selectedAddressId) {
      toast("Please select a delivery address before confirming.", "#EF4444");
      return;
    }

    const isoTimestamp = buildBookingIso(selectedDate, selectedTime);
    if (!isoTimestamp) {
      toast("Could not parse selected date/time. Please reselect.", "#EF4444");
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await bookingsApi.create({
        serviceId,
        addressId: selectedAddressId,
        bookingDate: isoTimestamp,
        scheduledAt: isoTimestamp,
      });
      onBookingCreated(booking);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create booking. Please try again.";
      toast(message, "#EF4444");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center gap-4 pt-2">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Book a Helper</h2>
      </div>

      {/* Date */}
      <div>
        <h3 className="font-bold text-white mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Select Date</h3>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
          {dates.map((d) => (
            <button key={d} onClick={() => setSelectedDate(d)} className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${selectedDate===d?"bg-[#5B6CFF] text-white":"bg-[#20242D] text-[#A5A9B5] hover:text-white"}`}>{d}</button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div>
        <h3 className="font-bold text-white mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Select Time</h3>
        <div className="grid grid-cols-3 gap-2">
          {times.map((t) => (
            <button key={t} onClick={() => setSelectedTime(t)} className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${selectedTime===t?"bg-[#5B6CFF] text-white":"bg-[#20242D] text-[#A5A9B5] hover:text-white"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Address */}
      <div className="bg-[#171A21] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Address</h3>
          {addresses.length > 0 && (
            <button onClick={() => setShowAddressPicker(true)} className="text-[#5B6CFF] text-sm font-semibold">Change</button>
          )}
        </div>
        {addressesLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-[#20242D] rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-[#20242D] rounded w-1/2 animate-pulse" />
          </div>
        ) : addressesError && addresses.length === 0 ? (
          <div>
            <p className="text-[#EF4444] text-sm mb-2">{addressesError}</p>
            <button onClick={refetch} className="text-[#5B6CFF] text-sm font-semibold">Retry</button>
          </div>
        ) : addresses.length === 0 ? (
          <div>
            <p className="text-[#A5A9B5] text-sm mb-2">No saved addresses</p>
            <button onClick={() => onNavigate("addresses")} className="text-[#5B6CFF] text-sm font-semibold">Add Address</button>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-[#5B6CFF] mt-0.5 shrink-0" />
            <p className="text-[#A5A9B5] text-sm">{formatAddress(selectedAddress) || "Select an address"}</p>
          </div>
        )}
      </div>

      {/* Promo code */}
      <div className="bg-[#171A21] rounded-2xl p-4 flex gap-2">
        <input
          className="flex-1 bg-[#20242D] rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5]"
          placeholder="Promo code (try FIRST30)"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
          disabled={promoApplied}
        />
        <button onClick={applyPromo} disabled={promoApplied} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${promoApplied?"bg-[#22C55E] text-white":"bg-[#5B6CFF] text-white active:opacity-80"}`}>
          {promoApplied ? "Applied ✓" : "Apply"}
        </button>
      </div>

      {/* Price summary (display only — actual booking amount set by backend) */}
      <div className="bg-[#171A21] rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Estimated Summary</h3>
        {serviceLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-[#20242D] rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-[#20242D] rounded w-1/2 animate-pulse" />
          </div>
        ) : serviceError ? (
          <div>
            <p className="text-[#EF4444] text-sm mb-2">{serviceError}</p>
            <button onClick={refetchService} className="text-[#5B6CFF] text-sm font-semibold">Retry</button>
          </div>
        ) : servicePrice > 0 ? (
          <>
            {[
              { label:"Service", value:`₹${servicePrice.toLocaleString()}`, green:false },
              { label:"Platform fee",     value:"₹49",  green:false },
              ...(promoApplied ? [{ label:"Discount (FIRST30)", value:"−₹180", green:true }] : []),
            ].map(({ label, value, green }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-[#A5A9B5]">{label}</span>
                <span className={green?"text-[#22C55E] font-semibold":"text-white"}>{value}</span>
              </div>
            ))}
            <div className="border-t border-[rgba(255,255,255,0.08)] pt-3 flex justify-between">
              <span className="font-bold text-white">Estimated Total</span>
              <span className="font-bold text-white text-lg">₹{displayTotal.toLocaleString()}</span>
            </div>
            <p className="text-[#A5A9B5] text-[10px] mt-1">Final amount determined by service pricing at booking time.</p>
          </>
        ) : (
          <p className="text-[#A5A9B5] text-sm">Price information unavailable</p>
        )}
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={isSubmitting || addressesLoading}
        className="w-full h-14 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-60"
        style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}
      >
        <CheckCircle2 size={20} />
        {isSubmitting ? "Confirming…" : "Confirm Booking"}
      </button>

      {showAddressPicker && (
        <BookingAddressPickerModal
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          onSelect={setSelectedAddressId}
          onClose={() => setShowAddressPicker(false)}
          onConfirm={(id) => { setSelectedAddressId(id); setShowAddressPicker(false); }}
        />
      )}
    </div>
  );
}

function BookingAddressPickerModal({ addresses, selectedAddressId, onSelect, onClose, onConfirm }: { addresses: AddressData[]; selectedAddressId: string | null; onSelect: (id: string) => void; onClose: () => void; onConfirm: (id: string) => void }) {
  const [tempId, setTempId] = useState(selectedAddressId);
  useEffect(() => { setTempId(selectedAddressId); }, [selectedAddressId]);

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8">
      <div className="bg-[#171A21] rounded-3xl p-5 w-full max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Select Address</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
            <X size={16} className="text-white" />
          </button>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto flex-1">
          {addresses.map((addr) => {
            const isSelected = addr.id === tempId;
            return (
              <button
                key={addr.id}
                onClick={() => setTempId(addr.id)}
                className={`text-left rounded-2xl p-4 border transition-colors ${isSelected ? "border-[#5B6CFF] bg-[rgba(91,108,255,0.08)]" : "border-transparent bg-[#20242D]"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={14} className={`shrink-0 ${isSelected ? "text-[#5B6CFF]" : "text-[#A5A9B5]"}`} />
                  <span className="font-bold text-white text-sm">{addr.label || "Address"}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.16)] text-[#FBBF24]">Default</span>
                  )}
                </div>
                <p className="text-[#A5A9B5] text-sm">{addr.houseNo}, {addr.street}</p>
                <p className="text-[#A5A9B5] text-sm">{addr.city}, {addr.state}, {addr.country} - {addr.postalCode}</p>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-[#20242D] text-white font-bold">Cancel</button>
          <button onClick={() => onConfirm(tempId)} disabled={!tempId} className="flex-1 h-12 rounded-2xl font-bold text-white disabled:opacity-70" style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ─── Address form modal ─────────────────────────────────────────────────────

interface AddressFormValues {
  label: string;
  houseNo: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
}

function toAddressFormValues(address?: Partial<AddressData> | null): AddressFormValues {
  return {
    label: address?.label ?? "",
    houseNo: address?.houseNo ?? "",
    street: address?.street ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    country: address?.country ?? "",
    postalCode: address?.postalCode ?? "",
    latitude: address?.latitude != null ? String(address.latitude) : "",
    longitude: address?.longitude != null ? String(address.longitude) : "",
    isDefault: Boolean(address?.isDefault),
  };
}

function toAddressPayload(values: AddressFormValues): CreateAddressRequest {
  const payload: CreateAddressRequest = {
    houseNo: values.houseNo.trim(),
    street: values.street.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
    postalCode: values.postalCode.trim(),
    isDefault: Boolean(values.isDefault),
  };

  const label = values.label.trim();
  if (label) payload.label = label;

  if (values.latitude.trim()) payload.latitude = Number(values.latitude);
  if (values.longitude.trim()) payload.longitude = Number(values.longitude);

  return payload;
}

function AddressFormModal({
  isOpen,
  initialAddress,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  isOpen: boolean;
  initialAddress: AddressData | null;
  onClose: () => void;
  onSubmit: (payload: CreateAddressRequest) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const [form, setForm] = useState<AddressFormValues>(toAddressFormValues(initialAddress));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setForm(toAddressFormValues(initialAddress));
    setLocalError(null);
  }, [initialAddress, isOpen]);

  if (!isOpen) return null;

  const updateField = (field: keyof AddressFormValues, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const requiredFields: Array<keyof AddressFormValues> = ["houseNo", "street", "city", "state", "country", "postalCode"];
    const missingField = requiredFields.find((field) => !String(form[field]).trim());
    if (missingField) {
      setLocalError("Please fill in all required address fields.");
      return;
    }

    const latitude = form.latitude.trim();
    const longitude = form.longitude.trim();
    if ((latitude && Number.isNaN(Number(latitude))) || (longitude && Number.isNaN(Number(longitude)))) {
      setLocalError("Latitude and longitude must be numeric values.");
      return;
    }

    setLocalError(null);
    await onSubmit(toAddressPayload(form));
  };

  const fieldClass = "w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]";

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8">
      <div className="bg-[#171A21] rounded-3xl p-5 w-full max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{initialAddress ? "Edit Address" : "Add Address"}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
            <X size={16} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Label</label>
            <input value={form.label} onChange={(e) => updateField("label", e.target.value)} placeholder="Home, Office, etc." className={fieldClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">House No <span className="text-[#EF4444]">*</span></label>
              <input value={form.houseNo} onChange={(e) => updateField("houseNo", e.target.value)} className={fieldClass} required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Postal Code <span className="text-[#EF4444]">*</span></label>
              <input value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} className={fieldClass} required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Street <span className="text-[#EF4444]">*</span></label>
            <input value={form.street} onChange={(e) => updateField("street", e.target.value)} className={fieldClass} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">City <span className="text-[#EF4444]">*</span></label>
              <input value={form.city} onChange={(e) => updateField("city", e.target.value)} className={fieldClass} required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">State <span className="text-[#EF4444]">*</span></label>
              <input value={form.state} onChange={(e) => updateField("state", e.target.value)} className={fieldClass} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Country <span className="text-[#EF4444]">*</span></label>
              <input value={form.country} onChange={(e) => updateField("country", e.target.value)} className={fieldClass} required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Latitude</label>
              <input value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} placeholder="Optional" className={fieldClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Longitude</label>
            <input value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} placeholder="Optional" className={fieldClass} />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#A5A9B5]">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => updateField("isDefault", e.target.checked)} className="h-4 w-4 rounded border-[rgba(255,255,255,0.12)] bg-[#20242D] text-[#5B6CFF]" />
            Set as default address
          </label>

          {(localError || submitError) && (
            <div className="rounded-xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm text-[#FCA5A5]">
              {localError ?? submitError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-12 rounded-2xl bg-[#20242D] text-white font-bold">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-2xl font-bold text-white disabled:opacity-70" style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}>
              {isSubmitting ? "Saving..." : initialAddress ? "Save Changes" : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Address screen ───────────────────────────────────────────────────────────

function AddressScreen({ onBack, toast }: { onBack: () => void; toast: (msg: string, color?: string) => void }) {
  const { addresses, isLoading, error, refetch, createAddress, updateAddress, deleteAddress } = useAddresses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const openCreateForm = () => {
    setEditingAddress(null);
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (address: AddressData) => {
    setEditingAddress(address);
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (payload: CreateAddressRequest) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, payload);
        toast("Address updated successfully.", "#22C55E");
      } else {
        await createAddress(payload);
        toast("Address saved successfully.", "#22C55E");
      }
      setIsFormOpen(false);
      setEditingAddress(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save address.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress(id);
      toast("Address removed.", "#EF4444");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to delete address.", "#EF4444");
    }
  };

  const handleSetAsDefault = async (id: string) => {
    try {
      await updateAddress(id, { isDefault: true });
      toast("Default address updated.", "#5B6CFF");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Unable to update default address.", "#EF4444");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-4 pt-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Saved Addresses</h2>
        </div>
        <div className="space-y-3">
          {[1,2,3].map((item) => (
            <div key={item} className="h-28 rounded-2xl bg-[#171A21] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && addresses.length === 0) {
    return (
      <div className="flex flex-col gap-4 pb-4 pt-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Saved Addresses</h2>
        </div>
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-4 text-center">
          <p className="text-[#FCA5A5] text-sm">{error}</p>
          <button onClick={() => refetch()} className="mt-3 text-[#5B6CFF] text-sm font-semibold">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4 pt-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Saved Addresses</h2>
        </div>
        <button onClick={openCreateForm} className="flex items-center gap-2 rounded-xl bg-[#5B6CFF] px-3 py-2 text-xs font-bold text-white active:scale-95 transition-transform">
          <Plus size={14} /> Add
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm text-[#FCA5A5] flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => refetch()} className="text-[#5B6CFF] font-semibold">Retry</button>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5]">No saved addresses yet</p>
          <button onClick={openCreateForm} className="mt-3 text-[#5B6CFF] text-sm font-semibold">Add your first address</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <div key={address.id} className="bg-[#171A21] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={14} className="text-[#5B6CFF] shrink-0" />
                    <span className="font-bold text-white text-sm">
                      {address.label || "Address"}
                    </span>
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(245,158,11,0.16)] px-2 py-0.5 text-[10px] font-bold text-[#FBBF24]">
                        <Star size={10} fill="#FBBF24" stroke="none" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-[#A5A9B5] text-sm leading-relaxed">
                    {address.houseNo}, {address.street}
                  </p>
                  <p className="text-[#A5A9B5] text-sm leading-relaxed">
                    {address.city}, {address.state}, {address.country} - {address.postalCode}
                  </p>
                  {(address.latitude !== null && address.latitude !== undefined) || (address.longitude !== null && address.longitude !== undefined) ? (
                    <p className="text-[#A5A9B5] text-[11px] mt-1">
                      {address.latitude != null ? `Lat: ${address.latitude}` : ""}
                      {address.latitude != null && address.longitude != null ? " • " : ""}
                      {address.longitude != null ? `Lng: ${address.longitude}` : ""}
                    </p>
                  ) : null}
                </div>
                {address.isDefault && <Star size={16} className="text-[#FBBF24] fill-[#FBBF24] shrink-0" />}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {!address.isDefault && (
                  <button onClick={() => handleSetAsDefault(address.id)} className="rounded-xl bg-[rgba(91,108,255,0.12)] px-3 py-1.5 text-xs font-semibold text-[#5B6CFF] active:scale-95 transition-transform">
                    Set as default
                  </button>
                )}
                <button onClick={() => openEditForm(address)} className="rounded-xl bg-[#20242D] px-3 py-1.5 text-xs font-semibold text-white active:scale-95 transition-transform">
                  Edit
                </button>
                <button onClick={() => handleDelete(address.id)} className="rounded-xl bg-[rgba(239,68,68,0.12)] px-3 py-1.5 text-xs font-semibold text-[#FCA5A5] active:scale-95 transition-transform">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressFormModal
        isOpen={isFormOpen}
        initialAddress={editingAddress}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAddress(null);
          setSubmitError(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </div>
  );
}

// ─── Bookings screen ──────────────────────────────────────────────────────────

/** PENDING, ACCEPTED, ONGOING → upcoming tab; COMPLETED, CANCELLED → past tab */
const UPCOMING_STATUSES: ApiBookingStatus[] = ["PENDING", "ACCEPTED", "ONGOING"];

function formatBookingDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function BookingCard({
  booking,
  onCancel,
  isCancelling,
  onViewDetails,
}: {
  booking: BookingData;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  onViewDetails: (id: string) => void;
}) {
  const helperName = `${booking.helper.user.firstName} ${booking.helper.user.lastName}`.trim();
  const scheduledDisplay = formatBookingDate(booking.scheduledAt ?? booking.bookingDate);
  const amountDisplay = typeof booking.totalAmount === "number" ? `₹${booking.totalAmount.toLocaleString()}` : "—";
  const isPending = booking.status === "PENDING";

  return (
    <div className="bg-[#171A21] rounded-2xl p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-snug truncate" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {booking.service.title}
          </p>
          <p className="text-[#A5A9B5] text-xs mt-0.5 truncate">
            {helperName || "Helper"}
          </p>
        </div>
        <BookingStatusPill status={booking.status} />
      </div>

      {/* Date / time */}
      <div className="flex items-center gap-1.5 text-xs text-[#A5A9B5] mb-1">
        <CalendarCheck size={11} className="shrink-0" />
        <span>{scheduledDisplay}</span>
      </div>

      {/* Payment status badge */}
      {booking.payment?.status && (
        <div className="flex items-center gap-1.5 text-xs text-[#A5A9B5]">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: booking.payment.status === "SUCCESS" ? "#22C55E" : "#F59E0B" }} />
          <span>Payment: {booking.payment.status}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
        <span className="text-white font-bold">{amountDisplay}</span>
        <div className="flex gap-2">
          {isPending && (
            <button
              onClick={() => onCancel(booking.id)}
              disabled={isCancelling}
              className="text-xs font-semibold text-[#EF4444] bg-[rgba(239,68,68,0.1)] px-3 py-1.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
            >
              {isCancelling ? "Cancelling…" : "Cancel"}
            </button>
          )}
          <button
            onClick={() => onViewDetails(booking.id)}
            className="text-xs font-semibold text-white bg-[#20242D] px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingSkeletonCard() {
  return (
    <div className="bg-[#171A21] rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 bg-[#20242D] rounded w-3/4" />
          <div className="h-3 bg-[#20242D] rounded w-1/2" />
        </div>
        <div className="h-6 w-16 bg-[#20242D] rounded-full" />
      </div>
      <div className="h-3 bg-[#20242D] rounded w-2/5" />
      <div className="flex items-center justify-between pt-3 border-t border-[rgba(255,255,255,0.06)]">
        <div className="h-4 bg-[#20242D] rounded w-12" />
        <div className="h-7 bg-[#20242D] rounded-xl w-24" />
      </div>
    </div>
  );
}

function BookingsScreen({ onNavigate, onViewDetails, toast }: { onNavigate: (s: Screen, id?: string) => void; onViewDetails: (bookingId: string) => void; toast: (msg: string, color?: string) => void }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { bookings, isLoading, error, refetch, cancelBooking } = useBookings("customer");

  const upcoming = bookings.filter((b) => (UPCOMING_STATUSES as string[]).includes(b.status));
  const past     = bookings.filter((b) => !(UPCOMING_STATUSES as string[]).includes(b.status));
  const filtered = tab === "upcoming" ? upcoming : past;

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      await cancelBooking(id);
      toast("Booking cancelled.", "#EF4444");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to cancel booking.", "#EF4444");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>My Bookings</h2>
        <p className="text-[#A5A9B5] text-sm mt-0.5">Track and manage your service history</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-[#20242D] rounded-2xl p-1">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors capitalize ${
              tab === t ? "bg-[#5B6CFF] text-white" : "text-[#A5A9B5]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content area */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingSkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <CalendarCheck size={36} className="text-[#EF4444] mx-auto mb-3 opacity-60" />
          <p className="text-[#FCA5A5] text-sm mb-3">{error}</p>
          <button
            onClick={() => refetch()}
            className="text-[#5B6CFF] text-sm font-semibold bg-[rgba(91,108,255,0.12)] px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <CalendarCheck size={48} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5]">No {tab} bookings</p>
          {tab === "upcoming" && (
            <button
              onClick={() => onNavigate("explore")}
              className="mt-3 bg-[#5B6CFF] text-white text-sm font-bold px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
            >
              Book a Service
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={handleCancel}
              isCancelling={cancellingId === b.id}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Booking details screen ───────────────────────────────────────────────────

function BookingDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0">
      <span className="text-[#A5A9B5] text-sm shrink-0">{label}</span>
      <span className="text-white text-sm font-semibold text-right break-all">{value}</span>
    </div>
  );
}

function BookingDetailsScreen({
  bookingId,
  onBack,
  toast,
}: {
  bookingId: string;
  onBack: () => void;
  toast: (msg: string, color?: string) => void;
}) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // ── Payment state ─────────────────────────────────────────────────────────
  // isPaying covers the entire payment lifecycle:
  //   creating the order → loading Checkout script → waiting for /verify
  // This prevents double-clicks / duplicate orders.
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const fetchBooking = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.get(bookingId);
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleCancel = async () => {
    if (!booking || isCancelling) return;
    setIsCancelling(true);
    try {
      await bookingsApi.cancel(booking.id);
      setBooking((prev) => prev ? { ...prev, status: "CANCELLED" } : prev);
      toast("Booking cancelled.", "#EF4444");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to cancel booking.", "#EF4444");
    } finally {
      setIsCancelling(false);
    }
  };

  // ── Payment handler ───────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!booking || isPaying) return;

    setIsPaying(true);
    setPayError(null);

    try {
      // Step 1 — create / reuse the Razorpay order on the backend.
      // The backend amount is authoritative; we never derive it locally.
      const orderResp = await paymentsApi.createOrder({
        bookingId: booking.id,
        method: "UPI",
      });

      // Step 2 — load the Razorpay Checkout script (no-op if already loaded).
      await loadRazorpayScript();

      // Step 3 — open Razorpay Checkout.
      // The handler is only reached when Razorpay deems the payment successful;
      // we still verify server-side before updating any UI state.
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: orderResp.keyId,
          amount: orderResp.amount * 100, // API amount is INR; Razorpay Checkout expects paise
          currency: orderResp.currency,
          order_id: orderResp.orderId,
          name: "Helpers",
          description: booking.service.title,
          theme: { color: "#5B6CFF" },
          modal: {
            escape: false,
            ondismiss: () => {
              // User closed Checkout without paying — allow retry, no success.
              setIsPaying(false);
              resolve();
            },
          },
          handler: async (response) => {
            // Step 4 — verify the payment signature server-side.
            // Only after this call succeeds do we treat the payment as done.
            try {
              await paymentsApi.verify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              // Step 5 — refetch booking from backend so UI reflects server state.
              // We do NOT manually set payment.status = SUCCESS here.
              const refreshed = await bookingsApi.get(bookingId);
              setBooking(refreshed);
              toast("Payment successful!", "#22C55E");
              resolve();
            } catch (verifyErr) {
              // Verification failed — do NOT mark as paid.
              const msg = verifyErr instanceof Error
                ? verifyErr.message
                : "Payment verification failed. Please contact support.";
              setPayError(msg);
              reject(new Error(msg));
            } finally {
              setIsPaying(false);
            }
          },
        });

        rzp.open();
      });
    } catch (err) {
      // Any error before/during Checkout (order creation, script load, verify).
      // ondismiss also calls setIsPaying(false), so only set here on hard errors.
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
      setPayError(msg);
      setIsPaying(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col pb-4">
        {/* Back header */}
        <div className="flex items-center gap-4 pt-2 pb-5">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="h-5 bg-[#20242D] rounded w-36 animate-pulse" />
        </div>
        {/* Skeleton rows */}
        <div className="bg-[#171A21] rounded-2xl p-4 flex flex-col gap-1 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-between py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0">
              <div className="h-4 bg-[#20242D] rounded w-24" />
              <div className="h-4 bg-[#20242D] rounded w-28" />
            </div>
          ))}
        </div>
        <div className="h-12 bg-[#20242D] rounded-2xl mt-5 animate-pulse" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col gap-4 pt-2 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="font-bold text-white text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Booking Details</h2>
        </div>
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <CalendarCheck size={36} className="text-[#EF4444] mx-auto mb-3 opacity-60" />
          <p className="text-[#FCA5A5] text-sm mb-3">{error}</p>
          <button
            onClick={fetchBooking}
            className="text-[#5B6CFF] text-sm font-semibold bg-[rgba(91,108,255,0.12)] px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!booking) {
    return (
      <div className="flex flex-col gap-4 pt-2 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="font-bold text-white text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Booking Details</h2>
        </div>
        <div className="text-center py-12">
          <CalendarCheck size={48} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5]">Booking not found.</p>
          <button onClick={onBack} className="mt-3 text-[#5B6CFF] text-sm font-semibold">Go back</button>
        </div>
      </div>
    );
  }

  // ── Detail view ───────────────────────────────────────────────────────────
  const helperName = `${booking.helper.user.firstName} ${booking.helper.user.lastName}`.trim();
  const scheduledDisplay = formatBookingDate(booking.scheduledAt ?? booking.bookingDate);
  const amountDisplay = typeof booking.totalAmount === "number" ? `₹${booking.totalAmount.toLocaleString()}` : "—";
  const isPending = booking.status === "PENDING";
  const paymentStatus = booking.payment?.status;
  const isAlreadyPaid = paymentStatus === "SUCCESS";

  const rows: Array<[string, string]> = [
    ["Booking ID",  booking.id],
    ["Service",     booking.service.title],
    ["Helper",      helperName || "—"],
    ["Status",      booking.status],
    ["Scheduled",   scheduledDisplay],
    ["Amount",      amountDisplay],
    ...(paymentStatus ? [["Payment", paymentStatus] as [string, string]] : []),
    ...(booking.notes?.trim() ? [["Notes", booking.notes.trim()] as [string, string]] : []),
  ];

  return (
    <div className="flex flex-col pb-4">
      {/* Header */}
      <div className="flex items-center gap-4 pt-2 pb-5">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-lg truncate" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {booking.service.title}
          </h2>
          <p className="text-[#A5A9B5] text-xs mt-0.5">Booking details</p>
        </div>
        <BookingStatusPill status={booking.status} />
      </div>

      {/* Detail rows */}
      <div className="bg-[#171A21] rounded-2xl px-4">
        {rows.map(([label, value]) => (
          <BookingDetailRow key={label} label={label} value={value} />
        ))}
      </div>

      {/* ── Payment section ──────────────────────────────────────────────── */}
      {/* Show whenever booking is not CANCELLED — payment can be collected
          for PENDING, ACCEPTED, or ONGOING bookings. Hide if cancelled. */}
      {booking.status !== "CANCELLED" && (
        <div className="mt-4 bg-[#171A21] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#A5A9B5] text-sm font-medium">Payment</span>
            <span className="text-white font-bold">{amountDisplay}</span>
          </div>

          {isAlreadyPaid ? (
            /* ── Paid state ─────────────────────────────────────────────── */
            <div className="flex items-center gap-2 justify-center bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded-xl px-4 py-3">
              <CheckCircle2 size={16} className="text-[#22C55E] shrink-0" />
              <span className="text-[#22C55E] text-sm font-semibold">Paid</span>
            </div>
          ) : (
            /* ── Pay Now / paying state ─────────────────────────────────── */
            <button
              id="pay-now-btn"
              onClick={handlePay}
              disabled={isPaying}
              className="w-full h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#22C55E 0%,#16A34A 100%)" }}
            >
              {isPaying ? (
                <>
                  <Timer size={16} className="animate-spin" />
                  Processing…
                </>
              ) : (
                "Pay Now"
              )}
            </button>
          )}

          {/* Verification error — visible after Checkout success but verify fails */}
          {payError && (
            <div className="mt-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] px-4 py-3">
              <p className="text-[#FCA5A5] text-xs text-center">{payError}</p>
              <button
                onClick={() => { setPayError(null); }}
                className="mt-2 w-full text-[#5B6CFF] text-xs font-semibold text-center"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel action — PENDING only */}
      {isPending && (
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="mt-4 w-full h-12 rounded-2xl font-bold text-[#EF4444] border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)] flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
        >
          {isCancelling ? "Cancelling…" : "Cancel Booking"}
        </button>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="mt-3 w-full h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
        style={{ background: "linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}
      >
        <ArrowLeft size={16} />
        Back to Bookings
      </button>
    </div>
  );
}

// ─── Profile screen ───────────────────────────────────────────────────────────

function ProfileScreen({ onNavigate, toast }: { onNavigate: (s: Screen) => void; toast: (msg: string, color?: string) => void }) {
  const { user, logout } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const initial = fullName ? fullName.charAt(0).toUpperCase() : "?";
  const menuItems = [
    { icon:"📍", label:"Saved Addresses",   action: () => onNavigate("addresses") },
    { icon:"💳", label:"Payment Methods",   action: () => toast("Manage payment methods") },
    { icon:"🔔", label:"Notifications",     action: () => toast("Notifications coming soon") },
    { icon:"🛡️", label:"Privacy & Security",action: () => toast("Privacy settings opening…") },
    { icon:"💬", label:"Help & Support",    action: () => toast("Connecting to support…", "#22C55E") },
    { icon:"⭐", label:"Rate the App",      action: () => toast("Thanks for rating Helpers! ⭐⭐⭐⭐⭐", "#F59E0B") },
    { icon:"🚪", label:"Sign Out",          action: handleSignOut },
  ];

  const handleSignOut = async () => {
    try {
      await logout();
      toast("Signed out successfully", "#22C55E");
    } catch {
      toast("Signed out", "#5B6CFF");
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-4 flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5B6CFF] to-[#7E57FF] flex items-center justify-center text-3xl font-bold text-white">{initial}</div>
          <button onClick={() => toast("Photo update coming soon!")} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#5B6CFF] border-2 border-[#0F1115] flex items-center justify-center active:scale-90 transition-transform">
            <Plus size={13} className="text-white" />
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{fullName || "User"}</h2>
          <p className="text-[#A5A9B5] text-sm">{user?.email ?? ""}</p>
        </div>
      </div>

      {/* Membership */}
      <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background:"linear-gradient(135deg,rgba(91,108,255,0.15) 0%,rgba(126,87,255,0.15) 100%)", border:"1px solid rgba(91,108,255,0.3)" }}>
        <div>
          <p className="text-xs text-[#5B6CFF] font-bold uppercase tracking-wider">Helpers Plus</p>
          <p className="text-white font-bold mt-0.5">Upgrade for free priority booking</p>
          <p className="text-[#A5A9B5] text-xs mt-0.5">Starts at ₹99/month</p>
        </div>
        <button onClick={() => toast("Helpers Plus trial activated! Enjoy priority booking.", "#5B6CFF")} className="text-white font-bold text-sm px-4 py-2 rounded-xl active:scale-90 transition-transform" style={{ background:"linear-gradient(135deg,#5B6CFF,#7E57FF)" }}>
          Try Free
        </button>
      </div>

      <div className="bg-[#171A21] rounded-2xl overflow-hidden">
        {menuItems.map((item, i) => (
          <button key={item.label} onClick={item.action} className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-[#20242D] active:bg-[#252933] transition-colors text-left ${i < menuItems.length-1 ? "border-b border-[rgba(255,255,255,0.05)]" : ""} ${item.label==="Sign Out"?"text-[#EF4444]":"text-white"}`}>
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium flex-1">{item.label}</span>
            {item.label !== "Sign Out" && <ChevronRight size={16} className="text-[#A5A9B5]" />}
          </button>
        ))}
      </div>

      {/* Referral */}
      <div className="bg-[#171A21] rounded-2xl p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Your referral code</p>
          <p className="text-[#5B6CFF] font-bold text-lg tracking-wider">RAHUL200</p>
        </div>
        <button onClick={() => toast("Referral code RAHUL200 copied!", "#22C55E")} className="flex items-center gap-1.5 bg-[#20242D] text-[#A5A9B5] text-xs font-semibold px-3 py-2 rounded-xl active:scale-90 transition-transform">
          <Copy size={13}/> Copy
        </button>
      </div>
    </div>
  );
}

// ─── Confirmation modal ───────────────────────────────────────────────────────

function ConfirmModal({ booking, onClose }: { booking: BookingData; onClose: () => void }) {
  const helperName = `${booking.helper.user.firstName} ${booking.helper.user.lastName}`.trim();
  const scheduledRaw = booking.scheduledAt ?? booking.bookingDate;
  const scheduledDate = new Date(scheduledRaw);
  const displayDate = isNaN(scheduledDate.getTime())
    ? scheduledRaw
    : scheduledDate.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const amountDisplay = typeof booking.totalAmount === "number"
    ? `₹${booking.totalAmount.toLocaleString()}`
    : "—";

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8">
      <div className="bg-[#171A21] rounded-3xl p-6 w-full flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background:"rgba(34,197,94,0.15)" }}>
          <CheckCircle2 size={32} className="text-[#22C55E]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Booking Requested!</h2>
          <p className="text-[#A5A9B5] text-sm mt-1">You&apos;ll get a reminder 30 min before your helper arrives.</p>
        </div>
        <div className="bg-[#20242D] rounded-2xl p-4 w-full flex flex-col gap-2 text-sm">
          {([
            ["Service",        booking.service.title],
            ["Helper",         helperName || "—"],
            ["Scheduled",      displayDate],
            ["Booking ID",     booking.id.slice(0, 8) + "…"],
            ["Service Amount", amountDisplay],
            ["Status",         booking.status],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-[#A5A9B5]">{k}</span>
              <span className="text-white font-semibold">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-[#A5A9B5] text-[11px] text-center">Payment will be collected separately. This booking is not yet paid.</p>
        <button onClick={onClose} className="w-full h-12 rounded-2xl font-bold text-white active:opacity-80 transition-opacity" style={{ background:"linear-gradient(135deg,#5B6CFF,#7E57FF)" }}>Done</button>
      </div>
    </div>
  );
}

// ─── Helper Dashboard ────────────────────────────────────────────────────────

function HelperDashboardScreen({ onNavigate, toast }: { onNavigate: (s: Screen, id?: string) => void; toast: (msg: string, color?: string) => void }) {
  const { profile, isLoading, error, refetch } = useHelperProfile();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-4 pt-4 px-2 animate-pulse">
        <div className="h-24 bg-[#171A21] rounded-2xl w-full" />
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="h-20 bg-[#171A21] rounded-2xl w-full" />
          <div className="h-20 bg-[#171A21] rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center pt-12 pb-4">
        <p className="text-[#EF4444] text-sm mb-3">{error}</p>
        <button onClick={refetch} className="text-[#5B6CFF] text-sm font-semibold">Retry</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center pt-12 pb-4">
        <p className="text-[#A5A9B5] text-sm">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Dashboard</h2>
      </div>

      {/* Profile summary */}
      <div className="bg-[#171A21] rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#5B6CFF] to-[#7E57FF] flex items-center justify-center text-white font-bold text-xl">
          {profile.user?.firstName?.[0]?.toUpperCase() ?? "H"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-lg truncate">
            {profile.user?.firstName} {profile.user?.lastName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[#A5A9B5] text-xs">Status:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${profile.verificationStatus === 'VERIFIED' ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]' : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'}`}>
              {profile.verificationStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#171A21] rounded-2xl p-4">
          <p className="text-[#A5A9B5] text-xs font-semibold mb-1">Rating</p>
          <div className="flex items-center gap-1.5">
            <Star size={16} className="text-[#F59E0B]" fill="#F59E0B" />
            <span className="text-xl font-bold text-white">{profile.rating}</span>
          </div>
        </div>
        <div className="bg-[#171A21] rounded-2xl p-4">
          <p className="text-[#A5A9B5] text-xs font-semibold mb-1">Reviews</p>
          <div className="flex items-center gap-1.5">
            <Award size={16} className="text-[#5B6CFF]" />
            <span className="text-xl font-bold text-white">{profile.totalReviews}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#171A21] rounded-2xl p-5 text-center mt-2">
         <p className="text-[#A5A9B5] text-sm">More analytics coming soon!</p>
      </div>
    </div>
  );
}

// ─── Helper Bookings ─────────────────────────────────────────────────────────

function HelperBookingsScreen({ onNavigate, onViewDetails, toast }: { onNavigate: (s: Screen, id?: string) => void; onViewDetails: (id: string) => void; toast: (msg: string, color?: string) => void }) {
  const { bookings, isLoading, error, refetch } = useBookings("helper");
  const [tab, setTab] = useState<"active" | "past">("active");

  const active = bookings.filter((b) => (UPCOMING_STATUSES as string[]).includes(b.status));
  const past = bookings.filter((b) => !(UPCOMING_STATUSES as string[]).includes(b.status));
  const filtered = tab === "active" ? active : past;

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Job Assignments</h2>
        <p className="text-[#A5A9B5] text-sm mt-0.5">Manage your upcoming jobs</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-[#20242D] rounded-2xl p-1">
        {(["active", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors capitalize ${
              tab === t ? "bg-[#5B6CFF] text-white" : "text-[#A5A9B5]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <BookingSkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
         <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <CalendarCheck size={36} className="text-[#EF4444] mx-auto mb-3 opacity-60" />
          <p className="text-[#FCA5A5] text-sm mb-3">{error}</p>
          <button onClick={() => refetch()} className="text-[#5B6CFF] text-sm font-semibold bg-[rgba(91,108,255,0.12)] px-4 py-2 rounded-xl">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
         <div className="text-center py-12">
          <CalendarCheck size={48} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5]">No {tab} assignments</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => {
            const customerName = b.customer ? `${b.customer.firstName} ${b.customer.lastName}`.trim() : "Customer";
            const scheduledDisplay = formatBookingDate(b.scheduledAt ?? b.bookingDate);
            return (
              <div key={b.id} className="bg-[#171A21] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{b.service?.title ?? 'Service'}</p>
                    <p className="text-[#A5A9B5] text-xs mt-0.5 truncate">{customerName}</p>
                  </div>
                  <BookingStatusPill status={b.status} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#A5A9B5] mb-1">
                  <CalendarCheck size={11} className="shrink-0" />
                  <span>{scheduledDisplay}</span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <span className="text-white font-bold">{typeof b.totalAmount === "number" ? `₹${b.totalAmount.toLocaleString()}` : "—"}</span>
                  <button onClick={() => onViewDetails(b.id)} className="text-xs font-semibold text-white bg-[#20242D] px-3 py-1.5 rounded-xl active:scale-95">View Details</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helper Booking Details ───────────────────────────────────────────────────

function HelperBookingDetailScreen({ bookingId, onBack, toast }: { bookingId: string; onBack: () => void; toast: (msg: string, color?: string) => void }) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchBooking = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.get(bookingId);
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleUpdateStatus = async (status: HelperBookingStatus) => {
    if (!booking || isUpdating) return;
    setIsUpdating(true);
    try {
      const updated = await bookingsApi.updateStatus(booking.id, status);
      setBooking(updated);
      toast(`Status updated to ${status}`, "#22C55E");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update status", "#EF4444");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col pb-4 animate-pulse">
        <div className="flex items-center gap-4 pt-2 pb-5">
          <div className="w-10 h-10 rounded-full bg-[#20242D]" />
          <div className="h-5 bg-[#20242D] rounded w-36" />
        </div>
        <div className="bg-[#171A21] rounded-2xl h-48" />
      </div>
    );
  }

  if (error || !booking) {
    return (
       <div className="flex flex-col gap-4 pt-2 pb-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="font-bold text-white text-lg">Job Details</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-[#EF4444] text-sm mb-3">{error || "Not found"}</p>
          {error && <button onClick={fetchBooking} className="text-[#5B6CFF] text-sm font-semibold">Retry</button>}
        </div>
      </div>
    );
  }

  const customerName = booking.customer ? `${booking.customer.firstName} ${booking.customer.lastName}`.trim() : "Customer";
  const scheduledDisplay = formatBookingDate(booking.scheduledAt ?? booking.bookingDate);

  const addressObj = booking.address;
  const addressString = addressObj ? [addressObj.houseNo, addressObj.street, addressObj.city, addressObj.state, addressObj.postalCode].filter(Boolean).join(", ") : "No address provided";

  return (
    <div className="flex flex-col pb-4">
      <div className="flex items-center gap-4 pt-2 pb-5">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-lg truncate" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {booking.service?.title}
          </h2>
          <p className="text-[#A5A9B5] text-xs mt-0.5">Job details</p>
        </div>
        <BookingStatusPill status={booking.status} />
      </div>

      <div className="bg-[#171A21] rounded-2xl px-4">
        <BookingDetailRow label="Booking ID" value={booking.id} />
        <BookingDetailRow label="Customer" value={customerName} />
        {booking.customer?.phone && <BookingDetailRow label="Phone" value={booking.customer.phone} />}
        <BookingDetailRow label="Scheduled" value={scheduledDisplay} />
        <BookingDetailRow label="Amount" value={typeof booking.totalAmount === "number" ? `₹${booking.totalAmount.toLocaleString()}` : "—"} />
        <BookingDetailRow label="Address" value={addressString} />
      </div>

      {booking.status === "PENDING" && (
        <div className="mt-4 flex gap-3">
          <button onClick={() => handleUpdateStatus("ACCEPTED")} disabled={isUpdating} className="flex-1 h-12 rounded-2xl font-bold text-white bg-[#5B6CFF] active:scale-95 disabled:opacity-50">
            Accept Job
          </button>
        </div>
      )}

      {booking.status === "ACCEPTED" && (
        <div className="mt-4 flex gap-3">
          <button onClick={() => handleUpdateStatus("ONGOING")} disabled={isUpdating} className="flex-1 h-12 rounded-2xl font-bold text-white bg-[#06B6D4] active:scale-95 disabled:opacity-50">
            Start Job
          </button>
        </div>
      )}

      {booking.status === "ONGOING" && (
        <div className="mt-4 flex gap-3">
          <button onClick={() => handleUpdateStatus("COMPLETED")} disabled={isUpdating} className="flex-1 h-12 rounded-2xl font-bold text-white bg-[#22C55E] active:scale-95 disabled:opacity-50">
            Complete Job
          </button>
        </div>
      )}

      <button onClick={onBack} className="mt-3 w-full h-12 rounded-2xl font-bold text-[#A5A9B5] bg-[#20242D] flex items-center justify-center gap-2 active:opacity-80 transition-opacity">
        Back to Jobs
      </button>
    </div>
  );
}

// ─── Helper Profile ──────────────────────────────────────────────────────────

function HelperProfileScreen({ onNavigate, toast }: { onNavigate: (s: Screen) => void; toast: (msg: string, color?: string) => void }) {
  const { user, logout } = useAuth();
  const { profile, isLoading, error, refetch } = useHelperProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: "",
    experienceYears: 0,
    hourlyRate: 0,
    isAvailable: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form when profile loads and editing starts
  useEffect(() => {
    if (profile && isEditing) {
      setEditForm({
        bio: profile.bio || "",
        experienceYears: profile.experienceYears || 0,
        hourlyRate: profile.hourlyRate || 0,
        isAvailable: profile.isAvailable || false,
      });
    }
  }, [profile, isEditing]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await helpersApi.updateProfile({
        bio: editForm.bio,
        experienceYears: Number(editForm.experienceYears),
        hourlyRate: Number(editForm.hourlyRate),
        isAvailable: editForm.isAvailable,
      });
      toast("Profile updated successfully!", "#22C55E");
      setIsEditing(false);
      refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update profile", "#EF4444");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast("Signed out successfully", "#22C55E");
    } catch {
      toast("Signed out", "#5B6CFF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-4 pt-4 px-2 animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-[#171A21]" />
          <div className="h-6 bg-[#171A21] rounded w-32" />
        </div>
        <div className="h-32 bg-[#171A21] rounded-2xl w-full mt-4" />
        <div className="h-24 bg-[#171A21] rounded-2xl w-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center pt-12 pb-4">
        <p className="text-[#EF4444] text-sm mb-3">{error || "Profile not found"}</p>
        <button onClick={refetch} className="text-[#5B6CFF] text-sm font-semibold">Retry</button>
      </div>
    );
  }

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const initial = fullName ? fullName.charAt(0).toUpperCase() : "?";

  if (isEditing) {
    return (
      <div className="flex flex-col gap-5 pb-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Edit Profile</h2>
          <button onClick={() => setIsEditing(false)} className="text-[#A5A9B5] text-sm font-semibold active:scale-95">Cancel</button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#A5A9B5] text-xs font-semibold px-1">Description / Bio</label>
            <textarea
              required
              maxLength={500}
              value={editForm.bio}
              onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full bg-[#171A21] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 text-white text-sm outline-none focus:border-[#5B6CFF] transition-colors resize-none"
              rows={4}
              placeholder="Tell customers about your experience..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#A5A9B5] text-xs font-semibold px-1">Experience (Years)</label>
              <input
                type="number"
                min="0"
                max="50"
                required
                value={editForm.experienceYears}
                onChange={(e) => setEditForm(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                className="w-full h-12 bg-[#171A21] border border-[rgba(255,255,255,0.06)] rounded-2xl px-4 text-white text-sm outline-none focus:border-[#5B6CFF] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[#A5A9B5] text-xs font-semibold px-1">Hourly Rate (₹)</label>
              <input
                type="number"
                min="0"
                required
                value={editForm.hourlyRate}
                onChange={(e) => setEditForm(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                className="w-full h-12 bg-[#171A21] border border-[rgba(255,255,255,0.06)] rounded-2xl px-4 text-white text-sm outline-none focus:border-[#5B6CFF] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#171A21] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 mt-2">
            <div>
              <p className="text-white text-sm font-semibold">Available for Work</p>
              <p className="text-[#A5A9B5] text-xs mt-0.5">Show your profile in search results</p>
            </div>
            <button
              type="button"
              onClick={() => setEditForm(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${editForm.isAvailable ? "bg-[#22C55E]" : "bg-[#20242D]"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${editForm.isAvailable ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-12 rounded-2xl font-bold text-white mt-4 active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ background:"linear-gradient(135deg,#5B6CFF,#7E57FF)" }}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Header Info */}
      <div className="pt-4 flex flex-col items-center gap-3 relative">
        <button onClick={() => setIsEditing(true)} className="absolute top-0 right-0 p-2 bg-[#171A21] rounded-full active:scale-90 transition-transform">
           <Edit2 size={16} className="text-[#A5A9B5]" />
        </button>
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5B6CFF] to-[#7E57FF] flex items-center justify-center text-3xl font-bold text-white">
          {initial}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white flex items-center justify-center gap-1.5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {fullName || "Helper"}
            {profile.verificationStatus === 'VERIFIED' && <CheckCircle2 size={16} className="text-[#22C55E]" />}
          </h2>
          <p className="text-[#A5A9B5] text-sm">{user?.email ?? ""}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${profile.isAvailable ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]' : 'bg-[rgba(165,169,181,0.15)] text-[#A5A9B5]'}`}>
            {profile.isAvailable ? "Available" : "Not Available"}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${profile.verificationStatus === 'VERIFIED' ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]' : 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]'}`}>
            {profile.verificationStatus}
          </span>
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-[#171A21] rounded-2xl p-4 flex flex-col gap-4">
        <div>
          <p className="text-[#A5A9B5] text-xs font-semibold mb-1">About Me</p>
          <p className="text-white text-sm leading-relaxed">{profile.bio || "No description provided."}</p>
        </div>
        <div className="flex border-t border-[rgba(255,255,255,0.06)] pt-4">
          <div className="flex-1">
            <p className="text-[#A5A9B5] text-xs font-semibold mb-1">Experience</p>
            <p className="text-white text-sm font-semibold">{profile.experienceYears ? `${profile.experienceYears} Years` : "—"}</p>
          </div>
          <div className="w-[1px] bg-[rgba(255,255,255,0.06)]" />
          <div className="flex-1 pl-4">
            <p className="text-[#A5A9B5] text-xs font-semibold mb-1">Hourly Rate</p>
            <p className="text-white text-sm font-semibold">{profile.hourlyRate ? `₹${profile.hourlyRate}` : "—"}</p>
          </div>
        </div>
      </div>

      {/* Services/Categories */}
      {profile.services && profile.services.length > 0 && (
        <div className="bg-[#171A21] rounded-2xl p-4">
           <p className="text-[#A5A9B5] text-xs font-semibold mb-3">Services Offered</p>
           <div className="flex flex-col gap-3">
             {profile.services.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center text-sm">
                  <span className="text-white font-medium">{s.title}</span>
                  <span className="text-[#A5A9B5]">{s.category?.name}</span>
                </div>
             ))}
           </div>
        </div>
      )}

      <button onClick={handleSignOut} className="mt-4 w-full h-14 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-2xl flex items-center justify-center gap-2 text-[#EF4444] font-bold active:scale-[0.98] transition-transform">
        <span className="text-lg">🚪</span> Sign Out
      </button>
    </div>
  );
}

// ─── Helper Service Requests ──────────────────────────────────────────────────

function HelperServiceRequestsScreen({ onBack, toast }: { onBack: () => void; toast: (msg: string, color?: string) => void }) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { requests, total, isLoading, error, refetch, create } = useHelperServiceRequests(page, limit);
  const { categories } = useCategories();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateServiceRequestPayload>({
    categoryId: "",
    title: "",
    description: "",
    suggestedPrice: 0,
    suggestedPriceType: "FIXED",
    suggestedDuration: undefined,
  });

  const openCreate = () => {
    setForm({ categoryId: "", title: "", description: "", suggestedPrice: 0, suggestedPriceType: "FIXED", suggestedDuration: undefined });
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.title.trim() || !form.suggestedPrice || form.suggestedPrice <= 0) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await create({
        categoryId: form.categoryId,
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        suggestedPrice: Number(form.suggestedPrice),
        suggestedPriceType: form.suggestedPriceType,
        suggestedDuration: form.suggestedDuration || undefined,
      });
      toast("Service request created successfully.", "#22C55E");
      setIsFormOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create service request.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    PENDING:  { label: "Pending",  cls: "text-[#FBBF24] bg-[rgba(245,158,11,0.15)]" },
    APPROVED: { label: "Approved", cls: "text-[#22C55E] bg-[rgba(34,197,94,0.15)]" },
    REJECTED: { label: "Rejected", cls: "text-[#EF4444] bg-[rgba(239,68,68,0.15)]" },
  };

  return (
    <div className="flex flex-col gap-4 pb-4 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>My Service Requests</h2>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-[#5B6CFF] px-3 py-2 text-xs font-bold text-white active:scale-95 transition-transform">
          <Plus size={14} /> New
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-[#171A21] rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <p className="text-[#FCA5A5] text-sm mb-3">{error}</p>
          <button onClick={refetch} className="text-[#5B6CFF] text-sm font-semibold bg-[rgba(91,108,255,0.12)] px-4 py-2 rounded-xl">Retry</button>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5]">No service requests yet</p>
          <button onClick={openCreate} className="mt-3 text-[#5B6CFF] text-sm font-semibold">Create your first request</button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {requests.map((req) => {
              const statusInfo = statusMap[req.status] || { label: req.status, cls: "text-[#A5A9B5] bg-[#20242D]" };
              return (
                <div key={req.id} className="bg-[#171A21] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{req.title}</p>
                      <p className="text-[#A5A9B5] text-xs mt-0.5">{req.category.name}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusInfo.cls}`}>{statusInfo.label}</span>
                  </div>
                  {req.description && <p className="text-[#A5A9B5] text-xs mb-2 line-clamp-2">{req.description}</p>}
                  <div className="flex items-center justify-between text-xs text-[#A5A9B5]">
                    <span>₹{req.suggestedPrice.toLocaleString()} / {req.suggestedPriceType}</span>
                    {req.suggestedDuration && <span>{req.suggestedDuration} min</span>}
                  </div>
                  {req.adminNotes && <p className="text-[#A5A9B5] text-[10px] mt-1">Note: {req.adminNotes}</p>}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-[#20242D] text-white text-xs font-semibold disabled:opacity-50">Previous</button>
              <span className="text-[#A5A9B5] text-xs">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl bg-[#5B6CFF] text-white text-xs font-semibold disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}

      {isFormOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8">
          <div className="bg-[#171A21] rounded-3xl p-5 w-full max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>New Service Request</h2>
              <button onClick={() => setIsFormOpen(false)} className="w-9 h-9 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
                <X size={16} className="text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Category <span className="text-[#EF4444]">*</span></label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5B6CFF]" required>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Title <span className="text-[#EF4444]">*</span></label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Suggested Price (₹) <span className="text-[#EF4444]">*</span></label>
                  <input type="number" min="0" value={form.suggestedPrice} onChange={(e) => setForm({ ...form, suggestedPrice: Number(e.target.value) })} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Price Type <span className="text-[#EF4444]">*</span></label>
                  <select value={form.suggestedPriceType} onChange={(e) => setForm({ ...form, suggestedPriceType: e.target.value })} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5B6CFF]" required>
                    <option value="FIXED">Fixed</option>
                    <option value="HOURLY">Hourly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Suggested Duration (min)</label>
                <input type="number" min="0" value={form.suggestedDuration ?? ""} onChange={(e) => setForm({ ...form, suggestedDuration: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]" />
              </div>
              {(submitError) && (
                <div className="rounded-xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm text-[#FCA5A5]">
                  {submitError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 h-12 rounded-2xl bg-[#20242D] text-white font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-2xl font-bold text-white disabled:opacity-70" style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}>
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin screens ─────────────────────────────────────────────────────────────

function AdminDashboardScreen({ onNavigate, toast }: { onNavigate: (s: Screen, id?: string) => void; toast: (msg: string, color?: string) => void }) {
  const { stats, isLoading, error, refetch } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-4 pt-2 animate-pulse">
        <div className="h-6 bg-[#20242D] rounded w-32" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-[#171A21] rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 pb-4 pt-2">
        <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Dashboard</h2>
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <p className="text-[#FCA5A5] text-sm mb-3">{error}</p>
          <button onClick={refetch} className="text-[#5B6CFF] text-sm font-semibold bg-[rgba(91,108,255,0.12)] px-4 py-2 rounded-xl">Retry</button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col gap-4 pb-4 pt-2">
        <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Dashboard</h2>
        <p className="text-[#A5A9B5] text-sm">No stats available.</p>
      </div>
    );
  }

  const cards = [
    { label:"Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "#5B6CFF", bg: "rgba(91,108,255,0.12)" },
    { label:"Helpers", value: stats.totalHelpers.toLocaleString(), icon: Shield, color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
    { label:"Bookings", value: stats.totalBookings.toLocaleString(), icon: CalendarCheck, color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    { label:"Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "#EC4899", bg: "rgba(236,72,153,0.12)" },
  ];

  return (
    <div className="flex flex-col gap-5 pb-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Dashboard</h2>
        <button onClick={refetch} className="text-[#5B6CFF] text-xs font-semibold">Refresh</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#171A21] rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: c.bg }}>
              <c.icon size={20} style={{ color: c.color }} />
            </div>
            <p className="text-white font-bold text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{c.value}</p>
            <p className="text-[#A5A9B5] text-xs mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {stats.pendingVerifications > 0 && (
        <button onClick={() => onNavigate("admin-service-requests")} className="w-full bg-[#171A21] rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(245,158,11,0.12)] flex items-center justify-center">
              <Clock size={20} className="text-[#F59E0B]" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Pending Verifications</p>
              <p className="text-[#A5A9B5] text-xs">{stats.pendingVerifications} helper(s) awaiting review</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-[#A5A9B5]" />
        </button>
      )}

      <div className="flex flex-col gap-3 mt-2">
        {[
          { label:"Users",            screen:"admin-users"            as Screen, icon: Users,         color:"#5B6CFF" },
          { label:"Bookings",         screen:"admin-bookings"         as Screen, icon: CalendarCheck,  color:"#F59E0B" },
          { label:"Categories",       screen:"admin-categories"       as Screen, icon: Folder,         color:"#22C55E" },
          { label:"Services",         screen:"admin-services"         as Screen, icon: Sparkles,       color:"#A855F7" },
          { label:"Service Requests", screen:"admin-service-requests" as Screen, icon: ClipboardList,  color:"#EC4899" },
        ].map((item) => (
          <button key={item.screen} id={`admin-dash-nav-${item.screen}`} onClick={() => onNavigate(item.screen)} className="w-full bg-[#171A21] rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-transform">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}20` }}>
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <span className="text-white font-bold text-sm flex-1 text-left">{item.label}</span>
            <ChevronRight size={16} className="text-[#A5A9B5]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminUsersScreen({ onBack, toast: _toast }: { onBack: () => void; toast: (msg: string, color?: string) => void }) {
  const [page, setPage] = useState(1);
  const limit = 20;
  const { users, total, isLoading, error, refetch } = useAdminUsers(page, limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // ── client-side search & role filter (backend has no search param) ──
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CUSTOMER" | "HELPER" | "ADMIN">("ALL");
  const [detailUser, setDetailUser] = useState<AdminUserData | null>(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleColors: Record<string, { bg: string; text: string; avatarBg: string }> = {
    ADMIN:    { bg: "rgba(245,158,11,0.15)",  text: "#FBBF24", avatarBg: "rgba(245,158,11,0.25)"  },
    HELPER:   { bg: "rgba(34,197,94,0.15)",   text: "#22C55E", avatarBg: "rgba(34,197,94,0.25)"   },
    CUSTOMER: { bg: "rgba(91,108,255,0.15)",  text: "#5B6CFF", avatarBg: "rgba(91,108,255,0.25)"  },
  };

  const getRoleStyle = (role: string) => roleColors[role] ?? roleColors.CUSTOMER;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const roleTabs = ["ALL", "CUSTOMER", "HELPER", "ADMIN"] as const;

  return (
    <div className="flex flex-col gap-4 pb-4 pt-2">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button
          id="admin-users-back-btn"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Users
          </h2>
          {!isLoading && !error && (
            <p className="text-[#A5A9B5] text-xs">
              {total.toLocaleString()} total · showing {filtered.length} on this page
            </p>
          )}
        </div>
        <button
          id="admin-users-refresh-btn"
          onClick={refetch}
          className="text-[#5B6CFF] text-xs font-semibold bg-[rgba(91,108,255,0.10)] px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
        >
          Refresh
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A5A9B5] pointer-events-none" />
        <input
          id="admin-users-search"
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#171A21] pl-9 pr-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A5A9B5] hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Role filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {roleTabs.map((tab) => (
          <button
            key={tab}
            id={`admin-users-tab-${tab.toLowerCase()}`}
            onClick={() => { setRoleFilter(tab); setPage(1); }}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              roleFilter === tab
                ? "bg-[#5B6CFF] text-white"
                : "bg-[#171A21] text-[#A5A9B5] hover:text-white"
            }`}
          >
            {tab === "ALL" ? "All Roles" : tab}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[72px] bg-[#171A21] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <p className="text-[#FCA5A5] text-sm mb-3">{error}</p>
          <button
            onClick={refetch}
            className="text-[#5B6CFF] text-sm font-semibold bg-[rgba(91,108,255,0.12)] px-4 py-2 rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5] text-sm">
            {search || roleFilter !== "ALL" ? "No users match your filters" : "No users found"}
          </p>
          {(search || roleFilter !== "ALL") && (
            <button
              onClick={() => { setSearch(""); setRoleFilter("ALL"); }}
              className="mt-3 text-[#5B6CFF] text-sm font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {filtered.map((u) => {
              const rs = getRoleStyle(u.role);
              const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";
              return (
                <button
                  key={u.id}
                  id={`admin-user-card-${u.id}`}
                  onClick={() => setDetailUser(u)}
                  className="bg-[#171A21] rounded-2xl p-4 flex items-center gap-3 w-full text-left active:scale-[0.98] transition-transform hover:bg-[#1c2029]"
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: rs.avatarBg, color: rs.text }}
                  >
                    {initials}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[#A5A9B5] text-xs truncate">{u.email}</p>
                    <p className="text-[#A5A9B5] text-[10px] mt-0.5">
                      Joined {formatDate(u.createdAt)}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: rs.bg, color: rs.text }}
                    >
                      {u.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.isActive
                          ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]"
                          : "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                      }`}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                    {u.isVerified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.10)] text-[#22C55E] flex items-center gap-0.5">
                        <Check size={9} /> Verified
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <button
                id="admin-users-prev-btn"
                onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-[#20242D] text-white text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[#A5A9B5] text-xs">
                Page {page} of {totalPages}
              </span>
              <button
                id="admin-users-next-btn"
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); }}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl bg-[#5B6CFF] text-white text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* ── User Detail Modal ── */}
      {detailUser && (() => {
        const u = detailUser;
        const rs = getRoleStyle(u.role);
        const initials = `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";
        return (
          <div
            className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8"
            onClick={() => setDetailUser(null)}
          >
            <div
              className="bg-[#171A21] rounded-3xl p-5 w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                >
                  User Details
                </h3>
                <button
                  id="admin-user-detail-close"
                  onClick={() => setDetailUser(null)}
                  className="w-9 h-9 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>

              {/* Avatar + name */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                  style={{ background: rs.avatarBg, color: rs.text }}
                >
                  {initials}
                </div>
                <p className="text-white font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-[#A5A9B5] text-sm mt-0.5">{u.email}</p>

                <div className="flex gap-2 mt-3 flex-wrap justify-center">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: rs.bg, color: rs.text }}
                  >
                    {u.role}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      u.isActive
                        ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]"
                        : "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                  {u.isVerified ? (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[rgba(34,197,94,0.12)] text-[#22C55E] flex items-center gap-1">
                      <CheckCircle2 size={12} /> Email Verified
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[rgba(239,68,68,0.12)] text-[#EF4444]">
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-3">
                {[
                  { label: "User ID", value: u.id },
                  { label: "Joined", value: formatDate(u.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#20242D] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-[#A5A9B5] text-xs font-semibold uppercase tracking-[0.08em]">
                      {label}
                    </span>
                    <span className="text-white text-sm font-medium text-right break-all">{value}</span>
                  </div>
                ))}
              </div>

              <button
                id="admin-user-detail-dismiss"
                onClick={() => setDetailUser(null)}
                className="w-full mt-5 rounded-2xl bg-[#20242D] py-3 text-white font-semibold text-sm active:scale-[0.98] transition-transform"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function AdminBookingsScreen({ onBack, toast }: { onBack: () => void; toast: (msg: string, color?: string) => void }) {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { bookings, total, isLoading, error, refetch } = useAdminBookings(page, limit);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-4 pb-4 pt-2">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Bookings</h2>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-[#171A21] rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <p className="text-[#FCA5A5] text-sm mb-3">{error}</p>
          <button onClick={refetch} className="text-[#5B6CFF] text-sm font-semibold bg-[rgba(91,108,255,0.12)] px-4 py-2 rounded-xl">Retry</button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <CalendarCheck size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5]">No bookings found</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {bookings.map((b) => {
              const customerName = `${b.customer.firstName} ${b.customer.lastName}`.trim();
              const helperName = `${b.helper.user.firstName} ${b.helper.user.lastName}`.trim();
              return (
                <div key={b.id} className="bg-[#171A21] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{b.service.title}</p>
                      <p className="text-[#A5A9B5] text-xs mt-0.5">Customer: {customerName} · Helper: {helperName}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${b.status === 'PENDING' ? 'bg-[rgba(245,158,11,0.15)] text-[#FBBF24]' : b.status === 'COMPLETED' ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]' : 'bg-[rgba(239,68,68,0.15)] text-[#EF4444]'}`}>{b.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#A5A9B5]">
                    <span>{formatDate(b.bookingDate)}</span>
                    <span className="text-white font-bold">₹{b.totalAmount.toLocaleString()}</span>
                  </div>
                  {b.payment && <p className="text-[10px] text-[#A5A9B5] mt-1">Payment: {b.payment.status}</p>}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-[#20242D] text-white text-xs font-semibold disabled:opacity-50">Previous</button>
              <span className="text-[#A5A9B5] text-xs">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl bg-[#5B6CFF] text-white text-xs font-semibold disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AdminCategoriesScreen({ onBack, toast }: { onBack: () => void; toast: (msg: string, color?: string) => void }) {
  const { categories, isLoading, error, refetch, create, update, remove } = useAdminCategories();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCategoryPayload>({ name: "", description: "", icon: "" });
  // in-component delete confirm (replaces native window.confirm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: "", description: "", icon: "" });
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const openEdit = (cat: AdminCategoryData) => {
    setEditingCategory(cat);
    setForm({ name: cat.name, description: cat.description ?? "", icon: cat.icon ?? "" });
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSubmitError("Category name is required.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (editingCategory) {
        await update(editingCategory.id, form);
        toast("Category updated.", "#22C55E");
      } else {
        await create(form);
        toast("Category created.", "#22C55E");
      }
      setIsFormOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save category.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await remove(id);
      toast("Category deleted.", "#EF4444");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete category.", "#EF4444");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-4 pt-2">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            id="admin-categories-back-btn"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Categories</h2>
            {!isLoading && !error && (
              <p className="text-[#A5A9B5] text-xs">{categories.length} total</p>
            )}
          </div>
        </div>
        <button
          id="admin-categories-add-btn"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#5B6CFF] px-3 py-2 text-xs font-bold text-white active:scale-95 transition-transform"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* ── Body ── */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-[#171A21] rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <p className="text-[#FCA5A5] text-sm mb-3">{error}</p>
          <button onClick={refetch} className="text-[#5B6CFF] text-sm font-semibold bg-[rgba(91,108,255,0.12)] px-4 py-2 rounded-xl">Retry</button>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <Folder size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5]">No categories yet</p>
          <button onClick={openCreate} className="mt-3 text-[#5B6CFF] text-sm font-semibold">Create the first category</button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((cat) => (
            <div key={cat.id} id={`admin-category-card-${cat.id}`} className="bg-[#171A21] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{cat.icon || "📂"}</span>
                    <p className="text-white font-bold text-sm">{cat.name}</p>
                  </div>
                  {cat.description && <p className="text-[#A5A9B5] text-xs leading-relaxed">{cat.description}</p>}
                  <p className="text-[#A5A9B5] text-[10px] mt-1">ID: {cat.id.slice(0, 8)}…</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    id={`admin-category-edit-${cat.id}`}
                    onClick={() => openEdit(cat)}
                    className="w-8 h-8 rounded-lg bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Edit2 size={14} className="text-white" />
                  </button>
                  <button
                    id={`admin-category-delete-${cat.id}`}
                    onClick={() => setDeleteConfirmId(cat.id)}
                    className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.12)] flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <Trash2 size={14} className="text-[#EF4444]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create/Edit form modal ── */}
      {isFormOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8">
          <div className="bg-[#171A21] rounded-3xl p-5 w-full max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{editingCategory ? "Edit Category" : "New Category"}</h2>
              <button
                id="admin-category-form-close"
                onClick={() => setIsFormOpen(false)}
                className="w-9 h-9 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Name <span className="text-[#EF4444]">*</span></label>
                <input
                  id="admin-category-form-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Description</label>
                <textarea
                  id="admin-category-form-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Icon <span className="text-[#A5A9B5] text-[10px] normal-case">(emoji)</span></label>
                <input
                  id="admin-category-form-icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="e.g. 🧹"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#5B6CFF]"
                />
              </div>
              {submitError && (
                <div className="rounded-xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm text-[#FCA5A5]">
                  {submitError}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 h-12 rounded-2xl bg-[#20242D] text-white font-bold">Cancel</button>
                <button
                  id="admin-category-form-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-2xl font-bold text-white disabled:opacity-70"
                  style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}
                >
                  {isSubmitting ? "Saving…" : editingCategory ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteConfirmId && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8">
          <div className="bg-[#171A21] rounded-3xl p-6 w-full flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
              <Trash2 size={26} className="text-[#EF4444]" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Delete Category</h2>
              <p className="text-[#A5A9B5] text-sm mt-1">This action cannot be undone. Services in this category may be affected.</p>
            </div>
            <div className="flex gap-3 w-full pt-2">
              <button
                id="admin-category-delete-cancel"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-12 rounded-2xl bg-[#20242D] text-white font-bold"
              >
                Cancel
              </button>
              <button
                id="admin-category-delete-confirm"
                onClick={handleDeleteConfirmed}
                className="flex-1 h-12 rounded-2xl font-bold text-white active:scale-95 transition-transform"
                style={{ background:"linear-gradient(135deg,#EF4444 0%,#B91C1C 100%)" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Services Screen ────────────────────────────────────────────────────
// Uses GET /services (public, paginated, searchable) for listing.
// Uses POST /admin/services for creation (requires helperId from admin).
// No admin update/delete: PUT/DELETE /services/:id enforces owner guard.

function AdminServicesScreen({ onBack, toast }: { onBack: () => void; toast: (msg: string, color?: string) => void }) {
  const [page, setPage] = useState(1);
  const limit = 10;

  // filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // debounce search by 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, categoryFilter]);

  // fetch services via public API (supports page, limit, search, categoryId)
  const [services, setServices] = useState<ServiceData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadServices = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await servicesApi.list({
        page,
        limit,
        search: debouncedSearch || undefined,
        categoryId: categoryFilter || undefined,
      });
      setServices(res.services);
      setTotal(res.total);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadServices(); }, [page, debouncedSearch, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // categories for the filter dropdown
  const { categories: allCategories } = useAdminCategories();

  // selected service detail modal
  const [detailService, setDetailService] = useState<ServiceData | null>(null);

  // create service modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminServicePayload>({
    title: "",
    description: "",
    categoryId: "",
    helperId: "",
    price: 0,
    priceType: "FIXED",
    duration: undefined,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const openCreate = () => {
    setCreateForm({ title: "", description: "", categoryId: "", helperId: "", price: 0, priceType: "FIXED", duration: undefined });
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) { setCreateError("Title is required."); return; }
    if (!createForm.categoryId)  { setCreateError("Category is required."); return; }
    if (!createForm.helperId.trim()) { setCreateError("Helper profile ID is required."); return; }
    if (createForm.price < 0) { setCreateError("Price must be ≥ 0."); return; }
    setIsCreating(true);
    setCreateError(null);
    try {
      await adminApi.createService(createForm);
      toast("Service created.", "#22C55E");
      setIsCreateOpen(false);
      loadServices();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create service.");
    } finally {
      setIsCreating(false);
    }
  };

  const formatPrice = (price: number, priceType: string) =>
    `₹${price.toLocaleString()} / ${priceType.toLowerCase()}`;

  return (
    <div className="flex flex-col gap-4 pb-4 pt-2">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button
          id="admin-services-back-btn"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-lg" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Services</h2>
          {!isLoading && !fetchError && (
            <p className="text-[#A5A9B5] text-xs">{total.toLocaleString()} active services</p>
          )}
        </div>
        <button
          id="admin-services-create-btn"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-xl bg-[#A855F7] px-3 py-2 text-xs font-bold text-white active:scale-95 transition-transform"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A5A9B5] pointer-events-none" />
        <input
          id="admin-services-search"
          type="text"
          placeholder="Search by title or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#171A21] pl-9 pr-8 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#A855F7] transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A5A9B5] hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Category filter ── */}
      {allCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
          <button
            id="admin-services-filter-all"
            onClick={() => setCategoryFilter("")}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              !categoryFilter ? "bg-[#A855F7] text-white" : "bg-[#171A21] text-[#A5A9B5] hover:text-white"
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              id={`admin-services-filter-${cat.id}`}
              onClick={() => setCategoryFilter(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                categoryFilter === cat.id ? "bg-[#A855F7] text-white" : "bg-[#171A21] text-[#A5A9B5] hover:text-white"
              }`}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Body ── */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#171A21] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <p className="text-[#FCA5A5] text-sm mb-3">{fetchError}</p>
          <button onClick={loadServices} className="text-[#A855F7] text-sm font-semibold bg-[rgba(168,85,247,0.12)] px-4 py-2 rounded-xl">
            Retry
          </button>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5] text-sm">
            {search || categoryFilter ? "No services match your filters" : "No active services found"}
          </p>
          {(search || categoryFilter) && (
            <button
              onClick={() => { setSearch(""); setCategoryFilter(""); }}
              className="mt-3 text-[#A855F7] text-sm font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {services.map((svc) => (
              <button
                key={svc.id}
                id={`admin-service-card-${svc.id}`}
                onClick={() => setDetailService(svc)}
                className="bg-[#171A21] rounded-2xl p-4 w-full text-left active:scale-[0.98] transition-transform hover:bg-[#1c2029]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{svc.title}</p>
                    <p className="text-[#A5A9B5] text-xs mt-0.5 truncate">
                      {svc.helper.user.firstName} {svc.helper.user.lastName} · {svc.category.name}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    svc.isActive ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]" : "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                  }`}>
                    {svc.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white font-semibold text-sm">{formatPrice(svc.price, svc.priceType)}</p>
                  {svc.duration && (
                    <p className="text-[#A5A9B5] text-xs flex items-center gap-1">
                      <Clock size={11} />{svc.duration} min
                    </p>
                  )}
                </div>
                {svc.description && (
                  <p className="text-[#A5A9B5] text-xs mt-1.5 leading-relaxed line-clamp-2">{svc.description}</p>
                )}
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <button
                id="admin-services-prev-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl bg-[#20242D] text-white text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[#A5A9B5] text-xs">Page {page} of {totalPages}</span>
              <button
                id="admin-services-next-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl bg-[#A855F7] text-white text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Service Detail Modal ── */}
      {detailService && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8"
          onClick={() => setDetailService(null)}
        >
          <div
            className="bg-[#171A21] rounded-3xl p-5 w-full max-h-[82vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Service Details</h3>
              <button
                id="admin-service-detail-close"
                onClick={() => setDetailService(null)}
                className="w-9 h-9 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* Title + status */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-white font-bold text-base flex-1">{detailService.title}</p>
                <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${
                  detailService.isActive ? "bg-[rgba(34,197,94,0.15)] text-[#22C55E]" : "bg-[rgba(239,68,68,0.15)] text-[#EF4444]"
                }`}>
                  {detailService.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {detailService.description && (
                <p className="text-[#A5A9B5] text-sm leading-relaxed">{detailService.description}</p>
              )}
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-2">
              {[
                { label: "Category",   value: detailService.category.name },
                { label: "Helper",     value: `${detailService.helper.user.firstName} ${detailService.helper.user.lastName}` },
                { label: "Price",      value: formatPrice(detailService.price, detailService.priceType) },
                { label: "Duration",   value: detailService.duration ? `${detailService.duration} min` : "—" },
                { label: "Rating",     value: detailService.helper.rating ? `⭐ ${detailService.helper.rating}` : "—" },
                { label: "Service ID", value: detailService.id },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#20242D] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-[#A5A9B5] text-xs font-semibold uppercase tracking-[0.08em] shrink-0">{label}</span>
                  <span className="text-white text-sm font-medium text-right break-all">{value}</span>
                </div>
              ))}
            </div>

            <button
              id="admin-service-detail-dismiss"
              onClick={() => setDetailService(null)}
              className="w-full mt-5 rounded-2xl bg-[#20242D] py-3 text-white font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Create Service Modal ── */}
      {isCreateOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8">
          <div className="bg-[#171A21] rounded-3xl p-5 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>New Service</h2>
              <button
                id="admin-service-create-close"
                onClick={() => setIsCreateOpen(false)}
                className="w-9 h-9 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Title <span className="text-[#EF4444]">*</span></label>
                <input
                  id="admin-service-form-title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Deep Home Cleaning"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#A855F7]"
                  required
                />
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Description</label>
                <textarea
                  id="admin-service-form-description"
                  value={createForm.description ?? ""}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  placeholder="What does this service include?"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#A855F7] resize-none"
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Category <span className="text-[#EF4444]">*</span></label>
                <select
                  id="admin-service-form-category"
                  value={createForm.categoryId}
                  onChange={(e) => setCreateForm({ ...createForm, categoryId: e.target.value })}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none focus:border-[#A855F7]"
                  required
                >
                  <option value="">— Select category —</option>
                  {allCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ""}{cat.name}</option>
                  ))}
                </select>
              </div>
              {/* Helper ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Helper Profile ID <span className="text-[#EF4444]">*</span></label>
                <input
                  id="admin-service-form-helper-id"
                  value={createForm.helperId}
                  onChange={(e) => setCreateForm({ ...createForm, helperId: e.target.value })}
                  placeholder="Helper profile UUID"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#A855F7] font-mono text-xs"
                  required
                />
                <p className="text-[#A5A9B5] text-[10px] mt-1">Must be a verified helper's profile ID</p>
              </div>
              {/* Price + Price Type */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Price (₹) <span className="text-[#EF4444]">*</span></label>
                  <input
                    id="admin-service-form-price"
                    type="number"
                    min={0}
                    value={createForm.price}
                    onChange={(e) => setCreateForm({ ...createForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#A855F7]"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Price Type</label>
                  <select
                    id="admin-service-form-price-type"
                    value={createForm.priceType}
                    onChange={(e) => setCreateForm({ ...createForm, priceType: e.target.value })}
                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none focus:border-[#A855F7]"
                  >
                    <option value="FIXED">Fixed</option>
                    <option value="HOURLY">Hourly</option>
                  </select>
                </div>
              </div>
              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#A5A9B5] mb-1.5">Duration (min) <span className="text-[#A5A9B5] text-[10px] normal-case">(optional)</span></label>
                <input
                  id="admin-service-form-duration"
                  type="number"
                  min={0}
                  value={createForm.duration ?? ""}
                  onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 120"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#20242D] px-3 py-2.5 text-sm text-white outline-none placeholder:text-[#A5A9B5] focus:border-[#A855F7]"
                />
              </div>

              {createError && (
                <div className="rounded-xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm text-[#FCA5A5]">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 h-12 rounded-2xl bg-[#20242D] text-white font-bold">Cancel</button>
                <button
                  id="admin-service-form-submit"
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 h-12 rounded-2xl font-bold text-white disabled:opacity-70"
                  style={{ background: "linear-gradient(135deg,#A855F7 0%,#7C3AED 100%)" }}
                >
                  {isCreating ? "Creating…" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminServiceRequestsScreen({ onBack, toast }: { onBack: () => void; toast: (msg: string, color?: string) => void }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const limit = 10;
  const { requests, total, isLoading, error, refetch, review } = useAdminServiceRequests(page, limit, status);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<{ id: string; approved: boolean } | null>(null);

  const handleConfirmReview = async () => {
    if (!confirmRequest) return;
    const { id, approved } = confirmRequest;
    setConfirmRequest(null);
    setReviewingId(id);
    try {
      await review(id, { approved });
      toast(approved ? "Service request approved." : "Service request rejected.", approved ? "#22C55E" : "#EF4444");
      refetch();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to review request.", "#EF4444");
      refetch();
    } finally {
      setReviewingId(null);
    }
  };

  const statusTabs: { label: string; value: string | undefined }[] = [
    { label: "All", value: undefined },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="flex flex-col gap-4 pb-4 pt-2">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Service Requests</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
        {statusTabs.map((tab) => (
          <button key={tab.label} onClick={() => { setStatus(tab.value); setPage(1); }} className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${status === tab.value ? "bg-[#5B6CFF] text-white" : "bg-[#20242D] text-[#A5A9B5] hover:text-white"}`}>{tab.label}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-[#171A21] rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.08)] p-6 text-center">
          <p className="text-[#FCA5A5] text-sm mb-3">{error}</p>
          <button onClick={refetch} className="text-[#5B6CFF] text-sm font-semibold bg-[rgba(91,108,255,0.12)] px-4 py-2 rounded-xl">Retry</button>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
          <p className="text-[#A5A9B5]">No service requests found</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-[#171A21] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{req.title || req.category.name}</p>
                    <p className="text-[#A5A9B5] text-xs mt-0.5">{req.helper.user.firstName} {req.helper.user.lastName} · {req.helper.user.email}</p>
                    <p className="text-[#A5A9B5] text-[10px] mt-0.5">Category: {req.category.name} · Submitted {new Date(req.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${req.status === 'PENDING' ? 'bg-[rgba(245,158,11,0.15)] text-[#FBBF24]' : req.status === 'APPROVED' ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]' : 'bg-[rgba(239,68,68,0.15)] text-[#EF4444]'}`}>{req.status}</span>
                </div>
                <p className="text-white text-sm font-semibold">₹{req.suggestedPrice.toLocaleString()} <span className="text-[#A5A9B5] text-xs font-normal">/ {req.suggestedPriceType}</span></p>
                {req.adminNotes && <p className="text-[#A5A9B5] text-xs mt-1">Note: {req.adminNotes}</p>}
                {req.status === 'PENDING' && (
                  <div className="flex gap-2 mt-3">
                    {reviewingId === req.id ? (
                      <div className="flex-1 h-10 rounded-xl bg-[#20242D] text-[#A5A9B5] text-xs font-bold flex items-center justify-center gap-1">
                        <Timer size={14} className="animate-spin" /> Processing…
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setConfirmRequest({ id: req.id, approved: true })} className="flex-1 h-10 rounded-xl bg-[#22C55E] text-white text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-1">
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => setConfirmRequest({ id: req.id, approved: false })} className="flex-1 h-10 rounded-xl bg-[rgba(239,68,68,0.12)] text-[#EF4444] text-xs font-bold active:scale-95 transition-transform flex items-center justify-center gap-1">
                          <X size={14} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-[#20242D] text-white text-xs font-semibold disabled:opacity-50">Previous</button>
              <span className="text-[#A5A9B5] text-xs">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl bg-[#5B6CFF] text-white text-xs font-semibold disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}

      {confirmRequest && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8">
          <div className="bg-[#171A21] rounded-3xl p-6 w-full flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: confirmRequest.approved ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}>
              <CheckCircle2 size={28} className={confirmRequest.approved ? "text-[#22C55E]" : "text-[#EF4444]"} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{confirmRequest.approved ? "Approve" : "Reject"} Request</h2>
              <p className="text-[#A5A9B5] text-sm mt-1">
                {confirmRequest.approved
                  ? "This will approve the service request for publication."
                  : "This will reject the service request. The helper will be notified."}
              </p>
            </div>
            <div className="flex gap-3 w-full pt-2">
              <button onClick={() => setConfirmRequest(null)} className="flex-1 h-12 rounded-2xl bg-[#20242D] text-white font-bold">Cancel</button>
              <button onClick={handleConfirmReview} className="flex-1 h-12 rounded-2xl font-bold text-white active:scale-95 transition-transform" style={{ background: confirmRequest.approved ? "linear-gradient(135deg,#22C55E 0%,#16A34A 100%)" : "linear-gradient(135deg,#EF4444 0%,#B91C1C 100%)" }}>
                {confirmRequest.approved ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]           = useState<Screen>("home");
  const [prevScreen, setPrevScreen]   = useState<Screen>("home");
  const [detailId, setDetailId]       = useState("1");
  const [bookingDetailId, setBookingDetailId] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<BookingData | null>(null);
  const [toasts, setToasts]           = useState<{ id:number; msg:string; color?:string }[]>([]);
  const [registerEmail, setRegisterEmail] = useState("");
  const toastId = useState(0);

  const { isAuthenticated, isLoading, login, logout, user } = useAuth();

  const isHelper = user?.role === 'helper';
  const isAdmin = user?.role === 'ADMIN';

  const pushToast = (msg: string, color?: string) => {
    const id = ++toastId[0];
    setToasts((ts) => [...ts, { id, msg, color }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 3000);
  };
  const dismissToast = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));

  const navigate = (s: Screen, id?: string) => {
    setPrevScreen(screen);
    if (id) setDetailId(id);
    setScreen(s);
  };

  const goBack = () => setScreen(prevScreen);

  const tabScreens: Screen[] = ["home","explore","bookings","profile","helper-dashboard","helper-service-requests","helper-bookings","admin-dashboard"];
  const activeTab = tabScreens.includes(screen) ? screen : prevScreen;
  const showBottomNav = !["detail","booking","addresses","booking-detail","register","verify-email","helper-booking-detail","admin-users","admin-bookings","admin-categories","admin-services","admin-service-requests","helper-service-requests"].includes(screen);

  const navItems = isHelper ? [
    { id:"helper-dashboard" as Screen, icon:Home,          label:"Dashboard" },
    { id:"helper-service-requests" as Screen, icon:ClipboardList, label:"Requests" },
    { id:"helper-bookings"  as Screen, icon:CalendarCheck, label:"Jobs"      },
    { id:"profile"          as Screen, icon:User,          label:"Profile"   },
  ] : isAdmin ? [
    { id:"admin-dashboard" as Screen, icon:Shield, label:"Admin" },
    { id:"profile"         as Screen, icon:User,   label:"Profile" },
  ] : [
    { id:"home"     as Screen, icon:Home,          label:"Home"     },
    { id:"explore"  as Screen, icon:Grid,          label:"Explore"  },
    { id:"bookings" as Screen, icon:CalendarCheck, label:"Bookings" },
    { id:"profile"  as Screen, icon:User,          label:"Profile"  },
  ];

  useEffect(() => {
    if (isAuthenticated && isHelper && screen === 'home') {
      setScreen('helper-dashboard');
      setPrevScreen('helper-dashboard');
    } else if (isAuthenticated && isAdmin && screen === 'home') {
      setScreen('admin-dashboard');
      setPrevScreen('admin-dashboard');
    }
  }, [isAuthenticated, isHelper, isAdmin, screen]);

  useEffect(() => {
    const adminScreens: Screen[] = ["admin-dashboard", "admin-users", "admin-bookings", "admin-categories", "admin-services", "admin-service-requests"];
    if (adminScreens.includes(screen) && !isAdmin) {
      setScreen("home");
      setPrevScreen("home");
    }
  }, [screen, isAdmin]);

  const openBookingDetail = (id: string) => {
    setBookingDetailId(id);
    navigate("booking-detail");
  };

  const handleLogout = async () => {
    await logout();
    setScreen("home");
    setConfirmData(null);
    setBookingDetailId(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"#0A0C0F" }}>
      <div className="relative flex flex-col overflow-hidden shadow-2xl" style={{ width:"min(100vw,390px)", height:"min(100vh,844px)", background:"#0F1115", borderRadius:"clamp(0px,2.5rem,2.5rem)" }}>

        {!isAuthenticated && !isLoading ? (
          screen === "register" ? (
            <RegisterScreen
              onNavigate={(s) => navigate(s === "login" ? "login" : s)}
              onRegistered={(email) => setRegisterEmail(email)}
              toast={pushToast}
            />
          ) : screen === "verify-email" ? (
            <OTPScreen email={registerEmail} onVerified={() => navigate("home")} toast={pushToast} />
          ) : (
            <LoginScreen
              onLogin={async (email: string, password: string) => {
                await login(email, password);
                setScreen("home");
              }}
              onNavigate={(s) => navigate(s === "register" ? "register" : s)}
              toast={pushToast}
            />
          )
        ) : (
          <>
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 pt-3 pb-1 shrink-0">
              <span className="text-white text-xs font-semibold">9:41</span>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-0.5 items-end h-3">
                  {[2,3,4,4].map((h,i) => <div key={i} className="w-1 rounded-sm bg-white" style={{ height:`${h*3}px` }} />)}
                </div>
                <div className="w-4 h-3 rounded-sm border border-white flex items-center px-0.5">
                  <div className="flex-1 h-1.5 bg-white rounded-sm" />
                </div>
              </div>
            </div>

            {/* Toast overlay */}
            <ToastContainer toasts={toasts} dismiss={dismissToast} />

            {/* Screen content */}
            <div className="flex-1 overflow-y-auto px-5 min-h-0" style={{ scrollbarWidth:"none" }}>
              {screen === "home" && <HomeScreen onNavigate={navigate} toast={pushToast} user={user} />}
              {screen === "explore" && <ExploreScreen onNavigate={navigate} toast={pushToast} />}
              {screen === "detail" && (
                <DetailScreen
                  providerId={detailId}
                  onBack={goBack}
                  onBook={() => navigate("booking")}
                  toast={pushToast}
                />
              )}
              {screen === "booking" && (
                <BookingScreen
                  serviceId={detailId}
                  onBack={goBack}
                  onBookingCreated={(booking) => {
                    setConfirmData(booking);
                  }}
                  toast={pushToast}
                  onNavigate={navigate}
                />
              )}
              {screen === "bookings" && (
                <BookingsScreen
                  onNavigate={navigate}
                  onViewDetails={openBookingDetail}
                  toast={pushToast}
                />
              )}
              {screen === "booking-detail" && bookingDetailId && (
                <BookingDetailsScreen
                  bookingId={bookingDetailId}
                  onBack={goBack}
                  toast={pushToast}
                />
              )}
              {screen === "profile"  && (isHelper ? <HelperProfileScreen onNavigate={navigate} toast={pushToast} /> : <ProfileScreen onNavigate={navigate} toast={pushToast} />)}
              {screen === "addresses" && <AddressScreen onBack={goBack} toast={pushToast} />}
              {screen === "helper-dashboard" && <HelperDashboardScreen onNavigate={navigate} toast={pushToast} />}
              {screen === "helper-service-requests" && <HelperServiceRequestsScreen onBack={goBack} toast={pushToast} />}
              {screen === "helper-bookings" && <HelperBookingsScreen onNavigate={navigate} onViewDetails={(id) => { setBookingDetailId(id); navigate("helper-booking-detail"); }} toast={pushToast} />}
              {screen === "helper-booking-detail" && bookingDetailId && <HelperBookingDetailScreen bookingId={bookingDetailId} onBack={goBack} toast={pushToast} />}
              {isAdmin && screen === "admin-dashboard" && <AdminDashboardScreen onNavigate={navigate} toast={pushToast} />}
              {isAdmin && screen === "admin-users" && <AdminUsersScreen onBack={goBack} toast={pushToast} />}
              {isAdmin && screen === "admin-bookings" && <AdminBookingsScreen onBack={goBack} toast={pushToast} />}
              {isAdmin && screen === "admin-categories" && <AdminCategoriesScreen onBack={goBack} toast={pushToast} />}
              {isAdmin && screen === "admin-services" && <AdminServicesScreen onBack={goBack} toast={pushToast} />}
              {isAdmin && screen === "admin-service-requests" && <AdminServiceRequestsScreen onBack={goBack} toast={pushToast} />}
            </div>

            {/* Bottom nav */}
            {showBottomNav && (
              <div className="shrink-0 px-4 pb-4 pt-2" style={{ background:"linear-gradient(to top,#0F1115 80%,transparent)", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-around">
                  {navItems.map(({ id, icon:Icon, label }) => {
                    const isActive = activeTab === id;
                    return (
                      <button key={id} onClick={() => navigate(id)} className="flex flex-col items-center gap-1 px-4 py-2 relative">
                        {isActive && <span className="absolute -top-1 w-8 h-0.5 rounded-full" style={{ background:"#5B6CFF" }} />}
                        <Icon size={22} className={isActive?"text-[#5B6CFF]":"text-[#A5A9B5]"} strokeWidth={isActive?2.5:1.8} />
                        <span className={`text-[10px] font-semibold ${isActive?"text-[#5B6CFF]":"text-[#A5A9B5]"}`}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Booking confirmation modal */}
            {confirmData && (
              <ConfirmModal
                booking={confirmData}
                onClose={() => { setConfirmData(null); navigate("bookings"); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

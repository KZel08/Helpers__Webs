import { useState, useEffect } from "react";
import {
  MapPin, Bell, Search, Star, ChevronRight, Home, Grid,
  CalendarCheck, User, Sparkles, Zap, Shield, Clock,
  CheckCircle2, ArrowLeft, Phone, MessageSquare, Filter,
  Plus, Minus, Heart, TrendingUp, Flame, Award, ThumbsUp,
  Repeat2, Gift, Timer, X, Share2, Copy, SlidersHorizontal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "home" | "explore" | "bookings" | "profile" | "detail" | "booking";

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

interface Booking {
  id: string;
  service: string;
  provider: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  price: string;
  img: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const services = [
  { id: "cleaning",  icon: "🧹", label: "Cleaning",    color: "#5B6CFF", bg: "rgba(91,108,255,0.15)"  },
  { id: "plumbing",  icon: "🔧", label: "Plumbing",    color: "#22C55E", bg: "rgba(34,197,94,0.15)"   },
  { id: "electrical",icon: "⚡", label: "Electrical",  color: "#F59E0B", bg: "rgba(245,158,11,0.15)"  },
  { id: "salon",     icon: "✂️", label: "Salon",       color: "#EC4899", bg: "rgba(236,72,153,0.15)"  },
  { id: "painting",  icon: "🎨", label: "Painting",    color: "#8B5CF6", bg: "rgba(139,92,246,0.15)"  },
  { id: "ac",        icon: "❄️", label: "AC Repair",   color: "#06B6D4", bg: "rgba(6,182,212,0.15)"   },
  { id: "pest",      icon: "🐛", label: "Pest Control",color: "#EF4444", bg: "rgba(239,68,68,0.15)"   },
  { id: "more",      icon: "➕", label: "More",        color: "#A5A9B5", bg: "rgba(165,169,181,0.15)" },
];

const ALL_PROVIDERS: Provider[] = [
  { id:"1", name:"Arjun Mehta",  role:"Deep Cleaning Expert",    rating:4.9, reviews:312, price:"₹599", img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format", badge:"Top Rated", tags:["Verified","5+ yrs"], category:"Cleaning"    },
  { id:"2", name:"Priya Sharma", role:"Salon & Beauty Pro",      rating:4.8, reviews:189, price:"₹449", img:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format", badge:"Popular",   tags:["Certified","3+ yrs"], category:"Salon"       },
  { id:"3", name:"Ravi Kumar",   role:"Plumbing Specialist",     rating:4.7, reviews:241, price:"₹349", img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format",               tags:["Verified","7+ yrs"], category:"Plumbing"    },
  { id:"4", name:"Sunita Patel", role:"AC Repair Technician",    rating:4.9, reviews:98,  price:"₹699", img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&auto=format", badge:"New",       tags:["Certified","2+ yrs"], category:"AC Repair"   },
  { id:"5", name:"Deepak Nair",  role:"Electrician & Wiring",    rating:4.6, reviews:155, price:"₹399", img:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format",               tags:["Verified","4+ yrs"], category:"Electrical"  },
  { id:"6", name:"Meena Joshi",  role:"Painting & Wall Expert",  rating:4.8, reviews:87,  price:"₹799", img:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&auto=format",               tags:["Certified","6+ yrs"], category:"Painting"    },
];

const INITIAL_BOOKINGS: Booking[] = [
  { id:"b1", service:"Deep Cleaning",        provider:"Arjun Mehta", date:"12 Jul 2026", time:"10:00 AM", status:"upcoming",   price:"₹599", img:"https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&h=120&fit=crop&auto=format" },
  { id:"b2", service:"Salon – Hair & Nails", provider:"Priya Sharma",date:"5 Jul 2026",  time:"2:30 PM",  status:"completed",  price:"₹449", img:"https://images.unsplash.com/photo-1560066984-138dadb4c035?w=120&h=120&fit=crop&auto=format" },
  { id:"b3", service:"Plumbing – Pipe Fix",  provider:"Ravi Kumar",  date:"29 Jun 2026", time:"11:00 AM", status:"cancelled",  price:"₹349", img:"https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=120&h=120&fit=crop&auto=format" },
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

const exploreFilters = ["All","Cleaning","Plumbing","Electrical","Salon","Painting","AC Repair"];

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

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatusPill({ status }: { status: Booking["status"] }) {
  const map = {
    upcoming:  { label:"Upcoming",  cls:"text-[#5B6CFF] bg-[rgba(91,108,255,0.15)]"  },
    completed: { label:"Completed", cls:"text-[#22C55E] bg-[rgba(34,197,94,0.15)]"   },
    cancelled: { label:"Cancelled", cls:"text-[#EF4444] bg-[rgba(239,68,68,0.15)]"   },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cls}`}>{label}</span>;
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

// ─── Home screen ──────────────────────────────────────────────────────────────

function HomeScreen({ onNavigate, toast }: { onNavigate: (s: Screen, id?: string) => void; toast: (msg: string, color?: string) => void }) {
  const [promoIdx, setPromoIdx] = useState(0);
  const loyaltyPts = 1240;

  useEffect(() => {
    const t = setInterval(() => setPromoIdx((i) => (i + 1) % promos.length), 3500);
    return () => clearInterval(t);
  }, []);

  const promo = promos[promoIdx];

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
          <button onClick={() => toast("Location updated to Bandra West, Mumbai")} className="flex items-center gap-1.5 text-[#A5A9B5] text-sm mb-0.5">
            <MapPin size={13} className="text-[#5B6CFF]" />
            <span>Bandra West, Mumbai</span>
            <ChevronRight size={13} />
          </button>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Good morning, Rahul 👋</h1>
        </div>
        <button onClick={() => toast("You have 3 new notifications", "#5B6CFF")} className="relative w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
          <Bell size={18} className="text-white" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#5B6CFF]" />
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

      {/* Loyalty card */}
      <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background:"linear-gradient(135deg,#20242D 0%,#1a1d26 100%)", border:"1px solid rgba(91,108,255,0.25)" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background:"rgba(91,108,255,0.2)" }}>
          <Award size={22} className="text-[#5B6CFF]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#A5A9B5] font-medium mb-0.5">Helpers Coins</p>
          <p className="text-white font-bold text-base" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{loyaltyPts.toLocaleString()} pts</p>
          <div className="w-full bg-[#2E3340] rounded-full h-1.5 mt-1.5">
            <div className="h-1.5 rounded-full" style={{ width:`${(loyaltyPts/2000)*100}%`, background:"linear-gradient(90deg,#5B6CFF,#7E57FF)" }} />
          </div>
          <p className="text-[10px] text-[#A5A9B5] mt-1">760 pts to your next reward</p>
        </div>
        <button onClick={() => toast("🎁 Reward redeemed! ₹100 off your next booking.", "#5B6CFF")} className="shrink-0 flex items-center gap-1 text-[#5B6CFF] text-xs font-bold active:scale-90 transition-transform">
          <Gift size={13} />Redeem
        </button>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Services</h2>
          <button onClick={() => onNavigate("explore")} className="text-[#5B6CFF] text-sm font-semibold">See all</button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {services.map((s) => (
            <button key={s.id} onClick={() => onNavigate("explore")} className="flex flex-col items-center gap-2 group">
              <div className="w-full aspect-square rounded-2xl flex items-center justify-center text-2xl group-active:scale-90 transition-transform" style={{ background:s.bg }}>{s.icon}</div>
              <span className="text-xs text-[#A5A9B5] font-medium text-center leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Flash Deals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-[#F59E0B]" />
            <h2 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Flash Deals</h2>
          </div>
          <button onClick={() => onNavigate("explore")} className="text-[#5B6CFF] text-sm font-semibold">View all</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
          {flashDeals.map((deal) => <FlashDealCard key={deal.id} deal={deal} onNavigate={onNavigate} />)}
        </div>
      </div>

      {/* Upcoming booking reminder */}
      <button onClick={() => onNavigate("bookings")} className="rounded-2xl p-4 flex items-center gap-4 w-full text-left active:scale-[0.98] transition-transform" style={{ background:"rgba(91,108,255,0.1)", border:"1px solid rgba(91,108,255,0.3)" }}>
        <div className="w-10 h-10 rounded-xl bg-[#5B6CFF] flex items-center justify-center shrink-0"><Clock size={18} className="text-white" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Deep Cleaning — Tomorrow</p>
          <p className="text-[#A5A9B5] text-xs mt-0.5">Arjun Mehta · 10:00 AM · Bandra</p>
        </div>
        <ChevronRight size={16} className="text-[#5B6CFF] shrink-0" />
      </button>

      {/* Book Again */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Repeat2 size={15} className="text-[#A5A9B5]" />
          <h2 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Book Again</h2>
        </div>
        <div className="flex gap-3">
          {recentlyBooked.map((rb) => (
            <button key={rb.id} onClick={() => onNavigate("detail", rb.providerId)} className="flex-1 bg-[#171A21] rounded-2xl overflow-hidden flex flex-col active:scale-95 transition-transform">
              <div className="h-20 bg-[#20242D]"><img src={rb.img} alt={rb.label} className="w-full h-full object-cover" /></div>
              <div className="p-2.5">
                <p className="text-white font-bold text-xs" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{rb.label}</p>
                <p className="text-[#A5A9B5] text-[10px] mt-0.5">{rb.provider}</p>
              </div>
            </button>
          ))}
        </div>
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

      {/* Live activity */}
      <div className="bg-[#171A21] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse inline-block" />
          <h3 className="font-bold text-white text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Live in your area</h3>
        </div>
        <div className="flex flex-col gap-2.5">
          {liveActivity.map(({ msg, time, dot }) => (
            <div key={msg} className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background:dot }} />
              <p className="text-[#A5A9B5] text-xs leading-snug flex-1">{msg}</p>
              <span className="text-[10px] text-[#A5A9B5] shrink-0">{time}</span>
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
  const [sortBy, setSortBy] = useState<"rating"|"price">("rating");

  const filtered = ALL_PROVIDERS
    .filter((p) => {
      const matchCat = active === "All" || p.category === active;
      const matchQ   = query === "" || p.name.toLowerCase().includes(query.toLowerCase()) || p.role.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    })
    .sort((a, b) => sortBy === "rating"
      ? b.rating - a.rating
      : parseInt(a.price.replace(/[₹,]/g,"")) - parseInt(b.price.replace(/[₹,]/g,""))
    );

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Search */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-3 flex-1 bg-[#20242D] rounded-2xl px-4 py-3.5">
          <Search size={18} className="text-[#A5A9B5] shrink-0" />
          <input className="bg-transparent flex-1 text-white text-sm outline-none placeholder:text-[#A5A9B5]" placeholder="Search services or helpers…" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query.length > 0 && <button onClick={() => setQuery("")} className="text-[#A5A9B5] hover:text-white"><X size={14}/></button>}
        </div>
        <button onClick={() => setShowFilter(!showFilter)} className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${showFilter ? "bg-[#5B6CFF]" : "bg-[#20242D]"}`}>
          <SlidersHorizontal size={18} className={showFilter ? "text-white" : "text-[#A5A9B5]"} />
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="bg-[#171A21] rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-white font-bold text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Sort by</p>
          <div className="flex gap-2">
            {(["rating","price"] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)} className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${sortBy===s?"bg-[#5B6CFF] text-white":"bg-[#20242D] text-[#A5A9B5]"}`}>{s==="rating"?"Top Rated":"Lowest Price"}</button>
            ))}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:"none" }}>
        {exploreFilters.map((f) => (
          <button key={f} onClick={() => setActive(f)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${active===f?"bg-[#5B6CFF] text-white":"bg-[#20242D] text-[#A5A9B5] hover:text-white"}`}>{f}</button>
        ))}
      </div>

      <p className="text-[#A5A9B5] text-sm">{filtered.length} helper{filtered.length!==1?"s":""} found{active!=="All"?` for ${active}`:""}</p>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Search size={40} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
            <p className="text-[#A5A9B5]">No helpers match your search</p>
            <button onClick={() => { setQuery(""); setActive("All"); }} className="mt-3 text-[#5B6CFF] text-sm font-semibold">Clear filters</button>
          </div>
        ) : (
          filtered.map((p) => <ProviderCard key={p.id} p={p} onClick={() => onNavigate("detail", p.id)} />)
        )}
      </div>
    </div>
  );
}

// ─── Detail screen ────────────────────────────────────────────────────────────

function DetailScreen({ providerId, onBack, onBook, toast }: { providerId: string; onBack: () => void; onBook: () => void; toast: (msg: string, color?: string) => void }) {
  const p = ALL_PROVIDERS.find((x) => x.id === providerId) ?? ALL_PROVIDERS[0];
  const [liked, setLiked] = useState(false);

  return (
    <div className="flex flex-col pb-4">
      {/* Hero */}
      <div className="relative -mx-5 h-56 bg-[#20242D]">
        <img src={p.img.replace("w=200&h=200","w=480&h=224")} alt={p.name} className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0" style={{ background:"linear-gradient(to bottom,rgba(15,17,21,0.3) 0%,rgba(15,17,21,0.85) 100%)" }} />
        <button onClick={onBack} className="absolute top-4 left-5 w-10 h-10 rounded-full bg-[rgba(15,17,21,0.6)] backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <button onClick={() => { setLiked(!liked); if(!liked) toast(`${p.name} saved to favourites ❤️`, "#EF4444"); }} className="absolute top-4 right-5 w-10 h-10 rounded-full bg-[rgba(15,17,21,0.6)] backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
          <Heart size={18} fill={liked?"#EF4444":"none"} className={liked?"text-[#EF4444]":"text-white"} />
        </button>
      </div>

      <div className="flex flex-col gap-5 pt-5">
        {/* Name & price */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.name}</h2>
            <p className="text-[#A5A9B5] text-sm mt-0.5">{p.role}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{p.price}</p>
            <p className="text-[#A5A9B5] text-xs">per visit</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Rating",     value:`${p.rating}★`, color:"#F59E0B" },
            { label:"Reviews",    value:`${p.reviews}+`, color:"#5B6CFF" },
            { label:"Experience", value:p.tags[1]??"3+ yrs", color:"#22C55E" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#20242D] rounded-xl p-3 text-center">
              <p className="font-bold text-base" style={{ color }}>{value}</p>
              <p className="text-[#A5A9B5] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {p.tags.map((t) => (
            <span key={t} className="flex items-center gap-1 text-xs font-semibold text-[#5B6CFF] bg-[rgba(91,108,255,0.15)] px-3 py-1.5 rounded-full">
              <CheckCircle2 size={11} />{t}
            </span>
          ))}
        </div>

        {/* About */}
        <div className="bg-[#171A21] rounded-2xl p-4">
          <h3 className="font-bold text-white mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>About</h3>
          <p className="text-[#A5A9B5] text-sm leading-relaxed">{p.name} is a background-verified professional with hands-on experience in {p.role.toLowerCase()}. Known for punctuality, quality workmanship, and reliable service.</p>
        </div>

        {/* Services offered */}
        <div>
          <h3 className="font-bold text-white mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Services Offered</h3>
          <div className="flex flex-col gap-2">
            {(["Standard Visit","Deep / Premium","Emergency / Same Day"] as const).map((s, i) => {
              const base = parseInt(p.price.replace(/[₹,]/g,""));
              return (
                <button key={s} onClick={() => onBook()} className="bg-[#171A21] rounded-xl px-4 py-3 flex items-center justify-between hover:bg-[#1E2229] active:scale-[0.98] transition-all">
                  <span className="text-sm text-white">{s}</span>
                  <span className="text-sm font-bold text-[#5B6CFF]">₹{(base + i*150).toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button onClick={() => toast(`Calling ${p.name}…`, "#22C55E")} className="w-12 h-12 rounded-2xl bg-[#20242D] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <Phone size={18} className="text-[#A5A9B5]" />
          </button>
          <button onClick={() => toast(`Opening chat with ${p.name}…`, "#5B6CFF")} className="w-12 h-12 rounded-2xl bg-[#20242D] flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <MessageSquare size={18} className="text-[#A5A9B5]" />
          </button>
          <button onClick={onBook} className="flex-1 h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity" style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking screen ───────────────────────────────────────────────────────────

function BookingScreen({ providerId, onBack, onConfirm, toast }: { providerId: string; onBack: () => void; onConfirm: () => void; toast: (msg: string, color?: string) => void }) {
  const p = ALL_PROVIDERS.find((x) => x.id === providerId) ?? ALL_PROVIDERS[0];
  const [qty, setQty] = useState(1);
  const [selectedDate, setSelectedDate] = useState("12 Jul");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const dates = ["11 Jul","12 Jul","13 Jul","14 Jul","15 Jul"];
  const times = ["08:00 AM","10:00 AM","12:00 PM","2:00 PM","4:00 PM","6:00 PM"];
  const base = parseInt(p.price.replace(/[₹,]/g,""));
  const discount = promoApplied ? 180 : 0;
  const total = Math.max(0, base * qty + 49 - discount);

  const applyPromo = () => {
    if (promoInput.trim().toUpperCase() === "FIRST30") { setPromoApplied(true); toast("Promo FIRST30 applied! −₹180 discount added.", "#22C55E"); }
    else toast("Invalid promo code. Try FIRST30.", "#EF4444");
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex items-center gap-4 pt-2">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h2 className="font-bold text-white text-lg" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Book a Helper</h2>
      </div>

      {/* Provider */}
      <div className="bg-[#171A21] rounded-2xl p-4 flex items-center gap-4">
        <img src={p.img} alt={p.name} className="w-14 h-14 rounded-xl object-cover bg-[#20242D] shrink-0" />
        <div>
          <p className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{p.name}</p>
          <p className="text-[#A5A9B5] text-sm">{p.role}</p>
          <StarRow rating={p.rating} reviews={p.reviews} />
        </div>
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

      {/* Quantity */}
      <div className="bg-[#171A21] rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Hours / Sessions</p>
          <p className="text-[#A5A9B5] text-sm">{p.price} per session</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setQty(Math.max(1, qty-1))} className="w-9 h-9 rounded-xl bg-[#20242D] flex items-center justify-center active:scale-90 transition-transform"><Minus size={16} className="text-white"/></button>
          <span className="text-white font-bold text-lg w-5 text-center">{qty}</span>
          <button onClick={() => setQty(qty+1)} className="w-9 h-9 rounded-xl bg-[#5B6CFF] flex items-center justify-center active:scale-90 transition-transform"><Plus size={16} className="text-white"/></button>
        </div>
      </div>

      {/* Address */}
      <div className="bg-[#171A21] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Address</h3>
          <button onClick={() => toast("Address change coming soon!", "#5B6CFF")} className="text-[#5B6CFF] text-sm font-semibold">Change</button>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-[#5B6CFF] mt-0.5 shrink-0" />
          <p className="text-[#A5A9B5] text-sm">12, Linking Road, Bandra West, Mumbai – 400050</p>
        </div>
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

      {/* Price summary */}
      <div className="bg-[#171A21] rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Price Summary</h3>
        {[
          { label:`Service × ${qty}`, value:`₹${(base*qty).toLocaleString()}`, green:false },
          { label:"Platform fee",     value:"₹49",  green:false },
          ...(promoApplied ? [{ label:"Discount (FIRST30)", value:"−₹180", green:true }] : []),
        ].map(({ label, value, green }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-[#A5A9B5]">{label}</span>
            <span className={green?"text-[#22C55E] font-semibold":"text-white"}>{value}</span>
          </div>
        ))}
        <div className="border-t border-[rgba(255,255,255,0.08)] pt-3 flex justify-between">
          <span className="font-bold text-white">Total</span>
          <span className="font-bold text-white text-lg">₹{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Confirm */}
      <button onClick={onConfirm} className="w-full h-14 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 active:opacity-80 transition-opacity" style={{ background:"linear-gradient(135deg,#5B6CFF 0%,#7E57FF 100%)" }}>
        <CheckCircle2 size={20} />
        Confirm Booking — ₹{total.toLocaleString()}
      </button>
    </div>
  );
}

// ─── Bookings screen ──────────────────────────────────────────────────────────

function BookingsScreen({ onNavigate, toast }: { onNavigate: (s: Screen, id?: string) => void; toast: (msg: string, color?: string) => void }) {
  const [tab, setTab] = useState<"upcoming"|"past">("upcoming");
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);

  const cancelBooking = (id: string) => {
    setBookings((bs) => bs.map((b) => b.id === id ? { ...b, status:"cancelled" } : b));
    toast("Booking cancelled. Refund will be processed in 3–5 days.", "#EF4444");
  };

  const filtered = tab === "upcoming"
    ? bookings.filter((b) => b.status === "upcoming")
    : bookings.filter((b) => b.status !== "upcoming");

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-2">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>My Bookings</h2>
        <p className="text-[#A5A9B5] text-sm mt-0.5">Track and manage your service history</p>
      </div>

      <div className="flex bg-[#20242D] rounded-2xl p-1">
        {(["upcoming","past"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors capitalize ${tab===t?"bg-[#5B6CFF] text-white":"text-[#A5A9B5]"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <CalendarCheck size={48} className="text-[#A5A9B5] mx-auto mb-3 opacity-30" />
            <p className="text-[#A5A9B5]">No {tab} bookings</p>
            {tab === "upcoming" && (
              <button onClick={() => onNavigate("explore")} className="mt-3 bg-[#5B6CFF] text-white text-sm font-bold px-5 py-2.5 rounded-xl">Book a Service</button>
            )}
          </div>
        )}
        {filtered.map((b) => (
          <div key={b.id} className="bg-[#171A21] rounded-2xl p-4">
            <div className="flex items-start gap-4">
              <img src={b.img} alt={b.service} className="w-16 h-16 rounded-xl object-cover bg-[#20242D] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1 gap-2">
                  <p className="font-bold text-white text-sm leading-snug" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{b.service}</p>
                  <StatusPill status={b.status} />
                </div>
                <p className="text-[#A5A9B5] text-xs mb-2">{b.provider}</p>
                <div className="flex items-center gap-3 text-xs text-[#A5A9B5]">
                  <span className="flex items-center gap-1"><CalendarCheck size={11}/>{b.date}</span>
                  <span className="flex items-center gap-1"><Clock size={11}/>{b.time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
              <span className="text-white font-bold">{b.price}</span>
              <div className="flex gap-2">
                {b.status === "upcoming" && (
                  <button onClick={() => cancelBooking(b.id)} className="text-xs font-semibold text-[#EF4444] bg-[rgba(239,68,68,0.1)] px-3 py-1.5 rounded-xl active:scale-95 transition-transform">Cancel</button>
                )}
                {b.status === "completed" && (
                  <button onClick={() => toast("Rating submitted! Thanks for your feedback.", "#F59E0B")} className="text-xs font-semibold text-[#5B6CFF] bg-[rgba(91,108,255,0.15)] px-3 py-1.5 rounded-xl active:scale-95 transition-transform">Rate Helper</button>
                )}
                <button onClick={() => toast(`Booking details for ${b.service} on ${b.date}.`)} className="text-xs font-semibold text-white bg-[#20242D] px-3 py-1.5 rounded-xl active:scale-95 transition-transform">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile screen ───────────────────────────────────────────────────────────

function ProfileScreen({ onNavigate, toast }: { onNavigate: (s: Screen) => void; toast: (msg: string, color?: string) => void }) {
  const stats = [
    { label:"Bookings", value:"14", action: () => onNavigate("bookings") },
    { label:"Saved",    value:"6",  action: () => toast("Opening saved helpers…", "#5B6CFF") },
    { label:"Reviews",  value:"9",  action: () => toast("Opening your reviews…", "#F59E0B") },
  ];
  const menuItems = [
    { icon:"📍", label:"Saved Addresses",   action: () => toast("Manage your saved addresses") },
    { icon:"💳", label:"Payment Methods",   action: () => toast("Manage payment methods") },
    { icon:"🔔", label:"Notifications",     action: () => toast("You have 3 new notifications", "#5B6CFF") },
    { icon:"🛡️", label:"Privacy & Security",action: () => toast("Privacy settings opening…") },
    { icon:"💬", label:"Help & Support",    action: () => toast("Connecting to support…", "#22C55E") },
    { icon:"⭐", label:"Rate the App",      action: () => toast("Thanks for rating Helpers! ⭐⭐⭐⭐⭐", "#F59E0B") },
    { icon:"🚪", label:"Sign Out",          action: () => toast("Signed out successfully") },
  ];

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="pt-4 flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#5B6CFF] to-[#7E57FF] flex items-center justify-center text-3xl font-bold text-white">R</div>
          <button onClick={() => toast("Photo update coming soon!")} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#5B6CFF] border-2 border-[#0F1115] flex items-center justify-center active:scale-90 transition-transform">
            <Plus size={13} className="text-white" />
          </button>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Rahul Verma</h2>
          <p className="text-[#A5A9B5] text-sm">rahul.verma@gmail.com</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, action }) => (
          <button key={label} onClick={action} className="bg-[#171A21] rounded-2xl p-4 text-center hover:bg-[#1E2229] active:scale-95 transition-all">
            <p className="text-2xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{value}</p>
            <p className="text-[#A5A9B5] text-xs mt-0.5">{label}</p>
          </button>
        ))}
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

function ConfirmModal({ providerName, selectedDate, selectedTime, total, onClose }: { providerName: string; selectedDate: string; selectedTime: string; total: string; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-5 pb-8">
      <div className="bg-[#171A21] rounded-3xl p-6 w-full flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background:"rgba(34,197,94,0.15)" }}>
          <CheckCircle2 size={32} className="text-[#22C55E]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Booking Confirmed!</h2>
          <p className="text-[#A5A9B5] text-sm mt-1">You&apos;ll get a reminder 30 min before your helper arrives.</p>
        </div>
        <div className="bg-[#20242D] rounded-2xl p-4 w-full flex flex-col gap-2 text-sm">
          {[
            ["Helper",     providerName],
            ["Date & Time",`${selectedDate}, ${selectedTime}`],
            ["Total Paid", total],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-[#A5A9B5]">{k}</span>
              <span className="text-white font-semibold">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="w-full h-12 rounded-2xl font-bold text-white active:opacity-80 transition-opacity" style={{ background:"linear-gradient(135deg,#5B6CFF,#7E57FF)" }}>Done</button>
      </div>
    </div>
  );
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────

const navItems = [
  { id:"home"     as Screen, icon:Home,          label:"Home"     },
  { id:"explore"  as Screen, icon:Grid,          label:"Explore"  },
  { id:"bookings" as Screen, icon:CalendarCheck, label:"Bookings" },
  { id:"profile"  as Screen, icon:User,          label:"Profile"  },
];

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]         = useState<Screen>("home");
  const [prevScreen, setPrevScreen] = useState<Screen>("home");
  const [detailId, setDetailId]     = useState("1");
  const [confirmData, setConfirmData] = useState<{ name:string; date:string; time:string; total:string }|null>(null);
  const [toasts, setToasts]         = useState<{ id:number; msg:string; color?:string }[]>([]);
  const toastId = useState(0);

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

  const tabScreens: Screen[] = ["home","explore","bookings","profile"];
  const activeTab = tabScreens.includes(screen) ? screen : prevScreen;
  const showBottomNav = !["detail","booking"].includes(screen);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"#0A0C0F" }}>
      <div className="relative flex flex-col overflow-hidden shadow-2xl" style={{ width:"min(100vw,390px)", height:"min(100vh,844px)", background:"#0F1115", borderRadius:"clamp(0px,2.5rem,2.5rem)" }}>

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
          {screen === "home" && <HomeScreen onNavigate={navigate} toast={pushToast} />}
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
              providerId={detailId}
              onBack={goBack}
              onConfirm={() => {
                const p = ALL_PROVIDERS.find((x) => x.id === detailId) ?? ALL_PROVIDERS[0];
                setConfirmData({ name:p.name, date:"12 Jul", time:"10:00 AM", total:"₹468" });
              }}
              toast={pushToast}
            />
          )}
          {screen === "bookings" && <BookingsScreen onNavigate={navigate} toast={pushToast} />}
          {screen === "profile"  && <ProfileScreen  onNavigate={navigate} toast={pushToast} />}
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
            providerName={confirmData.name}
            selectedDate={confirmData.date}
            selectedTime={confirmData.time}
            total={confirmData.total}
            onClose={() => { setConfirmData(null); navigate("bookings"); }}
          />
        )}
      </div>
    </div>
  );
}

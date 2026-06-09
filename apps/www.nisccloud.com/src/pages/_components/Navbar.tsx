import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu, X, ChevronDown, Globe, Server, Mail, Shield, Cpu, Megaphone,
  Palette, ShoppingCart, PenTool, BarChart2, Bot, Zap, Sun, Moon,
  Sparkles, LogIn, TrendingUp, Users, HardDrive, Lock, MonitorSmartphone,
  Target, AtSign, ScanLine, Database, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";

type SubItem = {
  label: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  children?: SubItem[];
};

const navItems: NavItem[] = [
  {
    label: "Marketing & Branding",
    href: "/services/marketing",
    children: [
      { label: "Brand Strategy & Positioning", desc: "Positioning, messaging & brand strategy", href: "/services/brand-identity", icon: <Target size={16} /> },
      { label: "Brand Identity & Design", desc: "Logos, colours, fonts & brand guidelines", href: "/services/brand-identity", icon: <Palette size={16} /> },
      { label: "Social Media Marketing", desc: "Content, scheduling & community management", href: "/services/social-media", icon: <PenTool size={16} /> },
      { label: "SEO / AEO / GEO", desc: "Rank #1 on Google, AI & Maps", href: "/services/seo", icon: <BarChart2 size={16} /> },
      { label: "Paid Advertising", desc: "Google, Meta & TikTok campaigns", href: "/services/paid-ads", icon: <Megaphone size={16} /> },
      { label: "Email Marketing", desc: "Sequences, newsletters & automation", href: "/services/email-marketing", icon: <AtSign size={16} /> },
      { label: "Influencer Marketing", desc: "Micro & macro influencer campaigns", href: "/services/social-media", icon: <Users size={16} /> },
      { label: "Website Design", desc: "Custom sites built for conversion", href: "/services/website-design", icon: <MonitorSmartphone size={16} /> },
      { label: "E-commerce Design", desc: "Full online stores with M-Pesa checkout", href: "/services/ecommerce", icon: <ShoppingCart size={16} /> },
    ],
  },
  {
    label: "Cloud Hosting",
    href: "/hosting",
    children: [
      { label: "Website Hosting", desc: "Fast, reliable shared hosting", href: "/hosting/shared", icon: <Server size={16} /> },
      { label: "WordPress Hosting", desc: "Optimised WordPress performance", href: "/hosting/wordpress", icon: <Zap size={16} /> },
      { label: "VPS Hosting", desc: "Virtual private servers with full control", href: "/hosting/vps", icon: <Cpu size={16} /> },
      { label: "VDS Hosting", desc: "Virtual dedicated server resources", href: "/hosting/vps", icon: <HardDrive size={16} /> },
      { label: "Dedicated Hosting", desc: "Full dedicated server power", href: "/hosting/shared", icon: <TrendingUp size={16} /> },
      { label: "Business Email Hosting", desc: "Professional email for your brand", href: "/hosting/email", icon: <Mail size={16} /> },
      { label: "Domain Registration", desc: ".co.ke, .com and 50+ extensions", href: "/hosting/domains", icon: <Globe size={16} /> },
    ],
  },
  {
    label: "Security",
    href: "/security",
    children: [
      { label: "Website Security", desc: "Malware scanning, cleanup & firewall", href: "/security", icon: <Shield size={16} /> },
      { label: "SSL Certificates", desc: "DV, OV & EV SSL — self or managed install", href: "/security", icon: <Lock size={16} /> },
      { label: "Web Application Firewall", desc: "Block hackers & DDoS attacks", href: "/security", icon: <Flame size={16} /> },
      { label: "Daily Malware Scanning", desc: "Scan up to 4× daily with instant alerts", href: "/security", icon: <ScanLine size={16} /> },
      { label: "Secure Daily Backups", desc: "Encrypted off-site backup & restore", href: "/security", icon: <Database size={16} /> },
      { label: "Managed SSL Service", desc: "We install & maintain SSL for you", href: "/security", icon: <Bot size={16} /> },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Portfolio", href: "/work" },
  { label: "Help", href: "/help" },
];

function MegaDropdown({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const navigate = useNavigate();
  if (!item.children) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[580px] bg-popover border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="p-4 grid grid-cols-2 gap-1">
        {item.children.map((child) => (
          <button
            key={child.href + child.label}
            onClick={() => { navigate(child.href); onClose(); }}
            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left cursor-pointer group"
          >
            <span className="mt-0.5 text-primary shrink-0">{child.icon}</span>
            <span>
              <span className="block text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">{child.label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">{child.desc}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Not sure? We'll help you choose.</span>
        <Button size="sm" variant="ghost" className="text-xs h-7 cursor-pointer" onClick={() => { navigate("/contact"); onClose(); }}>
          Talk to us →
        </Button>
      </div>
    </motion.div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogoClick = () => {
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={handleLogoClick}>
          <img src="/nisccloud-logo.svg" alt="Nisc Cloud" className="h-8 w-auto object-contain" />
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const hasDropdown = !!item.children;
            return (
              <div key={item.href} className="relative">
                <button
                  onClick={() => {
                    if (hasDropdown) {
                      setActiveDropdown(activeDropdown === item.href ? null : item.href);
                    } else {
                      navigate(item.href);
                      setActiveDropdown(null);
                    }
                  }}
                  onMouseEnter={() => { if (hasDropdown) setActiveDropdown(item.href); }}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    activeDropdown === item.href ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.label}
                  {hasDropdown && (
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${activeDropdown === item.href ? "rotate-180" : ""}`}
                    />
                  )}
                </button>
                <AnimatePresence>
                  {activeDropdown === item.href && hasDropdown && (
                    <MegaDropdown item={item} onClose={() => setActiveDropdown(null)} />
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium"
          >
            <LogIn size={15} />
            Login
          </button>
          <Button
            size="sm"
            onClick={() => navigate("/contact")}
            className="gap-1.5 bg-primary text-primary-foreground hover:opacity-90 cursor-pointer font-semibold tracking-wide rounded-full px-5"
          >
            Get Started
            <Sparkles size={14} />
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground cursor-pointer" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background/98 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1 max-h-[75vh] overflow-y-auto">
              {navItems.map((item) => {
                const hasChildren = !!item.children?.length;
                return (
                  <div key={item.href}>
                    <button
                      onClick={() => {
                        if (hasChildren) {
                          setMobileExpanded(mobileExpanded === item.href ? null : item.href);
                        } else {
                          navigate(item.href);
                          setOpen(false);
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      {item.label}
                      {hasChildren && (
                        <ChevronDown
                          size={14}
                          className={`transition-transform text-muted-foreground ${mobileExpanded === item.href ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>
                    <AnimatePresence>
                      {mobileExpanded === item.href && item.children && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pl-2"
                        >
                          {item.children.map((child) => (
                            <button
                              key={child.href + child.label}
                              onClick={() => { navigate(child.href); setOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer text-left"
                            >
                              <span className="text-primary shrink-0">{child.icon}</span>
                              <span>
                                <span className="block font-medium text-foreground">{child.label}</span>
                                <span className="block text-xs text-muted-foreground">{child.desc}</span>
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-border mt-1 flex flex-col gap-2">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer border border-border"
                >
                  <LogIn size={15} />
                  Login to nPanel
                </button>
                <Button size="sm" onClick={() => { navigate("/contact"); setOpen(false); }} className="gap-1.5 bg-primary text-primary-foreground w-full cursor-pointer font-semibold rounded-full">
                  Get Started <Sparkles size={13} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

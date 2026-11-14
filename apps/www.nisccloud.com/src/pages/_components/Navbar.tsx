import { useState, useRef, useEffect, type MouseEvent } from "react";
import ProductsMegaMenu, {
  productFamilies,
  productSections,
} from "./ProductsMegaMenu.tsx";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  ChevronDown,
  Globe,
  Server,
  Mail,
  Cpu,
  Megaphone,
  ShoppingCart,
  PenTool,
  BarChart2,
  Zap,
  TrendingUp,
  HardDrive,
  MonitorSmartphone,
  Users,
  Code2,
  Building2,
  Rocket,
  Sun,
  Moon,
  BookOpen,
  LifeBuoy,
  Target,
  AtSign,
  ArrowLeftRight,
  ShieldCheck,
  Lock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { FlowButton } from "@/components/ui/flow-button.tsx";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  NavbarAuthDesktop,
  NavbarAuthMobile,
  useNavbarAuth,
} from "./NavbarAuth.tsx";
import { useTheme } from "next-themes";
function resolvePublicUrl(configured: unknown, fallback: string) {
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim().replace(/\/$/, "");
  }
  return fallback;
}

const NPANEL_URL = resolvePublicUrl(
  import.meta.env.VITE_NPANEL_APP_URL,
  "https://npanel.nisccloud.com",
);
const NPANEL_SIGNUP_URL = resolvePublicUrl(
  import.meta.env.VITE_NPANEL_SIGNUP_URL,
  `${NPANEL_URL}/auth/register`,
);

const DOCS_URL = resolvePublicUrl(
  import.meta.env.VITE_DOCS_URL,
  "https://docs.nisccloud.com",
);

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
  /** When true, navigates with a full page load (external apps). */
  external?: boolean;
};

const navItems: NavItem[] = [
  {
    label: "Cloud Hosting",
    href: "/hosting",
    children: [
      {
        label: "Website Hosting",
        desc: "Simple hosting that stays fast",
        href: "/hosting/web-hosting",
        icon: <Server size={16} />,
      },
      {
        label: "Managed WordPress Hosting",
        desc: "WordPress that loads quickly and stays secure",
        href: "/hosting/wordpress",
        icon: <Zap size={16} />,
      },
      {
        label: "VPS Hosting",
        desc: "Private server power with full control",
        href: "/hosting/vps",
        icon: <Cpu size={16} />,
      },
      {
        label: "VDS Hosting",
        desc: "Dedicated virtual resources when you need more",
        href: "/hosting/vds",
        icon: <HardDrive size={16} />,
      },
      {
        label: "Dedicated Servers Hosting",
        desc: "Whole server, reserved for you",
        href: "/hosting/dedicated-servers",
        icon: <TrendingUp size={16} />,
      },
      {
        label: "Business Email Hosting",
        desc: "Email that uses your own domain",
        href: "/hosting/email",
        icon: <Mail size={16} />,
      },
      {
        label: "Domain Registration",
        desc: ".co.ke, .com and many more endings",
        href: "/hosting/domains",
        icon: <Globe size={16} />,
      },
      {
        label: "Domain Transfer",
        desc: "Move your domain to us with help",
        href: "/domain-transfer",
        icon: <ArrowLeftRight size={16} />,
      },
    ],
  },
  {
    label: "Marketing & Branding",
    href: "/services/marketing",
    children: [
      {
        label: "Brand Strategy & Positioning",
        desc: "Clear message, look, and story",
        href: "/services/brand-identity",
        icon: <Target size={16} />,
      },
      {
        label: "Social Media Marketing",
        desc: "Content and posts that bring people in",
        href: "/services/social-media",
        icon: <PenTool size={16} />,
      },
      {
        label: "SEO / AEO / GEO",
        desc: "Show up on Google, Maps, and AI answers",
        href: "/services/seo",
        icon: <BarChart2 size={16} />,
      },
      {
        label: "Paid Advertising",
        desc: "Google, Meta, and TikTok ads that sell",
        href: "/services/paid-ads",
        icon: <Megaphone size={16} />,
      },
      {
        label: "Email Marketing",
        desc: "Newsletters and follow-ups that convert",
        href: "/services/email-marketing",
        icon: <AtSign size={16} />,
      },
      {
        label: "Website Design",
        desc: "Sites built to win trust and sales",
        href: "/services/website-design",
        icon: <MonitorSmartphone size={16} />,
      },
      {
        label: "E-commerce Design",
        desc: "Online stores that make checkout easy",
        href: "/services/ecommerce",
        icon: <ShoppingCart size={16} />,
      },
      {
        label: "Custom software",
        desc: "Web apps, mobile apps and internal tools",
        href: "/services/software",
        icon: <Code2 size={16} />,
      },
    ],
  },
  {
    label: "Security",
    href: "/security",
    children: [
      {
        label: "Web Security",
        desc: "Malware scanning, firewall, and site cleanup",
        href: "/security",
        icon: <ShieldCheck size={16} />,
      },
      {
        label: "Email Security",
        desc: "Spam, phishing, and malware filtering for inbox",
        href: "/security/email",
        icon: <Shield size={16} />,
      },
      {
        label: "SSL Certificate",
        desc: "HTTPS padlock, encryption, and visitor trust",
        href: "/security/ssl",
        icon: <Lock size={16} />,
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Portfolio", href: "/work" },
  { label: "Help", href: DOCS_URL, external: true },
];

const displayNavItems: NavItem[] = [
  { ...navItems[0], label: "Products", href: "/products" },
  {
    label: "Solutions",
    href: "/solutions",
    children: [
      {
        label: "For startups",
        desc: "Launch your brand and business online",
        href: "/contact?solution=startup",
        icon: <Rocket size={18} />,
      },
      {
        label: "For growing businesses",
        desc: "Connect infrastructure and growth",
        href: "/contact?solution=growth",
        icon: <TrendingUp size={18} />,
      },
      {
        label: "For enterprises",
        desc: "Discuss a tailored service scope",
        href: "/contact?solution=enterprise",
        icon: <Building2 size={18} />,
      },
      {
        label: "For agencies",
        desc: "Support for your client projects",
        href: "/hosting/agency",
        icon: <Users size={18} />,
      },
      {
        label: "For developers",
        desc: "Resources for what you build",
        href: "/hosting/vps",
        icon: <Code2 size={18} />,
      },
    ],
  },
  { label: "Platform", href: "/platform" },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Resources",
    href: "/resources",
    children: [
      {
        label: "Insights & Guides",
        desc: "Ideas for running and growing your business",
        href: "/blog",
        icon: <BookOpen size={18} />,
      },
      {
        label: "Customer Work",
        desc: "Clients and what we deliver",
        href: "/work",
        icon: <Users size={18} />,
      },
      {
        label: "Support Centre",
        desc: "Find help for your services",
        href: "/help",
        icon: <LifeBuoy size={18} />,
      },
    ],
  },
];

function MegaDropdown({
  item,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  item: NavItem;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  if (!item.children) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="glass-surface-strong absolute left-1/2 top-full z-50 mt-1 w-[580px] -translate-x-1/2 overflow-hidden rounded-2xl"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="p-4 grid grid-cols-2 gap-1">
        {item.children.map((child) => (
          <Link
            key={child.href + child.label}
            to={child.href}
            onClick={onClose}
            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
          >
            <span className="mt-0.5 text-primary shrink-0">{child.icon}</span>
            <span>
              <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">
                {child.label}
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
                {child.desc}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Not sure? We'll help you choose.
        </span>
        <Button asChild size="sm" variant="ghost" className="text-xs h-7">
          <Link to="/contact" onClick={onClose}>
            Talk to us
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [mobileFamily, setMobileFamily] = useState<number | null>(0);
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const auth = useNavbarAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [atTop, setAtTop] = useState(true);
  const [inHero, setInHero] = useState(true);
  const hasDarkHero = location.pathname === "/" || location.pathname === "/careers";
  const overHero = hasDarkHero && inHero && !open && !activeDropdown;

  useEffect(() => {
    if (!hasDarkHero) return;
    const update = () => {
      setAtTop(window.scrollY < 24);
      const hero = document.getElementById("hero");
      setInHero(!hero || hero.getBoundingClientRect().bottom > 64);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [hasDarkHero]);

  useEffect(() => {
    setOpen(false);
    setActiveDropdown(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setActiveDropdown(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const openDropdown = (href: string) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setActiveDropdown(href);
  };

  const scheduleClose = () => {
    closeTimeout.current = setTimeout(() => setActiveDropdown(null), 240);
  };

  const cancelClose = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
  };

  const handleLogoClick = (event: MouseEvent) => {
    if (location.pathname === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCreateAccount = () => {
    window.location.assign(NPANEL_SIGNUP_URL);
  };
  const showCreateAccount = auth.status !== "signed-in";

  const handleNavItemClick = (item: NavItem) => {
    if (item.external) {
      window.location.assign(item.href);
      return;
    }
    if (item.children?.length) {
      cancelClose();
      setActiveDropdown(activeDropdown === item.href ? null : item.href);
      return;
    }
    navigate(item.href);
    setActiveDropdown(null);
  };

  const navFocus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <nav
      aria-label="Main navigation"
      ref={navRef}
      className={`nav-bar fixed left-0 right-0 top-0 z-50 border-x-0 border-t-0 ${overHero ? `nav-over-hero${atTop ? "" : " is-scrolled"}` : "glass-surface"}`}
    >
      {activeDropdown && !open && (
        <button
          aria-label="Close navigation"
          onClick={() => setActiveDropdown(null)}
          className="fixed inset-0 top-16 -z-10 hidden h-screen bg-foreground/10 xl:block"
        />
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-8">
        {/* Logo */}
        <Link
          to="/"
          aria-label="Nisc Cloud home"
          className={`flex items-center gap-2.5 shrink-0 rounded-lg transition-opacity hover:opacity-85 ${navFocus}`}
          onClick={handleLogoClick}
        >
          <img
            src="/nisccloud-logo.svg"
            alt="Nisc Cloud"
            className="nav-logo h-9 w-auto max-w-[180px] object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden xl:flex flex-1 items-center justify-center gap-1">
          {displayNavItems.map((item) => {
            const hasDropdown = !!item.children;
            const isCurrentPage =
              location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));
            return (
              <div
                key={item.href}
                className="relative"
                onMouseLeave={() => {
                  if (hasDropdown) scheduleClose();
                }}
              >
                {hasDropdown ? (
                  <button
                    type="button"
                    aria-expanded={activeDropdown === item.href}
                    onClick={() => handleNavItemClick(item)}
                    onMouseEnter={() => {
                      cancelClose();
                      openDropdown(item.href);
                    }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer font-normal ${navFocus} ${
                      activeDropdown === item.href
                        ? "text-primary bg-primary/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${activeDropdown === item.href ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <Link
                    to={item.href}
                    reloadDocument={item.external}
                    aria-current={isCurrentPage && !item.external ? "page" : undefined}
                    onClick={() => setActiveDropdown(null)}
                    onMouseEnter={() => {
                      cancelClose();
                      setActiveDropdown(null);
                    }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors font-normal ${navFocus} ${
                      isCurrentPage && !item.external
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {item.label}
                  </Link>
                )}
                {isCurrentPage && !hasDropdown && !item.external && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
                <AnimatePresence>
                  {activeDropdown === item.href &&
                    hasDropdown &&
                    (item.label === "Products" ? (
                      <ProductsMegaMenu
                        onMouseEnter={cancelClose}
                        onMouseLeave={scheduleClose}
                        onClose={() => setActiveDropdown(null)}
                      />
                    ) : (
                      <MegaDropdown
                        item={item}
                        onClose={() => setActiveDropdown(null)}
                        onMouseEnter={cancelClose}
                        onMouseLeave={scheduleClose}
                      />
                    ))}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-2 xl:flex">
            <NavbarAuthDesktop auth={auth} />
            {showCreateAccount && (
              <FlowButton
                text="Create account"
                size="sm"
                variant="filled"
                onClick={handleCreateAccount}
              />
            )}
          </div>
          <button
            type="button"
            aria-label={
              resolvedTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="rounded-lg p-2 text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
          >
            {resolvedTheme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            type="button"
            className={`cursor-pointer rounded-lg p-2 text-foreground xl:hidden ${navFocus}`}
            onClick={() => {
              setOpen(!open);
              setActiveDropdown(null);
            }}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-surface-strong overflow-hidden border-x-0 border-b-0 xl:hidden"
          >
            <div className="px-4 py-3 flex flex-col gap-1 h-[calc(100dvh-64px)] overflow-y-auto pb-10">
              {displayNavItems.map((item) => {
                const hasChildren = !!item.children?.length;
                return (
                  <div key={item.href}>
                    <button
                      aria-expanded={
                        hasChildren ? mobileExpanded === item.href : undefined
                      }
                      onClick={() => {
                        if (item.external) {
                          window.location.assign(item.href);
                          setOpen(false);
                          return;
                        }
                        if (hasChildren) {
                          setMobileExpanded(
                            mobileExpanded === item.href ? null : item.href,
                          );
                        } else {
                          navigate(item.href);
                          setOpen(false);
                        }
                      }}
                      type="button"
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer ${navFocus}`}
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
                          {item.label === "Products"
                            ? productFamilies.map((family, index) => {
                                const FamilyIcon = family.icon;
                                return (
                                  <div
                                    key={family.label}
                                    className="mb-2 rounded-xl border border-border"
                                  >
                                    <button
                                      type="button"
                                      aria-expanded={mobileFamily === index}
                                      onClick={() =>
                                        setMobileFamily(
                                          mobileFamily === index ? null : index,
                                        )
                                      }
                                      className={`flex w-full items-center gap-3 p-4 text-left text-sm font-semibold ${navFocus}`}
                                    >
                                      <FamilyIcon
                                        size={21}
                                        className="text-primary"
                                      />
                                      <span className="flex-1">
                                        {family.label}
                                      </span>
                                      <ChevronDown
                                        size={16}
                                        className={
                                          mobileFamily === index
                                            ? "rotate-180"
                                            : ""
                                        }
                                      />
                                    </button>
                                    {mobileFamily === index && (
                                      <div className="px-4 pb-3">
                                        {productSections(family).map((section) => (
                                          <div key={section.label || "links"}>
                                            {section.label ? (
                                              <p className="px-2 pt-2 text-xs font-semibold text-muted-foreground">
                                                {section.label}
                                              </p>
                                            ) : null}
                                            {section.items.map((service) => {
                                          const Icon = service.icon;
                                          return (
                                            <Link
                                              key={service.label}
                                              to={service.href}
                                              onClick={() => setOpen(false)}
                                              className={`flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm hover:bg-muted ${navFocus}`}
                                            >
                                              <Icon
                                                size={17}
                                                className="shrink-0 text-primary"
                                              />
                                              {service.label}
                                              {[
                                                "/hosting/hybrid-email",
                                                "/hosting/agency",
                                              ].includes(service.href) && (
                                                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                                  New
                                                </span>
                                              )}
                                            </Link>
                                          );
                                            })}
                                          </div>
                                        ))}
                                        <Link
                                          to={family.href}
                                          onClick={() => setOpen(false)}
                                          className={`mt-2 block w-full border-t border-border px-2 py-4 text-left text-sm font-semibold text-primary hover:opacity-80 ${navFocus}`}
                                        >
                                          View all {family.label}
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            : item.children.map((child) => (
                                <Link
                                  key={child.href + child.label}
                                  to={child.href}
                                  onClick={() => setOpen(false)}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:text-foreground hover:bg-muted/50 transition-colors text-left ${navFocus}`}
                                >
                                  <span className="text-primary shrink-0">
                                    {child.icon}
                                  </span>
                                  <span>
                                    <span className="block font-medium text-foreground">
                                      {child.label}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                      {child.desc}
                                    </span>
                                  </span>
                                </Link>
                              ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-border mt-1 flex flex-col gap-2">
                <NavbarAuthMobile
                  auth={auth}
                  onNavigate={() => setOpen(false)}
                />
                {showCreateAccount && (
                  <FlowButton
                    text="Create account"
                    size="sm"
                    variant="filled"
                    onClick={() => {
                      handleCreateAccount();
                      setOpen(false);
                    }}
                    className="w-full justify-center"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

import Navbar from "../../_components/Navbar.tsx";
import Footer from "../../_components/Footer.tsx";
import { useNavigate } from "react-router-dom";
import { Server, Zap, Cpu, Globe, Mail, Shield, ArrowRight, HardDrive, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
const categories = [
  { icon: <Server size={28} />, title: "Shared Hosting", desc: "Perfect for new websites. Fast, managed, and affordable.", price: "From KES 350/mo", href: "/hosting/shared" },
  { icon: <Zap size={28} />, title: "WordPress Hosting", desc: "Optimised WordPress with 1-click install and auto-updates.", price: "From KES 500/mo", href: "/hosting/wordpress" },
  { icon: <Cpu size={28} />, title: "VPS Servers", desc: "Dedicated resources, full root access, scalable power.", price: "From KES 2,000/mo", href: "/hosting/vps" },
  { icon: <HardDrive size={28} />, title: "VDS Hosting", desc: "Virtual dedicated servers with guaranteed isolated resources.", price: "Custom pricing", href: "/hosting/vds" },
  { icon: <TrendingUp size={28} />, title: "Dedicated Servers", desc: "100% bare metal hardware with IPMI access. Zero noisy neighbours.", price: "Custom pricing", href: "/hosting/dedicated-servers" },
  { icon: <Globe size={28} />, title: "Domain Registration", desc: "Clear naming for your brand. Search, buy, and go live quickly.", price: "Search to see price", href: "/hosting/domains" },
  { icon: <Mail size={28} />, title: "Business Email", desc: "Professional email at your domain with 10GB+ storage.", price: "From KES 250/mo", href: "/hosting/email" },
  { icon: <Shield size={28} />, title: "SSL Certificates", desc: "HTTPS security, browser trust, and a clear padlock for visitors.", price: "Free - KES 8,000/yr", href: "/hosting/ssl" },
];

export default function HostingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="pt-32 pb-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Cloud Hosting</span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Everything your website needs<br />to go live and stay fast</h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">Domains, hosting, email, and SSL, all managed in one place. Fast for your visitors, wherever they are, with 99.99% uptime and 24/7 support.</p>
        </motion.div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => navigate(cat.href)}
              className="group bg-card border border-border rounded-2xl p-6 text-left hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-primary mb-3">{cat.icon}</div>
              <h3 className="font-bold text-lg mb-1">{cat.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{cat.desc}</p>
              <span className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                {cat.price} <ArrowRight size={14} />
              </span>
            </motion.button>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}

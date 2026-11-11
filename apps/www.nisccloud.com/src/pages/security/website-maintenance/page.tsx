import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  CalendarCheck,
  CircleCheck,
  DatabaseBackup,
  FileText,
  Package,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import SecurityServiceLayout from "../_components/SecurityServiceLayout.tsx";

const careTasks = [
  { icon: DatabaseBackup, label: "Backup taken before changes" },
  { icon: RefreshCw, label: "WordPress core, plugins and themes updated" },
  { icon: Package, label: "Custom code dependencies patched" },
  { icon: ShieldCheck, label: "Security scan and login review" },
  { icon: Activity, label: "Forms, checkout and key pages tested" },
];

function MaintenanceChecklistVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="img"
      aria-label="A monthly website care checklist with backup, updates, security scan and page tests completed"
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <CalendarCheck size={16} className="text-primary" />
          Monthly website care
        </span>
        <span className="text-xs text-muted-foreground">yourbusiness.co.ke</span>
      </div>

      <ul className="space-y-1 p-3">
        {careTasks.map((task, index) => (
          <li key={task.label} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
            <task.icon size={16} className="shrink-0 text-muted-foreground" />
            <span className="flex-1">{task.label}</span>
            <motion.span
              initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.4 + index * 0.45, type: "spring", stiffness: 320, damping: 18 }}
            >
              <CircleCheck size={18} className="text-primary" />
            </motion.span>
          </li>
        ))}
      </ul>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.4 + careTasks.length * 0.45 }}
        className="flex items-start gap-3 border-t border-border bg-muted/40 px-5 py-4 text-sm"
      >
        <FileText size={18} className="mt-0.5 shrink-0 text-brand-orange" />
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">Report sent:</span> what changed this month, and one
          plugin we recommend replacing.
        </p>
      </motion.div>
    </div>
  );
}

export default function WebsiteMaintenancePage() {
  return (
    <SecurityServiceLayout
      pageTitle="Website Maintenance"
      badge="Website Maintenance"
      title={
        <>
          Your website, kept secure
          {" "}<br />
          <span className="text-primary">and working every month.</span>
        </>
      }
      description="Expert support and ongoing security for WordPress and custom-coded websites. We handle updates, backups, security checks and fixes, so your site keeps working for your customers."
      highlights={[
        "Updates applied carefully, with a backup first",
        "Security checks and fixes before small problems grow",
        "Help when something breaks",
        "A plain monthly report of what we did",
      ]}
      visual={<MaintenanceChecklistVisual />}
      contactHref="/contact?service=launch&message=I%20would%20like%20website%20maintenance.%20Site%20address%3A%20"
      ctaLabel="Discuss maintenance"
      stepsTitle="How website maintenance works"
      steps={[
        {
          title: "We review your site",
          desc: "We check how the site is built, what it runs on, what is out of date, and any problems you already know about.",
        },
        {
          title: "We agree a care plan",
          desc: "Together we agree what is covered, how often updates run, and how you reach us when something needs attention.",
        },
        {
          title: "We look after it",
          desc: "Updates, backups, security checks and fixes happen on schedule, and you receive a short report each month.",
        },
      ]}
      coverageTitle="What maintenance covers"
      coverageDescription="Most website problems start small: an old plugin, a skipped update, a form that quietly stopped sending. Maintenance catches them early."
      coverage={[
        {
          icon: RefreshCw,
          title: "Software updates",
          desc: "WordPress core, plugins, themes and code dependencies kept current, with a backup taken before changes.",
        },
        {
          icon: DatabaseBackup,
          title: "Backups",
          desc: "Regular copies of your files and database, so the site can be restored if something goes wrong.",
        },
        {
          icon: ShieldCheck,
          title: "Security checks",
          desc: "Scans for malware and known weaknesses, plus a review of admin users and login protection.",
        },
        {
          icon: Activity,
          title: "Site health",
          desc: "Key pages, forms and checkout tested so you hear about problems from us, not from customers.",
        },
        {
          icon: Wrench,
          title: "Fixes and small changes",
          desc: "Errors, broken layouts and small content updates handled by the team that knows your site.",
        },
        {
          icon: FileText,
          title: "Monthly report",
          desc: "What we updated, what we found, and anything we recommend you plan for.",
        },
      ]}
      platformsTitle="For WordPress and custom-coded websites"
      platforms={[
        {
          title: "WordPress",
          points: [
            "Core, plugin and theme updates",
            "Unused or abandoned plugins flagged",
            "Admin users and login protection reviewed",
            "Performance and database tidy-ups",
          ],
        },
        {
          title: "Custom code",
          points: [
            "Framework and package security updates",
            "Server, PHP or runtime version changes planned with you",
            "Bug fixes and small feature changes",
            "Your source code stays yours",
          ],
        },
      ]}
      faqTitle="Questions about website maintenance"
      faqs={[
        {
          question: "Why does my website need maintenance?",
          answer:
            "Websites depend on software that keeps changing. Skipped updates are one of the most common ways sites get hacked, and small errors can stop forms or checkout without anyone noticing.",
        },
        {
          question: "Do you maintain websites you did not build?",
          answer:
            "Yes. We start with a review so we understand how the site is built before we take it on.",
        },
        {
          question: "Will updates break my site?",
          answer:
            "Any update can cause a conflict. We take a backup first and test key pages afterwards, so we can roll back if something goes wrong.",
        },
        {
          question: "What if my site is hacked or broken right now?",
          answer:
            "Tell us when you get in touch. We can clean it first through Website Malware Removal, then keep it maintained.",
        },
      ]}
      closingTitle="Keep your website in good hands"
      closingDescription="Tell us about your site. We will review it and suggest a care plan that fits how it is built and how you use it."
    />
  );
}

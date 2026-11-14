import { MapPin } from "lucide-react";
import { COMPANY_ADDRESS, COMPANY_REGISTRATION, LEGAL_CONTACTS } from "./legal-contacts.ts";

/** Closing card for legal pages: one clear inbox per kind of question. */
export function LegalContactPanel({ title = "Questions about this document?" }: { title?: string }) {
  return (
    <section aria-labelledby="legal-contact-title" className="px-4 pb-16 sm:px-6 md:pb-24 lg:px-8 print:hidden">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#02070A] text-white shadow-[0_40px_80px_-50px_rgb(2_7_10_/_0.7)]">
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 border-b-[220px] border-l-[220px] border-b-[#38b6ff]/15 border-l-transparent md:border-b-[320px] md:border-l-[320px]"
          aria-hidden
        />
        <div className="relative grid gap-10 px-6 py-10 sm:px-10 md:py-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14 lg:px-14 lg:py-14">
          <div>
            <p className="type-label text-[#38b6ff]">Talk to a person</p>
            <h2 id="legal-contact-title" className="type-h2 mt-3 text-balance">{title}</h2>
            <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-white/75 md:text-lg">
              Pick the inbox that matches your question and the right team will pick it up. We aim to
              reply within 5 working days; technical support follows the response times in our SLA.
            </p>
            <p className="mt-6 flex items-start gap-2 text-sm text-white/60">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#38b6ff]" aria-hidden />
              <span>
                NISC CLOUD LIMITED · Reg. No. {COMPANY_REGISTRATION}
                <br />
                {COMPANY_ADDRESS}
              </span>
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {LEGAL_CONTACTS.map(({ email, label, use, icon: Icon }) => (
              <li key={email}>
                <a
                  href={`mailto:${email}`}
                  className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-colors hover:border-[#38b6ff]/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38b6ff]"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#38b6ff]/15 text-[#38b6ff]">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className="mt-4 text-sm font-semibold">{label}</span>
                  <span className="mt-1 text-sm leading-relaxed text-white/65">{use}</span>
                  <span className="mt-4 break-all text-sm font-semibold text-[#38b6ff] group-hover:underline">{email}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

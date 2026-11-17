import type { ReactNode } from "react";
import {
  Check,
  Globe,
  Inbox,
  KeyRound,
  LifeBuoy,
  Link2,
  Mail,
  MousePointerClick,
  Palette,
  PenLine,
  Send,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { ZepoMascot } from "@/components/zepo-mascot.tsx";
import { Meter, NpanelWindow, Panel, Pill, UiButton } from "../kit.tsx";
import { StoryScene, StoryShell } from "./story-shell.tsx";
import { StoryRows, StoryStat } from "./story-ui.tsx";

type StoryProps = { active?: boolean; compact?: boolean };

function Bubble({ from, children, className }: { from: "you" | "zepo" | "ai"; children: ReactNode; className?: string }) {
  const mine = from === "you";
  return (
    <div className={cn("flex items-end gap-1.5", mine ? "justify-end" : "justify-start", className)}>
      {from === "zepo" && (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12">
          <ZepoMascot className="size-4" />
        </span>
      )}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-2.5 py-1.5 text-[10px] leading-snug",
          mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function SampleNote({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[8px] text-muted-foreground">{children}</p>;
}

const ZEPO_CHAT_STEPS = ["Ask a question", "Zepo checks your account", "Get a clear answer", "Hand over to a person"] as const;

/** Zepo answering a service question from the account it can see. */
export function ZepoChatStory({ active = true, compact = false }: StoryProps) {
  return (
    <StoryShell title="Zepo chat" label="Zepo answering a service question inside nPanel, with sample data" steps={ZEPO_CHAT_STEPS} active={active} compact={compact}>
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="zeepo" active="zeepo" title="Zepo" subtitle="Savanna Bakery workspace">
              <div className="space-y-2">
                <Bubble from="zepo">Hi Amina. What would you like to sort out today?</Bubble>
                <Bubble from="you">We are opening a second shop. What do I need for a new website and five more email accounts?</Bubble>
              </div>
              <SampleNote>Sample conversation.</SampleNote>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="zeepo" active="zeepo" title="Zepo" subtitle="Checking what you already have">
              <Panel title="From your account" icon={Server}>
                <StoryRows active={2} rows={[
                  { label: "Website hosting", detail: "savannabakery.com, 1 of 3 websites used" },
                  { label: "Business email", detail: "4 of 5 mailboxes used" },
                  { label: "Domains", detail: "savannabakery.com renews in March" },
                ]} />
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="zeepo" active="zeepo" title="Zepo" subtitle="Answer">
              <div className="space-y-2">
                <Bubble from="you">What do I need for a new website and five more email accounts?</Bubble>
                <Bubble from="zepo">
                  Your hosting has room for two more websites, so the new site fits. Your email plan has one free mailbox; for five more, move up one email plan.
                </Bubble>
                <div className="flex justify-start gap-1.5 pl-7">
                  <UiButton>Compare email plans</UiButton>
                  <UiButton variant="outline">Add a domain</UiButton>
                </div>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="support/tickets" active="support" title="Support ticket" subtitle="Opened from your Zepo chat" action={<Pill tone="sky">With our team</Pill>}>
              <Panel title="Move my existing shop emails" icon={LifeBuoy}>
                <StoryRows rows={[
                  { label: "Conversation attached", detail: "Our team sees what you already told Zepo" },
                  { label: "Service linked", detail: "Business email, savannabakery.com" },
                ]} />
              </Panel>
              <SampleNote>When a request needs a person, the ticket carries the chat with it.</SampleNote>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}

const ZEPO_INBOX_STEPS = ["A new email arrives", "Zepo summarises it", "Zepo drafts the reply", "You review and send"] as const;

/** Zepo reading, summarising and drafting a reply for a Nisc Mail inbox in nPanel. */
export function ZepoInboxStory({ active = true, compact = false }: StoryProps) {
  return (
    <StoryShell title="Zepo email" label="Zepo reading, summarising and drafting a reply in an nPanel inbox, with sample data" steps={ZEPO_INBOX_STEPS} active={active} compact={compact}>
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="emails" active="email" title="Inbox" subtitle="hello@savannabakery.com">
              <Panel className="p-0">
                <StoryRows active={0} rows={[
                  { label: "Kito Events: Quote for 300 cupcakes", detail: "Hi, we have a wedding on the 14th and need…", status: <Pill tone="sky">New</Pill> },
                  { label: "Supplier: Flour delivery moved", detail: "Your Thursday delivery will now arrive…" },
                  { label: "Nisc Cloud: Invoice paid", detail: "Thank you. Your payment was received." },
                ]} />
              </Panel>
              <SampleNote>Sample inbox.</SampleNote>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="emails/kito-events" active="email" title="Quote for 300 cupcakes" subtitle="From Kito Events">
              <Panel title="Zepo summary" icon={Inbox}>
                <ul className="space-y-1 text-[10px] text-foreground">
                  <li className="flex gap-1.5"><Check className="mt-0.5 size-3 shrink-0 text-primary" />Wedding on the 14th, 300 cupcakes</li>
                  <li className="flex gap-1.5"><Check className="mt-0.5 size-3 shrink-0 text-primary" />Wants vanilla and red velvet</li>
                  <li className="flex gap-1.5"><Check className="mt-0.5 size-3 shrink-0 text-primary" />Asks for a price by Friday</li>
                </ul>
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="emails/kito-events/reply" active="email" title="Reply" subtitle="Drafted by Zepo">
              <Panel title="Draft" icon={PenLine}>
                <p className="text-[10px] leading-relaxed text-foreground">
                  Hi Kito Events, thank you for thinking of us. We can make 300 vanilla and red velvet cupcakes for the 14th. Our quote is attached; it holds until Friday…
                </p>
              </Panel>
              <div className="mt-2 flex gap-1.5">
                <UiButton variant="outline">Make it shorter</UiButton>
                <UiButton variant="outline">More formal</UiButton>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="emails/kito-events/reply" active="email" title="Reply" subtitle="Ready to send" action={<Pill tone="green">Sent</Pill>}>
              <Panel title="Sent from hello@savannabakery.com" icon={Send}>
                <StoryRows active={1} rows={[
                  { label: "You checked the draft", detail: "Edited the price line" },
                  { label: "Reply sent", detail: "From your own business address" },
                ]} />
              </Panel>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}

const MCP_STEPS = ["Create a connection in nPanel", "Add it to your AI assistant", "Ask for what you need", "It works in your mailbox"] as const;

/** Connecting a Nisc-hosted mailbox to an outside AI assistant through the mail MCP. */
export function MailMcpStory({ active = true, compact = false }: StoryProps) {
  return (
    <StoryShell title="Email MCP" label="Connecting a Nisc Cloud mailbox to ChatGPT or Claude through the email MCP, with sample data" steps={MCP_STEPS} active={active} compact={compact} tone="sky">
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="email/mcp" active="email" title="Email MCP" subtitle="Connect a mailbox to your own AI">
              <Panel title="hello@savannabakery.com" icon={Mail}>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-[9px] text-muted-foreground"><Link2 className="size-3 text-primary" />mcp link for this mailbox</div>
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-[9px] text-muted-foreground"><KeyRound className="size-3 text-primary" />access token ••••••••</div>
                </div>
                <div className="mt-2 flex gap-1.5"><UiButton>Copy link</UiButton><UiButton variant="outline">Rotate token</UiButton></div>
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <div className="grid gap-2 sm:grid-cols-2">
              {["ChatGPT", "Claude"].map((name, i) => (
                <Panel key={name} className={cn(i === 1 && "border-primary ring-2 ring-primary/15")} title={name} hint="Add a connector">
                  <div className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[9px] text-muted-foreground">paste the mcp link</div>
                  <div className="mt-2"><Pill tone={i === 1 ? "green" : "slate"}>{i === 1 ? "Connected" : "Ready to connect"}</Pill></div>
                </Panel>
              ))}
            </div>
          </StoryScene>
          <StoryScene show={step === 2}>
            <Panel title="Your AI assistant" hint="Sample conversation" className="bg-card/95">
              <div className="space-y-2">
                <Bubble from="you">Find the email from Kito Events about cupcakes and draft a reply with our price.</Bubble>
                <Bubble from="ai">I found it in hello@savannabakery.com. Here is a draft. Should I send it?</Bubble>
                <Bubble from="you">Yes, send it.</Bubble>
              </div>
            </Panel>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="emails/sent" active="email" title="Sent" subtitle="hello@savannabakery.com">
              <Panel className="p-0">
                <StoryRows active={0} rows={[
                  { label: "Re: Quote for 300 cupcakes", detail: "Sent through your AI assistant", status: <Pill tone="green">Sent</Pill> },
                  { label: "Re: Flour delivery moved", detail: "Draft saved for you to check" },
                ]} />
              </Panel>
              <SampleNote>Messages are read and sent through your Nisc Cloud mailbox.</SampleNote>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}

const OUTREACH_STEPS = ["Describe the campaign", "AI designs it from your brand", "Approve and send", "Track the results"] as const;

/** Nisc Outreach: from a short brief to an AI-built campaign and its report. */
export function OutreachStory({ active = true, compact = false }: StoryProps) {
  return (
    <StoryShell title="Nisc Outreach" label="Nisc Outreach building, sending and reporting on an email campaign in nPanel, with sample data" steps={OUTREACH_STEPS} active={active} compact={compact}>
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="nisc-email-builder/new" active="marketing" title="New campaign" subtitle="Tell the AI what this email is for">
              <Panel title="Brief" icon={PenLine}>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px]">
                  {[
                    ["Goal", "Launch our weekend cake box"],
                    ["Audience", "Customers from the last 6 months"],
                    ["Tone", "Warm and short"],
                    ["Website", "savannabakery.com"],
                  ].map(([k, v]) => (
                    <div key={k} className="min-w-0"><dt className="uppercase tracking-wide text-muted-foreground">{k}</dt><dd className="truncate font-medium text-foreground">{v}</dd></div>
                  ))}
                </dl>
                <div className="mt-2 text-right"><UiButton>Design my email</UiButton></div>
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="nisc-email-builder/weekend-box" active="marketing" title="Design" subtitle="Brand colours and logo read from your website">
              <div className="grid gap-2 sm:grid-cols-[.8fr_1.2fr]">
                <Panel title="Your brand" icon={Palette}>
                  <div className="flex gap-1.5">{["#7a3e1d", "#f6c453", "#fff6ea"].map((c) => <span key={c} className="size-5 rounded-md ring-1 ring-border" style={{ background: c }} />)}</div>
                  <p className="mt-2 text-[9px] text-muted-foreground">Logo, colours and fonts</p>
                </Panel>
                <div className="overflow-hidden rounded-xl border border-border bg-[#fff6ea]">
                  <div className="bg-[#7a3e1d] px-3 py-2 text-[10px] font-bold tracking-wide text-[#fff6ea]">SAVANNA BAKERY</div>
                  <div className="space-y-1.5 p-3"><p className="text-[11px] font-bold text-[#7a3e1d]">The weekend cake box is here</p><div className="h-1.5 w-full rounded bg-[#7a3e1d]/15" /><div className="h-1.5 w-4/5 rounded bg-[#7a3e1d]/15" /><span className="inline-flex rounded-md bg-[#f6c453] px-2 py-1 text-[9px] font-semibold text-[#3b1d0c]">Order a box</span></div>
                </div>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="nisc-email-marketing/campaigns/weekend-box" active="marketing" title="Send" subtitle="Approve before it goes out">
              <Panel title="Before sending" icon={Send}>
                <StoryRows active={2} rows={[
                  { label: "Design approved", detail: "One change asked in chat" },
                  { label: "Audience", detail: "Customers from the last 6 months" },
                  { label: "Sending domain", detail: "savannabakery.com verified" },
                ]} />
              </Panel>
              <div className="mt-2 text-right"><UiButton>Send campaign</UiButton></div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="nisc-email-marketing/campaigns/weekend-box" active="marketing" title="Report" subtitle="Updates as people open and click" action={<Pill tone="green">Sent</Pill>}>
              <div className="grid grid-cols-3 gap-2">
                <StoryStat label="Delivered" value="1,214" detail="Sample" />
                <StoryStat label="Opened" value="538" detail="Sample" />
                <StoryStat label="Clicked" value="97" detail="Sample" />
              </div>
              <Panel className="mt-2" title="Top clicked link" icon={MousePointerClick}>
                <Meter label="Order a box" value={72} detail="Sample" />
              </Panel>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}

const BUILDER_STEPS = ["Describe your business", "AI builds the first version", "Change what you want", "Connect your domain and publish"] as const;

/** Planned AI website builder flow; shown as a preview, not a live product. */
export function WebsiteBuilderStory({ active = true, compact = false }: StoryProps) {
  return (
    <StoryShell title="AI website builder" label="Preview of the planned AI website builder in nPanel, with sample data" steps={BUILDER_STEPS} active={active} compact={compact}>
      {({ step }) => (
        <div className="grid min-h-[292px]">
          <StoryScene show={step === 0}>
            <NpanelWindow path="website-builder/new" active="hosting" title="New website" subtitle="Preview of a planned feature" action={<Pill tone="amber">Coming soon</Pill>}>
              <Panel title="Tell us about your business" icon={PenLine}>
                <p className="rounded-lg border border-border bg-background p-2 text-[10px] leading-relaxed text-foreground">
                  We are a family bakery in Nairobi. We sell cakes, bread and weekend cake boxes, and take orders for events.
                </p>
                <div className="mt-2 text-right"><UiButton>Build my website</UiButton></div>
              </Panel>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 1}>
            <NpanelWindow path="website-builder/savanna-bakery" active="hosting" title="First version" subtitle="Pages, text and layout from your description">
              <div className="overflow-hidden rounded-xl border border-border bg-background">
                <div className="flex items-center justify-between bg-[#7a3e1d] px-3 py-2 text-[10px] font-bold text-[#fff6ea]"><span>SAVANNA BAKERY</span><span className="flex gap-2 font-medium opacity-80"><span>Cakes</span><span>Events</span><span>Contact</span></span></div>
                <div className="grid gap-2 p-3 sm:grid-cols-[1.2fr_.8fr]">
                  <div className="space-y-1.5"><p className="text-[12px] font-bold text-foreground">Baked fresh in Nairobi</p><div className="h-1.5 w-full rounded bg-muted" /><div className="h-1.5 w-3/4 rounded bg-muted" /><UiButton>Order for an event</UiButton></div>
                  <div className="h-16 rounded-lg bg-[linear-gradient(135deg,#f6c453,#7a3e1d)]" />
                </div>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 2}>
            <NpanelWindow path="website-builder/savanna-bakery" active="hosting" title="Edit" subtitle="Ask for changes or edit directly">
              <div className="space-y-2">
                <Bubble from="you">Add a menu page with prices and make the colours warmer.</Bubble>
                <Bubble from="ai">Done. I added a Menu page and warmed the colours. Have a look.</Bubble>
              </div>
            </NpanelWindow>
          </StoryScene>
          <StoryScene show={step === 3}>
            <NpanelWindow path="website-builder/savanna-bakery/publish" active="hosting" title="Publish" subtitle="On Nisc Cloud hosting">
              <Panel title="Go live" icon={Globe}>
                <StoryRows active={2} rows={[
                  { label: "Domain", detail: "savannabakery.com connected" },
                  { label: "Hosting", detail: "Nisc Cloud website hosting" },
                  { label: "SSL", detail: "Secure padlock on" },
                ]} />
              </Panel>
              <div className="mt-2 text-right"><UiButton>Publish website</UiButton></div>
            </NpanelWindow>
          </StoryScene>
        </div>
      )}
    </StoryShell>
  );
}
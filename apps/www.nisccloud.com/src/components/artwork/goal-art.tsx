import { useId, type ReactNode } from "react";
import { Check, DatabaseBackup, Globe, Lock, Mail, Megaphone, MessageCircle, Search } from "lucide-react";

import { cn } from "@/lib/utils.ts";
import { useArtLive } from "./use-art-live.ts";

const INK = "#02070A";
const SKY = "#38b6ff";
const ORANGE = "#fc734d";
const MUTED = "#64748b";

/** Tinted stage for the homepage goal compositions. Motion classes run only while `.art-live`. */
function GoalStage({ label, warm = false, children }: { label: string; warm?: boolean; children: ReactNode }) {
  const { ref, live } = useArtLive<HTMLElement>();
  return (
    <figure
      ref={ref}
      role="img"
      aria-label={label}
      className={cn(
        "relative mx-auto w-full max-w-[600px] overflow-hidden rounded-[28px] bg-gradient-to-br",
        warm
          ? "from-[#fc734d]/25 via-[#38b6ff]/15 to-[#38b6ff]/30 dark:from-[#fc734d]/15 dark:via-[#38b6ff]/5 dark:to-[#38b6ff]/10"
          : "from-[#38b6ff]/45 via-[#38b6ff]/20 to-[#fc734d]/15 dark:from-[#38b6ff]/20 dark:via-[#38b6ff]/5 dark:to-[#fc734d]/10",
        live && "art-live",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgb(14 87 118 / 0.18) 1px, transparent 0)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, black, transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]"
        style={{ background: "linear-gradient(135deg, rgb(56 182 255 / 0.55), transparent 40%, transparent 65%, rgb(252 115 77 / 0.45))" }}
      />
      <div className="relative" aria-hidden>
        {children}
      </div>
    </figure>
  );
}

function Canvas({ children }: { children: (shadow: string) => ReactNode }) {
  const id = useId().replace(/:/g, "");
  const shadow = `goal-shadow-${id}`;
  return (
    <svg viewBox="0 0 560 400" className="block h-auto w-full" style={{ fontFamily: "inherit" }}>
      <defs>
        <filter id={shadow} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor={INK} floodOpacity="0.2" />
        </filter>
      </defs>
      {children(`url(#${shadow})`)}
    </svg>
  );
}

function Chip({ x, y, w, children, dot = "#22c55e" }: { x: number; y: number; w: number; children: string; dot?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={30} rx={15} fill={INK} />
      <circle cx={x + 16} cy={y + 15} r={4} fill={dot} />
      <text x={x + 27} y={y + 19.5} fontSize={11} fontWeight={600} fill="#fff">
        {children}
      </text>
    </g>
  );
}

function Token({
  x,
  y,
  icon: Icon,
  color,
  label,
  filter,
  labelBelow = true,
}: {
  x: number;
  y: number;
  icon: typeof Globe;
  color: string;
  label: string;
  filter: string;
  labelBelow?: boolean;
}) {
  const w = label.length * 6.4 + 20;
  const ly = labelBelow ? y + 38 : y - 60;
  return (
    <g>
      <circle cx={x} cy={y} r={28} fill="#fff" filter={filter} />
      <Icon x={x - 12} y={y - 12} size={24} color={color} strokeWidth={2.2} />
      <rect x={x - w / 2} y={ly} width={w} height={22} rx={11} fill="#fff" fillOpacity={0.92} />
      <text x={x} y={ly + 15} fontSize={10.5} fontWeight={600} fill={INK} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/** Build: a fictional coffee brand taking shape on an artboard, then applied to a phone store. */
export function BuildGoalArt() {
  return (
    <GoalStage warm label="Illustration: a brand taking shape on a design artboard, with its colours and type, then applied to an online store on a phone">
      <Canvas>
        {(shadow) => (
          <>
            <g transform="rotate(-4 200 210)">
              <rect x={64} y={70} width={268} height={268} rx={24} fill="#fff" filter={shadow} />
              <text x={88} y={100} fontSize={11} fill={MUTED}>
                Kilele Coffee · Brand
              </text>
              <circle cx={198} cy={196} r={64} fill={ORANGE} />
              <g transform="rotate(28 198 196)">
                <ellipse cx={198} cy={196} rx={23} ry={34} fill={INK} />
                <path d="M198 164 C 186 184, 210 206, 198 228" stroke={ORANGE} strokeWidth={5} fill="none" strokeLinecap="round" />
              </g>
              <text x={198} y={298} fontSize={21} fontWeight={700} letterSpacing={5} fill={INK} textAnchor="middle">
                KILELE
              </text>
              <rect x={150} y={308} width={96} height={4} rx={2} fill="#e2e8f0" />
            </g>

            <g className="ga-draw-wrap">
              <path
                className="ga-draw"
                pathLength={1}
                d="M44 362 C 130 300, 230 392, 344 318"
                stroke={SKY}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
              <line x1={130} y1={300} x2={44} y2={362} stroke={SKY} strokeWidth={1.2} strokeOpacity={0.6} />
              <line x1={230} y1={392} x2={344} y2={318} stroke={SKY} strokeWidth={1.2} strokeOpacity={0.6} />
              <rect x={38} y={356} width={12} height={12} rx={2} fill="#fff" stroke={SKY} strokeWidth={2} />
              <rect x={338} y={312} width={12} height={12} rx={2} fill="#fff" stroke={SKY} strokeWidth={2} />
              <circle className="ga-pulse" cx={130} cy={300} r={5} fill={SKY} />
              <circle cx={230} cy={392} r={5} fill={SKY} />
            </g>

            <Chip x={226} y={40} w={124}>
              Logo approved
            </Chip>

            <g className="ga-float">
              <rect x={364} y={52} width={166} height={72} rx={36} fill="#fff" filter={shadow} />
              <circle cx={402} cy={88} r={24} fill={ORANGE} stroke="#fff" strokeWidth={4} />
              <circle cx={446} cy={88} r={24} fill={SKY} stroke="#fff" strokeWidth={4} />
              <circle cx={490} cy={88} r={24} fill={INK} stroke="#fff" strokeWidth={4} />
            </g>

            <g transform="rotate(5 430 180)">
              <rect x={370} y={142} width={132} height={78} rx={16} fill="#fff" filter={shadow} />
              <text x={388} y={190} fontSize={36} fontWeight={700} fill={INK}>
                Aa
              </text>
              <text x={388} y={207} fontSize={9.5} fill={MUTED}>
                Headline type
              </text>
              <rect x={446} y={168} width={40} height={5} rx={2.5} fill="#e2e8f0" />
              <rect x={446} y={180} width={28} height={5} rx={2.5} fill="#e2e8f0" />
            </g>

            <g className="ga-float-late">
              <rect x={404} y={236} width={124} height={164} rx={22} fill={INK} filter={shadow} />
              <rect x={412} y={246} width={108} height={160} rx={15} fill="#fff" />
              <path d="M412 261 a15 15 0 0 1 15 -15 h78 a15 15 0 0 1 15 15 v19 h-108 z" fill={ORANGE} />
              <ellipse cx={428} cy={264} rx={5} ry={7} fill={INK} transform="rotate(28 428 264)" />
              <rect x={440} y={261} width={40} height={5} rx={2.5} fill="#fff" fillOpacity={0.85} />
              <rect x={420} y={290} width={92} height={52} rx={10} fill="#fde6dc" />
              <ellipse cx={466} cy={316} rx={11} ry={15} fill={INK} transform="rotate(28 466 316)" />
              <rect x={420} y={350} width={60} height={5} rx={2.5} fill="#cbd5e1" />
              <rect x={420} y={362} width={92} height={22} rx={11} fill={INK} />
              <text x={466} y={377} fontSize={10} fontWeight={600} fill="#fff" textAnchor="middle">
                Order now
              </text>
            </g>
          </>
        )}
      </Canvas>
    </GoalStage>
  );
}

const CLOUD_PATH =
  "M196 182 a40 40 0 0 1 8 -79 a56 56 0 0 1 104 -18 a44 44 0 0 1 64 38 a36 36 0 0 1 -6 59 z";

/** Run: a cloud over a healthy server stack, connected to domain, email, SSL and backups. */
export function RunGoalArt() {
  const gradientId = `run-cloud-${useId().replace(/:/g, "")}`;
  return (
    <GoalStage label="Illustration: a cloud above a server stack, connected to a domain, business email, an SSL certificate and backups, with every service running">
      <Canvas>
        {(shadow) => (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#a5e1ff" />
                <stop offset="1" stopColor={SKY} />
              </linearGradient>
            </defs>

            <g stroke={SKY} strokeWidth={2} fill="none" strokeLinecap="round" strokeOpacity={0.75}>
              <path className="ga-flow" d="M118 112 C 170 112, 180 150, 206 160" strokeDasharray="5 7" />
              <path className="ga-flow" d="M110 282 C 160 282, 170 270, 196 268" strokeDasharray="5 7" />
              <path className="ga-flow" d="M442 112 C 400 112, 392 140, 366 150" strokeDasharray="5 7" />
              <path className="ga-flow" d="M450 282 C 400 282, 390 270, 366 268" strokeDasharray="5 7" />
              <path className="ga-flow" d="M252 196 V 228" strokeDasharray="4 6" />
              <path className="ga-flow" d="M310 196 V 228" strokeDasharray="4 6" />
            </g>

            <ellipse cx={281} cy={366} rx={110} ry={12} fill={INK} fillOpacity={0.12} />
            {[230, 274, 318].map((y, i) => (
              <g key={y} filter={i === 0 ? shadow : undefined}>
                <rect x={190} y={y} width={182} height={38} rx={11} fill="#0f2230" stroke={SKY} strokeOpacity={0.45} />
                <rect x={190} y={y} width={182} height={4} rx={2} fill="#ffffff" fillOpacity={0.12} />
                {[0, 1, 2, 3].map((v) => (
                  <rect key={v} x={206 + v * 10} y={y + 13} width={4} height={13} rx={2} fill="#ffffff" fillOpacity={0.18} />
                ))}
                <text x={262} y={y + 23} fontSize={10} fill="#94a3b8" fontFamily="ui-monospace, monospace">
                  {["web-01", "mail-01", "db-01"][i]}
                </text>
                <circle className="ga-blink" style={{ animationDelay: `${i * -0.7}s` }} cx={338} cy={y + 19} r={4} fill="#22c55e" />
                <circle cx={354} cy={y + 19} r={4} fill={SKY} />
              </g>
            ))}

            <g className="ga-float">
              <path d={CLOUD_PATH} fill={`url(#${gradientId})`} filter={shadow} />
              <rect x={214} y={128} width={134} height={30} rx={15} fill="#fff" />
              <circle className="ga-blink" cx={230} cy={143} r={4} fill="#22c55e" />
              <text x={241} y={147} fontSize={10.5} fontWeight={600} fill={INK}>
                All services running
              </text>
            </g>

            <Token x={90} y={112} icon={Globe} color={SKY} label="Domain" filter={shadow} />
            <Token x={82} y={282} icon={Mail} color={ORANGE} label="Business email" filter={shadow} />
            <Token x={470} y={112} icon={Lock} color="#16a34a" label="SSL" filter={shadow} />
            <Token x={478} y={282} icon={DatabaseBackup} color={INK} label="Backups" filter={shadow} />
          </>
        )}
      </Canvas>
    </GoalStage>
  );
}

const GROW_PATH = "M44 352 C 170 352, 200 250, 290 222 S 430 120, 500 70";

/** Grow: a rising path through search, social, ads and email to the customer's goal. */
export function GrowGoalArt() {
  const gradientId = `grow-path-${useId().replace(/:/g, "")}`;
  return (
    <GoalStage warm label="Illustration: a rising path that passes search, social media, paid ads and email on the way to a business goal">
      <Canvas>
        {(shadow) => (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor={ORANGE} />
                <stop offset="1" stopColor={SKY} />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4, 5].map((i) => {
              const h = 40 + i * 34;
              return <rect key={i} x={70 + i * 76} y={380 - h} width={44} height={h} rx={10} fill={SKY} fillOpacity={0.12} />;
            })}

            <path d={GROW_PATH} stroke={`url(#${gradientId})`} strokeWidth={16} fill="none" strokeLinecap="round" />
            <path className="ga-flow" d={GROW_PATH} stroke="#fff" strokeOpacity={0.85} strokeWidth={2.5} fill="none" strokeDasharray="2 12" strokeLinecap="round" />

            <Token x={128} y={344} icon={Search} color={SKY} label="Search" filter={shadow} labelBelow={false} />
            <Token x={240} y={250} icon={MessageCircle} color={ORANGE} label="Social" filter={shadow} labelBelow={false} />
            <Token x={352} y={186} icon={Megaphone} color={INK} label="Paid ads" filter={shadow} />
            <Token x={440} y={112} icon={Mail} color={SKY} label="Email" filter={shadow} />

            <g>
              <circle className="ga-pulse" cx={506} cy={66} r={22} fill={ORANGE} fillOpacity={0.25} />
              <line x1={500} y1={70} x2={500} y2={22} stroke={INK} strokeWidth={3} strokeLinecap="round" />
              <path d="M501 22 L 532 32 L 501 42 Z" fill={ORANGE} />
              <circle cx={500} cy={70} r={6} fill={INK} />
            </g>

            <Chip x={36} y={36} w={124} dot={ORANGE}>
              Campaign live
            </Chip>

            <g className="ga-float">
              <rect x={354} y={262} width={170} height={58} rx={16} fill="#fff" filter={shadow} />
              <circle cx={380} cy={291} r={13} fill="#dcfce7" />
              <Check x={373} y={284} size={14} color="#16a34a" strokeWidth={3} />
              <text x={402} y={287} fontSize={11} fontWeight={600} fill={INK}>
                New enquiry
              </text>
              <text x={402} y={303} fontSize={9.5} fill={MUTED}>
                Savanna Bakery
              </text>
            </g>
          </>
        )}
      </Canvas>
    </GoalStage>
  );
}

/** Zepo AI: the mascot answers a customer, drafts a reply and hands it to the team for review. */
export function ZepoGoalArt() {
  const glowId = `zepo-glow-${useId().replace(/:/g, "")}`;
  const steps = ["Question", "Draft reply", "Team review"];
  return (
    <GoalStage label="Illustration: the Zepo AI mascot answering a customer question about a domain renewal, drafting a reply and passing it to the team for review">
      <Canvas>
        {(shadow) => (
          <>
            <defs>
              <radialGradient id={glowId}>
                <stop offset="0" stopColor={SKY} stopOpacity={0.55} />
                <stop offset="1" stopColor={SKY} stopOpacity={0} />
              </radialGradient>
            </defs>

            <circle cx={280} cy={190} r={130} fill={`url(#${glowId})`} />
            <g className="ga-float">
              <image href="/brand/zepo-mascot.webp" x={200} y={104} width={160} height={160} />
            </g>

            <g>
              <path d="M40 54 h196 a16 16 0 0 1 16 16 v28 a16 16 0 0 1 -16 16 h-150 l-16 14 v-14 h-30 a16 16 0 0 1 -16 -16 v-28 a16 16 0 0 1 16 -16 z" fill="#fff" filter={shadow} transform="translate(-16 0)" />
              <text x={42} y={78} fontSize={9.5} fill={MUTED}>
                Customer
              </text>
              <text x={42} y={96} fontSize={12} fontWeight={600} fill={INK}>
                Is my domain renewing soon?
              </text>
            </g>

            <g>
              <path d="M356 122 h180 a16 16 0 0 1 16 16 v28 a16 16 0 0 1 -16 16 h-30 v14 l-16 -14 h-134 a16 16 0 0 1 -16 -16 v-28 a16 16 0 0 1 16 -16 z" fill={SKY} filter={shadow} />
              <text x={358} y={146} fontSize={9.5} fill={INK} fillOpacity={0.7}>
                Zepo · draft
              </text>
              <text x={358} y={164} fontSize={12} fontWeight={600} fill={INK}>
                Yes. I'll send a reminder.
              </text>
            </g>

            <g className="ga-typing">
              <rect x={70} y={214} width={74} height={34} rx={17} fill="#fff" filter={shadow} />
              {[92, 107, 122].map((cx) => (
                <circle key={cx} cx={cx} cy={231} r={4} fill={MUTED} />
              ))}
            </g>

            <g>
              <path className="ga-flow" d="M150 334 H 410" stroke={SKY} strokeWidth={2} strokeDasharray="4 6" fill="none" />
              {steps.map((label, i) => {
                const cx = 150 + i * 130;
                const done = i === steps.length - 1;
                return (
                  <g key={label}>
                    <rect x={cx - 56} y={314} width={112} height={40} rx={20} fill={done ? INK : "#fff"} filter={shadow} />
                    {done ? (
                      <>
                        <circle cx={cx - 34} cy={334} r={9} fill="#22c55e" />
                        <Check x={cx - 40} y={328} size={12} color="#fff" strokeWidth={3.2} />
                      </>
                    ) : (
                      <circle className={i === 1 ? "ga-blink" : undefined} cx={cx - 34} cy={334} r={5} fill={i === 0 ? ORANGE : SKY} />
                    )}
                    <text x={cx - 18} y={338} fontSize={11} fontWeight={600} fill={done ? "#fff" : INK}>
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          </>
        )}
      </Canvas>
    </GoalStage>
  );
}

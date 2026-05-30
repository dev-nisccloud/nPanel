/**
 * Zeepo document → PDF renderer.
 * Parses markdown into react-pdf primitives so "Download PDF" produces a
 * real, styled PDF file (not a browser print dialog).
 *
 * Usage:
 *   const blob = await pdf(<ZeepoDocumentPdf title={t} content={md} />).toBlob();
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// Logo from the public folder - resolved at fetch time by the PDF renderer in the browser.
const NISC_LOGO_URL = "/nisclogooriginal.png";

// ─── Colours ────────────────────────────────────────────────────────────────

const C = {
  dark: "#111827",
  body: "#374151",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f9fafb",
  purple: "#6366f1",
  purpleBg: "#f5f3ff",
  codeBg: "#f3f4f6",
  white: "#ffffff",
} as const;

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 52,
    paddingBottom: 60,
    paddingHorizontal: 52,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.6,
    color: C.dark,
    backgroundColor: C.white,
  },
  // ── Document title block ──
  titleBlock: { marginBottom: 22, paddingBottom: 16, borderBottom: `1.5pt solid ${C.border}` },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  titleLeft: { flex: 1, paddingRight: 20 },
  titleText: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 12 },
  titleMeta: { fontSize: 8.5, color: C.muted, lineHeight: 1.5 },
  // Logo - transparent, 180×60 ratio scaled to fit header
  logoImg: { width: 135, height: 45 },
  // ── Headings ──
  h1: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.dark, marginTop: 20, marginBottom: 6, paddingBottom: 5, borderBottom: `1pt solid ${C.border}` },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.dark, marginTop: 16, marginBottom: 5 },
  h3: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.dark, marginTop: 12, marginBottom: 4 },
  h4: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#4b5563", marginTop: 9, marginBottom: 3 },
  h5: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.muted, marginTop: 7, marginBottom: 2 },
  h6: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.muted, marginTop: 6, marginBottom: 2 },
  // ── Paragraph ──
  p: { fontSize: 10, lineHeight: 1.65, color: C.body, marginBottom: 7 },
  // ── Lists ──
  listItem: { flexDirection: "row", marginBottom: 3, paddingLeft: 6 },
  bullet: { width: 12, fontSize: 10, color: C.body },
  itemText: { flex: 1, fontSize: 10, lineHeight: 1.6, color: C.body },
  // ── Code block ──
  codeBlock: {
    backgroundColor: C.codeBg,
    borderRadius: 4,
    padding: 9,
    marginVertical: 8,
    fontFamily: "Courier",
    fontSize: 8.5,
    color: C.dark,
    lineHeight: 1.5,
  },
  // ── Blockquote ──
  bqWrap: {
    borderLeft: `3pt solid ${C.purple}`,
    backgroundColor: C.purpleBg,
    paddingLeft: 10,
    paddingVertical: 5,
    paddingRight: 8,
    marginVertical: 7,
    borderRadius: 2,
  },
  bqText: { fontSize: 10, fontFamily: "Helvetica-Oblique", color: "#4b5563", lineHeight: 1.6 },
  // ── HR ──
  hr: { borderTop: `0.75pt solid ${C.border}`, marginVertical: 14 },
  // ── Table ──
  tableWrap: { marginVertical: 10, borderRadius: 3, overflow: "hidden", border: `0.5pt solid ${C.border}` },
  tableHeaderRow: { flexDirection: "row", backgroundColor: C.bg },
  tableRow: { flexDirection: "row", borderTop: `0.5pt solid ${C.border}` },
  thCell: { flex: 1, padding: "5 7", fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.dark },
  tdCell: { flex: 1, padding: "5 7", fontSize: 8.5, color: C.body, lineHeight: 1.5 },
  // ── Footer ──
  // left/right are 0 because the Page already has paddingHorizontal: 52 applied.
  // bottom: 0 sits at the very bottom of the content area (content area itself ends
  // 60pt from the physical page edge due to paddingBottom, giving plenty of room).
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `0.5pt solid ${C.border}` },
  footerText: { fontSize: 7.5, color: "#9ca3af" },
});

// ─── Inline markdown parser ───────────────────────────────────────────────────

type Seg = { bold?: true; italic?: true; code?: true; text: string };

function parseInline(raw: string): Seg[] {
  // strip markdown links: [text](url) → text
  const src = raw.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const segs: Seg[] = [];
  const re = /(\*\*\*|___)(.*?)\1|(\*\*|__)(.*?)\3|(\*|_)(.*?)\5|`([^`]+)`/gs;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) segs.push({ text: src.slice(last, m.index) });
    if (m[1]) segs.push({ bold: true, italic: true, text: m[2] ?? "" });
    else if (m[3]) segs.push({ bold: true, text: m[4] ?? "" });
    else if (m[5]) segs.push({ italic: true, text: m[6] ?? "" });
    else if (m[7] !== undefined) segs.push({ code: true, text: m[7] });
    last = m.index + m[0].length;
  }
  if (last < src.length) segs.push({ text: src.slice(last) });
  return segs;
}

function InlineRun({ segs }: { segs: Seg[] }) {
  return (
    <>
      {segs.map((s, i) => {
        const family = s.bold && s.italic
          ? "Helvetica-BoldOblique"
          : s.bold
            ? "Helvetica-Bold"
            : s.italic
              ? "Helvetica-Oblique"
              : s.code
                ? "Courier"
                : "Helvetica";
        return (
          <Text
            key={i}
            style={{
              fontFamily: family,
              ...(s.code ? { fontSize: 8.5, backgroundColor: C.codeBg } : {}),
            }}
          >
            {s.text}
          </Text>
        );
      })}
    </>
  );
}

// ─── Markdown block parser ────────────────────────────────────────────────────

type Block =
  | { t: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; c: string }
  | { t: "p"; c: string }
  | { t: "hr" }
  | { t: "code"; c: string }
  | { t: "bq"; c: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "table"; headers: string[]; rows: string[][] };

function parseBlocks(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (!line.trim()) { i++; continue; }

    // Heading
    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      const level = hm[1]!.length as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ t: `h${level}`, c: hm[2]! } as Block);
      i++;
      continue;
    }

    // HR
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      blocks.push({ t: "hr" });
      i++;
      continue;
    }

    // Code fence
    if (line.startsWith("```")) {
      const cLines: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        cLines.push(lines[i] ?? "");
        i++;
      }
      i++;
      blocks.push({ t: "code", c: cLines.join("\n") });
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const bLines: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && (lines[i] ?? "").startsWith("> ")) {
        bLines.push((lines[i] ?? "").slice(2));
        i++;
      }
      blocks.push({ t: "bq", c: bLines.join(" ") });
      continue;
    }

    // Table
    if (line.startsWith("|")) {
      const tLines: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("|")) {
        tLines.push(lines[i] ?? "");
        i++;
      }
      if (tLines.length >= 2) {
        const headers = tLines[0]!.split("|").slice(1, -1).map((s) => s.trim());
        const rows = tLines
          .slice(2)
          .filter((r) => !/^[\s|:-]+$/.test(r))
          .map((r) => r.split("|").slice(1, -1).map((s) => s.trim()));
        blocks.push({ t: "table", headers, rows });
      }
      continue;
    }

    // Unordered list
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const l = lines[i] ?? "";
        if (/^[-*+] /.test(l)) {
          items.push(l.replace(/^[-*+] /, ""));
          i++;
        } else if (/^\s{2,}[-*+] /.test(l)) {
          items.push("  " + l.replace(/^\s+[-*+] /, ""));
          i++;
        } else break;
      }
      blocks.push({ t: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let n = 0;
      while (i < lines.length && /^\d+\. /.test(lines[i] ?? "")) {
        n++;
        items.push((lines[i] ?? "").replace(/^\d+\. /, ""));
        i++;
      }
      blocks.push({ t: "ol", items });
      continue;
    }

    // Paragraph - accumulate consecutive non-blank non-special lines
    const pLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i] ?? "";
      if (!l.trim()) break;
      if (
        /^#{1,6} /.test(l) ||
        /^[-*_]{3,}\s*$/.test(l.trim()) ||
        l.startsWith("```") ||
        l.startsWith("> ") ||
        /^[-*+] /.test(l) ||
        /^\d+\. /.test(l) ||
        l.startsWith("|")
      ) break;
      pLines.push(l);
      i++;
    }
    if (pLines.length) blocks.push({ t: "p", c: pLines.join(" ") });
  }

  return blocks;
}

// ─── Block renderer ───────────────────────────────────────────────────────────

function RenderBlock({ block }: { block: Block }) {
  switch (block.t) {
    case "h1":
      return <Text style={s.h1}><InlineRun segs={parseInline(block.c)} /></Text>;
    case "h2":
      return <Text style={s.h2}><InlineRun segs={parseInline(block.c)} /></Text>;
    case "h3":
      return <Text style={s.h3}><InlineRun segs={parseInline(block.c)} /></Text>;
    case "h4":
      return <Text style={s.h4}><InlineRun segs={parseInline(block.c)} /></Text>;
    case "h5":
      return <Text style={s.h5}><InlineRun segs={parseInline(block.c)} /></Text>;
    case "h6":
      return <Text style={s.h6}><InlineRun segs={parseInline(block.c)} /></Text>;

    case "p":
      return (
        <Text style={s.p}>
          <InlineRun segs={parseInline(block.c)} />
        </Text>
      );

    case "hr":
      return <View style={s.hr} />;

    case "code":
      return <Text style={s.codeBlock}>{block.c}</Text>;

    case "bq":
      return (
        <View style={s.bqWrap}>
          <Text style={s.bqText}>{block.c}</Text>
        </View>
      );

    case "ul":
      return (
        <View>
          {block.items.map((item, i) => (
            <View key={i} style={s.listItem}>
              <Text style={s.bullet}>{"•"}</Text>
              <Text style={s.itemText}><InlineRun segs={parseInline(item)} /></Text>
            </View>
          ))}
        </View>
      );

    case "ol":
      return (
        <View>
          {block.items.map((item, i) => (
            <View key={i} style={s.listItem}>
              <Text style={s.bullet}>{`${i + 1}.`}</Text>
              <Text style={s.itemText}><InlineRun segs={parseInline(item)} /></Text>
            </View>
          ))}
        </View>
      );

    case "table":
      return (
        <View style={s.tableWrap}>
          <View style={s.tableHeaderRow}>
            {block.headers.map((h, i) => (
              <Text key={i} style={s.thCell}>{h}</Text>
            ))}
          </View>
          {block.rows.map((row, ri) => (
            <View key={ri} style={s.tableRow}>
              {row.map((cell, ci) => (
                <Text key={ci} style={s.tdCell}>
                  <InlineRun segs={parseInline(cell)} />
                </Text>
              ))}
            </View>
          ))}
        </View>
      );

    default:
      return null;
  }
}

// ─── Public component ────────────────────────────────────────────────────────

interface ZeepoDocumentPdfProps {
  title: string;
  content: string;
  generatedAt?: string;
}

export function ZeepoDocumentPdf({ title, content, generatedAt }: ZeepoDocumentPdfProps) {
  const blocks = parseBlocks(content);
  const date = generatedAt ?? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <Document title={title} author="Zeepo by Nisc Cloud" creator="Zeepo AI Agent">
      <Page size="A4" style={s.page}>

        {/* ── Fixed footer - declared FIRST so react-pdf anchors it to the
             bottom of every page before laying out the content flow ──────── */}
        <View style={s.footer} fixed>
          <Text
            style={s.footerText}
            render={({ pageNumber }) =>
              pageNumber === 1 ? "" : "Zeepo AI Agent by Nisc Cloud"
            }
          />
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>

        {/* ── Title block ───────────────────────────────────────────────── */}
        <View style={s.titleBlock}>
          <View style={s.titleRow}>
            {/* Left: title + meta */}
            <View style={s.titleLeft}>
              <Text style={s.titleText}>{title}</Text>
              <Text style={s.titleMeta}>
                {"Generated by Zeepo  ·  Nisc Cloud  ·  "}
                {date}
              </Text>
            </View>

            {/* Right: Nisc Cloud logo - transparent, no wrapper */}
            <Image src={NISC_LOGO_URL} style={s.logoImg} />
          </View>
        </View>

        {/* ── Content ───────────────────────────────────────────────────── */}
        {blocks.map((block, i) => (
          <RenderBlock key={i} block={block} />
        ))}


      </Page>
    </Document>
  );
}

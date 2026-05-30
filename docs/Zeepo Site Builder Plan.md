# Zeepo AI Website & App Builder - Feature Plan

## 1. What Zeepo Is Today (Architecture Summary)

### 1.1 Entry Points

| Route | Purpose |
|---|---|
| `agency.zeepo-ai-agent._index.tsx` | Lists all chat sessions; create / delete |
| `agency.zeepo-ai-agent.$sessionId.tsx` | Full chat UI (2 700+ lines) |
| `agency.zeepo-canvas._index.tsx` | Lists canvas image-editing projects |
| `agency.zeepo-canvas.editor.$canvasId.tsx` | Image canvas editor |

### 1.2 Backend - `packages/api/src/routers/zeepo-agent/`

| File | Responsibility |
|---|---|
| `sessions.ts` | CRUD for sessions (create, list, get, delete) |
| `chat.ts` | `sendMessage` mutation - the core orchestration loop |
| `generate.ts` | Inserts generation job → enqueues to QStash/Replicate |
| `image-edits.ts` | Style transfer, erase, background swap, upscale, text-edit, variations |
| `agent-tools.ts` | Zod schemas for all 5 tools the LLM can call |
| `prompts.ts` | System prompt builder, session context, assets block, skills block |
| `model-helpers.ts` | Model registry lookup, capability filtering, orchestration model selector |
| `replicate-agent-orchestration.ts` | Runs one LLM turn via Replicate, repairs truncated JSON |
| `skills-catalog.ts` | Premade guided workflows (STRATEGY, BRAND & IDENTITY) |
| `skills.ts` | tRPC `skills.list` query |

### 1.3 Orchestration Loop (how Zeepo thinks)

```
sendMessage (tRPC mutation)
 │
 ├─ Insert user message → DB
 ├─ Build system prompt stack:
 │    [identity] + [session context] + [recent generations] + [session assets] + [skill?]
 │
 └─ while iteration < 6:
       ├─ runOrchestrationTurnWithRepair()   ← Replicate LLM call
       ├─ Parse JSON: { assistant_text, tool_calls[], clarifying_questions[] }
       ├─ Persist assistant message → DB
       │
       ├─ if no tool_calls OR clarifying_questions → BREAK
       │
       └─ Execute tool_calls in sequence:
             create_document       → insert into zeepoAgentGeneration (category: "document")
             check_domain_availability → call OpenProvider/KENIC live
             web_search            → call Brave Search API
             list_models           → read MODELS registry
             run_media_generation  → insertAndEnqueueAgentGeneration → QStash → Replicate
```

### 1.4 The 5 Tools Available Today

1. **`create_document`** - saves a markdown document as a generation card  
2. **`check_domain_availability`** - real-time OpenProvider + KENIC lookup  
3. **`web_search`** - Brave Search grounding  
4. **`list_models`** - catalog lookup by category/capability  
5. **`run_media_generation`** - queue image / video / audio / text / bg-remover

### 1.5 Media Categories & Model Catalog

- **Text:** Gemini 3.1 Pro (default), Claude 4.6 Opus, GPT-5.2, DeepSeek V3, …  
- **Image:** Imagen 4 Ultra (default), Flux 2 Pro, Nano Banana Pro (design specialist), …  
- **Video:** P-Video (default), Veo 3.1, SeeDance 2.0, Kling V3, …  
- **Audio:** MiniMax Speech 2.8 HD (default), Qwen3 TTS, …  
- **BG-Remover:** 851-Labs model

### 1.6 Image Edit Modes (Side Panel)

`instruct` (with optional brush mask inpainting) · `style` (8 presets) · `erase` (brush mask) · `background` (6 presets + custom) · `upscale` · `text_edit` · `variations`  
All backed by `black-forest-labs/flux-2-pro` via synchronous Replicate calls with 90s timeout.

### 1.7 Skills System

Premade guided workflows injected as an extra system-message block. Current skills:  
- Validate business idea · Define value proposition · Review pricing · Set quarterly goals  
- Brainstorm business names · Define brand voice · Pick color palette

### 1.8 Zeepo Canvas (separate product)

A node/edge-based image canvas (`canvasJson: { nodes, edges }`) stored in `zeepoCanvasProject`. Currently used for image composition. **This is NOT the website builder** - it is a separate creative tool.

---

## 2. The Gap - What's Missing

Zeepo can generate text, images, video, and audio. It **cannot**:

- Generate actual website/app code (HTML, CSS, JSX, full-stack)  
- Let the user view, edit, or export that code (no code editor tab)  
- Offer a visual drag-and-drop page builder (no WordPress-equivalent)  
- Preview the generated site live in-browser  
- Publish/deploy the result to Nisc Cloud hosting

---

## 3. Proposed Feature: **Zeepo Builder**

A new section of nPanel that gives users **three ways to build** - AI chat, code view, and visual drag-and-drop - all editing the same underlying document.

### 3.1 The Three Panes (Tabs)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Zeepo Builder  [Chat]  [Code]  [Visual]  [Preview]        [Publish ▾]  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Chat tab:     AI chat (same UX as Zeepo Agent) that generates/edits    │
│                pages. Zeepo writes the code, the user sees the result.   │
│                                                                          │
│  Code tab:     Monaco editor (VS Code engine) showing the generated      │
│                HTML/CSS/JS or React JSX. Fully editable. Syntax-         │
│                highlighted. Like Lovable, v0, Bolt.                      │
│                                                                          │
│  Visual tab:   Drag-and-drop WYSIWYG editor. Block-based (sections,      │
│                hero, columns, buttons, images, forms). Like WordPress     │
│                Gutenberg / Webflow canvas. For users who don't code.     │
│                                                                          │
│  Preview tab:  Sandboxed iframe rendering the current code. Hot-reload   │
│                on every save.                                            │
│                                                                          │
│  Publish:      Deploy to Nisc Cloud hosting, download ZIP, or export     │
│                raw code.                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 How the Three Panes Stay in Sync

All three panes edit the **same source document**: a `builderProjectFiles` JSON blob (file tree stored in DB). Edits in any pane immediately update the shared state:

- **Chat → Code:** AI produces a diff/patch; the editor applies it  
- **Code → Visual:** Parser converts HTML/CSS into a block AST for the visual editor  
- **Visual → Code:** Block mutations emit minimal DOM patches back to the code  
- **Preview:** Re-renders whenever any pane saves (debounced 500ms)

---

## 4. New Database Tables

### 4.1 `zeepo_builder_project`

```sql
id              uuid PK
name            text NOT NULL
description     text
userId          uuid FK → user.id
teamId          uuid FK → team.id NULLABLE
projectType     enum('website', 'landing_page', 'app', 'email_template')
framework       enum('html', 'react', 'nextjs') DEFAULT 'html'
status          enum('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT'
publishedUrl    text NULLABLE
thumbnailUrl    text NULLABLE
createdAt       timestamptz
updatedAt       timestamptz
```

### 4.2 `zeepo_builder_file`

```sql
id              uuid PK
projectId       uuid FK → zeepo_builder_project.id
filePath        text NOT NULL        -- e.g. "index.html", "styles/main.css"
content         text NOT NULL        -- raw code content
mimeType        text NOT NULL        -- "text/html", "text/css", "application/javascript"
createdAt       timestamptz
updatedAt       timestamptz
```

### 4.3 `zeepo_builder_session`

```sql
id              uuid PK
projectId       uuid FK → zeepo_builder_project.id
userId          uuid FK → user.id
title           text DEFAULT 'New chat'
createdAt       timestamptz
updatedAt       timestamptz
```

### 4.4 `zeepo_builder_message`

Same schema as `zeepo_agent_message` (role, content, toolCalls, toolCallId, metadata) but scoped to a builder session and linked to a projectId.

### 4.5 `zeepo_builder_activity_log`

Standard activity log (projectId, userId, action, description, ipAddress, userAgent).

---

## 5. New tRPC Routers - `packages/api/src/routers/zeepo-builder/`

```
zeepo-builder/
  index.ts          ← combines sub-routers
  projects.ts       ← CRUD for builder projects
  files.ts          ← CRUD for project files; diff-apply endpoint
  sessions.ts       ← CRUD for builder chat sessions
  chat.ts           ← sendMessage: AI chat that edits project files
  publish.ts        ← deploy to Nisc Cloud hosting / export ZIP
  schemas.ts        ← Zod schemas
  prompts.ts        ← builder-specific system prompt
  agent-tools.ts    ← builder-specific tool definitions
```

### 5.1 Builder-Specific AI Tools

In addition to the existing 5 Zeepo tools, the builder chat gets:

| Tool | Description |
|---|---|
| `write_file` | Write or overwrite a file in the project (`filePath`, `content`) |
| `patch_file` | Apply a unified diff to a specific file |
| `create_file` | Create a new file in the project |
| `delete_file` | Remove a file from the project |
| `list_files` | Return the current file tree |
| `run_preview` | Signal UI to refresh the preview iframe |
| `add_block` | (Visual mode) Insert a block at a position with props |
| `update_block` | (Visual mode) Update a block's props |
| `remove_block` | (Visual mode) Delete a block |

### 5.2 Builder System Prompt (additions)

The builder prompt extends the Zeepo identity prompt with:

- Role: "You are Zeepo Builder, Nisc Cloud's AI website and app builder."
- Coding standards: semantic HTML5, mobile-first CSS, accessible markup
- File discipline: always use `write_file` or `patch_file` - never include code inline in chat replies
- Design system: inject the project's current color palette, font stack, and component library
- Framework-specific rules (HTML-only / React / Next.js branches)
- Block vocabulary (for visual mode compatibility)

---

## 6. New Frontend Routes

```
agency.zeepo-builder._index.tsx            ← Project dashboard (grid of projects)
agency.zeepo-builder.new.tsx               ← New project wizard
agency.zeepo-builder.$projectId.tsx        ← Main builder layout (layout route)
agency.zeepo-builder.$projectId._index.tsx ← Redirects to /chat
agency.zeepo-builder.$projectId.chat.tsx   ← AI Chat pane
agency.zeepo-builder.$projectId.code.tsx   ← Monaco code editor pane
agency.zeepo-builder.$projectId.visual.tsx ← Drag-and-drop visual editor
agency.zeepo-builder.$projectId.preview.tsx← Sandboxed iframe preview
```

### 6.1 Layout Route (`$projectId.tsx`) - Shared Shell

```
┌─ Project name (editable) ─────── [Chat] [Code] [Visual] [Preview] ──── [Publish ▾] ─┐
│                                                                                        │
│  <Outlet />   (one of: Chat | Code | Visual | Preview)                                │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

The layout route:
- Loads the project + all files into shared React context (`BuilderProjectContext`)
- Subscribes to file-change events so all tabs stay in sync
- Manages the `activeFile` state (which file the code editor shows)

---

## 7. Chat Pane - AI-Driven Development

### 7.1 UX

Identical to the existing Zeepo Agent chat (messages, thinking bubble, generations strip) but:
- **No media generation** (image/video/audio tools disabled in builder mode)
- **File change events** appear inline as collapsible diff cards (à la Bolt's "file modified" indicators)
- Each AI response that modifies files shows: `✏ index.html - 12 lines changed`
- User can accept or revert individual file changes

### 7.2 Starter Prompts (Builder Skills)

Pre-built skill chips available in the new-project wizard:

| Category | Skill |
|---|---|
| WEBSITES | Build a business landing page |
| WEBSITES | Build a portfolio/showcase site |
| WEBSITES | Build an e-commerce storefront |
| APPS | Build a SaaS dashboard |
| APPS | Build a booking/appointment form |
| MARKETING | Build a coming-soon page |
| MARKETING | Build a lead capture page |

### 7.3 Clarifying Questions Flow

Same Q&A step-through widget as the existing agent, asking:
1. What type of site/app?
2. Brand name, colors, and logo (upload supported)?
3. Key sections or features needed?
4. Target audience?
5. Any reference site for style?

---

## 8. Code Pane - Monaco Editor (like Lovable / v0 / Bolt)

### 8.1 Features

- **Monaco Editor** (the VS Code engine, already in the NPM ecosystem via `@monaco-editor/react`)
- File tree sidebar (collapsible) listing all `zeepo_builder_file` rows
- Syntax highlighting: HTML, CSS, JS, JSX, TS, JSON
- AI inline completion: "Tab to accept" suggestions powered by Zeepo (optional, phase 2)
- **Diff view**: when the AI makes changes, Monaco's built-in diff editor shows before/after
- Auto-save: debounced 1s, persists to `files.update` tRPC mutation
- Format button (Prettier via WASM)
- Copy-to-clipboard per file

### 8.2 Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+S` | Save file |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo (Monaco native) |
| `Ctrl+/` | Toggle comment |
| `Ctrl+Shift+F` | Format with Prettier |

---

## 9. Visual Pane - Drag & Drop Editor (like WordPress / Webflow)

### 9.1 Architecture

The visual editor operates on a **block AST** (Abstract Syntax Tree), which is a JSON representation of the page structure. This AST is bidirectionally synced with the code pane.

```typescript
type Block = {
  id: string;
  type: BlockType;      // "section" | "hero" | "navbar" | "columns" | "text" | "image" | "button" | "form" | "video" | "divider" | "spacer" | "card" | "testimonial" | "pricing" | "faq" | "footer"
  props: Record<string, unknown>;
  children?: Block[];
  styles?: CSSProperties;   // inline overrides
};
```

### 9.2 Editor Canvas

- **Infinite scrolling canvas** with the current page rendered inside a responsive iframe shell
- Click any element → select it → show a **floating property panel** on the right
- Drag blocks from a **left sidebar block palette** onto the canvas
- Drag-and-drop reorder between sections (uses `@dnd-kit/core`)
- Blue highlight border around hovered/selected blocks
- Resize handles on images and columns

### 9.3 Block Palette (Left Sidebar)

```
LAYOUT          CONTENT         MEDIA           MARKETING
──────────      ──────────      ──────────      ──────────
Section         Heading         Image           Hero (AI)
Two columns     Paragraph       Video           CTA Button
Three columns   List            Icon            Lead form
Grid            Quote           Gallery         Pricing table
Spacer          Code            Carousel        Testimonial
Divider         Table           Background      FAQ accordion
                                                Countdown timer
```

"Hero (AI)" and similar AI-enhanced blocks prompt Zeepo to generate the copy and a matching image in one click.

### 9.4 Property Panel (Right Sidebar - when a block is selected)

- **Content tab:** Editable text fields, image upload, link URL, button label
- **Style tab:** Typography (font, size, weight, color), spacing (margin/padding sliders), background (color/gradient/image), border, border-radius, shadow
- **Layout tab:** Width, height, alignment, display (flex/grid options)
- **Advanced tab:** Custom CSS class, HTML ID, animation (fade-in, slide-up options)
- **AI Edit button:** Opens a mini-chat to ask Zeepo to rewrite the block ("Make this more persuasive", "Generate a matching background image")

### 9.5 Responsive Breakpoints

Toolbar breakpoint switcher (Desktop → Tablet → Mobile). Each breakpoint stores overriding styles on the block. The code generator emits `@media` queries accordingly.

### 9.6 Code Sync Strategy

```
Visual block mutation
    │
    ▼
blockAstToHtml(ast) or blockAstToJsx(ast)
    │
    ▼
files.patch({ filePath: "index.html", content: newContent })   ← tRPC call
    │
    ▼
Code pane receives updated content via React context
    │
    ▼
Preview iframe refreshes
```

Reverse direction (code → visual):
```
User edits code manually
    │
    ▼
Debounced parse: htmlToBlockAst(html)
    │
    ▼
Visual editor receives updated block AST
    │
    ▼
Canvas re-renders (non-destructive: preserves selection state)
```

> **Important:** If the code contains patterns the parser doesn't understand, the visual editor shows a graceful "Custom code - visual editing unavailable for this section" placeholder, rather than crashing.

---

## 10. Preview Pane

- Sandboxed `<iframe sandbox="allow-scripts allow-same-origin">` 
- The iframe's `srcdoc` is set from the current `index.html` file content
- External assets (CSS frameworks, Google Fonts CDN links) load normally since `allow-same-origin` is set
- Hot-reload: the iframe's content is replaced on every debounced save (500ms after last keystroke)
- Responsive preview: breakpoint switcher in the preview toolbar resizes the iframe container
- A "Open in new tab" button opens the generated site in a real browser tab using an Object URL

---

## 11. AI-Assisted Workflows (Differentiators)

### 11.1 One-Click Page Generation

User opens "New Project" → picks a template or describes their site → Zeepo generates:
1. `index.html` with full semantic structure  
2. `styles/main.css` with custom palette + typography  
3. `assets/` placeholders or AI-generated images (queued via existing `run_media_generation`)  
4. Auto-opens the Preview pane so the user sees a live site in ~15 seconds

### 11.2 Section-Level AI Editing

In the Visual editor, right-click any section → "Ask Zeepo to improve this section":
- Zeepo reads the current block's HTML content
- Mini chat bubble appears
- User types: "Make this hero more premium and add a CTA button"
- Zeepo regenerates only that block's HTML and patches the file

### 11.3 Image-to-Site (Vision Input)

User uploads a screenshot or mockup → Zeepo analyzes the design (using vision capability of Claude/Gemini) → generates matching HTML/CSS → opens in builder.

### 11.4 Brand Injection

When a team has a logo in `SESSION ASSETS` or has Zeepo-generated brand assets, the builder automatically:
- Detects logo URL from recent agent generations
- Injects it into the navbar and footer blocks
- Uses the brand palette (hex codes) from the color-picking skill session

### 11.5 Copy Rewriting

"Rewrite all copy in this page for [audience]" - Zeepo reads all text nodes across the block AST and rewrites them in a single turn, then patches the file.

---

## 12. Publish & Export

### 12.1 Export Options

| Option | Description |
|---|---|
| Download ZIP | Packages all `zeepo_builder_file` rows into a ZIP archive |
| Copy HTML | Single-file HTML with inlined CSS (for simple landing pages) |
| Export to GitHub | (Phase 2) Push to a connected GitHub repo |

### 12.2 Publish to Nisc Cloud Hosting

- **One-click deploy** button in the toolbar
- Triggers `publish.deploy` tRPC mutation on the server
- Server bundles the files and deploys to Nisc Cloud's shared hosting via Plesk API (already integrated in the codebase)
- Returns a live URL like `https://[slug].nisccloud.app` 
- The URL is stored in `zeepo_builder_project.publishedUrl` and shown in the project dashboard

### 12.3 Custom Domain

- User can connect their own domain (registered via Zeepo's `check_domain_availability` tool → Nisc Cloud)
- Nisc Cloud DNS + SSL cert provisioning handled by existing hosting infrastructure

---

## 13. Navigation & Sidebar Integration

### 13.1 nPanel Sidebar Entry

Add "Zeepo Builder" as a new sidebar item under the **Zeepo** group (alongside "Zeepo AI Agent" and "Zeepo Canvas"):

```
⚡ Zeepo
   ├── AI Agent
   ├── Builder        ← NEW
   └── Canvas
```

### 13.2 Cross-Product Integration

- From the **AI Agent** chat, Zeepo can say: "I've built a draft website for you - open it in Zeepo Builder" (creates a builder project from the agent session's generated assets)
- From the **Domains** page, after registering a domain, prompt: "Build a website for this domain with Zeepo Builder"
- From the **Creative Assets** page, "Use this image in Zeepo Builder"

---

## 14. Technical Dependencies

| Dependency | Use | Status |
|---|---|---|
| `@monaco-editor/react` | Code editor | New dependency |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag and drop in visual editor | New dependency |
| `html-parser` / custom | HTML ↔ Block AST conversion | New implementation |
| `prettier` (WASM build) | Code formatting in browser | New dependency |
| `jszip` | ZIP export | New dependency |
| `sandpack` (CodeSandbox) | Alternative to raw Monaco (optional) | Evaluate |
| Existing: `Replicate` | AI code generation | Already configured |
| Existing: `uploadthing` | Asset uploads | Already configured |
| Existing: `tRPC` | API layer | Already configured |
| Existing: `Drizzle ORM` | DB writes | Already configured |
| Existing: `Plesk API` | Hosting deploy | Already integrated |

---

## 15. Phased Rollout

### Phase 1 - AI Chat Builder (6–8 weeks)
- [ ] DB schema: `zeepo_builder_project`, `zeepo_builder_file`, `zeepo_builder_session`, `zeepo_builder_message`
- [ ] tRPC routers: projects, files, sessions, chat
- [ ] Builder-specific system prompt and tool definitions (`write_file`, `patch_file`, etc.)
- [ ] Frontend: Project dashboard + new project wizard
- [ ] Frontend: Chat pane (reuse Zeepo Agent chat components)
- [ ] Frontend: Preview pane (sandboxed iframe)
- [ ] Publish: ZIP export + deploy to Nisc Cloud hosting

### Phase 2 - Code Editor (3–4 weeks)
- [ ] Monaco editor integration (`@monaco-editor/react`)
- [ ] File tree sidebar
- [ ] Diff view for AI-generated changes
- [ ] Auto-save + Prettier formatting
- [ ] File create/delete from UI

### Phase 3 - Visual Drag & Drop Editor (8–10 weeks)
- [ ] Block AST schema and type definitions
- [ ] Block palette (left sidebar, 20+ block types)
- [ ] Canvas rendering engine (blocks → HTML inside iframe)
- [ ] Property panel (content, style, layout tabs)
- [ ] DnD block reordering (`@dnd-kit`)
- [ ] Resize handles for images and columns
- [ ] HTML ↔ Block AST bidirectional parser
- [ ] Breakpoint switcher (Desktop / Tablet / Mobile)
- [ ] Section-level AI editing (mini chat per block)

### Phase 4 - Advanced AI Features (4–6 weeks)
- [ ] Image-to-Site (vision input → HTML generation)
- [ ] Brand injection from agent session assets
- [ ] AI inline code completion in Monaco
- [ ] One-click page regeneration with different styles
- [ ] GitHub export

---

## 16. Open Questions for Your Review

> [!IMPORTANT]
> **Framework target:** Should the builder primarily target plain HTML/CSS (easiest to deploy anywhere, no build step) or React/Next.js (more powerful, requires Node.js hosting)? A dual-mode approach is possible but more complex.

> [!IMPORTANT]
> **Visual editor scope:** Should Phase 3 build the visual editor from scratch, or use an embeddable open-source builder like **GrapeJS** (MIT licensed, battle-tested) as a foundation? GrapeJS ships with a block palette, property panel, and DnD already built - we'd wrap it in our UI and connect it to the tRPC backend. This would cut Phase 3 from 8–10 weeks to ~3–4 weeks.

> [!WARNING]
> **Code ↔ Visual sync fidelity:** Bidirectional parsing is the hardest part. If a user writes complex custom CSS or JavaScript, the visual editor cannot faithfully represent it. The plan handles this with graceful fallback ("Custom code" placeholder). Confirm this tradeoff is acceptable.

> [!NOTE]
> **Hosting deploy mechanism:** The plan uses the existing Plesk API integration to deploy. If Plesk isn't the right target (e.g., you want a separate static hosting environment like Cloudflare Pages or a Nisc Cloud static bucket), the publish module needs a different implementation.

> [!NOTE]
> **Existing Zeepo Canvas:** The current canvas product (`zeepo-canvas`) is a separate image composition tool. The new Zeepo Builder is a completely different product. Should the Canvas be folded into Builder (e.g., as a "Design Assets" pane), or stay separate?


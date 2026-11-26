# Frontend design audit — approval proposal

Date: 2026-11-10  
Scope: public Nisc Cloud website. This is a proposal only; no sections or journeys were removed or fundamentally redesigned.

## Direction to keep

- Position Nisc Cloud as one accountable technology partner across **Build, Run and Grow**, with automation supporting all three.
- Keep sky blue as the primary signal. Use dark navy for operational depth and restrained violet only as a supporting accent.
- Keep DM Sans as the main interface and reading face. Use Space Mono only for real technical data, commands and system states.
- Keep both journeys visible: direct cloud-product purchase and scoped business-service enquiry.
- Make nPanel the recurring proof of connection between infrastructure, software and growth rather than adding generic decorative cards.

## Observed issues

### P1 — Product and service pages share too much visible structure

Evidence:

- `src/pages/_components/ServicePageShell.tsx` drives 19 public routes.
- The shell can render the same sequence of statistics, feature cards, showcase cards, pricing, process, bento cards, FAQ and closing CTA.
- `FeaturesGrid`, `ServiceShowcaseSection`, `ServiceStatistics` and `BuiltDifferentBento` repeat rounded-card treatments even when the buyer question changes.

Effect: content is now more distinct, but repeated presentation still makes different offers feel assembled from one template.

**Approval required:** replace the single long shell sequence with three controlled templates:

1. Cloud product: outcome → live specifications/pricing → operational proof → migration/support scope → FAQ.
2. Managed service: business problem → approach/deliverables → evidence → scoped engagement → FAQ.
3. Platform: workflow → real nPanel screen → audience paths → connected products → enquiry/demo.

No route, pricing block or buyer journey would be removed. Existing sections would be recomposed and some repeated card groups consolidated; this is a substantial redesign and must be approved first.

### P1 — Motion is too widely distributed

Evidence:

- `ServicePageShell.tsx` contains 16 motion patterns.
- `showcase-stages.tsx` contains more than 100 motion declarations.
- Homepage and hub components repeatedly use fade/slide entrances and card hover movement.

Effect: motion becomes background decoration rather than an explanation of system behaviour, and the site can feel more like a template than a premium operational product.

**Approval required:** retain purposeful nPanel, terminal and state-transition animations; remove most automatic section entrances and decorative hover lift. All essential content remains visible without motion, and reduced-motion behaviour remains supported.

### P2 — Premium proof is fragmented across many card styles

Evidence:

- `src/pages/_components/BentoFeatures.tsx`
- `src/pages/_components/AtomApproach.tsx`
- `src/pages/_components/OnePlatform.tsx`
- `src/pages/_components/DashboardPreview.tsx`
- `src/components/shadcn-space/blocks/built-different-01/built-different-bento.tsx`

Effect: borders, rounded panels, gradients and small labels compete with the strongest differentiator: connected work inside nPanel.

**Approval required:** establish one reusable “operational proof” system:

- real nPanel screenshots where the function exists;
- clearly labelled illustration where it is conceptual;
- one light treatment for Build/Grow workflows;
- one dark operational treatment for Run/terminal/security;
- no fabricated activity, customer data or performance results.

### P2 — Typography and labels sometimes behave as decoration

Evidence:

- Repeated eyebrow labels, title blocks and compact labels appear across shared page components.
- Technical mono styling is sometimes used outside real commands or system data.

Effect: headings compete with metadata and the page hierarchy becomes less immediate.

Safe additive refinement after approval of the template direction: reduce decorative eyebrows, keep sentence case, constrain body copy to readable line lengths and reserve mono text for real technical content.

## Keep unchanged

- Stable homepage proposition and the “One partner for every stage…” section.
- Build / Run / Grow framework.
- Businesses / Agencies / Developers audience paths.
- Currency selector and location explanation.
- Direct checkout versus project-enquiry distinction.
- Existing routes and URLs.
- Essential content without carousel or swipe dependency.

## Recommended approval package

Approve together:

1. Three route templates instead of one visibly repeated page sequence.
2. Motion reduction while preserving nPanel and terminal demonstrations.
3. One operational-proof visual system using real screenshots and labelled illustrations.
4. Typography cleanup within the existing brand positioning.

These changes affect presentation and section composition, not Nisc Cloud’s approved positioning, product catalogue, prices, routes or checkout logic.

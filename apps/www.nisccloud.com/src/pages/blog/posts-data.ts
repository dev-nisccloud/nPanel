export type Post = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  featured?: boolean;
  gradient: string;
  author: string;
  authorRole: string;
  content: Section[];
};

export type Section =
  | { type: "intro"; text: string }
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; icon: string; title: string; text: string }
  | { type: "stat-row"; stats: { value: string; label: string }[] }
  | { type: "closing"; text: string };

export const posts: Post[] = [
  {
    slug: "why-every-kenyan-sme-needs-a-digital-identity",
    category: "Brand Strategy",
    title: "Why Every Kenyan SME Needs a Digital Identity Before Anything Else",
    excerpt:
      "Before you run ads, post on social media, or build a website - you need a brand. We break down why identity comes first and how to get it right without breaking the bank.",
    readTime: "6 min read",
    date: "Apr 28, 2025",
    featured: true,
    gradient: "from-blue-500/20 via-primary/10 to-transparent",
    author: "Amara Oduya",
    authorRole: "Head of Brand Strategy, Nisc Cloud",
    content: [
      {
        type: "intro",
        text: "Most Kenyan business owners start with the wrong question: 'How do I get customers?' The right question is: 'Why would anyone trust me enough to become a customer?' That answer lives in your brand.",
      },
      { type: "h2", text: "What 'Digital Identity' Actually Means" },
      {
        type: "p",
        text: "Your digital identity is the sum of every impression your business makes online - your logo, colours, tone of voice, website layout, social media presence, and even how you respond to reviews. When these elements are consistent and intentional, they build trust. When they're scattered, potential customers quietly move on.",
      },
      {
        type: "blockquote",
        text: "A business without a consistent brand is like a shop with no signage. People might stumble in, but they rarely come back - and they never refer.",
      },
      { type: "h2", text: "The 3 Pillars of a Strong Digital Identity" },
      {
        type: "ol",
        items: [
          "Visual Identity - Logo, colour palette, typography, and imagery that are distinctly yours. Consistency here is more important than being 'beautiful'.",
          "Voice & Messaging - The words you use, the promises you make, and the story you tell. Your tone should be the same whether you're posting on Instagram or replying to a client email.",
          "Owned Digital Assets - A professional website, a branded email address, and a claimed Google Business Profile. These are the non-negotiables.",
        ],
      },
      {
        type: "stat-row",
        stats: [
          { value: "23%", label: "More revenue for brands with consistent digital identity" },
          { value: "68%", label: "Of Kenyans research online before buying" },
          { value: "3x", label: "Higher trust when a business has a professional website" },
        ],
      },
      { type: "h2", text: "Why SMEs Skip This Step (And Pay for It Later)" },
      {
        type: "p",
        text: "The most common reason we hear: 'We'll sort out the branding later, once we start making money.' But this is backwards. Without a brand, your marketing spend is wasted - ads drive traffic to a website or social profile that doesn't convert because it looks untrustworthy.",
      },
      {
        type: "ul",
        items: [
          "You spend more on ads because your conversion rate is low.",
          "Customers choose better-looking competitors even if your product is superior.",
          "You can't charge premium prices without a premium-looking brand.",
          "Word-of-mouth referrals drop - people don't refer brands they'd be embarrassed to share.",
        ],
      },
      {
        type: "callout",
        icon: "💡",
        title: "The Minimum Viable Brand",
        text: "You don't need a KES 500,000 rebrand to start. At a minimum: a clean logo, one primary colour, a professional email (you@yourcompany.co.ke), and a one-page website. That's enough to build trust and start growing.",
      },
      { type: "h2", text: "Where to Start: The Nisc Cloud Framework" },
      {
        type: "p",
        text: "At Nisc Cloud, we follow a Brand-First approach with every client. Before we run a single ad or write a single SEO article, we ensure the digital foundation is solid. Here's the framework we use:",
      },
      {
        type: "ol",
        items: [
          "Audit - Where do you currently stand? What exists, what's inconsistent, what's missing?",
          "Position - Who are you, who do you serve, and what makes you different?",
          "Design - Visual identity system: logo, colours, fonts, photography style.",
          "Platform - Website, Google Business Profile, branded social profiles.",
          "Voice - Brand messaging guide: tagline, elevator pitch, tone of voice.",
        ],
      },
      {
        type: "closing",
        text: "Your brand is the foundation everything else is built on. Get it right first, and every other investment - ads, SEO, social media - multiplies in effectiveness. Get in touch with our brand team today for a free digital identity audit.",
      },
    ],
  },
  {
    slug: "what-is-aeo-geo-and-why-seo-alone-is-not-enough",
    category: "SEO / AEO / GEO",
    title: "What is AEO & GEO - And Why SEO Alone Is No Longer Enough in 2025",
    excerpt:
      "Google is no longer the only search engine that matters. ChatGPT, Perplexity, and Google SGE are changing how people find businesses. Here's how to rank everywhere.",
    readTime: "8 min read",
    date: "Apr 22, 2025",
    featured: true,
    gradient: "from-violet-500/20 via-primary/10 to-transparent",
    author: "Kevin Mwangi",
    authorRole: "SEO Lead, Nisc Cloud",
    content: [
      {
        type: "intro",
        text: "In 2020, SEO meant ranking on Google. In 2025, your potential customers are asking ChatGPT, searching Perplexity, and getting AI-generated summaries on Google SGE - often without ever clicking your website. If you're not optimised for these new surfaces, you're invisible to a growing segment of your market.",
      },
      { type: "h2", text: "The Three Search Disciplines You Need to Know" },
      {
        type: "ul",
        items: [
          "SEO (Search Engine Optimisation) - Classic Google/Bing ranking through keywords, backlinks, and technical optimisation. Still essential, but no longer sufficient.",
          "AEO (Answer Engine Optimisation) - Getting your business cited as the answer in AI tools like ChatGPT, Gemini, and Perplexity. Requires structured, authoritative content.",
          "GEO (Generative Engine Optimisation) - Optimising to appear inside AI-generated summaries on Google SGE and Bing Copilot. Different signals from traditional SEO.",
        ],
      },
      {
        type: "stat-row",
        stats: [
          { value: "36%", label: "Of searchers use AI tools as their first search step" },
          { value: "60%", label: "Of Google searches now end without a click (zero-click)" },
          { value: "2.4x", label: "More citations for businesses with structured FAQ content" },
        ],
      },
      { type: "h2", text: "How AEO Works in Practice" },
      {
        type: "p",
        text: "Answer engines like ChatGPT are trained on crawlable web content and regularly updated through Bing's index. To be cited, your content needs to directly and authoritatively answer common questions in your niche. This means FAQ pages, how-to guides, and comparison articles written in natural question-and-answer format.",
      },
      {
        type: "callout",
        icon: "🎯",
        title: "AEO Quick Win",
        text: "Add a structured FAQ section to every key page of your website using proper schema markup. Answer the top 5 questions your customers ask about your product or service in plain, direct language.",
      },
      { type: "h2", text: "GEO: Showing Up in AI Summaries" },
      {
        type: "p",
        text: "Google's Search Generative Experience (SGE) pulls content from trusted sources to generate AI summaries at the top of search results. The signals that influence which content is pulled include: domain authority, content freshness, author expertise (E-E-A-T signals), and structured data markup.",
      },
      {
        type: "ul",
        items: [
          "Build author profiles with credentials on all content.",
          "Keep content updated - AI summaries favour recent, accurate information.",
          "Use structured data (FAQ, HowTo, Article schema).",
          "Earn mentions from authoritative Kenyan news sites and industry blogs.",
          "Create comprehensive, in-depth content that covers topics fully.",
        ],
      },
      { type: "h2", text: "The Integrated Approach for Kenyan Businesses" },
      {
        type: "p",
        text: "For most Kenyan SMEs, the priority order should be: (1) Fix technical SEO and Google Business Profile first, (2) Build AEO content for your top 10 customer questions, (3) Add structured data markup, (4) Start building domain authority through local PR and directory listings. This three-to-six month foundation sets you up to rank across all search surfaces.",
      },
      {
        type: "closing",
        text: "The businesses that dominate the next decade of search will be the ones that start preparing now. Our SEO/AEO/GEO packages are designed specifically for Kenyan businesses. Book a free discovery call to see where you stand.",
      },
    ],
  },
  {
    slug: "mpesa-ecommerce-checklist-kenya",
    category: "E-commerce",
    title: "The Complete M-Pesa E-commerce Checklist for Kenyan Businesses",
    excerpt:
      "From STK push integration to order fulfilment automation - everything you need to launch a profitable online store in Kenya, step by step.",
    readTime: "10 min read",
    date: "Apr 15, 2025",
    gradient: "from-emerald-500/20 via-primary/10 to-transparent",
    author: "Judy Wambua",
    authorRole: "E-commerce Strategist, Nisc Cloud",
    content: [
      {
        type: "intro",
        text: "Kenya is one of the most exciting e-commerce markets in Africa. Mobile money penetration is unmatched, smartphone adoption is soaring, and consumers are increasingly comfortable buying online. But launching a Kenyan e-commerce store has specific requirements that most generic guides miss completely.",
      },
      { type: "h2", text: "The Pre-Launch Checklist" },
      {
        type: "ol",
        items: [
          "Business Registration - You need a registered entity (sole proprietor or limited company) to apply for M-Pesa business payments.",
          "M-Pesa Paybill or Till Number - Apply through your business bank or directly via Safaricom Business. This is required for STK push payments.",
          "Daraja API Access - Register at developer.safaricom.co.ke for API credentials. You'll need sandbox testing before going live.",
          "SSL Certificate - Mandatory for any e-commerce site handling payments. We include this in all hosting packages.",
          "Product Photography - Poor photos are the #1 conversion killer. Invest in decent product images before launch.",
        ],
      },
      {
        type: "stat-row",
        stats: [
          { value: "87%", label: "Of Kenyan online shoppers prefer M-Pesa payments" },
          { value: "KES 850B", label: "Annual M-Pesa transaction value in Kenya" },
          { value: "3.2x", label: "Higher conversion with STK push vs manual till payment" },
        ],
      },
      { type: "h2", text: "Payment Integration Options" },
      {
        type: "ul",
        items: [
          "STK Push (Recommended) - Customer enters their phone number, receives a push notification on their phone, enters PIN, and payment is confirmed automatically. Highest conversion rate.",
          "Paybill Manual Entry - Customer manually types your Paybill number. More friction but no API required. Good for starting out.",
          "Payment Aggregators (Pesapal, DPO, Flutterwave) - Handle multiple payment methods including cards and M-Pesa. More setup but broader coverage.",
          "iPay / JamboPay - Local Kenyan payment gateways with competitive rates and good local support.",
        ],
      },
      {
        type: "callout",
        icon: "⚡",
        title: "M-Pesa Integration Timeline",
        text: "From Daraja API registration to live STK push on your store typically takes 7-14 business days for the Safaricom approval process. Plan your launch date accordingly.",
      },
      { type: "h2", text: "Fulfilment & Logistics" },
      {
        type: "p",
        text: "Payment is only half the battle. Kenyan customers increasingly expect fast, trackable delivery. Your fulfilment setup should include: a clear delivery zones policy (Nairobi CBD vs estates vs upcountry), integration with at least one courier (Sendy, Wells Fargo Kenya, Uber Direct for Nairobi), and automated order confirmation SMS/WhatsApp to the customer.",
      },
      { type: "h2", text: "Post-Launch: Optimising for Growth" },
      {
        type: "ul",
        items: [
          "Set up abandoned cart recovery via SMS and WhatsApp (much higher open rates than email in Kenya).",
          "Add Google Analytics 4 and Meta Pixel from day one to build retargeting audiences.",
          "Create a loyalty points system - Kenyans respond exceptionally well to loyalty programmes.",
          "List on Jumia and Jiji as additional channels while building your own store's traffic.",
          "Run periodic WhatsApp broadcast promotions to your customer list.",
        ],
      },
      {
        type: "closing",
        text: "Getting this right from the start saves you months of retrofitting. Our e-commerce builds include full M-Pesa integration, SSL, and fulfilment workflow setup as standard. Request a project estimate today.",
      },
    ],
  },
  {
    slug: "zeepo-ai-explained",
    category: "AI Automation",
    title: "Zeepo AI Explained: How We're Replacing Your Sales Team With Smart Bots",
    excerpt:
      "CRM automation, WhatsApp chatbots, AI-generated follow-ups - Zeepo AI is the engine that keeps working while you sleep. Here's the full picture.",
    readTime: "7 min read",
    date: "Apr 10, 2025",
    gradient: "from-orange-500/20 via-primary/10 to-transparent",
    author: "Brian Kamau",
    authorRole: "AI Automation Lead, Nisc Cloud",
    content: [
      {
        type: "intro",
        text: "What if your business could respond to every lead within 60 seconds, qualify them automatically, send a personalised follow-up at the perfect time, and book a demo - all while you sleep? That's not science fiction. That's Zeepo AI.",
      },
      { type: "h2", text: "What Is Zeepo AI?" },
      {
        type: "p",
        text: "Zeepo AI is Nisc Cloud's proprietary automation platform built specifically for Kenyan businesses. It connects your CRM, WhatsApp Business, email, and website into a single intelligent pipeline that automates the most repetitive and time-sensitive parts of your sales and support workflow.",
      },
      {
        type: "stat-row",
        stats: [
          { value: "60s", label: "Average response time vs 4-hour industry average" },
          { value: "340%", label: "Increase in lead qualification rate reported by clients" },
          { value: "18hrs", label: "Average staff time saved per week per business" },
        ],
      },
      { type: "h2", text: "The Five Core Modules" },
      {
        type: "ol",
        items: [
          "WhatsApp AI Chatbot - Trained on your business FAQs, product catalogue, and pricing. Handles 80% of inbound queries without human intervention.",
          "Lead Scoring Engine - Automatically scores and prioritises leads based on behaviour, source, and intent signals.",
          "AI Follow-Up Sequences - Personalised follow-up messages generated and sent at optimal times based on lead behaviour.",
          "CRM Auto-Population - Lead data from all sources (website forms, WhatsApp, Instagram DMs) flows into a single CRM automatically.",
          "Appointment Booking Bot - Qualifies leads and books discovery calls directly into your team's calendar.",
        ],
      },
      {
        type: "callout",
        icon: "🤖",
        title: "WhatsApp Is the Channel",
        text: "In Kenya, WhatsApp Business open rates exceed 90%. Zeepo AI treats WhatsApp as the primary communication channel, not a secondary one. This alone drives dramatically higher engagement compared to email-first automation tools built for Western markets.",
      },
      { type: "h2", text: "Implementation: What to Expect" },
      {
        type: "p",
        text: "A standard Zeepo AI implementation takes 2-4 weeks and includes: business process mapping, chatbot training on your specific products and FAQs, CRM setup and integrations, team training, and a 30-day hypercare period. Most clients see measurable ROI within the first month of operation.",
      },
      {
        type: "ul",
        items: [
          "Week 1-2: Onboarding, process mapping, and initial setup.",
          "Week 3: Bot training, CRM integration, and workflow automation build.",
          "Week 4: Testing, refinement, and team training.",
          "Month 2+: Ongoing optimisation based on performance data.",
        ],
      },
      {
        type: "closing",
        text: "Zeepo AI isn't a tool you set up and forget - it's a system that gets smarter over time. Book a live demo to see it in action with a simulated version of your own business workflow.",
      },
    ],
  },
  {
    slug: "shared-vs-vps-hosting-kenya",
    category: "Cloud Hosting",
    title: "Shared Hosting vs VPS in Kenya: Which One Does Your Business Actually Need?",
    excerpt:
      "Not all hosting is equal. We help you pick the right tier - from shared hosting at KES 350/mo to managed VPS - without overpaying for resources you'll never use.",
    readTime: "5 min read",
    date: "Apr 5, 2025",
    gradient: "from-cyan-500/20 via-primary/10 to-transparent",
    author: "Dennis Ochieng",
    authorRole: "Infrastructure Lead, Nisc Cloud",
    content: [
      {
        type: "intro",
        text: "The most common mistake Kenyan businesses make with hosting is either overspending on resources they don't need, or underspending and suffering through slow load times and downtime that costs them customers. Here's how to choose correctly.",
      },
      { type: "h2", text: "Shared Hosting: What It Is and Who It's For" },
      {
        type: "p",
        text: "Shared hosting puts your website on a server alongside hundreds of other websites. You share CPU, RAM, and bandwidth. This makes it very affordable - our shared plans start at KES 350/month - but it means your performance can be affected by other sites on the server.",
      },
      {
        type: "ul",
        items: [
          "Best for: New businesses, brochure websites, portfolios, small blogs.",
          "Monthly visitors: Up to ~10,000 monthly visitors comfortably.",
          "Typical cost: KES 350–1,200/month.",
          "Management: Fully managed - no technical knowledge required.",
        ],
      },
      {
        type: "stat-row",
        stats: [
          { value: "99.99%", label: "Uptime target on shared hosting" },
          { value: "KES 350", label: "Starting price per month" },
          { value: "24/7", label: "Support included on all plans" },
        ],
      },
      { type: "h2", text: "VPS Hosting: When You've Outgrown Shared" },
      {
        type: "p",
        text: "A Virtual Private Server gives you a dedicated slice of a physical server. Your resources are yours alone - CPU, RAM, and storage are not shared. This means consistent performance, more control, and the ability to handle significantly more traffic.",
      },
      {
        type: "ul",
        items: [
          "Best for: E-commerce stores, growing SaaS apps, high-traffic blogs, custom software.",
          "Monthly visitors: 10,000 to 500,000+ depending on configuration.",
          "Typical cost: KES 3,500–15,000/month.",
          "Management: Managed VPS available - we handle all server administration.",
        ],
      },
      {
        type: "callout",
        icon: "🏗️",
        title: "The Decision Framework",
        text: "If your site is generating revenue, getting more than 5,000 visitors/month, or running an e-commerce store, move to VPS. The performance difference is significant and slow load times directly reduce sales - Google data shows a 1-second delay reduces conversions by 7%.",
      },
      { type: "h2", text: "Migration: Moving from Shared to VPS" },
      {
        type: "p",
        text: "Migration from shared hosting to VPS sounds technical but doesn't have to be painful. Nisc Cloud handles all migrations for free when you upgrade with us. Our typical migration window is 2-4 hours with zero downtime using our staging protocol.",
      },
      {
        type: "closing",
        text: "Not sure which tier you need? Use our hosting recommendation tool or chat with our team - we'll audit your current site and recommend the right hosting for your specific traffic and use case.",
      },
    ],
  },
  {
    slug: "google-ads-vs-meta-ads-kenya-2025",
    category: "Paid Advertising",
    title: "Google Ads vs Meta Ads in Kenya: Where Should Your Marketing Budget Go?",
    excerpt:
      "We ran over KES 50 million in ad spend across both platforms. Here's what actually converts for different industries in the Kenyan market.",
    readTime: "9 min read",
    date: "Mar 30, 2025",
    gradient: "from-rose-500/20 via-primary/10 to-transparent",
    author: "Amara Oduya",
    authorRole: "Head of Paid Media, Nisc Cloud",
    content: [
      {
        type: "intro",
        text: "The Google vs Meta debate is one of the most common questions we get from new clients. After managing over KES 50 million in combined ad spend across dozens of Kenyan businesses, we have enough data to give you a definitive answer - for most industries.",
      },
      { type: "h2", text: "The Core Difference: Intent vs Interruption" },
      {
        type: "p",
        text: "Google Ads captures demand: the user is actively searching for what you sell. You show up at the moment of intent. Meta Ads (Facebook and Instagram) creates demand: the user wasn't thinking about your product, but your ad interrupts their scroll and plants the idea. Both work - but they work differently, at different stages of the customer journey.",
      },
      {
        type: "stat-row",
        stats: [
          { value: "KES 50M+", label: "Total ad spend managed by Nisc Cloud" },
          { value: "4.2x", label: "Average ROAS on Google for intent-based campaigns" },
          { value: "3.1x", label: "Average ROAS on Meta for awareness + retargeting funnels" },
        ],
      },
      { type: "h2", text: "When Google Ads Wins" },
      {
        type: "ul",
        items: [
          "High-intent services: Plumbers, lawyers, dentists, accountants, IT services - people search when they have a problem.",
          "B2B lead generation: Decision-makers research solutions on Google.",
          "E-commerce product searches: 'Buy [product] in Nairobi' type queries.",
          "Local service businesses: Google Maps ads convert extremely well for local services.",
        ],
      },
      { type: "h2", text: "When Meta Ads Wins" },
      {
        type: "ul",
        items: [
          "Fashion, beauty, and lifestyle brands - Instagram is a discovery platform.",
          "Consumer products with visual appeal - food, home décor, fitness.",
          "Events and entertainment - Facebook Events and Instagram Stories.",
          "Brand awareness at scale - cost per impression is lower than Google.",
          "Retargeting warm audiences who visited your website.",
        ],
      },
      {
        type: "callout",
        icon: "💰",
        title: "The Budget Split Framework",
        text: "For most Kenyan service businesses, we recommend starting 70% Google / 30% Meta. As you build your audience and retargeting lists, shift toward a 50/50 split. Pure e-commerce brands often do better with 60% Meta / 40% Google.",
      },
      { type: "h2", text: "The Kenya-Specific Factors" },
      {
        type: "p",
        text: "Kenya has some unique paid advertising characteristics that generic guides miss. Facebook and Instagram penetration is highest in the 25-44 urban professional demographic. WhatsApp click-to-message ads have dramatically higher engagement rates in Kenya than almost anywhere else. And Kiswahili ad creatives often outperform English creatives for reaching the broader Kenyan mass market.",
      },
      {
        type: "closing",
        text: "The honest answer is: you need both, but the right split depends entirely on your industry and customer journey. Get a free paid media audit from our team - we'll show you exactly where your KES should go.",
      },
    ],
  },
  {
    slug: "brand-consistency-social-media-kenya",
    category: "Social Media",
    title: "Brand Consistency on Social Media: The Silent Revenue Driver No One Talks About",
    excerpt:
      "Businesses that maintain consistent branding across channels earn 23% more revenue on average. Here's how to build that consistency with a small team.",
    readTime: "6 min read",
    date: "Mar 24, 2025",
    gradient: "from-pink-500/20 via-primary/10 to-transparent",
    author: "Faith Njeri",
    authorRole: "Social Media Strategist, Nisc Cloud",
    content: [
      {
        type: "intro",
        text: "You've heard that 'content is king'. What nobody tells small business owners is that consistency is the queen - and she runs the kingdom. Sporadic posting with inconsistent visuals and messaging is doing more damage to your brand than not posting at all.",
      },
      { type: "h2", text: "The Revenue Link You're Missing" },
      {
        type: "p",
        text: "Lucidpress research found that consistent brand presentation across all platforms increases revenue by an average of 23%. The mechanism is simple: consistency builds familiarity, familiarity builds trust, trust drives purchase decisions. On social media, your audience sees your content repeatedly - and every touchpoint is either reinforcing or eroding that trust.",
      },
      {
        type: "stat-row",
        stats: [
          { value: "23%", label: "Revenue increase with consistent brand presentation" },
          { value: "3-7x", label: "More touchpoints needed before a Kenyan consumer buys" },
          { value: "90%+", label: "WhatsApp open rate vs 21% for email in Kenya" },
        ],
      },
      { type: "h2", text: "The 5 Elements of Visual Consistency" },
      {
        type: "ol",
        items: [
          "Profile Photo - Same logo, same crop, across all platforms. Never use a personal photo for a business account.",
          "Cover Images / Banners - Updated seasonally but always on-brand in colour and style.",
          "Post Templates - Use 3-5 Canva or Adobe Express templates for different content types (tips, promotions, testimonials, behind-the-scenes).",
          "Colour Palette - Never deviate from your 2-3 brand colours. Ever.",
          "Typography - Stick to 1-2 fonts. Mixing fonts is the fastest way to look unprofessional.",
        ],
      },
      {
        type: "callout",
        icon: "📐",
        title: "The Content Ratio That Works",
        text: "Follow the 70-20-10 rule: 70% value content (tips, insights, behind-the-scenes), 20% community content (reposts, engagement, user stories), 10% direct promotion. Most Kenyan SMEs invert this and wonder why engagement is low.",
      },
      { type: "h2", text: "Building a Consistency System With a Small Team" },
      {
        type: "ul",
        items: [
          "Create a simple Brand Bible - one document with your logo files, colour codes (HEX, CMYK), fonts, and approved imagery style.",
          "Build 4 weeks of content templates in Canva. All team members use only these templates.",
          "Batch-create content monthly. One day per month to create 20-30 posts is more efficient than daily scrambling.",
          "Use a scheduling tool (Buffer, Later, or Meta Business Suite) to maintain a consistent posting cadence.",
          "Create a response template library for the 15 most common comments and DMs your business receives.",
        ],
      },
      {
        type: "closing",
        text: "Brand consistency isn't glamorous work, but it's the unglamorous work that builds real businesses. Our social media management packages include complete template creation, brand guidelines, and monthly content scheduling. Book a consultation to see how we can take this off your plate.",
      },
    ],
  },
  {
    slug: "email-marketing-still-works-2025",
    category: "Email Marketing",
    title: "Email Marketing Still Works - You're Just Doing It Wrong",
    excerpt:
      "42:1 ROI. Email is still the highest-returning channel in digital marketing. The problem is most businesses treat it as an afterthought. Here's the playbook.",
    readTime: "7 min read",
    date: "Mar 18, 2025",
    gradient: "from-amber-500/20 via-primary/10 to-transparent",
    author: "Kevin Mwangi",
    authorRole: "Growth Marketing Lead, Nisc Cloud",
    content: [
      {
        type: "intro",
        text: "Every few years someone declares email marketing dead. Every year it proves them wrong. In 2025, email still delivers an average return of KES 4,200 for every KES 100 spent - higher than any other digital marketing channel. The problem isn't email. The problem is how most businesses use it.",
      },
      { type: "h2", text: "Why Most Business Email Fails" },
      {
        type: "ul",
        items: [
          "Sending from a Gmail or free email address (destroys deliverability and trust).",
          "Treating email as a broadcast channel rather than a conversation.",
          "No segmentation - everyone gets the same email regardless of what they bought or how they engaged.",
          "Sending too infrequently (monthly newsletter no one remembers signing up for).",
          "No automation - manually sending emails instead of building sequences that work 24/7.",
        ],
      },
      {
        type: "stat-row",
        stats: [
          { value: "42:1", label: "Average ROI on email marketing globally" },
          { value: "4B+", label: "Daily email users worldwide in 2025" },
          { value: "347%", label: "Higher transaction rate from segmented email campaigns" },
        ],
      },
      { type: "h2", text: "The 5 Automation Sequences Every Business Needs" },
      {
        type: "ol",
        items: [
          "Welcome Sequence (5 emails, 10 days) - Introduce your brand, deliver on the lead magnet, share social proof, and make a soft offer.",
          "Abandoned Cart Recovery (3 emails, 72 hours) - Remind, reassure, and incentivise. Recovers 15-20% of abandoned carts on average.",
          "Post-Purchase Nurture (4 emails, 30 days) - Onboarding, usage tips, and a request for a review or referral.",
          "Re-engagement Campaign (3 emails) - Win back subscribers who haven't opened in 90+ days before removing them from your list.",
          "Lead Nurture Drip (8-10 emails, 6 weeks) - For B2B, nurture leads from interest to sales conversation readiness.",
        ],
      },
      {
        type: "callout",
        icon: "📧",
        title: "The Most Overlooked Email Win",
        text: "Your email signature. Every email your team sends is a marketing touchpoint. A properly designed signature with a CTA (link to book a call, latest blog post, or current promotion) generates enquiries with zero additional cost.",
      },
      { type: "h2", text: "Building Your List in Kenya" },
      {
        type: "p",
        text: "Kenyan consumers are more guarded about sharing email addresses than phone numbers (because they share phone for M-Pesa). Your lead magnet needs to deliver genuine, specific value. What works well in the Kenyan market: industry reports (e.g., 'State of Digital Marketing in Kenya 2025'), cost calculators, and exclusive discount codes. What doesn't work: generic 'Subscribe for updates' CTAs.",
      },
      {
        type: "closing",
        text: "Email marketing done right is the closest thing to a money printer in digital marketing. Our email marketing packages include platform setup, list segmentation, automation build, and monthly campaign management. Let's build your email engine.",
      },
    ],
  },
];

export const categoryColors: Record<string, string> = {
  "Brand Strategy": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "SEO / AEO / GEO": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "E-commerce": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "AI Automation": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "Cloud Hosting": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  "Paid Advertising": "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "Social Media": "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "Email Marketing": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

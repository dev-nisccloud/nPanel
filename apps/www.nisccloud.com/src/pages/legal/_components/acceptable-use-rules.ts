/** Shared by Terms §11–12 and /acceptable-use so the two documents cannot drift apart. */
export const ACCEPTABLE_USE_RULES = [
  "Host, transmit, or distribute any content that is illegal under Kenyan law or the laws of your jurisdiction;",
  "Send unsolicited bulk email (spam), phishing emails, or any other unsolicited commercial communications;",
  "Host, distribute, or link to malware, viruses, ransomware, spyware, or any other malicious code;",
  "Conduct or facilitate distributed denial-of-service (DDoS) attacks or any other form of cyberattack;",
  "Mine cryptocurrencies or engage in any activity that places excessive, unreasonable strain on shared infrastructure without prior written approval;",
  "Store or process content that infringes the intellectual property rights of any person;",
  "Host, sell, or promote pornography or other sexually explicit adult content;",
  'Run or promote scams, including Ponzi or pyramid schemes, fake investment or "get rich quick" offers, fake giveaways, and advance-fee fraud;',
  "Impersonate a genuine business, brand, government body, or person, including look-alike websites, phishing pages, and counterfeit storefronts;",
  "Host content that constitutes child sexual abuse material (CSAM)  this is a zero-tolerance policy and will result in immediate termination and reporting to relevant authorities;",
  "Engage in any form of online fraud, identity theft, or financial crime;",
  "Circumvent or attempt to circumvent any security measure, firewall, or access control;",
  "Reverse engineer, decompile, or disassemble any part of the Platform; or",
  "Use the Platform to compete directly with Nisc Cloud by reselling our infrastructure as your own unlicensed product.",
] as const;

export const PROHIBITED_CONDUCT = [
  { term: "Impersonate", text: "Nisc Cloud, our employees, partners, or any other person or entity;" },
  { term: "Scrape", text: "or systematically extract data from the Platform without our prior written consent;" },
  { term: "Create multiple Accounts", text: "to circumvent service limits, suspensions, or bans;" },
  { term: "Interfere", text: "with the proper functioning of the Platform or any other user's use of the Services;" },
  { term: "Resell", text: "or sublicense Services without an express written reseller agreement with Nisc Cloud;" },
  { term: "Use automated tools", text: "(bots, crawlers, scrapers) to access the Platform in a manner that exceeds normal human interaction rates without prior written consent;" },
  { term: "Violate", text: "any applicable law, including the Kenya Information and Communications Act, the Computer Misuse and Cybercrimes Act 2018, the Data Protection Act 2019, or any applicable anti-money laundering regulation." },
] as const;

export const ENFORCEMENT_ACTIONS = [
  "Suspend or terminate the affected Services or the entire Account;",
  "Remove or disable access to the content;",
  "Preserve relevant records and report the matter to law enforcement, regulators, the domain registry, or affected rights holders;",
  "Take legal action to protect Nisc Cloud, our infrastructure, and our Clients, and recover the costs we reasonably incur as a result.",
] as const;

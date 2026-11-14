import { LifeBuoy, Scale, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";

export interface LegalContact {
  email: string;
  label: string;
  use: string;
  icon: LucideIcon;
}

export const LEGAL_CONTACTS: LegalContact[] = [
  {
    email: "support@nisccloud.com",
    label: "Technical support",
    use: "Help with your hosting, email, servers, domains or nPanel.",
    icon: LifeBuoy,
  },
  {
    email: "compliance@nisccloud.com",
    label: "Complaints and legal",
    use: "Billing disputes, refunds, credit claims, formal notices and complaints.",
    icon: Scale,
  },
  {
    email: "abuse@nisccloud.com",
    label: "Security and abuse",
    use: "Spam, phishing, malware, scams or unauthorised access to an account.",
    icon: ShieldAlert,
  },
  {
    email: "privacy@nisccloud.com",
    label: "Privacy and data",
    use: "Data protection questions and requests to access or delete your data.",
    icon: ShieldCheck,
  },
];

export const COMPANY_ADDRESS = "Applewood, Office 805, Ngong Road, Nairobi, Kenya";
export const COMPANY_REGISTRATION = "PVT-ZQUX33PK";
export const ODPC_REGISTRATION = "160-3417-5D07";

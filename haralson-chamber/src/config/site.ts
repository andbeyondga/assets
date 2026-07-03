/**
 * Site-wide settings: name, contact info, navigation, and social links.
 * Edit here to change what shows in the header, footer, and metadata.
 * Brand colors and fonts live in src/app/theme.css.
 */
export const site = {
  name: "Greater Haralson Chamber of Commerce",
  shortName: "Greater Haralson Chamber",
  tagline: "Where west Georgia does business — Bremen, Buchanan, Tallapoosa, and Waco.",
  description:
    "The Greater Haralson Chamber of Commerce connects more than 700 member businesses across Haralson County, Georgia. Find local businesses, events, jobs, and community news.",
  /** Used for absolute URLs in metadata and the sitemap. */
  url: "https://www.haralson.org",
  phone: "(770) 537-5594",
  email: "info@haralson.org",
  address: {
    street: "70 Murphy Campus Blvd",
    city: "Waco",
    state: "GA",
    zip: "30182",
  },
  officeHours: "Monday–Friday, 9am–4pm",
  social: {
    facebook: "https://www.facebook.com/haralsonchamber",
    instagram: "https://www.instagram.com/haralsonchamber",
  },
} as const;

export interface NavItem {
  label: string;
  href: string;
}

/** Primary navigation, in display order. */
export const mainNav: NavItem[] = [
  { label: "Directory", href: "/directory" },
  { label: "Events", href: "/events" },
  { label: "Jobs", href: "/jobs" },
  { label: "News", href: "/news" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Member Login", href: "/portal" },
];

/** Secondary links surfaced in the footer. */
export const footerNav: NavItem[] = [
  { label: "Become a Member", href: "/membership" },
  { label: "Board & Staff", href: "/board-staff" },
  { label: "Programs", href: "/programs" },
  { label: "Ribbon Cuttings", href: "/ribbon-cuttings" },
  { label: "Member Directory", href: "/directory" },
  { label: "Community Events", href: "/events" },
  { label: "Local Jobs", href: "/jobs" },
  { label: "News & Spotlights", href: "/news" },
  { label: "Member Portal", href: "/portal" },
];

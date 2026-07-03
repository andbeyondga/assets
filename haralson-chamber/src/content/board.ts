/**
 * Board of directors and chamber staff.
 * This is site content (not AMS data), so it lives here rather than behind
 * the data source. Edit freely — order here is display order.
 */

export interface Person {
  name: string;
  role: string;
  /** Business or organization affiliation. */
  affiliation?: string;
  /** Directory slug when the affiliation is a chamber member. */
  memberSlug?: string;
  bio?: string;
  email?: string;
}

export const staff: Person[] = [
  {
    name: "Lena Morrow",
    role: "President & CEO",
    bio: "Lena joined the chamber in 2015 after a decade in economic development with the state. She grew up in Buchanan, and yes, she will recruit you to a committee before you finish your coffee.",
    email: "lena@haralson.org",
  },
  {
    name: "Darius Whitworth",
    role: "Membership & Events Director",
    bio: "Darius runs the luncheons, the golf classic, and every ribbon cutting in between. If you've worn a name tag at a chamber event, he printed it.",
    email: "darius@haralson.org",
  },
  {
    name: "Katie Bell Rainwater",
    role: "Communications Coordinator",
    bio: "Katie Bell writes the newsletter, keeps the directory current, and takes the photos where everyone's eyes are actually open.",
    email: "katiebell@haralson.org",
  },
];

export const board: Person[] = [
  {
    name: "Marcus Tran",
    role: "Board Chair",
    affiliation: "West Georgia Family Medicine",
    memberSlug: "west-georgia-family-medicine",
  },
  {
    name: "Renee Baskin",
    role: "Chair-Elect",
    affiliation: "Little Tallapoosa Law Group",
    memberSlug: "little-tallapoosa-law",
  },
  {
    name: "Troy Abernathy",
    role: "Treasurer",
    affiliation: "Haralson Hardware & Supply",
    memberSlug: "haralson-hardware",
  },
  {
    name: "Dana Whitfield",
    role: "Secretary",
    affiliation: "The Mill Table",
    memberSlug: "the-mill-table",
  },
  {
    name: "Gene Holloway",
    role: "Past Chair",
    affiliation: "Tallapoosa Pharmacy",
    memberSlug: "tallapoosa-pharmacy",
  },
  {
    name: "Danielle Sikes",
    role: "Events Chair",
    affiliation: "Bremen Mercantile",
    memberSlug: "bremen-mercantile",
  },
  {
    name: "Wes Segars III",
    role: "Director",
    affiliation: "Haralson Insurance Agency",
    memberSlug: "haralson-insurance",
  },
  {
    name: "Marisol Vega",
    role: "Director",
    affiliation: "Sweetwater Bakery",
    memberSlug: "sweetwater-bakery",
  },
  {
    name: "Cole Hembree",
    role: "Director",
    affiliation: "Little River Farms",
    memberSlug: "little-river-farms",
  },
];

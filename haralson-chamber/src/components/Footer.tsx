import Link from "next/link";
import { footerNav, site } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-16 bg-pine-900 text-pine-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-xl font-semibold text-cream">
              {site.shortName}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-pine-200">
              {site.tagline}
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              <a
                href={site.social.facebook}
                className="underline-offset-4 hover:text-cream hover:underline"
              >
                Facebook
              </a>
              <a
                href={site.social.instagram}
                className="underline-offset-4 hover:text-cream hover:underline"
              >
                Instagram
              </a>
            </div>
          </div>

          <nav aria-label="Footer">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-pine-300">
              Explore
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {footerNav.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    className="underline-offset-4 hover:text-cream hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-pine-300">
              Visit or call
            </p>
            <address className="mt-3 text-sm not-italic leading-relaxed text-pine-200">
              {site.address.street}
              <br />
              {site.address.city}, {site.address.state} {site.address.zip}
              <br />
              <a href={`tel:${site.phone.replace(/\D/g, "")}`} className="hover:text-cream">
                {site.phone}
              </a>
              <br />
              <a href={`mailto:${site.email}`} className="hover:text-cream">
                {site.email}
              </a>
            </address>
            <p className="mt-3 text-sm text-pine-200">{site.officeHours}</p>
          </div>
        </div>

        <p className="mt-10 border-t border-pine-800 pt-6 text-xs text-pine-300">
          © {new Date().getFullYear()} {site.name}. Proudly serving Bremen,
          Buchanan, Tallapoosa, and Waco.
        </p>
      </div>
    </footer>
  );
}

import Link from 'next/link';
import { ShopIcon } from './icons';

export const informationPages = {
  '/about': {
    eyebrow: 'Our demo story', title: 'A quieter kind of commerce.', intro: 'Sacred Commerce is an independent design and engineering exploration of considered living.',
    sections: [
      ['Objects with a point of view', 'The catalogue imagines twenty original objects in clay, brass, cotton, wood and paper. Each has its own visual identity, with a shared palette inspired by natural materials. These are fictional offerings, not goods available for purchase.'],
      ['Small rituals, thoughtful design', 'The experience is built around simple browsing, clear product information and a guest cart. It is a demonstration of storefront design and accessible interaction, created for an interview project.'],
      ['Independent by design', 'Sacred Commerce is not an official store and has no affiliation with, endorsement from, or relationship to Isha Foundation or Isha Life. All products, prices, stock and offers are sample demo content.'],
    ],
  },
  '/demo-guide': {
    eyebrow: 'Good to know', title: 'Explore at your own pace.', intro: 'A useful guide to what works here—and what a simulated purchase means.',
    sections: [
      ['Browse and build a guest cart', 'Search the twenty-product catalogue, refine by category or sample budget, and sort by price. Add available products, adjust quantities within the displayed sample stock, or remove them at any time. No stock is reserved.'],
      ['Your cart stays in this browser', 'The guest cart uses local browser storage. It survives refreshes on this device and browser, but does not follow you to another device or account. Clear cart removes the saved selection.'],
      ['Try the checkout simulation', 'Use fictional recipient, email and address details only. Choose a successful or declined simulation. A successful simulation clears the guest cart and shows a demo reference. A decline preserves it so you can try again. No payment is taken, no delivery is arranged and no order is saved to a database.'],
      ['Guest access, intentionally', 'Real sign-in, customer accounts, persisted orders and administration are disabled in this self-contained demo. There is no customer-support or fulfilment service behind this project.'],
    ],
  },
  '/privacy': {
    eyebrow: 'Privacy & local data', title: 'A little clarity about your data.', intro: 'Use fictional details throughout this independent demo. There is no need to provide personal or payment information.',
    sections: [
      ['What the guest cart stores', 'This demo saves product identifiers and quantities in localStorage in your browser. It uses the key sacred-commerce-standalone-demo-cart-v1. Clear cart removes the selection; you can also clear this site’s storage in your browser settings.'],
      ['Checkout details and payments', 'Checkout is a simulation. It does not create a database customer or order and does not process a payment. The entered fictional details are not an account profile. The form is not a place to submit real names, addresses, email addresses, card details or other sensitive information.'],
      ['Page requests and search', 'Pages, fonts and artwork are served by the hosting provider. Standard request metadata may be processed by the host. Search and filter values appear in the page URL, so avoid entering personal information into searches. No marketing analytics or advertising integrations have been added to this demo.'],
      ['Scope of this notice', 'This notice describes the current self-contained interview demo, not a real commerce service. Authentication, persisted orders and backend database operations are disabled. The project is independent of Isha Foundation and Isha Life.'],
    ],
  },
} as const;

export function InformationPage({ path }: { path: keyof typeof informationPages }) {
  const page = informationPages[path];
  return <main id="main-content" tabIndex={-1} className="container demo-main sc-info-page">
    <nav className="sc-breadcrumb" aria-label="Breadcrumb"><Link prefetch={false} href="/">Home</Link><span aria-hidden="true">/</span><span>{page.eyebrow}</span></nav>
    <div className="sc-info-layout"><div className="sc-info-intro"><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p className="sc-lead">{page.intro}</p><ShopIcon name="leaf" className="sc-info-leaf" /></div><div className="sc-info-sections">{page.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}<Link prefetch={false} className="button button-primary" href="/products">Return to the shop<ShopIcon name="arrow" /></Link></div></div>
  </main>;
}

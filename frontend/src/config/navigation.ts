export interface NavItem {
  label: string
  to: string
}

export const mainNav: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'Offers', to: '/offers' },
  { label: 'Flash Sale', to: '/flash-sale' },
  { label: 'New Arrivals', to: '/new-arrivals' },
]

export const footerShop: NavItem[] = [
  { label: 'Best Sellers', to: '/best-sellers' },
  { label: 'Trending', to: '/trending' },
  { label: 'Brands', to: '/brands' },
  { label: 'Track Order', to: '/orders' },
]

export const footerCompany: NavItem[] = [
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Blog', to: '/blog' },
]

export const footerLegal: NavItem[] = [
  { label: 'Privacy Policy', to: '/privacy-policy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Return Policy', to: '/return-policy' },
]

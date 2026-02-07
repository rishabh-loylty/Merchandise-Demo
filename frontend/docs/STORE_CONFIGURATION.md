# Store Configuration Guide

This document outlines all the configuration options available for customizing the rewards store for each partner bank.

## Overview

The store configuration system allows each partner bank (loyalty partner) to fully customize their rewards redemption store without any code changes. All configurations are stored in the `store_config` JSONB column of the `loyalty_partners` table.

## Configuration Structure

```typescript
interface StoreConfig {
  theme: ThemeConfig;
  branding: BrandingConfig;
  header: HeaderConfig;
  footer: FooterConfig;
  homepage: HomepageConfig;
  productCard: ProductCardConfig;
  productListing: ProductListingConfig;
  pointsDisplay: PointsDisplayConfig;
  components: ComponentStyles;
  features: FeaturesConfig;
  seo: SeoConfig;
  analytics: AnalyticsConfig;
  customCss: string;
}
```

---

## 1. Theme Configuration

### Colors

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `primary` | string | Main brand color | `#1e40af` |
| `primaryForeground` | string | Text on primary color | `#ffffff` |
| `secondary` | string | Secondary brand color | `#f1f5f9` |
| `secondaryForeground` | string | Text on secondary color | `#0f172a` |
| `accent` | string | Accent/highlight color | `#dbeafe` |
| `accentForeground` | string | Text on accent color | `#1e3a5f` |
| `background` | string | Page background color | `#ffffff` |
| `foreground` | string | Main text color | `#0f172a` |
| `muted` | string | Muted background | `#f1f5f9` |
| `mutedForeground` | string | Muted text color | `#64748b` |
| `card` | string | Card background | `#ffffff` |
| `cardForeground` | string | Card text color | `#0f172a` |
| `border` | string | Border color | `#e2e8f0` |
| `destructive` | string | Error/danger color | `#dc2626` |
| `success` | string | Success color | `#16a34a` |
| `warning` | string | Warning color | `#ca8a04` |

### Typography

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `fontFamily` | string | Body text font | `Inter, system-ui, sans-serif` |
| `headingFontFamily` | string | Heading font | `Inter, system-ui, sans-serif` |
| `baseFontSize` | string | Base font size | `16px` |
| `headingWeight` | string | Heading font weight | `700` |
| `bodyWeight` | string | Body font weight | `400` |
| `lineHeight` | string | Line height | `1.5` |
| `letterSpacing` | string | Letter spacing | `0` |

### Spacing

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `borderRadius` | string | Global border radius | `0.5rem` |
| `containerMaxWidth` | string | Max container width | `1280px` |
| `sectionPadding` | string | Section padding | `3rem` |
| `cardPadding` | string | Card padding | `1rem` |

---

## 2. Branding Configuration

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `storeName` | string | Store display name | `SBI Rewardz` |
| `logo` | string \| null | Logo URL (light mode) | `https://...` |
| `logoDark` | string \| null | Logo URL (dark mode) | `https://...` |
| `favicon` | string \| null | Favicon URL | `https://...` |
| `tagline` | string | Store tagline | `Redeem your points` |

---

## 3. Header Configuration

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `style` | `minimal` \| `standard` \| `centered` | Header layout style | `standard` |
| `sticky` | boolean | Sticky header on scroll | `true` |
| `showSearch` | boolean | Show search bar | `true` |
| `showPointsBalance` | boolean | Show user's points | `true` |
| `backgroundColor` | string \| null | Custom background | `null` |
| `transparent` | boolean | Transparent header | `false` |
| `navItems` | array | Custom nav items | `[{label, url}]` |

---

## 4. Footer Configuration

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `style` | `minimal` \| `standard` \| `expanded` | Footer layout | `standard` |
| `showSocialLinks` | boolean | Show social icons | `true` |
| `socialLinks.facebook` | string \| null | Facebook URL | `https://...` |
| `socialLinks.twitter` | string \| null | Twitter URL | `https://...` |
| `socialLinks.instagram` | string \| null | Instagram URL | `https://...` |
| `socialLinks.linkedin` | string \| null | LinkedIn URL | `https://...` |
| `socialLinks.youtube` | string \| null | YouTube URL | `https://...` |
| `copyrightText` | string | Copyright notice | `© 2025 SBI` |
| `quickLinks` | array | Footer links | `[{label, url}]` |
| `showNewsletter` | boolean | Newsletter form | `false` |
| `newsletterTitle` | string | Newsletter heading | `Subscribe` |
| `newsletterDescription` | string | Newsletter text | `Get updates` |
| `contactInfo.email` | string \| null | Contact email | `help@...` |
| `contactInfo.phone` | string \| null | Contact phone | `1800-...` |
| `contactInfo.address` | string \| null | Physical address | `Mumbai, IN` |

---

## 5. Homepage Configuration

The homepage is built from configurable sections. Each section has:

```typescript
interface HomepageSection {
  id: string;           // Unique identifier
  type: string;         // Section type
  enabled: boolean;     // Show/hide section
  config: object;       // Section-specific config
}
```

### Available Section Types

#### Hero Banner (`hero`)

| Property | Type | Description |
|----------|------|-------------|
| `style` | `carousel` \| `static` \| `split` \| `video` | Banner style |
| `autoRotate` | boolean | Auto-rotate slides |
| `autoRotateSpeed` | number | Rotation speed (ms) |
| `showDots` | boolean | Show navigation dots |
| `showArrows` | boolean | Show prev/next arrows |
| `height` | `small` \| `medium` \| `large` \| `full` | Banner height |
| `overlay` | boolean | Dark overlay on images |
| `overlayOpacity` | number | Overlay opacity (0-1) |
| `slides` | HeroSlide[] | Array of slides |

**Slide Configuration:**
```typescript
interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string | null;
  ctaText: string;
  ctaLink: string;
  backgroundColor: string | null;
  textColor: string | null;
  alignment: 'left' | 'center' | 'right';
}
```

#### Categories (`categories`)

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Section title |
| `subtitle` | string | Section subtitle |
| `style` | `grid` \| `carousel` \| `icons` \| `cards` | Display style |
| `showIcons` | boolean | Show category icons |
| `showImages` | boolean | Show category images |
| `maxItems` | number | Max categories shown |
| `columns` | number | Grid columns |

#### Featured Products (`featuredProducts`)

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Section title |
| `subtitle` | string | Section subtitle |
| `style` | `grid` \| `carousel` \| `list` | Display style |
| `maxItems` | number | Max products shown |
| `columns` | number | Grid columns |
| `filter` | `featured` \| `bestsellers` \| `newArrivals` \| `deals` | Product filter |
| `showViewAll` | boolean | Show "View All" link |
| `viewAllLink` | string | View all URL |

#### Trust Badges (`trustBadges`)

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Section title |
| `style` | `horizontal` \| `grid` \| `cards` | Display style |
| `badges` | TrustBadge[] | Array of badges |

**Badge Configuration:**
```typescript
interface TrustBadge {
  id: string;
  icon: string;        // Icon name (Shield, Truck, etc.)
  title: string;
  description: string;
}
```

#### Brands (`brands`)

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Section title |
| `subtitle` | string | Section subtitle |
| `style` | `grid` \| `carousel` \| `marquee` | Display style |
| `maxItems` | number | Max brands shown |
| `showNames` | boolean | Show brand names |
| `grayscale` | boolean | Grayscale logos |

#### New Arrivals (`newArrivals`)

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Section title |
| `subtitle` | string | Section subtitle |
| `style` | `grid` \| `carousel` \| `list` | Display style |
| `maxItems` | number | Max products shown |
| `daysConsideredNew` | number | Days to consider "new" |

#### Deals (`deals`)

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Section title |
| `subtitle` | string | Section subtitle |
| `showCountdown` | boolean | Show countdown timer |
| `countdownEndDate` | string \| null | Countdown end date |
| `maxItems` | number | Max deals shown |
| `style` | `grid` \| `carousel` | Display style |

#### Promotional Banner (`promotionalBanner`)

| Property | Type | Description |
|----------|------|-------------|
| `layout` | `single` \| `double` \| `triple` \| `grid` | Banner layout |
| `banners` | PromotionalBanner[] | Array of banners |
| `spacing` | string | Gap between banners |

#### Newsletter (`newsletter`)

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Section title |
| `subtitle` | string | Description text |
| `placeholder` | string | Input placeholder |
| `buttonText` | string | Submit button text |
| `backgroundColor` | string \| null | Background color |
| `showImage` | boolean | Show decorative image |
| `image` | string \| null | Image URL |

#### Testimonials (`testimonials`)

| Property | Type | Description |
|----------|------|-------------|
| `title` | string | Section title |
| `subtitle` | string | Section subtitle |
| `style` | `carousel` \| `grid` \| `masonry` | Display style |
| `testimonials` | Testimonial[] | Array of testimonials |

---

## 6. Product Card Configuration

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `showBrand` | boolean | Show brand name | `true` |
| `showRating` | boolean | Show star rating | `true` |
| `showPointsPrice` | boolean | Show points price | `true` |
| `showCurrencyPrice` | boolean | Show INR price | `true` |
| `showQuickView` | boolean | Quick view button | `false` |
| `showWishlist` | boolean | Wishlist button | `false` |
| `showAddToCart` | boolean | Add to cart button | `false` |
| `imageAspectRatio` | `square` \| `portrait` \| `landscape` \| `auto` | Image ratio | `square` |
| `hoverEffect` | `none` \| `zoom` \| `slide` \| `fade` | Image hover | `zoom` |
| `showBadges` | boolean | Show sale/new badges | `true` |
| `badgeStyle` | `rounded` \| `square` \| `pill` | Badge shape | `rounded` |

---

## 7. Product Listing Configuration

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `defaultView` | `grid` \| `list` | Default view mode | `grid` |
| `productsPerRow` | 2-6 | Products per row | `4` |
| `productsPerPage` | number | Products per page | `12` |
| `defaultSort` | `featured` \| `newest` \| `priceAsc` \| `priceDesc` \| `rating` | Default sort | `featured` |
| `showFilters` | boolean | Show filter sidebar | `true` |
| `filterPosition` | `left` \| `top` \| `drawer` | Filter position | `left` |
| `showSorting` | boolean | Show sort dropdown | `true` |
| `showViewToggle` | boolean | Grid/list toggle | `true` |
| `infiniteScroll` | boolean | Infinite scrolling | `false` |

---

## 8. Points Display Configuration

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `showPointsProminent` | boolean | Emphasize points | `true` |
| `pointsLabel` | string | Points unit label | `pts` |
| `pointsIcon` | string \| null | Custom points icon | `null` |
| `showCurrencyEquivalent` | boolean | Show INR equivalent | `true` |
| `primaryDisplay` | `points` \| `currency` \| `both` | Primary pricing | `points` |
| `conversionFormat` | string | Conversion text format | `1 pt = ₹{rate}` |

---

## 9. Component Styles

### Buttons

| Property | Type | Options |
|----------|------|---------|
| `borderRadius` | string | `0`, `0.25rem`, `0.5rem`, etc. |
| `style` | string | `solid`, `outline`, `ghost`, `link` |
| `size` | string | `sm`, `md`, `lg` |
| `textTransform` | string | `none`, `uppercase`, `capitalize` |

### Cards

| Property | Type | Options |
|----------|------|---------|
| `borderRadius` | string | CSS border-radius value |
| `shadow` | string | `none`, `sm`, `md`, `lg`, `xl` |
| `border` | boolean | Show border |
| `hoverEffect` | string | `none`, `lift`, `shadow`, `border`, `scale` |

### Inputs

| Property | Type | Options |
|----------|------|---------|
| `borderRadius` | string | CSS border-radius value |
| `style` | string | `outline`, `filled`, `underline` |

---

## 10. Features Configuration

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `wishlist` | boolean | Enable wishlist | `false` |
| `compare` | boolean | Enable product compare | `false` |
| `quickView` | boolean | Enable quick view modal | `false` |
| `socialSharing` | boolean | Enable share buttons | `true` |
| `recentlyViewed` | boolean | Show recently viewed | `true` |
| `productReviews` | boolean | Show reviews | `true` |
| `searchSuggestions` | boolean | Search autocomplete | `true` |
| `recentSearches` | boolean | Save recent searches | `true` |

---

## 11. SEO Configuration

| Property | Type | Description |
|----------|------|-------------|
| `metaTitle` | string | Page title |
| `metaDescription` | string | Meta description |
| `ogImage` | string \| null | Open Graph image |
| `keywords` | string[] | Meta keywords |

---

## 12. Analytics Configuration

| Property | Type | Description |
|----------|------|-------------|
| `googleAnalyticsId` | string \| null | GA tracking ID |
| `googleTagManagerId` | string \| null | GTM container ID |
| `facebookPixelId` | string \| null | FB Pixel ID |
| `customScripts` | string | Custom tracking scripts |

---

## 13. Custom CSS

The `customCss` field accepts raw CSS that will be injected into the store pages. Use this for advanced customizations not covered by the configuration options.

```css
/* Example custom CSS */
.hero-section {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
}

.product-card:hover {
  transform: scale(1.02);
}
```

---

## API Endpoints

### Get Store Config
```
GET /api/partners/{partnerId}/store-config
```

### Update Store Config (Partial)
```
PATCH /api/partners/{partnerId}/store-config
Body: { store_config: { ... } }
```

### Replace Store Config (Full)
```
PUT /api/partners/{partnerId}/store-config
Body: { store_config: { ... } }
```

---

## Admin UI

Access the store configuration admin panel at:
```
/admin/store-config
```

Features:
- Visual color pickers
- Live preview of changes
- Section reordering with drag-and-drop
- Toggle switches for features
- Font and typography selectors
- Homepage section builder

---

## Example Configuration

```json
{
  "theme": {
    "colors": {
      "primary": "#00457c",
      "primaryForeground": "#ffffff",
      "accent": "#e6f0f7"
    },
    "typography": {
      "fontFamily": "Inter, system-ui, sans-serif",
      "headingFontFamily": "Inter, system-ui, sans-serif"
    },
    "borderRadius": "0.5rem"
  },
  "branding": {
    "storeName": "SBI Rewardz",
    "tagline": "Redeem your SBI reward points"
  },
  "homepage": {
    "sections": [
      {
        "id": "hero-1",
        "type": "hero",
        "enabled": true,
        "config": {
          "style": "carousel",
          "slides": [
            {
              "title": "Welcome to SBI Rewardz",
              "subtitle": "Redeem your points for exclusive products",
              "ctaText": "Start Shopping",
              "ctaLink": "/store/search"
            }
          ]
        }
      }
    ]
  }
}
```

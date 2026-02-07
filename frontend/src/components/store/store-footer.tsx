"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useStoreConfig, useBranding } from "@/context/store-config-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

interface StoreFooterProps {
  className?: string;
}

export function StoreFooter({ className }: StoreFooterProps) {
  const { config } = useStoreConfig();
  const branding = useBranding();
  const { footer } = config;

  const {
    style,
    showSocialLinks,
    socialLinks,
    copyrightText,
    quickLinks,
    showNewsletter,
    newsletterTitle,
    newsletterDescription,
    contactInfo,
  } = footer;

  const [email, setEmail] = React.useState("");
  const [subscribed, setSubscribed] = React.useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Mock subscription
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  // Social icons mapping
  const socialIconMap = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
  };

  const activeSocialLinks = showSocialLinks
    ? Object.entries(socialLinks)
        .filter(([_, url]) => url)
        .map(([key, url]) => ({
          key,
          url: url as string,
          Icon: socialIconMap[key as keyof typeof socialIconMap],
        }))
    : [];

  const hasContactInfo =
    contactInfo?.email || contactInfo?.phone || contactInfo?.address;

  if (style === "minimal") {
    return (
      <MinimalFooter
        branding={branding}
        copyrightText={copyrightText}
        socialLinks={activeSocialLinks}
        className={className}
      />
    );
  }

  if (style === "expanded") {
    return (
      <ExpandedFooter
        branding={branding}
        copyrightText={copyrightText}
        socialLinks={activeSocialLinks}
        quickLinks={quickLinks}
        contactInfo={contactInfo}
        showNewsletter={showNewsletter}
        newsletterTitle={newsletterTitle}
        newsletterDescription={newsletterDescription}
        email={email}
        setEmail={setEmail}
        subscribed={subscribed}
        onNewsletterSubmit={handleNewsletterSubmit}
        className={className}
      />
    );
  }

  // Standard Footer (default)
  return (
    <footer
      className={cn(
        "border-t border-border bg-card",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/store" className="flex items-center gap-2 mb-4">
              {branding.logo ? (
                <Image
                  src={branding.logo}
                  alt={branding.storeName}
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <ShoppingBag className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <span className="text-lg font-bold text-foreground">
                {branding.storeName}
              </span>
            </Link>
            {branding.tagline && (
              <p className="text-sm text-muted-foreground mb-4">
                {branding.tagline}
              </p>
            )}

            {/* Social Links */}
            {activeSocialLinks.length > 0 && (
              <div className="flex gap-3">
                {activeSocialLinks.map(({ key, url, Icon }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    aria-label={key}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {quickLinks.length > 0 && (
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.url}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          {hasContactInfo && (
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                Contact Us
              </h3>
              <ul className="space-y-3">
                {contactInfo?.email && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    <a
                      href={`mailto:${contactInfo.email}`}
                      className="hover:text-primary transition-colors"
                    >
                      {contactInfo.email}
                    </a>
                  </li>
                )}
                {contactInfo?.phone && (
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 text-primary" />
                    <a
                      href={`tel:${contactInfo.phone}`}
                      className="hover:text-primary transition-colors"
                    >
                      {contactInfo.phone}
                    </a>
                  </li>
                )}
                {contactInfo?.address && (
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <span>{contactInfo.address}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Newsletter */}
          {showNewsletter && (
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                {newsletterTitle || "Newsletter"}
              </h3>
              {newsletterDescription && (
                <p className="mb-4 text-sm text-muted-foreground">
                  {newsletterDescription}
                </p>
              )}
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" size="sm">
                  {subscribed ? "Subscribed!" : "Subscribe"}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-border pt-8 text-center">
          <p className="text-sm text-muted-foreground">{copyrightText}</p>
        </div>
      </div>
    </footer>
  );
}

// Minimal Footer
function MinimalFooter({
  branding,
  copyrightText,
  socialLinks,
  className,
}: {
  branding: { storeName: string; logo: string | null };
  copyrightText: string;
  socialLinks: Array<{ key: string; url: string; Icon: React.ComponentType<{ className?: string }> }>;
  className?: string;
}) {
  return (
    <footer className={cn("border-t border-border bg-card py-6", className)}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {branding.logo ? (
            <Image
              src={branding.logo}
              alt={branding.storeName}
              width={24}
              height={24}
              className="h-6 w-auto"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <ShoppingBag className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
          )}
          <span className="text-sm text-muted-foreground">{copyrightText}</span>
        </div>

        {socialLinks.length > 0 && (
          <div className="flex gap-4">
            {socialLinks.map(({ key, url, Icon }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label={key}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}

// Expanded Footer
function ExpandedFooter({
  branding,
  copyrightText,
  socialLinks,
  quickLinks,
  contactInfo,
  showNewsletter,
  newsletterTitle,
  newsletterDescription,
  email,
  setEmail,
  subscribed,
  onNewsletterSubmit,
  className,
}: {
  branding: { storeName: string; logo: string | null; tagline: string };
  copyrightText: string;
  socialLinks: Array<{ key: string; url: string; Icon: React.ComponentType<{ className?: string }> }>;
  quickLinks: Array<{ label: string; url: string }>;
  contactInfo: { email: string | null; phone: string | null; address: string | null };
  showNewsletter: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  email: string;
  setEmail: (email: string) => void;
  subscribed: boolean;
  onNewsletterSubmit: (e: React.FormEvent) => void;
  className?: string;
}) {
  const hasContactInfo =
    contactInfo?.email || contactInfo?.phone || contactInfo?.address;

  // Additional link sections for expanded footer
  const categories = [
    { label: "Electronics", url: "/store/search?category=electronics" },
    { label: "Fashion", url: "/store/search?category=fashion" },
    { label: "Home & Living", url: "/store/search?category=home" },
    { label: "Kitchen", url: "/store/search?category=kitchen" },
  ];

  const support = [
    { label: "FAQs", url: "/faqs" },
    { label: "Shipping Info", url: "/shipping" },
    { label: "Returns Policy", url: "/returns" },
    { label: "Track Order", url: "/track-order" },
  ];

  return (
    <footer className={cn("border-t border-border bg-muted/30", className)}>
      {/* Newsletter Banner */}
      {showNewsletter && (
        <div className="border-b border-border bg-primary/5">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {newsletterTitle || "Subscribe to our newsletter"}
                </h3>
                {newsletterDescription && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {newsletterDescription}
                  </p>
                )}
              </div>
              <form
                onSubmit={onNewsletterSubmit}
                className="flex w-full max-w-md gap-2"
              >
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit">
                  {subscribed ? "Subscribed!" : (
                    <>
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/store" className="flex items-center gap-2 mb-4">
              {branding.logo ? (
                <Image
                  src={branding.logo}
                  alt={branding.storeName}
                  width={48}
                  height={48}
                  className="h-12 w-auto"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                </div>
              )}
              <span className="text-xl font-bold text-foreground">
                {branding.storeName}
              </span>
            </Link>
            {branding.tagline && (
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {branding.tagline}
              </p>
            )}

            {/* Contact Info */}
            {hasContactInfo && (
              <div className="space-y-2 mb-6">
                {contactInfo?.email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {contactInfo.email}
                  </a>
                )}
                {contactInfo?.phone && (
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {contactInfo.phone}
                  </a>
                )}
                {contactInfo?.address && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    {contactInfo.address}
                  </p>
                )}
              </div>
            )}

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map(({ key, url, Icon }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-muted-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    aria-label={key}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Categories
            </h3>
            <ul className="space-y-3">
              {categories.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.url}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.url}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Support
            </h3>
            <ul className="space-y-3">
              {support.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.url}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-xs text-muted-foreground">{copyrightText}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="hover:text-primary transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default StoreFooter;

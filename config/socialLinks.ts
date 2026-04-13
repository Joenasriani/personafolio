/**
 * Social Links Configuration
 * ===========================
 * Add or update your social media profile URLs here.
 *
 * How to use:
 *  - Set the `url` for any platform you want to display.
 *  - Leave `url` as an empty string ("") or undefined to hide that platform's icon.
 *  - The `label` is used for the accessible tooltip/title on each icon link.
 *
 * Example:
 *   github: { url: "https://github.com/your-username", label: "GitHub" },
 *   linkedin: { url: "https://linkedin.com/in/your-username", label: "LinkedIn" },
 *
 * Supported platforms: github, linkedin, twitter, instagram, youtube, facebook, tiktok, email, website
 */

export interface SocialLink {
  url: string;
  label: string;
}

export interface SocialLinksConfig {
  github?: SocialLink;
  linkedin?: SocialLink;
  twitter?: SocialLink;
  instagram?: SocialLink;
  youtube?: SocialLink;
  facebook?: SocialLink;
  tiktok?: SocialLink;
  email?: SocialLink;
  website?: SocialLink;
}

const socialLinks: SocialLinksConfig = {
  github: {
    url: "https://github.com/Joenasriani/personafolio",
    label: "GitHub",
  },
  linkedin: {
    url: "",
    label: "LinkedIn",
  },
  twitter: {
    url: "",
    label: "X / Twitter",
  },
  instagram: {
    url: "",
    label: "Instagram",
  },
  youtube: {
    url: "",
    label: "YouTube",
  },
  facebook: {
    url: "",
    label: "Facebook",
  },
  tiktok: {
    url: "",
    label: "TikTok",
  },
  email: {
    url: "",
    label: "Email",
  },
  website: {
    url: "",
    label: "Website",
  },
};

export default socialLinks;

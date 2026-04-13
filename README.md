# personafolio
Collect your online data

## Social Links

Social media profile links are managed from a single file:

```
config/socialLinks.ts
```

### Adding or updating a link

Open `config/socialLinks.ts` and set the `url` for any platform you want to display:

```ts
const socialLinks: SocialLinksConfig = {
  github:    { url: "https://github.com/your-username",          label: "GitHub"    },
  linkedin:  { url: "https://linkedin.com/in/your-username",     label: "LinkedIn"  },
  twitter:   { url: "https://x.com/your-handle",                 label: "X / Twitter" },
  instagram: { url: "https://instagram.com/your-handle",         label: "Instagram" },
  youtube:   { url: "https://youtube.com/@your-channel",         label: "YouTube"   },
  facebook:  { url: "https://facebook.com/your-page",            label: "Facebook"  },
  tiktok:    { url: "https://tiktok.com/@your-handle",           label: "TikTok"    },
  email:     { url: "you@example.com",                           label: "Email"     },
  website:   { url: "https://your-website.com",                  label: "Website"   },
};
```

- Leave `url` as an empty string (`""`) to **hide** that platform's icon.
- Icons automatically open in a new tab with `rel="noopener noreferrer"`.
- Email addresses are automatically prefixed with `mailto:` if needed.

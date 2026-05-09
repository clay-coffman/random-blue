# E2E test assets

Synthetic fixtures used by manual / scripted end-to-end runs of the
founder flow. None of these represent a real Utah filing or a real
person — they exist purely to exercise the upload pipeline on
`/companies/<slug>/claim`, profile-image inputs, etc.

## Files

- `priya-llc-articles.pdf` — fake Utah Articles of Organization for
  "Cascade Forge Labs, LLC" (Priya Shah, organizer). Source:
  `_llc-articles.html` → `weasyprint`. Use for the ownership-doc
  upload step in the claim flow.
- `priya-ein-letter.pdf` — fake IRS CP 575 EIN assignment letter for
  the same LLC. Source: `_ein-letter.html` → `weasyprint`. Alternate
  accepted document type.
- `priya-headshot.png` — 256×256 solid placeholder for any
  profile-image input.
- `priya-company-logo.png` — 512×256 solid placeholder for any
  company-logo input.

## Regenerating

```bash
weasyprint _llc-articles.html priya-llc-articles.pdf
weasyprint _ein-letter.html priya-ein-letter.pdf
magick -size 256x256 xc:'#4A90E2' priya-headshot.png
magick -size 512x256 xc:'#0F766E' priya-company-logo.png
```

Edit the `_*.html` sources and rerun if a finding requires different
wording (e.g. testing OCR or document validation).

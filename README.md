# LS Facilitator

A free, open-source facilitation companion for the [33 Liberating Structures](https://www.liberatingstructures.com). Helps facilitators and teams choose the right structure, set up sessions with participant names and group assignments, and run them with live timers, phase-by-phase guidance, and a built-in facilitator guide.

**No accounts. No personal data collected. No backend. Just open the app and facilitate.**

→ **[Try it live](https://luizhrs.github.io/liberating-structures-facilitator)**

Built by [Luiz Santana](https://github.com/luizhrs) · [LinkedIn](https://www.linkedin.com/in/luiz-hrsantana/) · [Substack](https://luizhrsantana.substack.com/)

---

## Features

- **Browse all 33 Liberating Structures** — searchable and filterable by purpose, complexity, duration, and online/in-person suitability
- **AI-powered recommender** — describe your challenge, group size, and available time; get matched structures in seconds. Works with or without an API key
- **Session setup wizard** — set your meeting mode (in-person, virtual, or hybrid), choose your language style, and add participant names
- **Smart group generator** — randomly assigns participants to groups each phase, with hybrid-aware mixing of online and in-room members
- **Live session runner** — phase-by-phase countdown timer with pause/resume, plain English or LS terminology toggle, and a built-in structure guide that pauses the timer when opened
- **Display customisation** — seven themes and five font size options, saved to your device
- **Fully offline after first load** — no server needed once the page has loaded
- **WCAG 2.2 Level AA compliant** — built to meet UK public sector accessibility requirements
- **Works on any device** — responsive for laptop, tablet, and phone

---

## Customisation

The **Aa** button in the top-right corner of the header opens the display settings panel. Your choices are saved to your browser automatically — nothing leaves your device.

### Themes

| Theme | Description |
|---|---|
| System | Follows your operating system's light or dark preference (default) |
| Light | Always light, regardless of OS setting |
| Dark | Always dark, regardless of OS setting |
| Warm | Cream and amber tones — easy on the eyes for long sessions |
| Forest | Deep greens — calm and focused |
| Ocean | Dark navy — crisp and professional |
| High contrast | Black background with yellow accents — maximum readability |

The app reads your OS preference automatically on first visit. If you've never touched the theme setting, you'll get light or dark mode matching your device.

### Text size

Five sizes are available: S, M (default), L, XL, and XXL. All spacing and layout scales with the text, so the full interface adjusts — not just the font.

### How preferences are stored

Display preferences (theme and font size) are saved in your browser's `localStorage`. This stores a single small object like `{"theme":"warm","fontSize":1.125}` — no personal data, no session content, nothing that identifies you. It works like a preference cookie that stays entirely on your device. Closing the tab or clearing your browser will reset it to defaults.

This is separate from the app's "no data" promise, which covers facilitation content: participant names, session choices, and anything typed into the app disappear the moment you close the tab.

---

## Privacy

This app is designed to be trustworthy by default.

- **No server** — the app is a static site with no backend
- **No analytics** — no tracking scripts, no page view counts, no user behaviour data
- **No accounts** — nothing to sign up for or log in to
- **No session data stored** — participant names, group assignments, and session choices exist only in memory while the tab is open
- **No cookies** — the only browser storage used is `localStorage` for display preferences (theme and font size), which contain no personal information
- **Gemini API key** — if you add one for AI recommendations, it goes directly from your browser to Google's API. It is never sent to any other server and is not stored anywhere after the tab closes

---

## Accessibility — WCAG 2.2 Level AA

This app is built to meet [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/), the standard required by the UK Public Sector Bodies Accessibility Regulations 2018.

### What's been implemented

**Perceivable**
- All decorative SVG icons are hidden from assistive technology (`aria-hidden="true"`)
- Colour is never the only way to convey information — the timer shows "Time's up" in text when it expires, and hybrid participant chips use both colour and emoji
- All text colours pass 4.5:1 contrast ratio on their backgrounds
- All form element borders pass 3:1 non-text contrast (WCAG 1.4.11)
- Text can be resized up to 200% via the font size control without loss of content

**Operable**
- A "Skip to main content" link is the first focusable element on every page (WCAG 2.4.1)
- All functionality is accessible by keyboard alone
- Focus is managed correctly when the help overlay opens and closes — focus moves into the panel, and returns to the trigger button on close
- The help overlay has a keyboard focus trap and can be dismissed with Escape
- All interactive touch targets are at least 24×24px (WCAG 2.5.8)
- Every screen change updates the browser page title (WCAG 2.4.2)
- Sticky header uses `scroll-padding-top` so focused elements are never hidden behind it (WCAG 2.4.11)

**Understandable**
- Page language is set to `lang="en-GB"`
- All form inputs have visible, associated `<label>` elements — no placeholder-only labels
- Status changes (timer completing, groups reshuffling, recommendations loading) are announced via `aria-live` regions
- Error messages use `role="alert"` for immediate announcement

**Robust**
- The help overlay uses `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`
- All buttons with visual-only icons have descriptive `aria-label` attributes
- External links that open in new tabs include a screen-reader-only "(opens in new tab)" notice
- Purpose toggle buttons use `aria-pressed` to communicate their state
- Phase navigation dots use `role="tab"` and `aria-selected`

**Animations**
- All animations respect `prefers-reduced-motion` — users who have set this OS preference will see no motion

### Known limitations

- The Gemini AI recommender requires a network request to Google's API, which is outside the scope of this app's accessibility controls
- The 25/10 Crowd Sourcing structure is noted as in-person only, as it relies on physical card passing

If you encounter an accessibility issue, please [open an issue on GitHub](https://github.com/luizhrs/liberating-structures-facilitator/issues).

---

## Getting started

### Option 1 — GitHub Codespaces (recommended, no local setup)

1. Click **Code → Codespaces → Create codespace on main** on the GitHub repo page
2. Wait about 60 seconds for the container to build
3. The dev server starts automatically; a browser preview opens at port 5173

### Option 2 — Local setup

```bash
# Clone the repo
git clone https://github.com/luizhrs/liberating-structures-facilitator.git
cd liberating-structures-facilitator

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## Deploying to GitHub Pages

The repo includes a GitHub Actions workflow that deploys automatically on every push to `main`.

**One-time setup:**

1. Go to your repo → **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the site deploys in about two minutes

Your app will be live at `https://YOUR_USERNAME.github.io/liberating-structures-facilitator`

---

## Project structure

```
src/
├── components/
│   ├── DisplaySettings.tsx       ← Theme and font size panel
│   ├── RecommenderScreen.tsx     ← Structure recommendation form
│   ├── SessionRunner.tsx         ← Live session timer and guide
│   ├── SessionSetup.tsx          ← Pre-session wizard (mode, names, language)
│   └── StructureCard.tsx         ← Card shown in browse and recommendations
├── data/
│   └── structures.json           ← All 33 Liberating Structures (the heart of the app)
├── hooks/
│   └── useTimer.ts               ← Countdown timer hook
├── lib/
│   ├── groups.ts                 ← Random group generator (hybrid-aware)
│   ├── recommender.ts            ← Rule-based + Gemini AI recommender
│   └── theme.ts                  ← Theme management and localStorage
├── App.module.css                ← App layout styles
├── App.tsx                       ← Main app and screen routing
├── index.css                     ← Design tokens, all 7 themes, global resets
├── main.tsx                      ← React entry point
└── types.ts                      ← TypeScript type definitions
```

The most impactful file to edit is `src/data/structures.json`. Each of the 33 structures has:

- `lsNumber` — official LS number (1–33)
- `lsUrl` — slug for the official liberatingstructures.com page
- `name`, `nickname` — display names
- `time`, `minParticipants`, `maxParticipants` — session parameters
- `complexity` — `basic`, `intermediate`, or `advanced`
- `purposes` — array of tags used by the recommender
- `online` — whether it works in virtual sessions
- `desc`, `when` — description and usage guidance
- `structuralInvitation` — the opening prompt you say to the group
- `phases` — array of steps with `instruction` (LS wording) and `friendlyInstruction` (plain English)
- `tips` — facilitator tips and traps
- `attribution` — credit for the original structure

---

## Contributing

Contributions are welcome. Here is what is most useful:

### Improving structure data

The single most impactful contribution is improving `src/data/structures.json` — better instructions, additional tips and traps, or more accurate timing. If you have facilitated these structures and have sharper guidance, please open a pull request.

### Translating the app

The `friendlyInstruction` field in each phase is the most translation-ready part of the data. The UI strings are in the React components. If you would like to add a language, open an issue to discuss the approach.

### Adding new features

Ideas that would be valuable:

- **String builder** — chain multiple structures into a complete session arc with total time calculation
- **Print/export** — generate a printable session plan as PDF
- **Participant view** — a separate URL that participants can open on their phones to see the current phase and instruction
- **Keyboard shortcuts** — Space to pause/resume, arrow keys to navigate phases

### Running the app

```bash
npm run dev       # Start dev server at localhost:5173
npm run build     # Production build to dist/
npm run typecheck # TypeScript type checking
npm run lint      # ESLint
```

---

## About the author

Built by **[Luiz Santana](https://github.com/luizhrs)** — exploring tech for good, digital transformation, and public sector innovation. Brazilian, based in Manchester, MSc Digital & Tech Solutions.

- GitHub: [github.com/luizhrs](https://github.com/luizhrs)
- LinkedIn: [linkedin.com/in/luiz-hrsantana](https://www.linkedin.com/in/luiz-hrsantana/)
- Substack: [luizhrsantana.substack.com](https://luizhrsantana.substack.com/)

---

## Acknowledgements

Liberating Structures were developed by **Henri Lipmanowicz** and **Keith McCandless**. This app is an independent facilitation tool — not affiliated with or endorsed by the Liberating Structures network. Please visit [liberatingstructures.com](https://www.liberatingstructures.com) to learn more, explore the full canon, and support their work.

---

## Licence

[MIT](./LICENSE) — free to use, fork, adapt, and build on.

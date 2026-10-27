# GitHub Copilot AI usage viewer

[![CI and deploy](https://github.com/amgdy/github-copilot-ai-usage-viewer/actions/workflows/pages.yml/badge.svg)](https://github.com/amgdy/github-copilot-ai-usage-viewer/actions/workflows/pages.yml)

A report viewer for the GitHub Copilot **AI credits usage report** (the CSV export from GitHub billing). Drop one or more files in and you get an interactive management view: how much is used and billed, who uses what, how the shared included credits behave, which users and models drive cost, which seats are idle, and a list of recommendations ordered by impact, each with an estimated saving and official GitHub and Microsoft links.

**Try it:** [amgdy.github.io/github-copilot-ai-usage-viewer](https://amgdy.github.io/github-copilot-ai-usage-viewer/). Choose **View a sample report** to see every page with made-up data, or drop in your own file.

Nothing is uploaded. The CSV is read and analyzed in your browser (in a Web Worker). There is no backend and no network call after the page has loaded, except the live price check that you start yourself in Settings.

The app is in **English** (the main language) and **Arabic** (right-to-left), and every number has an info button that explains how it was calculated.

The interface has its own calm look, like a printed company report: ink on warm paper with one petrol color, set in Mona Sans by GitHub and IBM Plex Sans Arabic. Both fonts are bundled, so the report looks the same offline, in light and dark modes.

This is an independent open source project. It is not made by, connected to or endorsed by GitHub or Microsoft. GitHub, GitHub Copilot and Microsoft are trademarks of their owners, and their names and logos are used only to name the products.

- [docs/FEATURES.md](docs/FEATURES.md): what the app does and the key values for admins, in plain language.
- [CONTRIBUTING.md](CONTRIBUTING.md): how to set up the project and send a change.
- [AGENTS.md](AGENTS.md): how the project is organized and the rules for changing it.

## Quick start

```bash
git clone https://github.com/amgdy/github-copilot-ai-usage-viewer.git
cd github-copilot-ai-usage-viewer
npm install
npm run dev            # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload. |
| `npm run build` | Type-check and build to `dist/` (code-split, one lazy chunk per page). |
| `npm run build:single` | Build **one self-contained `dist/index.html`**. Open it from disk, email it, or put it on any static host. Works offline and from `file://`. |
| `npm run preview` | Serve the production build locally. |
| `npm test` | Run the Vitest suite (`tests/`). |
| `npm run typecheck` | Check types twice: `tsconfig.app.json` for the app in `src/` and `tsconfig.node.json` for the tests, scripts and Vite config. |
| `npm run gen:demo` | Write the made-up demo CSV to `demo-data/demo-usage-report.csv` (add `-- --seed 42` or `-- --random`). |
| `npm run check:prices` | Compare the built-in model price card with the live GitHub Docs pricing page. |

Requires Node 26. The `.nvmrc` file holds the version for tools such as nvm and fnm. The `gen:demo` and `check:prices` scripts run their TypeScript files directly with Node, so they need no extra tool.

## Loading data

The start page has two ways in:

- **Drop or choose** one or more usage CSV files (and, in the same drop, a license list).
- **View a sample report** to see every page before you load your own file. The sample is made up in your browser from invented people, organizations and numbers. It reads no file, and no report data is built into the app. While the sample is open, every page says so, and your saved license list is left out so no real names mix with invented data. Settings and Licenses say so too, and the sample's invented users can't be saved into your license list. Open your own report at any time to replace it.

The same generator can write the sample as a file for tests and for people who work on the app: `npm run gen:demo` (or `npm run gen:demo -- --random`) writes `demo-data/demo-usage-report.csv`. The folder is ignored by Git and holds made-up data only.

Several files are merged. A row that appears in more than one file with identical values is dropped once, so overlapping exports do not double count (the Data page lists duplicates per file). **Load other data** in the sidebar returns to the start page without losing the current dataset; **Back** returns to it.

### Where to get the files

- **Usage report (required):** in GitHub, open Billing and licensing, then the AI usage page, and choose Get usage report. GitHub emails you a link to the CSV.
- **License list (recommended):** for most admins, use the [GitHub Copilot activity report](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/administer-copilot/download-activity-report) (CSV). No CLI is needed. In an organization, open Settings, then GitHub Copilot, Access, Get usage report and Get activity report. In an enterprise, open Billing and licensing, then Licensing and Get activity report. It adds activity details for seat review, but has no plan or seat start date. Check that the file covers the same organization or enterprise as your usage report and compare its seat count with GitHub. A CSV can have missing seats, and the app cannot identify omitted seats. Load it on the Licenses page, the Data page or together with the usage report.
- **Other license files:** the [GitHub Copilot user management REST API](https://docs.github.com/en/rest/copilot/copilot-user-management) (JSON), seats CSV, or a plain list of logins are also supported. The API is an advanced option for plans, seat start dates, pending cancellations or repeatable exports. Both the activity report and API use a 90-day activity window. New seats and activity older than 90 days can have a blank activity date; blank does not mean never used.
- **Settings file (optional):** exported from the Settings page, to share your budget, thresholds, seat list and price overrides.

The Data page also lists other GitHub exports that add context (usage metrics, cost centers, teams, budgets), what each adds, and how to get it.

### Advanced: export seat assignments with the GitHub CLI

Most admins can use the activity report above instead. Use the seats API when you need the assignment details it includes, or want a repeatable export. The API does not extend the 90-day activity window. Check that the result covers the right organization or enterprise and compare the number of seats with GitHub.

An administrator with access to the relevant organization or enterprise can export all pages of seat assignments:

```bash
gh api --paginate "/orgs/ORG/copilot/billing/seats?per_page=100" > seats.json
# Or, for the whole enterprise:
gh api --paginate "/enterprises/ENTERPRISE/copilot/billing/seats?per_page=100" > seats.json
```

Replace `ORG` or `ENTERPRISE` with your GitHub name. Import the resulting file into the app; do not paste a token into it. Export all pages, use the same billing scope as the usage report, and check the import preview before replacing the current list. A current list does not prove which seats existed in past months.

### Expected columns

```
date, username, product, sku, model, quantity, unit_type, applied_cost_per_quantity,
gross_amount, discount_amount, net_amount, total_monthly_quota, organization,
app_client_id, repository, cost_center_name, aic_quantity, aic_gross_amount,
input, output, cache_read, cache_write
```

The parser handles the UTF-8 BOM, quoted fields, CRLF, and numbers in scientific notation, and it accepts common header variants (`user`, `login`, `ai_credits`, `cost_center`, ...). Only a `date` column and either `gross_amount` or `quantity` are required; any other missing column is listed on the Data page and the views that need it say so, instead of the file being rejected. Notes on the format:

- `date` is normally `2026-10-03`. The parser also reads `2026/10/03`, `10/3/2026` (month first), `25/10/2026` (day first, when only that reading is possible), `Oct 3, 2026` and `3 Oct 2026`, with or without a time. Only the calendar date is used, so the result does not depend on your time zone. Rows with an unreadable date are skipped and counted on the Data page.
- `quantity` is AI credits; **1 credit = 0.01 USD**. `gross = quantity × 0.01 = discount + net`.
- `discount_amount` is the part **covered by included credits** of the seats; `net_amount` is **billed**.
- `username` is blank for repository-level products (such as code quality). Those rows still use included credits and are shown as one unattributed entry.
- Auto model selection appears as `Auto: <model>` and is split into a model plus an "Auto" flag. The Auto discount is already inside `quantity`, so the app works out the original price from it.
- The `aic_*` columns duplicate the credit columns and are ignored.
- Token columns (`input`, `output`, `cache_read`, `cache_write`) are optional. With them, every user and model shows input, output, cache read and cache write tokens; without them the app uses the credit totals and hides cache and token figures.

## What is in the app

| Page | What you get |
| --- | --- |
| **Overview** | Headline verdict, key figures with trend, usage over time (covered vs billed, by tier, vendor or product), included credits status, savings still possible, the Auto discount received, top recommendations, segment mix, top users and model groups. |
| **Usage and pool** | Usage over time, monthly pool burn-down with a projected month end, monthly table, cost drivers, SKU table, budget tracking and a plain explanation of how billing works. |
| **Users** | Rankings by any metric, concentration (Lorenz curve and A/B/C classes), usage vs active days, users who need attention (runaway users, most to gain, fading, new), idle seats, a full sortable table with input, output, cache read and cache write tokens, and a **user drawer** with a profile, trend, models, Auto use and personal tips. |
| **Segments** | User groups side by side (persona, usage tier, engagement, lifecycle, usage profile, Auto use), a cross-group matrix, pool flow (who lends and who borrows credits) and the rules behind each group with live thresholds. |
| **Models** | Model ranking, model group and vendor split, models over time, Auto vs hand-picked models, the Auto discount (paid price vs original price), a model table with tokens, right-sizing ideas, and the price card in use with its date. |
| **Efficiency** | Scorecard from best to worst, savings levers and their combined effect, tokens and cache reuse (read and write), cost per active day, role models and a playbook. |
| **Organization** | Any dimension (organization, cost center, repository, app) as ranking and treemap, showback and chargeback, users without a cost center. |
| **Patterns** | Daily timeline with unusual days marked, weekday profile, calendar heatmap, adoption curve, unusual days table, lapsed and fading users, month table. |
| **Recommendations** | Recommendations ordered by impact, with filters, a **what-if simulator** that recomputes cost live, seat actions, the playbook and official links for each step. |
| **Licenses** | Seats from your license list: who uses them, who does not, last activity, seats you can free up and what they cost, and seats with no usage in the report. |
| **Data** | File quality (rows read, kept, duplicates, bad cells), integrity checks, coverage, the license list, other GitHub exports you can add, a row explorer and a CSV download of the filtered rows. |
| **Settings** | Theme, monthly budget, every threshold behind the groups with live previews, seat list and extra seats, model price overrides, a live price check, import and export of settings, and a glossary. |
| **Methodology** | Every calculation in one searchable list: what it is, the formula, the inputs, an example, the limits and official links. The same text opens from the info button next to each number. |

The language button at the top switches between English and Arabic. Dropdowns are sorted A to Z, lists that rate something go from best to worst, and recommendations and tiles go from most to least impact.

### Filtering

The top bar and **Filters** drawer apply to every page at once and show a live "N of M rows match". Active filters appear as removable chips. Filters cover:

- **Time**: date range with presets, and weekdays.
- **Users, plans and organizations**: users, plan (by included credits), organizations, cost centers.
- **Models**: model, vendor, model group, and Auto vs hand-picked.
- **Products and sources**: product, SKU, repository, app client, source file.
- **Billing and rows**: covered vs billed, per-user vs repository-level, the cost of a single row, and a free-text search.
- **User groups**: persona, usage tier, engagement and lifecycle, usage profile, Auto use, traits, Pareto class and usage per user.

Charts and tables are clickable: clicking a bar, slice, cell or row narrows the whole app to it (drill-down), and the same filters are applied to exports.

### Exports

From **Export** in the top bar: an executive summary in Markdown (copy or download), per-user action list (CSV), recommendations (CSV), and print or save as PDF (light colors, navigation hidden, filters and data source printed at the top). Charts have a PNG download, tables have CSV download. Downloaded files are named `github-copilot-...`.

CSV downloads are UTF-8 with a byte order mark, so Excel opens them with the right characters. A text cell that starts with `=`, `+`, `-` or `@` gets a leading `'`, so a spreadsheet shows it as text instead of running it as a formula.

## How the numbers work

**Included credits are shared.** Each GitHub Copilot seat comes with monthly included credits (Business 1,900 credits = 19 USD, Enterprise 3,900 credits = 39 USD) that go into one pool per billing entity and reset on the 1st (UTC). Usage is paid from the pool first; only what goes beyond the pool is billed. So:

- a user can use more than their own included credits without causing a charge if others leave credits unused;
- monthly cost = `max(seat fees, usage)`, because unused included credits are still paid for in the seat fee;
- using less saves cash only down to the pool size, and removing a seat saves only what the pool does not need.

The app separates **usage** (the gross amount in the report, already reduced by any Auto discount) from **billed** (usage charged on top of seats). Usage is not the price before Auto discounts, and billed usage alone is not the whole invoice.

**Pool size.** The file only knows the seats that appear in it. Without a license list, pool size is a lower bound, and the app says so. Load the license list (Licenses page) or add the seat list in **Settings** to include seats missing from the usage report. The estimate still depends on list completeness, seat plans, dates and billing scope. If covered usage exceeds what the visible seats can fund, pool size, unused credits and seat savings are hidden instead of guessed. The savings calculation can still use reported billed usage: it estimates the effect on that overage, not a guaranteed change to your invoice.

**Auto discount.** The export already includes any Auto reduction. The app compares eligible Auto rows with the official token prices to estimate the **original price** and **Auto discount received**. Each plan uses its measured rate when at least $1 of eligible Auto usage is available; otherwise it uses the assumed rate in Settings (10% by default). Both bases are labeled. Rates can differ between plans; the app does not guess why. The app also shows each user's share of usage through Auto and the possible discount on hand-picked usage. This is potential usage reduction, not guaranteed cash savings.

**License list.** Load the GitHub Copilot activity report, the seat assignments JSON, a seats CSV or a plain list of logins. The app matches seats to users without regard to case, and groups seats by last activity: active in the last 30 days, fading (30 to 89 days), inactive for 90 days or more, and seats with no recent activity date. Blank dates are not proof that a seat was never used, so those seats are shown for review and are not counted as seats to free or unused seats. A list older than 30 days is flagged as old. The values of idle and unused seats overlap, so they are never added up.

**Seat list in Settings.** Paste or upload one GitHub username per line, optionally followed by the plan (`alice,Enterprise` or `alice Business`). A plan can be `Business`, `Enterprise`, a number of credits (`3900` or `3900 credits`) or a dollar amount (`$39`). A seat without a plan uses the plan the report shows for that user, or the most common plan in the report if the user never appears in it. A header row is recognized and usernames are matched without regard to case.

**Filtered views.** The pool is shared by everyone, so it cannot be split by a filter. In a view narrowed by any row or group filter (a date range does not count), organization-wide pool and seat statements are hidden, and savings are shown as usage, with the cash that is already billed in that slice given as "at least".

**Every number explains itself.** Each figure has an info button with what it is, the formula, the inputs, a worked example, the limits and official links. The Methodology page lists all of them and can be searched.

### Classifications

All thresholds are editable in **Settings** (defaults in brackets) and take effect immediately.

| Group | Classes |
| --- | --- |
| **Usage tier** (usage as a share of the user's own included credits) | Minimal (below 10%), Light (10 to 40%), Core (40 to 100%), Power (100 to 300%), Runaway (300% and above). |
| **Engagement** (share of workdays active since the user started) | Daily (60% and above), Regular (30 to 60%), Occasional (10 to 30%), Rare; plus New (first seen in the last 14 days) and Lapsed (no activity for 7 or more days after earlier use). |
| **Persona** (one label per user, in this precedence) | Runaway users, New users, Lapsed users, Champions (regular and at least Light), Burst users (heavy use on few days), Steady light users, Dormant or low use. |
| **Usage profile** | Efficient (70% or more of usage on Versatile or Lightweight models), Balanced, Frontier-heavy (70% or more on Powerful models). |
| **Auto use** | Auto-first (50% or more of usage through Auto), Mixed (10 to 50%), Direct models (under 10%), Not enough data. |
| **Pareto class** | A: top users (first 80% of usage), B: middle (next 15%), C: long tail (last 5%). |
| **Traits** (can combine) | Long-context surcharges, Spiky usage, Low cache reuse, Rarely uses Auto, Many models, Growing fast, No cost center, Fading. |

### Recommendations and savings

Recommendations are generated from the data in scope: billed usage, pool exhaustion and projected overage, unused included credits, idle and downgradable seats, seats from the license list, runaway users, model right-sizing, Auto adoption, cache reuse, context size, long-context surcharges, unusual days, missing cost centers, budgets, new-user onboarding and data quality. They are ordered by impact. Each has severity, audience (management, admins, users), evidence, concrete actions, affected users, official GitHub and Microsoft links, a confidence level and an estimated saving.

Savings **overlap** (right-sizing a model and limiting a runaway user touch the same dollars), so recommendation figures are never added up. The **combined plan** on the Overview and the **simulator** on the Recommendations page apply the levers together, month by month, with the pool rules above, and give the one number that can be quoted.

Levers in the plan: right-size models, use Auto, cache discipline, leaner context, avoid long-context surcharges, limit runaway users, and the seat actions (reclaim idle seats, move Enterprise users who never needed it to Business, remove unused seats). An Enterprise to Business move is only suggested when the user's peak month stays within 80% of the Business included credits.

## Assumptions and limits

- Prices come from the built-in model price card (rates per million tokens, with long-context rates where they exist), taken from the GitHub Docs page [Models and pricing for GitHub Copilot](https://docs.github.com/en/enterprise-cloud@latest/copilot/reference/copilot-billing/models-and-pricing). The snapshot date is shown in the app. Settings has a **live price check** that reads the same page and shows any change; `npm run check:prices` does the same from the command line. Token-based figures are **estimates**: the export has no per-request tokens for every row and the app says "estimated" wherever it uses the card. You can override a model's rates in Settings. A model that is not on the card (a new release, for example) is listed as "Usage on models without a price"; its usage still counts everywhere, but token-based estimates leave it out until you enter its rates. No price is invented.
- The export contains AI credits only. **Code completions and next edit suggestions are not in it**, so a user who looks idle here may still use GitHub Copilot. Do not remove a seat on this evidence alone; check the license list's last activity first. The idle-seat recommendations say so.
- Projections follow the recent daily rate and show a range, not a promise. Only an incomplete last month is projected.
- Unusual days use a robust z-score (3.5 or more and at least 1.5 times the median) and need at least 10 days with usage.
- Trend figures (last 7 days vs the 7 before) need at least 14 days of data.
- Seat prices are public prices and do not include discounts or enterprise agreements.
- In Arabic, numbers use Latin digits, and the column names of the original export stay in English. Product and vendor logos belong to their owners and are used only to name the product.

## Privacy

The file never leaves your machine. Settings (thresholds, seat list, budget), the theme and the language are stored in `localStorage` under `ghcu.settings.v1`, `ghcu.theme` and `ghcu.locale`; the data itself is kept in memory only and is gone when you reload or close the tab. The single-file build contains no external resources and makes no network requests unless you start the live price check. No real customer data is built into the app or used by the tests.

## Project layout

```
src/
  lib/                      pure TypeScript, no React, fully unit-tested
    csv/                    tokenizer, ingest (columnar store, dedupe, validation), worker + client
    analytics/              filters, aggregate, pool, users, taxonomy, Auto discount, levers,
                            simulator, seats, anomalies, series, recommendations, tips,
                            analyze (the one entry point)
    licenses/               license list import (activity report, seats JSON or CSV, login list)
    pricing/                model price card, model groups, live price check
    metrics/                how every number is calculated (docs per area, registry)
    demo/                   made-up data generator for the sample report, tests and gen:demo
    export/                 Markdown executive summary
    utils/                  dates (UTC days), formatting, downloads
    links.ts                official GitHub and Microsoft links
  i18n/                     translation core and the Arabic dictionaries (ar/)
  state/                    Zustand store, hash router, analysis provider, sample report loader, theme, print
  components/               UI kit (cards, KPIs, controls, drawers), charts (ECharts), icons, shell, landing
  pages/                    one file per page, each with its own folder of parts
tests/                      Vitest suites, made-up fixtures, guard tests (naming, i18n, metric docs, readable names)
scripts/                    demo data and price check
docs/FEATURES.md            features and key values for admins
AGENTS.md                   guide for contributors and AI coding agents
.github/                    CI and GitHub Pages workflows, issue and pull request templates
```

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, Apache ECharts 6, Zustand. The CSV is parsed into dictionary-encoded typed arrays in a worker, so large files stay responsive; filters are boolean masks over those arrays and every figure on screen is derived from one `analyze()` call. As a reference point, a synthetic file with 314,000 rows (69 MB, 670 users) is ingested in about half a second and fully re-analyzed in about 0.1 s (Node on a laptop; a filtered re-analysis takes about 20 ms).

## Tests

```bash
npm test
```

The suite covers the tokenizer and ingest (BOM, quoting, scientific notation, date formats, duplicates, bad cells), filters, aggregation, the pool and projection math, the Auto discount, seat plans, the license list, user classification, recommendations, the savings simulator and the exports. It uses made-up fixtures and generated data only. Guard tests check that the product is always called "GitHub Copilot", that every visible text has Arabic, that layouts use start/end instead of left/right, that every number on a page has a calculation doc, that the start page offers your own files first and one clearly labeled sample report, that the sample never reads a file or uses your saved license list, and that the theme keeps every text color readable.

## Publishing the site

The site is built by [.github/workflows/pages.yml](.github/workflows/pages.yml) and published with GitHub Pages. Every push to `main` runs the checks (types, tests, both builds) and then deploys `dist/`. The build uses relative paths, so it works under any repository name. The deploy steps run only while the repository is public. Before the first deploy, open Settings, then Pages, and set the source to **GitHub Actions**. Do this once for each repository, also for a fork.

## Contributing

Ideas and fixes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, and follow the [Code of Conduct](CODE_OF_CONDUCT.md). Please never post real usage reports, license lists, names or screenshots with real data in an issue or pull request. To report a security problem, follow [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE). Packages, fonts and icons that ship inside the app are listed with their licenses in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

# Prior

Prior is a daily training web app for analysts. A metric has moved. Someone has to decide. You write your own read before the expert checklist is allowed on screen.

It is a local app: forms, a checklist, a log, and stats. Nothing you type is sent to a server. There is no chat.

## Run it

```bash
npm ci
npm run dev
```

Open the URL Vite prints (port 5173). The dev server listens on all interfaces so a phone on the same network can reach it.

```bash
npm test
npm run lint
npm run build
```

`npm run build` writes a static site to `dist/`.

## Look

The illustrations are original inline SVGs drawn for Prior. There is no third-party artwork and nothing is loaded from another site. Tag colours map the bank’s eight tags onto a fixed palette: time is timing (sky), volume is the metric (amber), mix is segment (violet), supply is ops (teal), cause is risk (rose), data is data (blue), external is external (lime), finance is money (orange). Difficulty is emerald, amber, or fuchsia. The bank has no separate customer tag.

Motion is entrance, hover, press, a staggered checklist, and a short burst when a logged rep scores 80 or higher. `prefers-reduced-motion` turns those animations off. Print hides the tab bar and flattens the dark header.

## The day

Unlocks use **Africa/Lagos** (WAT, UTC+1), not the device timezone.

- A new scenario unlocks at **08:00 WAT**.
- The first time you open the app, that day’s brief is available even if it is before 08:00. Later mornings wait until 08:00.
- Missed days stay on the date strip and stay playable.
- A scenario is not repeated until the bank is used up, except when you choose a redo.
- The first brief is the travel-support example. After that, the draw prefers the difficulty band for how far you are in (easy for the first four weeks, medium through month four, hard after) and the weekly theme: fintech & credit, operations, growth & marketing, mixed. Three or more recent reps can nudge the band up or down. Once a date is assigned, it stays assigned.

## The rep

1. You write a hypothesis, a confidence from 1 to 5, a one-line pre-mortem, the kind of ambiguity you see, the check that would kill the hypothesis, and your own investigation list.
2. **Lock and reveal.** The list cannot be edited after that.
3. The checklist is grouped by tag. Ticks that match your wording are suggestions. Correct them.
4. The debrief names the highest-leverage check you missed, and any red herring your list chased.
5. You write the one fact that would change your mind, then compare it with the model line.
6. You mark whether the top check supported, weakened, or killed the hypothesis. That pair — confidence, and whether the hypothesis held — is the calibration record.
7. You explain one check in a sentence. A generic sentence gets one nudge.

**Rep score** is the average of three things: did you hit the top check, did you name the ambiguity type, and what share of the checklist you stood behind. Checklist coverage is shown, and it is not treated as the whole score. Word matching is too blunt to carry a year of training.

Hard briefs also show a stronger framing and a weaker one.

About one fictional day in five is blind (company, industry, function, and the longer context hidden). Real companies are never blind. You can force this on or off in Library.

On a later morning, Prior asks you to recall yesterday’s missed check before you read the line you logged. Sunday surfaces the three lowest daily scores from the past week for a cold redo, with a before and after.

## Add scenarios

Put objects in a JSON array, or in `{ "scenarios": [ ... ] }`. Import the file from **Library**. Valid rows are appended. A repeated `id` replaces the previous copy. Rows that fail validation are skipped and listed.

Seed scenarios live in `scenarios/seed.json`. The fields:

`id`, `company_type` (`real` | `fictional`), `company`, `industry`, `function`, `difficulty` (`easy` | `medium` | `hard`), `theme` (`fintech-credit` | `ops` | `growth-marketing` | `mixed`), `metric`, `direction`, `size`, `timeframe`, `context`, `ambiguity_type` (`missing_denominator` | `conflicting_metrics` | `simpsons_slice` | `small_sample` | `definition_change` | `none`), `blind_text`, `decision`, `angles` (`check`, `tag`, `keywords`), `red_herrings` (`text`, `why_irrelevant`, `keywords`), `top_check` (`check`, `why`), `what_would_change_your_mind`, `framings` (hard briefs), `teach_me_prompt`, and for real companies `based_on` plus `source` (`title`, `outlet`, `date`, `url`).

Tags: `time`, `volume`, `mix`, `supply`, `cause`, `data`, `external`, `finance`.

If `keywords` are missing, Prior builds them from the check text and shows a warning. Add your own synonyms when you can; the suggestions are only as good as those words. A real company with no source is rejected. `top_check.check` should be copied exactly into one of the angles, so a tick can record a hit.

The answer key ships inside the app, because the bank is a file in the bundle. The lock stops you opening it by habit. It is not a security boundary.

## History

**Library → Export history** downloads a JSON backup. Import it on another device and choose merge or replace. Export after each week. Safari can drop site data, and this app has no account to restore it from.

## Phone

Build, then deploy `dist/` on Vercel as a static Vite site (framework preset Vite, output `dist`). On an iPhone, open the site in Safari and use Share → Add to Home Screen. The manifest makes it standalone.

A notification at 08:00 is **not** possible without a server. iOS web push needs the app installed and a push service. Set a repeating calendar alarm for 08:00 Africa/Lagos. When you open Prior, the brief for that Lagos day is the one on screen.

## Model grading

Off, and unused. `src/domain/grading.ts` is the seam a later setting can plug a device-local key into. The daily loop does not call it.

## Levels

XP is quiet on purpose: finishing, hitting the lever, naming the ambiguity, a share of coverage, a specific teach sentence. Speed is not scored. Packs in Library are extra passes on briefs you have already logged. They do not open a future day. Two freeze tokens each Lagos month can bridge one missed day. They do not roll over.

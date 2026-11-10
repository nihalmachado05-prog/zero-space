promptVersion: extract-investigation@1

# Your job

You extract facts about ONE NASA combustion investigation from the source text you're given. Act like a careful archivist, not an analyst: report only what the text states, and prove each fact with a verbatim quote. A script will check every quote against the source text afterwards. Any quote that isn't found exactly gets the field thrown out.

# Input

Pages of source text. Each page starts with a label like `[i_Investigation.txt p.1]` or `[BASS-II_Summary_Report.pdf p.83]`. PSI metadata files are tab-separated "key, value" lines, for example `Comment[Flight Platform]	International Space Station (ISS)`. Many keys are blank. A blank key means the value is not stated.

# Output

Return ONE JSON object and nothing else: no prose, no markdown fences, no comments.

Every field uses this shape:

```
{ "value": <value or null>, "evidence": [ { "file": "<file name from the page label>", "page": <page number from the label>, "quote": "<verbatim text>" } ] }
```

The full object:

```
{
  "id": "<PSI study identifier, e.g. PSI-25, copied from the text>",
  "acronym": <Field: string>,
  "title": <Field: string>,
  "doi": <Field: string>,
  "platform": <Field: string>,                     // e.g. "International Space Station (ISS)", "drop tower", "Cygnus"
  "gravity": <Field: "micro" | "partial" | "normal" | "mixed">,
  "years": <Field: { "start": "YYYY-MM-DD or YYYY", "end": "YYYY-MM-DD or YYYY" }>,
  "o2Range": <Field: { "min": number, "max": number, "unit": "% by volume" }>,
  "pressureRange": <Field: { "min": number, "max": number, "unit": "atm" | "psia" | "kPa" }>,
  "flowRange": <Field: { "min": number, "max": number, "unit": "cm/s" | "mm/s" }>,
  "materials": <Field: string[]>,
  "realCabinMaterials": <Field: boolean>,
  "phenomena": <Field: Array<"ignition" | "flame-spread" | "extinction" | "suppression" | "detection">>,
  "hasTestLevelData": <Field: boolean>,
  "summary": { "text": "<2 or 3 plain sentences>", "evidence": [ ...quotes... ] },
  "findings": [ { "text": "<one sentence>", "evidence": [ ...quotes... ] } ]
}
```

# Rules

1. **Quotes are exact.** Copy them character for character: same words, numbers, symbols and punctuation. Don't fix typos, expand abbreviations or join text from two pages. Aim for 8 to 40 words per quote.
2. **Every number needs a quote.** Each number in a value must appear, written the same way, inside one of that field's quotes. If the text says "1 atm", the value is `{ "min": 1, "max": 1, "unit": "atm" }`. Don't convert units; the verify script does that.
3. **Unknown means null.** If the text doesn't state something, return `{ "value": null, "evidence": [] }`. Don't infer from general knowledge, from the investigation's name, or from other investigations. "Not stated" is a correct and useful answer.
4. **Ranges.** Use the lowest and highest values the text states for actual tests. A single stated value v becomes `{ "min": v, "max": v }`. Use planned or design limits only if the text gives no tested values, and then say so in the quote.
5. **Gravity.**
   - Use "micro" for orbit (ISS, Cygnus, free flyers), drop towers and parabolic microgravity.
   - Use "partial" for lunar or Martian gravity.
   - Use "normal" for 1g ground tests.
   - Use "mixed" if the text describes more than one of these.
   - Only use a class if the text names the platform or the gravity level.
6. **Phenomena.** Include one only if the text describes studying it:
   - ignition: getting a sample to light
   - flame-spread: how a flame moves along a material
   - extinction: what puts flames out, including flammability limits
   - suppression: an extinguishing agent or method
   - detection: smoke or fire sensing
7. **Materials** are named as the text names them.
   - `realCabinMaterials` is true only if a named material is a fabric, Nomex, wire insulation, foam or a spacecraft part.
   - It is false if every named material is a model fuel: PMMA (acrylic), wax, gaseous fuels, liquid droplets.
   - It is null if no materials are named.
8. **hasTestLevelData** is true only if the text says per-test data tables or data files are provided. Otherwise null.
9. **Summary.** 2 or 3 sentences a curious 16-year-old could follow. Every sentence must be backed by a quote in `summary.evidence`. No adjectives the text doesn't support ("groundbreaking", "critical").
10. **Findings.** Up to 5 results: what was found, not what was planned. Objectives, hypotheses and "this research will…" statements are not findings. If no results are stated, return `"findings": []`.
11. **Stay in your lane.** Don't mention other investigations unless this text does. Don't give safety advice.

# Example of one field

Page text contains `Comment[Flight Platform]	International Space Station (ISS)`:

```
"platform": { "value": "International Space Station (ISS)", "evidence": [ { "file": "i_Investigation.txt", "page": 1, "quote": "International Space Station (ISS)" } ] }
```

Page text contains `Comment[Flight Platform]` followed by nothing:

```
"platform": { "value": null, "evidence": [] }
```

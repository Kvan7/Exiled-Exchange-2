# Data Parsing — Analysis, Root Causes, and What Was Fixed

The price data pipeline in `renderer/src/web/background/Prices.ts` uses manual
string searching against raw JSON text instead of parsing it. This approach is
fragile, has several confirmed bugs that cause runtime crashes, and contains a
broken cache that never hits. This document describes what the code is actually
doing, where each brittleness lives, and a plan to replace it.

---

## What the data looks like

Three endpoints are fetched on every price refresh:

### `item-drop.json`
A plain JSON array of `DropEntry` objects. Parsed normally with `JSON.parse`.
No issues here.

### `namespaceMap.json`
A small JSON object:
```json
{
  "schemaVersion": 1,
  "map": [
    { "ns": "ITEM", "cx": true,  "url": "currency",  "type": "Currency" },
    { "ns": "ITEM", "cx": false, "url": "unique-map", "type": "UniqueMap" }
  ]
}
```
Also parsed normally. No issues.

### `overviewData.json`
The large blob. **This is valid JSON** with the following top-level shape:
```json
{
  "core": {
    "rates": { "exalted": 2312, "chaos": 76.2 },
    "primary": "divine",
    "secondary": "chaos"
  },
  "itemOverviews": [
    {
      "type": "Currency",
      "lines": [
        {
          "name": "Orb of Alchemy",
          "detailsId": "orb-of-alchemy",
          "id": "alch",
          "primaryValue": 0.00003575,
          "volumePrimaryValue": 0.4008,
          "maxVolumeCurrency": "exalted",
          "maxVolumeRate": 12.05,
          "sparkline": { "totalChange": -40.89, "data": [...] }
        },
        ...
      ]
    },
    { "type": "UniqueMap", "lines": [...] },
    ...
  ]
}
```

The code never calls `JSON.parse` on this object as a whole. Instead it treats
it as a raw string and performs text searches on it. Everything below is a
consequence of that decision.

---

## The three parsing functions

### `parseXchg(jsonBlob)` — extract exchange rates

```typescript
const RATES = '{"rates":';
const END_RATES = '"}';
const startPos = jsonBlob.indexOf(RATES);
const endPos = jsonBlob.indexOf(END_RATES, startPos) + END_RATES.length;
return JSON.parse(jsonBlob.slice(startPos, endPos));
```

**What it searches for:** the literal string `{"rates":` inside the blob, then
the first occurrence of `"}` (a quote followed by a closing brace) after that
position to determine where the object ends.

**Why it works today:** the `"core"` object ends with `"secondary":"chaos"}`.
The sequence `"}` (the closing `"` of `"chaos"` followed by the closing `}` of
the core object) is what `END_RATES` matches. The slice captures the full core
object and parses correctly.

**Where it breaks:**

1. `END_RATES = '"}'` is two characters. It matches the first `"}` sequence
   after `{"rates":`, regardless of nesting. Any string value in the core
   object that ends with a `"` before a `}` would cause the slice to terminate
   too early and produce a malformed JSON fragment. Example: if `primary` were
   ever `"div}"`, the match fires immediately.

2. If `{"rates":` is absent from the blob (format change, network truncation),
   `startPos = -1`. `jsonBlob.slice(-1, ...)` returns a one-character tail of
   the blob. `JSON.parse` throws with a useless error.

3. The extracted object is `NinjaXchgRates` but the slice contains the raw
   `"core"` object. The interface matches only because `"rates"`, `"primary"`,
   and `"secondary"` happen to be the only keys. Any future key added to `core`
   is silently ignored — fine for now but undocumented.

---

### `splitJsonBlob(jsonBlob, schema)` — split into sections

```typescript
const NINJA_OVERVIEW = '{"type":"';
let startPos = jsonBlob.indexOf(NINJA_OVERVIEW);
while (true) {
  const endPos = jsonBlob.indexOf(NINJA_OVERVIEW, startPos + 1);
  const type = jsonBlob.slice(
    startPos + NINJA_OVERVIEW.length,
    jsonBlob.indexOf('"', startPos + NINJA_OVERVIEW.length),
  );
  const lines = jsonBlob.slice(startPos, endPos === -1 ? jsonBlob.length : endPos);
  // ...
}
```

**What it searches for:** the literal string `{"type":"` as a section boundary.
Each occurrence is treated as the start of a new price section. The section's
type name is extracted by finding the next `"` after the marker. The raw text
from one `{"type":"` to the next is stored as `lines` in the `PriceDatabase`.

**Why it works today:** poe.ninja formats every section header as
`{"type":"Currency","lines":[...]}` with `"type"` as the first key. No item
name, detailsId, or other string value in the current dataset happens to
contain `{"type":"` as a literal substring.

**Where it breaks:**

1. Any item whose `name`, `detailsId`, or any string field contains the literal
   text `{"type":"` would be misidentified as a section boundary. The section
   containing that item would be split at the wrong position, corrupting both
   the section before and after it.

2. If the server ever reorders keys so that `"type"` is not the first key in
   a section object (e.g., `{"id":1,"type":"Currency"}`), the function finds
   nothing and returns an empty database.

3. The `lines` string stored for each section includes the full section wrapper
   `{"type":"Currency","lines":[...]}`. This raw string is then used by
   `findPriceByQuery`, which means that function must avoid false matches on
   `"type":"Currency"` itself.

---

### `findPriceByQuery(query)` — look up a single item price

```typescript
const searchString = JSON.stringify({
  name: query.name,
  variant: query.variant,
  primaryValue: 0,
}).replace(":0}", ":");
const endSearchString = "}}";

const startPos = lines.indexOf(searchString);
const endPos = lines.indexOf(endSearchString, startPos);
const info = JSON.parse(lines.slice(startPos, endPos + endSearchString.length));
```

**What it searches for:** a JSON key prefix constructed from `name`, optionally
`variant`, and `primaryValue`. The prefix looks like one of:

```
{"name":"Orb of Alchemy","primaryValue":
{"name":"Vaal Orb","variant":"Corrupted","primaryValue":
```

The trailing `0` is stripped by the `.replace(":0}", ":")` so the prefix ends
just before the value, allowing it to match any `primaryValue` regardless of
its actual number. The end of the object is found by searching for `}}`.

**Why it works today (or doesn't):** the server must return item objects with
`name` (and optionally `variant`) as the first fields, immediately followed by
`primaryValue`. If the server emits `"detailsId"` or any other key between
`"name"` and `"primaryValue"`, the search string never matches and the function
returns null for every item. The `NinjaDenseExchangeInfo` interface lists
`detailsId` as a field, but this code never finds it via search — it must come
after `primaryValue` in the actual JSON for this to work at all.

This key-ordering dependency is undocumented, not enforced by any schema, and
silently breaks whenever poe.ninja changes their serialization order.

**Where it breaks:**

1. **Key ordering.** As described. If `"detailsId"` or any other field appears
   between `"name"` and `"primaryValue"` in the server output, `indexOf`
   returns -1. `lines.slice(-1, 1)` produces a single character.
   `JSON.parse` throws `SyntaxError`. **This is the observed crash.**

2. **`}}` end marker.** `"sparkline"` contains a `"data"` array and a
   `"totalChange"` field. The sparkline object closes with `}`. The outer item
   object also closes with `}`. So `}}` appears naturally at the end of each
   item. But `}}` could also appear earlier — for example, if `"data"` is
   `[{},{}]` (hypothetical nested objects), or if future fields add nested
   objects. A premature match produces a truncated JSON fragment that either
   parses to a partial object or throws.

3. **No error handling at the call site.** `findPriceByQuery` is called from
   `cachedCurrencyByQuery`, which is called from Vue price-check components.
   None of these callers have try/catch. A throw from `JSON.parse` propagates
   as an uncaught promise rejection in the component context, which is why the
   error surfaces as `[Renderer:3] Uncaught (in promise) SyntaxError` rather
   than the `[Renderer:2] console.warn` that `load()`'s catch block would
   produce.

---

## The broken cache

```typescript
let priceCache = new Map<
  { ns: string; name: string; count: number },
  CurrencyValue
>();

function cachedCurrencyByQuery(query: DbQuery, count: number) {
  const key = { ns: query.ns, name: query.name, count };
  if (priceCache.has(key)) { ... }  // never true
  priceCache.set(key, currency);
```

`Map.has()` uses reference equality for object keys. A new object literal is
created on every call, so `priceCache.has(key)` is always false. The cache
accumulates entries that are never read. Every price lookup hits the O(n)
string search every time.

---

## Summary of bugs

| Location | Bug | Effect |
|----------|-----|--------|
| `parseXchg` | `END_RATES = '"}'` matches 2 chars | Wrong slice if any string value ends `"X"}` |
| `parseXchg` | No guard when `RATES` not found | `slice(-1,...)` + meaningless JSON.parse error |
| `splitJsonBlob` | `{"type":"` matches inside string values | Section corruption if any item contains this literal |
| `splitJsonBlob` | Depends on `"type"` being the first key | Silent empty database if key order changes |
| `findPriceByQuery` | Assumes `name`→`primaryValue` are adjacent | Returns null or throws if server key order differs — **active crash** |
| `findPriceByQuery` | `}}` end marker is not unique | Slice terminates at wrong object boundary |
| `findPriceByQuery` | No error handling | SyntaxError propagates as uncaught rejection |
| `cachedCurrencyByQuery` | Object literal as Map key | Cache never hits; O(n) search on every lookup |

---

## Replacement plan

The blob is valid JSON. Parse it once, build indexes, do O(1) lookups.

### Step 1 — parse the blob properly

Replace all string-search extraction with a single `JSON.parse`:

```typescript
interface OverviewBlob {
  core: {
    rates: Record<string, number>;
    primary: string;
    secondary: string;
  };
  itemOverviews: Array<{
    type: string;
    lines: Array<NinjaDenseExchangeInfo | NinjaDenseStashInfo>;
  }>;
}

const blob: OverviewBlob = JSON.parse(jsonText);
```

This eliminates `parseXchg` and `splitJsonBlob` entirely. The `core` object is
directly available. Each section's `lines` is an already-parsed array, not a
raw string.

### Step 2 — build a lookup index

Replace the `PriceDatabase` raw-string store and the O(n) `findPriceByQuery`
search with a Map:

```typescript
type PriceIndex = Map<
  string,  // key: `${ns}:${name}:${variant ?? ""}`
  { entry: NinjaDenseExchangeInfo | NinjaDenseStashInfo; cx: boolean; url: string }
>;
```

Built at load time:

```typescript
const index: PriceIndex = new Map();
for (const section of blob.itemOverviews) {
  const mapping = schema.map.find((m) => m.type === section.type);
  if (!mapping) continue;
  for (const item of section.lines) {
    const key = `${mapping.ns}:${item.name}:${item.variant ?? ""}`;
    index.set(key, { entry: item, cx: mapping.cx, url: mapping.url });
  }
}
```

Lookup becomes:

```typescript
function findPriceByQuery(query: DbQuery) {
  const key = `${query.ns}:${query.name}:${query.variant ?? ""}`;
  const hit = index.get(key);
  if (!hit) return null;
  return {
    ...hit.entry,
    cx: hit.cx,
    url: `https://poe.ninja/poe2/economy/${selectedLeagueToUrl(false)}/${hit.url}/${hit.entry.detailsId}`,
  };
}
```

O(1) lookup, no string slicing, no JSON.parse at query time, no key-ordering
assumption, no `}}` boundary heuristic.

### Step 3 — fix the cache

Change the cache key to a string:

```typescript
const priceCache = new Map<string, CurrencyValue>();

function cachedCurrencyByQuery(query: DbQuery, count: number) {
  const key = `${query.ns}:${query.name}:${query.variant ?? ""}:${count}`;
  if (priceCache.has(key)) return priceCache.get(key)!;
  ...
}
```

### Step 4 — add error handling to `load()`

The existing `catch (e) { console.warn(e); }` already suppresses errors inside
`load()`. The new code won't throw from `findPriceByQuery`, but add a guard
anyway so component-level calls are safe:

```typescript
function findPriceByQuery(query: DbQuery) {
  if (!index.size) return null;
  const key = `${query.ns}:${query.name}:${query.variant ?? ""}`;
  return index.get(key) ?? null;
}
```

### No new library needed for Prices.ts

The blob is standard JSON. `JSON.parse` handles it. The fast-search problem is
an indexing problem, not a parsing problem — a `Map` gives O(1) keyed lookup
with zero dependencies. A streaming JSON parser (e.g., `@streamparser/json`)
would only help if the blob were too large to hold in memory, which it isn't.

**Status: implemented** in `renderer/src/web/background/Prices.ts`.

---

## NDJSON item/stat data (`assets/data/index.ts`)

### What it was doing

`loadItems` and `loadStats` fetched three files each:

1. A `.ndjson` file (newline-delimited JSON, one record per line)
2. Two `.index.bin` files — binary `Uint32Array` tables mapping FNV1a-32 hashes
   to **byte offsets** into the `.ndjson` text

Lookups worked by:
1. Computing `fnv1a(key, {size: 32})` → hash
2. Binary-searching the index for that hash → row
3. Reading `index[row * 2 + 1]` → byte offset
4. Slicing the raw NDJSON string from that offset to the next `\n`
5. Calling `JSON.parse` on the slice

### Why it was broken

**CRLF line endings.** The `.ndjson` files are stored with Windows line endings
(`\r\n`). The binary index files were built against LF-only versions of those
files. Byte offsets stored in the index are therefore wrong by `(N − 1)` bytes
for the Nth line: the stored offset lands inside the content of the previous
line rather than at the start of the target line.

For a lookup that resolved to line N=6, the stored offset was 5 bytes before
the actual line 6 start. That position fell on the `f` of `false}` (a common
JSON boolean value at the end of the previous line). `JSON.parse("false}...")` →
`SyntaxError: Unexpected non-whitespace character after JSON at position 5`.
This surfaced as `[Renderer:3] Uncaught (in promise) SyntaxError` during
`init()`, which has no try/catch.

Secondary issues with the old approach regardless of CRLF:
- FNV1a-32 has a non-trivial collision rate over ~4000+ entries; collisions
  silently returned the wrong record
- `ndjsonFindLines` did O(n) string search on the raw text for every iterator
  call, and used the same fragile `start`/`end`/`slice` pattern
- `itemNamesFromLines` built a concatenated string to iterate names, using
  the same `start`/`end` slice loop

### What replaced it

Three small helpers and two rewritten load functions. No binary index files,
no byte offsets, no string slicing.

```typescript
// Parse an NDJSON text into a typed array.
// Splits on \n; JSON.parse handles trailing \r as whitespace.
function parseNdjson<T>(text: string): T[] {
  const out: T[] = [];
  for (const line of text.split("\n")) {
    if (line.trim()) out.push(JSON.parse(line) as T);
  }
  return out;
}

// Iterator that pattern-matches against pre-serialized JSON strings.
function makeIterator<T>(items: T[], serialized: string[]) {
  return function* (searchString: string, andIncludes: string[] = []) {
    for (let i = 0; i < items.length; i++) {
      if (serialized[i].includes(searchString) &&
          andIncludes.every((s) => serialized[i].includes(s))) {
        yield items[i];
      }
    }
  };
}

// Name generator over a filtered item subset.
function makeNameGenerator(items: BaseType[]): () => Generator<string> {
  return function* () { for (const item of items) yield item.name; };
}
```

**`loadItems`** fetches `items.ndjson`, calls `parseNdjson`, then builds:
- `Map<"${ns}::${name}", BaseType[]>` → `ITEM_BY_TRANSLATED`
- `Map<"${ns}::${refName}", BaseType[]>` → `ITEM_BY_REF`
- `makeIterator` over the parsed array → `ITEMS_ITERATOR`
- Filtered name generators → `GEM_NS_NAMES`, `UNIQUE_NS_NAMES`, `ITEM_NS_NAMES`
- Iterates parsed items directly for `TRADE_TAG_TO_REF`

**`loadStats`** fetches `stats.ndjson`, calls `parseNdjson`, then builds:
- `Map<ref, Stat>` → `STAT_BY_REF`
- `Map<matcherString, {stat, matcher}>` → `STAT_BY_MATCH_STR`
- `makeIterator` over the parsed array → `STATS_ITERATOR`

Removed entirely: `dataBinarySearch`, `ndjsonFindLines`, `itemNamesFromLines`,
the `fnv1a` import, and all `.index.bin` fetches. The `.index.bin` files in
`public/data/` are now unused dead weight and can be deleted from the repo.

All exported function signatures are unchanged. No callers needed updates.

**Status: implemented** in `renderer/src/assets/data/index.ts`.

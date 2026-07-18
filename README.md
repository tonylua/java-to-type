# java-to-type

Generate front-end JSDoc or TypeScript types directly from Java POJO / enum / Spring controller source — a lightweight, back-end-agnostic alternative to protobuf.

For front/back-separated projects with no OpenAPI/Swagger contract and no shared schema, the domain model gets mirrored by hand on the front end — drifting types, hard-coded defaults, stale mocks. This parses the Java source directly and keeps a semi-automated type layer in sync, without asking the back-end to change anything.

## Install

```bash
npm i -D @tonylua/java-to-type
```

## Usage

```ts
const { parseDir, parseJava } = require('@tonylua/java-to-type')

// directory
const results = parseDir('/path/to/java', { parserMeta: { apiPrefix: '/api' } })

// single file
const results = parseJava(fs.readFileSync('MyPojo.java', 'utf8'), 'MyPojo.java')
```

See `samples/buildJSDoc.ts` and `samples/buildJSDocWithTS.ts` for full examples.

## Options

`parseDir(dir, option?)` / `parseJava(code, path, option?)`

| option | type | description |
|--------|------|-------------|
| `isEnum` | `boolean` | force enum/constant parser |
| `excludePaths` | `string[]` | skip files containing these strings |
| `parserMeta.outputTS` | `boolean` | emit TypeScript instead of JSDoc |
| `parserMeta.apiPrefix` | `string` | prepend to service URLs |
| `parserMeta.jsDocServiceRequestInstanceName` | `string` | HTTP client name (default `request`) |
| `parserMeta.jsDocServiceTopImport` | `string` | import line at top of service output |

## Dev

```bash
npm run build          # compile
npm run examples       # JSDoc sample
npm run examples:withTS  # TypeScript sample
npm test               # snapshot tests
npm run test:u         # update snapshots
```

## Supported

- POJO → `@typedef` / `export type`
  - nested static classes (each emitted as its own type)
  - Java `record`
  - Lombok `@Data` / `@Getter` / `@Setter`
  - generics (`List<T>` → `Array.<T>` / `T[]`, `Map<K,V>` → `Object`)
  - `@NotNull` marks a property required
- `enum` (incl. multi-arg constructors like `OK("0", "正常")`) → `@enum` / `export enum`
- `static final` constants → `@enum` / `export enum`
- Spring `@RestController` with `@GetMapping`, `@PostMapping`, `@RequestMapping(method=...)`, `@PathVariable`, `@RequestBody`, `@RequestHeader`, generic return types → typed request functions (JSDoc **and** TypeScript)

> Requires valid Java syntax. Files with syntax errors are skipped.

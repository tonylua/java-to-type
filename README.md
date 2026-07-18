# java-to-type

Convert Java POJO / enum / Spring controller source files to JSDoc or TypeScript type definitions — a lightweight alternative to protobuf for teams that need front-end types from a Java back-end without an IDL layer.

It is aimed at legacy or non-standardized Java back-ends that have no OpenAPI/Swagger contract and no shared schema layer. Instead of hand-mirroring types on the front end, it parses the business data structures directly from the Java source and gives you a semi-automated type layer — the practical effect of a protobuf middle layer, without asking the back-end to change anything.

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

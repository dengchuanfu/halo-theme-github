# Halo Theme GitHub

A GitHub-inspired theme for Halo, based on the official
[`theme-vite-starter`](https://github.com/halo-dev/theme-vite-starter).

## Development

Prerequisites are installed locally in the parent workspace. Use two terminals:

```bash
# Terminal 1: watch and rebuild theme templates
./scripts/dev-theme.sh

# Terminal 2: run Halo at http://localhost:8090
./scripts/dev-halo.sh
```

On the first Halo launch, finish the setup wizard at `http://localhost:8090`, then open
`Console -> Appearance -> Themes -> Switch theme -> Not installed`. Install and activate
`GitHub`.

Theme source files live in `src/`. Vite continuously builds the files Halo reads into
`templates/`.

## Validation

```bash
corepack pnpm check
corepack pnpm build
```

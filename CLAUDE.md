# Project Overview

## Tech Stack

- **Framework**: Astro 5 + Svelte 5 (with runes mode)
- **Styling**: Tailwind CSS v4
- **Markdown Editor**: Carta (carta-md) with KaTeX math plugin (@cartamd/plugin-math)
- **AI SDK**: Vercel AI SDK (@ai-sdk/openai, @ai-sdk/svelte, ai)
- **Validation**: Zod v4
- **Linting**: oxlint
- **Formatting**: Prettier

## Important Technical Notes

### Running Commands

- Use `bun run xxx`
- Always check package.json before running any command
- Run `bun run format` to format your files after you finish all

### Svelte 5 Runes

- This project uses Svelte 5 with runes mode enabled
- Use `$state()` for reactive variables, not plain `let`
- Use `$props()` for component props
- Use `$bindable()` for two-way binding
- Use `$effect()` instead of `afterUpdate()` (deprecated in runes mode)
- Use `onMount()` for initialization

### Tailwind CSS v4

- Always use TailwindCSS instead of traditional styles
- Use `@apply` directive for Carta editor overrides in style blocks
- Prefer utility classes directly in HTML over custom CSS
- Both `size-*` (for equal width/height) and `w-*`/`h-*` utilities are available

### API Routes

- API endpoint at `/api/chat` expects POST requests
- Returns structured JSON: `{explanation: string, edits: EditOperation[]}`
- Non-streaming responses (waits for full completion)
- Uses OpenAI gpt-4o-mini model

### Carta Editor Integration

- Global styles for Carta are in `src/styles/global.css` using `@apply`
- Component-specific overrides use scoped styles with `:global()` selector
- Math rendering enabled via KaTeX plugin

## File Structure

```text
src/
├── components/
│   ├── App.svelte              # Main app component
│   ├── MarkdownEditor.svelte   # Carta editor wrapper
│   ├── ChatPanel.svelte        # Chat interface
│   ├── ErrorMessage.svelte     # Error display
│   └── LoadingIndicator.svelte # Loading spinner
├── lib/
│   ├── documentEditor.ts       # Search-replace logic
│   ├── prompts.ts              # AI system prompt
│   └── sampleContent.ts        # Default markdown content
├── types/
│   └── ai.ts                   # TypeScript types & Zod schemas
├── pages/
│   ├── index.astro             # Main page
│   └── api/
│       └── chat.ts             # API route for AI
└── styles/
    └── global.css              # Global styles with Tailwind
```

## Known Issues & Gotchas

1. **Build without adapter**: The project has API routes but currently builds as static. You'll need to add `@astrojs/node` adapter for production deployment with server-rendered pages.

2. **Svelte 5 linting**: oxlint may flag `bind:this` variables as unassigned. This is a false positive - use `// eslint-disable-next-line no-unassigned-vars` to suppress.

3. **Carta CSS**: The carta-md package only provides `default.css`, there is no `light.css` or `dark.css` theme file.

## Environment Variables

Required for development:

```text

OPENAI_API_KEY=your_api_key_here

```

## Development Workflow

1. Start dev server: `bun run dev`
2. Build: `bun run build`
3. Lint: `bun run lint`
4. Format: `bun run format`
5. Check formatting: `bun run format:check`

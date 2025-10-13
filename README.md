# 🪄 AI Office Hour

An AI-powered tutoring assistant that helps students understand academic problems through interactive conversation and live document editing. Instead of simply providing answers, AI Office Hour acts as a patient mentor, guiding students to discover solutions through thoughtful questions and annotations.

## Tech Stack

- **Framework**: [Astro 5](https://astro.build) + [Svelte 5](https://svelte.dev) (with runes mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai) with Claude integration
- **Linting**: [oxlint](https://oxc.rs)
- **Formatting**: [Prettier](https://prettier.io) with oxc plugin
- **Type-Check** [typescript-go](https://github.com/microsoft/typescript-go) (Experimental)

## Prerequisites

- Install [Node.js](https://nodejs.org) as runtime
- Install [Bun](https://bun.sh) as package manager
- Obtain a Claude API Key ([get one here](https://console.anthropic.com))

## Getting Started

### 1. Clone the repository

HTTP:

```bash
git clone https://github.com/tailwindlabs/tailwindcss-typography.git
cd ai-office-hour
```

You may instead SSH or GitHub CLI for this step.

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
CLAUDE_API_KEY=your_api_key_here
```

### 4. Start the development server

```bash
bun run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

## Available Custom Commands

All commands are run from the root of the project:

| Command                | Action                                          |
| :--------------------- | :---------------------------------------------- |
| `bun run dev`          | Start local dev server at `localhost:4321`      |
| `bun run build`        | Build production site to `./dist/`              |
| `bun run preview`      | Preview production build locally                |
| `bun run lint`         | Run oxlint to check code quality                |
| `bun run format`       | Format code with Prettier                       |
| `bun run format:check` | Check if code is properly formatted             |
| `bun run type:check`   | Run TypeScript type checking                    |
| `bun run check`        | Run format check, lint, and type check together |

## Deployment

This project is still under development and not tested for deployment yet.

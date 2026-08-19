# Taptapstar — Project Code Folder

This folder is the **project root** where the actual Next.js codebase gets scaffolded (starting
at Build Step 0.5). It is intentionally empty of documentation — all planning/reference docs
live one level up, in **`../AgentGuide/`**, so they stay separate from the code tree.

## Where things are

```
TAPTAP/
  AgentGuide/     ← all planning docs (scope, theme, flow, architecture, build guide, etc.)
  Refrence/       ← raw client source material (SRS PDF, chat log, plate artwork)
  Taptapstar/     ← THIS folder — the actual project root / codebase (currently empty, gets
                     scaffolded in Build Step 0.5 of ../AgentGuide/05_MASTER_BUILD_GUIDE.md)
```

## Working convention for the coding agent

Run the coding agent (Claude Code, etc.) with **this folder (`Taptapstar/`) as its working
directory** — that's where `package.json`, `app/`, etc. will live once scaffolded. Every
Master Prompt in `../AgentGuide/05_MASTER_BUILD_GUIDE.md` refers to the planning docs by bare
filename (e.g. `04_PROJECT_STATE.md`) for readability — when pasting a prompt into the agent,
those filenames resolve at **`../AgentGuide/<filename>`** relative to this folder. If your
agent/tool requires the full relative path spelled out, prefix each reference with
`../AgentGuide/` before pasting.

Start here: open `../AgentGuide/README.md` for the full documentation index and reading order.

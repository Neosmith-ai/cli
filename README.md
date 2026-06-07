# @neosmithai/cli

Drop-in router for Claude Code. Same experience, ~60% lower inference cost.

## Install

```bash
npx @neosmithai/cli init sk-plus-alice-xxxxxx
```

That's it. Open a new Claude Code session and your next prompt routes through
NeoSmith.

No NeoSmith key yet? Email **contact-us@neosmith.ai** for a trial — 3 weeks,
25M tokens per developer, no credit card.

## Commands

| Command | What it does |
|---|---|
| `neosmith init <key>` | Points Claude Code at `router.neosmith.ai` and stores your key in `~/.claude/settings.json`. Runs a live verify against `/whoami`. |
| `neosmith verify` | Checks the key currently installed. Prints your dev slug, org, tier, and 30-day cap usage. |
| `neosmith uninstall` | Restores Claude Code to talk to Anthropic directly. If you had a prior Anthropic config before running `init`, it's restored from backup. |
| `neosmith help` | Usage. |

## How it works

`init` writes three env keys into `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://router.neosmith.ai",
    "ANTHROPIC_API_KEY":  "sk-plus-alice-xxxxxx",
    "ANTHROPIC_MODEL":    "claude-opus-4"
  }
}
```

Claude Code picks those up on next launch. Every prompt hits the NeoSmith
router, which routes cheap traffic to a distilled SLM and escalates to Claude
Opus 4.7 when the task actually needs it. Verifier catches regressions so
output quality stays Opus-class.

## Portal

Manage your key, rotate it, and see cap usage at:

**https://router.neosmith.ai/me/login**

## Uninstall

```bash
npx @neosmithai/cli uninstall
```

Claude Code goes back to Anthropic direct on its next launch.

## License

MIT. Source: https://github.com/Neosmith-ai/cli

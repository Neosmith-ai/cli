#!/usr/bin/env node
// NeoSmith CLI — wires Claude Code (or any other Anthropic-compatible
// client) to route through https://router.neosmith.ai. Same UX, ~60%
// lower inference cost.
//
// Usage:
//   npx @neosmith-ai/cli init <api-key>
//   npx @neosmith-ai/cli verify
//   npx @neosmith-ai/cli uninstall
//
// Zero runtime deps on purpose — only Node stdlib.

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const readline = require("readline");

const ROUTER = process.env.NEOSMITH_BASE_URL || "https://router.neosmith.ai";
const MODEL = "claude-opus-4";
const CLAUDE_SETTINGS = path.join(os.homedir(), ".claude", "settings.json");
const BACKUP_SUFFIX = ".neosmith-backup";

const COLORS = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m",
};
function c(color, s) { return process.stdout.isTTY ? COLORS[color] + s + COLORS.reset : s; }

// ── commands ────────────────────────────────────────────────────────────

function cmdInit(args) {
  let key = args[0];
  if (!key) {
    // Interactive prompt
    key = promptSync("Paste your NeoSmith API key (sk-plus-*, sk-slm-*, sk-std-*): ").trim();
    if (!key) die("No key provided. Aborting.");
  }
  if (!/^sk-(plus|slm|std)-/.test(key) && !/^eyJ/.test(key)) {
    warn("That doesn't look like a NeoSmith API key (expected sk-plus-*, sk-slm-*, sk-std-*, or a Cognito JWT).");
    if (!confirm("Proceed anyway?")) die("Aborted.");
  }

  ensureDir(path.dirname(CLAUDE_SETTINGS));
  const existing = readJSON(CLAUDE_SETTINGS);
  if (hasNeoSmithConfig(existing)) {
    if (!confirm("Claude Code already configured for NeoSmith. Overwrite?")) die("Aborted.");
  } else if (hasAnthropicConfig(existing)) {
    // Back up direct-Anthropic config so uninstall can restore it
    const backup = CLAUDE_SETTINGS + BACKUP_SUFFIX;
    writeJSON(backup, existing);
    log(c("dim", `Backed up prior config → ${backup}`));
  }

  const next = { ...existing, env: { ...(existing.env || {}) } };
  next.env.ANTHROPIC_BASE_URL = ROUTER;
  next.env.ANTHROPIC_API_KEY = key;
  next.env.ANTHROPIC_MODEL = MODEL;
  writeJSON(CLAUDE_SETTINGS, next);

  log(c("green", `✓ Wrote ${CLAUDE_SETTINGS}`));
  log("");
  log(c("bold", "Next:") + " open a new Claude Code session. Your next prompt goes through NeoSmith.");
  log("");

  // Verify inline
  log(c("dim", "Verifying key against " + ROUTER + " …"));
  return doVerify(key);
}

function cmdVerify(args) {
  let key = args[0];
  if (!key) {
    const settings = readJSON(CLAUDE_SETTINGS);
    key = settings && settings.env && settings.env.ANTHROPIC_API_KEY;
  }
  if (!key) die("No key found. Run `neosmith init <key>` first or pass --key.");
  return doVerify(key);
}

function doVerify(key) {
  return get(`${ROUTER}/whoami`, { Authorization: `Bearer ${key}` }).then((resp) => {
    if (resp.status !== 200) {
      warn(`NeoSmith returned ${resp.status}: ${resp.body.slice(0, 200)}`);
      if (resp.status === 401) {
        log("Key rejected. Ask your admin to check it, or run `neosmith init <key>` with the latest one.");
      }
      process.exit(1);
    }
    let data;
    try { data = JSON.parse(resp.body); } catch { data = {}; }
    log(c("green", "✓ NeoSmith active"));
    if (data.dev_slug) {
      log(`  dev:  ${c("bold", data.dev_slug)}   org: ${data.org_id}   tier: ${data.tier}`);
      if (data.cap) {
        const used = (data.cap.consumed_30d || 0).toLocaleString();
        const cap = (data.cap.effective_cap_tokens || 0).toLocaleString();
        const rem = (data.cap.remaining ?? 0).toLocaleString();
        log(`  cap:  ${used} / ${cap} tokens used in last 30 days (${rem} remaining)`);
      }
    }
    log("");
    log(c("dim", `See your portal: ${ROUTER}/me/login`));
  });
}

function cmdUninstall() {
  const existing = readJSON(CLAUDE_SETTINGS);
  if (!existing || !existing.env) die("Nothing to uninstall — Claude Code config not found.");
  if (!hasNeoSmithConfig(existing)) {
    warn("Claude Code isn't pointed at NeoSmith. Nothing to do.");
    return Promise.resolve();
  }

  const backup = CLAUDE_SETTINGS + BACKUP_SUFFIX;
  let next;
  if (fileExists(backup)) {
    next = readJSON(backup);
    log(c("dim", `Restored pre-NeoSmith config from ${backup}`));
    fs.unlinkSync(backup);
  } else {
    next = { ...existing };
    next.env = { ...(existing.env || {}) };
    delete next.env.ANTHROPIC_BASE_URL;
    delete next.env.ANTHROPIC_API_KEY;
    delete next.env.ANTHROPIC_MODEL;
    if (Object.keys(next.env).length === 0) delete next.env;
  }
  writeJSON(CLAUDE_SETTINGS, next);
  log(c("green", "✓ NeoSmith removed from Claude Code config."));
  log("  Claude Code will talk to Anthropic directly on its next launch.");
  return Promise.resolve();
}

function cmdHelp() {
  log(`${c("bold", "NeoSmith CLI")} — drop-in router for Claude Code.`);
  log("");
  log(c("bold", "Commands:"));
  log("  " + c("cyan", "neosmith init <key>") + "        Point Claude Code at NeoSmith.");
  log("  " + c("cyan", "neosmith verify") + "             Check that your key is active.");
  log("  " + c("cyan", "neosmith uninstall") + "          Restore Claude Code to direct Anthropic.");
  log("");
  log(c("bold", "Example:"));
  log(`  ${c("dim", "$")} npx @neosmith-ai/cli init sk-plus-alice-xxxxxx`);
  log("");
  log(c("dim", "No NeoSmith account yet? Email contact-us@neosmith.ai for a trial key."));
  log(c("dim", `Docs: ${ROUTER}/me/login  ·  Status: github.com/Neosmith-ai/issues`));
}

// ── helpers ─────────────────────────────────────────────────────────────

function hasNeoSmithConfig(s) {
  return s && s.env && typeof s.env.ANTHROPIC_BASE_URL === "string" &&
    s.env.ANTHROPIC_BASE_URL.includes("neosmith.ai");
}
function hasAnthropicConfig(s) {
  return s && s.env && (s.env.ANTHROPIC_API_KEY || s.env.ANTHROPIC_BASE_URL);
}
function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function fileExists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); }
  catch { return {}; }
}
function writeJSON(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", { mode: 0o600 });
}
function log(s) { console.log(s); }
function warn(s) { console.error(c("yellow", "! ") + s); }
function die(s) { console.error(c("red", "✗ ") + s); process.exit(1); }

function promptSync(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // readline.question is async — use a sync hack via execSync for a tiny helper
  return new Promise((resolve) => {
    rl.question(q, (ans) => { rl.close(); resolve(ans); });
  });
}
function confirm(q) {
  if (!process.stdout.isTTY) return true;  // default yes in non-interactive
  const ans = require("child_process")
    .execSync(`printf "%s" "${q} [Y/n] "; read -r r; echo $r`, { stdio: ["inherit", "pipe", "inherit"], shell: "/bin/bash" })
    .toString().trim().toLowerCase();
  return ans === "" || ans === "y" || ans === "yes";
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(new Error("timeout")); });
  });
}

// ── entry ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const cmd = (args.shift() || "").toLowerCase();
  try {
    switch (cmd) {
      case "init":      await cmdInit(args); break;
      case "verify":    await cmdVerify(args); break;
      case "uninstall": await cmdUninstall(); break;
      case "":
      case "-h":
      case "--help":
      case "help":      cmdHelp(); break;
      default:
        warn(`Unknown command: ${cmd}`);
        cmdHelp();
        process.exit(1);
    }
  } catch (e) {
    die(e && e.message ? e.message : String(e));
  }
}

main();

---
name: Bug
about: Defect, regression, or unexpected behavior
title: "[Bug] "
labels: ["bug", "status:triage"]
---

## Description

What happened?

> e.g., Claude Code hangs when model returns empty response body

## Steps to Reproduce

Minimal steps to trigger the bug.

```
1. Run `claude --model neosmith.intelligent-pro`
2. Ask a question that triggers an empty response
3. CLI hangs indefinitely, no timeout
```

## Expected Behavior

What should happen instead?

> e.g., Should retry or show error after 30s timeout

## Environment

- OS: (e.g., macOS 14)
- Agent: (e.g., Claude Code 0.9.0)
- Model: (e.g., neosmith.intelligent-pro)
- CLI version: (e.g., 1.2.3)

## Priority

- [ ] p0-critical
- [ ] p1-high
- [ ] p2-medium
- [ ] p3-low

## Domain

- [ ] domain:router
- [ ] domain:models
- [ ] domain:cli
- [ ] domain:docs
- [ ] domain:infra
- [ ] domain:security
- [ ] domain:platform

## Agent Context

Logs, file paths, related issues.

```
- Related: #
- Logs:
- Files:
```

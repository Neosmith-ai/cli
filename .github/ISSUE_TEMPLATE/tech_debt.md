---
name: Technical Debt
about: Refactoring, cleanup, modernization, or deprecation
title: "[Tech Debt] "
labels: ["tech-debt", "status:triage"]
---

## Description

What needs to be refactored or cleaned up?

> e.g., Migrate from legacy v1 router endpoints to v2, remove backward-compat shim

## Risk of Inaction

What breaks or slows down if we don't do this?

> e.g., v1 shim adds 50ms per request, blocks new feature rollout, will be removed Q3

## Proposed Approach

How should the agent tackle this?

> e.g., Phase 1: Add v2 proxy, Phase 2: Migrate consumers, Phase 3: Remove v1

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

Paths, related issues, migration guides.

```
- Related: #
- Files:
- Estimate:
```

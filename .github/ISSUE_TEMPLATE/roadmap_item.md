---
name: Roadmap Item
about: Long-term strategic initiative or platform direction
title: "[Roadmap] "
labels: ["roadmap", "status:triage"]
---

## Goal

What is the strategic objective?

> e.g., Support real-time voice coding via speech-to-code pipeline

## Impact

Who benefits and how?

> e.g., Reduces latency for voice-first users by 40%, enables hands-free IDE control

## Dependencies / Blockers

What needs to happen first?

> e.g., Waiting on WebRTC streaming refactor, depends on audio buffer pipeline

## Success Criteria

How will we know this is done?

> e.g., Voice coding beta live with <200ms end-to-end latency, 10+ pilot users

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

## Agent Context (for future agentic SDLC)

Structured data agents can parse. Include file paths, APIs, or related issues.

```
- Related: #123, #456
- API: router.neosmith.ai/v1/speech
- Files: src/voice/*, infra/webrtc/*
- Estimate: 3 sprints
```

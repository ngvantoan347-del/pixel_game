# SDD ledger — plan: docs/superpowers/plans/2026-09-12-pixel-quest.md
## Pre-flight scan (2026-09-12)

| Pair/File | One produces / other consumes | Check result |
|---|---|---|
| T10 main.ts scenes vs T11-16 | stubs replaced wholesale | consistent |
| T9 GameSession vs T11 GameScene | session module var currentSession | GAP: nobody instantiates GameSession / calls setGameSession |
| T13 HudScene vs T9 events | create-seed via getGameSession | consistent after ruling |
| T16 score vs T9 defeatBoss | session.score stale on victory | GAP: VictoryScene should compute display score locally |
| T11 GameScene.ts | dead code describePortals, unused imports | Ruling: prune (lint strict) |
| T12-T16 hooks shared GameScene.update | sequential additions | consistent |

Ruling: session wiring — TitleScene pointerdown must wait loadSave(), setGameSession(new GameSession(save)) before scene.start("GameScene"); GameScene.create falls back to 
ew GameSession(DEFAULT_SAVE) (import from @/lib/saves) if currentSession is null so it never crashes; loadSave() failures fall back to DEFAULT_SAVE. Cost if wrong: session never wired = black screen.
Ruling: victory score — client computes display score = min(coins + (boss_defeated?1000:0), 99999); server remains authoritative for leaderboard. Cost if wrong: victory shows 0.
Ruling: lint strict (--max-warnings=0) — implementers must prune unused imports/dead code (describePortals dropped). Cost if wrong: task fails lint.
Ruling: briefs generated at .superpowers/sdd/pixel-quest/brief-*.md; batches A(1-6) B(7) C(8-9) D(10) E(11-13) F(14-17) G(18-19).

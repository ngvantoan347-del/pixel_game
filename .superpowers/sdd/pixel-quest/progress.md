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

### Batch A review (2026-09-12)
Verdict: Approved. Important findings:
1. leaderboard.ts:35-41 submitScore dual-write persists client-supplied score to saves -> non-authoritative scoring.
2. saves.ts:34-46 hp<=max_hp not enforced.
Ruling F1 (leaderboard): submitScore ignores client score/boss values; loads existing saves row; computes authoritative score via computeScore; inserts ONLY the leaderboard history row. getLeaderboardRows stays derived from saves. Plan test 'records a run submission' amended to assert history row inserted + GET derives from saves. Cost if wrong: submitted run may not bump board (acceptable; board is saves-derived).
Ruling F2 (hp/max_hp): add superRefine to clampSave enforcing hp<=max_hp. Cost if wrong: minor.
Minor bundled: .env.example trailing newline; remove coffins no-op in saves.test.ts.
Fix round: dispatch to original implementer (ses_f6aaacd1affeplfhhJr1Julyos).

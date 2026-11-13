# Hoop Land Ultimate Trainer

Instant in-browser trainer/editor for Hoop Land save files. Drop or paste a raw save, then edit **everything**: coins, rosters, any player in any pool (showcase/star teams, draft class, free agents), full ratings + ceilings, a dedicated **Potential** tab (pot, ceiling presets, Young Star / Late Bloomer / No Regression, XP/AP), per-skill level/XP/equip, tendencies presets, appearance & outfits, contract + extension, injury/game-status, stats, and an **All fields** inspector that can find and edit literally any value in the save. Team and league objects get the same all-fields treatment. Then **Copy raw save** and paste it into Hoop Land's import.

Mobile-first: tabbed player editor, section quick-nav, sticky Copy/Download bar, 44px touch targets.

Tests: `node tests/any-player.test.mjs && node tests/ultimate-trainer.test.mjs`

Everything runs locally in the browser — your save never uploads anywhere. Works offline once loaded.

Live: https://squasa.github.io/hoop-land-menu/

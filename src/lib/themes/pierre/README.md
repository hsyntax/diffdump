# Pierre themes

`pierre-light.json` and `pierre-dark.json` are unmodified copies from
`packages/theme/themes/` in the sibling `pierre` repository, at commit
`4f60f29f3b9caf95945ea505bd0cc8b97acb8850`.

These are the standard themes available to `apps/diffshub`, not the `-soft`
variants it selects by default. The JSON files include the complete Shiki /
TextMate token rules, semantic token rules, and editor colors. The package's
Shiki modules are generated from these same definitions.

Diffdump registers them under local aliases in `src/lib/diff-themes.ts`,
without overriding their syntax colors or diff backgrounds. App CSS maps the
editor and sidebar colors onto Diffdump's surfaces, using Diffshub's foreground
mixes for controls and borders.

Buttons use a stronger blue treatment derived from Pierre's accent, with a
darker primary fill in light mode for readable white labels. These app-only
adjustments do not change the copied theme definitions.

Upstream: https://github.com/pierrecomputer/pierre/tree/4f60f29f3b9caf95945ea505bd0cc8b97acb8850/packages/theme

The copied themes are Apache-2.0 licensed. See `LICENSE` and `NOTICE.md`,
including the original Primer attribution.

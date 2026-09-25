# Pierre themes

`pierre-light.json` and `pierre-dark.json` are unmodified copies from
`packages/theme/themes/` in the sibling `pierre` repository, at commit
`4f60f29f3b9caf95945ea505bd0cc8b97acb8850`.

These are the standard themes available to `apps/diffshub`, not the `-soft`
variants it selects by default. The JSON files include the complete Shiki /
TextMate token rules, semantic token rules, and editor colors. The package's
Shiki modules are generated from these same definitions.

Diffdump does not use Pierre's colors directly. `src/lib/diff-themes.ts`
registers `diffdump-light` and `diffdump-dark`, which load these files and
replace every color with diffdump's warm palette through a per-color mapping.
Token rules, scopes, and alpha values are kept as copied; only color values
change, plus a few editor colors whose Pierre value is shared with an
unrelated syntax role. `src/lib/diff-themes.test.ts` checks that every color
in both files has a mapping.

Upstream: https://github.com/pierrecomputer/pierre/tree/4f60f29f3b9caf95945ea505bd0cc8b97acb8850/packages/theme

The copied themes are Apache-2.0 licensed. See `LICENSE` and `NOTICE.md`,
including the original Primer attribution. The recolored themes diffdump
renders are modified versions of these files.

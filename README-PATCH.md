# Galaxy Quest theme — contrast fix

Only one file actually needed to change: `src/themes/galaxy-quest/tokens.css`.

## The bug
The theme's color variables were declared under the selector:

    [data-theme='galaxy-quest'] { --background: ...; --primary: ...; ... }

This has the exact same CSS specificity as the app's existing:

    :root { --background: ...; --primary: ...; ... }

in `src/index.css`. Because `:root` is compiled later in the final stylesheet,
it won the cascade tie and silently overwrote the theme's dark colors back to
the light defaults — for the plain variables only. Backgrounds styled by
classes (`.space-background`, `.dashboard-background`, `.card-surface`, etc.)
have higher specificity, so those correctly went dark. But anything relying
directly on `--primary` / `--foreground` (headings, card labels, the header's
own background) silently stayed on the light-theme colors — producing
dark-on-dark invisible text, and a header that never re-skinned at all.

## The fix
Bump the selector's specificity so it reliably beats `:root` regardless of
import/declaration order:

    [data-theme='galaxy-quest'] { ... }
    -> html[data-theme='galaxy-quest'] { ... }

That's the only change in this patch. Drop the file in at
`src/themes/galaxy-quest/tokens.css`, replacing the existing one — no other
files need to change.

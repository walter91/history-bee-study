# -*- coding: utf-8 -*-
"""Add the PWA document shell to the generated quiz HTML.

``build_assets.py`` imports :func:`wrap_html` and writes the wrapped result
directly to this folder's ``index.html``. Running this module directly remains
an idempotent repair option for an already-generated file.
"""
import os

HEAD_OLD = """<title>History Bee Drills</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>"""

HEAD_NEW = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>History Bee Drills</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#1B2740">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Hist Bee">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" href="icon-192.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>"""

BODY_OLD = """</style>

<div class="shell">"""

BODY_NEW = """</style>
</head>
<body>

<div class="shell">"""

TAIL_OLD = """applyFilters();
renderSidebarStats();
renderLog();
</script>"""

TAIL_NEW = """applyFilters();
renderSidebarStats();
renderLog();
</script>

<script>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
</script>

</body>
</html>"""

def wrap_html(html):
    """Return PWA-wrapped HTML and the number of transforms applied."""
    changed = 0
    if HEAD_OLD in html:
        html = html.replace(HEAD_OLD, HEAD_NEW, 1)
        changed += 1
    elif "<!DOCTYPE html>" not in html:
        raise ValueError("Could not find expected <head> block to wrap -- template may have changed.")

    if BODY_OLD in html:
        html = html.replace(BODY_OLD, BODY_NEW, 1)
        changed += 1
    elif "<body>" not in html:
        raise ValueError("Could not find expected shell-div boundary to insert <body> at.")

    if TAIL_OLD in html:
        html = html.replace(TAIL_OLD, TAIL_NEW, 1)
        changed += 1
    elif 'register("sw.js")' not in html:
        raise ValueError("Could not find expected end-of-script block to append the SW registration to.")

    return html, changed


def main():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
    with open(path, encoding="utf-8") as f:
        html = f.read()
    html, changed = wrap_html(html)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Applied {changed}/3 wrapper transforms (0 means the file was already wrapped).")


if __name__ == "__main__":
    main()

#!/bin/sh
# After `expo export --platform web`: phone-browser tweaks for dist/index.html
# (dark top bar on Android Chrome, no white flash or overscroll, home-screen name).
set -e
sed -i 's#<meta name="viewport"#<meta name="theme-color" content="\#060818" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black" /><meta name="apple-mobile-web-app-title" content="Dohyun Kim" /><style>html,body{background:\#060818}</style><meta name="viewport"#' dist/index.html

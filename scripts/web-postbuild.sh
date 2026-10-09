#!/bin/sh
# After `expo export --platform web`: phone-browser tweaks for dist/index.html
# (dark top bar on Android Chrome, no white flash or overscroll, home-screen name,
# and browser autofill keeps the dark input style instead of Chrome's light blue).
set -e
sed -i 's#<meta name="viewport"#<meta name="theme-color" content="\#060818" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-status-bar-style" content="black" /><meta name="apple-mobile-web-app-title" content="Dohyun Kim" /><style>html,body{background:\#060818}input:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px \#1C1A45 inset;-webkit-text-fill-color:\#F2EEFF;caret-color:\#F2EEFF;transition:background-color 9999s}</style><meta name="viewport"#' dist/index.html

#!/bin/bash
# Double-click this file to preview the Stage 4 Music site locally.
# It starts a small web server and opens the site in your browser.
# (Opening index.html directly with a double-click shows a blank page,
#  because browsers block in-browser Babel from loading the .jsx files
#  over file://; a local web server fixes that.)

# Move into the folder this script lives in.
cd "$(dirname "$0")" || exit 1

PORT=8753

echo "Starting the Stage 4 Music site..."
echo "Folder: $(pwd)"
echo

# Open the browser once the server has had a moment to start.
( sleep 1.5; open "http://localhost:$PORT/index.html" ) &

echo "Site is running at:  http://localhost:$PORT/index.html"
echo
echo "Leave this window open while you use the site."
echo "Close this window (or press Control-C) when you're finished."
echo

# Start the web server (this keeps running until you close the window).
python3 -m http.server "$PORT"

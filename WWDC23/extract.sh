#!/bin/bash

# Specify the directory containing your README files
README_DIR="./sessions"

# Loop through each README file in the directory
for readme in "$README_DIR"/session_*/README.md; do
    # Use grep to find lines that start with "## " (assuming titles are level 2 headers)
    title_line=$(grep -E '^# ' "$readme" | head -n 1)

    # Extract the title text using sed
    title=$(echo "$title_line" | sed -E 's/^# (.*)/\1/')

    # Print the extracted title along with the filename
    echo "- [$title]($readme)"
done

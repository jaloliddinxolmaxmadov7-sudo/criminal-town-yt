#!/bin/bash
# usage: rebuild.sh <project dir> <generator name>
cd "$1" || exit 1
python3 /home/claude/gen/$2.py > /dev/null
python3 tools/build.py > /dev/null 2>&1
python3 /home/claude/gen/split.py 1.45 > /dev/null
python3 tools/build.py > /dev/null 2>&1
python3 /home/claude/gen/anglefix.py > /dev/null
python3 tools/build.py 2>&1 | grep "shots in\|ERROR"
node tools/audit.mjs 2>&1 | grep -v "back to the camera" | tail -8

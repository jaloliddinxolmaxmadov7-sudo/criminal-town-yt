set -e
python3 gen.py
python3 tools/build.py >/dev/null
python3 ../../tools/split.py 1.45
python3 patch.py
python3 tools/build.py | grep -E "warn|error|shots in" || true

"""Starts a new "In This Town" project: copies the starter (engine, tools, captions) into a folder.

  python new_project.py "<project folder>"

Refuses to write into a folder that already has a story.json. Then write story.json there (references/story.md).
"""
import os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
STARTER = os.path.join(os.path.dirname(HERE), "assets", "starter")


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    dst = os.path.abspath(sys.argv[1])
    if os.path.exists(os.path.join(dst, "story.json")):
        raise SystemExit(f"{dst} already has a story.json: pick a new folder")
    os.makedirs(dst, exist_ok=True)
    for name in os.listdir(STARTER):
        src = os.path.join(STARTER, name)
        out = os.path.join(dst, name)
        if os.path.isdir(src):
            shutil.copytree(src, out, dirs_exist_ok=True)
        else:
            shutil.copy2(src, out)
    for sub in ("vo", "renders", "qa", "audio"):
        os.makedirs(os.path.join(dst, sub), exist_ok=True)
    print(f"project ready: {dst}")
    print("next: write story.json there, then: python tools/voice.py, python tools/timeline.py")


if __name__ == "__main__":
    main()

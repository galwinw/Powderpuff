#!/usr/bin/env python3
"""Stamp a new version on every script/stylesheet link so browsers load fresh files
after a deploy instead of reusing old cached copies. Run before each deploy:

    python3 tools/stamp.py
"""
import pathlib
import re
import time

root = pathlib.Path(__file__).resolve().parent.parent
version = time.strftime("%Y%m%d%H%M")

index = root / "index.html"
html = re.sub(r'((?:href|src)="(?:css/app\.css|config\.js|js/app\.js))(?:\?v=\w+)?"', rf'\1?v={version}"', index.read_text())
index.write_text(html)

for f in (root / "js").glob("*.js"):
    src = re.sub(r'(from "\./[\w-]+\.js)(?:\?v=\w+)?"', rf'\1?v={version}"', f.read_text())
    f.write_text(src)

print("Stamped version", version)

#!/usr/bin/env python3
"""Turn the Chrome 'Web Page, Complete' save into a clean STATIC copy:
strip all <script> (so React can't re-run and blank the page), rewrite the
messy `_files` folder name to `home_files`, keep CSS/images. Output -> site-static/."""
import re
import pathlib
import shutil

d = pathlib.Path(__file__).resolve().parent
src_html = d / "Kai Zanzibar Hotel & Spa _ Adults-Only Resort, Nungwi.html"
src_files = d / "Kai Zanzibar Hotel & Spa _ Adults-Only Resort, Nungwi_files"
out = d / "site-static"
out.mkdir(exist_ok=True)

html = src_html.read_text(encoding="utf-8", errors="replace")

# rewrite asset-folder references (HTML-encoded & and raw &) to a clean name
for variant in (
    "Kai Zanzibar Hotel &amp; Spa _ Adults-Only Resort, Nungwi_files",
    "Kai Zanzibar Hotel & Spa _ Adults-Only Resort, Nungwi_files",
):
    html = html.replace(variant, "home_files")

# strip every <script> ... </script> block and any standalone script tags
html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
html = re.sub(r"<script\b[^>]*/?>", "", html, flags=re.IGNORECASE)

(out / "index.html").write_text(html, encoding="utf-8")

# copy the assets folder under the clean name
dst_files = out / "home_files"
if dst_files.exists():
    shutil.rmtree(dst_files)
shutil.copytree(src_files, dst_files)

print(f"wrote {out/'index.html'}  ({len(html)} bytes)")
print(f"scripts remaining: {html.lower().count('<script')}")
print(f"assets copied to {dst_files} ({sum(1 for _ in dst_files.iterdir())} files)")

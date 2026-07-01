# ffmpeg / ffprobe sidecars

Tauri's sidecar mechanism (`bundle.externalBin` in `tauri.conf.json`) expects
platform-specific binaries here, named with the Rust target triple suffix,
e.g.:

```
binaries/ffmpeg-x86_64-unknown-linux-gnu
binaries/ffmpeg-x86_64-pc-windows-msvc.exe
binaries/ffmpeg-aarch64-apple-darwin
binaries/ffprobe-x86_64-unknown-linux-gnu
binaries/ffprobe-x86_64-pc-windows-msvc.exe
binaries/ffprobe-aarch64-apple-darwin
```

Run `rustc -Vv | grep host` to get the triple for the machine you're building
on, or check `src-tauri/target/*/` after a build attempt (Tauri prints the
expected filename in its error message if the binary is missing).

These binaries are **not checked into this repo** (large, platform-specific,
and licensing varies by build). Populate this directory yourself before
running `npm run tauri build` or `npm run tauri dev`:

- Static builds: https://johnvansickle.com/ffmpeg/ (Linux),
  https://www.gyan.dev/ffmpeg/builds/ (Windows),
  https://evermeet.cx/ffmpeg/ (macOS)
- Prefer an **LGPL** build (no `--enable-gpl`) unless you've reviewed the
  license implications of distributing GPL binaries with the app.
- `chmod +x` the binaries on macOS/Linux after placing them.

Sidecars are desktop-only — Tauri does not support `externalBin` on iOS/Android.
Mobile builds will need ffmpeg linked in-process instead (see project roadmap).

## If you just want to try the pipeline without the desktop app

`crates/etheria-cli` (binary name `etheria`) exercises the exact same probe/
remux/transcode logic (via the shared `media-core` crate) without any of the
sidecar bundling above — it just looks up `ffmpeg`/`ffprobe`/`ffplay` on your
`PATH` (or `--ffmpeg-path`/`--ffprobe-path`/`--ffplay-path` if you'd rather
point at something specific):

```
cargo run -p etheria-cli -- probe some-video.mkv
cargo run -p etheria-cli -- play some-video.mkv
```

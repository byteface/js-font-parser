# Curated Font Fixtures

Additional font fixtures downloaded to broaden parser/test coverage across:
- TrueType static + variable fonts
- OpenType CFF/CJK fonts
- Color emoji font
- Latin + non-Latin scripts

## Files

- `IBMPlexSerif-Regular.ttf`
  - Source: https://github.com/google/fonts/raw/main/ofl/ibmplexserif/IBMPlexSerif-Regular.ttf
  - SHA256: `e882efa9c41949a528ac2369079ec5ef050c1c996bbd0bacce3c3326d44cf80d`
- `FiraSans-Regular.ttf`
  - Source: https://github.com/google/fonts/raw/main/ofl/firasans/FiraSans-Regular.ttf
  - SHA256: `c29556a2719bf613ef3d5e070e40d903a8965d9c081beca1375dc1e6e0f93c23`
- `Inter-VF.ttf`
  - Source: https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf
  - SHA256: `29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031`
- `Roboto-VF.ttf`
  - Source: https://github.com/google/fonts/raw/main/ofl/roboto/Roboto%5Bwdth,wght%5D.ttf
  - SHA256: `d7598e12c5dbef095ff8272cfc55da0250bd07fbdecbac8a530b9b277872a134`
- `NotoSerif-VF.ttf`
  - Source: https://github.com/google/fonts/raw/main/ofl/notoserif/NotoSerif%5Bwdth,wght%5D.ttf
  - SHA256: `4d8e6761424656867019081a1a01336f3cb086982682698714054fc33f782713`
- `NotoSansTamil-VF.ttf`
  - Source: https://github.com/google/fonts/raw/main/ofl/notosanstamil/NotoSansTamil%5Bwdth,wght%5D.ttf
  - SHA256: `aa3a9b321f4b0bb2c40203ffbde9af89713227866e0e13f76e5b9eeea727cf88`
- `NotoSansGeorgian-VF.ttf`
  - Source: https://github.com/google/fonts/raw/main/ofl/notosansgeorgian/NotoSansGeorgian%5Bwdth,wght%5D.ttf
  - SHA256: `dc591156f36842d38996c4a7a17fee9bb58e45da3e2cac7a31b7d33de700adb9`
- `SourceSerif4-Regular.otf`
  - Source: https://github.com/adobe-fonts/source-serif/raw/release/OTF/SourceSerif4-Regular.otf
  - SHA256: `edf160d0d584deee8a3bb2c3371b2a7624ca63580fbe02c57c1f4c91e84d8787`
- `SourceSerif4Variable-Roman.otf`
  - Source: https://github.com/adobe-fonts/source-serif/raw/release/VAR/SourceSerif4Variable-Roman.otf
  - SHA256: `867b73c6a954a4a64616906d179f94572a748790a1d022ebeeff07f56ea0221a`
- `SourceSerif4Variable-Italic.otf`
  - Source: https://github.com/adobe-fonts/source-serif/raw/release/VAR/SourceSerif4Variable-Italic.otf
  - SHA256: `68220a94535e9cffb9b7d844140583ac2a3195eabdd4890b15f83272c8bfcfe4`
- `SourceSans3-Regular.otf`
  - Source: https://github.com/adobe-fonts/source-sans/raw/release/OTF/SourceSans3-Regular.otf
  - SHA256: `08df266400933d3178d081a45f94a08814c3e55b4b7dd2e0ff69cb1329f13ab6`
- `NotoSansCJKjp-Regular.otf`
  - Source: https://github.com/notofonts/noto-cjk/raw/main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf
  - SHA256: `68a3fc98800b2a27b371f2fb79991daf3633bd89309d4ffaa6946fd587f375b5`
- `NotoColorEmoji.ttf`
  - Source: https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf
  - SHA256: `72a635cb3d2f3524c51620cdde406b217204e8a6a06c6a096ff8ed4b5fd6e27b`
- `AppleColorEmoji-sbix-subset.ttf`
  - Source: subset extracted from `/System/Library/Fonts/Apple Color Emoji.ttc` (font 0) with `pyftsubset --text='😀👍❤️'`
  - SHA256: `a8a1f3b591719124cd7494b13bc4306b83d30a0c72cbf038efc72f62090465e3`

## Notes
- These files were pulled via `curl -fL` directly from upstream repositories.
- Licenses are provided by the upstream projects (mostly SIL OFL / project-specific open licenses).

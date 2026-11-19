# Third-Party Notices & Reused Source Attribution

## 1. Three.js & CSS3DRenderer (r128)
- **Repository:** https://github.com/mrdoob/three.js
- **Commit:** `d4aa9e00ea29808534a3e082f602c544e5f2419c` (tag `r128`)
- **Files vendored in `assets/vendor/three-r128/`:**
  - `build/three.min.js` → `assets/vendor/three-r128/three.min.js`
  - `examples/js/renderers/CSS3DRenderer.js` → `assets/vendor/three-r128/CSS3DRenderer.js`
  - `LICENSE` → `assets/vendor/three-r128/LICENSE`
- **License:** MIT License (preserved verbatim in `assets/vendor/three-r128/LICENSE`).
- **Modifications:** None to the vendored Three.js library files; customized scene integration resides in `assets/js/scene-engine.js`.
- **Referenced upstream examples (r128, MIT):**
  - `examples/css2d_label.html` & `examples/js/renderers/CSS2DRenderer.js` (tag `r128`, commit `d4aa9e00ea29808534a3e082f602c544e5f2419c`): referenced the 3D-to-2D camera NDC projection pattern (`vector.applyMatrix4(matrixWorld).project(camera)` + frustum `z > 1` check) and adapted it directly into `projectCardLocalPoint` / `updateOverviewLabels` in `assets/js/scene-engine.js` with 2D AABB overlap avoidance instead of vendoring a third renderer.

## 2. Eleventy Base Blog (Template Patterns)
- **Repository:** https://github.com/11ty/eleventy-base-blog
- **Commit:** `ae47fc5ef40d8ebf53f0e185ee5f0e61e7e6e2d4`
- **Author:** Zach Leatherman (https://zachleat.com/)
- **License:** MIT License (reproduced below)
- **Referenced & customized templates:**
  - `content/tag-pages.njk` → adapted to `content/work-pages.njk` (paginates over `catalog.nodes` to emit `/work/<slug>/index.html`).
  - `content/sitemap.xml.njk` → adapted to `content/sitemap.xml.njk` (iterates only public canonical URLs and omits `lastmod` unless a verified date is supplied).

```text
MIT License

Copyright (c) 2019–2024 Zach Leatherman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 3. Repository Internal Sources Reused
- **Commit `63464e5d83f38d79e6f41bb7bc6540bd7fa2ce4d` (`main`):**
  - `mobile.html` (L175–196 `videoLinkAndThumb` adapted into `assets/js/nodes-data.js` to support both YouTube `watch?v=`/`embed/`/`youtu.be/` and Google Drive URLs; `mailto:`/`tel:` patterns).
  - `index.html` (L70–134 JSON-LD `Person`, `sameAs`, `VideoObject` / `MusicVideoObject` seed metadata).
  - Site-root hosting/verification files preserved verbatim in `public/`: `google96fbb76f00681fc4.html`, `.nojekyll`.
  - Non-published legacy reference archive kept in `legacy/` (excluded from `_site/` build): `mobile.html`, `blog/`.
- **Commit `b6ece6c802575b44eef9383d46dc6628fe1f389c` (`servant-circuit-production.html`):**
  - `goToStation` destination-commit vs flight separation adapted into `assets/js/scene-engine.js`.

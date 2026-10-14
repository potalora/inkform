# tattoo you asset notices

tattoo you saves projects and artwork in this browser. The static beta contains no
private artwork library, sample tattoo artwork, saved workspace, or server API.
This document lists third-party notices only; it does not relicense tattoo you or
user-supplied artwork. The independently licensed assets below retain their
original terms.

`runtime-assets.json` is the explicit distribution definition. `asset-manifest.json`
records each published path, byte count, SHA-256, license family and provenance.
Its deterministic contents exclude the manifest itself. Authoring inputs are
excluded; runtime meshes, images and notices retain existing relative URLs.

## Body reference assets

- **MakeHuman hm08:** CC0 1.0, MakeHuman team, Manuel Bastioni, Data Collection AB,
  Joel Palmius and Jonas Hauquier. Adult male/female geometry, morph grids, fitted
  eyes and official system skin textures derive from pinned upstream assets.
  [Original license](studio/models/source/LICENSE.md),
  [complete CC0 terms](studio/models/source/LICENSE.ASSETS.md),
  [provenance](studio/models/provenance.json),
  [skin provenance](studio/models/skin-provenance.json).
  The three image files under `models/source/` are runtime dependencies; OBJ,
  rig, target and material authoring inputs are excluded.
- **Aksel male normal detail:** CC0 1.0, Mindfront, from the official MakeHuman
  Community skins02 CC0 pack. Only the runtime normal map is included.
  [Notice](studio/models/detail/LICENSE.md), [provenance](studio/models/detail/provenance.json).
- **Blender Studio Human Base Meshes v1.4.1:** CC0 1.0, Blender community and
  Blender Studio. Locally converted geometry, fitted eyes and sculpt normal
  maps; no source blend file. [Notice](studio/models/blender-studio/LICENSE.txt),
  [provenance and conversion details](studio/models/blender-studio/provenance.json).
- **MHR v1.0.1 neutral reference:** Apache 2.0, Meta Platforms / MHR contributors.
  The upstream maintainer confirmed the asset license and added it to the
  release archive in [issue 62](https://github.com/facebookresearch/MHR/issues/62).
  Locally converted static neutral geometry is included; the FBX and learned
  model files are excluded. [License](studio/models/mhr/LICENSE.txt),
  [provenance](studio/models/mhr/provenance.json).
- **Drummyfish 3D male:** CC0 1.0, Drummyfish, manually authored geometry and
  original painted texture from OpenGameArt. Retained for imported studies.
  [Notice](studio/models/drummyfish/LICENSE.md), [provenance](studio/models/drummyfish/provenance.json).
- **Atelier / Vitruvian:** CC0 1.0, Sean Buckley, Olaf Delgado-Friedrichs and
  additional contributors credited by the pinned CharMorph-Vitruvian source.
  Converted geometry, accessories, morph grids and independently sampled skin
  maps; CharMorph tool code and source EXR/blend inputs are excluded.
  [Notice](studio/models/atelier/LICENSE.md), [provenance](studio/models/atelier/provenance.json).

## Environment

The concrete treatment room, furniture, procedural materials and baked lighting
images are original local authoring dedicated to CC0 1.0.
[Notice](studio/environment/treatment-room/LICENSE.txt),
[provenance](studio/environment/treatment-room/provenance.json).
Studio Small 09 HDR is CC0 1.0, by Sergej Majboroda through
[Poly Haven](https://polyhaven.com/a/studio_small_09);
[provenance](studio/environment/provenance.json).
The Three.js GLTF loader has its own [MIT license](studio/environment/atelier/three.LICENSE.txt).

## Renderer and geometry runtime

Three.js 0.186.1 is MIT licensed; [license](studio/vendor/LICENSE),
[version provenance](studio/vendor/three-version.json).
three-gpu-pathtracer 0.0.27 and three-mesh-bvh 0.9.16 are MIT licensed;
[notices](studio/vendor/pathtracer.LICENSE.txt).
oidn-web 0.5.0 and its float16 helper are MIT licensed;
[notices](studio/vendor/oidn.LICENSE.txt).
Intel Open Image Denoise weights are Apache 2.0;
[license](studio/vendor/oidn-weights.LICENSE.txt), [provenance](studio/vendor/oidn-provenance.json).
The geometry WASM is compiled from the application's AssemblyScript source;
[AssemblyScript Apache license](licenses/assemblyscript-LICENSE.txt) and
[notice](licenses/assemblyscript-NOTICE.txt) accompany its runtime.

## UI and fonts

The self-hosted UI bundle includes React, React DOM, Scheduler,
use-sync-external-store, Base UI, Floating UI, class-variance-authority, clsx, cn,
Lucide React, Reselect, Motion, Framer Motion, motion-dom, motion-utils and tslib. Compiled CSS includes Tailwind CSS and tw-animate-css.
Their original copyright/license texts are in `licenses/`, with the pinned
package versions recorded in `runtime-assets.json`. Adapted shadcn components
retain their [MIT notice](studio/ui/SHADCN-LICENSE).

Manrope, IBM Plex Sans, Instrument Serif, Nunito, Fraunces, Gloock, Bodoni Moda
and Kalnia are self-hosted unmodified font files under SIL Open Font License 1.1.
Their original copyright and OFL notices are included beside each font under
`studio/fonts/` (Manrope uses `OFL-Manrope.txt`). No remote font service is used.

The public beta is a reference visualization, not a scan or medical model.

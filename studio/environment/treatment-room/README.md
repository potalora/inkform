# Inkform zen cyberpunk studio

An original, local 3D interior informed by the approved daylight studio image:
expansive warm mineral concrete, a substantial rear-right vertical timber field,
real architectural glazing and strong diagonal window light. Three sculptural
plants soften the perimeter: broad waxy leaves, fine arching palm foliage and
upright evergreen blades. Honed mineral vessels stay understated. Two narrow
ice-jade reveals and their restrained reflected light provide the cyberpunk
accent. The working area at the origin stays clear.

The original graphite upholstered tattoo bench retains its exact source,
geometry and placement. There are no cabinets, worktops, shelves, supplies,
artwork frames, signage, stool, cart, armrest or task lamp.

## Rebuild

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --threads 2 --python studio/environment/treatment-room/create_room.py
```

Use CPU Cycles and two threads. Add `-- --preview-only` for a quick authoring
render, or `-- --skip-previews` to omit both 1200×800 acceptance renders during
a full build. Atlas denoising still uses the CPU compositor. The room atlas
checkpoint records the recipe and atlas hashes. After an interrupted build,
`-- --reuse-room-atlas` validates both hashes and replays deterministic UVs
before baking the floor and exporting. Imported bench objects are sorted by
name to keep the join anchor and UV replay stable. Geometry, material, lighting
or bake recipe changes require a full build.

Launch long builds as an owned detached process with its PID and log recorded;
inspect the completion marker and outputs before accepting the asset. Do not
use the running Blender GUI or GPU. `treatment-room.glb` embeds both JPEGs.
The editable Blender scene, statistics, checkpoint, physical authoring preview
and exact baked-material preview are under ignored `output/zen-studio/room/`.
The camera maps to Three `[.65,1.08,4.4]`, looking at `[0,.85,0]`, with a 32 mm
Blender lens. `provenance.json` is regenerated with current hashes, sizes,
source licensing, mesh counts, vertex bounds and bake settings.

## Runtime contract

- Metres, glTF Y up, body at origin. Four independently switchable wall groups
  retain `Room_BackWall`, `Room_FrontWall`, `Room_LeftWall`, `Room_RightWall`.
  Back-wall center is z=-3.053; side-wall centers are x=±3.054.
- `Room_LeftWall` has two tall glazed apertures with continuous concrete
  sill/header and slender structural piers. Other walls remain continuous
  full-height pours. Timber and light reveals are merged into adjacent walls
  so they disappear with those wall cutaways.
- `Room_Floor` remains one continuous 12×12 m pour, topping y=-0.0025. It
  extends beneath the full camera orbit. The live body shadow stays y=0.001.
- `Room_TreatmentBed` contains only the unchanged original bench, at the
  existing approximate x=1.6, z=-1.5 diagonal placement.
- `Room_Glass` is the thin architectural return beside the timber field.
  `Room_WindowGlass` contains the two left window panes and follows the left
  wall cutaway. Keep their bounds separate: one combined glass bound would
  unnecessarily hide the return during normal body inspection.
- `Room_PlantBroadleaf`, `Room_PlantPalm`, `Room_PlantSculptural` each contain
  one original plant plus its mineral vessel. Include each in cached furniture
  occlusion bounds so inspection rays stay clear throughout the orbit.
- Eleven semantic meshes, each with one material slot. Glass carries
  `bakedRoom:false` and `roomGlass:true`; all others carry `bakedRoom:true`.
  No ceiling obstructs overhead body inspection.

Opaque nonfloor meshes use `KHR_materials_unlit`. The shared 2048² sRGB JPEG
contains diffuse direct light, indirect light, albedo and integrated emission,
baked at 128 samples and denoised with OpenImageDenoise in linear light.
Glossy and transmission passes are excluded from the opaque radiance bake.
Three's GLTFLoader sets sRGB; set `toneMapped=false` and display baked color
once. Dynamic studio lights illuminate the body independently.

The floor exports as PBR with a 1024² baked base-color atlas. Runtime converts
it to `MeshBasicMaterial` using the same map/color and `toneMapped=false` so
live direct lights do not illuminate the bake twice. Static plant, vessel and
bench contact shadows are in the floor atlas; they remain during an object
cutaway. Live body shadow/contact planes remain separate.

Both glass meshes retain authored transmission 1.0, IOR 1.45, roughness 0.065
and a nearly clear low-iron tint for traced stills. The interactive view uses
alpha 0.22, pale sage tint, roughness 0.14, no depth writes and a single
transparent pass. This avoids the Three r186 destroyed-texture regression on
trace return and an additional full-frame transmission pass. The existing
local environment supplies reflections.

The two atlases occupy about 26.7 MiB decoded RGBA with mipmaps and are shared
across opaque meshes, including foliage. Leaves are original closed 3D blades
with tapered silhouettes, rolled midribs and slight torsion. The authoring
script checks positive signed volume for every blade so outward normals remain
valid for baking; a two-sided beauty render alone cannot prove this. No texture cards,
external models or new texture maps are used. Static lighting needs no extra
shadow map, runtime noise, postprocessing, service or continuous animation.
Limits remain 75,000 triangles, 16 primary draw calls, 3,000,000 GLB bytes and
64 MiB decoded textures.

## Materials and rights

Concrete uses original mineral clouding, fine aggregate and shallow pores,
without panel grids, joints or formwork ties. Original procedural timber grain
runs vertically. Three plants, their vessels, all architecture and both baked
lighting atlases are original local authoring. The bench reuses the unchanged
`../atelier/treatment-bed.glb`, authored in `../atelier/create_assets.py`.
Everything is CC0-1.0. No downloaded models, photography, paid APIs or external
textures are used. See `LICENSE.txt`.

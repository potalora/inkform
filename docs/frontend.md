# Frontend architecture

The browser app uses React 19.3, Base UI 1.9 and Motion 14.2 for its interface. Three.js owns a single canvas, scene resources and camera input. The public entry point is `studio/public-app.js`; it selects the IndexedDB adapter in `studio/local-api.js`. Artwork and studies stay in the current browser and origin.

## Ownership

| Module | Responsibility |
| --- | --- |
| `studio/application.js` | Commands, immutable snapshots, UI state and adapter/renderer lifecycle. |
| `studio/study-controller.js` | Study edits, history, alternatives and body changes. |
| `studio/workspace-sync.js` | Revision-aware saves, conflicts and render requests. |
| `studio/workspace-files.js` | Artwork, backups, restore and reference export. |
| `studio/ui/main.jsx` and panel components | Study menu, dialogs, Composition, Artwork and Body. |
| `studio/ui/primitives.jsx` | Shared controls, Base UI focus behavior and Motion transitions. |
| `studio/ui/motion.jsx` and `sheet-gesture.js` | Live accessibility preferences and mobile sheet drag/snap behavior. |
| `studio/viewport-layout.js` and `camera-framing.js` | The clear viewing area beneath floating controls and camera projection. |
| `studio/camera-motion.js` | Finite, cancellable camera transitions. |
| `studio/scene.js` | Rendering, geometry, camera input and traced previews. |

React subscribes with `useSyncExternalStore`. UI-only publications retain the current immutable study/workspace snapshot; edits and saves publish new domain snapshots. Panels stay mounted when hidden to preserve local input and disclosure state. Each memoized panel comparator must include every value that panel displays.

## Interface behavior

The study selector and menu sit at the top left, the Bodoni Moda title is centered, and image export sits at the right. The inspector contains Composition, Artwork and Body tabs. Artwork has a direct import button and a compact list. Guidance for importing existing tattoos stays in that panel so the checkbox does not move the camera. Body controls retain the tuned lighting and automatic render quality, with a separate Refine preview action.

Desktop panels use a 20px corner radius, controls 12px, and menus 14px with 8px items. IBM Plex Sans uses 16px section titles, 14px labels/values and 12px supporting text; phone text inputs use 16px. Bold type identifies selected controls and headings. Glass surfaces use a light translucent fill, local background blur/luminance adjustment, opaque text and fine edges. They are a CSS approximation, not Apple's native Liquid Glass material.

On phones, the controls panel has collapsed, normal and expanded stops. Only the dedicated top handle drags the sheet; sliders and artwork retain their own input. The actual animated height updates the workspace measurement while the sheet moves. Desktop transitions clear mobile height overrides. Motion owns interface animation, while the scene owns finite camera interpolation and returns to idle after it settles. Export settles the camera before capture.

Reduced-motion preferences are observed live. Reduced transparency and increased contrast use opaque surfaces without backdrop filters. Forced colors retain system control colors. Keyboard interaction and focus restoration remain owned by Base UI or native controls.

## Build and verification

```sh
npm ci
npm run build
npm test
npm start
```

The build compiles the geometry kernel, vendors the renderer, bundles JSX/CSS, and assembles `dist-public/` from `public/runtime-assets.json`. Its manifest records hashes and provenance. The runtime license list includes Motion and its bundled dependencies. Keep the generated UI assets with their source changes.

Tests cover save/recovery behavior, camera interpolation and cancellation, sheet snap calculations, reduced-motion paths, layout measurement and public packaging. Browser checks covered desktop, tablet, 320px and 390px phone viewports, short landscape, keyboard menus/dialogs and live accessibility preferences. Viewport emulation does not establish physical iPhone or Android performance.

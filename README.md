# Inkform

Inkform is a browser app for trying tattoo placement on a 3D body. Import your own artwork, adjust its position and size, and save a reference image for your artist. The preview is approximate; final placement needs a fitting with your artist.

Try the [public beta](https://inkform-beta.pages.dev/studio/).

This README was created by AI. A human-written version is coming.

## Run locally

Requires **Git** and **Node.js 24 or newer**, including npm. Install and start Inkform with one command:

```sh
git clone --depth 1 https://github.com/potalora/inkform.git && cd inkform && npm ci && npm run build && npm start
```

Open http://127.0.0.1:8788/studio/ and leave the terminal running. Press Ctrl+C to stop. For later launches, run `npm start` from the `inkform` folder. The server runs locally; a Cloudflare account is not required.

Run `npm test` to check the source. UI source is in `studio/ui/`; the geometry kernel source is in `studio/wasm/`.

Projects and imported artwork stay in your browser's storage. Clearing browser data removes them. Different browsers and site addresses have separate workspaces. Export a workspace backup to keep a separate copy.

The application source uses the [MIT License](LICENSE). Third-party components and assets keep their separate licenses; see [ASSET-NOTICES.md](ASSET-NOTICES.md).

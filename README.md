# Inkform

Inkform is a browser app for trying tattoo placement on a 3D body. Import your own artwork, adjust its position and size, and save a reference image for your artist. The preview is approximate; final placement needs a fitting with your artist.

Try the [public beta](https://inkform-beta.pages.dev/studio/).

This README was created by AI. A human-written version is coming.

## Run locally

Use Node.js 24 or newer:

```sh
npm ci
npm test
npm run build
npm start
```

Open http://127.0.0.1:8788/studio/. The server runs locally; a Cloudflare account is not required. UI source is in `studio/ui/`; the geometry kernel source is in `studio/wasm/`.

Projects and imported artwork stay in your browser's storage. Clearing browser data removes them. Different browsers and site addresses have separate workspaces. Export a workspace backup to keep a separate copy.

An application license has not been selected yet. See [LICENSE](LICENSE) and [third-party asset notices](ASSET-NOTICES.md) for the bundled components' separate terms.

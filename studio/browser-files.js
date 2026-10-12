import {preflightRaster} from './workspace-validation.js';

async function raster(file, strict = true) {
  if (file.size > 20 * 1024 * 1024) throw Error("Images must be smaller than 20 MB.");
  if (strict && !["image/png", "image/webp"].includes(file.type)) throw Error("Use a transparent PNG or WebP with one isolated design.");
  await preflightRaster(file);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const f = Math.min(1, 2048 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * f));
    c.height = Math.max(1, Math.round(img.height * f));
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, c.width, c.height);
    if (strict) {
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let transparent = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 240) transparent++;
      if (transparent < d.length / 4 * 2e-3) throw Error("This image has no transparent background. Export an isolated PNG/WebP first; this app does not remove backgrounds.");
    }
    return { dataUrl: c.toDataURL("image/png"), width: c.width, height: c.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
function download(name, blob) {
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}
export {
  download,
  raster
};

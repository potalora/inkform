import test from 'node:test';
import assert from 'node:assert/strict';
import {raster} from '../studio/browser-files.js';

test('upload rejects excessive PNG dimensions before allocating a URL or decoding', async () => {
  const bytes = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC','base64'));
  new DataView(bytes.buffer).setUint32(16,32768);
  new DataView(bytes.buffer).setUint32(20,32768);
  // CRC from Python zlib for this modified IHDR; dimensions are the only invalid field.
  new DataView(bytes.buffer).setUint32(29,1260270632);
  const createURL = URL.createObjectURL;
  let allocated = false;
  URL.createObjectURL = () => { allocated=true; throw Error('Image reached decoder'); };
  try {
    await assert.rejects(raster(new Blob([bytes],{type:'image/png'})), /decoded pixels/);
    assert.equal(allocated,false);
  } finally { URL.createObjectURL=createURL; }
});

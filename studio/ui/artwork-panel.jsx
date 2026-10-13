import React, {memo, useState} from 'react';
import {Button} from './primitives.jsx';

function ArtworkPanelView({app, snapshot}) {
  const {workspace, ui} = snapshot;
  const actions = app.actions;
  const [dragging, setDragging] = useState(false);
  const query = (ui.artSearch || '').trim().toLocaleLowerCase();
  const assets = workspace.assets.filter(asset => asset.name.toLocaleLowerCase().includes(query));

  async function upload(event) {
    const input = event.currentTarget;
    try { await actions.uploadFiles(input.files); }
    finally { input.value = ''; }
  }

  return <section data-surface-content="artwork">
    <div data-left-content="library">
      <div className="library-intro"><h2>Artwork</h2></div>
      <details className="library-import">
        <summary aria-label="Import artwork">Import</summary>
        <label className="check"><input id="import-existing" type="checkbox" checked={!!ui.importExisting} disabled={ui.blocked}
          onChange={event => actions.setImportExisting(event.target.checked)} /> Import as existing tattoos</label>
        <label className={`upload${dragging ? ' dragging' : ''}`} id="upload-zone" htmlFor="tattoo-upload"
          onDragOver={event => { event.preventDefault(); if (!ui.blocked) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); if (!ui.blocked) actions.uploadFiles(event.dataTransfer.files); }}>
          <strong>Choose files</strong>
          <small>Transparent PNG / WebP · up to 20 MB</small>
          <input id="tattoo-upload" type="file" accept="image/png,image/webp" multiple disabled={ui.blocked} onChange={upload} />
        </label>
        <p className="hint">Imports are added to this study. Use one isolated, tightly cropped design per file; no skin or background.</p>
      </details>
      <div className="library-search">
        <input id="art-search" type="search" placeholder="Find artwork…" aria-label="Search artwork" autoComplete="off"
          value={ui.artSearch || ''} disabled={ui.blocked} onChange={event => actions.setArtSearch(event.target.value)} />
        <span id="art-results" role="status">{assets.length === workspace.assets.length ? `${assets.length} design${assets.length === 1 ? '' : 's'}` : `${assets.length} of ${workspace.assets.length}`}</span>
      </div>
      <div id="artwork" className="artwork">
        {assets.map(asset => <article key={asset.id} className="art-card">
          <Button variant="ghost" className="preview-art" data-preview={asset.id} aria-label={`Preview ${asset.name}`} disabled={ui.blocked}
            onClick={event => actions.previewArtwork(asset.id, event.currentTarget)}>
            <span className="art-paper"><img src={asset.url} width={Number(asset.width) || 200} height={Number(asset.height) || 200} loading="lazy" decoding="async" alt="" /></span>
            <strong>{asset.name}</strong>
          </Button>
          <div className="art-card-actions">
            <Button variant="ghost" className="add-art" data-add={asset.id} aria-label={`Add ${asset.name} to study`} disabled={ui.blocked}
              onClick={() => actions.addArtwork(asset.id)}><span aria-hidden="true">+</span></Button>
          </div>
        </article>)}
        {!assets.length && <p className="empty">{workspace.assets.length ? 'No matching artwork. Clear the search to show all designs.' : 'No artwork imported. Import a transparent PNG or WebP.'}</p>}
      </div>
    </div>
  </section>;
}

export function artworkPanelPropsEqual(previous, next) {
  const a = previous.snapshot, b = next.snapshot;
  return previous.app === next.app && a.workspace.assets === b.workspace.assets &&
    a.ui.blocked === b.ui.blocked && a.ui.artSearch === b.ui.artSearch &&
    a.ui.importExisting === b.ui.importExisting;
}

export const ArtworkPanel = memo(ArtworkPanelView, artworkPanelPropsEqual);

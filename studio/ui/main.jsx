import React, {useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {editable} from '../model.js';
import {CompositionPanel} from './composition-panel.jsx';
import {ArtworkPanel} from './artwork-panel.jsx';
import {BodyPanel} from './body-panel.jsx';
import {ArtworkPreview} from './artwork-preview.jsx';
import {Undo2, Redo2, NotebookPen, ArrowUpRight, Check, Clock3, CircleAlert} from 'lucide-react';
import {Button, Dialog, DialogContent, DialogTitle, DialogDescription, closeMenuThen} from './primitives.jsx';

function Header({app, snapshot, headerRef}) {
  const {ui} = snapshot, a = app.actions;
  return <header ref={headerRef} className="masthead glass-surface">
    <a className="brand" href="./" aria-label="Inkform home">inkform<span className="brand-mark" aria-hidden="true">✳</span></a>
    <div className="header-right">
      <Button variant="ghost" id="help-open" title="Artwork requirements and shortcuts" onClick={() => a.openDialog('help')}>Help</Button>
      <Button variant="primary" id="save-image" className="save-image" aria-label="Save reference" disabled={ui.blocked || !ui.ready} onClick={a.saveImage}>
        <span className="save-label-wide">Save reference</span><span className="save-label-compact" aria-hidden="true">Save</span><ArrowUpRight size={16} aria-hidden="true" />
      </Button>
    </div>
  </header>;
}

export function StudyCard({app, snapshot, studyRef}) {
  const {study, workspace, ui} = snapshot, a = app.actions;
  const menu = closeMenuThen;
  const saveState = ui.saveError ? 'error' : /^Saved(?: |$)/.test(ui.saveLabel) ? 'saved' : 'pending';
  const SaveIcon = saveState === 'error' ? CircleAlert : saveState === 'saved' ? Check : Clock3;
  return <section ref={studyRef} className="study-card glass-surface" aria-label="Current study">
    <div className="study-card-heading"><p>Study</p><details className="project-menu"><summary aria-label="Study actions">•••</summary>
      <div className="project-actions glass-surface">
        <Button variant="ghost" id="new-project" disabled={ui.blocked} onClick={e => menu(e, a.newProject)}>New study</Button>
        <Button variant="ghost" id="rename-project" disabled={ui.blocked} onClick={e => menu(e, a.renameProject)}>Rename</Button>
        <Button variant="ghost" id="duplicate-project" disabled={ui.blocked} onClick={e => menu(e, a.saveAlternative)}>Save alternative…</Button>
        <Button variant="ghost" id="delete-project" disabled={ui.blocked} onClick={e => menu(e, a.deleteProject)}>Delete study</Button>
        <Button variant="ghost" id="data-open" onClick={e => menu(e, () => a.openDialog('data'))}>Workspace backup</Button>
        {ui.storageMode !== 'browser' && <a href="../">Flash archive</a>}
      </div>
    </details></div>
    <div className="study-picker"><select id="project-select" aria-label="Current study" title={study?.name} value={study?.id || ''} disabled={ui.blocked}
      onChange={event => a.switchProject(event.target.value)}>
      {workspace?.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select></div>
    <div className="study-save" data-save-state={saveState} role="status" title={ui.saveLabel} style={ui.saveError ? {color: 'var(--danger)'} : undefined}><SaveIcon size={14} aria-hidden="true" /><span id="save-status" title={ui.saveLabel} style={ui.saveError ? {color: 'var(--danger)'} : undefined}>{ui.saveLabel}</span>
      <Button variant="ghost" id="retry-save" hidden={ui.retry.hidden} disabled={ui.blocked} onClick={a.retrySave}>{ui.retry.text}</Button>
    </div>
    <div className="study-tools">
      <Button variant="ghost" id="undo" aria-label="Undo" disabled={ui.blocked || !ui.canUndo} title="Undo (⌘Z)" onClick={a.undo}><Undo2 size={17} aria-hidden="true" /></Button>
      <Button variant="ghost" id="redo" aria-label="Redo" disabled={ui.blocked || !ui.canRedo} title="Redo (⇧⌘Z)" onClick={a.redo}><Redo2 size={17} aria-hidden="true" /></Button>
      <Button variant="ghost" id="save-alternative" disabled={ui.blocked} onClick={a.saveAlternative}>Save alternative</Button>
      <Button variant="ghost" id="notes-open" aria-label="Study notes" disabled={ui.blocked} onClick={() => a.openDialog('notes')}><NotebookPen size={17} aria-hidden="true" /><span>Notes</span></Button>
    </div>
  </section>;
}

function CameraDock({app, snapshot, dockRef, dockGroupRef, statusRef}) {
  const {study, ui} = snapshot, a = app.actions;
  const idle = /^Drag to orbit/.test(ui.status);
  const camera = (name, label) => <Button key={name} variant="ghost" data-camera={name} aria-pressed={ui.currentView === name}
    disabled={ui.blocked || !ui.ready} onClick={() => a.chooseCamera(name)}>{label}</Button>;
  return <div className="stage-bottom" ref={dockGroupRef}>
    <p id="status" ref={statusRef} className="glass-surface" role="status" data-idle={idle}>{ui.status}</p>
    <div className="stage-toolbar"><nav className="camera-bar glass-surface" ref={dockRef} aria-label="Camera and placement">
      {camera('body', 'Orbit')}
      <Button variant="ghost" id="place-mode" aria-pressed={ui.placing} disabled={ui.blocked || !study || !editable(study).length} onClick={a.togglePlace}>Place</Button>
      {camera('detail', 'Detail')}{camera('front', 'Front')}{camera('side', 'Side')}{camera('back', 'Back')}
    </nav></div>
    <p className="interaction-hint">Drag to orbit · scroll or pinch to zoom</p>
  </div>;
}

function Inspector({app, snapshot, panelRef}) {
  const {study, workspace, ui} = snapshot, a = app.actions;
  const scrollRef = useRef(null);
  useLayoutEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [ui.surface]);
  useEffect(() => { if (ui.focusPlacement) document.querySelector('#region')?.focus(); }, [ui.focusPlacement]);
  const labels = {normal: 'Expand', expanded: 'Canvas', collapsed: 'Controls'};
  return <aside ref={panelRef} id="study-controls" tabIndex={-1} className={`controls-panel glass-surface ${ui.panelState === 'normal' ? '' : ui.panelState}`}
    data-panel-side="right" data-panel-state={ui.panelState} data-surface={ui.surface} aria-label="Study controls">
    <div className="controls-top">
      <nav className="surface-tabs" aria-label="Workspace">
        <Button variant="ghost" data-surface="composition" data-left="layers" data-panel="tattoo" aria-pressed={ui.surface === 'composition'} onClick={() => a.showSurface('composition')}>Composition <span id="layer-count">{study?.tattoos.length || 0}</span></Button>
        <Button variant="ghost" data-surface="artwork" data-left="library" aria-pressed={ui.surface === 'artwork'} onClick={() => a.showSurface('artwork')}>Artwork <span id="asset-count">{workspace?.assets.length || 0}</span></Button>
        <Button variant="ghost" data-surface="body" data-panel="body" aria-pressed={ui.surface === 'body'} onClick={() => a.showSurface('body')}>Body</Button>
      </nav>
      <Button variant="ghost" id="controls-toggle" aria-label="Resize controls panel" aria-expanded={ui.panelState !== 'collapsed'} onClick={a.togglePanel}>{labels[ui.panelState]}</Button>
    </div>
    <div className="controls-scroll" ref={scrollRef}>
      {study && <>
        <div className="react-surface" hidden={ui.surface !== 'composition'}><CompositionPanel app={app} snapshot={snapshot} /></div>
        <div className="react-surface" hidden={ui.surface !== 'artwork'}><ArtworkPanel app={app} snapshot={snapshot} /></div>
        <div className="react-surface" hidden={ui.surface !== 'body'}><BodyPanel app={app} snapshot={snapshot} /></div>
      </>}
    </div>
    <div className="history-bar">
      <span>Approximate preview · fit with your artist</span>
      <span id="engine">{ui.stats.renderer ? `${ui.stats.renderer} + ${ui.stats.kernel}` : 'Preparing 3D'}</span>
    </div>
  </aside>;
}

function NameDialog({app, request}) {
  const [value, setValue] = useState(request.value), inputRef = useRef(null);
  return <Dialog open onOpenChange={open => { if (!open) app.actions.resolveName(null); }}>
    <DialogContent id="name-dialog" showCloseButton={false} initialFocus={inputRef} aria-describedby={undefined}>
      <form id="name-form" onSubmit={event => { event.preventDefault(); if (value.trim()) app.actions.resolveName(value.trim()); }}>
        <DialogTitle id="name-dialog-title" render={<h2 />}>{request.title}</DialogTitle>
        <label className="field" htmlFor="study-name">Study name</label>
        <input ref={inputRef} id="study-name" type="text" maxLength={120} required autoComplete="off" value={value}
          onFocus={event => event.target.select()} onChange={event => setValue(event.target.value)} />
        <div className="layer-tools">
          <Button id="name-cancel" onClick={() => app.actions.resolveName(null)}>Cancel</Button>
          <Button type="submit" variant="primary">Save name</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

function WorkspaceDialogs({app, ui, study}) {
  const a = app.actions;
  return <>
    {ui.nameRequest && <NameDialog app={app} request={ui.nameRequest} />}
    <Dialog open={ui.dialog === 'notes'} onOpenChange={open => { if (!open) a.closeDialog(); }}>
      <DialogContent id="notes-dialog">
        <DialogTitle render={<h2 />}>Study notes</DialogTitle>
        <DialogDescription>Placement, size, references and questions.</DialogDescription>
        <label className="field" htmlFor="project-notes">Study notes</label>
        <textarea id="project-notes" rows="7" placeholder="Placement, size, references, and questions to discuss."
          value={study?.notes || ''} disabled={ui.blocked} onChange={event => a.setNotes(event.target.value)} onBlur={() => a.endGesture('notes')} />
        <p className="hint">Notes save automatically.</p>
      </DialogContent>
    </Dialog>
    <Dialog open={ui.dialog === 'data'} onOpenChange={open => { if (!open) a.closeDialog(); }}>
      <DialogContent id="data-dialog">
        <DialogTitle id="data-dialog-title" render={<h2 />}>Workspace backup</DialogTitle>
        <DialogDescription>{ui.storageMode === 'browser'
          ? 'Artwork and studies save in this browser on this device. Export a backup to keep a separate copy or move to another device. Clearing site data removes your saved workspace.'
          : 'Artwork and studies save automatically to the private workspace. Export a backup to keep a separate copy or move to another device.'}</DialogDescription>
        {ui.storageMode === 'browser' && <p className="hint">{ui.storagePersistence === 'granted' ? 'Browser storage protection is enabled. Keep an exported backup too.' : 'Your browser may clear local storage. Keep an exported backup, especially when using private browsing.'}</p>}
        <Button id="export-backup" variant="primary" disabled={ui.dataBlocked} onClick={a.exportBackup}>Export full workspace</Button>
        <label className="secondary upload-import" htmlFor="import-backup">Restore a workspace backup<input id="import-backup" type="file" accept=".json,application/json" disabled={ui.dataBlocked}
          onChange={async event => { const input = event.currentTarget; try { await a.restoreBackup(input.files[0]); } finally { input.value = ''; } }} /></label>
        <p className="hint">Restore replaces the current workspace. A backup download starts first; make sure you keep the file.</p>
        <p id="data-status" role="status">{ui.dataStatus}</p>
      </DialogContent>
    </Dialog>
    <Dialog open={ui.dialog === 'help'} onOpenChange={open => { if (!open) a.closeDialog(); }}>
      <DialogContent id="help-dialog" aria-describedby={undefined}>
        <DialogTitle id="help-dialog-title" render={<h2 />}>Artwork requirements</DialogTitle>
        <ol>
          <li>Use a transparent PNG or WebP, tightly cropped to a single tattoo.</li>
          <li>Supply the flat design or a straight-on scan. A photo of ink on curved skin already contains distortion.</li>
          <li>Keep the edges clean and leave a little transparent padding. Up to 20 MB per image; images are stored at up to 2048 pixels.</li>
          <li>Mark existing tattoos before importing. Position and size them, then choose Lock in place to protect them.</li>
        </ol>
        <p>Drag to orbit. Use Place on body and tap the body to set an anchor. Group movement follows each tattoo’s local surface. Use separate layers for artwork spanning a whole limb.</p>
        <p>Focus the body preview, then use arrow keys to orbit and +/− to zoom. Camera buttons reset the view.</p>
        <p className="hint">⌘/Ctrl Z: undo · Shift ⌘/Ctrl Z: redo · Delete: remove unlocked selection · Escape: stop placing. Large wraps and sharply changing anatomy can distort; inspect from several angles.</p>
        {ui.storageMode === 'browser' && <p className="hint">Public beta. Your artwork and projects stay in this browser. The host receives ordinary website requests. Export a workspace backup to keep a separate copy. <a href="../privacy.html">Privacy and storage</a> · <a href="../THIRD-PARTY-NOTICES.txt">Asset credits</a></p>}
      </DialogContent>
    </Dialog>
  </>;
}

function StudioApp({app}) {
  const snapshot = useSyncExternalStore(app.subscribe, app.getSnapshot);
  const {study, ui} = snapshot;
  const visibleTattoos = study?.tattoos.filter(t => t.visible).length || 0;
  const viewportRef = useRef(null), headerRef = useRef(null), studyRef = useRef(null), panelRef = useRef(null), dockRef = useRef(null), dockGroupRef = useRef(null), statusRef = useRef(null);
  useEffect(() => app.attachViewport(viewportRef.current, {
    root: document.documentElement, header: headerRef.current, study: studyRef.current, panel: panelRef.current,
    dock: dockRef.current, dockGroup: dockGroupRef.current, status: statusRef.current,
  }), [app]);
  useEffect(() => {
    const keydown = event => {
      const current = app.getSnapshot();
      if (!current.ui.ready || current.ui.blocked || current.ui.dialog || current.ui.nameRequest) return;
      if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.querySelector('dialog[open]')) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); app.actions[event.shiftKey ? 'redo' : 'undo'](); }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); app.actions.removeLayers(); }
      if (event.key === 'Escape') app.actions.stopPlacing();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [app]);
  return <>
    <a className="skip-link" href="#study-controls">Skip to study controls</a>
    <Header app={app} snapshot={snapshot} headerRef={headerRef} />
    <main className="workspace">
      <StudyCard app={app} snapshot={snapshot} studyRef={studyRef} />
      <section className="stage" aria-label="Interactive tattoo composition">
        <div id="viewport" ref={viewportRef} aria-busy={ui.rendering} />
        <div className="stage-top"><h1 id="stage-title">{study?.name || 'Study'}</h1><p id="stage-meta">{study ? `${study.body.stature.toFixed(1)} cm · ${visibleTattoos} visible tattoo${visibleTattoos === 1 ? '' : 's'}` : 'Approximate body reference'}</p></div>
        <CameraDock app={app} snapshot={snapshot} dockRef={dockRef} dockGroupRef={dockGroupRef} statusRef={statusRef} />
        <div id="loading" className="loading glass-surface" hidden={!ui.loading && !ui.error}>
          <h2>{ui.error ? 'Could not open the studio' : 'Loading studio'}</h2>
          <p>{ui.error || 'Loading body reference and artwork.'}</p>
          {ui.error && <Button id="reload-app" onClick={() => location.reload()}>Try again</Button>}
          {ui.error && !ui.dataBlocked && <Button id="recover-workspace" onClick={() => app.actions.openDialog('data')}>Back up your workspace</Button>}
        </div>
      </section>
      <Inspector app={app} snapshot={snapshot} panelRef={panelRef} />
    </main>
    <footer><span id="footer-stats">{ui.storageMode === 'browser' ? 'Public beta · saved in this browser' : ui.stats.renderer ? `${ui.stats.renderer.toUpperCase()} · ${ui.stats.kernel.toUpperCase()} GEOMETRY · LOCAL SQLITE` : 'Saved to workspace'}</span></footer>
    <WorkspaceDialogs app={app} ui={ui} study={study} /><ArtworkPreview app={app} />
  </>;
}

export function mountStudio(element, app) {
  const root = createRoot(element);
  root.render(<StudioApp app={app} />);
  return () => { root.unmount(); app.dispose(); };
}

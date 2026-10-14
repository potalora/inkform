import React, {useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createRoot} from 'react-dom/client';
import {animate, motion, useMotionValue} from 'motion/react';
import {StudioMotionProvider, useStudioReducedMotion, useStudioCompact, UI_SPRING} from './motion.jsx';
import {sheetDragHeight, sheetSnapState} from './sheet-gesture.js';
import {CompositionPanel} from './composition-panel.jsx';
import {ArtworkPanel} from './artwork-panel.jsx';
import {BodyPanel} from './body-panel.jsx';
import {ArtworkPreview} from './artwork-preview.jsx';
import {Undo2, Redo2, Download, Check, Clock3, CircleAlert, Ellipsis, Orbit, Focus, UserRound, MoveHorizontal, RotateCcw} from 'lucide-react';
import {Button, Select, Dialog, DialogContent, DialogTitle, DialogDescription, closeMenuThen} from './primitives.jsx';

export function Header({app, snapshot, headerRef, studyRef}) {
  const {ui} = snapshot, a = app.actions;
  return <header ref={headerRef} className="masthead">
    <StudyCard app={app} snapshot={snapshot} studyRef={studyRef} />
    <div className="studio-wordmark">tattoo you</div>
    <div className="header-right">
      <Button variant="ghost" id="save-image" className="save-image" aria-label="Export image" title="Download a reference image" disabled={ui.blocked || !ui.ready} onClick={a.saveImage}>
        <Download size={16} aria-hidden="true" /><span className="save-label-wide">Export image</span><span className="save-label-compact" aria-hidden="true">Export</span>
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
    <div className="study-picker"><Select id="project-select" aria-label="Current study" title={study?.name} value={study?.id || ''} disabled={ui.blocked}
      onValueChange={a.switchProject} items={(workspace?.projects || []).map(p => ({value: p.id, label: p.name}))} /></div>
    <div className="study-save" data-save-state={saveState} role="status" title={ui.saveLabel} style={ui.saveError ? {color: 'var(--danger)'} : undefined}><SaveIcon size={14} aria-hidden="true" /><span id="save-status" className="sr-only">{ui.saveLabel}</span><span className="save-status-short" aria-hidden="true">{saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Unsaved' : 'Saving…'}</span>
      <Button variant="ghost" id="retry-save" hidden={ui.retry.hidden} disabled={ui.blocked} onClick={a.retrySave}>{ui.retry.text}</Button>
    </div>
    <details className="project-menu"><summary aria-label="Study actions"><Ellipsis size={20} aria-hidden="true" /></summary>
      <div className="project-actions glass-surface">
        <Button variant="ghost" id="new-project" disabled={ui.blocked} onClick={e => menu(e, a.newProject)}>New study</Button>
        <Button variant="ghost" id="rename-project" disabled={ui.blocked} onClick={e => menu(e, a.renameProject)}>Rename</Button>
        <Button variant="ghost" id="duplicate-project" disabled={ui.blocked} onClick={e => menu(e, a.saveAlternative)}>Save alternative…</Button>
        <Button variant="ghost" id="notes-open" disabled={ui.blocked} onClick={e => menu(e, () => a.openDialog('notes'))}>Notes…</Button>
        <div className="menu-history" hidden={!ui.canUndo && !ui.canRedo}>
          <Button variant="ghost" id="undo" disabled={ui.blocked || !ui.canUndo} title="Undo (⌘Z)" onClick={e => menu(e, a.undo)}><Undo2 size={16} aria-hidden="true" />Undo</Button>
          <Button variant="ghost" id="redo" disabled={ui.blocked || !ui.canRedo} title="Redo (⇧⌘Z)" onClick={e => menu(e, a.redo)}><Redo2 size={16} aria-hidden="true" />Redo</Button>
        </div>
        <div className="menu-divider" />
        <Button variant="ghost" id="data-open" onClick={e => menu(e, () => a.openDialog('data'))}>Workspace…</Button>
        <Button variant="destructive" id="delete-project" disabled={ui.blocked} onClick={e => menu(e, a.deleteProject)}>Delete study</Button>
      </div>
    </details>
  </section>;
}

export function CameraDock({app, snapshot, dockRef, dockGroupRef, statusRef}) {
  const {ui} = snapshot, a = app.actions;
  const compact = useStudioCompact(), reduce = useStudioReducedMotion(), expanded = compact && ui.panelState === 'expanded';
  const idle = /^Drag to orbit/.test(ui.status);
  const camera = (name, label, Icon) => <Button key={name} variant="ghost" data-camera={name} aria-pressed={ui.currentView === name}
    disabled={ui.blocked || !ui.ready} onClick={() => a.chooseCamera(name)}><Icon size={17} aria-hidden="true" /><span>{label}</span></Button>;
  return <div className="stage-bottom" ref={dockGroupRef}>
    <p id="status" ref={statusRef} className="glass-surface" role="status" data-idle={idle}>{ui.status}</p>
    <motion.div className="stage-toolbar" initial={false} inert={expanded || undefined} aria-hidden={expanded || undefined}
      animate={{height: compact ? expanded ? 0 : 56 : 'auto', opacity: expanded ? 0 : 1}}
      transition={reduce || !compact ? {duration: 0} : UI_SPRING}
      style={{pointerEvents: expanded ? 'none' : undefined, overflow: compact ? 'hidden' : undefined}}>
      <nav className="camera-bar glass-surface" ref={dockRef} aria-label="Camera views">
      {camera('body', 'Orbit', Orbit)}{camera('detail', 'Detail', Focus)}{camera('front', 'Front', UserRound)}{camera('side', 'Side', MoveHorizontal)}{camera('back', 'Back', RotateCcw)}
    </nav></motion.div>
    <p className="interaction-hint">Drag to orbit · scroll or pinch to zoom</p>
  </div>;
}

function useInspectorSheet(panelRef, panelState, setPanelState, blocked) {
  const compact = useStudioCompact(), reduce = useStudioReducedMotion();
  const height = useMotionValue(0), normalRef = useRef(null), expandedRef = useRef(null), collapsedRef = useRef(null);
  const spring = useRef(null), gesture = useRef(null);
  const [stops, setStops] = useState(null), [dragging, setDragging] = useState(false);
  const snap = target => {
    spring.current?.stop();
    if (reduce) height.set(target);
    else spring.current = animate(height, target, UI_SPRING);
  };
  useLayoutEffect(() => {
    const panel = panelRef.current, workspace = panel?.parentElement;
    if (!compact || !panel) {
      spring.current?.stop(); gesture.current = null; setDragging(false); setStops(null); height.set(0);
      panel?.style.removeProperty('height'); workspace?.style.removeProperty('--sheet-live-height');
      return;
    }
    // The stylesheet owns dvh, safe-area and short-screen sizing. These inert
    // probes resolve its lengths without a second JS breakpoint/sizing table.
    const syncDock = value => workspace?.style.setProperty('--sheet-live-height', `${value}px`);
    const unsubscribe = height.on('change', syncDock);
    const measure = () => {
      const collapsed = collapsedRef.current.getBoundingClientRect().height;
      const normal = Math.max(collapsed, normalRef.current.getBoundingClientRect().height);
      const expanded = Math.max(normal, expandedRef.current.getBoundingClientRect().height);
      const next = {collapsed, normal, expanded};
      if (!height.get()) height.set(next[panelState]);
      syncDock(height.get());
      setStops(old => old && Object.keys(next).every(key => old[key] === next[key]) ? old : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    [normalRef, expandedRef, collapsedRef].forEach(ref => observer.observe(ref.current));
    return () => {
      observer.disconnect(); unsubscribe(); spring.current?.stop(); gesture.current = null;
      workspace?.style.removeProperty('--sheet-live-height');
    };
  }, [compact, height, panelRef]);
  useLayoutEffect(() => {
    if (compact && stops && !gesture.current) snap(stops[panelState]);
    return () => spring.current?.stop();
  }, [compact, stops, panelState, reduce]);
  const pan = {
    onPanStart() {
      if (!compact || !stops || blocked) return;
      spring.current?.stop(); gesture.current = {height: height.get()}; setDragging(true);
    },
    onPan(event, info) {
      if (gesture.current) height.set(sheetDragHeight(gesture.current.height, info.offset.y, stops));
    },
    onPanEnd(event, info) {
      if (!gesture.current) return;
      gesture.current = null; setDragging(false);
      const state = sheetSnapState(height.get(), info.velocity.y, stops);
      setPanelState(state); snap(stops[state]);
    },
  };
  const probeStyle = {position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: 0, overflow: 'hidden'};
  const probes = <div aria-hidden="true" style={{position: 'absolute', pointerEvents: 'none'}}>
    <div ref={normalRef} style={{...probeStyle, height: 'var(--sheet-height)'}} />
    <div ref={expandedRef} style={{...probeStyle, height: 'var(--expanded-height)'}} />
    <div ref={collapsedRef} style={{...probeStyle, height: 'var(--collapsed-height,70px)'}} />
  </div>;
  return {height: compact && stops ? height : undefined, dragging, pan, probes};
}

export function Inspector({app, snapshot, panelRef}) {
  const {study, workspace, ui} = snapshot, a = app.actions;
  const sheet = useInspectorSheet(panelRef, ui.panelState, a.setPanelState, ui.blocked), reduce = useStudioReducedMotion();
  const scrollRef = useRef(null), scrollPositions = useRef(new Map());
  const scrollKey = `${study?.id}:${ui.surface}`;
  useLayoutEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollPositions.current.get(scrollKey) || 0; }, [scrollKey]);
  useEffect(() => { if (ui.focusPlacement) document.querySelector('#region')?.focus(); }, [ui.focusPlacement]);
  const labels = {normal: 'Expand', expanded: 'Canvas', collapsed: 'Controls'};
  return <motion.aside ref={panelRef} id="study-controls" tabIndex={-1} className={`controls-panel glass-surface ${ui.panelState === 'normal' ? '' : ui.panelState}`}
    style={{height: sheet.height}} data-sheet-dragging={sheet.dragging ? 'true' : undefined}
    data-panel-side="right" data-panel-state={ui.panelState} data-surface={ui.surface} data-lighting={ui.lighting || 'studio'} aria-label="Study controls">
    {sheet.probes}
    <motion.div className="sheet-drag-handle" aria-hidden="true" {...sheet.pan}><span /></motion.div>
    <div className="controls-top">
      <nav className="surface-tabs" aria-label="Workspace">
        <Button variant="ghost" data-surface="composition" data-left="layers" data-panel="tattoo" aria-pressed={ui.surface === 'composition'} onClick={() => a.showSurface('composition')}>Composition <span id="layer-count">{study?.tattoos.length || 0}</span></Button>
        <Button variant="ghost" data-surface="artwork" data-left="library" aria-pressed={ui.surface === 'artwork'} onClick={() => a.showSurface('artwork')}>Artwork <span id="asset-count">{workspace?.assets.length || 0}</span></Button>
        <Button variant="ghost" data-surface="body" data-panel="body" aria-pressed={ui.surface === 'body'} onClick={() => a.showSurface('body')}>Body</Button>
      </nav>
      <Button variant="ghost" id="controls-toggle" aria-label={`${labels[ui.panelState]} panel`} aria-expanded={ui.panelState !== 'collapsed'} onClick={a.togglePanel}>{labels[ui.panelState]}</Button>
    </div>
    <div className="controls-scroll" ref={scrollRef} onScroll={event => scrollPositions.current.set(scrollKey, event.currentTarget.scrollTop)}>
      {study && <>
        <motion.div className="react-surface" initial={false} animate={{opacity: ui.surface === 'composition' ? 1 : 0}} transition={reduce ? {duration: 0} : {duration: .16}} hidden={ui.surface !== 'composition'}><CompositionPanel app={app} snapshot={snapshot} /></motion.div>
        <motion.div className="react-surface" initial={false} animate={{opacity: ui.surface === 'artwork' ? 1 : 0}} transition={reduce ? {duration: 0} : {duration: .16}} hidden={ui.surface !== 'artwork'}><ArtworkPanel app={app} snapshot={snapshot} /></motion.div>
        <motion.div className="react-surface" initial={false} animate={{opacity: ui.surface === 'body' ? 1 : 0}} transition={reduce ? {duration: 0} : {duration: .16}} hidden={ui.surface !== 'body'}><BodyPanel app={app} snapshot={snapshot} /></motion.div>
      </>}
    </div>
    <div className="history-bar">
      <span>Approximate preview · fit with your artist</span>
      <span id="engine">{ui.stats.renderer ? `${ui.stats.renderer} + ${ui.stats.kernel}` : 'Preparing 3D'}</span>
    </div>
  </motion.aside>;
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
        <DialogDescription>Ideas and questions for your artist.</DialogDescription>
        <label className="field" htmlFor="project-notes">Study notes</label>
        <textarea id="project-notes" rows="5" placeholder="Add a note…"
          value={study?.notes || ''} disabled={ui.blocked} onChange={event => a.setNotes(event.target.value)} onBlur={() => a.endGesture('notes')} />
        <p className="hint">Notes save automatically.</p>
      </DialogContent>
    </Dialog>
    <Dialog open={ui.dialog === 'data'} onOpenChange={open => { if (!open) a.closeDialog(); }}>
      <DialogContent id="data-dialog">
        <DialogTitle id="data-dialog-title" render={<h2 />}>Workspace</DialogTitle>
        <DialogDescription>{ui.storageMode === 'browser'
          ? 'Studies save in this browser. Download a backup before clearing browser data or moving to another device.'
          : 'Your studies save automatically. Download a backup to keep a separate copy.'}</DialogDescription>
        <Button id="export-backup" variant="primary" disabled={ui.dataBlocked} onClick={a.exportBackup}>Download backup</Button>
        <label className="secondary upload-import" htmlFor="import-backup">Restore backup<input id="import-backup" type="file" accept=".json,application/json" disabled={ui.dataBlocked}
          onChange={async event => { const input = event.currentTarget; try { await a.restoreBackup(input.files[0]); } finally { input.value = ''; } }} /></label>
        <p className="hint">Restoring replaces your current studies. A backup downloads first.</p>
        <p id="data-status" role="status">{ui.dataStatus}</p>
        <div className="workspace-links"><Button variant="ghost" id="help-open" onClick={() => a.openDialog('help')}>Help and shortcuts</Button>
          {ui.storageMode !== 'browser' && <a href="../">Open flash archive</a>}</div>
      </DialogContent>
    </Dialog>
    <Dialog open={ui.dialog === 'help'} onOpenChange={open => { if (!open) a.closeDialog(); }}>
      <DialogContent id="help-dialog" aria-describedby={undefined}>
        <DialogTitle id="help-dialog-title" render={<h2 />}>Using tattoo you</DialogTitle>
        <ol>
          <li>Import a transparent PNG or WebP, up to 20 MB. Crop it to the design without skin or background.</li>
          <li>Choose a body area, then adjust width and rotation. Use Place on body for a precise position.</li>
          <li>Lock tattoos to keep them in place. Save an alternative to try another arrangement.</li>
        </ol>
        <p>Drag to orbit; scroll or pinch to zoom. With the preview focused, arrow keys orbit and +/− zoom.</p>
        <p>⌘/Ctrl Z: undo · Shift ⌘/Ctrl Z: redo · Delete: remove unlocked tattoos · Escape: stop placing.</p>
        <p className="hint">Check placement from several angles and confirm the fit with your artist.</p>
        {ui.storageMode === 'browser' && <p className="hint">Studies stay in this browser. Keep a downloaded backup. <a href="../privacy.html">Privacy and storage</a> · <a href="../THIRD-PARTY-NOTICES.txt">Credits</a></p>}
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
      if (event.defaultPrevented || document.activeElement?.closest('input,textarea,select,[role=combobox],[role=listbox],[role=option]') || document.querySelector('dialog[open]')) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); app.actions[event.shiftKey ? 'redo' : 'undo'](); }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); app.actions.removeLayers(); }
      if (event.key === 'Escape') app.actions.stopPlacing();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [app]);
  return <>
    <a className="skip-link" href="#study-controls">Skip to study controls</a>
    <Header app={app} snapshot={snapshot} headerRef={headerRef} studyRef={studyRef} />
    <main className="workspace">
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
  root.render(<StudioMotionProvider><StudioApp app={app} /></StudioMotionProvider>);
  return () => { root.unmount(); app.dispose(); };
}

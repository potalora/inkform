const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function sheetDragHeight(initial,offsetY,stops){
 return clamp(initial-(Number.isFinite(offsetY)?offsetY:0),stops.collapsed,stops.expanded);
}
/** Upward motion grows the sheet. A short projected fling chooses one finite stop. */
export function sheetSnapState(height,velocityY,stops){
 const projected=clamp(height-clamp(Number.isFinite(velocityY)?velocityY:0,-1600,1600)*.16,stops.collapsed,stops.expanded);
 return ['collapsed','normal','expanded'].reduce((best,state)=>Math.abs(stops[state]-projected)<Math.abs(stops[best]-projected)?state:best,'normal');
}

// Bridge between the vanilla Picker app (appScript.ts) and this Next.js
// project's real backend. Runs as a second inline <script>, which — for
// classic (non-module) scripts — shares the same top-level scope as the
// first one, so it can freely reference `state`, `persistAll`, `render`,
// `toast`, etc. that appScript.ts already declared.
export const BRIDGE_SCRIPT_SOURCE = `
window.__pickerAuth = window.__pickerAuth || { status: 'loading' };

function __pickerDebounce(fn, wait){
  let t;
  return function(...args){ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
}

async function __pickerPushSync(){
  if(!window.__pickerAuth || window.__pickerAuth.status !== 'authenticated') return;
  try{
    await fetch('/api/sync', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ lists: state.lists, history: state.history }),
    });
  }catch(e){ /* offline or a server hiccup — local data is still safe */ }
}
window.__pickerRequestSync = __pickerDebounce(__pickerPushSync, 1500);

window.__pickerPullSync = async function(){
  if(!window.__pickerAuth || window.__pickerAuth.status !== 'authenticated') return;
  try{
    const res = await fetch('/api/sync');
    if(!res.ok) return;
    const data = await res.json();
    (data.lists||[]).forEach(function(sl){
      const idx = state.lists.findIndex(function(l){ return l.id===sl.id; });
      if(idx>-1) state.lists[idx] = sl; else state.lists.push(sl);
    });
    const localHistIds = new Set(state.history.map(function(h){ return h.id; }));
    (data.history||[]).forEach(function(sh){ if(!localHistIds.has(sh.id)) state.history.push(sh); });
    state.history.sort(function(a,b){ return b.ts - a.ts; });
    if(typeof persistAll === 'function') persistAll();
    if(typeof render === 'function') render();
    if(typeof toast === 'function') toast('Synced with your account');
  }catch(e){}
};

// Wrap persistAll so every local save also queues a debounced server push.
if(typeof persistAll === 'function' && !persistAll.__pickerWrapped){
  const __origPersistAll = persistAll;
  persistAll = function(){
    __origPersistAll();
    if(window.__pickerRequestSync) window.__pickerRequestSync();
  };
  persistAll.__pickerWrapped = true;
}
`;

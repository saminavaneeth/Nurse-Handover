import { useEffect, useRef, useState } from 'react';
import { getPatients, postNote } from '../../api/client';

const WAKE_WORDS = ['hey pal', 'hi pal', 'okay pal', 'ok pal'];

// ── Text-to-speech ───────────────────────────────────────────────────────────
function tts(text, rate = 0.95) {
  return new Promise(resolve => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-AU';
    u.rate = rate;
    u.onend = resolve;
    u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
}

// ── Chime sound ──────────────────────────────────────────────────────────────
function playChime(type = 'wake') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = type === 'wake' ? [440, 660] : [660, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.2;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t); osc.stop(t + 0.45);
    });
  } catch (e) { /* audio unavailable */ }
}

// ── NLP helpers ──────────────────────────────────────────────────────────────
function matchPatient(text, patients) {
  const lower = text.toLowerCase();
  const bedMatch = lower.match(/\bbed\s+([a-z0-9]+)\b/i);
  if (bedMatch) {
    const found = patients.find(p => p.bed.toLowerCase() === bedMatch[1].toLowerCase());
    if (found) return found;
  }
  for (const p of patients) {
    const parts = p.name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (parts.some(part => lower.includes(part))) return p;
  }
  return null;
}

function detectType(text) {
  return /\b(to.?do|remind|reminder|remember|don'?t forget|follow.?up|must|need to|should)\b/i.test(text)
    ? 'todo' : 'note';
}

function extractContent(raw, patient) {
  let text = raw
    .replace(/^hey\s+pal[,.]?\s*/i, '')
    .replace(/^(add\s+a?\s*|create\s+a?\s*|make\s+a?\s*|please\s+)*/i, '')
    .replace(/^(to.?do|note|reminder|remind me to|remind me|remember to|don'?t forget to?)\s*(for\s+)?/i, '');
  if (patient) {
    text = text.replace(new RegExp(`(for\\s+)?(bed\\s+${patient.bed})\\s*[-—,]?\\s*`, 'gi'), '');
    const first = patient.name.split(' ')[0];
    text = text.replace(new RegExp(`(for\\s+)?${first}\\s*[-—,]?\\s*`, 'gi'), '');
  }
  text = text.replace(/^(for|that|is|the)\s+/i, '').trim();
  return text ? text[0].toUpperCase() + text.slice(1) : '';
}

function isSave(text) {
  return /\b(save|yes|confirm|correct|that'?s right|go ahead|ok(ay)?|sure|do it|yep|yeah)\b/i.test(text);
}
function isCancel(text) {
  return /\b(cancel|no|stop|wrong|discard|redo|start over|never mind|nope)\b/i.test(text);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function VoiceAssistant() {
  const [supported] = useState(() =>
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  const [enabled, setEnabled] = useState(false);
  const [phase, setPhase] = useState('idle');
  // phase: idle | wake | command | clarify | readback | confirming | saving

  const [liveText, setLiveText] = useState('');  // nurse's interim speech
  const [palSays, setPalSays] = useState('');    // PAL's displayed speech
  const [draft, setDraft] = useState(null);      // { type, patient, content }

  const activeRef = useRef(false);
  const recStopRef = useRef(null);   // stop current recognition
  const patientsRef = useRef([]);
  const confirmResolveRef = useRef(null); // allows buttons to resolve voice confirmation

  // Keep patients up to date
  useEffect(() => {
    const load = () =>
      getPatients()
        .then(pts => { patientsRef.current = pts; })
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  // ── Core session ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    activeRef.current = true;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Continuous recognition that resolves when wake word is detected
    function waitForWake() {
      return new Promise(resolve => {
        if (!activeRef.current) { resolve(false); return; }
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-AU';
        let done = false;

        recStopRef.current = () => {
          done = true;
          try { rec.stop(); } catch (e) {}
          resolve(false);
        };

        rec.onresult = (e) => {
          if (done || !activeRef.current) return;
          const text = Array.from(e.results).map(r => r[0].transcript).join(' ').toLowerCase();
          if (WAKE_WORDS.some(w => text.includes(w))) {
            done = true;
            try { rec.stop(); } catch (e) {}
            resolve(true);
          }
        };

        rec.onend = () => {
          if (done) return;
          if (activeRef.current) {
            try { rec.start(); } catch (e) { resolve(false); }
          } else {
            resolve(false);
          }
        };

        rec.onerror = (e) => {
          if (e.error === 'not-allowed') { activeRef.current = false; resolve(false); }
          // other errors: onend will restart
        };

        try { rec.start(); } catch (e) { resolve(false); }
      });
    }

    // Single-utterance recognition
    function listenOnce(onInterim = null, timeoutMs = 10000) {
      return new Promise(resolve => {
        if (!activeRef.current) { resolve(''); return; }
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = !!onInterim;
        rec.lang = 'en-AU';
        let finalText = '';
        let done = false;
        const timer = setTimeout(() => { try { rec.stop(); } catch (e) {} }, timeoutMs);

        recStopRef.current = () => {
          if (done) return;
          done = true; clearTimeout(timer);
          try { rec.stop(); } catch (e) {}
          resolve('');
        };

        rec.onresult = (e) => {
          const all = Array.from(e.results).map(r => r[0].transcript).join(' ');
          onInterim?.(all);
          if (e.results[e.results.length - 1].isFinal) finalText = all;
        };

        rec.onend = () => {
          if (done) return;
          done = true; clearTimeout(timer); recStopRef.current = null; resolve(finalText);
        };

        rec.onerror = () => {
          if (done) return;
          done = true; clearTimeout(timer); recStopRef.current = null; resolve('');
        };

        try { rec.start(); } catch (e) { resolve(''); }
      });
    }

    // Listen for confirmation — resolved by voice OR by a button click
    function waitForConfirmation() {
      return new Promise(resolve => {
        // Allow buttons to resolve this
        confirmResolveRef.current = (answer) => {
          confirmResolveRef.current = null;
          recStopRef.current?.(); // stop the voice listener
          resolve(answer);
        };
        // Also listen by voice
        listenOnce(null, 9000).then(voiceAnswer => {
          if (!confirmResolveRef.current) return; // already resolved by button
          confirmResolveRef.current = null;
          resolve(isSave(voiceAnswer) ? 'save' : 'cancel');
        });
      });
    }

    async function say(text) {
      if (!activeRef.current) return;
      setPalSays(text);
      await tts(text);
    }

    async function runSession() {
      while (activeRef.current) {
        // ── 1. Wait for wake word ──
        setPhase('wake');
        setPalSays('');
        setLiveText('');
        setDraft(null);

        const woke = await waitForWake();
        if (!activeRef.current || !woke) break;

        // ── 2. Listen for command ──
        setPhase('command');
        playChime('wake');
        setPalSays('Yes?');

        const rawCommand = await listenOnce(t => setLiveText(t), 12000);
        setLiveText('');
        if (!activeRef.current) break;

        if (!rawCommand.trim()) {
          await say('I didn\'t hear anything. Say "Hey Pal" to try again.');
          continue;
        }

        // ── 3. Parse command ──
        let patient = matchPatient(rawCommand, patientsRef.current);
        const type = detectType(rawCommand);
        let content = extractContent(rawCommand, patient);

        // ── 4. Clarify patient if not recognised ──
        if (!patient) {
          setPhase('clarify');
          await say('Which patient is this for? Say their name or bed number.');
          if (!activeRef.current) break;

          const patientResp = await listenOnce(t => setLiveText(t), 8000);
          setLiveText('');
          patient = matchPatient(patientResp, patientsRef.current);

          if (!patient) {
            await say('I couldn\'t find that patient. Say "Hey Pal" to try again.');
            continue;
          }
        }

        // ── 5. Clarify content if empty ──
        if (!content.trim()) {
          setPhase('clarify');
          await say('What would you like to add?');
          if (!activeRef.current) break;

          const contentResp = await listenOnce(t => setLiveText(t), 12000);
          setLiveText('');
          content = contentResp.trim();

          if (!content) {
            await say('I didn\'t catch that. Say "Hey Pal" to try again.');
            continue;
          }
          content = content[0].toUpperCase() + content.slice(1);
        }

        const d = { type, patient, content };
        setDraft(d);

        // ── 6. Read back ──
        setPhase('readback');
        const readback =
          `Adding a ${type === 'todo' ? 'to do' : 'note'} for ${patient.name}: ` +
          `"${content}". Say save to confirm, or cancel.`;
        await say(readback);
        if (!activeRef.current) break;

        // ── 7. Confirm by voice or button ──
        setPhase('confirming');
        setPalSays('Say "save" to confirm, or "cancel".');

        const answer = await waitForConfirmation();
        if (!activeRef.current) break;

        if (answer === 'save') {
          setPhase('saving');
          await say('Saving.');
          try {
            await postNote(d.patient.id, { type: d.type, content: d.content.trim() });
            playChime('done');
            await say('Saved!');
          } catch (e) {
            await say('Something went wrong. Please try again.');
          }
        } else {
          await say('Cancelled.');
        }

        setDraft(null);
        await new Promise(r => setTimeout(r, 600));
        // Loop back to wake word
      }

      setPhase('idle');
      setPalSays('');
    }

    runSession().catch(() => setPhase('idle'));

    return () => {
      activeRef.current = false;
      recStopRef.current?.();
      confirmResolveRef.current = null;
      window.speechSynthesis?.cancel();
      setPhase('idle');
      setPalSays('');
      setLiveText('');
      setDraft(null);
    };
  }, [enabled]);

  // ── Toggle PAL on/off ─────────────────────────────────────────────────────
  const handleToggle = () => {
    if (enabled) {
      activeRef.current = false;
      recStopRef.current?.();
      confirmResolveRef.current = null;
      window.speechSynthesis?.cancel();
      setEnabled(false);
    } else {
      setEnabled(true);
    }
  };

  // ── Button fallbacks during confirmation ──────────────────────────────────
  const handleManualSave = () => confirmResolveRef.current?.('save');
  const handleManualCancel = () => confirmResolveRef.current?.('cancel');

  if (!supported) return null;

  const isListening = phase === 'command' || phase === 'clarify';
  const isAwake = phase !== 'idle' && phase !== 'wake' && enabled;

  return (
    <>
      {/* ── Floating PAL button ── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">

        {/* Speech bubble */}
        {enabled && (palSays || liveText) && (
          <div className="max-w-xs">
            {palSays && (
              <div className={`px-4 py-2 rounded-2xl rounded-br-sm text-sm text-white shadow-lg mb-1
                ${phase === 'saving' ? 'bg-slate-600'
                  : phase === 'confirming' ? 'bg-blue-600'
                  : phase === 'readback' ? 'bg-indigo-600'
                  : 'bg-slate-700'}`}>
                <span className="text-xs font-bold text-white/60 block mb-0.5">PAL</span>
                {palSays}
              </div>
            )}
            {liveText && isListening && (
              <div className="px-4 py-2 rounded-2xl rounded-br-sm text-sm bg-white border border-slate-200 text-slate-700 shadow">
                <span className="text-xs font-bold text-slate-400 block mb-0.5">You</span>
                <span className="italic">{liveText}</span>
              </div>
            )}
          </div>
        )}

        {/* Status pill */}
        {enabled && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-white shadow
            ${phase === 'wake' ? 'bg-green-700'
              : phase === 'command' || phase === 'clarify' ? 'bg-blue-600'
              : phase === 'readback' ? 'bg-indigo-600'
              : phase === 'confirming' ? 'bg-amber-600'
              : phase === 'saving' ? 'bg-slate-600'
              : 'bg-slate-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-white
              ${phase === 'wake' ? 'animate-pulse'
                : isListening ? 'animate-ping'
                : ''}`} />
            {phase === 'wake' && 'Say "Hey Pal"'}
            {phase === 'command' && 'Listening…'}
            {phase === 'clarify' && 'Listening…'}
            {phase === 'readback' && 'PAL is speaking…'}
            {phase === 'confirming' && 'Say "save" or "cancel"'}
            {phase === 'saving' && 'Saving…'}
          </div>
        )}

        {/* PAL button */}
        <button
          onClick={handleToggle}
          title={enabled ? 'Turn off PAL' : 'Turn on PAL — say "Hey Pal" to add notes by voice'}
          className={`w-16 h-16 rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5 transition-all
            ${enabled
              ? isListening
                ? 'bg-blue-600 scale-110 ring-4 ring-blue-300'
                : isAwake
                  ? 'bg-indigo-600 ring-4 ring-indigo-300'
                  : 'bg-green-600'
              : 'bg-slate-600 hover:bg-slate-700'}`}
        >
          <MicSvg active={enabled} listening={isListening} />
          <span className="text-white text-[10px] font-bold tracking-widest">PAL</span>
        </button>
      </div>

      {/* ── Confirmation card ── */}
      {phase === 'confirming' && draft && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">PAL heard</span>
            </div>

            <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${draft.type === 'todo' ? 'text-amber-600' : 'text-blue-600'}`}>
              {draft.type === 'todo' ? 'To-Do' : 'Note'}
            </div>
            <p className="text-slate-800 font-medium mb-1">{draft.content}</p>
            <p className="text-sm text-slate-500 mb-4">
              For: <span className="font-medium text-slate-700">Bed {draft.patient.bed} — {draft.patient.name}</span>
            </p>

            <p className="text-xs text-slate-400 mb-3 text-center">Say "save" or "cancel" — or use the buttons below</p>

            <div className="flex gap-2">
              <button
                onClick={handleManualSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm"
              >
                Save
              </button>
              <button
                onClick={handleManualCancel}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MicSvg({ active, listening }) {
  const color = active ? 'white' : '#94a3b8';
  const fill = active ? (listening ? '#bfdbfe' : 'rgba(255,255,255,0.3)') : '#475569';
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
      <rect x="9" y="2" width="6" height="12" rx="3" fill={fill} />
      <path d="M5 11a7 7 0 0014 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="22" x2="15" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

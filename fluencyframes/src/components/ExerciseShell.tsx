"use client";

import { useMemo, useState } from "react";
import { logExerciseAttempt } from "../lib/actions/exercise";

type UserProfile = {
  avatar_url?: string | null;
  name?: string | null;
  role?: string | null;
};

type Exercise = {
  targetWord: string;
  options: Array<{ value: string; exposure: number; pos: string }>;
  feedback: string;
  passiveWordIds?: string[];
};

type DialogueTurn = {
  speaker: string;
  text: string;
};

type Situation = {
  title?: string;
  prompt?: string;
  context?: string;
};

type ExerciseShellProps = {
  userProfile: UserProfile;
  situation: Situation;
  dialogueTurns: DialogueTurn[];
  exercises: Exercise[];
};

const POS_CLASS_MAP: Record<string, string> = {
  noun: "pos-noun",
  verb: "pos-verb",
  adj: "pos-adj",
};

const POS_LABEL_MAP: Record<string, string> = {
  noun: "noun",
  verb: "verb",
  adj: "adj",
};

export default function ExerciseShell({
  userProfile,
  situation,
  dialogueTurns,
  exercises,
}: ExerciseShellProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentExercise = exercises[currentExerciseIndex];
  const currentTarget = currentExercise?.targetWord ?? "";
  const currentOptions = currentExercise?.options ?? [];

  const accuracy = useMemo(() => {
    const recent = history.slice(-25);
    const correct = recent.filter((value) => value === 1).length;
    const total = recent.length;
    return total ? Math.round((correct / total) * 100) : 0;
  }, [history]);

  const wrongPct = useMemo(() => {
    const recent = history.slice(-25);
    const wrong = recent.filter((value) => value === 0).length;
    const total = recent.length;
    return total ? Math.round((wrong / total) * 100) : 0;
  }, [history]);

  const handlePick = (value: string) => {
    if (confirmed) return;
    setPicked(value);
  };

  const handleConfirm = async () => {
    if (!picked || confirmed || !currentExercise) return;

    const isCorrect = picked === currentTarget;
    setConfirmed(true);
    setHistory((prev) => [...prev, isCorrect ? 1 : 0]);
    setIsSubmitting(true);
    setSubmitError(null);

    const result = await logExerciseAttempt({
      exerciseIndex: currentExerciseIndex,
      selectedWord: picked,
      targetWord: currentTarget,
      isCorrect,
      feedback: currentExercise.feedback,
    });

    if (!result.ok) {
      setSubmitError(result.error ?? "Unable to save your attempt.");
    }

    setIsSubmitting(false);
  };

  const handleNext = () => {
    if (!confirmed) return;
    setCurrentExerciseIndex((prev) => (prev + 1) % exercises.length);
    setPicked(null);
    setConfirmed(false);
    setSubmitError(null);
  };

  return (
    <div className="shell">
      <style jsx global>{`/* CSS preserved from the supplied HTML */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #071126;
  --bg2: #0a1628;
  --cyan: #00e5ff;
  --purple: #7b61ff;
  --lilac: #a78bfa;
  --white: #f0f4ff;
  --mid: rgba(240,244,255,0.75);
  --dim: rgba(240,244,255,0.3);
  --cyan-dim: rgba(0,229,255,0.08);
  --cyan-bdr: rgba(0,229,255,0.2);
  --pur-dim: rgba(123,97,255,0.08);
  --pur-bdr: rgba(123,97,255,0.2);
  --pos-noun: #00e5ff;
  --pos-verb: #7b61ff;
  --pos-adj: #a78bfa;
  --pos-noun-dim: rgba(0,229,255,0.08);
  --pos-verb-dim: rgba(123,97,255,0.1);
  --pos-adj-dim: rgba(167,139,250,0.1);
  --pos-noun-bdr: rgba(0,229,255,0.25);
  --pos-verb-bdr: rgba(123,97,255,0.3);
  --pos-adj-bdr: rgba(167,139,250,0.3);
  --radius-pill: 20px;
  --radius-card: 8px;
  --fs-xs: 8px;
  --fs-sm: 10px;
  --fs-base: 12px;
  --fs-md: 14px;
}
html, body { height: 100%; background: #040d1e; font-family: 'Space Grotesk', sans-serif; color: var(--white); -webkit-font-smoothing: antialiased; }
body::before { content: ''; position: fixed; inset: 0; background-image: linear-gradient(rgba(0,229,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.025) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; z-index: 0; }
.shell { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; }
.hdr { position: sticky; top: 0; z-index: 100; background: rgba(7,17,38,0.97); backdrop-filter: blur(16px); border-bottom: 1px solid var(--cyan-bdr); padding: 10px 16px 8px; }
.hdr-inner { display: flex; align-items: center; gap: 12px; max-width: 1160px; margin: 0 auto; width: 100%; }
.logo { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); letter-spacing: 0.15em; color: var(--cyan); text-transform: uppercase; white-space: nowrap; }
.hdr-prog { flex: 1; display: flex; align-items: center; gap: 8px; }
.prog-bar { flex: 1; height: 3px; background: rgba(0,229,255,0.12); border-radius: 2px; overflow: hidden; }
.prog-fill { height: 100%; width: 56%; background: var(--cyan); border-radius: 2px; transition: width 0.4s ease; }
.prog-lbl { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); color: var(--dim); white-space: nowrap; }
.streak { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); color: #f0b429; background: rgba(240,180,41,0.1); border: 1px solid rgba(240,180,41,0.25); border-radius: var(--radius-pill); padding: 2px 10px; white-space: nowrap; }
.content { flex: 1; display: flex; flex-direction: column; width: 100%; max-width: 1160px; margin: 0 auto; }
.panel-left { display: flex; flex-direction: column; background: var(--bg); border-bottom: 1px solid rgba(0,229,255,0.07); }
.panel-right { display: flex; flex-direction: column; background: var(--bg2); }
.sec { padding: 12px 16px; }
.sec-divider { border-bottom: 1px solid rgba(0,229,255,0.07); }
.arc-strip { background: var(--pur-dim); border-bottom: 1px solid var(--pur-bdr); padding: 6px 16px; display: flex; justify-content: space-between; align-items: center; }
.arc-lbl { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); color: var(--purple); letter-spacing: 0.12em; text-transform: uppercase; }
.arc-day { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); color: var(--dim); }
.interlocutor { display: flex; align-items: center; gap: 12px; }
.av { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.av-marta { background: var(--pur-dim); color: var(--purple); border: 1px solid var(--pur-bdr); }
.av-user { background: var(--cyan-dim); color: var(--cyan); border: 1px solid var(--cyan-bdr); }
.il-info { flex: 1; min-width: 0; }
.il-name { font-size: var(--fs-base); font-weight: 600; }
.il-role { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); color: rgba(240,244,255,0.4); letter-spacing: 0.06em; margin-top: 2px; }
.audio-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--cyan-bdr); background: var(--cyan-dim); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.2s; }
.audio-btn:hover { background: rgba(0,229,255,0.15); }
.thread-lbl { font-family: 'Space Mono', monospace; font-size: 7px; color: rgba(240,244,255,0.22); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
.bubble { margin-bottom: 8px; max-width: 80%; }
.bubble.them { margin-right: auto; }
.bsender { font-family: 'Space Mono', monospace; font-size: 7px; color: var(--dim); letter-spacing: 0.08em; margin-bottom: 3px; text-transform: uppercase; }
.btext { font-size: var(--fs-base); line-height: 1.6; color: rgba(240,244,255,0.82); border: 1px solid var(--pur-bdr); background: var(--pur-dim); border-radius: 4px 10px 10px 10px; padding: 7px 10px; font-weight: 300; }
.hi-noun { color: var(--pos-noun); border-bottom: 1px dashed rgba(0,229,255,0.35); }
.hi-verb { color: var(--pos-verb); border-bottom: 1px dashed rgba(123,97,255,0.4); }
.hi-adj { color: var(--pos-adj); border-bottom: 1px dashed rgba(167,139,250,0.4); }
.goal { padding: 8px 12px; background: var(--cyan-dim); border: 1px solid var(--cyan-bdr); border-left: 2px solid var(--cyan); border-radius: 0 var(--radius-card) var(--radius-card) 0; }
.goal-lbl { font-family: 'Space Mono', monospace; font-size: 7px; color: var(--cyan); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 3px; }
.goal-txt { font-size: var(--fs-sm); color: rgba(240,244,255,0.7); font-weight: 300; line-height: 1.5; }
.mode-row { display: flex; gap: 5px; }
.mpill { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); letter-spacing: 0.08em; padding: 3px 10px; border-radius: var(--radius-pill); border: 1px solid; cursor: pointer; transition: all 0.2s; text-transform: uppercase; }
.mpill.on { background: var(--cyan-dim); border-color: var(--cyan); color: var(--cyan); }
.mpill.off { background: transparent; border-color: rgba(255,255,255,0.1); color: var(--dim); }
.sentence { font-size: var(--fs-md); line-height: 1.8; color: rgba(240,244,255,0.9); background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-card); padding: 10px 12px; }
.blank { display: inline-block; min-width: 80px; border-bottom: 2px solid var(--cyan); font-weight: 600; text-align: center; padding: 0 3px; transition: all 0.25s; }
.blank.empty { color: transparent; background: var(--cyan-dim); border-radius: 4px; animation: pulse 2s ease-in-out infinite; }
.blank.preview-noun { color: var(--pos-noun); border-color: var(--pos-noun); background: var(--pos-noun-dim); border-radius: 4px; animation: none; }
.blank.preview-verb { color: var(--pos-verb); border-color: var(--pos-verb); background: var(--pos-verb-dim); border-radius: 4px; animation: none; }
.blank.preview-adj { color: var(--pos-adj); border-color: var(--pos-adj); background: var(--pos-adj-dim); border-radius: 4px; animation: none; }
.blank.filled-noun { color: var(--pos-noun); border-color: rgba(0,229,255,0.35); background: transparent; border-radius: 0; animation: none; }
.blank.filled-verb { color: var(--pos-verb); border-color: rgba(123,97,255,0.35); background: transparent; border-radius: 0; animation: none; }
.blank.filled-adj { color: var(--pos-adj); border-color: rgba(167,139,250,0.35); background: transparent; border-radius: 0; animation: none; }
@keyframes pulse { 0%,100% { border-color: rgba(0,229,255,0.25); } 50% { border-color: var(--cyan); } }
.options { display: flex; flex-wrap: wrap; gap: 6px; }
.opt-wrap { position: relative; cursor: pointer; border-radius: var(--radius-pill); transition: transform 0.15s; }
.opt-wrap:hover:not(.locked) { transform: scale(1.04); }
.opt-wrap.locked { cursor: default; }
.opt-ring { border-radius: var(--radius-pill); padding: 2px; transition: background 0.2s; }
.opt-ring.pos-noun { background: conic-gradient(var(--pos-noun) calc(var(--pct)*1%), rgba(0,229,255,0.12) 0); }
.opt-ring.pos-verb { background: conic-gradient(var(--pos-verb) calc(var(--pct)*1%), rgba(123,97,255,0.12) 0); }
.opt-ring.pos-adj { background: conic-gradient(var(--pos-adj) calc(var(--pct)*1%), rgba(167,139,250,0.12) 0); }
.opt-ring.pos-noun.preview { background: conic-gradient(var(--pos-noun) calc(var(--pct)*1%), rgba(0,229,255,0.22) 0); }
.opt-ring.pos-verb.preview { background: conic-gradient(var(--pos-verb) calc(var(--pct)*1%), rgba(123,97,255,0.22) 0); }
.opt-ring.pos-adj.preview { background: conic-gradient(var(--pos-adj) calc(var(--pct)*1%), rgba(167,139,250,0.22) 0); }
.opt-ring.ok { background: conic-gradient(var(--cyan) calc(var(--pct)*1%), rgba(0,229,255,0.18) 0) !important; }
.opt-ring.wrong { background: conic-gradient(rgba(255,80,80,0.65) calc(var(--pct)*1%), rgba(255,80,80,0.1) 0) !important; }
.opt-inner { font-family: 'Space Mono', monospace; font-size: var(--fs-sm); letter-spacing: 0.04em; padding: 5px 12px; border-radius: 18px; background: var(--bg); transition: color 0.2s, background 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 5px; }
.opt-ring.pos-noun .opt-inner { color: rgba(0,229,255,0.6); }
.opt-ring.pos-verb .opt-inner { color: rgba(123,97,255,0.75); }
.opt-ring.pos-adj .opt-inner { color: rgba(167,139,250,0.75); }
.opt-ring.pos-noun.preview .opt-inner { color: var(--pos-noun); background: var(--pos-noun-dim); }
.opt-ring.pos-verb.preview .opt-inner { color: var(--pos-verb); background: var(--pos-verb-dim); }
.opt-ring.pos-adj.preview .opt-inner { color: var(--pos-adj); background: var(--pos-adj-dim); }
.opt-ring.ok .opt-inner { color: var(--cyan); background: rgba(0,229,255,0.08); }
.opt-ring.wrong .opt-inner { color: rgba(255,130,130,0.85); background: rgba(255,80,80,0.07); }
.opt-exp { font-size: 8px; color: rgba(240,244,255,0.2); font-family: 'Space Mono', monospace; }
.opt-ring.preview .opt-exp { opacity: 0.65; }
.opt-ring.ok .opt-exp { color: rgba(0,229,255,0.45); }
.send-row { display: flex; align-items: flex-end; justify-content: flex-end; gap: 8px; }
.hint-txt { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); color: rgba(240,244,255,0.22); letter-spacing: 0.04em; text-align: right; flex: 1; line-height: 1.6; padding-bottom: 4px; }
.send-av-wrap { position: relative; flex-shrink: 0; width: 46px; height: 46px; cursor: pointer; transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.send-av-wrap.ready { transform: scale(1.15); }
.send-av-wrap.locked { pointer-events: none; }
.send-ring { position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(rgba(0,229,255,0.18) calc(var(--acc)*1%), rgba(255,80,80,0.22) calc(var(--acc)*1%) calc((var(--acc)+var(--wrng))*1%), rgba(255,255,255,0.06) calc((var(--acc)+var(--wrng))*1%)); transition: background 0.4s; }
.send-av { position: absolute; inset: 3px; border-radius: 50%; background: var(--cyan-dim); border: 1px solid var(--cyan-bdr); display: flex; align-items: center; justify-content: center; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; color: rgba(0,229,255,0.4); transition: all 0.25s; }
.send-av-wrap.ready .send-av { background: rgba(0,229,255,0.2); border-color: var(--cyan); color: var(--cyan); box-shadow: 0 0 14px rgba(0,229,255,0.28); }
.feedback { padding: 8px 12px; background: rgba(0,229,255,0.04); border: 1px solid var(--cyan-bdr); border-radius: var(--radius-card); font-size: var(--fs-sm); color: rgba(240,244,255,0.65); line-height: 1.6; font-weight: 300; display: none; }
.feedback.show { display: block; }
.lex-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.lex-lbl { font-family: 'Space Mono', monospace; font-size: 7px; color: rgba(240,244,255,0.22); letter-spacing: 0.12em; text-transform: uppercase; }
.lex-word { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); color: var(--dim); letter-spacing: 0.08em; transition: color 0.2s; }
.lex-word.on { color: var(--cyan); }
.cluster { position: relative; height: 120px; margin-bottom: 8px; }
svg.conn { position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; }
.node { position: absolute; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; cursor: default; transition: all 0.3s; border-radius: var(--radius-pill); padding: 1.5px; }
.node-inner { font-size: 9px; font-family: 'Space Mono', monospace; padding: 3px 8px; border-radius: 18px; background: var(--bg); transition: color 0.3s; white-space: nowrap; }
.node.anchor { background: rgba(255,255,255,0.1); }
.node.anchor .node-inner { color: rgba(240,244,255,0.25); }
.node.unseen { background: transparent; outline: 1.5px dashed rgba(255,255,255,0.14); outline-offset: -1.5px; padding: 0; }
.node.unseen .node-inner { color: rgba(240,244,255,0.15); background: transparent; }
.node.prog-noun { background: conic-gradient(var(--pos-noun) calc(var(--npct)*1%), rgba(0,229,255,0.1) 0); }
.node.prog-verb { background: conic-gradient(var(--pos-verb) calc(var(--npct)*1%), rgba(123,97,255,0.1) 0); }
.node.prog-adj { background: conic-gradient(var(--pos-adj) calc(var(--npct)*1%), rgba(167,139,250,0.1) 0); }
.node.prog-noun .node-inner { color: rgba(0,229,255,0.7); }
.node.prog-verb .node-inner { color: rgba(123,97,255,0.85); }
.node.prog-adj .node-inner { color: rgba(167,139,250,0.85); }
.node.mastered-noun { background: var(--pos-noun); box-shadow: 0 0 7px rgba(0,229,255,0.45); }
.node.mastered-verb { background: var(--pos-verb); box-shadow: 0 0 7px rgba(123,97,255,0.5); }
.node.mastered-adj { background: var(--pos-adj); box-shadow: 0 0 7px rgba(167,139,250,0.5); }
.node.mastered-noun .node-inner { color: var(--pos-noun); }
.node.mastered-verb .node-inner { color: var(--pos-verb); }
.node.mastered-adj .node-inner { color: var(--pos-adj); }
.node.center { padding: 2px; z-index: 2; }
.node.center .node-inner { font-size: 10px; font-weight: 700; padding: 4px 10px; }
.node.center.pos-noun { background: conic-gradient(var(--pos-noun) calc(var(--npct)*1%), rgba(0,229,255,0.18) 0); box-shadow: 0 0 10px rgba(0,229,255,0.3); }
.node.center.pos-verb { background: conic-gradient(var(--pos-verb) calc(var(--npct)*1%), rgba(123,97,255,0.18) 0); box-shadow: 0 0 10px rgba(0,229,255,0.3); }
.node.center.pos-adj { background: conic-gradient(var(--pos-adj) calc(var(--npct)*1%), rgba(167,139,250,0.18) 0); box-shadow: 0 0 10px rgba(167,139,250,0.3); }
.node.center.pos-noun .node-inner { color: var(--pos-noun); }
.node.center.pos-verb .node-inner { color: var(--pos-verb); }
.node.center.pos-adj .node-inner { color: var(--pos-adj); }
.trk { display: flex; align-items: center; gap: 8px; }
.trk-bar { flex:1; height: 3px; background: rgba(0,229,255,0.1); border-radius: 2px; overflow: hidden; }
.trk-fill { height: 100%; width: 0%; border-radius: 2px; transition: width 0.4s ease; }
.trk-fill.noun { background: linear-gradient(90deg, rgba(0,229,255,0.5), var(--pos-noun)); }
.trk-fill.verb { background: linear-gradient(90deg, rgba(123,97,255,0.5), var(--pos-verb)); }
.trk-fill.adj { background: linear-gradient(90deg, rgba(167,139,250,0.5), var(--pos-adj)); }
.trk-lbl { font-family: 'Space Mono', monospace; font-size: var(--fs-xs); color: var(--dim); white-space: nowrap; }
.collocates { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; min-height: 18px; }
.ctag { font-family: 'Space Mono', monospace; font-size: 8px; border-radius: var(--radius-pill); padding: 2px 7px; transition: all 0.2s; opacity: 0.55; }
.ctag.lit { opacity: 1; }
.ctag.noun { color: var(--pos-noun); background: var(--pos-noun-dim); border: 1px solid var(--pos-noun-bdr); }
.ctag.verb { color: var(--pos-verb); background: var(--pos-verb-dim); border: 1px solid var(--pos-verb-bdr); }
.ctag.adj { color: var(--pos-adj); background: var(--pos-adj-dim); border: 1px solid var(--pos-adj-bdr); }
.legend { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 4px; font-family: 'Space Mono', monospace; font-size: 7px; letter-spacing: 0.08em; text-transform: uppercase; }
.legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.legend-dot.noun { background: var(--pos-noun); }
.legend-dot.verb { background: var(--pos-verb); }
.legend-dot.adj { background: var(--pos-adj); }
.legend-item.noun { color: rgba(0,229,255,0.55); }
.legend-item.verb { color: rgba(123,97,255,0.7); }
.legend-item.adj { color: rgba(167,139,250,0.7); }
.node-legend { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
.nl-item { display: flex; align-items: center; gap: 5px; font-family: 'Space Mono', monospace; font-size: 7px; color: var(--dim); letter-spacing: 0.05em; }
.nl-swatch { width: 24px; height: 9px; border-radius: 5px; }
.nl-swatch.anchor { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); }
.nl-swatch.unseen { background: transparent; border: 1px dashed rgba(255,255,255,0.2); }
.nl-swatch.progress { background: conic-gradient(var(--pos-noun) 50%, rgba(0,229,255,0.12) 0); }
.nl-swatch.mastered { background: var(--pos-noun); box-shadow: 0 0 4px rgba(0,229,255,0.5); }
.next-row { display: flex; justify-content: flex-end; }
.next-btn { background: var(--cyan); color: var(--bg); border: none; font-family: 'Space Grotesk', sans-serif; font-size: var(--fs-sm); font-weight: 700; letter-spacing: 0.06em; padding: 9px 20px; border-radius: var(--radius-card); cursor: pointer; text-transform: uppercase; opacity: 0.25; pointer-events: none; transition: all 0.2s; }
.next-btn.ready { opacity: 1; pointer-events: all; }
.next-btn.ready:hover { background: rgba(0,229,255,0.85); }
@media (min-width: 600px) {
  .shell { max-width: 560px; margin: 0 auto; box-shadow: 0 0 60px rgba(0,0,0,0.6); }
  :root { --fs-xs: 9px; --fs-sm: 11px; --fs-base: 13px; --fs-md: 15px; }
  .av { width: 44px; height: 44px; }
}
@media (min-width: 768px) {
  .shell { max-width: 680px; }
  :root { --fs-xs: 9px; --fs-sm: 12px; --fs-base: 14px; --fs-md: 16px; }
  .send-av-wrap { width: 52px; height: 52px; }
  .cluster { height: 130px; }
  .hdr { padding: 10px 24px 8px; }
  .arc-strip, .sec { padding-left: 24px; padding-right: 24px; }
}
@media (min-width: 1024px) {
  .shell { max-width: 100%; box-shadow: none; }
  .hdr { padding: 10px 40px 8px; }
  .content { max-width: 1160px; flex-direction: row; align-items: stretch; flex: 1; padding: 24px 40px; gap: 24px; margin: 0 auto; }
  .panel-left { flex: 0 0 44%; border-right: 1px solid rgba(0,229,255,0.08); border-bottom: none; border-radius: var(--radius-card); border: 1px solid rgba(0,229,255,0.1); overflow: hidden; position: sticky; top: 60px; max-height: calc(100vh - 80px); overflow-y: auto; }
  .panel-right { flex: 0 0 53%; border-radius: var(--radius-card); border: 1px solid rgba(0,229,255,0.1); overflow: hidden; }
  .arc-strip, .sec { padding-left: 20px; padding-right: 20px; }
  .cluster { height: 140px; }
}
@media (min-width: 1280px) {
  .content { max-width: 1240px; padding: 24px 60px; }
  :root { --fs-base: 14px; --fs-md: 16px; }
  .cluster { height: 150px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; border-radius: 4px; }
`}</style>
      <header className="hdr">
        <div className="hdr-inner">
          <div className="logo">// Fluency Engine · Day {currentExerciseIndex + 1}</div>
          <div className="hdr-prog">
            <div className="prog-bar"><div className="prog-fill" style={{ width: `${Math.min((currentExerciseIndex + 1) / exercises.length, 1) * 100}%` }} /></div>
            <div className="prog-lbl">{currentExerciseIndex + 1} / {exercises.length}</div>
          </div>
          <div className="streak">🔥 {history.filter((value) => value === 1).length} day streak</div>
        </div>
      </header>
      <main className="content">
        <section className="panel-left">
          <div className="arc-strip">
            <div className="arc-lbl">// {situation.title ?? "Client escalation arc"}</div>
            <div className="arc-day">Day {currentExerciseIndex + 1} of 7</div>
          </div>
          <div className="sec sec-divider interlocutor">
            <div className="av av-marta">MS</div>
            <div className="il-info">
              <div className="il-name">{userProfile.name ?? "You"}</div>
              <div className="il-role">{userProfile.role ?? "Learner"}</div>
            </div>
            <button className="audio-btn" aria-label="Replay audio" type="button">
              <i className="ti ti-player-play" aria-hidden="true" />
            </button>
          </div>
          <div className="sec thread sec-divider">
            <div className="thread-lbl">// Thread</div>
            {dialogueTurns.map((turn) => (
              <div className="bubble them" key={`${turn.speaker}-${turn.text}`}>
                <div className="bsender">{turn.speaker}</div>
                <div className="btext">{turn.text}</div>
              </div>
            ))}
          </div>
          <div className="sec" style={{ paddingTop: 8, paddingBottom: 10 }}>
            <div className="legend">
              <div className="legend-item noun"><div className="legend-dot noun" />Noun</div>
              <div className="legend-item verb"><div className="legend-dot verb" />Verb</div>
              <div className="legend-item adj"><div className="legend-dot adj" />Adjective</div>
            </div>
          </div>
        </section>
        <section className="panel-right">
          <div className="arc-strip">
            <div className="arc-lbl">// Exercise</div>
            <div className="arc-day">R1 · Select</div>
          </div>
          <div className="sec sec-divider">
            <div className="goal">
              <div className="goal-lbl">// Communicative goal</div>
              <div className="goal-txt">{situation.prompt ?? situation.context ?? "Sound accountable and professional."}</div>
            </div>
          </div>
          <div className="sec sec-divider" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="mode-row">
              <div className="mpill on">R1 Select</div>
              <div className="mpill off">R2 Type</div>
              <div className="mpill off">R3 Speak</div>
            </div>
            <div className="sentence" aria-live="polite">
              {currentExercise ? (
                <>
                  I apologise for the <span className={`blank ${confirmed ? "filled-noun" : picked ? "preview-noun" : "empty"}`}>{confirmed ? currentTarget : picked ?? "_______"}</span> this has caused.
                </>
              ) : null}
            </div>
            <div className="options" role="group" aria-label="Word options">
              {currentOptions.map((option) => {
                const isPreview = picked === option.value;
                const isCorrect = confirmed && option.value === currentTarget;
                const isWrong = confirmed && picked === option.value && !isCorrect;
                const posClass = POS_CLASS_MAP[option.pos] ?? "pos-noun";
                return (
                  <div key={option.value} className={`opt-wrap ${confirmed ? "locked" : ""}`} role="button" tabIndex={0} onClick={() => handlePick(option.value)} onKeyDown={(event) => event.key === "Enter" && handlePick(option.value)}>
                    <div className={`opt-ring ${posClass}${isPreview ? " preview" : ""}${isCorrect ? " ok" : ""}${isWrong ? " wrong" : ""}`} style={{ ["--pct" as string]: Math.max(10, Math.min(100, option.exposure * 8)) }}>
                      <div className="opt-inner">{option.value} <span className="opt-exp">{option.exposure}/12</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="send-row">
              <div className="hint-txt">{confirmed ? (picked === currentTarget ? "Correct — well done" : "Not quite — see explanation below") : picked ? "Tap another to compare — or tap your avatar to confirm" : "Select a word to explore\nthen tap your avatar to confirm"}</div>
              <button className={`send-av-wrap ${picked ? "ready" : ""} ${confirmed ? "locked" : ""}`} type="button" onClick={handleConfirm} aria-label="Confirm answer">
                <div className="send-ring" style={{ ["--acc" as string]: accuracy, ["--wrng" as string]: wrongPct }} />
                <div className="send-av">
                  {userProfile.avatar_url ? <img src={userProfile.avatar_url} alt="User avatar" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover" }} /> : (userProfile.name ?? "AP").slice(0, 2).toUpperCase()}
                </div>
              </button>
            </div>
          </div>
          <div className={`sec sec-divider feedback ${confirmed ? "show" : ""}`}>
            {confirmed ? currentExercise.feedback : null}
          </div>
          <div className="sec sec-divider">
            <div className="lex-hdr">
              <div className="lex-lbl">// Word tracker</div>
              <div className="lex-word on">{currentExercise?.targetWord ?? "— select a word above"}</div>
            </div>
            <div className="cluster">
              <div className="node anchor" style={{ top: 8, left: 6 }}><div className="node-inner">problem</div></div>
              <div className="node unseen" style={{ top: 8, right: 6 }}><div className="node-inner">concern</div></div>
              <div className="node prog-noun" style={{ top: "50%", left: 2, transform: "translateY(-50%)", ["--npct" as string]: 42 }}><div className="node-inner">matter</div></div>
              <div className="node center pos-noun" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", ["--npct" as string]: 50 }}><div className="node-inner">{currentExercise?.targetWord ?? "—"}</div></div>
              <div className="node mastered-verb" style={{ top: "50%", right: 2, transform: "translateY(-50%)" }}><div className="node-inner">resolve</div></div>
              <div className="node prog-adj" style={{ bottom: 8, left: 6, ["--npct" as string]: 28 }}><div className="node-inner">critical</div></div>
              <div className="node prog-verb" style={{ bottom: 8, right: 6, ["--npct" as string]: 33 }}><div className="node-inner">address</div></div>
            </div>
            <div className="trk">
              <div className="trk-bar"><div className="trk-fill noun" style={{ width: `${Math.min(100, Math.max(0, accuracy))}%` }} /></div>
              <div className="trk-lbl">{accuracy} / 12 exposures</div>
            </div>
            <div className="collocates">
              {currentExercise?.targetWord ? (
                <>
                  <div className="ctag noun lit">operational {currentExercise.targetWord}</div>
                  <div className="ctag adj lit">serious {currentExercise.targetWord}</div>
                  <div className="ctag verb lit">address the {currentExercise.targetWord}</div>
                </>
              ) : null}
              {currentExercise?.passiveWordIds?.length ? (
                <div className="ctag noun lit">passive: {currentExercise.passiveWordIds.join(", ")}</div>
              ) : null}
            </div>
            <div className="node-legend">
              <div className="nl-item"><div className="nl-swatch anchor" />known word</div>
              <div className="nl-item"><div className="nl-swatch unseen" />unseen</div>
              <div className="nl-item"><div className="nl-swatch progress" />in progress</div>
              <div className="nl-item"><div className="nl-swatch mastered" />mastered</div>
            </div>
          </div>
          <div className="sec next-row">
            <button className={`next-btn ${confirmed ? "ready" : ""}`} type="button" onClick={handleNext}>
              Next exercise →
            </button>
          </div>
        </section>
      </main>
      {submitError ? <div className="sec" style={{ color: "#ff7b7b" }}>{submitError}</div> : null}
      {isSubmitting ? <div className="sec" style={{ color: "#00e5ff" }}>Saving your response…</div> : null}
    </div>
  );
}

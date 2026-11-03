import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import {
  Search, ChevronDown, Activity, Zap, Video, Download, Loader2,
  Star, Flame, Users, TrendingUp, Shield, Trophy, Eye,
  BarChart3, Swords, Brain, Target, AlertTriangle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// 13 scenes = ~60 seconds total
const SCENE_DURATIONS = [3000, 4000, 5000, 4000, 5000, 5000, 4000, 4000, 5000, 5000, 4000, 4000, 5000];
const BASE = import.meta.env.BASE_URL;

const springSnappy = { type: "spring" as const, stiffness: 400, damping: 30 };
const springBouncy = { type: "spring" as const, stiffness: 300, damping: 15 };
const springSmooth = { type: "spring" as const, stiffness: 120, damping: 25 };

// ── Scene 0 – Logo hook (3s) ─────────────────────────────────────────────────
function Scene0({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 0;
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-8 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.15, filter: "blur(12px)" }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ ...springBouncy, delay: 0.15 }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-primary/25 blur-[60px] rounded-full scale-150" />
            <h1 className="text-7xl font-display font-bold text-center text-gradient-gold tracking-tight leading-none relative z-10">
              NEXUS<br />SIGHT
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSnappy, delay: 1.1 }}
            className="text-2xl text-center text-white font-medium"
          >
            Chcesz wiedzieć{' '}
            <span className="text-primary font-bold">KIM</span> grasz?
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 1.8 }}
            className="h-px w-40 mt-4 bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 1 – Search animation (4s) ──────────────────────────────────────────
function Scene1({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 1;
  const [text, setText] = useState('');
  const fullText = 'Faker#KR1';

  useEffect(() => {
    if (!isActive) { setText(''); return; }
    let i = 0;
    let buf = '';
    const iv = setInterval(() => {
      if (i < fullText.length) { buf += fullText[i]; setText(buf); i++; }
      else clearInterval(iv);
    }, 140);
    return () => clearInterval(iv);
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-8 z-20"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40, filter: "blur(6px)" }}
          transition={{ duration: 0.55 }}
        >
          <motion.p
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-primary font-bold tracking-widest uppercase mb-4"
          >
            Szukaj gracza z dowolnego regionu
          </motion.p>
          <motion.div
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springSnappy, delay: 0.3 }}
            className="w-full max-w-sm glass-panel p-6 rounded-2xl glow-purple relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
            <h2 className="text-lg font-display text-white mb-4 flex items-center justify-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Znajdź Przywoływacza
            </h2>
            <div className="flex gap-2 mb-5">
              <div className="bg-background/80 border border-white/10 rounded-lg px-4 py-3 flex items-center gap-2">
                <span className="font-bold text-primary text-sm">EUNE</span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </div>
              <div className="flex-1 bg-background/80 border border-white/10 rounded-lg px-4 py-3 flex items-center relative overflow-hidden">
                <span className="text-base font-bold text-white tracking-wide">{text}</span>
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.75, repeat: Infinity }}
                  className="w-[2px] h-5 bg-primary ml-1"
                />
                {text === fullText && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-sm"
                  >
                    <Activity className="w-6 h-6 text-primary animate-spin" />
                  </motion.div>
                )}
              </div>
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="h-11 bg-white/5 rounded-lg flex items-center px-4"
                >
                  <div className="w-7 h-7 rounded-full bg-white/10 mr-3" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-2 w-1/3 bg-white/20 rounded" />
                    <div className="h-1.5 w-1/4 bg-white/10 rounded" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 2 – Rank + match history (5s) ──────────────────────────────────────
function Scene2({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 2;
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 z-20"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.55 }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0, rotateX: -15 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            transition={{ ...springSnappy, delay: 0.1 }}
            className="w-full glass-panel rounded-2xl p-5 flex items-center gap-5 relative mb-4"
            style={{ transformPerspective: 1000 }}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-primary/20 blur-[40px] rounded-full" />
            <motion.img
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...springBouncy, delay: 0.35 }}
              src={`${BASE}images/diamond-rank.png`}
              className="w-24 h-24 object-contain drop-shadow-[0_0_14px_rgba(139,92,246,0.6)] flex-shrink-0 z-10"
            />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 }}
              className="z-10"
            >
              <div className="text-xs font-bold tracking-widest text-primary uppercase mb-1">Solo/Duo</div>
              <h3 className="text-2xl font-display font-bold text-white tracking-wide">DIAMENT I</h3>
              <p className="text-primary/80 text-sm font-medium">85 LP &bull; 65% WR &bull; 🔥 7W streak</p>
            </motion.div>
          </motion.div>

          <div className="w-full space-y-2.5">
            {[
              { res: 'WIN', kda: '12/2/8', score: '9.2', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', col: 'text-green-400' },
              { res: 'WIN', kda: '8/1/15', score: '8.7', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', col: 'text-green-400' },
              { res: 'LOSS', kda: '4/5/2', score: '4.1', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', col: 'text-red-400' },
            ].map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springSnappy, delay: 1.0 + i * 0.14 }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl backdrop-blur-md"
                style={{ backgroundColor: m.bg, border: `1px solid ${m.border}` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-black/50 overflow-hidden border border-white/10 flex-shrink-0">
                    <img src={`${BASE}images/champion-portrait.png`} className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div>
                    <span className={`font-bold text-base ${m.col}`}>{m.res}</span>
                    <div className="text-white/60 text-xs">{m.kda} KDA</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">OP Score</div>
                  <div className={`text-lg font-bold font-display ${m.col}`}>{m.score}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 3 – Champion mastery (4s) ──────────────────────────────────────────
function Scene3({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 3;
  const champs = [
    { name: 'Ahri', level: 7, pts: '248K', pct: 88 },
    { name: 'Syndra', level: 7, pts: '201K', pct: 74 },
    { name: 'Azir', level: 6, pts: '156K', pct: 58 },
  ];
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 z-20"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 mb-6"
          >
            <Star className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-display font-bold text-white">Mastery Mistrzów</h2>
          </motion.div>

          <div className="w-full space-y-4">
            {champs.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springSmooth, delay: 0.3 + i * 0.18 }}
                className="w-full glass-panel p-4 rounded-2xl relative overflow-hidden"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                    <img src={`${BASE}images/champion-portrait.png`} className="w-full h-full object-cover opacity-90" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-white">{c.name}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: c.level === 7 ? 3 : c.level === 6 ? 2 : 1 }).map((_, j) => (
                          <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                        ))}
                        <span className="text-xs text-primary font-bold ml-1">Lv.{c.level}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{c.pts} pkt</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.pct}%` }}
                    transition={{ duration: 0.9, delay: 0.5 + i * 0.18, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-yellow-300"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Top 0.3% gracze na serwerze
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 4 – Radar chart + AI rank (5s) ─────────────────────────────────────
function Scene4({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 4;
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.55 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 mb-6"
          >
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <h2 className="text-2xl font-display font-bold text-white">Głęboka Analiza</h2>
          </motion.div>

          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springBouncy, delay: 0.2 }}
            className="relative w-56 h-56 mb-8 flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 text-white/10">
              <polygon points="50,5 95,38 78,95 22,95 5,38" fill="none" stroke="currentColor" strokeWidth="1" />
              <polygon points="50,27 73,44 65,73 35,73 27,44" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <line x1="50" y1="50" x2="50" y2="5" stroke="currentColor" strokeWidth="0.5" />
              <line x1="50" y1="50" x2="95" y2="38" stroke="currentColor" strokeWidth="0.5" />
              <line x1="50" y1="50" x2="78" y2="95" stroke="currentColor" strokeWidth="0.5" />
              <line x1="50" y1="50" x2="22" y2="95" stroke="currentColor" strokeWidth="0.5" />
              <line x1="50" y1="50" x2="5" y2="38" stroke="currentColor" strokeWidth="0.5" />
            </svg>
            <motion.svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 text-primary z-10"
              style={{ filter: "drop-shadow(0 0 10px rgba(202,138,4,0.55))" }}>
              <motion.polygon
                initial={{ points: "50,50 50,50 50,50 50,50 50,50" }}
                animate={{ points: "50,14 86,41 71,84 29,79 14,34" }}
                transition={{ duration: 1.4, delay: 0.4, ease: "easeOut" }}
                fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="2"
              />
            </motion.svg>
            <div className="absolute -top-7 text-[11px] font-bold text-primary">Agresja</div>
            <div className="absolute -right-14 top-[30%] text-[11px] font-bold text-white/60">Wizja</div>
            <div className="absolute -right-3 bottom-1 text-[11px] font-bold text-white/60">Walki</div>
            <div className="absolute -left-5 bottom-1 text-[11px] font-bold text-white/60">Carry</div>
            <div className="absolute -left-16 top-[30%] text-[11px] font-bold text-white/60">Farmienie</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSnappy, delay: 1.4 }}
            className="w-full glass-panel p-5 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-violet-500/20" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-primary uppercase mb-1">Szacowana ranga AI</div>
                <div className="text-2xl font-display font-bold text-white">MASTER</div>
                <div className="text-xs text-muted-foreground mt-0.5">Archetyp: <span className="text-violet-400 font-semibold">Carry Mechaniczny</span></div>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/8 flex items-center justify-center border border-white/15">
                <Zap className="w-7 h-7 text-primary" />
              </div>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.1, delay: 2.0 }}
              className="h-1 mt-4 bg-gradient-to-r from-primary to-violet-500 rounded-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 5 – Live game detection (5s) ───────────────────────────────────────
function Scene5({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 5;
  const team1 = ['Ahri', 'Lee Sin', 'Garen', 'Caitlyn', 'Thresh'];
  const team2 = ['Syndra', 'Graves', 'Darius', 'Jinx', 'Nautilus'];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 z-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springBouncy, delay: 0.2 }}
            className="flex items-center gap-2 mb-5 px-4 py-2 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <span className="pulse-dot" />
            <Eye className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-bold text-sm tracking-wide">LIVE W MECZU</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full glass-panel rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Drużyna Niebieska</span>
              <span className="text-xs font-bold text-muted-foreground">vs</span>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Drużyna Czerwona</span>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                {team1.map((name, i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 overflow-hidden flex-shrink-0">
                      <img src={`${BASE}images/champion-portrait.png`} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <span className="text-xs text-white/80 truncate">{name}</span>
                  </motion.div>
                ))}
              </div>

              <div className="w-px bg-white/8 mx-1" />

              <div className="flex-1 space-y-2">
                {team2.map((name, i) => (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-2 flex-row-reverse"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 overflow-hidden flex-shrink-0">
                      <img src={`${BASE}images/champion-portrait.png`} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <span className="text-xs text-white/80 truncate text-right">{name}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="mt-4 pt-3 border-t border-white/6 flex items-center justify-between"
            >
              <span className="text-[10px] text-muted-foreground">Czas gry</span>
              <span className="text-sm font-bold font-display text-primary">14:32</span>
              <span className="text-[10px] text-muted-foreground">Ranga przeciwnika</span>
              <span className="text-sm font-bold text-violet-400">Platyna I</span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 6 – Coaching tips + champion recs (4s) ─────────────────────────────
function Scene6({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 6;
  const tips = [
    { icon: Shield, text: 'Twój vision score jest za niski — kupuj więcej wardów', col: 'text-blue-400', bg: 'rgba(59,130,246,0.08)', br: 'rgba(59,130,246,0.2)' },
    { icon: Flame, text: 'Seryjny zabójca — wiesz jak wygrywać walki 1v1', col: 'text-orange-400', bg: 'rgba(249,115,22,0.08)', br: 'rgba(249,115,22,0.2)' },
    { icon: Trophy, text: 'Polecany bohater: Irelia — idealny do Twojego stylu', col: 'text-primary', bg: 'rgba(202,138,4,0.08)', br: 'rgba(202,138,4,0.2)' },
  ];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 z-20"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-2 mb-6"
          >
            <Users className="w-5 h-5 text-violet-400" />
            <h2 className="text-2xl font-display font-bold text-white">Coaching AI</h2>
          </motion.div>

          <div className="w-full space-y-3.5">
            {tips.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ ...springSmooth, delay: 0.3 + i * 0.22 }}
                className="w-full flex items-start gap-3.5 p-4 rounded-2xl"
                style={{ background: t.bg, border: `1px solid ${t.br}` }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.bg, border: `1px solid ${t.br}` }}>
                  <t.icon className={`w-4 h-4 ${t.col}`} />
                </div>
                <p className={`text-sm font-medium leading-snug ${t.col}`}>{t.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-5 text-center"
          >
            <p className="text-xs text-muted-foreground">
              Spersonalizowane wskazówki na podstawie{' '}
              <span className="text-primary font-semibold">ostatnich 50 gier</span>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 7 – CTA finale (5s) ─────────────────────────────────────────────────
function Scene7({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 7;
  const features = ['Ranga ranked', 'Historia meczy', 'Analiza stylu', 'Live game', 'Coaching AI'];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-8 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springBouncy, delay: 0.1 }}
            className="mb-6 relative z-10"
          >
            <div className="absolute inset-0 bg-primary/50 blur-[90px] rounded-full scale-150" />
            <h1 className="text-6xl font-display font-bold text-center leading-tight relative z-10">
              <span className="text-white">NEXUS</span><br />
              <span className="text-gradient-gold">SIGHT</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, ...springSnappy }}
            className="text-xl font-medium text-white/90 text-center mb-6 relative z-10"
          >
            Twoja przewaga na<br />
            <span className="text-primary font-bold">Summoner's Rift</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap justify-center gap-2 mb-7 relative z-10"
          >
            {features.map((f, i) => (
              <motion.span
                key={f}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.09, ...springBouncy }}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(202,138,4,0.12)', border: '1px solid rgba(202,138,4,0.25)', color: '#e8a93c' }}
              >
                {f}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, ...springBouncy }}
            className="relative z-10"
          >
            <div className="px-8 py-4 rounded-2xl font-display font-bold tracking-widest text-lg uppercase text-background shadow-[0_0_30px_rgba(202,138,4,0.5)]"
              style={{ background: "linear-gradient(135deg, #e8a93c, #e8a93c)" }}>
              SPRAWDŹ TERAZ
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 8 – LP History chart (4s) ──────────────────────────────────────────
function Scene8({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 8;
  const points = [
    { lp: 1200, tier: 'GOLD', label: 'Gold IV', date: '10 mar' },
    { lp: 1350, tier: 'GOLD', label: 'Gold III', date: '14 mar' },
    { lp: 1280, tier: 'GOLD', label: 'Gold III', date: '16 mar' },
    { lp: 1550, tier: 'PLAT', label: 'Plat IV', date: '20 mar' },
    { lp: 1700, tier: 'PLAT', label: 'Plat III', date: '25 mar' },
    { lp: 1850, tier: 'PLAT', label: 'Plat II', date: '28 mar' },
    { lp: 2000, tier: 'PLAT', label: 'Plat I', date: '31 mar' },
  ];
  const colors: Record<string, string> = { GOLD: '#D4A839', PLAT: '#4CBFAA' };
  const minLP = 1100, maxLP = 2100, range = maxLP - minLP;
  const w = 300, h = 110, px = 10, py = 14, iw = w - px * 2, ih = h - py * 2;
  const pts = points.map((p, i) => ({
    x: px + (i / (points.length - 1)) * iw,
    y: py + (1 - (p.lp - minLP) / range) * ih,
    ...p,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 z-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40, filter: 'blur(6px)' }}
          transition={{ duration: 0.5 }}
        >
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-2xl font-display font-bold text-white">Historia LP</h2>
          </motion.div>

          <motion.div
            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springSnappy, delay: 0.25 }}
            className="w-full glass-panel rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Progresja rangi</p>
                <p className="text-xl font-display font-bold text-white">Gold IV → <span className="text-teal-400">Plat I</span></p>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, ...springBouncy }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}
              >
                <ArrowUpRight className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold text-sm">+800 LP</span>
              </motion.div>
            </div>

            <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 110 }}>
              <defs>
                <linearGradient id="lpAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(76,191,170,0.25)" />
                  <stop offset="100%" stopColor="rgba(76,191,170,0)" />
                </linearGradient>
              </defs>
              <motion.path d={areaD} fill="url(#lpAreaGrad)"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} />
              <motion.path d={pathD} fill="none" stroke="#4CBFAA" strokeWidth="2" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.8, delay: 0.4, ease: 'easeOut' }} />
              {pts.map((p, i) => (
                <motion.circle key={i} cx={p.x} cy={p.y} r="4"
                  fill={colors[p.tier] ?? '#888'} stroke="white" strokeWidth="1.5"
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.2, ...springBouncy }} />
              ))}
            </svg>

            <div className="flex justify-between mt-2">
              {[points[0], points[points.length - 1]].map((p, i) => (
                <span key={i} className="text-[10px] text-muted-foreground">{p.date}</span>
              ))}
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
            className="mt-4 text-xs text-center text-muted-foreground">
            Śledź swój postęp po każdym wejściu na profil
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 9 – Champion stats table (5s) ───────────────────────────────────────
function Scene9({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 9;
  const champs = [
    { name: 'Ahri', games: 12, wr: 67, kda: '4.8', kda_str: '6.2/2.1/8.3', cs: '7.2', score: 82 },
    { name: 'Syndra', games: 8, wr: 62, kda: '3.9', kda_str: '5.8/2.8/6.4', cs: '8.1', score: 74 },
    { name: 'Lux', games: 5, wr: 40, kda: '2.1', kda_str: '3.1/4.2/7.0', cs: '5.4', score: 51 },
  ];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-5 z-20"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex items-center gap-2 mb-5">
            <Swords className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-display font-bold text-white">Statystyki Championów</h2>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springSnappy, delay: 0.2 }}
            className="w-full glass-panel rounded-2xl p-4">
            <div className="grid grid-cols-5 text-[9px] uppercase tracking-wider text-muted-foreground pb-2 border-b border-white/8 mb-2 px-1">
              <span>Bohater</span>
              <span className="text-center">G</span>
              <span className="text-center">WR</span>
              <span className="text-center">K/D/A</span>
              <span className="text-center">Wynik</span>
            </div>

            {champs.map((c, i) => {
              const pc = c.score >= 70 ? '#22c55e' : c.score >= 50 ? '#eab308' : '#ef4444';
              return (
                <motion.div key={c.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springSnappy, delay: 0.4 + i * 0.2 }}
                  className="grid grid-cols-5 items-center py-2.5 border-b border-white/5 last:border-0 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-black/50 border border-white/10 overflow-hidden flex-shrink-0">
                      <img src={`${BASE}images/champion-portrait.png`} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <span className="text-xs font-semibold text-white truncate">{c.name}</span>
                  </div>
                  <span className="text-center text-xs text-muted-foreground font-mono">{c.games}</span>
                  <span className={`text-center text-xs font-bold font-mono ${c.wr >= 50 ? 'text-green-400' : 'text-red-400'}`}>{c.wr}%</span>
                  <div className="text-center">
                    <div className="text-[10px] font-mono text-white/70">{c.kda_str}</div>
                    <div className="text-[9px] text-muted-foreground">{c.kda} KDA</div>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="text-[10px] font-bold" style={{ color: pc }}>{c.score}</span>
                    <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: pc }} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
            className="mt-4 text-xs text-center text-muted-foreground">
            Kliknij nagłówek kolumny, żeby posortować · <span className="text-primary">Kliknij champions, żeby zobaczyć detale</span>
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 10 – Match deep dive (4s) ──────────────────────────────────────────
function Scene10({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 10;
  const stats = [
    { label: 'Obrażenia', val: '28.4K', pct: 78, col: '#f97316' },
    { label: 'Złoto', val: '14.2K', pct: 65, col: '#eab308' },
    { label: 'Wizja', val: '38 pkt', pct: 52, col: '#818cf8' },
    { label: 'CS/min', val: '8.7', pct: 85, col: '#22c55e' },
  ];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 z-20"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-violet-400" />
            <h2 className="text-2xl font-display font-bold text-white">Analiza Meczu</h2>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springSnappy, delay: 0.2 }}
            className="w-full glass-panel rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-black/50 border border-green-500/30 overflow-hidden flex-shrink-0">
                  <img src={`${BASE}images/champion-portrait.png`} className="w-full h-full object-cover opacity-80" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-400">WYGRANA · 32:14</p>
                  <p className="text-white font-mono font-bold text-lg">14 / <span className="text-red-400">2</span> / 9</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">OP Score</p>
                <p className="text-3xl font-display font-black text-green-400">9.4</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {stats.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-bold" style={{ color: s.col }}>{s.val}</span>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: s.col }}
                      initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + i * 0.15, ease: 'easeOut' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
            className="w-full flex gap-2">
            <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="text-[10px] text-muted-foreground mb-0.5">Ocena</p>
              <p className="text-2xl font-black text-green-400 font-display">S+</p>
            </div>
            <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'rgba(202,138,4,0.08)', border: '1px solid rgba(202,138,4,0.2)' }}>
              <p className="text-[10px] text-muted-foreground mb-0.5">KP%</p>
              <p className="text-2xl font-black text-primary font-display">78%</p>
            </div>
            <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}>
              <p className="text-[10px] text-muted-foreground mb-0.5">Dmg%</p>
              <p className="text-2xl font-black text-violet-400 font-display">34%</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 11 – Tilt indicator + streak (4s) ───────────────────────────────────
function Scene11({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 11;
  const recent = [
    { w: true, kda: '8/1/7' }, { w: true, kda: '12/2/9' }, { w: true, kda: '6/3/14' },
    { w: false, kda: '2/7/1' }, { w: false, kda: '1/9/3' },
  ];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 z-20"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex items-center gap-2 mb-5">
            <Brain className="w-5 h-5 text-violet-400" />
            <h2 className="text-2xl font-display font-bold text-white">Wskaźnik Tiltu</h2>
          </motion.div>

          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springSnappy, delay: 0.2 }}
            className="w-full glass-panel rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
                  <motion.circle cx="18" cy="18" r="15" stroke="#f97316" strokeWidth="3" fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 94.2" }}
                    animate={{ strokeDasharray: "62 94.2" }}
                    transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-orange-400">65%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Poziom tiltu</p>
                <p className="text-lg font-bold text-orange-400">Umiarkowany</p>
                <p className="text-xs text-muted-foreground mt-0.5">Seria porażek degraduje Twoje KDA o 40%</p>
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Ostatnie mecze</p>
            <div className="flex gap-2">
              {recent.map((m, i) => (
                <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.12, ...springBouncy }}
                  className="flex-1 p-2 rounded-lg text-center"
                  style={{
                    background: m.w ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${m.w ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  }}>
                  <p className={`text-[9px] font-bold ${m.w ? 'text-green-400' : 'text-red-400'}`}>{m.w ? 'W' : 'L'}</p>
                  <p className="text-[8px] text-muted-foreground font-mono mt-0.5">{m.kda}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
            className="w-full p-4 rounded-2xl"
            style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-300 leading-relaxed">
                <span className="font-bold">Sugestia:</span> Zrób przerwę po 2 porażkach z rzędu. Twoja skuteczność spada o 65%.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Scene 12 – CTA finale extended (5s) ──────────────────────────────────────
function Scene12({ currentScene }: { currentScene: number }) {
  const isActive = currentScene === 12;
  const features = ['Historia LP', 'Statystyki per champion', 'Wskaźnik tiltu', 'Live game', 'Coaching AI', 'Szacowana ranga AI'];

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center px-8 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

          <motion.div
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springBouncy, delay: 0.1 }}
            className="mb-5 relative z-10"
          >
            <div className="absolute inset-0 bg-primary/50 blur-[90px] rounded-full scale-150" />
            <h1 className="text-6xl font-display font-bold text-center leading-tight relative z-10">
              <span className="text-white">NEXUS</span><br />
              <span className="text-gradient-gold">SIGHT</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, ...springSnappy }}
            className="text-lg font-medium text-white/90 text-center mb-5 relative z-10"
          >
            Wszystko czego potrzebujesz<br />
            żeby <span className="text-primary font-bold">awansować</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="flex flex-wrap justify-center gap-2 mb-6 relative z-10"
          >
            {features.map((f, i) => (
              <motion.span
                key={f}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.1, ...springBouncy }}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(202,138,4,0.12)', border: '1px solid rgba(202,138,4,0.25)', color: '#e8a93c' }}
              >
                ✓ {f}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.7, ...springBouncy }}
            className="relative z-10 mb-4"
          >
            <div className="px-8 py-4 rounded-2xl font-display font-bold tracking-widest text-lg uppercase text-background shadow-[0_0_30px_rgba(202,138,4,0.5)]"
              style={{ background: "linear-gradient(135deg, #e8a93c, #e8a93c)" }}>
              SPRAWDŹ TERAZ
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="text-[10px] text-muted-foreground relative z-10 text-center"
          >
            nexus-sight.onrender.com · darmowe · bez rejestracji
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const TOTAL_DURATION = SCENE_DURATIONS.reduce((a, b) => a + b, 0);
const SCENE_COUNT = SCENE_DURATIONS.length;

type RecordState = 'idle' | 'capturing' | 'recording' | 'done';
type Mp4State = 'idle' | 'loading' | 'converting' | 'done' | 'error';

export default function Promo() {
  // ?scene=N freezes a specific scene for screenshot purposes
  const frozenScene = (() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const n = Number(p.get('scene'));
    return !isNaN(n) && n >= 0 && n < SCENE_COUNT ? n : null;
  })();

  const [currentScene, setCurrentScene] = useState(frozenScene ?? 0);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [countdown, setCountdown] = useState(0);
  const [webmBlob, setWebmBlob] = useState<Blob | null>(null);
  const [mp4State, setMp4State] = useState<Mp4State>('idle');
  const [mp4Progress, setMp4Progress] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const streamCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const capturingRef = useRef(false);

  useEffect(() => {
    if (frozenScene !== null) return; // frozen — don't auto-advance
    const timeout = setTimeout(() => {
      setCurrentScene((prev) => (prev + 1) % SCENE_COUNT);
    }, SCENE_DURATIONS[currentScene]);
    return () => clearTimeout(timeout);
  }, [currentScene, frozenScene]);

  const handleRecord = async () => {
    const container = containerRef.current;
    if (!container) return;

    chunksRef.current = [];
    capturingRef.current = true;
    setCurrentScene(0);
    setRecordState('capturing');
    setCountdown(Math.round(TOTAL_DURATION / 1000));
    setWebmBlob(null);
    setMp4State('idle');

    const canvas = document.createElement('canvas');
    canvas.width = 540;
    canvas.height = 960;
    streamCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d')!;

    const stream = canvas.captureStream(15);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setWebmBlob(blob);
      setRecordState('done');
    };

    recorder.start(200);
    setRecordState('recording');

    const tick = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(tick); return 0; } return c - 1; });
    }, 1000);

    const captureLoop = async () => {
      if (!capturingRef.current) return;
      try {
        const snap = await html2canvas(container, {
          useCORS: true,
          allowTaint: true,
          scale: 540 / container.offsetWidth,
          logging: false,
          backgroundColor: '#060818',
          imageTimeout: 0,
        });
        ctx.drawImage(snap, 0, 0, 540, 960);
      } catch { /* skip frame on error */ }
      if (capturingRef.current) setTimeout(captureLoop, 40);
    };

    setTimeout(captureLoop, 150);

    setTimeout(() => {
      capturingRef.current = false;
      clearInterval(tick);
      recorder.stop();
    }, TOTAL_DURATION + 600);
  };

  const handleDownloadWebm = () => {
    if (!webmBlob) return;
    const url = URL.createObjectURL(webmBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-sight-promo.webm';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleExportMp4 = async () => {
    if (!webmBlob) return;
    setMp4State('loading');
    setMp4Progress(0);

    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      const base = import.meta.env.BASE_URL;
      const ffmpeg = new FFmpeg();

      // Track conversion progress (0-100)
      ffmpeg.on('progress', ({ progress }) => {
        setMp4Progress(Math.max(0, Math.min(100, Math.round(progress * 100))));
      });

      // Fetch WASM files manually with progress tracking
      const fetchWithProgress = async (url: string, onProgress: (pct: number) => void) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
        const total = Number(res.headers.get('content-length') || 0);
        const reader = res.body!.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total > 0) onProgress(Math.round((received / total) * 100));
        }
        const buf = new Uint8Array(received);
        let pos = 0;
        for (const c of chunks) { buf.set(c, pos); pos += c.length; }
        return buf.buffer;
      };

      // Step 1: Load JS (fast, ~112KB)
      setMp4Progress(2);
      const coreJsBuf = await fetchWithProgress(`${base}ffmpeg-core.js`, () => {});
      const coreJsBlob = new Blob([coreJsBuf], { type: 'text/javascript' });
      const coreJsUrl = URL.createObjectURL(coreJsBlob);

      // Step 2: Load WASM (~31MB) with download progress mapped to 2→50
      const wasmBuf = await fetchWithProgress(`${base}ffmpeg-core.wasm`, (pct) => {
        setMp4Progress(2 + Math.round(pct * 0.48));
      });
      const wasmBlob = new Blob([wasmBuf], { type: 'application/wasm' });
      const wasmUrl = URL.createObjectURL(wasmBlob);

      setMp4Progress(50);
      await ffmpeg.load({ coreURL: coreJsUrl, wasmURL: wasmUrl });
      URL.revokeObjectURL(coreJsUrl);
      URL.revokeObjectURL(wasmUrl);

      // Step 3: Convert
      setMp4State('converting');
      setMp4Progress(50);
      await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26',
        '-movflags', '+faststart',
        'output.mp4',
      ]);

      const data = await ffmpeg.readFile('output.mp4');
      const mp4Blob = new Blob([data as unknown as ArrayBuffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(mp4Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nexus-sight-promo.mp4';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setMp4State('done');
    } catch (err) {
      console.error('MP4 export error:', err);
      setMp4State('error');
    }
  };

  return (
    <div className="w-full h-screen bg-background overflow-hidden relative flex flex-col items-center justify-center font-sans select-none gap-4">

      {/* Controls bar */}
      <div className="flex flex-col items-center gap-2 z-20 px-4 w-full max-w-[420px]">
        <div className="flex items-center gap-2 flex-wrap justify-center w-full">
          {recordState === 'idle' && (
            <button
              onClick={handleRecord}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #e8a93c, #e8a93c)", color: "#ece6d6", boxShadow: "0 4px 20px rgba(202,138,4,0.3)" }}
            >
              <Video className="w-4 h-4" />
              Nagraj wideo (~60s)
            </button>
          )}
          {recordState === 'capturing' && (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-muted-foreground"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Przygotowuję nagranie…
            </div>
          )}
          {recordState === 'recording' && (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#6b2a30" }}>
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Nagrywanie… {countdown}s
            </div>
          )}
          {recordState === 'done' && webmBlob && (
            <>
              <button
                onClick={handleRecord}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
              >
                <Video className="w-3.5 h-3.5" />
                Nagraj ponownie
              </button>
              <button
                onClick={handleDownloadWebm}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}
              >
                <Download className="w-3.5 h-3.5" />
                Pobierz WebM
              </button>
              <button
                onClick={handleExportMp4}
                disabled={mp4State === 'loading' || mp4State === 'converting'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                style={{ background: "linear-gradient(135deg, hsl(217,91%,50%), hsl(230,85%,45%))", color: "white", boxShadow: "0 4px 20px rgba(59,130,246,0.35)" }}
              >
                {mp4State === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {mp4State === 'converting' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {(mp4State === 'idle' || mp4State === 'done') && <Download className="w-3.5 h-3.5" />}
                {mp4State === 'error' && <AlertTriangle className="w-3.5 h-3.5" />}
                {mp4State === 'idle' && 'Eksportuj do MP4'}
                {mp4State === 'loading' && `Pobieranie… ${mp4Progress}%`}
                {mp4State === 'converting' && `Konwertowanie… ${mp4Progress}%`}
                {mp4State === 'done' && 'MP4 gotowy!'}
                {mp4State === 'error' && 'Błąd — spróbuj ponownie'}
              </button>
            </>
          )}
        </div>
        {(mp4State === 'loading' || mp4State === 'converting') && (
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${mp4Progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
        {(mp4State === 'loading' || mp4State === 'converting') && (
          <p className="text-[10px] text-muted-foreground text-center">
            {mp4State === 'loading'
              ? 'Pobieranie silnika konwersji (31 MB)…'
              : 'Trwa konwersja do H.264 / MP4…'}
          </p>
        )}
        <span className="text-[11px] text-muted-foreground/50">Scena {currentScene + 1}/{SCENE_COUNT}</span>
      </div>

      {/* 9:16 TikTok container */}
      <div ref={containerRef} className="relative w-full max-w-[420px] h-full max-h-[780px] aspect-[9/16] bg-background shadow-2xl overflow-hidden md:rounded-3xl border border-white/5">

        {/* Persistent animated background */}
        <div className="absolute inset-0 z-0">
          <img src={`${BASE}images/bg-orbs.png`} alt="" className="w-full h-full object-cover opacity-55 mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/45 to-background" />
          <motion.div
            animate={{ x: currentScene % 2 === 0 ? "8vw" : "-8vw", y: currentScene % 3 === 0 ? "4vh" : "-4vh", scale: currentScene === 4 ? 1.4 : 1 }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[90px]"
          />
          <motion.div
            animate={{ x: currentScene % 2 !== 0 ? "12vw" : "-12vw", scale: currentScene === 1 ? 1.4 : 1 }}
            transition={{ duration: 4.5, ease: "easeInOut" }}
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-[110px]"
          />
          <motion.div
            animate={{ opacity: [5, 6].includes(currentScene) ? 0.15 : 0.06, scale: [5, 6].includes(currentScene) ? 1.2 : 1 }}
            transition={{ duration: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"
          />
        </div>

        {/* Scenes */}
        <Scene0 currentScene={currentScene} />
        <Scene1 currentScene={currentScene} />
        <Scene2 currentScene={currentScene} />
        <Scene3 currentScene={currentScene} />
        <Scene4 currentScene={currentScene} />
        <Scene5 currentScene={currentScene} />
        <Scene6 currentScene={currentScene} />
        <Scene7 currentScene={currentScene} />
        <Scene8 currentScene={currentScene} />
        <Scene9 currentScene={currentScene} />
        <Scene10 currentScene={currentScene} />
        <Scene11 currentScene={currentScene} />
        <Scene12 currentScene={currentScene} />

        {/* TikTok-style progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/15 z-50">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-yellow-300"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: TOTAL_DURATION / 1000, ease: "linear", repeat: Infinity }}
            key="progress"
          />
        </div>

        {/* Scene dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-50">
          {SCENE_DURATIONS.map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: i === currentScene ? 1 : 0.3, scale: i === currentScene ? 1.3 : 1 }}
              transition={{ duration: 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

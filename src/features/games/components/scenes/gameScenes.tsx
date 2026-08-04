import {
  Board,
  Cell,
  Chip,
  Enemy,
  Gauge,
  GridLines,
  Ground,
  PlayCard,
  Player,
  Projectile,
  SceneStage,
  ScorePanel,
  Trail,
  type ScenePalette,
} from "./primitives";

/**
 * One bespoke scene per game.
 *
 * Each scene shows a real moment of play — a board state, a hazard about to be
 * cleared, a result being read — rather than a symbol on a gradient. They share
 * the primitives, the 320 x 180 stage, and the stroke/radius language, and
 * differ in palette and composition so the grid never repeats itself.
 */

const palette = (
  bg: [string, string],
  rule: string,
  ink: string,
  accent: string,
  text: string,
): ScenePalette => ({ bg, rule, ink, accent, text });

/* ------------------------------------------------------------------ 2048 */

const TILE_COLORS: Record<string, [string, string]> = {
  "2": ["#eee4da", "#776e65"],
  "4": ["#ede0c8", "#776e65"],
  "8": ["#f2b179", "#ffffff"],
  "16": ["#f59563", "#ffffff"],
  "32": ["#f67c5f", "#ffffff"],
  "64": ["#f65e3b", "#ffffff"],
  "128": ["#edcf72", "#ffffff"],
  "256": ["#edcc61", "#ffffff"],
  "512": ["#edc850", "#ffffff"],
};

export function Scene2048() {
  const tone = palette(["#faf8ef", "#ece0ce"], "rgba(119,110,101,0.10)", "#bbada0", "#f65e3b", "#776e65");
  const board = { x: 140, y: 6, size: 167 };
  const grid = [
    ["2", "4", "8", "16"],
    ["32", "64", "128", "256"],
    ["", "", "512", "4"],
    ["", "", "", "2"],
  ];
  const at = (index: number) => board.x + 3 + index * 41;

  return (
    <SceneStage palette={tone} id="s2048" texture="none">
      <Board x={board.x} y={board.y} width={board.size} height={board.size} fill="#bbada0" radius={10} />
      {grid.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const [fill, textFill] = TILE_COLORS[value] ?? ["#cdc1b4", "#cdc1b4"];
          const merged = value === "512";
          return (
            <g key={`${rowIndex}-${colIndex}`}>
              {merged ? (
                <rect x={at(colIndex) - 3} y={board.y + 3 + rowIndex * 41 - 3} width={44} height={44} rx={7} fill="#f65e3b" opacity="0.35" />
              ) : null}
              <Cell
                x={at(colIndex)}
                y={board.y + 3 + rowIndex * 41}
                size={38}
                radius={5}
                fill={fill}
                label={value || undefined}
                labelFill={textFill}
                labelSize={value.length > 2 ? 14 : 17}
              />
            </g>
          );
        }),
      )}
      <ScorePanel x={14} y={16} label="SCORE" value="12 480" palette={tone} width={108} />
      <ScorePanel x={14} y={58} label="BEST" value="20 116" palette={tone} width={108} />
      <g>
        <rect x={14} y={104} width={108} height={58} rx={10} fill="#ffffff" fillOpacity="0.72" stroke={tone.ink} strokeWidth="1.5" />
        <text x={68} y={124} textAnchor="middle" fill={tone.text} fontSize="10" fontWeight="900" letterSpacing="1.4">
          MERGE
        </text>
        <rect x={26} y={132} width={36} height={22} rx={5} fill="#edcc61" />
        <text x={44} y={148} textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">256</text>
        <text x={70} y={148} textAnchor="middle" fill={tone.text} fontSize="14" fontWeight="900">+</text>
        <rect x={78} y={132} width={36} height={22} rx={5} fill="#edc850" />
        <text x={96} y={148} textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">512</text>
      </g>
    </SceneStage>
  );
}

/* ----------------------------------------------------------------- snake */

export function SceneSnake() {
  const tone = palette(["#07200f", "#0e3b21"], "rgba(255,255,255,0.045)", "#4ade80", "#f87171", "#e6f7ec");
  const body: [number, number][] = [
    [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [7, 5], [7, 4], [8, 4], [9, 4], [10, 4],
  ];
  const head = body[body.length - 1];
  const cell = 20;

  return (
    <SceneStage palette={tone} id="ssnake" texture="grid">
      {body.slice(0, -1).map(([col, row], index) => (
        <rect
          key={`${col}-${row}`}
          x={col * cell + 2.5}
          y={row * cell + 2.5}
          width={cell - 5}
          height={cell - 5}
          rx={5}
          fill="#4ade80"
          opacity={0.45 + (index / body.length) * 0.5}
        />
      ))}
      <g>
        <rect x={head[0] * cell + 1} y={head[1] * cell + 1} width={cell - 2} height={cell - 2} rx={6} fill="#86efac" />
        <circle cx={head[0] * cell + 14} cy={head[1] * cell + 7} r="2.4" fill="#07200f" />
        <circle cx={head[0] * cell + 14} cy={head[1] * cell + 14} r="2.4" fill="#07200f" />
      </g>
      <g>
        <circle cx={13 * cell + 10} cy={2 * cell + 10} r="10" fill="#f87171" opacity="0.25" />
        <circle cx={13 * cell + 10} cy={2 * cell + 10} r="6.5" fill="#ef4444" />
        <path d={`M${13 * cell + 10} ${2 * cell + 4} q3 -4 6 -3`} stroke="#4ade80" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <ScorePanel x={12} y={12} label="SCORE" value="184" palette={tone} width={86} />
      <ScorePanel x={222} y={134} label="LENGTH" value="10" palette={tone} width={86} align="right" />
    </SceneStage>
  );
}

/* --------------------------------------------------------- tic tac toe */

export function SceneTicTacToe() {
  const tone = palette(["#fff5f5", "#ffe4e6"], "rgba(190,18,60,0.10)", "#0f172a", "#e11d48", "#4c0519");
  const origin = { x: 96, y: 20 };
  const size = 44;
  const mark = (col: number, row: number) => ({ cx: origin.x + col * size + size / 2, cy: origin.y + row * size + size / 2 });

  return (
    <SceneStage palette={tone} id="sttt" texture="dots">
      <Board x={origin.x - 6} y={origin.y - 6} width={size * 3 + 12} height={size * 3 + 12} fill="#ffffff" stroke="rgba(190,18,60,0.16)" radius={12} />
      <GridLines x={origin.x} y={origin.y} width={size * 3} height={size * 3} cols={3} rows={3} stroke="rgba(190,18,60,0.28)" strokeWidth={2} />
      {([[0, 0], [1, 1], [2, 2]] as [number, number][]).map(([col, row]) => {
        const { cx, cy } = mark(col, row);
        return (
          <g key={`x${col}${row}`} stroke="#e11d48" strokeWidth="5" strokeLinecap="round">
            <line x1={cx - 12} y1={cy - 12} x2={cx + 12} y2={cy + 12} />
            <line x1={cx + 12} y1={cy - 12} x2={cx - 12} y2={cy + 12} />
          </g>
        );
      })}
      {([[1, 0], [0, 1]] as [number, number][]).map(([col, row]) => {
        const { cx, cy } = mark(col, row);
        return <circle key={`o${col}${row}`} cx={cx} cy={cy} r="14" fill="none" stroke="#0ea5e9" strokeWidth="5" />;
      })}
      <line
        x1={origin.x + 10}
        y1={origin.y + 10}
        x2={origin.x + size * 3 - 10}
        y2={origin.y + size * 3 - 10}
        stroke="#e11d48"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <Chip x={12} y={78} width={72} label="X WINS" fill="#e11d48" textFill="#ffffff" />
      <ScorePanel x={244} y={72} label="ROUND" value="3 / 5" palette={tone} width={64} align="right" />
    </SceneStage>
  );
}

/* -------------------------------------------------------- memory cards */

export function SceneMemoryCards() {
  const tone = palette(["#1e1b4b", "#3b2f8f"], "rgba(255,255,255,0.05)", "#c4b5fd", "#a78bfa", "#ede9fe");
  const cards = [
    { x: 22, symbol: "★", matched: true },
    { x: 76, symbol: "★", matched: true },
    { x: 130, back: true },
    { x: 184, symbol: "◆", matched: false },
    { x: 238, back: true },
  ];

  return (
    <SceneStage palette={tone} id="smem" texture="dots">
      {cards.map((card, index) => (
        <PlayCard
          key={card.x}
          x={card.x}
          y={index % 2 === 0 ? 34 : 44}
          width={48}
          height={66}
          face="#f5f3ff"
          back={card.back ? "#4c1d95" : undefined}
          symbol={card.symbol}
          symbolFill={card.matched ? "#22c55e" : "#7c3aed"}
          stroke="rgba(255,255,255,0.22)"
          matched={card.matched}
        />
      ))}
      <ScorePanel x={22} y={126} label="PAIRS" value="3 / 8" palette={tone} width={92} />
      <ScorePanel x={200} y={126} label="MOVES" value="14" palette={tone} width={86} align="right" />
    </SceneStage>
  );
}

/* ----------------------------------------------------------- word match */

export function SceneWordMatch() {
  const tone = palette(["#083344", "#0e7490"], "rgba(255,255,255,0.06)", "#67e8f9", "#22d3ee", "#ecfeff");
  const letters = ["A", "T", "L", "A", "S"];
  const scrambled = ["S", "L", "A", "T", "A"];

  return (
    <SceneStage palette={tone} id="sword" texture="scan">
      {letters.map((letter, index) => (
        <Cell
          key={`top-${index}`}
          x={62 + index * 40}
          y={24}
          size={34}
          radius={7}
          fill="#22d3ee"
          label={letter}
          labelFill="#083344"
          labelSize={19}
        />
      ))}
      {scrambled.map((letter, index) => (
        <Cell
          key={`bot-${index}`}
          x={62 + index * 40}
          y={104}
          size={34}
          radius={7}
          fill="rgba(255,255,255,0.10)"
          stroke="rgba(255,255,255,0.28)"
          label={letter}
          labelFill="#ecfeff"
          labelSize={19}
        />
      ))}
      <path d="M79 58 C79 82 219 80 219 104" fill="none" stroke="#facc15" strokeWidth="2.5" strokeDasharray="5 4" />
      <circle cx="79" cy="58" r="4" fill="#facc15" />
      <circle cx="219" cy="104" r="4" fill="#facc15" />
      <ScorePanel x={12} y={132} label="FOUND" value="6 / 9" palette={tone} width={86} />
      <ScorePanel x={222} y={132} label="STREAK" value="x4" palette={tone} width={86} align="right" />
    </SceneStage>
  );
}

/* ---------------------------------------------------------- sudoku mini */

export function SceneSudokuMini() {
  const tone = palette(["#f8fafc", "#e2e8f0"], "rgba(30,41,59,0.08)", "#334155", "#4f46e5", "#1e293b");
  const origin = { x: 100, y: 15 };
  const cell = 25;
  const givens: Record<string, string> = {
    "0-0": "5", "2-0": "3", "4-0": "9",
    "1-1": "7", "5-1": "4",
    "0-2": "1", "3-2": "6",
    "2-3": "8", "5-3": "2",
    "1-4": "4", "4-4": "5",
    "0-5": "9", "3-5": "7", "5-5": "1",
  };

  return (
    <SceneStage palette={tone} id="ssud" texture="none">
      <Board x={origin.x - 5} y={origin.y - 5} width={cell * 6 + 10} height={cell * 6 + 10} fill="#ffffff" stroke="#94a3b8" radius={8} />
      <rect x={origin.x + cell * 3} y={origin.y + cell * 2} width={cell} height={cell} fill="#4f46e5" fillOpacity="0.12" />
      <rect x={origin.x + cell * 3} y={origin.y} width={cell} height={cell * 6} fill="#4f46e5" fillOpacity="0.05" />
      <GridLines x={origin.x} y={origin.y} width={cell * 6} height={cell * 6} cols={6} rows={6} stroke="rgba(30,41,59,0.18)" />
      <g stroke="#334155" strokeWidth="2.2" strokeLinecap="round">
        <line x1={origin.x + cell * 3} y1={origin.y} x2={origin.x + cell * 3} y2={origin.y + cell * 6} />
        <line x1={origin.x} y1={origin.y + cell * 2} x2={origin.x + cell * 6} y2={origin.y + cell * 2} />
        <line x1={origin.x} y1={origin.y + cell * 4} x2={origin.x + cell * 6} y2={origin.y + cell * 4} />
      </g>
      {Object.entries(givens).map(([key, value]) => {
        const [col, row] = key.split("-").map(Number);
        return (
          <text
            key={key}
            x={origin.x + col * cell + cell / 2}
            y={origin.y + row * cell + cell / 2 + 5}
            textAnchor="middle"
            fill="#1e293b"
            fontSize="14"
            fontWeight="900"
          >
            {value}
          </text>
        );
      })}
      <rect x={origin.x + cell * 3 + 2} y={origin.y + cell * 2 + 2} width={cell - 4} height={cell - 4} rx={4} fill="#4f46e5" />
      <text x={origin.x + cell * 3 + cell / 2} y={origin.y + cell * 2 + cell / 2 + 5} textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">
        6
      </text>
      <ScorePanel x={14} y={26} label="DIFFICULTY" value="Medium" palette={tone} width={78} />
      <ScorePanel x={14} y={70} label="EMPTY" value="22" palette={tone} width={78} />
      <Chip x={14} y={118} width={78} label="HINT" fill="#4f46e5" textFill="#ffffff" fontSize={12} />
    </SceneStage>
  );
}

/* ---------------------------------------------------------- color switch */

const SWITCH_COLORS = ["#f87171", "#facc15", "#38bdf8", "#a78bfa"];

function ColorRing({ cx, cy, radius, width, rotate }: { cx: number; cy: number; radius: number; width: number; rotate: number }) {
  const circumference = 2 * Math.PI * radius;
  const quarter = circumference / 4;
  return (
    <g transform={`rotate(${rotate} ${cx} ${cy})`}>
      {SWITCH_COLORS.map((color, index) => (
        <circle
          key={color}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeDasharray={`${quarter - 3} ${circumference - quarter + 3}`}
          strokeDashoffset={-index * quarter}
        />
      ))}
    </g>
  );
}

export function SceneColorSwitch() {
  const tone = palette(["#111827", "#4c1d95"], "rgba(255,255,255,0.05)", "#a78bfa", "#f87171", "#f5f3ff");
  return (
    <SceneStage palette={tone} id="sswitch" texture="scan">
      <ColorRing cx={196} cy={72} radius={44} width={13} rotate={18} />
      <ColorRing cx={196} cy={72} radius={24} width={10} rotate={-32} />
      <g>
        <path d="M196 168 L196 122" stroke="#f87171" strokeWidth="3" strokeDasharray="5 5" opacity="0.55" />
        <Player x={196} y={150} size={22} fill="#f87171" glow="#f87171" />
      </g>
      <g transform="translate(74 60)">
        <path d="M0 -16 L4.6 -5 L16 -4 L7 3 L10 15 L0 8 L-10 15 L-7 3 L-16 -4 L-4.6 -5 Z" fill="#facc15" />
      </g>
      <ScorePanel x={14} y={124} label="SCORE" value="27" palette={tone} width={82} />
      <g>
        <rect x={244} y={140} width={64} height={26} rx={13} fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        {SWITCH_COLORS.map((color, index) => (
          <circle key={color} cx={258 + index * 12} cy={153} r="4.5" fill={color} opacity={index === 0 ? 1 : 0.4} />
        ))}
      </g>
    </SceneStage>
  );
}

/* ------------------------------------------------------ color brain rush */

export function SceneColorBrainRush() {
  const tone = palette(["#0f172a", "#155e75"], "rgba(255,255,255,0.05)", "#22d3ee", "#fb923c", "#ecfeff");
  const options: [string, string][] = [["#ef4444", "RED"], ["#fb923c", "ORANGE"], ["#38bdf8", "BLUE"]];

  return (
    <SceneStage palette={tone} id="sbrain" texture="dots">
      <rect x={64} y={20} width={192} height={52} rx={12} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      <text x={160} y={54} textAnchor="middle" fill="#fb923c" fontSize="28" fontWeight="900" letterSpacing="2">
        BLUE
      </text>
      {options.map(([color, label], index) => (
        <g key={label}>
          <rect
            x={26 + index * 92}
            y={92}
            width={80}
            height={38}
            rx={10}
            fill={color}
            fillOpacity={index === 1 ? 1 : 0.28}
            stroke={index === 1 ? "#ffffff" : "rgba(255,255,255,0.25)"}
            strokeWidth={index === 1 ? 2.5 : 1.5}
          />
          <text x={66 + index * 92} y={116} textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900">
            {label}
          </text>
        </g>
      ))}
      <rect x={26} y={146} width={268} height={8} rx={4} fill="rgba(255,255,255,0.14)" />
      <rect x={26} y={146} width={168} height={8} rx={4} fill="#22d3ee" />
      <text x={294} y={140} textAnchor="end" fill="#ecfeff" fontSize="14" fontWeight="900">
        x9
      </text>
    </SceneStage>
  );
}

/* -------------------------------------------------------- reaction timer */

export function SceneReactionTimer() {
  const tone = palette(["#052e2b", "#064e3b"], "rgba(255,255,255,0.05)", "#34d399", "#fbbf24", "#ecfdf5");
  const attempts = [34, 52, 26, 44, 20];

  return (
    <SceneStage palette={tone} id="sreact" texture="scan">
      <circle cx="80" cy="90" r="62" fill="#fbbf24" opacity="0.12" />
      <Gauge x={80} y={90} radius={50} progress={0.34} track="rgba(255,255,255,0.12)" fill="#fbbf24" width={9} />
      <circle cx="80" cy="90" r="38" fill="#fbbf24" opacity="0.9" />
      <text x="80" y="97" textAnchor="middle" fill="#052e2b" fontSize="20" fontWeight="900" letterSpacing="1.5">
        WAIT
      </text>
      <g>
        <text x={168} y={44} fill="#ecfdf5" fillOpacity="0.7" fontSize="10" fontWeight="900" letterSpacing="1.6">
          LAST RESULT
        </text>
        <text x={168} y={78} fill="#34d399" fontSize="34" fontWeight="900" letterSpacing="-1">
          218
        </text>
        <text x={244} y={78} fill="#ecfdf5" fillOpacity="0.75" fontSize="15" fontWeight="900">
          ms
        </text>
      </g>
      <g>
        {attempts.map((height, index) => (
          <rect
            key={index}
            x={168 + index * 27}
            y={140 - height}
            width={18}
            height={height}
            rx={4}
            fill={index === attempts.length - 1 ? "#34d399" : "rgba(52,211,153,0.35)"}
          />
        ))}
        <line x1={166} y1={142} x2={302} y2={142} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <text x={168} y={160} fill="#ecfdf5" fillOpacity="0.7" fontSize="11" fontWeight="900">
          BEST 194 ms
        </text>
      </g>
    </SceneStage>
  );
}

/* --------------------------------------------------------------- tetris */

export function SceneTetris() {
  const tone = palette(["#160034", "#3b0764"], "rgba(255,255,255,0.05)", "#a855f7", "#22d3ee", "#f5f3ff");
  const well = { x: 106, y: 6, cols: 5, rows: 9, cell: 19 };
  const stack: [number, number, string][] = [
    [0, 8, "#f97316"], [1, 8, "#f97316"], [2, 8, "#22c55e"], [3, 8, "#22c55e"], [4, 8, "#eab308"],
    [0, 7, "#f97316"], [2, 7, "#22c55e"], [4, 7, "#eab308"],
    [0, 6, "#ef4444"], [4, 6, "#eab308"],
  ];
  const cellX = (col: number) => well.x + col * well.cell;
  const cellY = (row: number) => well.y + row * well.cell;

  return (
    <SceneStage palette={tone} id="stetris" texture="none">
      <Board x={well.x - 4} y={well.y - 4} width={well.cols * well.cell + 8} height={well.rows * well.cell + 8} fill="rgba(0,0,0,0.42)" stroke="rgba(168,85,247,0.5)" radius={8} />
      <GridLines x={well.x} y={well.y} width={well.cols * well.cell} height={well.rows * well.cell} cols={well.cols} rows={well.rows} stroke="rgba(255,255,255,0.07)" />
      {stack.map(([col, row, fill]) => (
        <Cell key={`${col}-${row}`} x={cellX(col) + 1} y={cellY(row) + 1} size={well.cell - 2} radius={3} fill={fill} />
      ))}
      {[0, 1, 2, 3].map((offset) => (
        <Cell key={`piece-${offset}`} x={cellX(1) + 1} y={cellY(offset) + 1} size={well.cell - 2} radius={3} fill="#22d3ee" />
      ))}
      {[5, 6, 7].map((row) => (
        <rect key={`ghost-${row}`} x={cellX(1) + 1} y={cellY(row) + 1} width={well.cell - 2} height={well.cell - 2} rx={3} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      ))}
      <ScorePanel x={12} y={16} label="SCORE" value="8 420" palette={tone} width={84} />
      <ScorePanel x={12} y={58} label="LINES" value="26" palette={tone} width={84} />
      <g>
        <rect x={224} y={16} width={82} height={70} rx={10} fill="rgba(0,0,0,0.35)" stroke="rgba(168,85,247,0.45)" strokeWidth="1.5" />
        <text x={265} y={34} textAnchor="middle" fill="#f5f3ff" fillOpacity="0.72" fontSize="10" fontWeight="900" letterSpacing="1.4">
          NEXT
        </text>
        {([[0, 0], [1, 0], [2, 0], [1, 1]] as [number, number][]).map(([col, row]) => (
          <Cell key={`next-${col}-${row}`} x={242 + col * 16} y={46 + row * 16} size={14} radius={3} fill="#a855f7" />
        ))}
      </g>
      <text x={265} y={130} textAnchor="middle" fill="#f5f3ff" fillOpacity="0.6" fontSize="11" fontWeight="900" letterSpacing="1.2">
        LEVEL 4
      </text>
    </SceneStage>
  );
}

/* -------------------------------------------------------------- hextris */

function hexPath(cx: number, cy: number, radius: number) {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");
}

export function SceneHextris() {
  const tone = palette(["#0b1120", "#1e293b"], "rgba(255,255,255,0.05)", "#38bdf8", "#fb923c", "#e2e8f0");
  const colors = ["#fb923c", "#38bdf8", "#22c55e", "#f43f5e", "#a855f7", "#eab308"];

  return (
    <SceneStage palette={tone} id="shex" texture="dots">
      <polygon points={hexPath(160, 90, 62)} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
      {colors.map((color, index) => {
        const angle = (Math.PI / 3) * index - Math.PI / 2 + Math.PI / 6;
        const inner = 40;
        const outer = 56;
        const spread = Math.PI / 3.4;
        const points = [
          `${160 + inner * Math.cos(angle - spread / 2)},${90 + inner * Math.sin(angle - spread / 2)}`,
          `${160 + outer * Math.cos(angle - spread / 2)},${90 + outer * Math.sin(angle - spread / 2)}`,
          `${160 + outer * Math.cos(angle + spread / 2)},${90 + outer * Math.sin(angle + spread / 2)}`,
          `${160 + inner * Math.cos(angle + spread / 2)},${90 + inner * Math.sin(angle + spread / 2)}`,
        ].join(" ");
        return <polygon key={color} points={points} fill={color} opacity={index < 4 ? 0.95 : 0.35} />;
      })}
      <polygon points={hexPath(160, 90, 30)} fill="#0b1120" stroke="#38bdf8" strokeWidth="2.5" />
      <polygon points={hexPath(160, 90, 14)} fill="#38bdf8" />
      {([[288, 44, "#fb923c"], [30, 118, "#22c55e"], [160, 172, "#f43f5e"]] as [number, number, string][]).map(([x, y, color]) => (
        <rect key={color} x={x - 11} y={y - 8} width={22} height={16} rx={3} fill={color} />
      ))}
      <ScorePanel x={12} y={12} label="SCORE" value="4 960" palette={tone} width={82} />
      <ScorePanel x={226} y={134} label="COMBO" value="x3" palette={tone} width={82} align="right" />
    </SceneStage>
  );
}

/* ---------------------------------------------------------- minesweeper */

const MINE_NUMBER_COLORS: Record<string, string> = { "1": "#2563eb", "2": "#15803d", "3": "#dc2626", "4": "#7c3aed" };

export function SceneMinesweeper() {
  const tone = palette(["#eef2f7", "#cbd5e1"], "rgba(30,41,59,0.06)", "#475569", "#dc2626", "#1e293b");
  const cell = 29;
  const origin = { x: 15, y: 34 };
  const revealed: Record<string, string> = {
    "1-0": "1", "2-0": "2", "3-0": "", "4-0": "1",
    "1-1": "1", "2-1": "3", "3-1": "1", "4-1": "",
    "2-2": "2", "3-2": "1", "5-2": "1", "6-2": "2",
    "0-3": "1", "1-3": "1", "2-3": "1", "6-3": "1",
  };
  const flags = ["7-1", "9-3"];
  const mine = "8-2";

  return (
    <SceneStage palette={tone} id="smine" texture="none">
      {Array.from({ length: 10 }, (_, col) =>
        Array.from({ length: 4 }, (_, row) => {
          const key = `${col}-${row}`;
          const number = revealed[key];
          const isFlag = flags.includes(key);
          const isMine = key === mine;
          const x = origin.x + col * cell;
          const y = origin.y + row * cell;
          if (isMine) {
            return (
              <g key={key}>
                <rect x={x} y={y} width={cell - 2} height={cell - 2} rx={3} fill="#fecaca" stroke="#dc2626" strokeWidth="1.5" />
                <circle cx={x + 13.5} cy={y + 13.5} r="6" fill="#7f1d1d" />
                <g stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round">
                  <line x1={x + 13.5} y1={y + 4} x2={x + 13.5} y2={y + 23} />
                  <line x1={x + 4} y1={y + 13.5} x2={x + 23} y2={y + 13.5} />
                </g>
              </g>
            );
          }
          if (isFlag) {
            return (
              <g key={key}>
                <rect x={x} y={y} width={cell - 2} height={cell - 2} rx={3} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                <path d={`M${x + 10} ${y + 6} L${x + 20} ${y + 11} L${x + 10} ${y + 15} Z`} fill="#dc2626" />
                <line x1={x + 10} y1={y + 6} x2={x + 10} y2={y + 22} stroke="#334155" strokeWidth="2" strokeLinecap="round" />
              </g>
            );
          }
          if (number !== undefined) {
            return (
              <Cell
                key={key}
                x={x}
                y={y}
                size={cell - 2}
                radius={3}
                fill="#e2e8f0"
                label={number || undefined}
                labelFill={MINE_NUMBER_COLORS[number] ?? "#334155"}
                labelSize={15}
              />
            );
          }
          return (
            <g key={key}>
              <rect x={x} y={y} width={cell - 2} height={cell - 2} rx={3} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
              <path d={`M${x + 2} ${y + cell - 4} L${x + 2} ${y + 2} L${x + cell - 4} ${y + 2}`} fill="none" stroke="#ffffff" strokeWidth="2" />
            </g>
          );
        }),
      )}
      <ScorePanel x={15} y={4} label="MINES LEFT" value="08" palette={tone} width={104} />
      <ScorePanel x={206} y={4} label="TIME" value="047" palette={tone} width={98} align="right" />
    </SceneStage>
  );
}

/* --------------------------------------------------------- connect four */

export function SceneConnectFour() {
  const tone = palette(["#0b1e5b", "#1e3a8a"], "rgba(255,255,255,0.06)", "#60a5fa", "#f97316", "#eff6ff");
  const origin = { x: 88, y: 16 };
  const step = 21;
  const discs: Record<string, "red" | "yellow"> = {
    "0-5": "red", "1-5": "yellow", "2-5": "red", "3-5": "yellow", "4-5": "red",
    "1-4": "red", "2-4": "yellow", "3-4": "red",
    "2-3": "yellow", "3-3": "red",
    "3-2": "red",
  };
  const winning = ["0-5", "1-4", "2-3", "3-2"];

  return (
    <SceneStage palette={tone} id="sc4" texture="scan">
      <Board x={origin.x - 8} y={origin.y - 8} width={step * 7 + 16} height={step * 6 + 16} fill="#1d4ed8" stroke="#3b82f6" radius={12} />
      {Array.from({ length: 7 }, (_, col) =>
        Array.from({ length: 6 }, (_, row) => {
          const key = `${col}-${row}`;
          const disc = discs[key];
          const cx = origin.x + col * step + step / 2;
          const cy = origin.y + row * step + step / 2;
          return (
            <g key={key}>
              <circle cx={cx} cy={cy} r="8.5" fill={disc === "red" ? "#ef4444" : disc === "yellow" ? "#facc15" : "#0b1e5b"} />
              {winning.includes(key) ? <circle cx={cx} cy={cy} r="9.5" fill="none" stroke="#ffffff" strokeWidth="2" /> : null}
            </g>
          );
        }),
      )}
      <circle cx={origin.x + 4 * step + step / 2} cy={6} r="8.5" fill="#facc15" opacity="0.85" />
      <ScorePanel x={12} y={40} label="TURN" value="Yellow" palette={tone} width={66} />
      <ScorePanel x={12} y={92} label="DEPTH" value="Hard" palette={tone} width={66} />
    </SceneStage>
  );
}

/* ----------------------------------------------------------- chess mini */

function ChessPiece({ x, y, kind, fill, stroke }: { x: number; y: number; kind: "pawn" | "rook" | "king" | "knight"; fill: string; stroke: string }) {
  const common = { fill, stroke, strokeWidth: 1.2 };
  if (kind === "pawn") {
    return (
      <g {...common}>
        <circle cx={x} cy={y - 4} r="3.4" />
        <path d={`M${x - 4.6} ${y + 6} q1.4 -5 4.6 -6 q3.2 1 4.6 6 Z`} />
      </g>
    );
  }
  if (kind === "rook") {
    return (
      <g {...common}>
        <path d={`M${x - 5} ${y - 7} h10 v3 h-2.2 v2 h-5.6 v-2 H${x - 5} Z`} />
        <path d={`M${x - 4} ${y - 2} h8 l1.4 8 h-10.8 Z`} />
      </g>
    );
  }
  if (kind === "knight") {
    return (
      <g {...common}>
        <path d={`M${x - 4.5} ${y + 6} q0 -8 4 -10 l-1 -3 l3.5 1.5 q3.5 2 3 11 Z`} />
      </g>
    );
  }
  return (
    <g {...common}>
      <path d={`M${x - 1.3} ${y - 9} h2.6 v2 h2 v2.4 h-2 v2 h-2.6 v-2 h-2 V${y - 7} h2 Z`} />
      <path d={`M${x - 5} ${y + 6} q1 -7 5 -8 q4 1 5 8 Z`} />
    </g>
  );
}

export function SceneChessMini() {
  const tone = palette(["#f4efe4", "#d9cbb2"], "rgba(60,45,30,0.08)", "#3f2d1e", "#0f766e", "#3f2d1e");
  const origin = { x: 92, y: 16 };
  const cell = 18;

  return (
    <SceneStage palette={tone} id="schess" texture="none">
      <Board x={origin.x - 5} y={origin.y - 5} width={cell * 8 + 10} height={cell * 8 + 10} fill="#8a6a44" radius={6} />
      {Array.from({ length: 8 }, (_, col) =>
        Array.from({ length: 8 }, (_, row) => (
          <rect
            key={`${col}-${row}`}
            x={origin.x + col * cell}
            y={origin.y + row * cell}
            width={cell}
            height={cell}
            fill={(col + row) % 2 === 0 ? "#f0d9b5" : "#b58863"}
          />
        )),
      )}
      <rect x={origin.x + 4 * cell} y={origin.y + 6 * cell} width={cell} height={cell} fill="#0f766e" fillOpacity="0.42" />
      <rect x={origin.x + 4 * cell} y={origin.y + 4 * cell} width={cell} height={cell} fill="#0f766e" fillOpacity="0.42" />
      <circle cx={origin.x + 4 * cell + cell / 2} cy={origin.y + 4 * cell + cell / 2} r="3.4" fill="#0f766e" />
      <ChessPiece x={origin.x + 4 * cell + cell / 2} y={origin.y + 6 * cell + cell / 2} kind="pawn" fill="#fdfaf5" stroke="#5b4636" />
      <ChessPiece x={origin.x + 0 * cell + cell / 2} y={origin.y + 7 * cell + cell / 2} kind="rook" fill="#fdfaf5" stroke="#5b4636" />
      <ChessPiece x={origin.x + 6 * cell + cell / 2} y={origin.y + 7 * cell + cell / 2} kind="king" fill="#fdfaf5" stroke="#5b4636" />
      <ChessPiece x={origin.x + 3 * cell + cell / 2} y={origin.y + 1 * cell + cell / 2} kind="knight" fill="#2b2118" stroke="#0c0a08" />
      <ChessPiece x={origin.x + 6 * cell + cell / 2} y={origin.y + 0 * cell + cell / 2} kind="king" fill="#2b2118" stroke="#0c0a08" />
      <ChessPiece x={origin.x + 1 * cell + cell / 2} y={origin.y + 2 * cell + cell / 2} kind="pawn" fill="#2b2118" stroke="#0c0a08" />
      <ScorePanel x={12} y={26} label="ENGINE" value="Depth 4" palette={tone} width={72} />
      <ScorePanel x={12} y={72} label="EVAL" value="+1.4" palette={tone} width={72} />
      <Chip x={12} y={122} width={72} label="e2 → e4" fill="#0f766e" textFill="#ffffff" fontSize={12} />
    </SceneStage>
  );
}

/* ----------------------------------------------------------- floppy bird */

export function SceneFloppyBird() {
  const tone = palette(["#7dd3fc", "#38bdf8"], "rgba(255,255,255,0.14)", "#22c55e", "#facc15", "#0c4a6e");

  return (
    <SceneStage palette={tone} id="sfloppy" texture="none">
      <circle cx="52" cy="34" r="18" fill="#ffffff" opacity="0.55" />
      <circle cx="70" cy="34" r="13" fill="#ffffff" opacity="0.55" />
      <circle cx="238" cy="22" r="14" fill="#ffffff" opacity="0.4" />
      {([[176, 62], [268, 96]] as [number, number][]).map(([x, gapY]) => (
        <g key={x}>
          <rect x={x} y={0} width={44} height={gapY - 26} fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />
          <rect x={x - 5} y={gapY - 40} width={54} height={16} rx={3} fill="#4ade80" stroke="#15803d" strokeWidth="2.5" />
          <rect x={x} y={gapY + 26} width={44} height={150} fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />
          <rect x={x - 5} y={gapY + 24} width={54} height={16} rx={3} fill="#4ade80" stroke="#15803d" strokeWidth="2.5" />
        </g>
      ))}
      <Ground y={150} fill="#ca8a04" detail="#fde047" />
      <Trail x={92} y={72} count={3} spacing={13} fill="#ffffff" />
      <g transform="rotate(-14 112 72)">
        <ellipse cx="112" cy="72" rx="16" ry="13" fill="#facc15" stroke="#a16207" strokeWidth="2" />
        <path d="M100 72 q10 -9 18 0 q-9 8 -18 0 Z" fill="#fde047" stroke="#a16207" strokeWidth="1.6" />
        <circle cx="119" cy="67" r="3.6" fill="#ffffff" />
        <circle cx="120" cy="67" r="1.9" fill="#0f172a" />
        <path d="M126 73 l10 3 l-10 4 Z" fill="#f97316" />
      </g>
      <text x="160" y="40" textAnchor="middle" fill="#ffffff" fontSize="34" fontWeight="900" stroke="#0c4a6e" strokeWidth="2" paintOrder="stroke">
        07
      </text>
    </SceneStage>
  );
}

/* ----------------------------------------------------------- math sprint */

export function SceneMathSprint() {
  const tone = palette(["#2e1065", "#5b21b6"], "rgba(255,255,255,0.05)", "#c4b5fd", "#facc15", "#f5f3ff");
  const options = ["54", "56", "63"];

  return (
    <SceneStage palette={tone} id="smath" texture="dots">
      <rect x={20} y={22} width={196} height={54} rx={12} fill="rgba(0,0,0,0.28)" stroke="rgba(196,181,253,0.4)" strokeWidth="1.5" />
      <text x={118} y={60} textAnchor="middle" fill="#f5f3ff" fontSize="30" fontWeight="900" letterSpacing="1">
        7 × 8 = ?
      </text>
      {options.map((option, index) => (
        <g key={option}>
          <rect
            x={20 + index * 68}
            y={94}
            width={58}
            height={38}
            rx={10}
            fill={index === 1 ? "#22c55e" : "rgba(255,255,255,0.10)"}
            stroke={index === 1 ? "#86efac" : "rgba(255,255,255,0.22)"}
            strokeWidth={index === 1 ? 2.5 : 1.5}
          />
          <text x={49 + index * 68} y={119} textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="900">
            {option}
          </text>
        </g>
      ))}
      <Gauge x={264} y={50} radius={30} progress={0.62} track="rgba(255,255,255,0.14)" fill="#facc15" width={8} label="09" labelFill="#facc15" labelSize={20} />
      <ScorePanel x={222} y={100} label="STREAK" value="x12" palette={tone} width={84} align="right" />
      <g>
        {[0, 1, 2].map((index) => (
          <path
            key={index}
            d={`M${24 + index * 16} 152 l6 -12 l6 12 l-6 -4 Z`}
            fill="#facc15"
            opacity={1 - index * 0.28}
          />
        ))}
        <text x={82} y={154} fill="#f5f3ff" fillOpacity="0.75" fontSize="12" fontWeight="900">
          ON FIRE
        </text>
      </g>
    </SceneStage>
  );
}

/* ----------------------------------------------------- neon core defense */

export function SceneNeonCoreDefense() {
  const tone = palette(["#020617", "#0b1a33"], "rgba(56,189,248,0.07)", "#38bdf8", "#f472b6", "#e0f2fe");

  return (
    <SceneStage palette={tone} id="sneon" texture="grid">
      <g stroke="rgba(56,189,248,0.16)" strokeWidth="1.5" strokeDasharray="4 6">
        <line x1="160" y1="90" x2="316" y2="24" />
        <line x1="160" y1="90" x2="316" y2="150" />
        <line x1="160" y1="90" x2="30" y2="20" />
      </g>
      <circle cx="160" cy="90" r="70" fill="none" stroke="rgba(56,189,248,0.12)" strokeWidth="1.5" />
      <circle cx="160" cy="90" r="52" fill="#38bdf8" opacity="0.08" />
      <Gauge x={160} y={90} radius={40} progress={0.74} track="rgba(255,255,255,0.10)" fill="#22d3ee" width={7} />
      <polygon points="160,62 184,76 184,104 160,118 136,104 136,76" fill="#0b1a33" stroke="#38bdf8" strokeWidth="2.5" />
      <polygon points="160,74 174,82 174,98 160,106 146,98 146,82" fill="#22d3ee" opacity="0.85" />
      <circle cx="160" cy="90" r="6" fill="#e0f2fe" />
      <g>
        <rect x={196} y={116} width={26} height={13} rx={5} fill="#0ea5e9" transform="rotate(28 209 122)" />
        <circle cx="222" cy="130" r="4" fill="#e0f2fe" />
      </g>
      <Projectile x={228} y={54} angle={-24} fill="#22d3ee" />
      <Projectile x={198} y={70} angle={-24} fill="#22d3ee" />
      <Projectile x={104} y={52} angle={208} fill="#22d3ee" />
      <Enemy x={296} y={30} size={20} fill="#f472b6" />
      <Enemy x={268} y={44} size={15} fill="#fb7185" />
      <Enemy x={300} y={142} size={18} fill="#f472b6" />
      <Enemy x={36} y={26} size={16} fill="#fb7185" />
      <ScorePanel x={12} y={130} label="WAVE" value="14" palette={tone} width={82} />
      <g>
        <text x={226} y={168} fill="#e0f2fe" fillOpacity="0.7" fontSize="10" fontWeight="900" letterSpacing="1.4">
          CORE
        </text>
        <rect x={226} y={172} width={82} height={6} rx={3} fill="rgba(255,255,255,0.15)" />
        <rect x={226} y={172} width={61} height={6} rx={3} fill="#22d3ee" />
      </g>
    </SceneStage>
  );
}

/* ---------------------------------------------------------------- pacman */

export function ScenePacman() {
  const tone = palette(["#04040f", "#0a0a2a"], "rgba(59,130,246,0.06)", "#3b82f6", "#facc15", "#e0e7ff");

  return (
    <SceneStage palette={tone} id="spac" texture="none">
      <g fill="none" stroke="#2563eb" strokeWidth="4" strokeLinejoin="round">
        <rect x="16" y="16" width="86" height="42" rx="8" />
        <rect x="122" y="16" width="72" height="24" rx="8" />
        <rect x="214" y="16" width="90" height="42" rx="8" />
        <rect x="16" y="122" width="120" height="42" rx="8" />
        <rect x="184" y="122" width="120" height="42" rx="8" />
      </g>
      <g fill="#fde68a">
        {[36, 60, 84, 108, 132, 156, 180, 204, 228, 252, 276].map((x) => (
          <circle key={x} cx={x} cy={90} r="3.4" />
        ))}
      </g>
      <circle cx="288" cy="90" r="7" fill="#fde68a" />
      <path d="M132 90 L148.3 82.4 A18 18 0 1 1 148.3 97.6 Z" fill="#facc15" />
      <g>
        <path d="M196 100 v-14 a17 17 0 0 1 34 0 v14 l-6 -6 l-6 6 l-5 -6 l-6 6 l-5 -6 Z" fill="#ef4444" />
        <circle cx="207" cy="84" r="4.6" fill="#ffffff" />
        <circle cx="220" cy="84" r="4.6" fill="#ffffff" />
        <circle cx="208.6" cy="84" r="2.2" fill="#1e3a8a" />
        <circle cx="221.6" cy="84" r="2.2" fill="#1e3a8a" />
      </g>
      <ScorePanel x={16} y={70} label="SCORE" value="3 260" palette={tone} width={80} />
      <g>
        {[0, 1, 2].map((index) => (
          <path key={index} d={`M${252 + index * 18} 76 a8 8 0 1 0 7 12 L${252 + index * 18} 82 Z`} fill="#facc15" opacity={index === 2 ? 0.4 : 1} />
        ))}
      </g>
    </SceneStage>
  );
}

/* --------------------------------------------------------- endless runner */

export function SceneEndlessRunner() {
  const tone = palette(["#4a1503", "#9a3412"], "rgba(255,255,255,0.06)", "#fdba74", "#fbbf24", "#fff7ed");

  return (
    <SceneStage palette={tone} id="srun" texture="none">
      <circle cx="252" cy="52" r="30" fill="#fbbf24" opacity="0.85" />
      <g fill="#7c2d12" opacity="0.55">
        <path d="M0 120 L46 84 L86 120 Z" />
        <path d="M64 120 L118 76 L172 120 Z" />
        <path d="M150 120 L206 88 L262 120 Z" />
      </g>
      <Ground y={128} fill="#3f1206" detail="#b45309" />
      <g>
        <rect x={232} y={92} width={16} height={38} rx={4} fill="#166534" />
        <rect x={220} y={102} width={12} height={8} rx={4} fill="#166534" />
        <rect x={248} y={98} width={12} height={8} rx={4} fill="#166534" />
      </g>
      <rect x={148} y={104} width={26} height={10} rx={5} fill="#78350f" />
      <g>
        <Trail x={78} y={104} count={4} spacing={14} fill="#fed7aa" />
        <circle cx="104" cy="82" r="8.5" fill="#fff7ed" />
        <rect x={98} y={91} width={13} height={20} rx={5} fill="#fff7ed" />
        <path d="M104 111 l-9 15" stroke="#fff7ed" strokeWidth="6" strokeLinecap="round" />
        <path d="M108 111 l11 11" stroke="#fff7ed" strokeWidth="6" strokeLinecap="round" />
        <path d="M99 95 l-13 8" stroke="#fff7ed" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M110 94 l12 -6" stroke="#fff7ed" strokeWidth="5.5" strokeLinecap="round" />
      </g>
      <ScorePanel x={12} y={12} label="DISTANCE" value="1 240 m" palette={tone} width={106} />
      <ScorePanel x={214} y={144} label="SPEED" value="x2.4" palette={tone} width={94} align="right" />
    </SceneStage>
  );
}

/* ---------------------------------------------------------- typing speed */

export function SceneTypingSpeed() {
  const tone = palette(["#082f49", "#0c4a6e"], "rgba(255,255,255,0.05)", "#38bdf8", "#4ade80", "#e0f2fe");
  const words: [string, number, "done" | "current" | "todo"][] = [
    ["ship", 20, "done"],
    ["clear", 74, "done"],
    ["work", 140, "current"],
    ["daily", 200, "todo"],
  ];

  return (
    <SceneStage palette={tone} id="stype" texture="scan">
      <rect x={14} y={34} width={292} height={54} rx={12} fill="rgba(0,0,0,0.28)" stroke="rgba(56,189,248,0.28)" strokeWidth="1.5" />
      {words.map(([word, x, state]) => (
        <g key={word}>
          {state === "done" ? <rect x={x - 6} y={48} width={word.length * 11 + 12} height={26} rx={6} fill="#4ade80" fillOpacity="0.22" /> : null}
          <text
            x={x}
            y={67}
            fill={state === "done" ? "#4ade80" : state === "current" ? "#e0f2fe" : "rgba(224,242,254,0.4)"}
            fontSize="19"
            fontWeight="900"
            letterSpacing="0.5"
          >
            {word}
          </text>
        </g>
      ))}
      <rect x={136} y={46} width={2.6} height={30} rx={1.3} fill="#38bdf8" />
      <g>
        <rect x={14} y={104} width={138} height={58} rx={12} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
        <text x={30} y={124} fill="#e0f2fe" fillOpacity="0.7" fontSize="10" fontWeight="900" letterSpacing="1.4">
          WORDS PER MINUTE
        </text>
        <text x={30} y={150} fill="#38bdf8" fontSize="28" fontWeight="900">
          84
        </text>
      </g>
      <g>
        <rect x={168} y={104} width={138} height={58} rx={12} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
        <text x={184} y={124} fill="#e0f2fe" fillOpacity="0.7" fontSize="10" fontWeight="900" letterSpacing="1.4">
          ACCURACY
        </text>
        <text x={184} y={150} fill="#4ade80" fontSize="28" fontWeight="900">
          97%
        </text>
        <Gauge x={278} y={134} radius={16} progress={0.97} track="rgba(255,255,255,0.14)" fill="#4ade80" width={5} />
      </g>
    </SceneStage>
  );
}

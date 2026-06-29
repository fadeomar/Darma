"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  ArrowLeftRight,
  Crown,
  Flag,
  Handshake,
  History,
  Keyboard,
  MousePointerClick,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Timer,
  Trophy,
  Undo2,
  Users,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import { CHESS_FILES, createInitialChessBoard, getPieceAsset, getPieceLabel } from "./chessBoard";
import { getLegalMoves, getMaterialScore, getNextTurn, getTurnLabel, moveChessPiece, promotePawn } from "./chessEngine";
import { commitChessMatchStarted, readChessMatchCount } from "./chessStorage";
import type {
  CapturedPiece,
  ChessBoard,
  ChessColor,
  ChessCoord,
  ChessGameStatus,
  ChessMoveRecord,
  ChessMoveTarget,
  ChessPiece,
  ChessPromotionRole,
  ChessRank,
  ChessSquare,
  PendingPromotion,
} from "./chessTypes";

const PLAYER_HINTS: Record<ChessColor, string> = {
  white: "White opens the match. Build center control, develop pieces, and protect the king.",
  black: "Black to move. Respond, defend, and look for counterplay.",
};

const FILE_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const RANK_LABELS = [8, 7, 6, 5, 4, 3, 2, 1];
const PROMOTION_ROLES: readonly ChessPromotionRole[] = ["queen", "rook", "bishop", "knight"];

const TIME_CONTROLS = [
  { id: "untimed", label: "Untimed", seconds: null },
  { id: "rapid5", label: "5 min", seconds: 5 * 60 },
  { id: "rapid10", label: "10 min", seconds: 10 * 60 },
] as const;

type TimeControlId = (typeof TIME_CONTROLS)[number]["id"];
type BoardOrientation = "white" | "black";
type ClockState = Record<ChessColor, number | null>;

type ChessSnapshot = {
  board: ChessBoard;
  selectedCoord: ChessCoord | null;
  turn: ChessColor;
  status: ChessGameStatus;
  winner: ChessColor | null;
  moveHistory: ChessMoveRecord[];
  capturedPieces: CapturedPiece[];
  pendingPromotion: PendingPromotion | null;
  timeLeft: ClockState;
  message: string;
};

function createClock(timeControl: TimeControlId): ClockState {
  const option = TIME_CONTROLS.find((candidate) => candidate.id === timeControl) ?? TIME_CONTROLS[0];
  return { white: option.seconds, black: option.seconds };
}

export function ChessMiniGame({ game }: { game: GameDefinition }) {
  const [board, setBoard] = useState<ChessBoard>(() => createInitialChessBoard());
  const [selectedCoord, setSelectedCoord] = useState<ChessCoord | null>(null);
  const [turn, setTurn] = useState<ChessColor>("white");
  const [status, setStatus] = useState<ChessGameStatus>("ready");
  const [winner, setWinner] = useState<ChessColor | null>(null);
  const [moveHistory, setMoveHistory] = useState<ChessMoveRecord[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);
  const [undoStack, setUndoStack] = useState<ChessSnapshot[]>([]);
  const [boardOrientation, setBoardOrientation] = useState<BoardOrientation>("white");
  const [timeControl, setTimeControl] = useState<TimeControlId>("untimed");
  const [timeLeft, setTimeLeft] = useState<ClockState>(() => createClock("untimed"));
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [message, setMessage] = useState("White starts. Select a white piece to see legal moves.");
  const [matchCount, setMatchCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setMatchCount(readChessMatchCount());
    setHydrated(true);
  }, []);

  const isGameOver = ["checkmate", "stalemate", "draw", "resigned", "timeout"].includes(status);
  const lastMove = moveHistory[0] ?? null;

  useEffect(() => {
    if (isGameOver || pendingPromotion || (status !== "playing" && status !== "check")) return;
    if (timeLeft[turn] === null) return;

    const timerId = window.setInterval(() => {
      setTimeLeft((current) => {
        const currentTurnTime = current[turn];
        if (currentTurnTime === null) return current;
        const nextTurnTime = Math.max(currentTurnTime - 1, 0);
        if (nextTurnTime === 0) {
          const timeoutWinner = getNextTurn(turn);
          setStatus("timeout");
          setWinner(timeoutWinner);
          setSelectedCoord(null);
          setPendingPromotion(null);
          setMessage(`${getTurnLabel(turn)} ran out of time. ${getTurnLabel(timeoutWinner)} wins on time.`);
        }
        return { ...current, [turn]: nextTurnTime };
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isGameOver, pendingPromotion, status, timeLeft, turn]);

  const selectedSquare = useMemo(
    () => board.flat().find((square) => square.coord === selectedCoord) ?? null,
    [board, selectedCoord],
  );

  const legalMoves = useMemo<ChessMoveTarget[]>(
    () => (selectedCoord && !isGameOver && !pendingPromotion ? getLegalMoves(board, selectedCoord, { lastMove }) : []),
    [board, isGameOver, lastMove, pendingPromotion, selectedCoord],
  );

  const legalMoveByCoord = useMemo(() => new Map(legalMoves.map((move) => [move.coord, move])), [legalMoves]);

  const selectedPieceLabel = selectedSquare?.piece ? readablePiece(selectedSquare.piece) : "No piece selected";
  const whiteCaptures = capturedPieces.filter((piece) => piece.color === "black");
  const blackCaptures = capturedPieces.filter((piece) => piece.color === "white");
  const whiteMaterial = getMaterialScore(whiteCaptures);
  const blackMaterial = getMaterialScore(blackCaptures);
  const materialLead = whiteMaterial === blackMaterial ? "Even" : whiteMaterial > blackMaterial ? `White +${whiteMaterial - blackMaterial}` : `Black +${blackMaterial - whiteMaterial}`;
  const activeTimeControl = TIME_CONTROLS.find((option) => option.id === timeControl) ?? TIME_CONTROLS[0];

  const displayedBoard = useMemo(
    () => (boardOrientation === "white" ? board : [...board].reverse().map((row) => [...row].reverse())),
    [board, boardOrientation],
  );

  const displayedFiles = useMemo(
    () => (boardOrientation === "white" ? FILE_LABELS : [...FILE_LABELS].reverse()),
    [boardOrientation],
  );

  const displayedRanks = useMemo(
    () => (boardOrientation === "white" ? RANK_LABELS : [...RANK_LABELS].reverse()),
    [boardOrientation],
  );

  const startNewGame = useCallback((nextTimeControl: TimeControlId = timeControl, countMatch = true) => {
    setBoard(createInitialChessBoard());
    setSelectedCoord(null);
    setTurn("white");
    setStatus("ready");
    setWinner(null);
    setMoveHistory([]);
    setCapturedPieces([]);
    setUndoStack([]);
    setPendingPromotion(null);
    setTimeLeft(createClock(nextTimeControl));
    setMessage("New standard chess game started. White to move.");
    if (countMatch) setMatchCount(commitChessMatchStarted());
  }, [timeControl]);

  const resetGame = useCallback(() => {
    startNewGame(timeControl);
  }, [startNewGame, timeControl]);

  const restoreSnapshot = useCallback((snapshot: ChessSnapshot) => {
    setBoard(snapshot.board);
    setSelectedCoord(snapshot.selectedCoord);
    setTurn(snapshot.turn);
    setStatus(snapshot.status);
    setWinner(snapshot.winner);
    setMoveHistory(snapshot.moveHistory);
    setCapturedPieces(snapshot.capturedPieces);
    setPendingPromotion(snapshot.pendingPromotion);
    setTimeLeft(snapshot.timeLeft);
    setMessage(snapshot.message);
  }, []);

  const undoLastMove = useCallback(() => {
    setUndoStack((stack) => {
      const [snapshot, ...rest] = stack;
      if (!snapshot) return stack;
      restoreSnapshot({ ...snapshot, selectedCoord: null, pendingPromotion: null, message: `Move undone. ${getTurnLabel(snapshot.turn)} to move.` });
      return rest;
    });
  }, [restoreSnapshot]);

  const snapshotCurrentState = useCallback((): ChessSnapshot => ({
    board,
    selectedCoord,
    turn,
    status,
    winner,
    moveHistory,
    capturedPieces,
    pendingPromotion,
    timeLeft,
    message,
  }), [board, capturedPieces, message, moveHistory, pendingPromotion, selectedCoord, status, timeLeft, turn, winner]);

  const handleSquarePress = useCallback(
    (square: ChessSquare) => {
      if (pendingPromotion) {
        setMessage("Choose a promotion piece before making another move.");
        return;
      }

      if (isGameOver) {
        setMessage(getGameOverMessage(status, winner));
        return;
      }

      if (selectedCoord) {
        const targetMove = legalMoveByCoord.get(square.coord);

        if (targetMove) {
          const result = moveChessPiece(board, selectedCoord, square.coord, turn, { lastMove });
          if (!result) {
            setMessage("That move is no longer legal. Try another highlighted square.");
            return;
          }

          const nextTurn = getNextTurn(turn);
          setUndoStack((stack) => [snapshotCurrentState(), ...stack].slice(0, 40));
          setBoard(result.board);
          setMoveHistory((history) => [result.record, ...history].slice(0, 80));
          if (result.record.captured) {
            setCapturedPieces((pieces) => [result.record.captured!, ...pieces]);
          }
          setWinner(result.winner);
          setStatus(result.status);
          setSelectedCoord(null);

          if (result.pendingPromotion) {
            setPendingPromotion(result.pendingPromotion);
            setMessage(`${readablePiece(result.record.piece)} reached ${result.record.to}. Choose promotion: queen, rook, bishop, or knight.`);
            return;
          }

          setTurn(result.winner ? turn : nextTurn);
          setMessage(buildMoveMessage(result.record, result.status, nextTurn, result.winner));
          return;
        }

        if (square.coord === selectedCoord) {
          setSelectedCoord(null);
          setMessage("Selection cleared.");
          return;
        }
      }

      if (square.piece?.color === turn) {
        setSelectedCoord(square.coord);
        setMessage(`${readablePiece(square.piece)} selected on ${square.coord}. Choose a highlighted target.`);
        return;
      }

      if (square.piece && square.piece.color !== turn) {
        setMessage(`It is ${getTurnLabel(turn)}'s turn. Select a ${turn} piece first.`);
        return;
      }

      setMessage(selectedCoord ? "That square is not a legal target for the selected piece." : `Select a ${turn} piece to start the move.`);
    },
    [board, isGameOver, lastMove, legalMoveByCoord, pendingPromotion, selectedCoord, snapshotCurrentState, status, turn, winner],
  );

  const handlePromotionChoice = useCallback((role: ChessPromotionRole) => {
    if (!pendingPromotion) return;

    const result = promotePawn(board, pendingPromotion, role);
    if (!result) {
      setMessage("Promotion failed. Undo the move or start a new game.");
      return;
    }

    setBoard(result.board);
    setMoveHistory((history) => [result.record, ...history.slice(1)].slice(0, 80));
    setPendingPromotion(null);
    setWinner(result.winner);
    setStatus(result.status);
    setTurn(result.winner ? pendingPromotion.color : result.nextTurn);
    setMessage(buildMoveMessage(result.record, result.status, result.nextTurn, result.winner));
  }, [board, pendingPromotion]);

  const handleSquareKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, square: ChessSquare) => {
      const nextCoord = getKeyboardNeighbor(square.coord, event.key, boardOrientation);
      if (!nextCoord) return;

      event.preventDefault();
      const nextButton = document.querySelector<HTMLButtonElement>(`[data-chess-square="${nextCoord}"]`);
      nextButton?.focus();
    },
    [boardOrientation],
  );

  const handleTimeControlChange = useCallback((nextTimeControl: TimeControlId) => {
    setTimeControl(nextTimeControl);
    startNewGame(nextTimeControl, false);
    setMessage(`Time control changed to ${TIME_CONTROLS.find((option) => option.id === nextTimeControl)?.label ?? "Untimed"}. Board reset for a fair game.`);
  }, [startNewGame]);

  const resignGame = useCallback(() => {
    if (isGameOver) return;
    const resignationWinner = getNextTurn(turn);
    setStatus("resigned");
    setWinner(resignationWinner);
    setSelectedCoord(null);
    setPendingPromotion(null);
    setMessage(`${getTurnLabel(turn)} resigned. ${getTurnLabel(resignationWinner)} wins.`);
  }, [isGameOver, turn]);

  const agreeDraw = useCallback(() => {
    if (isGameOver) return;
    setStatus("draw");
    setWinner(null);
    setSelectedCoord(null);
    setPendingPromotion(null);
    setMessage("Draw agreed by both local players.");
  }, [isGameOver]);

  const statusTone = getStatusTone(status);
  const headline = getHeadline(status, turn, winner);
  const subtext = getStatusSubtext(status, turn, winner, pendingPromotion);

  return (
    <div className="dc-shell dc-shell--phase3">
      <div className="dc-topbar">
        <div className="dc-topbar-id">
          <span className="dc-eyebrow">Standard Chess Release</span>
          <h2 className="dc-topbar-title">{game.title}</h2>
          <p className="dc-topbar-subtitle">Production-ready local chess with castling, en passant, promotion choice, timers, draw/resign actions, notation, and stronger match feedback.</p>
        </div>
        <div className="dc-topbar-controls">
          <Badge variant={statusTone}>{readableStatus(status)}</Badge>
          <Badge variant="outline">Standard rules</Badge>
          <label className="dc-time-select-label">
            <span>Clock</span>
            <select className="dc-time-select" value={timeControl} onChange={(event: ChangeEvent<HTMLSelectElement>) => handleTimeControlChange(event.target.value as TimeControlId)}>
              {TIME_CONTROLS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
          <Button variant="ghost" size="sm" onClick={undoLastMove} disabled={undoStack.length === 0} leftIcon={<Undo2 className="h-4 w-4" aria-hidden />}>
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBoardOrientation((orientation) => (orientation === "white" ? "black" : "white"));
              setMessage("Board flipped for the other player view.");
            }}
            leftIcon={<ArrowLeftRight className="h-4 w-4" aria-hidden />}
          >
            Flip
          </Button>
          <Button variant="secondary" size="sm" onClick={resetGame} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
            New game
          </Button>
        </div>
      </div>

      <div className="dc-stage">
        <div className="dc-hero-card">
          <div className={cn("dc-status-card", (status === "check" || status === "promotion") && "dc-status-card--warning", isGameOver && status !== "draw" && "dc-status-card--danger")}>
            <div className={cn("dc-turn-orb", `dc-turn-orb--${winner ?? turn}`)} aria-hidden>
              {status === "check" ? <ShieldAlert className="h-5 w-5" /> : status === "promotion" ? <Sparkles className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
            </div>
            <div>
              <p className="dc-status-title">{headline}</p>
              <p className="dc-status-text">{subtext}</p>
            </div>
          </div>

          <div className="dc-live-message" aria-live="polite">
            {message}
          </div>

          <div className="dc-clock-row" aria-label="Chess clocks">
            <ClockCard color="white" active={turn === "white" && !pendingPromotion && !isGameOver} seconds={timeLeft.white} baseSeconds={activeTimeControl.seconds} />
            <ClockCard color="black" active={turn === "black" && !pendingPromotion && !isGameOver} seconds={timeLeft.black} baseSeconds={activeTimeControl.seconds} />
          </div>

          <div className="dc-layout">
            <div className="dc-board-wrap" aria-label="Chess Mini board area">
              <div className="dc-board-shell">
                <div className="dc-file-labels dc-file-labels--top" aria-hidden>
                  {displayedFiles.map((file) => (
                    <span key={`top-${file}`}>{file}</span>
                  ))}
                </div>

                <div className="dc-board-row-wrap">
                  <div className="dc-rank-labels" aria-hidden>
                    {displayedRanks.map((rank) => (
                      <span key={`left-${rank}`}>{rank}</span>
                    ))}
                  </div>

                  <div className="dc-board-frame">
                    <div className="dc-board" role="grid" aria-label={`Chess board, ${boardOrientation} side orientation`}>
                      {displayedBoard.map((row) =>
                        row.map((square) => {
                          const move = legalMoveByCoord.get(square.coord);
                          const isSelected = square.coord === selectedCoord;
                          const isLastMove = moveHistory[0]?.from === square.coord || moveHistory[0]?.to === square.coord;
                          const isLight = (square.file.charCodeAt(0) + square.rank) % 2 === 0;
                          const isPromotionSquare = pendingPromotion?.coord === square.coord;

                          return (
                            <button
                              key={square.coord}
                              type="button"
                              className={cn(
                                "dc-square",
                                isLight ? "dc-square--light" : "dc-square--dark",
                                square.piece && "dc-square--occupied",
                                square.piece?.color === turn && !isGameOver && !pendingPromotion && "dc-square--selectable",
                                isSelected && "dc-square--selected",
                                move && "dc-square--move",
                                move?.capture && "dc-square--capture",
                                move?.checking && "dc-square--checking",
                                move?.special && `dc-square--${move.special}`,
                                isLastMove && "dc-square--last",
                                isPromotionSquare && "dc-square--promotion-pending",
                              )}
                              role="gridcell"
                              aria-label={buildSquareLabel(square, move, isSelected)}
                              aria-pressed={isSelected}
                              data-chess-square={square.coord}
                              onClick={() => handleSquarePress(square)}
                              onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => handleSquareKeyDown(event, square)}
                            >
                              <span className="dc-square-coordinate" aria-hidden>{square.coord}</span>
                              {square.piece ? (
                                <img
                                  className="dc-piece"
                                  src={getPieceAsset(square.piece)}
                                  alt={getPieceLabel(square.piece)}
                                  draggable={false}
                                />
                              ) : null}
                              {move && !square.piece ? <span className="dc-move-dot" aria-hidden /> : null}
                              {move?.capture ? <span className="dc-capture-ring" aria-hidden /> : null}
                              {move?.special === "castle-kingside" || move?.special === "castle-queenside" ? <span className="dc-special-tag" aria-hidden>castle</span> : null}
                              {move?.special === "en-passant" ? <span className="dc-special-tag" aria-hidden>e.p.</span> : null}
                              {move?.promotion ? <span className="dc-special-tag" aria-hidden>promo</span> : null}
                            </button>
                          );
                        }),
                      )}
                    </div>

                    {pendingPromotion ? (
                      <PromotionChooser promotion={pendingPromotion} onChoose={handlePromotionChoice} />
                    ) : null}
                  </div>

                  <div className="dc-rank-labels" aria-hidden>
                    {displayedRanks.map((rank) => (
                      <span key={`right-${rank}`}>{rank}</span>
                    ))}
                  </div>
                </div>

                <div className="dc-file-labels" aria-hidden>
                  {displayedFiles.map((file) => (
                    <span key={`bottom-${file}`}>{file}</span>
                  ))}
                </div>
              </div>
            </div>

            <aside className="dc-panel" aria-label="Chess Mini match information">
              <div className="dc-panel-card dc-panel-card--accent">
                <span className="dc-panel-kicker">
                  <Users className="h-4 w-4" aria-hidden /> Current turn
                </span>
                <strong>{winner ? `${getTurnLabel(winner)} wins` : status === "draw" || status === "stalemate" ? "Draw" : getTurnLabel(turn)}</strong>
                <p>{pendingPromotion ? "Promotion choice required." : winner ? readableStatus(status) : status === "check" ? "King is in check; escape the threat." : "Only this color can move now."}</p>
              </div>

              <div className="dc-stat-grid">
                <StatCard label="Moves" value={moveHistory.length.toString()} />
                <StatCard label="Material" value={materialLead} />
                <StatCard label="Selected" value={selectedSquare?.coord ?? "—"} />
                <StatCard label="Clock" value={activeTimeControl.label} />
              </div>

              <div className="dc-action-grid">
                <Button variant="ghost" size="sm" onClick={agreeDraw} disabled={isGameOver} leftIcon={<Handshake className="h-4 w-4" aria-hidden />}>
                  Draw
                </Button>
                <Button variant="ghost" size="sm" onClick={resignGame} disabled={isGameOver} leftIcon={<Flag className="h-4 w-4" aria-hidden />}>
                  Resign
                </Button>
              </div>

              <div className="dc-panel-card">
                <span className="dc-panel-kicker">
                  <MousePointerClick className="h-4 w-4" aria-hidden /> Selection
                </span>
                <strong>{selectedPieceLabel}</strong>
                <p>{selectedSquare ? `${legalMoves.length} legal target${legalMoves.length === 1 ? "" : "s"} highlighted.` : "Pick a piece from the active side."}</p>
              </div>

              <div className="dc-panel-card dc-controls-card">
                <span className="dc-panel-kicker">
                  <Keyboard className="h-4 w-4" aria-hidden /> Controls
                </span>
                <p>Click/tap a piece, then a highlighted square. Keyboard users can tab to the board, use arrow keys between squares, and press Enter/Space to select.</p>
              </div>

              <CapturedStrip title="White captured" pieces={whiteCaptures} />
              <CapturedStrip title="Black captured" pieces={blackCaptures} />

              <div className="dc-panel-card">
                <span className="dc-panel-kicker">
                  <History className="h-4 w-4" aria-hidden /> Recent moves
                </span>
                {moveHistory.length > 0 ? (
                  <ol className="dc-history-list">
                    {moveHistory.slice(0, 8).map((move, index) => (
                      <li key={`${move.from}-${move.to}-${index}`}>
                        <span>{readablePiece(move.piece)}</span>
                        <strong>{move.notation ?? `${move.from} → ${move.to}`}</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>No moves yet. White starts.</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <div className="dc-guide">
        <span className="dc-guide-title">
          <Trophy className="h-4 w-4" aria-hidden /> Phase 3 scope
        </span>
        <span>Standard chess rules are now active: castling, en passant, promotion choice, king safety, checkmate, stalemate, and notation.</span>
        <span className="dc-guide-note">Match tools: undo, board flip, draw, resign, and optional 5/10 minute clocks.</span>
        <span className="dc-guide-note">Local matches started: {hydrated ? matchCount : 0}</span>
      </div>
    </div>
  );
}

function ClockCard({ color, active, seconds, baseSeconds }: { color: ChessColor; active: boolean; seconds: number | null; baseSeconds: number | null }) {
  const progress = seconds === null || baseSeconds === null || baseSeconds === 0 ? 1 : Math.max(0, Math.min(1, seconds / baseSeconds));

  return (
    <div className={cn("dc-clock-card", active && "dc-clock-card--active", `dc-clock-card--${color}`)}>
      <span>
        <Timer className="h-4 w-4" aria-hidden /> {getTurnLabel(color)}
      </span>
      <strong>{formatClock(seconds)}</strong>
      <div className="dc-clock-meter" aria-hidden>
        <i style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}

function PromotionChooser({ promotion, onChoose }: { promotion: PendingPromotion; onChoose: (role: ChessPromotionRole) => void }) {
  return (
    <div className="dc-promotion-dock" role="dialog" aria-label="Choose promotion piece" aria-modal="false">
      <span className="dc-panel-kicker">
        <Sparkles className="h-4 w-4" aria-hidden /> Promote pawn on {promotion.coord}
      </span>
      <div className="dc-promotion-options">
        {PROMOTION_ROLES.map((role) => {
          const piece: ChessPiece = { id: `${promotion.color}-${role}-preview`, color: promotion.color, role };
          return (
            <button key={role} type="button" className="dc-promotion-button" onClick={() => onChoose(role)} aria-label={`Promote to ${role}`}>
              <img src={getPieceAsset(piece)} alt="" draggable={false} aria-hidden />
              <span>{role}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="dc-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CapturedStrip({ title, pieces }: { title: string; pieces: CapturedPiece[] }) {
  return (
    <div className="dc-panel-card dc-captured-card">
      <span className="dc-panel-kicker">{title}</span>
      {pieces.length > 0 ? (
        <div className="dc-captured-list" aria-label={title}>
          {pieces.map((piece, index) => (
            <img
              key={`${piece.id}-${piece.capturedAt}-${index}`}
              src={getPieceAsset(piece)}
              alt={getPieceLabel(piece)}
              draggable={false}
            />
          ))}
        </div>
      ) : (
        <p>No captures yet.</p>
      )}
    </div>
  );
}

function readablePiece(piece: ChessPiece): string {
  return `${getTurnLabel(piece.color)} ${piece.role.charAt(0).toUpperCase()}${piece.role.slice(1)}`;
}

function readableStatus(currentStatus: ChessGameStatus): string {
  const labels: Record<ChessGameStatus, string> = {
    ready: "Ready",
    playing: "Playing",
    check: "Check",
    checkmate: "Checkmate",
    stalemate: "Stalemate",
    promotion: "Promotion",
    draw: "Draw",
    resigned: "Resigned",
    timeout: "Timeout",
  };

  return labels[currentStatus];
}

function getStatusTone(currentStatus: ChessGameStatus): "soft" | "success" | "warning" | "danger" | "outline" {
  if (["checkmate", "resigned", "timeout"].includes(currentStatus)) return "danger";
  if (["check", "stalemate", "promotion"].includes(currentStatus)) return "warning";
  if (currentStatus === "playing") return "success";
  return "soft";
}

function getHeadline(currentStatus: ChessGameStatus, turn: ChessColor, winner: ChessColor | null): string {
  if (currentStatus === "checkmate" && winner) return `${getTurnLabel(winner)} wins by checkmate`;
  if (currentStatus === "resigned" && winner) return `${getTurnLabel(winner)} wins by resignation`;
  if (currentStatus === "timeout" && winner) return `${getTurnLabel(winner)} wins on time`;
  if (currentStatus === "draw" || currentStatus === "stalemate") return currentStatus === "draw" ? "Draw agreed" : "Stalemate — draw";
  if (currentStatus === "promotion") return `${getTurnLabel(turn)} promotion choice`;
  if (currentStatus === "check") return `${getTurnLabel(turn)} king is in check`;
  return `${getTurnLabel(turn)} to move`;
}

function getStatusSubtext(currentStatus: ChessGameStatus, turn: ChessColor, winner: ChessColor | null, pendingPromotion: PendingPromotion | null): string {
  if (pendingPromotion) return "Choose queen, rook, bishop, or knight before the next turn begins.";
  if (currentStatus === "checkmate" && winner) return "The opponent has no legal escape. Start a new game or undo the last move.";
  if (currentStatus === "resigned" && winner) return "The match ended by resignation.";
  if (currentStatus === "timeout" && winner) return "The clock reached zero for the opponent.";
  if (currentStatus === "draw") return "Both local players agreed to end the match as a draw.";
  if (currentStatus === "stalemate") return "The current player has no legal move but is not in check.";
  if (currentStatus === "check") return "Only moves that protect the king are allowed.";
  return PLAYER_HINTS[turn];
}

function getGameOverMessage(currentStatus: ChessGameStatus, winner: ChessColor | null): string {
  if (winner) return `${getTurnLabel(winner)} already won by ${readableStatus(currentStatus).toLowerCase()}. Start a new game to play again.`;
  return "The match is finished. Start a new game to play again.";
}

function buildMoveMessage(
  move: ChessMoveRecord,
  nextStatus: ChessGameStatus,
  nextTurn: ChessColor,
  winner: ChessColor | null,
): string {
  const captureText = move.captured ? ` and captured ${readablePiece(move.captured)}` : "";
  const promotionText = move.promotedTo ? ` Promotion: ${move.promotedTo}.` : "";
  const specialText = move.special === "castle-kingside" || move.special === "castle-queenside" ? " Castling completed." : move.special === "en-passant" ? " En passant." : "";
  const base = `${move.notation ? `${move.notation}: ` : ""}${readablePiece(move.piece)} moved ${move.from} to ${move.to}${captureText}.${promotionText}${specialText}`;

  if (nextStatus === "checkmate" && winner) return `${base} Checkmate — ${getTurnLabel(winner)} wins.`;
  if (nextStatus === "stalemate") return `${base} Stalemate — draw.`;
  if (nextStatus === "check") return `${base} ${getTurnLabel(nextTurn)} is in check.`;
  return `${base} ${getTurnLabel(nextTurn)} to move.`;
}

function buildSquareLabel(square: ChessSquare, move: ChessMoveTarget | undefined, isSelected: boolean): string {
  const base = `${square.coord}${square.piece ? `, ${getPieceLabel(square.piece)}` : ", empty"}`;
  if (isSelected) return `${base}, selected`;
  if (move?.special === "castle-kingside") return `${base}, castle kingside`;
  if (move?.special === "castle-queenside") return `${base}, castle queenside`;
  if (move?.special === "en-passant") return `${base}, en passant capture`;
  if (move?.promotion) return `${base}, promotion target`;
  if (move?.capture && move.checking) return `${base}, capture target with check`;
  if (move?.capture) return `${base}, capture target`;
  if (move?.checking) return `${base}, legal move with check`;
  if (move) return `${base}, legal move`;
  return base;
}

function getKeyboardNeighbor(coord: ChessCoord, key: string, orientation: BoardOrientation): ChessCoord | null {
  const fileIndex = CHESS_FILES.indexOf(coord[0] as (typeof CHESS_FILES)[number]);
  const rank = Number(coord[1]);
  const orientationFactor = orientation === "white" ? 1 : -1;
  let nextFileIndex = fileIndex;
  let nextRank = rank;

  if (key === "ArrowRight") nextFileIndex += orientationFactor;
  else if (key === "ArrowLeft") nextFileIndex -= orientationFactor;
  else if (key === "ArrowUp") nextRank += orientationFactor;
  else if (key === "ArrowDown") nextRank -= orientationFactor;
  else return null;

  const file = CHESS_FILES[nextFileIndex];
  if (!file || nextRank < 1 || nextRank > 8) return null;
  return `${file}${nextRank as ChessRank}`;
}

function formatClock(seconds: number | null): string {
  if (seconds === null) return "∞";
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

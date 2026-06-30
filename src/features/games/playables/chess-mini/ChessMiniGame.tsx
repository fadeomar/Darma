"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from "react";
import {
  ArrowLeftRight,
  Bot,
  Crown,
  Eye,
  EyeOff,
  Flag,
  Handshake,
  History,
  Keyboard,
  MousePointerClick,
  Palette,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Timer,
  Trophy,
  Undo2,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { GameDefinition } from "../../domain/game";
import { CHESS_FILES, createInitialChessBoard, getPieceAsset, getPieceLabel } from "./chessBoard";
import {
  chooseComputerMove,
  MAX_THINKING_MS,
  VISIBLE_THINKING_RANGES,
  type ChessAiDifficulty,
  type ChessAiMeta,
  type ChessAiMove,
} from "./chessAi";
import { getLegalMoves, getMaterialScore, getNextTurn, getTurnLabel, moveChessPiece, promotePawn } from "./chessEngine";
import { playChessSound, unlockChessAudio, type ChessSoundEvent } from "./chessSounds";
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

const AI_DIFFICULTIES: Array<{ id: ChessAiDifficulty; label: string; description: string }> = [
  { id: "beginner", label: "Beginner", description: "Forgiving moves with simple capture awareness." },
  { id: "intermediate", label: "Intermediate", description: "Balances material, checks, center, and replies." },
  { id: "pro", label: "Pro", description: "Uses a deeper minimax search for tougher play." },
];

const BOARD_THEMES = [
  { id: "classic", label: "Classic" },
  { id: "forest", label: "Forest" },
  { id: "ocean", label: "Ocean" },
  { id: "royal", label: "Royal" },
  { id: "sand", label: "Sand" },
] as const;

type TimeControlId = (typeof TIME_CONTROLS)[number]["id"];
type BoardOrientation = "white" | "black";
type ClockState = Record<ChessColor, number | null>;
type GamePhase = "setup" | "playing";
type BoardThemeId = (typeof BOARD_THEMES)[number]["id"];

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
  const [message, setMessage] = useState("Choose your side, difficulty, and board style to start Chess Mini.");
  const [matchCount, setMatchCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>("setup");
  const [humanColor, setHumanColor] = useState<ChessColor>("white");
  const [aiDifficulty, setAiDifficulty] = useState<ChessAiDifficulty>("intermediate");
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>("classic");
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [computerThinking, setComputerThinking] = useState(false);
  const [computerThinkingStartedAt, setComputerThinkingStartedAt] = useState<number | null>(null);
  const [computerThinkingElapsedMs, setComputerThinkingElapsedMs] = useState(0);
  const [lastComputerThinkMs, setLastComputerThinkMs] = useState<number | null>(null);
  const [lastThinkMeta, setLastThinkMeta] = useState<ChessAiMeta | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    setMatchCount(readChessMatchCount());
    setHydrated(true);
  }, []);

  const isGameOver = ["checkmate", "stalemate", "draw", "resigned", "timeout"].includes(status);
  const lastMove = moveHistory[0] ?? null;
  const computerColor = getNextTurn(humanColor);
  const isHumanTurn = gamePhase === "playing" && turn === humanColor && !computerThinking;

  useEffect(() => {
    if (!computerThinking || !computerThinkingStartedAt) {
      if (!computerThinking) setComputerThinkingElapsedMs(0);
      return;
    }

    const updateThinkingElapsed = () => {
      setComputerThinkingElapsedMs(Date.now() - computerThinkingStartedAt);
    };

    updateThinkingElapsed();
    const timerId = window.setInterval(updateThinkingElapsed, 100);
    return () => window.clearInterval(timerId);
  }, [computerThinking, computerThinkingStartedAt]);

  useEffect(() => {
    if (gamePhase !== "playing" || isGameOver || pendingPromotion || (status !== "playing" && status !== "check")) return;
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
          playChessSound(soundEnabled, timeoutWinner === humanColor ? "win" : "lose");
          setMessage(`${getTurnLabel(turn)} ran out of time. ${getTurnLabel(timeoutWinner)} wins on time.`);
        }
        return { ...current, [turn]: nextTurnTime };
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [gamePhase, humanColor, isGameOver, pendingPromotion, soundEnabled, status, timeLeft, turn]);

  const selectedSquare = useMemo(
    () => board.flat().find((square) => square.coord === selectedCoord) ?? null,
    [board, selectedCoord],
  );

  const legalMoves = useMemo<ChessMoveTarget[]>(
    () => (selectedCoord && isHumanTurn && !isGameOver && !pendingPromotion ? getLegalMoves(board, selectedCoord, { lastMove }) : []),
    [board, isGameOver, isHumanTurn, lastMove, pendingPromotion, selectedCoord],
  );

  const legalMoveByCoord = useMemo(() => new Map(legalMoves.map((move) => [move.coord, move])), [legalMoves]);

  const selectedPieceLabel = selectedSquare?.piece ? readablePiece(selectedSquare.piece) : "No piece selected";
  const whiteCaptures = capturedPieces.filter((piece) => piece.color === "black");
  const blackCaptures = capturedPieces.filter((piece) => piece.color === "white");
  const whiteMaterial = getMaterialScore(whiteCaptures);
  const blackMaterial = getMaterialScore(blackCaptures);
  const materialLead = whiteMaterial === blackMaterial ? "Even" : whiteMaterial > blackMaterial ? `White +${whiteMaterial - blackMaterial}` : `Black +${blackMaterial - whiteMaterial}`;
  const activeTimeControl = TIME_CONTROLS.find((option) => option.id === timeControl) ?? TIME_CONTROLS[0];
  const difficultyLabel = AI_DIFFICULTIES.find((option) => option.id === aiDifficulty)?.label ?? "Computer";
  const aiThinkLabel = computerThinking ? `${formatThinkTime(computerThinkingElapsedMs)} thinking` : lastComputerThinkMs !== null ? formatThinkTime(lastComputerThinkMs) : "—";

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

  const startMatch = useCallback((nextHumanColor: ChessColor = humanColor, nextDifficulty: ChessAiDifficulty = aiDifficulty, nextTimeControl: TimeControlId = timeControl) => {
    setHumanColor(nextHumanColor);
    setAiDifficulty(nextDifficulty);
    setBoard(createInitialChessBoard());
    setSelectedCoord(null);
    setTurn("white");
    setStatus("playing");
    setWinner(null);
    setMoveHistory([]);
    setCapturedPieces([]);
    setUndoStack([]);
    setPendingPromotion(null);
    setTimeLeft(createClock(nextTimeControl));
    setBoardOrientation(nextHumanColor);
    setComputerThinking(false);
    setComputerThinkingStartedAt(null);
    setComputerThinkingElapsedMs(0);
    setLastComputerThinkMs(null);
    setLastThinkMeta(null);
    setUsedFallback(false);
    setGamePhase("playing");
    setMessage(nextHumanColor === "white" ? "Game started. You play White. Make the opening move." : "Game started. You play Black. Computer opens as White.");
    setMatchCount(commitChessMatchStarted());
    // Starting is a trusted user gesture — safe to unlock audio playback now.
    unlockChessAudio();
    playChessSound(soundEnabled, "start");
  }, [aiDifficulty, humanColor, soundEnabled, timeControl]);

  const openSetup = useCallback(() => {
    setBoard(createInitialChessBoard());
    setSelectedCoord(null);
    setTurn("white");
    setStatus("ready");
    setWinner(null);
    setMoveHistory([]);
    setCapturedPieces([]);
    setUndoStack([]);
    setPendingPromotion(null);
    setTimeLeft(createClock(timeControl));
    setBoardOrientation(humanColor);
    setComputerThinking(false);
    setComputerThinkingStartedAt(null);
    setComputerThinkingElapsedMs(0);
    setLastComputerThinkMs(null);
    setLastThinkMeta(null);
    setUsedFallback(false);
    setGamePhase("setup");
    setMessage("Choose your side, difficulty, and board style to start Chess Mini.");
  }, [humanColor, timeControl]);

  const resetGame = useCallback(() => {
    openSetup();
  }, [openSetup]);

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
    setComputerThinking(false);
    setComputerThinkingStartedAt(null);
    setComputerThinkingElapsedMs(0);
  }, []);

  const undoLastMove = useCallback(() => {
    setUndoStack((stack) => {
      const [snapshot, ...rest] = stack;
      if (!snapshot) return stack;
      restoreSnapshot({ ...snapshot, selectedCoord: null, pendingPromotion: null, message: `Move undone. ${getTurnLabel(snapshot.turn)} to move.` });
      playChessSound(soundEnabled, "move");
      return rest;
    });
  }, [restoreSnapshot, soundEnabled]);

  const finalizeMove = useCallback((
    result: NonNullable<ReturnType<typeof moveChessPiece>>,
    movingColor: ChessColor,
    nextTurn: ChessColor,
    options: { saveUndo: boolean; actor: "human" | "computer"; snapshot?: ChessSnapshot },
  ) => {
    if (options.saveUndo && options.snapshot) {
      setUndoStack((stack) => [options.snapshot!, ...stack].slice(0, 40));
    }

    if (options.actor === "computer" && result.pendingPromotion) {
      const promotionResult = promotePawn(result.board, result.pendingPromotion, "queen");
      if (promotionResult) {
        setBoard(promotionResult.board);
        setMoveHistory((history) => [promotionResult.record, ...history].slice(0, 80));
        if (promotionResult.record.captured) setCapturedPieces((pieces) => [promotionResult.record.captured!, ...pieces]);
        setWinner(promotionResult.winner);
        setStatus(promotionResult.status);
        setSelectedCoord(null);
        setPendingPromotion(null);
        setTurn(promotionResult.winner ? movingColor : promotionResult.nextTurn);
        playChessSound(soundEnabled, getSoundForMove(promotionResult.record, promotionResult.status, promotionResult.winner, humanColor));
        setMessage(`Computer promoted to queen. ${buildMoveMessage(promotionResult.record, promotionResult.status, promotionResult.nextTurn, promotionResult.winner)}`);
        return;
      }
    }

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
      playChessSound(soundEnabled, "move");
      return;
    }

    setTurn(result.winner ? movingColor : nextTurn);
    playChessSound(soundEnabled, getSoundForMove(result.record, result.status, result.winner, humanColor));
    setMessage(buildMoveMessage(result.record, result.status, nextTurn, result.winner));
  }, [humanColor, soundEnabled]);

  // Apply the computer's chosen move against the exact position it analyzed. Taking the
  // analyzed board/turn/lastMove as explicit arguments guards against stale state and
  // keeps this callback stable, so the thinking effect never reschedules itself.
  const revealComputerMove = useCallback(
    (
      aiMove: ChessAiMove | null,
      analysisBoard: ChessBoard,
      analysisTurn: ChessColor,
      analysisLastMove: ChessMoveRecord | null,
      visibleMs: number,
    ) => {
      const clearThinking = () => {
        setComputerThinking(false);
        setComputerThinkingStartedAt(null);
        setComputerThinkingElapsedMs(0);
      };

      if (!aiMove) {
        clearThinking();
        setLastComputerThinkMs(visibleMs);
        setMessage("Computer reported no legal move. Waiting for the rules engine status.");
        return;
      }

      const result = moveChessPiece(analysisBoard, aiMove.from, aiMove.to, analysisTurn, { lastMove: analysisLastMove });
      if (!result) {
        clearThinking();
        setLastComputerThinkMs(visibleMs);
        setMessage("Computer tried an outdated move. Your board is safe — make your move again.");
        playChessSound(soundEnabled, "invalid");
        return;
      }

      const nextTurn = getNextTurn(analysisTurn);
      finalizeMove(result, analysisTurn, nextTurn, { saveUndo: false, actor: "computer" });

      clearThinking();
      setLastComputerThinkMs(visibleMs);
      setLastThinkMeta(aiMove.meta);
      const fallback = aiMove.meta.fallback || aiMove.meta.computeMs > MAX_THINKING_MS;
      setUsedFallback(fallback);
      setMessage((currentMessage) =>
        fallback
          ? `${currentMessage} Computer used a fallback move after ${formatThinkTime(visibleMs)}.`
          : `${currentMessage} Computer thought for ${formatThinkTime(visibleMs)}.`,
      );
    },
    [finalizeMove, soundEnabled],
  );

  const isComputerTurn =
    gamePhase === "playing" &&
    !isGameOver &&
    !pendingPromotion &&
    (status === "playing" || status === "check") &&
    turn === computerColor;

  // `positionId` only changes when a move is actually applied, so the thinking effect
  // runs exactly once per computer turn instead of re-scheduling on every render.
  const positionId = moveHistory.length;

  useEffect(() => {
    if (!isComputerTurn) return;

    let cancelled = false;
    const wallStart = Date.now();
    const perfNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
    const perfStart = perfNow();

    // Snapshot the exact position the AI analyzes so the applied move can never use stale state.
    const analysisBoard = board;
    const analysisTurn = turn;
    const analysisLastMove = lastMove;
    const targetVisibleMs = pickVisibleThinkMs(aiDifficulty);

    setComputerThinking(true);
    setComputerThinkingStartedAt(wallStart);
    setComputerThinkingElapsedMs(0);
    setSelectedCoord(null);
    setUsedFallback(false);
    setMessage(`${difficultyLabel} computer is thinking as ${getTurnLabel(computerColor)}...`);

    let revealTimer = 0;
    // Run the bounded calculation just after the "thinking" UI paints, then reveal the
    // move once the intentional (but capped) visible delay has elapsed.
    const computeTimer = window.setTimeout(() => {
      if (cancelled) return;
      const aiMove = chooseComputerMove(analysisBoard, analysisTurn, aiDifficulty, { lastMove: analysisLastMove });
      const computeMs = perfNow() - perfStart;
      const wait = Math.min(MAX_THINKING_MS, Math.max(targetVisibleMs, computeMs)) - computeMs;

      revealTimer = window.setTimeout(() => {
        if (cancelled) return;
        revealComputerMove(aiMove, analysisBoard, analysisTurn, analysisLastMove, Date.now() - wallStart);
      }, Math.max(0, wait));
    }, 30);

    return () => {
      cancelled = true;
      window.clearTimeout(computeTimer);
      window.clearTimeout(revealTimer);
    };
    // `board`/`turn`/`lastMove` are constant for the duration of a computer turn (they
    // only change when the move is applied, which flips `isComputerTurn` to false).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComputerTurn, positionId, aiDifficulty, computerColor, difficultyLabel, revealComputerMove]);

  // Safety net: if the turn leaves the computer without a reveal (timeout, resign, draw,
  // or undo mid-think), make sure the thinking indicator is cleared.
  useEffect(() => {
    if (!isComputerTurn && computerThinking) {
      setComputerThinking(false);
      setComputerThinkingStartedAt(null);
      setComputerThinkingElapsedMs(0);
    }
  }, [isComputerTurn, computerThinking]);

  const handleSquarePress = useCallback(
    (square: ChessSquare) => {
      if (gamePhase === "setup") {
        setMessage("Press Start game first, then choose your move on the board.");
        playChessSound(soundEnabled, "invalid");
        return;
      }

      if (pendingPromotion) {
        setMessage("Choose a promotion piece before making another move.");
        return;
      }

      if (isGameOver) {
        setMessage(getGameOverMessage(status, winner));
        return;
      }

      if (!isHumanTurn) {
        setMessage(computerThinking ? "Computer is thinking. Wait for its move." : `You are ${getTurnLabel(humanColor)}. It is ${getTurnLabel(turn)}'s turn.`);
        playChessSound(soundEnabled, "invalid");
        return;
      }

      if (selectedCoord) {
        const targetMove = legalMoveByCoord.get(square.coord);

        if (targetMove) {
          const result = moveChessPiece(board, selectedCoord, square.coord, turn, { lastMove });
          if (!result) {
            setMessage("That move is no longer legal. Try another highlighted square.");
            playChessSound(soundEnabled, "invalid");
            return;
          }

          const nextTurn = getNextTurn(turn);
          finalizeMove(result, turn, nextTurn, { saveUndo: true, actor: "human", snapshot: snapshotCurrentState() });
          return;
        }

        if (square.coord === selectedCoord) {
          setSelectedCoord(null);
          setMessage("Selection cleared.");
          return;
        }
      }

      if (square.piece?.color === humanColor && square.piece.color === turn) {
        setSelectedCoord(square.coord);
        setMessage(`${readablePiece(square.piece)} selected on ${square.coord}. Choose a highlighted target.`);
        return;
      }

      if (square.piece && square.piece.color !== humanColor) {
        setMessage("That is a computer piece. Choose one of your own pieces.");
        playChessSound(soundEnabled, "invalid");
        return;
      }

      if (square.piece && square.piece.color !== turn) {
        setMessage(`It is ${getTurnLabel(turn)}'s turn. Select a ${turn} piece first.`);
        return;
      }

      setMessage(selectedCoord ? "That square is not a legal target for the selected piece." : `Select one of your ${humanColor} pieces to start the move.`);
    },
    [board, computerThinking, finalizeMove, gamePhase, humanColor, isGameOver, isHumanTurn, lastMove, legalMoveByCoord, pendingPromotion, selectedCoord, snapshotCurrentState, soundEnabled, status, turn, winner],
  );

  const handlePromotionChoice = useCallback((role: ChessPromotionRole) => {
    if (!pendingPromotion) return;

    const result = promotePawn(board, pendingPromotion, role);
    if (!result) {
      setMessage("Promotion failed. Undo the move or start a new game.");
      playChessSound(soundEnabled, "invalid");
      return;
    }

    setBoard(result.board);
    setMoveHistory((history) => [result.record, ...history.slice(1)].slice(0, 80));
    setPendingPromotion(null);
    setWinner(result.winner);
    setStatus(result.status);
    setTurn(result.winner ? pendingPromotion.color : result.nextTurn);
    playChessSound(soundEnabled, getSoundForMove(result.record, result.status, result.winner, humanColor));
    setMessage(buildMoveMessage(result.record, result.status, result.nextTurn, result.winner));
  }, [board, humanColor, pendingPromotion, soundEnabled]);

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
    setTimeLeft(createClock(nextTimeControl));
    if (gamePhase === "playing") {
      startMatch(humanColor, aiDifficulty, nextTimeControl);
      setMessage(`Time control changed to ${TIME_CONTROLS.find((option) => option.id === nextTimeControl)?.label ?? "Untimed"}. New game started for a fair clock.`);
    }
  }, [aiDifficulty, gamePhase, humanColor, startMatch]);

  const resignGame = useCallback(() => {
    if (isGameOver || gamePhase !== "playing") return;
    const resignationWinner = computerColor;
    setStatus("resigned");
    setWinner(resignationWinner);
    setSelectedCoord(null);
    setPendingPromotion(null);
    setComputerThinking(false);
    setComputerThinkingStartedAt(null);
    setComputerThinkingElapsedMs(0);
    playChessSound(soundEnabled, "lose");
    setMessage(`You resigned. ${getTurnLabel(resignationWinner)} wins.`);
  }, [computerColor, gamePhase, isGameOver, soundEnabled]);

  const agreeDraw = useCallback(() => {
    if (isGameOver || gamePhase !== "playing") return;
    setStatus("draw");
    setWinner(null);
    setSelectedCoord(null);
    setPendingPromotion(null);
    setComputerThinking(false);
    setComputerThinkingStartedAt(null);
    setComputerThinkingElapsedMs(0);
    playChessSound(soundEnabled, "draw");
    setMessage("Game ended as a draw.");
  }, [gamePhase, isGameOver, soundEnabled]);

  const statusTone = getStatusTone(status);
  const headline = getHeadline(status, turn, winner, gamePhase, computerThinking, humanColor);
  const subtext = getStatusSubtext(status, turn, winner, pendingPromotion, gamePhase, computerThinking, humanColor, computerThinkingElapsedMs);

  return (
    <div className={cn("dc-shell dc-shell--phase3", `dc-board-theme--${boardTheme}`, !showCoordinates && "dc-shell--hide-cell-coordinates")}>
      <div className="dc-topbar">
        <div className="dc-topbar-id">
          <span className="dc-eyebrow">Player vs Computer Chess</span>
          <h2 className="dc-topbar-title">{game.title}</h2>
          <p className="dc-topbar-subtitle">Play against a computer opponent, choose your side and difficulty, switch board themes, toggle coordinates, and finish with a clear results screen.</p>
        </div>
        <div className="dc-topbar-controls">
          <Badge variant={statusTone}>{readableStatus(status)}</Badge>
          <Badge variant="outline">You: {getTurnLabel(humanColor)}</Badge>
          <Badge variant="outline">AI: {difficultyLabel}</Badge>
          <label className="dc-time-select-label">
            <span>Clock</span>
            <select className="dc-time-select" value={timeControl} onChange={(event: ChangeEvent<HTMLSelectElement>) => handleTimeControlChange(event.target.value as TimeControlId)}>
              {TIME_CONTROLS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
          <Button variant="ghost" size="sm" onClick={undoLastMove} disabled={undoStack.length === 0 || computerThinking} leftIcon={<Undo2 className="h-4 w-4" aria-hidden />}>
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBoardOrientation((orientation) => (orientation === "white" ? "black" : "white"));
              setMessage("Board flipped for the other side view.");
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
              {computerThinking ? <Bot className="h-5 w-5" /> : status === "check" ? <ShieldAlert className="h-5 w-5" /> : status === "promotion" ? <Sparkles className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
            </div>
            <div>
              <p className="dc-status-title">{headline}</p>
              <p className="dc-status-text">{subtext}</p>
            </div>
          </div>

          <div className="dc-live-message" aria-live="polite">
            {message}
          </div>

          {gamePhase === "setup" ? (
            <SetupScreen
              humanColor={humanColor}
              difficulty={aiDifficulty}
              timeControl={timeControl}
              boardTheme={boardTheme}
              showCoordinates={showCoordinates}
              soundEnabled={soundEnabled}
              onHumanColorChange={(color) => {
                setHumanColor(color);
                setBoardOrientation(color);
              }}
              onDifficultyChange={setAiDifficulty}
              onTimeControlChange={(next) => {
                setTimeControl(next);
                setTimeLeft(createClock(next));
              }}
              onBoardThemeChange={setBoardTheme}
              onShowCoordinatesChange={setShowCoordinates}
              onSoundEnabledChange={setSoundEnabled}
              onStart={() => startMatch(humanColor, aiDifficulty, timeControl)}
            />
          ) : (
            <>
              {isGameOver ? (
                <EndScreen
                  status={status}
                  winner={winner}
                  humanColor={humanColor}
                  moves={moveHistory.length}
                  materialLead={materialLead}
                  onPlayAgain={() => startMatch(humanColor, aiDifficulty, timeControl)}
                  onChangeSettings={openSetup}
                />
              ) : null}

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
                        <div className={cn("dc-board", computerThinking && "dc-board--thinking")} role="grid" aria-label={`Chess board, ${boardOrientation} side orientation`}>
                          {displayedBoard.map((row) =>
                            row.map((square) => {
                              const move = legalMoveByCoord.get(square.coord);
                              const isSelected = square.coord === selectedCoord;
                              const isLastMove = moveHistory[0]?.from === square.coord || moveHistory[0]?.to === square.coord;
                              const isLight = (square.file.charCodeAt(0) + square.rank) % 2 === 0;
                              const isPromotionSquare = pendingPromotion?.coord === square.coord;
                              const isHumanPiece = square.piece?.color === humanColor;

                              return (
                                <button
                                  key={square.coord}
                                  type="button"
                                  className={cn(
                                    "dc-square",
                                    isLight ? "dc-square--light" : "dc-square--dark",
                                    square.piece && "dc-square--occupied",
                                    isHumanPiece && square.piece?.color === turn && isHumanTurn && !isGameOver && !pendingPromotion && "dc-square--selectable",
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

                        {computerThinking ? (
                          <div className="dc-thinking-overlay" role="status" aria-live="polite">
                            <div className="dc-thinking-chip">
                              <span className="dc-thinking-spinner" aria-hidden />
                              <span className="dc-thinking-copy">
                                <strong>Computer thinking…</strong>
                                <span>{difficultyLabel} · {formatThinkTime(computerThinkingElapsedMs)}</span>
                              </span>
                            </div>
                          </div>
                        ) : null}

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
                      {computerThinking ? <Bot className="h-4 w-4" aria-hidden /> : turn === humanColor ? <User className="h-4 w-4" aria-hidden /> : <UsersIconFallback />} Current turn
                    </span>
                    <strong>{winner ? `${getTurnLabel(winner)} wins` : status === "draw" || status === "stalemate" ? "Draw" : turn === humanColor ? "Your move" : "Computer move"}</strong>
                    <p>{pendingPromotion ? "Promotion choice required." : winner ? readableStatus(status) : computerThinking ? "The computer is calculating its reply." : status === "check" ? "King is in check; escape the threat." : turn === humanColor ? "Only your color can move now." : "Wait for the computer response."}</p>
                    {computerThinking ? (
                      <p className="dc-think-live"><span className="dc-thinking-spinner dc-thinking-spinner--sm" aria-hidden /> Thinking {formatThinkTime(computerThinkingElapsedMs)}…</p>
                    ) : lastComputerThinkMs !== null ? (
                      <p className="dc-think-live dc-think-live--done">
                        {usedFallback ? "Fallback move" : "Last reply"} in {formatThinkTime(lastComputerThinkMs)}
                        {lastThinkMeta && lastThinkMeta.depth > 0 ? ` · depth ${lastThinkMeta.depth}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <div className="dc-stat-grid">
                    <StatCard label="Moves" value={moveHistory.length.toString()} />
                    <StatCard label="Material" value={materialLead} />
                    <StatCard label="AI think" value={aiThinkLabel} />
                    <StatCard label="Clock" value={activeTimeControl.label} />
                  </div>

                  <div className="dc-action-grid">
                    <Button variant="ghost" size="sm" onClick={agreeDraw} disabled={isGameOver || computerThinking} leftIcon={<Handshake className="h-4 w-4" aria-hidden />}>
                      Draw
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resignGame} disabled={isGameOver || computerThinking} leftIcon={<Flag className="h-4 w-4" aria-hidden />}>
                      Resign
                    </Button>
                  </div>

                  <SettingsPanel
                    boardTheme={boardTheme}
                    showCoordinates={showCoordinates}
                    soundEnabled={soundEnabled}
                    onBoardThemeChange={setBoardTheme}
                    onShowCoordinatesChange={setShowCoordinates}
                    onSoundEnabledChange={setSoundEnabled}
                  />

                  <div className="dc-panel-card">
                    <span className="dc-panel-kicker">
                      <MousePointerClick className="h-4 w-4" aria-hidden /> Selection
                    </span>
                    <strong>{selectedPieceLabel}</strong>
                    <p>{selectedSquare ? `${legalMoves.length} legal target${legalMoves.length === 1 ? "" : "s"} highlighted.` : turn === humanColor ? "Pick one of your pieces." : "Computer controls the current turn."}</p>
                  </div>

                  <div className="dc-panel-card dc-controls-card">
                    <span className="dc-panel-kicker">
                      <Keyboard className="h-4 w-4" aria-hidden /> Controls
                    </span>
                    <p>Click/tap one of your pieces, then a highlighted square. Keyboard users can tab to the board, use arrow keys between squares, and press Enter/Space to select.</p>
                  </div>

                  <CapturedStrip title="White captured" pieces={whiteCaptures} />
                  <CapturedStrip title="Black captured" pieces={blackCaptures} />

                  <div className="dc-panel-card dc-history-card">
                    <span className="dc-panel-kicker">
                      <History className="h-4 w-4" aria-hidden /> Recent moves
                    </span>
                    {moveHistory.length > 0 ? (
                      <ol className="dc-history-list">
                        {moveHistory.map((move, index) => (
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
            </>
          )}
        </div>
      </div>

      <div className="dc-guide">
        <span className="dc-guide-title">
          <Trophy className="h-4 w-4" aria-hidden /> QA-ready scope
        </span>
        <span>Computer opponent, start/end screens, fixed recent-moves panel, board themes, coordinate toggle, and game sounds are included with standard chess rules.</span>
        <span className="dc-guide-note">Match tools: undo, board flip, draw, resign, and optional 5/10 minute clocks.</span>
        <span className="dc-guide-note">Matches started: {hydrated ? matchCount : 0}</span>
      </div>
    </div>
  );
}

function UsersIconFallback() {
  return <Bot className="h-4 w-4" aria-hidden />;
}

function SetupScreen({
  humanColor,
  difficulty,
  timeControl,
  boardTheme,
  showCoordinates,
  soundEnabled,
  onHumanColorChange,
  onDifficultyChange,
  onTimeControlChange,
  onBoardThemeChange,
  onShowCoordinatesChange,
  onSoundEnabledChange,
  onStart,
}: {
  humanColor: ChessColor;
  difficulty: ChessAiDifficulty;
  timeControl: TimeControlId;
  boardTheme: BoardThemeId;
  showCoordinates: boolean;
  soundEnabled: boolean;
  onHumanColorChange: (color: ChessColor) => void;
  onDifficultyChange: (difficulty: ChessAiDifficulty) => void;
  onTimeControlChange: (timeControl: TimeControlId) => void;
  onBoardThemeChange: (theme: BoardThemeId) => void;
  onShowCoordinatesChange: (show: boolean) => void;
  onSoundEnabledChange: (enabled: boolean) => void;
  onStart: () => void;
}) {
  return (
    <div className="dc-setup-screen">
      <div className="dc-setup-copy">
        <span className="dc-panel-kicker"><Bot className="h-4 w-4" aria-hidden /> New match setup</span>
        <h3>Choose your side and challenge the computer</h3>
        <p>White always moves first. Choose Black if you want the computer to open automatically, then play your reply.</p>
      </div>

      <div className="dc-setup-grid">
        <div className="dc-setup-card">
          <span className="dc-panel-kicker"><User className="h-4 w-4" aria-hidden /> Your side</span>
          <div className="dc-choice-row" role="group" aria-label="Choose your chess side">
            {(["white", "black"] as const).map((color) => (
              <button key={color} type="button" className={cn("dc-choice-pill", humanColor === color && "dc-choice-pill--active")} onClick={() => onHumanColorChange(color)}>
                {getTurnLabel(color)}
              </button>
            ))}
          </div>
        </div>

        <div className="dc-setup-card">
          <span className="dc-panel-kicker"><Bot className="h-4 w-4" aria-hidden /> Difficulty</span>
          <div className="dc-difficulty-list">
            {AI_DIFFICULTIES.map((option) => (
              <button key={option.id} type="button" className={cn("dc-difficulty-option", difficulty === option.id && "dc-difficulty-option--active")} onClick={() => onDifficultyChange(option.id)}>
                <strong>{option.label}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="dc-setup-card">
          <span className="dc-panel-kicker"><Timer className="h-4 w-4" aria-hidden /> Clock</span>
          <select className="dc-setup-select" value={timeControl} onChange={(event: ChangeEvent<HTMLSelectElement>) => onTimeControlChange(event.target.value as TimeControlId)}>
            {TIME_CONTROLS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="dc-setup-card">
          <span className="dc-panel-kicker"><Palette className="h-4 w-4" aria-hidden /> Board theme</span>
          <select className="dc-setup-select" value={boardTheme} onChange={(event: ChangeEvent<HTMLSelectElement>) => onBoardThemeChange(event.target.value as BoardThemeId)}>
            {BOARD_THEMES.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="dc-setup-toggles">
        <label className="dc-toggle-row">
          <input type="checkbox" checked={showCoordinates} onChange={(event) => onShowCoordinatesChange(event.target.checked)} />
          <span>{showCoordinates ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />} Show board coordinates</span>
        </label>
        <label className="dc-toggle-row">
          <input type="checkbox" checked={soundEnabled} onChange={(event) => onSoundEnabledChange(event.target.checked)} />
          <span>{soundEnabled ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />} Game sounds</span>
        </label>
      </div>

      <Button variant="primary" size="lg" onClick={onStart} leftIcon={<Play className="h-4 w-4" aria-hidden />}>
        Start game
      </Button>
    </div>
  );
}

function SettingsPanel({
  boardTheme,
  showCoordinates,
  soundEnabled,
  onBoardThemeChange,
  onShowCoordinatesChange,
  onSoundEnabledChange,
}: {
  boardTheme: BoardThemeId;
  showCoordinates: boolean;
  soundEnabled: boolean;
  onBoardThemeChange: (theme: BoardThemeId) => void;
  onShowCoordinatesChange: (show: boolean) => void;
  onSoundEnabledChange: (enabled: boolean) => void;
}) {
  return (
    <div className="dc-panel-card dc-settings-card">
      <span className="dc-panel-kicker"><Palette className="h-4 w-4" aria-hidden /> Board options</span>
      <label className="dc-settings-row">
        <span>Theme</span>
        <select className="dc-setup-select" value={boardTheme} onChange={(event: ChangeEvent<HTMLSelectElement>) => onBoardThemeChange(event.target.value as BoardThemeId)}>
          {BOARD_THEMES.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="dc-toggle-row dc-toggle-row--compact">
        <input type="checkbox" checked={showCoordinates} onChange={(event) => onShowCoordinatesChange(event.target.checked)} />
        <span>{showCoordinates ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />} Cell coordinates</span>
      </label>
      <label className="dc-toggle-row dc-toggle-row--compact">
        <input type="checkbox" checked={soundEnabled} onChange={(event) => onSoundEnabledChange(event.target.checked)} />
        <span>{soundEnabled ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />} Sounds</span>
      </label>
    </div>
  );
}

function EndScreen({
  status,
  winner,
  humanColor,
  moves,
  materialLead,
  onPlayAgain,
  onChangeSettings,
}: {
  status: ChessGameStatus;
  winner: ChessColor | null;
  humanColor: ChessColor;
  moves: number;
  materialLead: string;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}) {
  const title = getEndTitle(status, winner, humanColor);
  const detail = winner ? `${getTurnLabel(winner)} finished the game by ${readableStatus(status).toLowerCase()}.` : status === "stalemate" ? "No legal move is available, so the game is a draw." : "The match finished without a winner.";

  return (
    <div className="dc-end-screen" role="status" aria-live="polite">
      <div>
        <span className="dc-panel-kicker"><Trophy className="h-4 w-4" aria-hidden /> Game result</span>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <div className="dc-end-stats">
        <StatCard label="Moves" value={moves.toString()} />
        <StatCard label="Material" value={materialLead} />
      </div>
      <div className="dc-end-actions">
        <Button variant="primary" size="sm" onClick={onPlayAgain} leftIcon={<Play className="h-4 w-4" aria-hidden />}>Play again</Button>
        <Button variant="ghost" size="sm" onClick={onChangeSettings} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>Change setup</Button>
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

function getHeadline(currentStatus: ChessGameStatus, turn: ChessColor, winner: ChessColor | null, phase: GamePhase, computerThinking: boolean, humanColor: ChessColor): string {
  if (phase === "setup") return "Ready to start";
  if (computerThinking) return "Computer is thinking";
  if (currentStatus === "checkmate" && winner) return winner === humanColor ? "You win by checkmate" : "Computer wins by checkmate";
  if (currentStatus === "resigned" && winner) return winner === humanColor ? "You win by resignation" : "Computer wins by resignation";
  if (currentStatus === "timeout" && winner) return winner === humanColor ? "You win on time" : "Computer wins on time";
  if (currentStatus === "draw" || currentStatus === "stalemate") return currentStatus === "draw" ? "Draw" : "Stalemate — draw";
  if (currentStatus === "promotion") return `${getTurnLabel(turn)} promotion choice`;
  if (currentStatus === "check") return turn === humanColor ? "Your king is in check" : "Computer king is in check";
  return turn === humanColor ? "Your move" : "Computer to move";
}

function getStatusSubtext(currentStatus: ChessGameStatus, turn: ChessColor, winner: ChessColor | null, pendingPromotion: PendingPromotion | null, phase: GamePhase, computerThinking: boolean, humanColor: ChessColor, thinkingElapsedMs: number): string {
  if (phase === "setup") return "Choose side, difficulty, theme, coordinates, sound, and clock before entering the board.";
  if (computerThinking) return `The AI is calculating legal replies. Thinking time: ${formatThinkTime(thinkingElapsedMs)}.`;
  if (pendingPromotion) return "Choose queen, rook, bishop, or knight before the next turn begins.";
  if (currentStatus === "checkmate" && winner) return winner === humanColor ? "The computer has no legal escape." : "Your king has no legal escape.";
  if (currentStatus === "resigned" && winner) return winner === humanColor ? "The computer resigned." : "The match ended by resignation.";
  if (currentStatus === "timeout" && winner) return "A clock reached zero.";
  if (currentStatus === "draw") return "The match ended as a draw.";
  if (currentStatus === "stalemate") return "The current player has no legal move but is not in check.";
  if (currentStatus === "check") return "Only moves that protect the king are allowed.";
  return turn === humanColor ? PLAYER_HINTS[turn] : "Wait for the computer to calculate and respond automatically.";
}

function getGameOverMessage(currentStatus: ChessGameStatus, winner: ChessColor | null): string {
  if (winner) return `${getTurnLabel(winner)} already won by ${readableStatus(currentStatus).toLowerCase()}. Start a new game to play again.`;
  return "The match is finished. Start a new game to play again.";
}

function getEndTitle(currentStatus: ChessGameStatus, winner: ChessColor | null, humanColor: ChessColor): string {
  if (!winner) return currentStatus === "stalemate" ? "Draw by stalemate" : "Draw";
  return winner === humanColor ? "You won" : "Computer won";
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

function getSoundForMove(move: ChessMoveRecord, status: ChessGameStatus, winner: ChessColor | null, humanColor: ChessColor): ChessSoundEvent {
  if (winner) return winner === humanColor ? "win" : "lose";
  if (status === "stalemate" || status === "draw") return "draw";
  if (status === "check") return "check";
  if (move.captured) return "capture";
  return "move";
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

function formatThinkTime(milliseconds: number): string {
  if (milliseconds < 1000) return `${Math.max(0, milliseconds)}ms`;
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

function pickVisibleThinkMs(difficulty: ChessAiDifficulty): number {
  const range = VISIBLE_THINKING_RANGES[difficulty];
  return Math.round(range.min + Math.random() * (range.max - range.min));
}

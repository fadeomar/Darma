import type { ChessBoard, ChessColor, ChessCoord, ChessFile, ChessPiece, ChessPieceRole, ChessRank, ChessSquare } from "./chessTypes";

export const CHESS_FILES = ["A", "B", "C", "D", "E", "F", "G", "H"] as const satisfies readonly ChessFile[];
export const CHESS_RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const satisfies readonly ChessRank[];

const BACK_RANK: readonly ChessPieceRole[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

function coord(file: ChessFile, rank: ChessRank): ChessCoord {
  return `${file}${rank}`;
}

function piece(role: ChessPieceRole, color: ChessColor, file: ChessFile, rank: ChessRank): ChessPiece {
  return {
    id: `${color}-${role}-${file}${rank}`,
    role,
    color,
    hasMoved: false,
  };
}

function initialPiece(file: ChessFile, rank: ChessRank): ChessPiece | undefined {
  const fileIndex = CHESS_FILES.indexOf(file);

  if (rank === 1) return piece(BACK_RANK[fileIndex], "white", file, rank);
  if (rank === 2) return piece("pawn", "white", file, rank);
  if (rank === 7) return piece("pawn", "black", file, rank);
  if (rank === 8) return piece(BACK_RANK[fileIndex], "black", file, rank);

  return undefined;
}

export function createInitialChessBoard(): ChessBoard {
  return CHESS_RANKS.map((rank) =>
    CHESS_FILES.map((file) => ({
      file,
      rank,
      coord: coord(file, rank),
      piece: initialPiece(file, rank),
    })),
  );
}

export function getPieceAsset(pieceToRender: ChessPiece): string {
  return `/games/chess-mini/${pieceToRender.role}_${pieceToRender.color}.svg`;
}

export function getPieceLabel(pieceToRender: ChessPiece): string {
  return `${pieceToRender.color} ${pieceToRender.role}`;
}

export function findSquare(board: ChessBoard, targetCoord: ChessCoord): ChessSquare | undefined {
  for (const row of board) {
    const square = row.find((candidate) => candidate.coord === targetCoord);
    if (square) return square;
  }

  return undefined;
}

export function cloneBoard(board: ChessBoard): ChessBoard {
  return board.map((row) => row.map((square) => ({ ...square, piece: square.piece ? { ...square.piece } : undefined })));
}

export function isChessCoord(value: string): value is ChessCoord {
  if (value.length !== 2) return false;
  const file = value[0] as ChessFile;
  const rank = Number(value[1]) as ChessRank;
  return CHESS_FILES.includes(file) && Number.isInteger(rank) && rank >= 1 && rank <= 8;
}

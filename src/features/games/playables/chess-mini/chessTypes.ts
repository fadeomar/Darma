export type ChessColor = "white" | "black";

export type ChessPieceRole = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";

export type ChessPromotionRole = Exclude<ChessPieceRole, "pawn" | "king">;

export type ChessFile = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export type ChessRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ChessCoord = `${ChessFile}${ChessRank}`;

export type ChessPiece = {
  id: string;
  role: ChessPieceRole;
  color: ChessColor;
  hasMoved?: boolean;
};

export type ChessSquare = {
  file: ChessFile;
  rank: ChessRank;
  coord: ChessCoord;
  piece?: ChessPiece;
};

export type ChessBoard = ChessSquare[][];

export type ChessMoveSpecial = "castle-kingside" | "castle-queenside" | "en-passant" | "promotion";

export type ChessMoveTarget = {
  coord: ChessCoord;
  capture: boolean;
  checking?: boolean;
  special?: ChessMoveSpecial;
  promotion?: boolean;
};

export type CapturedPiece = ChessPiece & {
  capturedAt: ChessCoord;
};

export type ChessGameStatus = "ready" | "playing" | "check" | "checkmate" | "stalemate" | "promotion" | "draw" | "resigned" | "timeout";

export type ChessMoveRecord = {
  from: ChessCoord;
  to: ChessCoord;
  piece: ChessPiece;
  captured?: CapturedPiece;
  turn: ChessColor;
  statusAfter: ChessGameStatus;
  special?: ChessMoveSpecial;
  promotedTo?: ChessPromotionRole;
  notation?: string;
  isDoublePawnPush?: boolean;
};

export type PendingPromotion = {
  coord: ChessCoord;
  color: ChessColor;
  move: ChessMoveRecord;
};

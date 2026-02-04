"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessground } from "chessground";
import { Config } from "chessground/config";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import "@/app/globals.css"; // Ensure global styles are available

interface ChessBoardProps {
    onMove?: (fen: string, turn: "white" | "black", pgn?: string) => void;
    orientation?: "white" | "black";
    initialFen?: string;
    pgn?: string;
}

export default function ChessBoard({
    onMove,
    orientation = "white",
    initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    pgn,
}: ChessBoardProps) {
    const [chess] = useState(new Chess(initialFen));
    const ref = useRef<HTMLDivElement>(null);
    const [cg, setCg] = useState<ReturnType<typeof Chessground> | null>(null);

    // Initialize and sync board
    useEffect(() => {
        if (!ref.current) return;

        // Create or reuse API
        let api = cg;
        if (!api) {
            const config: Config = {
                fen: initialFen,
                orientation: orientation,
                viewOnly: false,
                turnColor: "white",
                animation: { enabled: true, duration: 200 },
                movable: {
                    color: "white",
                    free: false,
                    dests: toDests(chess),
                    events: {
                        after: (orig, dest) => {
                            try {
                                const move = chess.move({ from: orig, to: dest, promotion: "q" });
                                if (move) {
                                    const nextTurnColor = chess.turn() === "w" ? "white" : "black";
                                    api?.set({
                                        fen: chess.fen(),
                                        turnColor: nextTurnColor,
                                        movable: {
                                            color: nextTurnColor,
                                            dests: toDests(chess),
                                        },
                                        check: chess.inCheck(),
                                    });

                                    if (onMove) {
                                        onMove(chess.fen(), nextTurnColor, chess.pgn());
                                    }
                                }
                            } catch (e) {
                                console.log("Illegal move caught", e);
                                api?.set({ fen: chess.fen() });
                            }
                        },
                    },
                },
                premovable: { enabled: true },
                draggable: { enabled: true },
                selectable: { enabled: true },
                highlight: { lastMove: true, check: true }
            };
            api = Chessground(ref.current, config);
            setCg(api);
        }

        // Sync State
        let shouldUpdate = false;

        // 1. PGN Mode (Priority)
        // If a PGN provided, we treat it as source of truth and ignore FEN mismatch
        if (pgn) {
            if (pgn !== chess.pgn()) {
                try {
                    chess.loadPgn(pgn);
                    shouldUpdate = true;
                } catch (e) {
                    console.error("Failed to load PGN", e);
                }
            }
        }
        // 2. FEN Mode (Fallback)
        // Only check FEN if we are NOT in PGN mode (e.g. start of game or just position setup)
        else if (initialFen && initialFen !== chess.fen()) {
            try {
                chess.load(initialFen);
                shouldUpdate = true;
            } catch (e) {
                console.error("Failed to load FEN", e);
            }
        }

        // Apply updates to Chessground if state changed
        if (shouldUpdate && api) {
            const nextTurnColor = chess.turn() === "w" ? "white" : "black";
            api.set({
                fen: chess.fen(),
                turnColor: nextTurnColor,
                movable: {
                    color: nextTurnColor, // Always allow move for current turn side locally? 
                    // No, for multiplayer, we might want to restrict if it's not our turn.
                    // But ChessBoard is generic. Restriction happens via orientation/viewOnly or parent logic.
                    // Here we just allow the side whose turn it is to move on the board.
                    dests: toDests(chess)
                },
                check: chess.inCheck(),
            });
        }

        return () => {
            // Cleanup only if component unmounts? 
            // We moved API creation inside. If we return destroy here, it destroys on every render.
            // BAD. We want to destroy only on unmount.
        };

    }, [ref, orientation, chess, initialFen, pgn, onMove, cg]);

    // Cleanup on unmount only
    useEffect(() => {
        return () => {
            if (cg) cg.destroy();
        };
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div
                ref={ref}
                className="w-full h-full aspect-square"
                style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
        </div>
    );
}

// Helper to convert chess.js legal moves to chessground dests
function toDests(chess: Chess) {
    const dests = new Map();
    chess.moves({ verbose: true }).forEach((m) => {
        if (!dests.has(m.from)) dests.set(m.from, []);
        dests.get(m.from).push(m.to);
    });
    return dests;
}

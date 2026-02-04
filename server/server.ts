import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3001", "https://human-chess-v3.vercel.app"], // Allow both dev and production
        methods: ["GET", "POST"],
    },
});

interface Player {
    id: string;
    username: string;
    socketId: string;
}

let waitingPlayer: Player | null = null;

// Lobby stats tracking
let gamesCompletedToday = 0;
let lastResetDate = new Date().toDateString();
const waitTimes: number[] = []; // Track wait times in seconds
let searchStartTimes = new Map<string, number>(); // socketId -> timestamp

// Reset daily stats at midnight
setInterval(() => {
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
        gamesCompletedToday = 0;
        lastResetDate = today;
    }
}, 60000); // Check every minute

// Broadcast lobby stats every 5 seconds
setInterval(() => {
    const activePlayers = io.sockets.sockets.size;
    const avgWaitTime = waitTimes.length > 0
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 0;

    io.emit("LOBBY_STATS", {
        activePlayers,
        gamesCompletedToday,
        avgWaitTime
    });
}, 5000);

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("SEARCH_GAME", (data: { username: string }) => {
        console.log("Player searching:", data.username);

        // Record search start time
        searchStartTimes.set(socket.id, Date.now());

        // Simple matchmaking logic
        if (waitingPlayer) {
            if (waitingPlayer.socketId === socket.id) {
                console.log("Player already waiting:", data.username);
                return;
            }

            // Calculate wait time
            const waitTime = Math.round((Date.now() - (searchStartTimes.get(waitingPlayer.socketId) || Date.now())) / 1000);
            waitTimes.push(waitTime);
            if (waitTimes.length > 20) waitTimes.shift(); // Keep last 20 wait times

            // Clear search times
            searchStartTimes.delete(socket.id);
            searchStartTimes.delete(waitingPlayer.socketId);

            // Create game
            const gameId = `game_${Date.now()}`;
            const white = waitingPlayer;
            const black = { id: socket.id, username: data.username, socketId: socket.id };

            console.log(`Match found! ${white.username} vs ${black.username}`);

            // Join both sockets to the game room
            io.sockets.sockets.get(white.socketId)?.join(gameId);
            io.sockets.sockets.get(black.socketId)?.join(gameId);

            console.log(`Match found! ${white.username} vs ${black.username} in room ${gameId}`);

            // Notify players
            io.to(white.socketId).emit("GAME_FOUND", {
                gameId,
                color: "white",
                opponent: black.username,
                opponentElo: 1200 // Mock ELO
            });

            io.to(black.socketId).emit("GAME_FOUND", {
                gameId,
                color: "black",
                opponent: white.username,
                opponentElo: 1200 // Mock ELO
            });

            waitingPlayer = null;
        } else {
            waitingPlayer = { id: socket.id, username: data.username, socketId: socket.id };
        }
    });

    socket.on("MAKE_MOVE", (data: { gameId: string, move: string, nextTurn: "white" | "black", pgn?: string }) => {
        console.log(`Move in ${data.gameId}: ${data.move}`);
        socket.to(data.gameId).emit("OPPONENT_MOVE", {
            move: data.move,
            nextTurn: data.nextTurn,
            pgn: data.pgn // Relay the PGN to the opponent
        });
    });

    socket.on("GAME_OVER", (data: { gameId: string, winner: string }) => {
        gamesCompletedToday++;
        socket.to(data.gameId).emit("GAME_OVER", data);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        searchStartTimes.delete(socket.id);
        if (waitingPlayer?.socketId === socket.id) {
            waitingPlayer = null;
        }
    });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});

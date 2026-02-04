"use client";

import { io } from "socket.io-client";

// Connect to backend server
// In production, set NEXT_PUBLIC_SOCKET_URL to your deployed backend URL
const URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002";

export const socket = io(URL, {
    autoConnect: false,
});

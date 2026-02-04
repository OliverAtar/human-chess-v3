"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { socket } from "@/lib/socket";

import { Socket } from "socket.io-client";

interface SocketContextType {
    isConnected: boolean;
    socketId: string | undefined;
    socket: Socket | undefined;
}

const SocketContext = createContext<SocketContextType>({
    isConnected: false,
    socketId: undefined,
    socket: undefined,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
    const [isConnected, setIsConnected] = useState(false);
    const [socketId, setSocketId] = useState<string | undefined>();

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
            setSocketId(socket.id);
            console.log("Socket connected:", socket.id);
        }

        function onDisconnect() {
            setIsConnected(false);
            setSocketId(undefined);
            console.log("Socket disconnected");
        }

        // Initialize/check connection status
        if (socket.connected) {
            onConnect();
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        // Ensure connection is active
        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, []);

    return (
        <SocketContext.Provider value={{ isConnected, socketId, socket }}>
            {children}
        </SocketContext.Provider>
    );
}

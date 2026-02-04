'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface GameRecord {
    id: string;
    date: string;
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    pgn: string;
    opponentElo: number;
    eloChange: number;
}

interface GamesContextType {
    gamesPlayedToday: number;
    lastPlayedDate: string | null;
    humBalance: number;
    unclaimedTokens: number;
    history: GameRecord[];
    incrementGamesTerm: () => void;
    claimReward: () => void;
    saveGame: (record: Omit<GameRecord, 'id' | 'date'>) => void;
    resetAccount: () => void;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export function GamesProvider({ children }: { children: React.ReactNode }) {
    const [gamesPlayedToday, setGamesPlayedToday] = useState(0);
    const [lastPlayedDate, setLastPlayedDate] = useState<string | null>(null);
    const [humBalance, setHumBalance] = useState(90); // Initial balance for demo
    const [unclaimedTokens, setUnclaimedTokens] = useState(0);
    const [history, setHistory] = useState<GameRecord[]>([]);

    // Load state from local storage on mount
    useEffect(() => {
        const savedDate = localStorage.getItem('human_chess_last_date');
        const savedGames = parseInt(localStorage.getItem('human_chess_games_played') || '0');
        const savedBalance = parseInt(localStorage.getItem('human_chess_balance') || '90');
        const savedUnclaimed = parseInt(localStorage.getItem('human_chess_unclaimed') || '0');
        const savedHistory = JSON.parse(localStorage.getItem('human_chess_history') || '[]');

        const today = new Date().toDateString();

        if (savedDate !== today) {
            // New day, reset counter
            setGamesPlayedToday(0);
            setLastPlayedDate(today);
            localStorage.setItem('human_chess_last_date', today);
            localStorage.setItem('human_chess_games_played', '0');
            // Reset unclaimed for daily quest
            setUnclaimedTokens(0);
            localStorage.setItem('human_chess_unclaimed', '0');
        } else {
            setGamesPlayedToday(savedGames);
            setLastPlayedDate(savedDate);
            setUnclaimedTokens(savedUnclaimed);
        }
        setHumBalance(savedBalance);
        setHistory(savedHistory);
    }, []);

    const incrementGamesTerm = () => {
        const today = new Date().toDateString();

        // Check if new day
        if (lastPlayedDate !== today) {
            setLastPlayedDate(today);
            setGamesPlayedToday(1);
            setUnclaimedTokens(0);
            localStorage.setItem('human_chess_last_date', today);
            localStorage.setItem('human_chess_games_played', '1');
            localStorage.setItem('human_chess_unclaimed', '0');
            return;
        }

        const newCount = gamesPlayedToday + 1;
        setGamesPlayedToday(newCount);
        localStorage.setItem('human_chess_games_played', newCount.toString());

        // Check for quest completion (3rd game)
        if (newCount === 3) {
            setUnclaimedTokens(3);
            localStorage.setItem('human_chess_unclaimed', '3');
        }
    };

    const claimReward = () => {
        if (unclaimedTokens > 0) {
            const newBalance = humBalance + unclaimedTokens;
            setHumBalance(newBalance);
            setUnclaimedTokens(0);

            localStorage.setItem('human_chess_balance', newBalance.toString());
            localStorage.setItem('human_chess_unclaimed', '0');

            // In a real app, this is where we'd call MiniKit.commands.sendTransaction
            console.log("Tokens claimed! New balance:", newBalance);
        }
    };

    const saveGame = (record: Omit<GameRecord, 'id' | 'date'>) => {
        const newRecord: GameRecord = {
            ...record,
            id: crypto.randomUUID(),
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        };
        const newHistory = [newRecord, ...history];
        setHistory(newHistory);
        localStorage.setItem('human_chess_history', JSON.stringify(newHistory));
    };

    const resetAccount = () => {
        setGamesPlayedToday(0);
        setHumBalance(90);
        setUnclaimedTokens(0);
        setHistory([]);

        localStorage.removeItem('human_chess_games_played');
        localStorage.removeItem('human_chess_balance');
        localStorage.removeItem('human_chess_unclaimed');
        localStorage.removeItem('human_chess_history');
        localStorage.removeItem('human_chess_last_date');

        // Optional: reload to ensure full clean slate
        window.location.reload();
    };

    return (
        <GamesContext.Provider value={{
            gamesPlayedToday,
            lastPlayedDate,
            humBalance,
            unclaimedTokens,
            history,
            incrementGamesTerm,
            claimReward,
            saveGame,
            resetAccount
        }}>
            {children}
        </GamesContext.Provider>
    );
}

export function useGames() {
    const context = useContext(GamesContext);
    if (context === undefined) {
        throw new Error('useGames must be used within a GamesProvider');
    }
    return context;
}

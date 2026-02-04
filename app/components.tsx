// Play Screen (main matchmaking)
function PlayScreen({ username, elo, tokens, onPlay }: { username: string; elo: number; tokens: number; onPlay: () => void }) {
    return (
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 mb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-semibold">👤 {username}</h2>
                    <p className="text-zinc-400">ELO: {elo}</p>
                </div>
                <div className="bg-zinc-800 px-4 py-2 rounded-lg">
                    💰 {tokens}
                </div>
            </div>

            <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">10 MINUTE RAPID</h3>
                <p className="text-zinc-400 text-sm">Verified humans only</p>
            </div>

            <button
                onClick={onPlay}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xl py-8 px-6 rounded-2xl transition-all shadow-lg shadow-orange-500/20"
            >
                PLAY NOW
            </button>

            <div className="mt-6 space-y-2 text-sm text-zinc-400">
                <p>• Verified humans</p>
                <p>• 10 min per side</p>
                <p>• Play 3 games/day for tokens</p>
            </div>
        </div>
    );
}

// Lobby Info Screen
function LobbyInfoScreen() {
    return (
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 mb-20">
            <h2 className="text-2xl font-bold mb-6">🏠 Lobby</h2>

            <div className="space-y-4">
                <div className="bg-zinc-800 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Active Players</h3>
                    <p className="text-3xl font-bold text-orange-500">24</p>
                    <p className="text-sm text-zinc-400">Currently online</p>
                </div>

                <div className="bg-zinc-800 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Games Today</h3>
                    <p className="text-3xl font-bold text-green-400">156</p>
                    <p className="text-sm text-zinc-400">Completed matches</p>
                </div>

                <div className="bg-zinc-800 rounded-xl p-4">
                    <h3 className="font-semibold mb-2">Avg Wait Time</h3>
                    <p className="text-3xl font-bold text-blue-400">12s</p>
                    <p className="text-sm text-zinc-400">To find opponent</p>
                </div>
            </div>
        </div>
    );
}

// Account/Wallet Screen
function AccountScreen({ username, elo, tokens, gamesPlayed }: { username: string; elo: number; tokens: number; gamesPlayed: number }) {
    const unclaimed = gamesPlayed >= 3 ? 30 : 0;

    return (
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 mb-20">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1">👤 {username}</h2>
            </div>

            {/* Stats */}
            <div className="bg-zinc-800 rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-3 text-zinc-400">📊 Stats</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-zinc-400">ELO</span>
                        <span className="font-semibold">{elo}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Wins</span>
                        <span className="font-semibold">12</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Losses</span>
                        <span className="font-semibold">8</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Games today</span>
                        <span className="font-semibold">{gamesPlayed}/3 {gamesPlayed >= 3 && '✅'}</span>
                    </div>
                </div>
            </div>

            {/* Wallet */}
            <div className="bg-zinc-800 rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-zinc-400">💰 Wallet</h3>
                <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Balance</span>
                        <span className="font-semibold">{tokens} HCT</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Unclaimed</span>
                        <span className="font-semibold text-orange-400">{unclaimed} HCT</span>
                    </div>
                </div>

                {unclaimed > 0 && (
                    <button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all mb-3">
                        Claim {unclaimed} HCT
                    </button>
                )}

                <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 px-4 rounded-xl transition-all">
                    Withdraw to World Wallet
                </button>
            </div>
        </div>
    );
}

// Info Screen
function InfoScreen() {
    return (
        <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 mb-20">
            <h2 className="text-2xl font-bold mb-6">ℹ️ About Human Chess</h2>

            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2 text-orange-400">What is Human Chess?</h3>
                    <p className="text-sm text-zinc-300">
                        Play chess against verified humans using World ID. Win games to improve your ELO rating and earn crypto tokens.
                    </p>
                </div>

                <div>
                    <h3 className="font-semibold mb-2 text-orange-400">How to Earn Tokens</h3>
                    <p className="text-sm text-zinc-300 mb-2">
                        Play 3 games per day to earn 30 HCT tokens. Win or lose, participation counts!
                    </p>
                    <ul className="text-sm text-zinc-400 space-y-1 ml-4">
                        <li>• Game 1: Progress tracked</li>
                        <li>• Game 2: Keep going</li>
                        <li>• Game 3: Earn 30 HCT!</li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold mb-2 text-orange-400">ELO System</h3>
                    <p className="text-sm text-zinc-300">
                        Your skill rating starts at 1200. Win games to increase your ELO, lose to decrease it. Higher ELO = better player!
                    </p>
                </div>

                <div>
                    <h3 className="font-semibold mb-2 text-orange-400">Fair Play</h3>
                    <p className="text-sm text-zinc-300">
                        All players are verified with World ID to ensure you're playing against real humans, not bots.
                    </p>
                </div>

                <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-xs text-zinc-400 text-center">
                        Built with ❤️ for the World ID community
                    </p>
                </div>
            </div>
        </div>
    );
}

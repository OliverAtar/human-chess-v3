'use client';

import { useState, useEffect, useRef } from 'react';
import ChessBoard from './components/ChessBoard';
import { SocketProvider, useSocket } from './providers/SocketProvider';
import { GamesProvider, useGames } from './providers/GamesContext';

type Screen = 'onboarding' | 'lobby' | 'searching' | 'game' | 'victory' | 'defeat';
type Tab = 'play' | 'lobby' | 'account' | 'history' | 'info';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <SocketProvider>
        <GamesProvider>
          <HomeContent />
        </GamesProvider>
      </SocketProvider>
    </div>
  );
}

function HomeContent() {
  const { gamesPlayedToday, humBalance, unclaimedTokens, history, incrementGamesTerm, claimReward, saveGame } = useGames();
  const [screen, setScreen] = useState<Screen>('lobby');
  const [hasStarted, setHasStarted] = useState(false);
  const [username, setUsername] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [elo] = useState(1200);
  const [activeTab, setActiveTab] = useState<Tab>('play');

  // Game State
  const [gameId, setGameId] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");

  if (!hasStarted) {
    return <OnboardingScreen onComplete={(name) => {
      setUsername(name);
      // Check if this is a test verified account
      const verifiedAccounts = ['oliver', 'marlon'];
      setIsVerified(verifiedAccounts.includes(name.toLowerCase()));
      setHasStarted(true);
    }} />;
  }

  const showTabs = screen !== 'onboarding' && screen !== 'game' && screen !== 'searching';

  return (
    <div className="w-full max-w-md">
      {/* Tab-based content (only show when tabs are visible) */}
      {showTabs && (
        <>
          {activeTab === 'play' && screen === 'lobby' && <PlayScreen username={username} elo={elo} tokens={humBalance} isVerified={isVerified} onPlay={() => setScreen('searching')} />}
          {activeTab === 'play' && (screen === 'victory' || screen === 'defeat') && (
            screen === 'victory'
              ? <VictoryScreen gamesPlayed={gamesPlayedToday} unclaimed={unclaimedTokens} onClaim={claimReward} onPlayAgain={() => setScreen('lobby')} />
              : <DefeatScreen gamesPlayed={gamesPlayedToday} unclaimed={unclaimedTokens} onClaim={claimReward} onPlayAgain={() => setScreen('lobby')} />
          )}
          {activeTab === 'lobby' && <LobbyInfoScreen />}
          {activeTab === 'account' && <AccountScreen username={username} elo={elo} tokens={humBalance} gamesPlayed={gamesPlayedToday} unclaimed={unclaimedTokens} isVerified={isVerified} />}
          {activeTab === 'history' && <HistoryScreen history={history} />}
          {activeTab === 'info' && <InfoScreen />}
        </>
      )}

      {/* Game flow screens (no tabs) */}
      {screen === 'searching' && <SearchingScreen username={username} onCancel={() => setScreen('lobby')} onFound={(id, color, opponent) => {
        setGameId(id);
        setPlayerColor(color);
        setOpponentName(opponent);
        setScreen('game');
      }} />}
      {screen === 'game' && <GameScreen
        gameId={gameId}
        playerColor={playerColor}
        opponentName={opponentName}
        onWin={(pgn) => {
          incrementGamesTerm();
          const pgnString = typeof pgn === 'string' ? pgn : '';
          saveGame({ opponent: opponentName, result: 'win', pgn: pgnString, opponentElo: 1200, eloChange: 16 });
          setScreen('victory');
          setActiveTab('play');
        }}
        onLose={(pgn) => {
          incrementGamesTerm();
          const pgnString = typeof pgn === 'string' ? pgn : '';
          saveGame({ opponent: opponentName, result: 'loss', pgn: pgnString, opponentElo: 1200, eloChange: -16 });
          setScreen('defeat');
          setActiveTab('play');
        }}
        onResign={(pgn) => {
          incrementGamesTerm();
          const pgnString = typeof pgn === 'string' ? pgn : '';
          saveGame({ opponent: opponentName, result: 'loss', pgn: pgnString, opponentElo: 1200, eloChange: -16 });
          setScreen('defeat');
          setActiveTab('play');
        }}
        userElo={elo}
        opponentElo={1200}
      />}

      {/* Tab Bar */}
      {showTabs && <TabBar activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
}

// Keep helper components but update their props usage where needed
// ...

// Tab Bar Component
function TabBar({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-md mx-auto flex">
        <button
          onClick={() => onTabChange('play')}
          className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all duration-200 ${activeTab === 'play'
            ? 'text-amber-500'
            : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L12 8M12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8ZM12 14L12 22M8 22L16 22" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide uppercase">{activeTab === 'play' ? 'Play' : ''}</span>
        </button>
        <button
          onClick={() => onTabChange('lobby')}
          className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all duration-200 ${activeTab === 'lobby'
            ? 'text-amber-500'
            : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" />
            <path d="M9 22V12H15V22" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide uppercase">{activeTab === 'lobby' ? 'Lobby' : ''}</span>
        </button>
        <button
          onClick={() => onTabChange('account')}
          className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all duration-200 ${activeTab === 'account'
            ? 'text-amber-500'
            : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.834 2.855" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide uppercase">{activeTab === 'account' ? 'Account' : ''}</span>
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all duration-200 ${activeTab === 'history'
            ? 'text-amber-500'
            : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide uppercase">{activeTab === 'history' ? 'History' : ''}</span>
        </button>
        <button
          onClick={() => onTabChange('info')}
          className={`flex-1 py-4 flex flex-col items-center gap-1.5 transition-all duration-200 ${activeTab === 'info'
            ? 'text-amber-500'
            : 'text-zinc-500 hover:text-zinc-300'
            }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span className="text-[10px] font-medium tracking-wide uppercase">{activeTab === 'info' ? 'Info' : ''}</span>
        </button>
      </div>
    </div>
  );
}

// Onboarding Screen
function OnboardingScreen({ onComplete }: { onComplete: (username: string) => void }) {
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">HUMAN CHESS</h1>
          <p className="text-zinc-300">Play verified humans. Earn crypto.</p>
        </div>

        <div className="bg-black rounded-3xl p-8 border border-white/5">
          <button className="w-full bg-white hover:bg-zinc-100 text-black font-semibold py-4 px-6 rounded-2xl transition-all mb-6 flex items-center justify-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
            Verify with World ID
          </button>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-zinc-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Enter your username"
            />
          </div>

          <button
            onClick={() => username && onComplete(username)}
            disabled={!username}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 px-6 rounded-2xl transition-all"
          >
            Start Playing
          </button>
        </div>
      </div>
    </div>
  );
}

// Play Screen (main matchmaking)
function PlayScreen({ username, elo, tokens, isVerified, onPlay }: { username: string; elo: number; tokens: number; isVerified: boolean; onPlay: () => void }) {
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);

  const handlePlayClick = () => {
    if (!isVerified) {
      setShowVerifyPopup(true);
    } else {
      onPlay();
    }
  };

  return (
    <div className="bg-black rounded-3xl p-8 border border-white/5 mb-20 relative">
      {/* Verification Popup */}
      {showVerifyPopup && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl p-6">
          <div className="bg-zinc-900 border border-amber-500/20 rounded-2xl p-6 text-center max-w-xs shadow-2xl">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verification Required</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Please verify you are a human with World ID to play ranked matches.
            </p>
            <div className="space-y-3">
              <button className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl hover:bg-zinc-200 transition-colors">
                Verify with World ID
              </button>
              <button
                onClick={() => setShowVerifyPopup(false)}
                className="text-zinc-500 text-sm hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
            <span className="text-xl">👤</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight">{username}</h2>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-sm font-medium">ELO {elo}</span>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
          <span className="font-mono text-white text-sm font-bold tracking-wide">{tokens} HUM</span>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="mb-8">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Verified Humans Only
          </div>
        </div>

        <button
          onClick={handlePlayClick}
          className="group w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold text-xl py-6 rounded-2xl shadow-lg shadow-orange-900/20 transition-all transform active:scale-[0.98] border border-orange-500/20"
        >
          <span className="flex items-center justify-center gap-3">
            PLAY 10 MIN GAME
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:translate-x-1 transition-transform">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </span>
        </button>
      </div>

      {/* Features / Info */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center flex flex-col items-center gap-1">
          <span className="text-lg">🛡️</span>
          <span className="text-[10px] text-zinc-400 font-medium uppercase leading-tight">Bot-Free<br />Zone</span>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center flex flex-col items-center gap-1">
          <span className="text-lg">⏱️</span>
          <span className="text-[10px] text-zinc-400 font-medium uppercase leading-tight">Rapid<br />Format</span>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center flex flex-col items-center gap-1">
          <span className="text-lg">🪙</span>
          <span className="text-[10px] text-zinc-400 font-medium uppercase leading-tight">Earn<br />Tokens</span>
        </div>
      </div>
    </div>
  );
}
// Info Screen
function InfoScreen() {
  return (
    <div className="bg-black rounded-3xl p-8 border border-white/5 mb-20">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Human Chess</h2>
        <p className="text-zinc-400 text-sm">v1.0.0 • World ID Verified</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
          <h3 className="font-bold mb-2 text-white flex items-center gap-2">
            <span className="text-lg">♟️</span> What is this?
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Play chess against verified humans. Win games to improve your ELO rating and earn crypto tokens. No bots allowed.
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
          <h3 className="font-bold mb-2 text-white flex items-center gap-2">
            <span className="text-lg">🪙</span> Daily Rewards
          </h3>
          <p className="text-sm text-zinc-400 mb-3">
            Play 3 games every day to earn 3 HUM tokens.
          </p>
          <div className="flex gap-2 text-xs">
            <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">Game 1</span>
            <span className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">Game 2</span>
            <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded border border-amber-500/30 font-bold">Game 3 = 3 HUM</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-orange-400 font-bold mb-1">ELO System</div>
            <p className="text-xs text-zinc-500">Standard rating. Win to gain, lose to drop.</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-blue-400 font-bold mb-1">Fair Play</div>
            <p className="text-xs text-zinc-500">100% Verified Humans via World ID.</p>
          </div>
        </div>

        <div className="pt-4 text-center">
          <p className="text-xs text-zinc-600">
            Built for the Superchain
          </p>
        </div>
      </div>
    </div>
  );
}
// Lobby Info Screen
function LobbyInfoScreen() {
  const { socket } = useSocket();
  const [stats, setStats] = useState({ activePlayers: 0, gamesCompletedToday: 0, avgWaitTime: 0 });

  useEffect(() => {
    if (!socket) return;

    socket.on("LOBBY_STATS", (data: { activePlayers: number; gamesCompletedToday: number; avgWaitTime: number }) => {
      setStats(data);
    });

    return () => {
      socket.off("LOBBY_STATS");
    };
  }, [socket]);

  return (
    <div className="bg-black rounded-3xl p-8 border border-white/5 mb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white leading-none">Live Lobby</h2>
          <p className="text-zinc-400 text-sm">Server Status: Online</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400 font-medium">Online Players</p>
            <p className="text-3xl font-bold text-white mt-1">{stats.activePlayers}</p>
          </div>
          <div className="text-4xl opacity-20">🌍</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-2">Games Today</p>
            <p className="text-2xl font-bold text-green-400">{stats.gamesCompletedToday}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide mb-2">Avg Wait</p>
            <p className="text-2xl font-bold text-blue-400">{stats.avgWaitTime}s</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-2xl p-5 border border-white/5 mt-2">
          <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              <span className="text-zinc-400">New match started: <span className="text-zinc-300">alex vs sarah</span></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span className="text-zinc-400">Game completed: <span className="text-zinc-300">marlon won (+12)</span></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
              <span className="text-zinc-400">New player verified: <span className="text-zinc-300">kyle_dev</span></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Account/Wallet Screen


// History Screen
function HistoryScreen({ history }: { history: any[] }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="bg-black rounded-3xl p-6 border border-white/5 mb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Game History</h2>
        <span className="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700">{history.length} GAMES</span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
          <p className="text-zinc-500 mb-2">No games played yet</p>
          <p className="text-xs text-zinc-600">Play a match to see it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((game, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border ${game.result === 'win' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {game.result === 'win' ? 'W' : game.result === 'draw' ? 'D' : 'L'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">vs {game.opponent}</div>
                    <div className="text-xs text-zinc-500">{game.date} • Ranked</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-mono font-bold ${game.eloChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {game.eloChange > 0 ? '+' : ''}{game.eloChange}
                  </div>
                  <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider mt-0.5">ELO Change</div>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`https://lichess.org/analysis/pgn/${encodeURIComponent(game.pgn)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2.5 px-3 rounded-lg text-center transition-all border border-white/5 flex items-center justify-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Analyze
                </a>
                <button
                  onClick={() => copyToClipboard(game.pgn)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold py-2.5 px-3 rounded-lg transition-all border border-white/5"
                >
                  Copy PGN
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Lobby Screen (OLD - keeping for reference, not used in tabs)
function LobbyScreen({ username, elo, tokens, onPlay }: { username: string; elo: number; tokens: number; onPlay: () => void }) {
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

// Searching Screen
function SearchingScreen({ username, onCancel, onFound }: { username: string; onCancel: () => void; onFound: (gameId: string, color: "white" | "black", opponent: string) => void }) {
  const { socket } = useSocket();
  const hasSearched = useRef(false);

  useEffect(() => {
    if (!socket) return;

    // Listeners must always be attached
    const onGameFound = (data: { gameId: string, color: "white" | "black", opponent: string }) => {
      onFound(data.gameId, data.color, data.opponent);
    };

    socket.on("GAME_FOUND", onGameFound);

    // Emit search only once
    if (!hasSearched.current) {
      hasSearched.current = true;
      socket.emit("SEARCH_GAME", { username });
    }

    return () => {
      socket.off("GAME_FOUND", onGameFound);
    };
  }, [socket, username, onFound]);

  return (
    <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center">
      <div className="mb-8">
        <div className="inline-block animate-spin text-6xl mb-4">♟️</div>
        <h2 className="text-2xl font-bold mb-2">Searching for opponent...</h2>
        <p className="text-zinc-400">Finding a verified human</p>
      </div>

      <button
        onClick={onCancel}
        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-xl transition-all"
      >
        Cancel
      </button>
    </div>
  );
}

// Game Screen
function GameScreen({ gameId, playerColor, opponentName, onWin, onLose, onResign, userElo, opponentElo }: { gameId: string | null; playerColor: "white" | "black"; opponentName: string; onWin: (pgn?: string) => void; onLose: (pgn?: string) => void; onResign: (pgn?: string) => void; userElo: number; opponentElo: number }) {
  // Timer state
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(600);
  const [activeColor, setActiveColor] = useState<'white' | 'black'>('white');
  const [isGameOver, setIsGameOver] = useState(false);
  const { socket } = useSocket();
  const [fen, setFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const currentPgn = useRef<string>("");
  const [pgnState, setPgnState] = useState<string>("");

  useEffect(() => {
    if (!socket) return;

    socket.on("OPPONENT_MOVE", (data: { move: string, nextTurn: "white" | "black", pgn?: string }) => {
      // data.move would be the new FEN or Move object
      setFen(data.move);
      setActiveColor(data.nextTurn);
      if (data.pgn) {
        currentPgn.current = data.pgn;
        setPgnState(data.pgn);
      }
    });

    socket.on("GAME_OVER", (data: { winner: string }) => {
      setIsGameOver(true);
      // If winner is me (based on color), call onWin, else onLose
      // However, the event might come from opponent resigning, so 'winner' logic needs to simply check if I am the winner
      // For simplicity, let's assume data.winner is the COLOR of the winner
      if (data.winner === playerColor) {
        onWin(currentPgn.current);
      } else {
        onLose(currentPgn.current);
      }
    });

    return () => {
      socket.off("OPPONENT_MOVE");
      socket.off("GAME_OVER");
    };
  }, [socket, playerColor, onWin, onLose]);

  const handleMove = (newFen: string, nextTurn: "white" | "black", pgn?: string) => {
    setActiveColor(nextTurn);
    setFen(newFen); // Update local FEN immediately to stay in sync
    if (pgn) {
      currentPgn.current = pgn;
      setPgnState(pgn);
    }
    if (socket && gameId) {
      socket.emit("MAKE_MOVE", { gameId, move: newFen, nextTurn, pgn }); // Send PGN
    }
  };

  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      if (activeColor === 'white') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            setIsGameOver(true);
            if (playerColor === 'white') onLose(currentPgn.current); else onWin(currentPgn.current);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            setIsGameOver(true);
            if (playerColor === 'black') onLose(currentPgn.current); else onWin(currentPgn.current);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeColor, isGameOver, onLose, onWin, playerColor]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      {/* Opponent Clock */}
      <div className={`flex items-center justify-between mb-4 p-3 rounded-xl transition-all ${activeColor === (playerColor === 'white' ? 'black' : 'white') ? 'bg-orange-900/20 border border-orange-500/30' : 'bg-zinc-800 border border-transparent'}`}>
        <div>
          <span className="font-semibold text-white">{playerColor === 'white' ? '⚫' : '⚪'} {opponentName}</span>
          <span className="ml-2 text-sm text-zinc-400">({opponentElo})</span>
        </div>
        <span className={`text-2xl font-mono ${activeColor === (playerColor === 'white' ? 'black' : 'white') ? 'text-orange-400' : 'text-zinc-500'}`}>
          {playerColor === 'white' ? formatTime(blackTime) : formatTime(whiteTime)}
        </span>
      </div>

      {/* Chess Board */}
      <div className="aspect-square bg-zinc-800 rounded-xl mb-4 overflow-hidden border-2 border-zinc-700">
        <ChessBoard
          orientation={playerColor}
          initialFen={fen}
          pgn={pgnState}
          onMove={handleMove}
        />
      </div>

      {/* Player Clock */}
      <div className={`flex items-center justify-between mb-4 p-3 rounded-xl transition-all ${activeColor === playerColor ? 'bg-orange-900/20 border border-orange-500/30' : 'bg-zinc-800 border border-transparent'}`}>
        <div>
          <span className="font-semibold text-white">{playerColor === 'white' ? '⚪' : '⚫'} You</span>
          <span className="ml-2 text-sm text-zinc-400">({userElo})</span>
        </div>
        <span className={`text-2xl font-mono ${activeColor === playerColor ? 'text-orange-400' : 'text-zinc-500'}`}>
          {playerColor === 'white' ? formatTime(whiteTime) : formatTime(blackTime)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            // Emit resignation
            socket?.emit("GAME_OVER", { gameId, winner: playerColor === 'white' ? 'black' : 'white' });
            onResign(currentPgn.current);
          }}
          className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/20 px-6 py-3 rounded-xl font-semibold transition-all"
        >
          Resign
        </button>
      </div>
    </div>
  );
}

// Victory Screen
function VictoryScreen({ gamesPlayed, unclaimed, onClaim, onPlayAgain }: { gamesPlayed: number; unclaimed: number; onClaim: () => void; onPlayAgain: () => void }) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center mb-20">
      <div className="mb-8">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold mb-4">VICTORY!</h2>
        <p className="text-xl text-green-400 mb-6">+16 ELO → 1216</p>

        <div className="bg-zinc-800 rounded-xl p-4 mb-4">
          <p className="text-zinc-400 mb-1">Games today: {gamesPlayed}/3</p>
          {gamesPlayed < 3 && <p className="text-sm text-amber-400">(Play {3 - gamesPlayed} more for 3 HUM!)</p>}
          {gamesPlayed >= 3 && unclaimed > 0 && (
            <button
              onClick={onClaim}
              className="mt-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition-all font-bold"
            >
              Claim {unclaimed} HUM
            </button>
          )}
          {gamesPlayed >= 3 && unclaimed === 0 && <p className="text-sm text-green-400">✅ Quest complete! Tokens claimed.</p>}
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onPlayAgain}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// Defeat Screen
function DefeatScreen({ gamesPlayed, unclaimed, onClaim, onPlayAgain }: { gamesPlayed: number; unclaimed: number; onClaim: () => void; onPlayAgain: () => void }) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center mb-20">
      <div className="mb-8">
        <div className="text-6xl mb-4">😔</div>
        <h2 className="text-3xl font-bold mb-4">DEFEAT</h2>
        <p className="text-xl text-red-400 mb-6">-16 ELO → 1184</p>

        <div className="bg-zinc-800 rounded-xl p-4 mb-4">
          <p className="text-zinc-400 mb-1">Games today: {gamesPlayed}/3</p>
          {gamesPlayed < 3 && <p className="text-sm text-orange-400">(Play {3 - gamesPlayed} more for 3 HUM!)</p>}
          {gamesPlayed >= 3 && unclaimed > 0 && (
            <button
              onClick={onClaim}
              className="mt-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition-all font-bold"
            >
              Claim {unclaimed} HUM
            </button>
          )}
          {gamesPlayed >= 3 && unclaimed === 0 && <p className="text-sm text-green-400">✅ Quest complete! Tokens claimed.</p>}
        </div>
      </div>

      <button
        onClick={onPlayAgain}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all"
      >
        Play Again
      </button>
    </div>
  );
}

// Wallet Screen
function AccountScreen({ username, elo, tokens, gamesPlayed, unclaimed, isVerified }: { username: string; elo: number; tokens: number; gamesPlayed: number; unclaimed: number; isVerified: boolean }) {
  const { resetAccount, claimReward, history } = useGames();

  // Calculate stats from history
  const wins = history.filter(g => g.result === 'win').length;
  const losses = history.filter(g => g.result === 'loss').length;
  const draws = history.filter(g => g.result === 'draw').length;

  return (
    <div className="bg-black rounded-3xl p-8 border border-white/5 mb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
          <span className="text-3xl">👤</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{username}</h2>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isVerified ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
              {isVerified ? 'Verified Human' : 'Unverified'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
        Stats
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">ELO Rating</div>
          <div className="text-3xl font-bold text-white">{elo}</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm">
          <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">HUM Tokens</div>
          <div className="text-3xl font-bold text-amber-500">{tokens}</div>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Games played today</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{gamesPlayed}/3</span>
              {gamesPlayed >= 3 && <span className="text-green-400 text-xs bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">COMPLETED</span>}
            </div>
          </div>
          <div className="w-full bg-zinc-800/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min((gamesPlayed / 3) * 100, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
            <div className="text-center">
              <div className="text-xs text-zinc-400 mb-1">Wins</div>
              <div className="text-lg font-bold text-green-400">{wins}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-zinc-400 mb-1">Losses</div>
              <div className="text-lg font-bold text-red-400">{losses}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-zinc-400 mb-1">Draws</div>
              <div className="text-lg font-bold text-zinc-400">{draws}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet */}
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
        Wallet
      </h3>

      <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Total Balance</div>
            <div className="text-2xl font-bold text-white">{tokens} HUM</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Unclaimed</div>
            <div className={`text-xl font-bold ${unclaimed > 0 ? 'text-orange-400' : 'text-zinc-500'}`}>{unclaimed} HUM</div>
          </div>
        </div>

        {unclaimed > 0 && (
          <button
            onClick={claimReward}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl transition-all mb-3 shadow-lg shadow-orange-900/20"
          >
            Claim {unclaimed} HUM
          </button>
        )}

        <button className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-6 rounded-xl transition-all border border-white/5 mb-3">
          Withdraw to World Wallet
        </button>

        <button
          onClick={resetAccount}
          className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold py-3 px-4 rounded-xl transition-all border border-red-500/10"
        >
          Reset Account Data (Dev)
        </button>
      </div>
    </div>
  );
}

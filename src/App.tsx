/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { PlayerSetup } from './components/PlayerSetup';
import { LaBombaGame } from './components/LaBombaGame';
import { Player, GameConfig } from './types';

type AppView = 'MENU' | 'SETUP' | 'GAME';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('MENU');
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    startingLives: 3,
    allowedMistakesPerRound: 3,
  });

  const handleSelectGame = (gameId: string) => {
    if (gameId === 'la-bomba') {
      setCurrentView('SETUP');
    }
  };

  const handleStartGame = (players: Player[], config: GameConfig) => {
    setGamePlayers(players);
    setGameConfig(config);
    setCurrentView('GAME');
  };

  const handleBackToMenu = () => {
    setCurrentView('MENU');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {currentView === 'MENU' && (
        <MainMenu onSelectGame={handleSelectGame} />
      )}

      {currentView === 'SETUP' && (
        <PlayerSetup
          onStartGame={handleStartGame}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {currentView === 'GAME' && (
        <LaBombaGame
          initialPlayers={gamePlayers}
          gameConfig={gameConfig}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}

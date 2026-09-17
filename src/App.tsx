/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { PlayerSetup } from './components/PlayerSetup';
import { LaBombaGame } from './components/LaBombaGame';
import { LaPeorRespuestaSetup } from './components/LaPeorRespuestaSetup';
import { LaPeorRespuestaGame } from './components/LaPeorRespuestaGame';
import { Player, GameConfig, LPRPlayer, LaPeorRespuestaConfig } from './types';

type AppView = 'MENU' | 'SETUP' | 'GAME' | 'LPR_SETUP' | 'LPR_GAME';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('MENU');

  // La Bomba state
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    startingLives: 3,
    allowedMistakesPerRound: 3,
  });

  // La Peor Respuesta state
  const [lprPlayers, setLprPlayers] = useState<LPRPlayer[]>([]);
  const [lprConfig, setLprConfig] = useState<LaPeorRespuestaConfig>({
    totalRounds: 10,
  });

  const handleSelectGame = (gameId: string) => {
    if (gameId === 'la-bomba') {
      setCurrentView('SETUP');
    } else if (gameId === 'la-peor-respuesta') {
      setCurrentView('LPR_SETUP');
    }
  };

  // La Bomba handlers
  const handleStartGame = (players: Player[], config: GameConfig) => {
    setGamePlayers(players);
    setGameConfig(config);
    setCurrentView('GAME');
  };

  // La Peor Respuesta handlers
  const handleStartLPRGame = (players: LPRPlayer[], config: LaPeorRespuestaConfig) => {
    setLprPlayers(players);
    setLprConfig(config);
    setCurrentView('LPR_GAME');
  };

  const handleBackToMenu = () => {
    setCurrentView('MENU');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {currentView === 'MENU' && (
        <MainMenu onSelectGame={handleSelectGame} />
      )}

      {/* LA BOMBA */}
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

      {/* LA PEOR RESPUESTA */}
      {currentView === 'LPR_SETUP' && (
        <LaPeorRespuestaSetup
          onStartGame={handleStartLPRGame}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {currentView === 'LPR_GAME' && (
        <LaPeorRespuestaGame
          initialPlayers={lprPlayers}
          config={lprConfig}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}


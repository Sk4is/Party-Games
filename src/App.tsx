/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MainMenu } from './components/MainMenu';
import { PlayerSetup } from './components/PlayerSetup';
import { LaBombaGame } from './components/LaBombaGame';
import { LaPeorRespuestaSetup } from './components/LaPeorRespuestaSetup';
import { LaPeorRespuestaGame } from './components/LaPeorRespuestaGame';
import { PinturilloGame } from './components/pinturillo/PinturilloGame';
import { Player, GameConfig, LPRPlayer, LaPeorRespuestaConfig } from './types';

type AppView = 'MENU' | 'SETUP' | 'GAME' | 'LPR_SETUP' | 'LPR_GAME' | 'PINTURILLO';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    // Check if user came from a shared invitation link for Pinturillo
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('game') === 'pinturillo' || params.get('room')) {
        return 'PINTURILLO';
      }
    }
    return 'MENU';
  });

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
    } else if (gameId === 'pinturillo') {
      setCurrentView('PINTURILLO');
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
    // Clear URL parameters if any so user returns cleanly to menu
    if (window.history.pushState) {
      const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
    setCurrentView('MENU');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {currentView === 'MENU' && (
        <MainMenu onSelectGame={handleSelectGame} />
      )}

      {/* 1. LA BOMBA */}
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

      {/* 2. LA PEOR RESPUESTA */}
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

      {/* 3. PINTURILLO ONLINE */}
      {currentView === 'PINTURILLO' && (
        <PinturilloGame onBackToMenu={handleBackToMenu} />
      )}
    </div>
  );
}


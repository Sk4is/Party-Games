/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { PlayerSetup } from './components/PlayerSetup';
import { LaBombaGame } from './components/LaBombaGame';
import { BombaOnlineContainer } from './components/bomba/BombaOnlineContainer';
import { LaPeorRespuestaSetup } from './components/LaPeorRespuestaSetup';
import { LaPeorRespuestaGame } from './components/LaPeorRespuestaGame';
import { LPROnlineContainer } from './components/lpr/LPROnlineContainer';
import { PinturilloGame } from './components/pinturillo/PinturilloGame';
import { PalabraSecretaGame } from './components/palabra-secreta/PalabraSecretaGame';
import { CodigoRojoGame } from './components/codigo-rojo/CodigoRojoGame';
import { Player, GameConfig, LPRPlayer, LaPeorRespuestaConfig } from './types';
import { sessionRecovery } from './services/sessionRecovery';

type AppView =
  | 'MENU'
  | 'BOMBA_ONLINE'
  | 'LPR_ONLINE'
  | 'PINTURILLO'
  | 'PALABRA_SECRETA'
  | 'CODIGO_ROJO'
  | 'BOMBA_LOCAL_SETUP'
  | 'BOMBA_LOCAL_GAME'
  | 'LPR_LOCAL_SETUP'
  | 'LPR_LOCAL_GAME';

export default function App() {
  const activeSession = sessionRecovery.getActiveSession();

  const [urlRoomCode, setUrlRoomCode] = useState<string>(() => {
    if (activeSession?.roomCode) return activeSession.roomCode;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('room') || '';
    }
    return '';
  });

  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (activeSession) {
      if (activeSession.gameType === 'la-bomba') return 'BOMBA_ONLINE';
      if (activeSession.gameType === 'la-peor-respuesta') return 'LPR_ONLINE';
      if (activeSession.gameType === 'pinturillo') return 'PINTURILLO';
      if (activeSession.gameType === 'palabra-secreta') return 'PALABRA_SECRETA';
      if ((activeSession.gameType as string) === 'codigo-rojo') return 'CODIGO_ROJO';
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const game = params.get('game');
      const room = params.get('room');

      if (game === 'la-bomba') return 'BOMBA_ONLINE';
      if (game === 'la-peor-respuesta') return 'LPR_ONLINE';
      if (game === 'pinturillo') return 'PINTURILLO';
      if (game === 'palabra-secreta') return 'PALABRA_SECRETA';
      if (game === 'codigo-rojo') return 'CODIGO_ROJO';
      if (room) {
        return 'PINTURILLO';
      }
    }
    return 'MENU';
  });

  // Local modes state (optional pass-and-play fallbacks)
  const [gamePlayers, setGamePlayers] = useState<Player[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    startingLives: 3,
    allowedMistakesPerRound: 3,
  });

  const [lprPlayers, setLprPlayers] = useState<LPRPlayer[]>([]);
  const [lprConfig, setLprConfig] = useState<LaPeorRespuestaConfig>({
    totalRounds: 10,
  });

  const handleSelectGame = (gameId: string) => {
    if (gameId === 'la-bomba') {
      setCurrentView('BOMBA_ONLINE');
    } else if (gameId === 'la-peor-respuesta') {
      setCurrentView('LPR_ONLINE');
    } else if (gameId === 'pinturillo') {
      setCurrentView('PINTURILLO');
    } else if (gameId === 'palabra-secreta') {
      setCurrentView('PALABRA_SECRETA');
    } else if (gameId === 'codigo-rojo') {
      setCurrentView('CODIGO_ROJO');
    }
  };

  const handleBackToMenu = () => {
    sessionRecovery.clearActiveSession();
    setUrlRoomCode('');
    setCurrentView('MENU');
  };

  const handleSwitchGame = (
    game: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo',
    code: string
  ) => {
    setUrlRoomCode(code);
    if (game === 'la-bomba') setCurrentView('BOMBA_ONLINE');
    else if (game === 'la-peor-respuesta') setCurrentView('LPR_ONLINE');
    else if (game === 'pinturillo') setCurrentView('PINTURILLO');
    else if (game === 'palabra-secreta') setCurrentView('PALABRA_SECRETA');
    else if (game === 'codigo-rojo') setCurrentView('CODIGO_ROJO');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {currentView === 'MENU' && (
        <MainMenu onSelectGame={handleSelectGame} />
      )}

      {/* 1. LA BOMBA (ONLINE MULTIPLAYER) */}
      {currentView === 'BOMBA_ONLINE' && (
        <BombaOnlineContainer
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 2. LA PEOR RESPUESTA (ONLINE MULTIPLAYER) */}
      {currentView === 'LPR_ONLINE' && (
        <LPROnlineContainer
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 3. PINTURILLO (ONLINE MULTIPLAYER) */}
      {currentView === 'PINTURILLO' && (
        <PinturilloGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 4. PALABRA SECRETA (ONLINE MULTIPLAYER) */}
      {currentView === 'PALABRA_SECRETA' && (
        <PalabraSecretaGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 5. CÓDIGO ROJO (ONLINE MULTIPLAYER COOPERATIVE) */}
      {currentView === 'CODIGO_ROJO' && (
        <CodigoRojoGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* OPTIONAL LOCAL PASS-AND-PLAY FALLBACKS */}
      {currentView === 'BOMBA_LOCAL_SETUP' && (
        <PlayerSetup
          onStartGame={(p, c) => {
            setGamePlayers(p);
            setGameConfig(c);
            setCurrentView('BOMBA_LOCAL_GAME');
          }}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {currentView === 'BOMBA_LOCAL_GAME' && (
        <LaBombaGame
          initialPlayers={gamePlayers}
          gameConfig={gameConfig}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {currentView === 'LPR_LOCAL_SETUP' && (
        <LaPeorRespuestaSetup
          onStartGame={(p, c) => {
            setLprPlayers(p);
            setLprConfig(c);
            setCurrentView('LPR_LOCAL_GAME');
          }}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {currentView === 'LPR_LOCAL_GAME' && (
        <LaPeorRespuestaGame
          initialPlayers={lprPlayers}
          config={lprConfig}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}

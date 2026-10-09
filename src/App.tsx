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
import { CoartadaGame } from './components/coartada/CoartadaGame';
import { EntreToposGame } from './components/entre-topos/EntreToposGame';
import { CantinaGame } from './components/cantina/CantinaGame';
import { FortunariumGame } from './components/fortunarium/FortunariumGame';
import { LaCriptaGame } from './components/la-cripta/LaCriptaGame';
import { DarkProtocolGame } from './components/dark-protocol/DarkProtocolGame';
import { CuantoTeAtrevesGame } from './components/cuanto-te-atreves/CuantoTeAtrevesGame';
import { UnoSobraGame } from './components/uno-sobra/UnoSobraGame';
import { ElPrecioJustoGame } from './components/el-precio-justo/ElPrecioJustoGame';
import { Player, GameConfig, LPRPlayer, LaPeorRespuestaConfig } from './types';
import { sessionRecovery } from './services/sessionRecovery';
import { BackendConnectingModal } from './components/common/BackendConnectingModal';

type AppView =
  | 'MENU'
  | 'BOMBA_ONLINE'
  | 'LPR_ONLINE'
  | 'PINTURILLO'
  | 'PALABRA_SECRETA'
  | 'CODIGO_ROJO'
  | 'COARTADA'
  | 'ENTRE_TOPOS'
  | 'CANTINA'
  | 'FORTUNARIUM'
  | 'LA_CRIPTA'
  | 'DARK_PROTOCOL'
  | 'CUANTO_TE_ATREVES'
  | 'UNO_SOBRA'
  | 'EL_PRECIO_JUSTO'
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
      if ((activeSession.gameType as string) === 'coartada') return 'COARTADA';
      if ((activeSession.gameType as string) === 'entre-topos') return 'ENTRE_TOPOS';
      if (
        (activeSession.gameType as string) === 'la_cantina_del_farol' ||
        (activeSession.gameType as string) === 'la-cantina-del-farol'
      ) {
        return 'CANTINA';
      }
      if ((activeSession.gameType as string) === 'fortunarium') {
        return 'FORTUNARIUM';
      }
      if ((activeSession.gameType as string) === 'la-cripta') {
        return 'LA_CRIPTA';
      }
      if ((activeSession.gameType as string) === 'dark-protocol') {
        return 'DARK_PROTOCOL';
      }
      if ((activeSession.gameType as string) === 'cuanto-te-atreves') {
        return 'CUANTO_TE_ATREVES';
      }
      if ((activeSession.gameType as string) === 'uno-sobra') {
        return 'UNO_SOBRA';
      }
      if ((activeSession.gameType as string) === 'el-precio-justo') {
        return 'EL_PRECIO_JUSTO';
      }
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
      if (game === 'coartada') return 'COARTADA';
      if (game === 'entre-topos') return 'ENTRE_TOPOS';
      if (game === 'la_cantina_del_farol' || game === 'la-cantina-del-farol') return 'CANTINA';
      if (game === 'fortunarium') return 'FORTUNARIUM';
      if (game === 'la-cripta') return 'LA_CRIPTA';
      if (game === 'dark-protocol') return 'DARK_PROTOCOL';
      if (game === 'cuanto-te-atreves') return 'CUANTO_TE_ATREVES';
      if (game === 'uno-sobra') return 'UNO_SOBRA';
      if (game === 'el-precio-justo') return 'EL_PRECIO_JUSTO';
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
    } else if (gameId === 'coartada') {
      setCurrentView('COARTADA');
    } else if (gameId === 'entre-topos') {
      setCurrentView('ENTRE_TOPOS');
    } else if (gameId === 'la_cantina_del_farol' || gameId === 'la-cantina-del-farol') {
      setCurrentView('CANTINA');
    } else if (gameId === 'fortunarium') {
      setCurrentView('FORTUNARIUM');
    } else if (gameId === 'la-cripta') {
      setCurrentView('LA_CRIPTA');
    } else if (gameId === 'dark-protocol') {
      setCurrentView('DARK_PROTOCOL');
    } else if (gameId === 'cuanto-te-atreves') {
      setCurrentView('CUANTO_TE_ATREVES');
    } else if (gameId === 'uno-sobra') {
      setCurrentView('UNO_SOBRA');
    } else if (gameId === 'el-precio-justo') {
      setCurrentView('EL_PRECIO_JUSTO');
    }
  };

  const handleBackToMenu = () => {
    sessionRecovery.clearActiveSession();
    setUrlRoomCode('');
    setCurrentView('MENU');
  };

  const handleSwitchGame = (
    game:
      | 'la-bomba'
      | 'la-peor-respuesta'
      | 'pinturillo'
      | 'palabra-secreta'
      | 'codigo-rojo'
      | 'coartada'
      | 'entre-topos'
      | 'la_cantina_del_farol'
      | 'fortunarium'
      | 'la-cripta'
      | 'cuanto-te-atreves'
      | 'uno-sobra'
      | 'el-precio-justo',
    code: string
  ) => {
    setUrlRoomCode(code);
    if (game === 'la-bomba') setCurrentView('BOMBA_ONLINE');
    else if (game === 'la-peor-respuesta') setCurrentView('LPR_ONLINE');
    else if (game === 'pinturillo') setCurrentView('PINTURILLO');
    else if (game === 'palabra-secreta') setCurrentView('PALABRA_SECRETA');
    else if (game === 'codigo-rojo') setCurrentView('CODIGO_ROJO');
    else if (game === 'coartada') setCurrentView('COARTADA');
    else if (game === 'entre-topos') setCurrentView('ENTRE_TOPOS');
    else if (game === 'la_cantina_del_farol') setCurrentView('CANTINA');
    else if (game === 'fortunarium') setCurrentView('FORTUNARIUM');
    else if (game === 'la-cripta') setCurrentView('LA_CRIPTA');
    else if (game === 'cuanto-te-atreves') setCurrentView('CUANTO_TE_ATREVES');
    else if (game === 'uno-sobra') setCurrentView('UNO_SOBRA');
    else if (game === 'el-precio-justo') setCurrentView('EL_PRECIO_JUSTO');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Backend cold-start / connection modal (indeterminate, Spanish Spain, non-intrusive) */}
      <BackendConnectingModal />

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

      {/* 6. COARTADA (ONLINE MULTIPLAYER NOIR DEDUCTION 1v1) */}
      {currentView === 'COARTADA' && (
        <CoartadaGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 7. ENTRE TOPOS (ONLINE MULTIPLAYER SOCIAL DEDUCTION 3-10 PLAYERS) */}
      {currentView === 'ENTRE_TOPOS' && (
        <EntreToposGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 8. LA CANTINA DEL FAROL (ONLINE MULTIPLAYER BLUFF & ROULETTE 2-4 PLAYERS) */}
      {currentView === 'CANTINA' && (
        <CantinaGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 9. FORTUNARIUM (ONLINE COOPERATIVE SLOT MACHINE 2-4 PLAYERS) */}
      {currentView === 'FORTUNARIUM' && (
        <FortunariumGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 10. LA CRIPTA (ONLINE COOPERATIVE PROCEDURAL DUNGEON ADVENTURE 2-4 PLAYERS) */}
      {currentView === 'LA_CRIPTA' && (
        <LaCriptaGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 11. DARK PROTOCOL (2v1 ASYMMETRIC HORROR - PC EXCLUSIVE) */}
      {currentView === 'DARK_PROTOCOL' && (
        <DarkProtocolGame onBackToMenu={handleBackToMenu} />
      )}

      {/* 12. ¿CUÁNTO TE ATREVES? (ONLINE MULTIPLAYER ARCADE GAME SHOW 3-10 PLAYERS) */}
      {currentView === 'CUANTO_TE_ATREVES' && (
        <CuantoTeAtrevesGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 13. UNO SOBRA (ONLINE MULTIPLAYER SOCIAL ELIMINATION 3-10 PLAYERS) */}
      {currentView === 'UNO_SOBRA' && (
        <UnoSobraGame
          onBackToMenu={handleBackToMenu}
          initialRoomCode={urlRoomCode}
          onSwitchGame={handleSwitchGame}
        />
      )}

      {/* 14. EL PRECIO JUSTO (ONLINE MULTIPLAYER SECRET MONEY DEDUCTION 3-10 PLAYERS) */}
      {currentView === 'EL_PRECIO_JUSTO' && (
        <ElPrecioJustoGame
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

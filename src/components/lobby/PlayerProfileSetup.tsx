import React, { useState } from 'react';
import { Edit2, Check, Sparkles } from 'lucide-react';
import { PLAYER_COLORS, AVATARS } from '../../data/players';
import { AvatarPickerModal } from '../AvatarPickerModal';
import { audio } from '../../utils/audio';

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface PlayerProfileSetupProps {
  profile: PlayerProfile;
  onChange: (updated: Partial<PlayerProfile>) => void;
  accentColor?: string;
}

// Popular quick selection avatars
const QUICK_AVATARS = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐯', '🦁', '🐵', '🐸', '🐙', '🦄', '🐨'];

export const PlayerProfileSetup: React.FC<PlayerProfileSetupProps> = ({
  profile,
  onChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 16);
    setNameInput(val);
    onChange({ name: val });
  };

  const handleNameBlur = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameInput('Jugador');
      onChange({ name: 'Jugador' });
    } else {
      onChange({ name: trimmed });
    }
  };

  const handleSelectAvatar = (avatar: string) => {
    audio.playClick();
    onChange({ avatar });
  };

  const handleSelectColor = (colorHex: string) => {
    audio.playClick();
    onChange({ color: colorHex });
  };

  return (
    <section className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Tu Perfil
        </span>
        <span className="text-[11px] text-stone-500 font-medium">
          Visible para el resto de jugadores
        </span>
      </div>

      <div className="space-y-5">
        {/* Avatar + Name Input Row */}
        <div className="flex items-center gap-3.5">
          {/* Avatar Button */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setIsModalOpen(true);
              }}
              title="Haz clic para cambiar de avatar"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl transition-transform hover:scale-105 active:scale-95 cursor-pointer relative shadow-inner"
              style={{
                backgroundColor: `${profile.color}20`,
                border: `2px solid ${profile.color}`,
              }}
            >
              <span>{profile.avatar}</span>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-stone-300 group-hover:text-white shadow">
                <Edit2 className="w-2.5 h-2.5" />
              </div>
            </button>
          </div>

          {/* Name Field */}
          <div className="flex-1 min-w-0">
            <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
              Nombre de jugador
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              placeholder="Introduce tu apodo..."
              maxLength={16}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-400 focus:outline-none text-white font-bold text-base transition-colors placeholder:text-stone-600 shadow-inner"
            />
          </div>
        </div>

        {/* Quick Avatar Row */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Elige tu avatar
            </span>
            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setIsModalOpen(true);
              }}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ver todos los animales</span>
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-stone-800">
            {QUICK_AVATARS.map((av) => {
              const isSelected = profile.avatar === av;
              return (
                <button
                  key={av}
                  type="button"
                  onClick={() => handleSelectAvatar(av)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-2 border-amber-400 scale-110 shadow-md'
                      : 'bg-stone-950 border border-stone-800/80 hover:border-stone-700 hover:bg-stone-800/60'
                  }`}
                >
                  {av}
                </button>
              );
            })}
          </div>
        </div>

        {/* Colors Row */}
        <div>
          <span className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Color identificativo
          </span>
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {PLAYER_COLORS.map((col) => {
              const isSelected = profile.color.toLowerCase() === col.hex.toLowerCase();
              return (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => handleSelectColor(col.hex)}
                  title={col.name}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-md ${
                    isSelected
                      ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-stone-900'
                      : 'hover:scale-105 opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: col.hex }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectAvatar={(av) => {
          handleSelectAvatar(av);
          setIsModalOpen(false);
        }}
        selectedAvatar={profile.avatar}
        currentAvatar={profile.avatar}
        playerName={profile.name}
        playerColorHex={profile.color}
      />
    </section>
  );
};

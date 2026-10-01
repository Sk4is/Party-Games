import React, { useEffect, useState } from 'react';
import {
  CriptaPlayerStatusEffect,
  CriptaStatusCatalogEntry,
  CriptaStatusEffectType,
} from '../../types/laCripta';
import {
  CRIPTA_STATUS_CATALOG,
  CRIPTA_STATUS_EFFECTS_REGISTRY,
} from '../../data/la-cripta/criptaStatusEffects';
import { LaCriptaPixelTooltip } from './LaCriptaPixelTooltip';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

interface LaCriptaStatusPixelIconProps {
  effectType: CriptaStatusEffectType;
  size?: number;
}

/**
 * Detailed 24x24 Pixel-Art Icons for all 32 canonical La Cripta statuses (Sections 6–10).
 * Every effect has a distinct silhouette, multi-level pixel shading, and crisp edges.
 */
export const LaCriptaStatusPixelIcon: React.FC<LaCriptaStatusPixelIconProps> = ({
  effectType,
  size = 16,
}) => {
  const def =
    CRIPTA_STATUS_EFFECTS_REGISTRY[effectType] ||
    CRIPTA_STATUS_EFFECTS_REGISTRY.TORCH_LIGHT;
  const color = def.visualTreatment.color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className="shrink-0 select-none"
    >
      {/* 1. VENENO — Green toxic vial + droplets */}
      {effectType === 'POISON' && (
        <g>
          <rect x="9" y="2" width="6" height="2" fill="#8C6A48" />
          <rect x="10" y="4" width="4" height="3" fill="#A8C6B8" />
          <rect x="7" y="7" width="10" height="3" fill="#3E7A56" />
          <rect x="5" y="10" width="14" height="9" fill="#1F4A32" />
          <rect x="6" y="12" width="12" height="6" fill={color} />
          <rect x="7" y="19" width="10" height="2" fill="#3E7A56" />
          <rect x="8" y="13" width="2" height="2" fill="#B8FFD0" />
          <rect x="13" y="15" width="2" height="2" fill="#B8FFD0" />
          <rect x="18" y="4" width="2" height="3" fill={color} />
          <rect x="3" y="6" width="2" height="2" fill="#B8FFD0" />
        </g>
      )}

      {/* 2. SANGRADO — Crimson jagged cut + falling blood drop */}
      {effectType === 'BLEED' && (
        <g>
          <rect x="3" y="3" width="4" height="3" fill="#8F263D" />
          <rect x="6" y="5" width="5" height="3" fill={color} />
          <rect x="10" y="7" width="5" height="3" fill="#FF6B8B" />
          <rect x="14" y="9" width="5" height="3" fill={color} />
          <rect x="17" y="11" width="4" height="3" fill="#8F263D" />
          {/* Falling crimson drop */}
          <rect x="10" y="12" width="2" height="2" fill={color} />
          <rect x="9" y="14" width="4" height="3" fill={color} />
          <rect x="8" y="17" width="6" height="4" fill="#8F263D" />
          <rect x="9" y="16" width="2" height="3" fill="#FFD6DF" />
        </g>
      )}

      {/* 3. QUEMADURA — Multi-layered infernal flame */}
      {effectType === 'BURN' && (
        <g>
          <rect x="11" y="2" width="3" height="3" fill="#FF9E44" />
          <rect x="9" y="5" width="6" height="3" fill={color} />
          <rect x="6" y="8" width="12" height="4" fill={color} />
          <rect x="5" y="12" width="14" height="6" fill="#B84A1C" />
          <rect x="7" y="18" width="10" height="3" fill="#7A280C" />
          <rect x="8" y="10" width="8" height="6" fill="#FFAE42" />
          <rect x="10" y="13" width="4" height="5" fill="#FFF3C4" />
          <rect x="4" y="6" width="2" height="2" fill="#FFD166" />
          <rect x="18" y="7" width="2" height="2" fill="#FFD166" />
        </g>
      )}

      {/* 4. CONFUSIÓN — Hypnotic spiral + split mask */}
      {effectType === 'CONFUSION' && (
        <g>
          <rect x="6" y="3" width="12" height="2" fill={color} />
          <rect x="16" y="5" width="3" height="10" fill={color} />
          <rect x="7" y="15" width="9" height="2" fill="#7656A8" />
          <rect x="5" y="7" width="2" height="8" fill="#7656A8" />
          <rect x="7" y="7" width="7" height="2" fill="#D5B8FF" />
          <rect x="12" y="9" width="2" height="4" fill="#D5B8FF" />
          <rect x="9" y="11" width="3" height="2" fill="#FFF3C4" />
          <rect x="4" y="19" width="16" height="2" fill={color} />
        </g>
      )}

      {/* 5. MIEDO — Wide terrified eye with dilated pupil */}
      {effectType === 'FEAR' && (
        <g>
          <rect x="6" y="5" width="12" height="2" fill="#8F6226" />
          <rect x="3" y="7" width="18" height="3" fill={color} />
          <rect x="2" y="10" width="20" height="4" fill="#F4EBD9" />
          <rect x="3" y="14" width="18" height="3" fill={color} />
          <rect x="6" y="17" width="12" height="2" fill="#8F6226" />
          <rect x="9" y="8" width="6" height="8" fill="#0B0A0E" />
          <rect x="11" y="10" width="2" height="4" fill="#C93B5B" />
          <rect x="10" y="9" width="2" height="2" fill="#FFFFFF" />
        </g>
      )}

      {/* 6. VULNERABLE — Shield cracked down the middle */}
      {effectType === 'VULNERABLE' && (
        <g>
          <rect x="4" y="3" width="7" height="10" fill="#8C4235" />
          <rect x="13" y="4" width="7" height="10" fill="#8C4235" />
          <rect x="5" y="4" width="5" height="8" fill={color} />
          <rect x="14" y="5" width="5" height="8" fill={color} />
          <rect x="6" y="13" width="4" height="5" fill="#8C4235" />
          <rect x="14" y="14" width="4" height="5" fill="#8C4235" />
          {/* Jagged lightning crack through center */}
          <rect x="11" y="2" width="2" height="5" fill="#FFF3C4" />
          <rect x="10" y="7" width="2" height="5" fill="#FFF3C4" />
          <rect x="12" y="12" width="2" height="5" fill="#FFF3C4" />
          <rect x="11" y="17" width="2" height="4" fill="#FFF3C4" />
        </g>
      )}

      {/* 7. MARCADO — Crimson crosshair rune */}
      {effectType === 'MARKED' && (
        <g>
          <rect x="7" y="3" width="10" height="2" fill={color} />
          <rect x="7" y="19" width="10" height="2" fill={color} />
          <rect x="3" y="7" width="2" height="10" fill={color} />
          <rect x="19" y="7" width="2" height="10" fill={color} />
          <rect x="11" y="1" width="2" height="6" fill="#FF8DA1" />
          <rect x="11" y="17" width="2" height="6" fill="#FF8DA1" />
          <rect x="1" y="11" width="6" height="2" fill="#FF8DA1" />
          <rect x="17" y="11" width="6" height="2" fill="#FF8DA1" />
          <rect x="10" y="10" width="4" height="4" fill="#FFF3C4" />
        </g>
      )}

      {/* 8. CEGADO — Closed eye with dark slash */}
      {effectType === 'BLINDED' && (
        <g>
          <rect x="3" y="10" width="18" height="3" fill={color} />
          <rect x="6" y="13" width="12" height="2" fill="#63536B" />
          <rect x="5" y="15" width="2" height="3" fill={color} />
          <rect x="11" y="15" width="2" height="4" fill={color} />
          <rect x="17" y="15" width="2" height="3" fill={color} />
          {/* Diagonal slash */}
          <rect x="4" y="4" width="3" height="3" fill="#C93B5B" />
          <rect x="8" y="8" width="3" height="3" fill="#C93B5B" />
          <rect x="12" y="12" width="3" height="3" fill="#C93B5B" />
          <rect x="16" y="16" width="3" height="3" fill="#C93B5B" />
        </g>
      )}

      {/* 9. SILENCIADO — Sealed mouth / X-rune */}
      {effectType === 'SILENCED' && (
        <g>
          <rect x="5" y="4" width="14" height="16" fill="#321D4A" />
          <rect x="6" y="5" width="12" height="14" fill="#1D102E" />
          <rect x="6" y="11" width="12" height="2" fill={color} />
          <rect x="8" y="8" width="2" height="8" fill="#FFF3C4" />
          <rect x="14" y="8" width="2" height="8" fill="#FFF3C4" />
          <rect x="11" y="7" width="2" height="10" fill={color} />
        </g>
      )}

      {/* 10. ATURDIDO — Twin rotating stars */}
      {effectType === 'STUNNED' && (
        <g>
          <rect x="6" y="3" width="2" height="8" fill={color} />
          <rect x="3" y="6" width="8" height="2" fill={color} />
          <rect x="6" y="6" width="2" height="2" fill="#FFFFFF" />
          <rect x="16" y="11" width="2" height="8" fill={color} />
          <rect x="13" y="14" width="8" height="2" fill={color} />
          <rect x="16" y="14" width="2" height="2" fill="#FFFFFF" />
          <rect x="6" y="15" width="6" height="2" fill="#B88A28" />
          <rect x="12" y="5" width="6" height="2" fill="#B88A28" />
        </g>
      )}

      {/* 11. CONGELADO (FROST) — Ice crystal */}
      {effectType === 'FROST' && (
        <g>
          <rect x="11" y="2" width="2" height="20" fill={color} />
          <rect x="2" y="11" width="20" height="2" fill={color} />
          <rect x="5" y="5" width="3" height="3" fill="#B8F2EE" />
          <rect x="16" y="5" width="3" height="3" fill="#B8F2EE" />
          <rect x="5" y="16" width="3" height="3" fill="#B8F2EE" />
          <rect x="16" y="16" width="3" height="3" fill="#B8F2EE" />
          <rect x="8" y="8" width="8" height="8" fill="#437A77" />
          <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
        </g>
      )}

      {/* 12. MALDICIÓN — Violet skull rune */}
      {effectType === 'CURSE' && (
        <g>
          <rect x="6" y="3" width="12" height="10" fill={color} />
          <rect x="4" y="6" width="16" height="6" fill={color} />
          <rect x="8" y="13" width="8" height="6" fill="#76369C" />
          <rect x="6" y="7" width="4" height="4" fill="#0B0A0E" />
          <rect x="14" y="7" width="4" height="4" fill="#0B0A0E" />
          <rect x="7" y="8" width="2" height="2" fill="#FFF3C4" />
          <rect x="15" y="8" width="2" height="2" fill="#FFF3C4" />
          <rect x="9" y="15" width="2" height="3" fill="#0B0A0E" />
          <rect x="13" y="15" width="2" height="3" fill="#0B0A0E" />
        </g>
      )}

      {/* 13. CORROSIÓN — Melting armor */}
      {effectType === 'CORROSION' && (
        <g>
          <rect x="5" y="3" width="14" height="10" fill="#6E7A85" />
          <rect x="7" y="5" width="10" height="7" fill="#9DB4C0" />
          <rect x="6" y="11" width="12" height="4" fill={color} />
          <rect x="7" y="15" width="3" height="5" fill={color} />
          <rect x="12" y="15" width="2" height="6" fill="#D4FF70" />
          <rect x="16" y="15" width="2" height="4" fill={color} />
          <rect x="9" y="7" width="4" height="3" fill={color} />
        </g>
      )}

      {/* 14. DEBILITADO — Broken sword */}
      {effectType === 'WEAKENED' && (
        <g>
          <rect x="10" y="2" width="4" height="7" fill={color} />
          <rect x="14" y="6" width="5" height="4" fill="#6E6459" />
          <rect x="10" y="12" width="4" height="5" fill={color} />
          <rect x="6" y="17" width="12" height="2" fill="#C98736" />
          <rect x="10" y="19" width="4" height="3" fill="#8C532B" />
          <rect x="6" y="10" width="12" height="2" fill="#C93B5B" />
        </g>
      )}

      {/* 15. LENTITUD — Weighted boot & hourglass */}
      {effectType === 'SLOW' && (
        <g>
          <rect x="6" y="3" width="12" height="2" fill="#C98736" />
          <rect x="8" y="5" width="8" height="4" fill={color} />
          <rect x="10" y="9" width="4" height="4" fill="#FFF3C4" />
          <rect x="8" y="13" width="8" height="5" fill="#4E5D7A" />
          <rect x="10" y="15" width="4" height="3" fill={color} />
          <rect x="6" y="18" width="12" height="2" fill="#C98736" />
        </g>
      )}

      {/* 16. ESCUDO — Cyan heraldic shield */}
      {effectType === 'SHIELDED' && (
        <g>
          <rect x="4" y="3" width="16" height="10" fill="#487D7A" />
          <rect x="6" y="5" width="12" height="8" fill={color} />
          <rect x="6" y="13" width="12" height="4" fill="#487D7A" />
          <rect x="9" y="17" width="6" height="4" fill="#487D7A" />
          <rect x="11" y="6" width="2" height="10" fill="#FFF3C4" />
          <rect x="8" y="9" width="8" height="2" fill="#FFF3C4" />
        </g>
      )}

      {/* 17. ARMADURA — Metal chestplate */}
      {effectType === 'ARMORED' && (
        <g>
          <rect x="4" y="4" width="5" height="4" fill="#5C7482" />
          <rect x="15" y="4" width="5" height="4" fill="#5C7482" />
          <rect x="6" y="6" width="12" height="12" fill={color} />
          <rect x="8" y="8" width="8" height="8" fill="#D5E5F0" />
          <rect x="11" y="7" width="2" height="10" fill="#5C7482" />
          <rect x="7" y="18" width="10" height="3" fill="#5C7482" />
        </g>
      )}

      {/* 18. REGENERACIÓN — Verdant heart + spark */}
      {effectType === 'REGENERATION' && (
        <g>
          <rect x="4" y="5" width="6" height="6" fill={color} />
          <rect x="14" y="5" width="6" height="6" fill={color} />
          <rect x="6" y="9" width="12" height="6" fill={color} />
          <rect x="9" y="15" width="6" height="4" fill="#3E7A56" />
          <rect x="11" y="7" width="2" height="8" fill="#FFF3C4" />
          <rect x="8" y="10" width="8" height="2" fill="#FFF3C4" />
        </g>
      )}

      {/* 19. BENDICIÓN — Golden sacred symbol */}
      {effectType === 'BLESSED' && (
        <g>
          <rect x="10" y="2" width="4" height="20" fill={color} />
          <rect x="4" y="7" width="16" height="4" fill={color} />
          <rect x="8" y="5" width="8" height="8" fill="#FFD166" />
          <rect x="10" y="7" width="4" height="4" fill="#FFF3C4" />
        </g>
      )}

      {/* 20. FORTALECIDO — Bright upward sword */}
      {effectType === 'STRENGTHENED' && (
        <g>
          <rect x="11" y="2" width="2" height="3" fill="#FFF3C4" />
          <rect x="9" y="5" width="6" height="10" fill={color} />
          <rect x="11" y="5" width="2" height="10" fill="#FFF3C4" />
          <rect x="5" y="15" width="14" height="2" fill="#FFD166" />
          <rect x="10" y="17" width="4" height="4" fill="#8C532B" />
        </g>
      )}

      {/* 21. CELERIDAD — Winged boot */}
      {effectType === 'HASTE' && (
        <g>
          <rect x="12" y="4" width="8" height="3" fill="#FFF3C4" />
          <rect x="14" y="7" width="6" height="2" fill={color} />
          <rect x="6" y="6" width="6" height="10" fill={color} />
          <rect x="6" y="14" width="12" height="5" fill={color} />
          <rect x="5" y="19" width="14" height="2" fill="#2B9E91" />
        </g>
      )}

      {/* 22. PRECISIÓN — Eye + target */}
      {effectType === 'PRECISION' && (
        <g>
          <rect x="4" y="9" width="16" height="6" fill={color} />
          <rect x="7" y="7" width="10" height="10" fill="#B88A28" />
          <rect x="9" y="9" width="6" height="6" fill="#0B0A0E" />
          <rect x="11" y="11" width="2" height="2" fill="#FFF3C4" />
          <rect x="11" y="3" width="2" height="4" fill="#FFF3C4" />
          <rect x="11" y="17" width="2" height="4" fill="#FFF3C4" />
        </g>
      )}

      {/* 23. CRÍTICO AUMENTADO — Twin crossed daggers + burst */}
      {effectType === 'CRIT_BOOST' && (
        <g>
          <rect x="4" y="4" width="4" height="4" fill={color} />
          <rect x="8" y="8" width="8" height="8" fill="#FFF3C4" />
          <rect x="16" y="4" width="4" height="4" fill={color} />
          <rect x="4" y="16" width="4" height="4" fill="#B82E4B" />
          <rect x="16" y="16" width="4" height="4" fill="#B82E4B" />
          <rect x="11" y="2" width="2" height="20" fill={color} />
          <rect x="2" y="11" width="20" height="2" fill={color} />
        </g>
      )}

      {/* 24. RESISTENCIA — Warded crest */}
      {effectType === 'RESISTANCE' && (
        <g>
          <rect x="5" y="3" width="14" height="14" fill="#3E78A8" />
          <rect x="7" y="5" width="10" height="10" fill={color} />
          <rect x="9" y="7" width="6" height="6" fill="#D6EEFF" />
          <rect x="8" y="17" width="8" height="4" fill="#3E78A8" />
        </g>
      )}

      {/* 25. CONTRAGOLPE — Two crossed returning blades */}
      {effectType === 'COUNTER' && (
        <g>
          <rect x="4" y="5" width="14" height="3" fill={color} />
          <rect x="15" y="3" width="4" height="7" fill="#FFF3C4" />
          <rect x="6" y="15" width="14" height="3" fill={color} />
          <rect x="4" y="13" width="4" height="7" fill="#FFF3C4" />
        </g>
      )}

      {/* 26. PROVOCAR — Shield + attention rune */}
      {effectType === 'TAUNT' && (
        <g>
          <rect x="4" y="3" width="16" height="14" fill="#C98736" />
          <rect x="6" y="5" width="12" height="10" fill={color} />
          <rect x="11" y="6" width="2" height="6" fill="#0B0A0E" />
          <rect x="11" y="13" width="2" height="2" fill="#0B0A0E" />
          <rect x="8" y="17" width="8" height="4" fill="#C98736" />
        </g>
      )}

      {/* 27. INMUNIDAD — Sealed protective circle */}
      {effectType === 'IMMUNITY' && (
        <g>
          <rect x="6" y="3" width="12" height="2" fill={color} />
          <rect x="6" y="19" width="12" height="2" fill={color} />
          <rect x="3" y="6" width="2" height="12" fill={color} />
          <rect x="19" y="6" width="2" height="12" fill={color} />
          <rect x="8" y="8" width="8" height="8" fill="#E7A54A" />
          <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
        </g>
      )}

      {/* 28. INSPIRACIÓN — Royal war banner */}
      {effectType === 'INSPIRATION' && (
        <g>
          <rect x="4" y="3" width="16" height="2" fill="#FFF3C4" />
          <rect x="6" y="5" width="12" height="12" fill={color} />
          <rect x="6" y="17" width="4" height="4" fill="#B8821E" />
          <rect x="14" y="17" width="4" height="4" fill="#B8821E" />
          <rect x="10" y="8" width="4" height="6" fill="#FFF3C4" />
        </g>
      )}

      {/* 29. BARRERA MÁGICA — Arcane hexagonal dome */}
      {effectType === 'MAGIC_BARRIER' && (
        <g>
          <rect x="7" y="3" width="10" height="2" fill="#D5C4FF" />
          <rect x="4" y="5" width="16" height="12" fill="#6649C9" />
          <rect x="6" y="7" width="12" height="8" fill={color} />
          <rect x="10" y="9" width="4" height="4" fill="#FFFFFF" />
          <rect x="7" y="17" width="10" height="2" fill="#D5C4FF" />
        </g>
      )}

      {/* 30. SIGILO — Hooded shadow cloak */}
      {effectType === 'STEALTH' && (
        <g>
          <rect x="8" y="3" width="8" height="4" fill="#54468F" />
          <rect x="5" y="7" width="14" height="12" fill={color} />
          <rect x="7" y="9" width="10" height="9" fill="#130F21" />
          <rect x="8" y="12" width="3" height="2" fill="#5CE6D6" />
          <rect x="13" y="12" width="3" height="2" fill="#5CE6D6" />
        </g>
      )}

      {/* 31. LUZ DE ANTORCHA — Flickering torch */}
      {effectType === 'TORCH_LIGHT' && (
        <g>
          <rect x="10" y="2" width="4" height="6" fill="#FFF3C4" />
          <rect x="8" y="5" width="8" height="6" fill={color} />
          <rect x="10" y="11" width="4" height="10" fill="#8C532B" />
        </g>
      )}

      {/* 32. CONDENA DEL ECLIPSE — Black sun with crimson corona */}
      {effectType === 'ECLIPSE_DOOM' && (
        <g>
          <rect x="6" y="3" width="12" height="18" fill={color} />
          <rect x="3" y="6" width="18" height="12" fill={color} />
          <rect x="7" y="7" width="10" height="10" fill="#09070D" />
          <rect x="10" y="10" width="4" height="4" fill="#FFD166" />
        </g>
      )}
    </svg>
  );
};

export const LaCriptaFallenSoulIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    shapeRendering="crispEdges"
    className="shrink-0 select-none"
  >
    <rect x="6" y="1" width="2" height="2" fill="#69A8A5" />
    <rect x="3" y="3" width="8" height="6" fill="#D9D0BC" />
    <rect x="4" y="9" width="6" height="3" fill="#B8AC93" />
    <rect x="4" y="5" width="2" height="2" fill="#0B0A0E" />
    <rect x="8" y="5" width="2" height="2" fill="#0B0A0E" />
    <rect x="4" y="5" width="1" height="1" fill="#C93B5B" />
    <rect x="8" y="5" width="1" height="1" fill="#C93B5B" />
    <rect x="5" y="10" width="1" height="2" fill="#0B0A0E" />
    <rect x="8" y="10" width="1" height="2" fill="#0B0A0E" />
  </svg>
);

const CATEGORY_LABELS: Record<string, string> = {
  DAMAGE_OVER_TIME: 'ESTADO NEGATIVO · DAÑO PERIÓDICO',
  CONTROL: 'EFECTO DE CONTROL',
  DEBUFF: 'ESTADO NEGATIVO · DEBUFF',
  BUFF: 'EFECTO POSITIVO · BUFF',
  NEGATIVE_STATUS: 'ESTADO NEGATIVO',
  POSITIVE_STATUS: 'ESTADO POSITIVO',
  DEFENSIVE_EFFECT: 'EFECTO DEFENSIVO',
  CONTROL_EFFECT: 'EFECTO DE CONTROL',
  SPECIAL_BOSS_EFFECT: 'EFECTO ESPECIAL',
};

interface LaCriptaStatusEffectBadgeProps {
  status?: CriptaPlayerStatusEffect;
  effect?: CriptaPlayerStatusEffect;
  effectType?: CriptaStatusEffectType;
  turnsRemaining?: number;
  stacks?: number;
  sourceName?: string;
  compactIconOnly?: boolean;
}

export const LaCriptaStatusEffectBadge: React.FC<LaCriptaStatusEffectBadgeProps> = ({
  status,
  effect,
  effectType: propEffectType,
  turnsRemaining,
  stacks,
  sourceName,
  compactIconOnly = false,
}) => {
  const resolved: CriptaPlayerStatusEffect | null =
    status ||
    effect ||
    (propEffectType
      ? {
          id: `enemy_${propEffectType}`,
          effectType: propEffectType,
          name: CRIPTA_STATUS_EFFECTS_REGISTRY[propEffectType]?.name || propEffectType,
          code: CRIPTA_STATUS_EFFECTS_REGISTRY[propEffectType]?.code || 'EST',
          type: CRIPTA_STATUS_EFFECTS_REGISTRY[propEffectType]?.type || 'debuff',
          sourceName,
          remainingTurns: turnsRemaining ?? 1,
          stacks: stacks ?? 1,
          potency: CRIPTA_STATUS_EFFECTS_REGISTRY[propEffectType]?.defaultPotency || 1,
          appliedAtTurn: 1,
        }
      : null);
  if (!resolved) return null;

  const effectType: CriptaStatusEffectType =
    resolved.effectType ||
    (resolved.code === 'LUZ' ? 'TORCH_LIGHT' : 'BLESSED');

  const def =
    CRIPTA_STATUS_EFFECTS_REGISTRY[effectType] ||
    CRIPTA_STATUS_EFFECTS_REGISTRY.TORCH_LIGHT;

  const isPermanent =
    def.durationRule === 'EXPEDITION' || resolved.remainingTurns >= 50;

  const originLabel =
    resolved.sourceName ||
    (resolved.sourceId && resolved.sourceId !== 'enemy' && resolved.sourceId !== 'dungeon'
      ? resolved.sourceId
      : null);

  const footerText = isPermanent
    ? 'DURACIÓN: EXPEDICIÓN ACTIVA'
    : `RESTANTE: ${resolved.remainingTurns} ${
        resolved.remainingTurns === 1 ? 'TURNO' : 'TURNOS'
      }${resolved.stacks > 1 ? ` · CARGAS: ${resolved.stacks}` : ''}${
        originLabel ? ` · ORIGEN: ${originLabel.toUpperCase()}` : ''
      }`;

  return (
    <LaCriptaPixelTooltip
      title={def.name}
      category={CATEGORY_LABELS[def.category] || 'ESTADO'}
      description={def.description}
      footerLabel={footerText}
      borderColor={def.visualTreatment.color}
      accentColor={def.visualTreatment.color}
      icon={<LaCriptaStatusPixelIcon effectType={effectType} size={16} />}
    >
      <div
        className="inline-flex items-center gap-1 px-1.5 py-0.5 border text-[8px] sm:text-[9px] font-cripta-pixel cursor-help transition-transform hover:scale-105"
        style={{
          backgroundColor: def.visualTreatment.bgTint,
          borderColor: def.visualTreatment.borderColor,
          color: def.visualTreatment.color,
        }}
      >
        <LaCriptaStatusPixelIcon effectType={effectType} size={12} />
        {!compactIconOnly && (
          <span className="font-bold tracking-wider">{def.code}</span>
        )}
        {resolved.stacks > 1 && (
          <span className="text-[#FFF3C4] font-bold">×{resolved.stacks}</span>
        )}
        {!isPermanent && resolved.remainingTurns > 0 && (
          <span className="text-[#F4EBD9] font-cripta-mono font-bold">
            {resolved.remainingTurns}
          </span>
        )}
      </div>
    </LaCriptaPixelTooltip>
  );
};

// ============================================================================
// IN-GAME STATUS CODEX MODAL (Sections 13–16 & 74)
// ============================================================================

type CodexTabFilter = 'TODOS' | 'POSITIVOS' | 'NEGATIVOS' | 'CONTROL' | 'ESPECIALES';

export const LaCriptaStatusCodexModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  encounteredBossEffects?: CriptaStatusEffectType[];
}> = ({ isOpen, onClose, encounteredBossEffects = [] }) => {
  const [activeTab, setActiveTab] = useState<CodexTabFilter>('TODOS');
  const [selectedEntry, setSelectedEntry] = useState<CriptaStatusCatalogEntry>(
    CRIPTA_STATUS_CATALOG[0]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        laCriptaAudio.playStoneClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredEntries = CRIPTA_STATUS_CATALOG.filter((entry) => {
    if (activeTab === 'TODOS') return true;
    return entry.codexTab === activeTab;
  });

  const isMysteryEntry = (entry: CriptaStatusCatalogEntry) =>
    Boolean(
      entry.isBossMysteryUntilSeen && !encounteredBossEffects.includes(entry.id)
    );

  const selectedIsMystery = isMysteryEntry(selectedEntry);

  return (
    <div
      className="fixed inset-0 z-[95] bg-[#05040A]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#0D0914] border-2 border-[#E7A54A] shadow-[0_0_50px_rgba(0,0,0,0.95)] flex flex-col max-h-[88dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#171024] border-b border-[#3A2B4C] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#09070D] border border-[#E7A54A] flex items-center justify-center">
              <LaCriptaStatusPixelIcon effectType="BLESSED" size={20} />
            </div>
            <div>
              <span className="block font-cripta-pixel text-[9px] text-[#E7A54A] uppercase tracking-widest">
                GRIMORIO TÁCTICO DE LA CRIPTA · CONSULTA LIBRE SIN COSTE DE TURNO
              </span>
              <h2 className="font-cripta-display text-base sm:text-lg font-extrabold text-[#F4EBD9] uppercase tracking-wider">
                CÓDICE DE ESTADOS, BENDICIONES Y AFLICCIONES
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              onClose();
            }}
            className="px-3 py-1.5 bg-[#21152B] hover:bg-[#321F42] border border-[#D8C6A0]/40 font-cripta-pixel text-[10px] font-bold text-[#F4EBD9] uppercase cursor-pointer"
          >
            CERRAR [ESC]
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 bg-[#120C1C] border-b border-[#282039] flex flex-wrap items-center gap-1.5">
          {(
            ['TODOS', 'POSITIVOS', 'NEGATIVOS', 'CONTROL', 'ESPECIALES'] as CodexTabFilter[]
          ).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  laCriptaAudio.playStoneClick();
                  setActiveTab(tab);
                }}
                className={`px-3 py-1 border font-cripta-pixel text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#2A1D12] border-[#FFD166] text-[#FFD166]'
                    : 'bg-[#161021] hover:bg-[#221833] border-[#382C4C] text-[#D8C6A0]/80'
                }`}
              >
                {tab}
              </button>
            );
          })}
          <span className="ml-auto font-cripta-mono text-[10px] text-[#D8C6A0]/70">
            {filteredEntries.length} EFECTOS REGISTRADOS
          </span>
        </div>

        {/* Main Split Body: Grid of Symbols (Left) + Detailed Inspection Sheet (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* Left Grid */}
          <div className="lg:col-span-7 p-3.5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 content-start border-b lg:border-b-0 lg:border-r border-[#282039]">
            {filteredEntries.map((entry) => {
              const isSelected = selectedEntry.id === entry.id;
              const mystery = isMysteryEntry(entry);
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    laCriptaAudio.playStoneClick();
                    setSelectedEntry(entry);
                  }}
                  className={`p-2.5 border-2 text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#241934] border-[#FFD166] shadow-[0_0_14px_rgba(255,209,102,0.25)]'
                      : 'bg-[#120D1A] hover:bg-[#1B1326] border-[#2B213D]'
                  }`}
                >
                  <div
                    className="w-9 h-9 shrink-0 border flex items-center justify-center"
                    style={{
                      backgroundColor: mystery ? '#09070D' : entry.visualAccent.bgTint,
                      borderColor: mystery ? '#4A3B5C' : entry.visualAccent.borderColor,
                    }}
                  >
                    {mystery ? (
                      <span className="font-cripta-pixel text-xs font-bold text-[#9B72CF]">
                        ???
                      </span>
                    ) : (
                      <LaCriptaStatusPixelIcon effectType={entry.id} size={22} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="font-cripta-pixel text-[10px] font-bold uppercase truncate"
                        style={{
                          color: mystery ? '#9B72CF' : entry.visualAccent.color,
                        }}
                      >
                        {mystery ? '???' : entry.displayName}
                      </span>
                      <span className="font-cripta-mono text-[8px] text-[#D8C6A0]/60 shrink-0">
                        {mystery ? '???' : entry.code}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#D9D0BC]/80 line-clamp-2 leading-snug">
                      {mystery
                        ? 'Efecto arcano desconocido hasta ser presenciado.'
                        : entry.shortDescription}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Expanded Detail Sheet */}
          <div className="lg:col-span-5 p-4 bg-[#0B0811] flex flex-col justify-between overflow-y-auto">
            <div>
              <div
                className="p-3.5 border-2 flex items-center gap-3.5"
                style={{
                  backgroundColor: selectedIsMystery
                    ? '#120D1A'
                    : selectedEntry.visualAccent.bgTint,
                  borderColor: selectedIsMystery
                    ? '#7656A8'
                    : selectedEntry.visualAccent.color,
                }}
              >
                <div className="w-14 h-14 bg-[#08060C] border-2 border-[#E7A54A]/60 flex items-center justify-center shrink-0">
                  {selectedIsMystery ? (
                    <span className="font-cripta-pixel text-lg font-bold text-[#9B72CF]">
                      ???
                    </span>
                  ) : (
                    <LaCriptaStatusPixelIcon effectType={selectedEntry.id} size={36} />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="font-cripta-pixel text-[9px] uppercase tracking-wider text-[#D8C6A0]/80 block">
                    {CATEGORY_LABELS[selectedEntry.category] || selectedEntry.category}
                  </span>
                  <h3
                    className="font-cripta-display text-lg font-extrabold uppercase tracking-wide"
                    style={{
                      color: selectedIsMystery
                        ? '#9B72CF'
                        : selectedEntry.visualAccent.color,
                    }}
                  >
                    {selectedIsMystery ? 'SELLO DESCONOCIDO (???)' : selectedEntry.displayName}
                  </h3>
                  <span className="font-cripta-mono text-[10px] text-[#FFD166]">
                    CÓDIGO HUD: [{selectedIsMystery ? '???' : selectedEntry.code}]
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="p-2.5 bg-[#130E1C] border border-[#2B213D]">
                  <span className="font-cripta-pixel text-[9px] text-[#E7A54A] uppercase block mb-1">
                    EFECTO EN COMBATE
                  </span>
                  <p className="text-xs text-[#F4EBD9] leading-relaxed">
                    {selectedIsMystery
                      ? 'Este efecto pertenece a una entidad abisal mayor y se revelará al ser encontrado en la expedición.'
                      : selectedEntry.fullDescription}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-[#130E1C] border border-[#2B213D]">
                    <span className="font-cripta-pixel text-[8px] text-[#D8C6A0]/70 uppercase block">
                      DURACIÓN HABITUAL
                    </span>
                    <span className="font-cripta-mono text-xs font-bold text-[#FFD166] mt-0.5 block">
                      {selectedEntry.defaultDurationType === 'EXPEDITION'
                        ? 'TODA LA EXPEDICIÓN'
                        : `Depende de la fuente (${selectedEntry.defaultTurns} turnos base)`}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#130E1C] border border-[#2B213D]">
                    <span className="font-cripta-pixel text-[8px] text-[#D8C6A0]/70 uppercase block">
                      NATURALEZA
                    </span>
                    <span
                      className="font-cripta-pixel text-[10px] font-bold uppercase mt-0.5 block"
                      style={{
                        color:
                          selectedEntry.positiveOrNegative === 'POSITIVE'
                            ? '#5EA87A'
                            : selectedEntry.positiveOrNegative === 'NEGATIVE'
                            ? '#C93B5B'
                            : '#FFD166',
                      }}
                    >
                      {selectedEntry.positiveOrNegative === 'POSITIVE'
                        ? 'BENEFICIOSO / POSITIVO'
                        : selectedEntry.positiveOrNegative === 'NEGATIVE'
                        ? 'PERJUDICIAL / NEGATIVO'
                        : 'ESPECIAL DE EXPEDICIÓN'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#130E1C] border border-[#2B213D]">
                  <span className="font-cripta-pixel text-[9px] text-[#69A8A5] uppercase block mb-0.5">
                    REGLA DE ACUMULACIÓN
                  </span>
                  <p className="text-[11px] text-[#D9D0BC]">
                    {selectedIsMystery ? '???' : selectedEntry.stackingRuleText}
                  </p>
                </div>

                <div className="p-2.5 bg-[#130E1C] border border-[#2B213D]">
                  <span className="font-cripta-pixel text-[9px] text-[#5EA87A] uppercase block mb-0.5">
                    ELIMINACIÓN Y CONTRAMEDIDAS
                  </span>
                  <p className="text-[11px] text-[#D9D0BC]">
                    {selectedIsMystery ? '???' : selectedEntry.removalRuleText}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#282039] flex items-center justify-between text-[10px] font-cripta-pixel text-[#D8C6A0]/75">
              <span>SIMBOLOGÍA: {selectedEntry.iconDefinition}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPEDITION EXIT CONFIRMATION MODAL (Sections 1–5 & 75)
// ============================================================================

export const LaCriptaExitExpeditionModal: React.FC<{
  isOpen: boolean;
  onCancel: () => void;
  onReturnToLobby: () => void;
  onReturnToMenu: () => void;
}> = ({ isOpen, onCancel, onReturnToLobby, onReturnToMenu }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        laCriptaAudio.playStoneClick();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#05030A]/82 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200"
      onClick={() => {
        laCriptaAudio.playStoneClick();
        onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cripta-exit-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0E0916] border-2 border-[#E7A54A] shadow-[0_0_45px_rgba(0,0,0,0.95)] p-5 relative overflow-hidden transition-transform duration-200 scale-100"
      >
        {/* Top ornamental gold/crimson bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8F263D] via-[#E7A54A] to-[#8F263D]" />

        {/* Header with Pixel Door & Animated Torch */}
        <div className="flex items-center gap-3.5 pb-3.5 border-b border-[#2E2240]">
          <div className="w-12 h-12 bg-[#171024] border-2 border-[#E7A54A] flex items-center justify-center shrink-0">
            <svg
              width={28}
              height={28}
              viewBox="0 0 24 24"
              shapeRendering="crispEdges"
              className="select-none"
            >
              {/* Arch Stone Frame */}
              <rect x="4" y="3" width="16" height="19" fill="#4A3B5C" />
              <rect x="6" y="5" width="12" height="17" fill="#6E4228" />
              <rect x="8" y="7" width="8" height="15" fill="#52301C" />
              {/* Door Ring & Torch Glow */}
              <rect x="13" y="13" width="2" height="2" fill="#FFD166" />
              <rect x="2" y="8" width="2" height="3" fill="#FF9E44" />
              <rect x="20" y="8" width="2" height="3" fill="#FF9E44" />
            </svg>
          </div>
          <div>
            <span className="font-cripta-pixel text-[9px] text-[#E7A54A] uppercase tracking-widest block">
              CONFIRMACIÓN DE SALIDA
            </span>
            <h2
              id="cripta-exit-modal-title"
              className="font-cripta-display text-lg sm:text-xl font-extrabold text-[#F4EBD9] uppercase tracking-wider"
            >
              ABANDONAR EXPEDICIÓN
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="py-4">
          <p className="font-cripta-display text-base font-bold text-[#FFD166]">
            ¿Dónde quieres ir?
          </p>
          <p className="mt-1.5 text-xs text-[#D9D0BC]/85 leading-relaxed">
            Puedes regresar a la sala de preparación de personajes de <strong className="text-[#F4EBD9]">La Cripta</strong> con tu grupo, o salir por completo al menú principal de juegos.
          </p>
        </div>

        {/* Three Clear Actions: VOLVER AL LOBBY, VOLVER AL MENÚ, CANCELAR */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              onReturnToLobby();
            }}
            className="w-full py-2.5 px-4 bg-[#2A1D10] hover:bg-[#3A2816] border-2 border-[#E7A54A] text-[#FFD166] font-cripta-pixel text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>VOLVER AL LOBBY</span>
            <span className="text-[9px] text-[#D8C6A0]">SALA DE PERSONAJES</span>
          </button>

          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              onReturnToMenu();
            }}
            className="w-full py-2.5 px-4 bg-[#260E16] hover:bg-[#381420] border-2 border-[#C93B5B] text-[#FF8DA1] font-cripta-pixel text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>VOLVER AL MENÚ</span>
            <span className="text-[9px] text-[#FF8DA1]/80">SALIR DE LA SALA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              onCancel();
            }}
            className="w-full py-2 px-4 bg-[#171222] hover:bg-[#231B33] border border-[#4A3B5C] text-[#D8C6A0] font-cripta-pixel text-xs font-bold uppercase tracking-wider text-center transition-colors cursor-pointer"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
};

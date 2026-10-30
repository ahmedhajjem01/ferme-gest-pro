/**
 * FermeGest PRO - 10 Predefined Farmer Avatars (5 Men, 5 Women)
 * Crisp, lightweight, resolution-independent vector illustrations.
 */

(function(window) {
  'use strict';

  const AVATARS = [
    // ==========================================
    // 5 MEN AVATARS
    // ==========================================
    {
      id: 'avatar-m1',
      gender: 'male',
      nameKey: 'avatar_m1_name',
      roleKey: 'avatar_m1_role',
      defaultName: 'Éleveur 1',
      emoji: '👨‍🌾',
      bgGradient: ['#10b981', '#047857'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-m1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#34d399"/>
              <stop offset="100%" stop-color="#059669"/>
            </linearGradient>
            <linearGradient id="skin-m1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fbd38d"/>
              <stop offset="100%" stop-color="#f6ad55"/>
            </linearGradient>
            <linearGradient id="hat-m1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a"/>
              <stop offset="100%" stop-color="#eab308"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-m1)"/>
          <!-- Body / Overalls -->
          <path d="M22 98 C24 75 35 68 50 68 C65 68 76 75 78 98 Z" fill="#047857"/>
          <path d="M35 74 L37 98 M65 74 L63 98" stroke="#065f46" stroke-width="3"/>
          <path d="M38 78 L62 78 L60 98 L40 98 Z" fill="#059669"/>
          <!-- Neck & Head -->
          <rect x="44" y="58" width="12" height="14" rx="3" fill="#f6ad55"/>
          <ellipse cx="50" cy="46" rx="18" ry="20" fill="url(#skin-m1)"/>
          <!-- Ears -->
          <circle cx="31" cy="46" r="4" fill="#f6ad55"/>
          <circle cx="69" cy="46" r="4" fill="#f6ad55"/>
          <!-- Hair under hat -->
          <path d="M32 40 C34 32 42 26 50 26 C58 26 66 32 68 40" fill="#78350f"/>
          <!-- Eyes & Eyebrows -->
          <path d="M38 38 Q42 36 46 38" stroke="#451a03" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M54 38 Q58 36 62 38" stroke="#451a03" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle cx="42" cy="43" r="2.5" fill="#1e293b"/>
          <circle cx="58" cy="43" r="2.5" fill="#1e293b"/>
          <circle cx="43" cy="42" r="0.8" fill="#ffffff"/>
          <circle cx="59" cy="42" r="0.8" fill="#ffffff"/>
          <!-- Nose & Smile -->
          <path d="M50 44 L48 49 L52 49" stroke="#dd6b20" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <path d="M42 53 Q50 60 58 53" stroke="#991b1b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <!-- Straw Hat -->
          <ellipse cx="50" cy="28" rx="36" ry="10" fill="url(#hat-m1)"/>
          <path d="M30 26 C32 14 68 14 70 26 Z" fill="url(#hat-m1)"/>
          <path d="M30 26 Q50 30 70 26" stroke="#b45309" stroke-width="3" fill="none"/>
        </svg>
      `
    },
    {
      id: 'avatar-m2',
      gender: 'male',
      nameKey: 'avatar_m2_name',
      roleKey: 'avatar_m2_role',
      defaultName: 'Éleveur 2',
      emoji: '🧔‍♂️',
      bgGradient: ['#3b82f6', '#1d4ed8'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-m2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#60a5fa"/>
              <stop offset="100%" stop-color="#2563eb"/>
            </linearGradient>
            <linearGradient id="skin-m2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fed7aa"/>
              <stop offset="100%" stop-color="#fba861"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-m2)"/>
          <!-- Plaid Shirt -->
          <path d="M22 98 C24 74 34 68 50 68 C66 68 76 74 78 98 Z" fill="#dc2626"/>
          <path d="M38 72 L38 98 M62 72 L62 98 M26 84 L74 84" stroke="#991b1b" stroke-width="2"/>
          <path d="M46 70 L50 78 L54 70 Z" fill="#fba861"/>
          <!-- Neck & Head -->
          <rect x="44" y="58" width="12" height="14" fill="#fba861"/>
          <ellipse cx="50" cy="46" rx="18" ry="20" fill="url(#skin-m2)"/>
          <!-- Beard -->
          <path d="M32 46 C32 64 68 64 68 46 C68 56 62 67 50 67 C38 67 32 56 32 46 Z" fill="#334155"/>
          <path d="M43 51 Q50 54 57 51" stroke="#1e293b" stroke-width="2.5" fill="none"/>
          <ellipse cx="50" cy="57" rx="3" ry="1.5" fill="#fba861"/>
          <!-- Eyes & Eyebrows -->
          <path d="M37 38 Q42 35 47 38" stroke="#1e293b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <path d="M53 38 Q58 35 63 38" stroke="#1e293b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <circle cx="42" cy="42" r="2.5" fill="#0f172a"/>
          <circle cx="58" cy="42" r="2.5" fill="#0f172a"/>
          <circle cx="43" cy="41" r="0.8" fill="#ffffff"/>
          <circle cx="59" cy="41" r="0.8" fill="#ffffff"/>
          <!-- Nose -->
          <path d="M50 43 L48 48 L52 48" stroke="#ea580c" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <!-- Cap -->
          <path d="M30 36 C30 22 70 22 70 36 Z" fill="#1e293b"/>
          <path d="M28 36 Q50 32 72 36 L82 39 Q50 34 26 39 Z" fill="#0f172a"/>
        </svg>
      `
    },
    {
      id: 'avatar-m3',
      gender: 'male',
      nameKey: 'avatar_m3_name',
      roleKey: 'avatar_m3_role',
      defaultName: 'Éleveur 3',
      emoji: '🧑‍🌾',
      bgGradient: ['#8b5cf6', '#6d28d9'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-m3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#a78bfa"/>
              <stop offset="100%" stop-color="#7c3aed"/>
            </linearGradient>
            <linearGradient id="skin-m3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fef08a"/>
              <stop offset="100%" stop-color="#fcd34d"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-m3)"/>
          <!-- Vet Coat -->
          <path d="M22 98 C24 74 34 68 50 68 C66 68 76 74 78 98 Z" fill="#f8fafc"/>
          <path d="M38 72 L46 98 M62 72 L54 98" stroke="#cbd5e1" stroke-width="2"/>
          <path d="M46 68 L50 78 L54 68 Z" fill="#0284c7"/>
          <!-- Stethoscope accent -->
          <path d="M36 78 Q50 90 64 78" stroke="#0284c7" stroke-width="2.5" fill="none"/>
          <circle cx="50" cy="88" r="3" fill="#0369a1"/>
          <!-- Neck & Head -->
          <rect x="44" y="58" width="12" height="14" fill="#fcd34d"/>
          <ellipse cx="50" cy="46" rx="17" ry="19" fill="#fde68a"/>
          <!-- Modern Hair -->
          <path d="M31 38 C31 22 45 18 55 18 C65 18 69 25 69 36 C65 30 55 30 45 32 C38 34 33 36 31 38 Z" fill="#451a03"/>
          <!-- Glasses -->
          <rect x="36" y="38" width="11" height="8" rx="2" fill="none" stroke="#0284c7" stroke-width="1.8"/>
          <rect x="53" y="38" width="11" height="8" rx="2" fill="none" stroke="#0284c7" stroke-width="1.8"/>
          <path d="M47 42 L53 42" stroke="#0284c7" stroke-width="1.8"/>
          <!-- Eyes -->
          <circle cx="41.5" cy="42" r="2" fill="#0f172a"/>
          <circle cx="58.5" cy="42" r="2" fill="#0f172a"/>
          <!-- Nose & Smile -->
          <path d="M50 44 L49 48 L52 48" stroke="#d97706" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M44 53 Q50 57 56 53" stroke="#b45309" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
      `
    },
    {
      id: 'avatar-m4',
      gender: 'male',
      nameKey: 'avatar_m4_name',
      roleKey: 'avatar_m4_role',
      defaultName: 'Éleveur 4',
      emoji: '👨‍💼',
      bgGradient: ['#f59e0b', '#d97706'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-m4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fbbf24"/>
              <stop offset="100%" stop-color="#b45309"/>
            </linearGradient>
            <linearGradient id="skin-m4" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fcd34d"/>
              <stop offset="100%" stop-color="#f59e0b"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-m4)"/>
          <!-- Modern Farmer Polo -->
          <path d="M22 98 C24 74 34 68 50 68 C66 68 76 74 78 98 Z" fill="#1e293b"/>
          <path d="M44 68 L50 78 L56 68 Z" fill="#e2e8f0"/>
          <path d="M42 68 L50 74 L58 68" stroke="#334155" stroke-width="2" fill="none"/>
          <!-- Neck & Head -->
          <rect x="44" y="58" width="12" height="14" fill="#f59e0b"/>
          <ellipse cx="50" cy="46" rx="17" ry="19" fill="#fcd34d"/>
          <!-- Sharp Hair -->
          <path d="M32 38 C32 20 68 20 68 38 C64 28 58 26 50 26 C42 26 36 28 32 38 Z" fill="#172554"/>
          <!-- Eyes & Eyebrows -->
          <path d="M38 37 Q42 34 46 37" stroke="#0f172a" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M54 37 Q58 34 62 37" stroke="#0f172a" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle cx="42" cy="42" r="2.5" fill="#0f172a"/>
          <circle cx="58" cy="42" r="2.5" fill="#0f172a"/>
          <circle cx="43" cy="41" r="0.8" fill="#ffffff"/>
          <circle cx="59" cy="41" r="0.8" fill="#ffffff"/>
          <!-- Nose & Confident Smile -->
          <path d="M50 44 L48 48 L52 48" stroke="#b45309" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <path d="M43 53 Q50 59 57 53" stroke="#991b1b" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        </svg>
      `
    },
    {
      id: 'avatar-m5',
      gender: 'male',
      nameKey: 'avatar_m5_name',
      roleKey: 'avatar_m5_role',
      defaultName: 'Éleveur 5',
      emoji: '👴',
      bgGradient: ['#0d9488', '#115e59'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-m5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2dd4bf"/>
              <stop offset="100%" stop-color="#0f766e"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-m5)"/>
          <!-- Traditional Farmer Vest -->
          <path d="M22 98 C24 74 34 68 50 68 C66 68 76 74 78 98 Z" fill="#78350f"/>
          <path d="M42 68 L50 82 L58 68 Z" fill="#f8fafc"/>
          <!-- Neck & Head -->
          <rect x="44" y="58" width="12" height="14" fill="#f6ad55"/>
          <ellipse cx="50" cy="46" rx="18" ry="19" fill="#fed7aa"/>
          <!-- Flat Cap / Beret -->
          <path d="M28 34 C30 22 70 22 72 34 Z" fill="#475569"/>
          <path d="M26 34 Q50 30 74 34 L78 37 Q50 32 24 37 Z" fill="#334155"/>
          <!-- White/Grey Mustache -->
          <path d="M38 52 Q44 49 50 52 Q56 49 62 52 Q56 57 50 54 Q44 57 38 52 Z" fill="#e2e8f0"/>
          <!-- Eyes & Friendly Smile -->
          <path d="M38 39 Q42 37 46 39" stroke="#64748b" stroke-width="2" fill="none"/>
          <path d="M54 39 Q58 37 62 39" stroke="#64748b" stroke-width="2" fill="none"/>
          <circle cx="42" cy="42" r="2.2" fill="#1e293b"/>
          <circle cx="58" cy="42" r="2.2" fill="#1e293b"/>
          <!-- Nose -->
          <path d="M50 43 L48 48 L52 48" stroke="#ea580c" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        </svg>
      `
    },

    // ==========================================
    // 5 WOMEN AVATARS
    // ==========================================
    {
      id: 'avatar-w1',
      gender: 'female',
      nameKey: 'avatar_w1_name',
      roleKey: 'avatar_w1_role',
      defaultName: 'Éleveuse 1',
      emoji: '👩‍🌾',
      bgGradient: ['#ec4899', '#be185d'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-w1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f472b6"/>
              <stop offset="100%" stop-color="#db2777"/>
            </linearGradient>
            <linearGradient id="skin-w1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fef08a"/>
              <stop offset="100%" stop-color="#fcd34d"/>
            </linearGradient>
            <linearGradient id="hat-w1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fef08a"/>
              <stop offset="100%" stop-color="#eab308"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-w1)"/>
          <!-- Overalls -->
          <path d="M24 98 C26 76 36 70 50 70 C64 70 74 76 76 98 Z" fill="#059669"/>
          <path d="M38 74 L39 98 M62 74 L61 98" stroke="#047857" stroke-width="2.5"/>
          <path d="M42 70 L50 78 L58 70 Z" fill="#fde047"/>
          <!-- Neck & Head -->
          <rect x="45" y="58" width="10" height="14" fill="#fcd34d"/>
          <ellipse cx="50" cy="46" rx="16" ry="18" fill="url(#skin-w1)"/>
          <!-- Hair braids -->
          <path d="M30 40 C28 50 28 62 33 66 C35 60 35 48 34 40" fill="#78350f"/>
          <path d="M70 40 C72 50 72 62 67 66 C65 60 65 48 66 40" fill="#78350f"/>
          <!-- Straw Hat with ribbon -->
          <ellipse cx="50" cy="30" rx="36" ry="10" fill="url(#hat-w1)"/>
          <path d="M32 28 C34 16 66 16 68 28 Z" fill="url(#hat-w1)"/>
          <path d="M32 28 Q50 32 68 28" stroke="#ec4899" stroke-width="3" fill="none"/>
          <!-- Eyes & Lashes -->
          <path d="M38 38 Q42 35 46 38" stroke="#451a03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <path d="M54 38 Q58 35 62 38" stroke="#451a03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <circle cx="42" cy="42" r="2.4" fill="#1e293b"/>
          <circle cx="58" cy="42" r="2.4" fill="#1e293b"/>
          <circle cx="43" cy="41" r="0.8" fill="#ffffff"/>
          <circle cx="59" cy="41" r="0.8" fill="#ffffff"/>
          <!-- Nose & Warm Smile -->
          <path d="M50 44 L49 48 L52 48" stroke="#d97706" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M42 53 Q50 60 58 53" stroke="#be123c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          <!-- Blush -->
          <circle cx="36" cy="49" r="3" fill="#f43f5e" opacity="0.35"/>
          <circle cx="64" cy="49" r="3" fill="#f43f5e" opacity="0.35"/>
        </svg>
      `
    },
    {
      id: 'avatar-w2',
      gender: 'female',
      nameKey: 'avatar_w2_name',
      roleKey: 'avatar_w2_role',
      defaultName: 'Éleveuse 2',
      emoji: '👩‍🔬',
      bgGradient: ['#06b6d4', '#0891b2'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-w2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#22d3ee"/>
              <stop offset="100%" stop-color="#0284c7"/>
            </linearGradient>
            <linearGradient id="skin-w2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#fed7aa"/>
              <stop offset="100%" stop-color="#fba861"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-w2)"/>
          <!-- Lab/Vet Coat -->
          <path d="M24 98 C26 76 36 70 50 70 C64 70 74 76 76 98 Z" fill="#ffffff"/>
          <path d="M44 70 L50 80 L56 70 Z" fill="#0284c7"/>
          <!-- Stethoscope -->
          <path d="M38 76 Q50 88 62 76" stroke="#0f766e" stroke-width="2.5" fill="none"/>
          <circle cx="50" cy="86" r="3" fill="#0f766e"/>
          <!-- Neck & Head -->
          <rect x="45" y="58" width="10" height="14" fill="#fba861"/>
          <ellipse cx="50" cy="46" rx="16" ry="18" fill="url(#skin-w2)"/>
          <!-- Professional Hair Bun -->
          <circle cx="50" cy="20" r="10" fill="#1e293b"/>
          <path d="M32 40 C32 24 68 24 68 40 C62 30 50 28 38 32 Z" fill="#1e293b"/>
          <!-- Elegant Glasses -->
          <circle cx="42" cy="42" r="5" fill="none" stroke="#0891b2" stroke-width="1.6"/>
          <circle cx="58" cy="42" r="5" fill="none" stroke="#0891b2" stroke-width="1.6"/>
          <path d="M47 42 L53 42" stroke="#0891b2" stroke-width="1.6"/>
          <!-- Eyes -->
          <circle cx="42" cy="42" r="2" fill="#0f172a"/>
          <circle cx="58" cy="42" r="2" fill="#0f172a"/>
          <!-- Smile -->
          <path d="M43 52 Q50 57 57 52" stroke="#b91c1c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        </svg>
      `
    },
    {
      id: 'avatar-w3',
      gender: 'female',
      nameKey: 'avatar_w3_name',
      roleKey: 'avatar_w3_role',
      defaultName: 'Éleveuse 3',
      emoji: '👱‍♀️',
      bgGradient: ['#f43f5e', '#be123c'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-w3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fb7185"/>
              <stop offset="100%" stop-color="#e11d48"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-w3)"/>
          <!-- Denim Shirt -->
          <path d="M24 98 C26 76 36 70 50 70 C64 70 74 76 76 98 Z" fill="#0284c7"/>
          <path d="M44 70 L50 78 L56 70 Z" fill="#f8fafc"/>
          <!-- Neck & Head -->
          <rect x="45" y="58" width="10" height="14" fill="#fcd34d"/>
          <ellipse cx="50" cy="46" rx="16" ry="18" fill="#fef08a"/>
          <!-- Ponytail on side -->
          <path d="M66 38 C76 42 78 56 72 62 C68 56 68 46 66 38 Z" fill="#d97706"/>
          <!-- Cap -->
          <path d="M32 38 C32 24 68 24 68 38 Z" fill="#059669"/>
          <path d="M30 38 Q50 34 70 38 L80 41 Q50 36 28 41 Z" fill="#047857"/>
          <!-- Eyes & Lashes -->
          <path d="M38 38 Q42 35 46 38" stroke="#451a03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <path d="M54 38 Q58 35 62 38" stroke="#451a03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <circle cx="42" cy="42" r="2.3" fill="#1e293b"/>
          <circle cx="58" cy="42" r="2.3" fill="#1e293b"/>
          <circle cx="43" cy="41" r="0.8" fill="#ffffff"/>
          <circle cx="59" cy="41" r="0.8" fill="#ffffff"/>
          <!-- Nose & Smile -->
          <path d="M50 44 L49 48 L52 48" stroke="#d97706" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M43 52 Q50 58 57 52" stroke="#be123c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        </svg>
      `
    },
    {
      id: 'avatar-w4',
      gender: 'female',
      nameKey: 'avatar_w4_name',
      roleKey: 'avatar_w4_role',
      defaultName: 'Éleveuse 4',
      emoji: '🧕',
      bgGradient: ['#8b5cf6', '#7c3aed'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-w4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#c084fc"/>
              <stop offset="100%" stop-color="#9333ea"/>
            </linearGradient>
            <linearGradient id="hijab-w4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f5d0fe"/>
              <stop offset="100%" stop-color="#d946ef"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-w4)"/>
          <!-- Traditional Vest -->
          <path d="M24 98 C26 76 36 70 50 70 C64 70 74 76 76 98 Z" fill="#701a75"/>
          <!-- Hijab wrapping shoulders -->
          <path d="M26 82 Q50 96 74 82 L72 98 L28 98 Z" fill="url(#hijab-w4)"/>
          <!-- Hijab Headpiece -->
          <path d="M26 44 C26 22 74 22 74 44 C74 64 68 76 50 76 C32 76 26 64 26 44 Z" fill="url(#hijab-w4)"/>
          <!-- Face oval opening -->
          <ellipse cx="50" cy="46" rx="15" ry="18" fill="#fed7aa"/>
          <!-- Eyes & Lashes -->
          <path d="M38 38 Q42 35 46 38" stroke="#581c87" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M54 38 Q58 35 62 38" stroke="#581c87" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle cx="42" cy="43" r="2.4" fill="#0f172a"/>
          <circle cx="58" cy="43" r="2.4" fill="#0f172a"/>
          <circle cx="43" cy="42" r="0.8" fill="#ffffff"/>
          <circle cx="59" cy="42" r="0.8" fill="#ffffff"/>
          <!-- Nose & Warm Smile -->
          <path d="M50 45 L49 49 L52 49" stroke="#ea580c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path d="M43 54 Q50 60 57 54" stroke="#a21caf" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <!-- Gentle blush -->
          <circle cx="36" cy="50" r="2.5" fill="#f43f5e" opacity="0.3"/>
          <circle cx="64" cy="50" r="2.5" fill="#f43f5e" opacity="0.3"/>
        </svg>
      `
    },
    {
      id: 'avatar-w5',
      gender: 'female',
      nameKey: 'avatar_w5_name',
      roleKey: 'avatar_w5_role',
      defaultName: 'Éleveuse 5',
      emoji: '👩‍💼',
      bgGradient: ['#14b8a6', '#0f766e'],
      svg: `
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad-w5" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#2dd4bf"/>
              <stop offset="100%" stop-color="#0d9488"/>
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill="url(#grad-w5)"/>
          <!-- Business Blazer -->
          <path d="M24 98 C26 76 36 70 50 70 C64 70 74 76 76 98 Z" fill="#0f766e"/>
          <path d="M42 70 L50 82 L58 70 Z" fill="#ffffff"/>
          <path d="M40 70 L50 84 L60 70" stroke="#115e59" stroke-width="2" fill="none"/>
          <!-- Neck & Head -->
          <rect x="45" y="58" width="10" height="14" fill="#fcd34d"/>
          <ellipse cx="50" cy="46" rx="16" ry="18" fill="#fef08a"/>
          <!-- Sleek Bob Haircut -->
          <path d="M30 46 C30 24 70 24 70 46 C70 54 66 58 64 56 C62 40 58 32 50 32 C42 32 38 40 36 56 C34 58 30 54 30 46 Z" fill="#451a03"/>
          <!-- Eyes & Eyebrows -->
          <path d="M38 37 Q42 34 46 37" stroke="#451a03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <path d="M54 37 Q58 34 62 37" stroke="#451a03" stroke-width="1.8" fill="none" stroke-linecap="round"/>
          <circle cx="42" cy="42" r="2.4" fill="#0f172a"/>
          <circle cx="58" cy="42" r="2.4" fill="#0f172a"/>
          <circle cx="43" cy="41" r="0.8" fill="#ffffff"/>
          <circle cx="59" cy="41" r="0.8" fill="#ffffff"/>
          <!-- Nose & Confident Smile -->
          <path d="M50 44 L49 48 L52 48" stroke="#d97706" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M43 53 Q50 58 57 53" stroke="#b91c1c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        </svg>
      `
    }
  ];

  const AppAvatars = {
    list: AVATARS,

    getById(id) {
      if (!id) return AVATARS[0];
      return AVATARS.find(a => a.id === id) || AVATARS[0];
    },

    getSvg(id, size = 64) {
      const avatar = this.getById(id);
      let svg = avatar.svg.trim();
      if (size) {
        svg = svg.replace('<svg ', `<svg width="${size}" height="${size}" style="display:inline-block; vertical-align:middle; border-radius:50%;" `);
      }
      return svg;
    },

    renderGridHtml(selectedId = 'avatar-m1', filter = 'all') {
      const filtered = AVATARS.filter(a => {
        if (filter === 'male') return a.gender === 'male';
        if (filter === 'female') return a.gender === 'female';
        return true;
      });

      return filtered.map(a => {
        const isSelected = (a.id === selectedId);
        return `
          <div class="avatar-card-item ${isSelected ? 'selected' : ''}" 
               data-avatar-id="${a.id}" 
               data-gender="${a.gender}"
               onclick="app.selectOnboardingAvatar('${a.id}')"
               title="${a.defaultName}">
            <div class="avatar-card-svg-wrap">
              ${this.getSvg(a.id, 48)}
              <div class="avatar-card-check">✓</div>
            </div>
            <div class="avatar-card-name" data-i18n="${a.nameKey}">${a.defaultName}</div>
            <div class="avatar-card-role" data-i18n="${a.roleKey}">${a.gender === 'male' ? 'Éleveur' : 'Éleveuse'}</div>
          </div>
        `;
      }).join('');
    }
  };

  window.AppAvatars = AppAvatars;

})(typeof window !== 'undefined' ? window : this);

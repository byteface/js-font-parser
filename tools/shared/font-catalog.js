const PATHS = {
  team2006: '../truetypefonts/2006 Team.ttf',
  faces20: '../truetypefonts/20FACES.TTF',
  augie: '../truetypefonts/AUGIE___.TTF',
  aims: '../truetypefonts/Aims in your Life normal.ttf',
  cards: '../truetypefonts/CARDS.TTF',
  discomo: '../truetypefonts/DiscoMo.ttf',
  discomoEs: '../truetypefonts/DiscoMo-es.ttf',
  discomoPl: '../truetypefonts/DiscoMo-pl.ttf',
  discomoCs: '../truetypefonts/DiscoMo-cs.ttf',
  discomoHu: '../truetypefonts/DiscoMo-hu.ttf',
  discomoTr: '../truetypefonts/DiscoMo-tr.ttf',
  discomoRo: '../truetypefonts/DiscoMo-ro.ttf',
  devilInside: '../truetypefonts/devil-inside-font/DevilInside-G3xP.ttf',
  ello: '../truetypefonts/ELLO____.TTF',
  gothamNarrow: '../truetypefonts/GothamNarrow-Ultra.otf',
  joeJack: '../truetypefonts/JoeJack.ttf',
  minecraft: '../truetypefonts/Minecraft.ttf',
  quill: '../truetypefonts/Quill.ttf',
  renav: '../truetypefonts/RENAV___.TTF',
  zwisdom: '../truetypefonts/ZWISDOM.ttf',
  slkscr: '../truetypefonts/slkscr.ttf',
  twemoji: '../truetypefonts/color/TwemojiMozilla.ttf',
  notoSans: '../truetypefonts/noto/NotoSans-Regular.ttf',
  notoHebrew: '../truetypefonts/noto/NotoSansHebrew-Regular.ttf',
  notoThai: '../truetypefonts/noto/NotoSansThaiLooped-Regular.ttf',
  notoDevanagari: '../truetypefonts/noto/NotoSansDevanagari-Regular.ttf',
  notoArabic: '../truetypefonts/noto/NotoNaskhArabic-Regular.ttf',
  sourceCodeProRegular: '../truetypefonts/source-code-pro/SourceCodePro-Regular.otf',
  notoSerifVar: '../truetypefonts/curated/NotoSerif-VF.ttf',
  robotoVar: '../truetypefonts/curated/Roboto-VF.ttf',
  playwriteVar: '../truetypefonts/Playwrite_GB_S/PlaywriteGBS-VariableFont_wght.ttf',
  playwriteVarItalic: '../truetypefonts/Playwrite_GB_S/PlaywriteGBS-Italic-VariableFont_wght.ttf',
  arimoVar: '../truetypefonts/arimo/Arimo[wght].ttf'
};

export const FONT_LISTS = {
  demoCore: [
    { name: 'DiscoMo', url: PATHS.discomo },
    { name: 'DevilInside', url: PATHS.devilInside },
    { name: 'AUGIE', url: PATHS.augie },
    { name: 'JoeJack', url: PATHS.joeJack },
    { name: 'Quill', url: PATHS.quill },
    { name: 'Noto Sans', url: PATHS.notoSans }
  ],
  metadata: [
    { name: 'DiscoMo.ttf', url: PATHS.discomo },
    { name: 'DevilInside-G3xP.ttf', url: PATHS.devilInside },
    { name: 'JoeJack.ttf', url: PATHS.joeJack },
    { name: 'NotoSans-Regular.ttf', url: PATHS.notoSans },
    { name: 'NotoSansHebrew-Regular.ttf', url: PATHS.notoHebrew }
  ],
  shapingCore: [
    { name: 'Noto Sans', url: PATHS.notoSans },
    { name: 'DevilInside', url: PATHS.devilInside },
    { name: 'DiscoMo', url: PATHS.discomo },
    { name: 'AUGIE', url: PATHS.augie },
    { name: 'Quill', url: PATHS.quill }
  ],
  featureMatrix: [
    { name: 'Noto Sans', url: PATHS.notoSans },
    { name: 'Noto Sans Hebrew', url: PATHS.notoHebrew },
    { name: 'Noto Sans Thai', url: PATHS.notoThai },
    { name: 'Noto Sans Devanagari', url: PATHS.notoDevanagari },
    { name: 'Noto Naskh Arabic', url: PATHS.notoArabic },
    { name: 'DiscoMo', url: PATHS.discomo },
    { name: 'DevilInside', url: PATHS.devilInside },
    { name: 'AUGIE', url: PATHS.augie },
    { name: 'Quill', url: PATHS.quill },
    { name: 'Twemoji Mozilla (color)', url: PATHS.twemoji }
  ],
  languageSupport: [
    { name: 'DiscoMo', url: PATHS.discomo },
    { name: 'DiscoMo ES (localised)', url: PATHS.discomoEs },
    { name: 'DiscoMo PL (localised)', url: PATHS.discomoPl },
    { name: 'DiscoMo CS (localised)', url: PATHS.discomoCs },
    { name: 'DiscoMo HU (localised)', url: PATHS.discomoHu },
    { name: 'DiscoMo TR (localised)', url: PATHS.discomoTr },
    { name: 'DiscoMo RO (localised)', url: PATHS.discomoRo },
    { name: 'DevilInside', url: PATHS.devilInside },
    { name: 'Noto Sans', url: PATHS.notoSans },
    { name: 'Noto Sans Hebrew', url: PATHS.notoHebrew },
    { name: 'Noto Sans Thai', url: PATHS.notoThai },
    { name: 'Noto Sans Devanagari', url: PATHS.notoDevanagari }
  ],
  localizedReview: [
    { name: 'DiscoMo (base)', url: PATHS.discomo },
    { name: 'DiscoMo ES', url: PATHS.discomoEs },
    { name: 'DiscoMo PL', url: PATHS.discomoPl },
    { name: 'DiscoMo CS', url: PATHS.discomoCs },
    { name: 'DiscoMo HU', url: PATHS.discomoHu },
    { name: 'DiscoMo TR', url: PATHS.discomoTr },
    { name: 'DiscoMo RO', url: PATHS.discomoRo }
  ],
  unicodeCoverage: [
    { name: 'DiscoMo', url: PATHS.discomo },
    { name: 'DiscoMo ES (localised)', url: PATHS.discomoEs },
    { name: 'DiscoMo PL (localised)', url: PATHS.discomoPl },
    { name: 'DiscoMo CS (localised)', url: PATHS.discomoCs },
    { name: 'DiscoMo HU (localised)', url: PATHS.discomoHu },
    { name: 'DiscoMo TR (localised)', url: PATHS.discomoTr },
    { name: 'DiscoMo RO (localised)', url: PATHS.discomoRo },
    { name: 'DevilInside', url: PATHS.devilInside },
    { name: 'Noto Sans', url: PATHS.notoSans },
    { name: 'Noto Sans Hebrew', url: PATHS.notoHebrew },
    { name: 'Noto Sans Thai', url: PATHS.notoThai },
    { name: 'Noto Sans Devanagari', url: PATHS.notoDevanagari },
    { name: 'Noto Naskh Arabic', url: PATHS.notoArabic },
    { name: 'Twemoji Mozilla (color)', url: PATHS.twemoji }
  ],
  variableFonts: [
    { name: 'Playwrite GB S Variable', url: PATHS.playwriteVar },
    { name: 'Playwrite GB S Italic Variable', url: PATHS.playwriteVarItalic },
    { name: 'Arimo Variable', url: PATHS.arimoVar }
  ],
  layoutEngine: [
    { name: 'Noto Sans Regular', url: PATHS.notoSans },
    { name: 'Gotham Narrow Ultra (OTF)', url: PATHS.gothamNarrow },
    { name: 'Source Code Pro Regular (OTF)', url: PATHS.sourceCodeProRegular },
    { name: 'DevilInside', url: PATHS.devilInside }
  ],
  kerning: [
    { name: 'Noto Sans (GPOS)', url: PATHS.notoSans },
    { name: 'Roboto VF (GPOS)', url: PATHS.robotoVar },
    { name: 'Gotham Narrow Ultra (kern + GPOS)', url: PATHS.gothamNarrow },
    { name: 'Noto Serif VF (GPOS)', url: PATHS.notoSerifVar },
    { name: 'Arimo Variable (GPOS)', url: PATHS.arimoVar },
    { name: 'Playwrite GB S Variable (GPOS)', url: PATHS.playwriteVar }
  ],
  allGlyphs: [
    { name: '2006 Team', url: PATHS.team2006 },
    { name: '20FACES', url: PATHS.faces20 },
    { name: 'AUGIE', url: PATHS.augie },
    { name: 'Aims in your Life', url: PATHS.aims },
    { name: 'CARDS', url: PATHS.cards },
    { name: 'DiscoMo', url: PATHS.discomo },
    { name: 'DiscoMo ES (localised)', url: PATHS.discomoEs },
    { name: 'DiscoMo PL (localised)', url: PATHS.discomoPl },
    { name: 'DiscoMo CS (localised)', url: PATHS.discomoCs },
    { name: 'DiscoMo HU (localised)', url: PATHS.discomoHu },
    { name: 'DiscoMo TR (localised)', url: PATHS.discomoTr },
    { name: 'DiscoMo RO (localised)', url: PATHS.discomoRo },
    { name: 'DevilInside', url: PATHS.devilInside },
    { name: 'ELLO', url: PATHS.ello },
    { name: 'Gotham Narrow Ultra (OTF)', url: PATHS.gothamNarrow },
    { name: 'JoeJack', url: PATHS.joeJack },
    { name: 'Playwrite GB S', url: PATHS.playwriteVar },
    { name: 'Quill', url: PATHS.quill },
    { name: 'RENAV', url: PATHS.renav },
    { name: 'ZWISDOM', url: PATHS.zwisdom },
    { name: 'slkscr', url: PATHS.slkscr },
    { name: 'Twemoji Mozilla (color)', url: PATHS.twemoji },
    { name: 'Noto Sans Regular', url: PATHS.notoSans },
    { name: 'Noto Sans Hebrew', url: PATHS.notoHebrew },
    { name: 'Noto Sans Thai', url: PATHS.notoThai },
    { name: 'Noto Sans Devanagari', url: PATHS.notoDevanagari },
    { name: 'Noto Naskh Arabic', url: PATHS.notoArabic },
    { name: 'Source Code Pro Regular (OTF)', url: PATHS.sourceCodeProRegular }
  ],
  stringExplorer: [
    '2006 Team.ttf',
    '20FACES.TTF',
    'AUGIE___.TTF',
    'Aims in your Life normal.ttf',
    'CARDS.TTF',
    'DiscoMo.ttf',
    'devil-inside-font/DevilInside-G3xP.ttf',
    'ELLO____.TTF',
    'GothamNarrow-Ultra.otf',
    'JoeJack.ttf',
    'Quill.ttf',
    'RENAV___.TTF',
    'ZWISDOM.ttf',
    'slkscr.ttf'
  ]
};

export function getFontList(key) {
  const list = FONT_LISTS[key];
  if (!list) {
    throw new Error(`Unknown font list key: ${key}`);
  }
  return list;
}

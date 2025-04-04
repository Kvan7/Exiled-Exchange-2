// @ts-check
/** @type{import('../../../src/assets/data/interfaces').TranslationDict} */
export default {
  RARITY_NORMAL: 'ノーマル',
  RARITY_MAGIC: 'マジック',
  RARITY_RARE: 'レア',
  RARITY_UNIQUE: 'ユニーク',
  RARITY_GEM: 'ジェム',
  RARITY_CURRENCY: 'カレンシー',
  RARITY_DIVCARD: '占いカード',
  RARITY_QUEST: 'クエスト',
  MAP_TIER: 'マップティア: ',
  RARITY: 'レアリティ: ',
  ITEM_CLASS: 'アイテムクラス: ',
  ITEM_LEVEL: 'アイテムレベル: ',
  CORPSE_LEVEL: '死体レベル: ',
  TALISMAN_TIER: 'タリスマンティア: ',
  GEM_LEVEL: 'レベル: ',
  STACK_SIZE: 'スタックサイズ: ',
  SOCKETS: 'ソケット: ',
  QUALITY: '品質: ',
  PHYSICAL_DAMAGE: '物理ダメージ: ',
  ELEMENTAL_DAMAGE: '元素ダメージ: ',
  LIGHTNING_DAMAGE: '雷ダメージ: ',
  COLD_DAMAGE: '冷気ダメージ: ',
  FIRE_DAMAGE: '火ダメージ: ',
  CRIT_CHANCE: 'クリティカルヒット率: ',
  ATTACK_SPEED: '秒間アタック回数: ',
  ARMOUR: 'アーマー: ',
  EVASION: '回避力: ',
  ENERGY_SHIELD: 'エナジーシールド: ',
  BLOCK_CHANCE: 'ブロック率: ',
  CORRUPTED: 'コラプト状態',
  UNIDENTIFIED: '未鑑定',
  ITEM_SUPERIOR: /^上質な (.*)$/,
  MAP_BLIGHTED: /^ブライトに覆われた(.*)$/,
  MAP_BLIGHT_RAVAGED: /^ブライトに破壊された(.*)$/,
  INFLUENCE_SHAPER: 'シェイパーアイテム',
  INFLUENCE_ELDER: 'エルダーアイテム',
  INFLUENCE_CRUSADER: 'クルセイダーアイテム',
  INFLUENCE_HUNTER: 'ハンターアイテム',
  INFLUENCE_REDEEMER: 'リディーマーアイテム',
  INFLUENCE_WARLORD: 'ウォーロードアイテム',
  SECTION_SYNTHESISED: 'シンセシスアイテム',
  ITEM_SYNTHESISED: /^シンセサイズされた (.*)$/,
  VEILED_PREFIX: 'ヴェールプレフィックス',
  VEILED_SUFFIX: 'ヴェールサフィックス',
  FLASK_CHARGES: /^現在 \d+ チャージ$/,
  METAMORPH_HELP: "これをTaneの研究所で他の4つの異なるサンプルと組み合わせてください。",
  BEAST_HELP: '右クリックしてベスティアリーに追加します。',
  VOIDSTONE_HELP: 'これをAtlasにソケットして、すべてのマップのティアを上げます。',
  METAMORPH_BRAIN: /^.* Brain$/,
  METAMORPH_EYE: /^.* Eye$/,
  METAMORPH_LUNG: /^.* Lung$/,
  METAMORPH_HEART: /^.* Heart$/,
  METAMORPH_LIVER: /^.* Liver$/,
  CANNOT_USE_ITEM: 'このアイテムは使用できません。そのステータスは無視されます。',
  QUALITY_ANOMALOUS: /^異常な (.*)$/,
  QUALITY_DIVERGENT: /^相違の (.*)$/,
  QUALITY_PHANTASMAL: /^幻想の (.*)$/,
  AREA_LEVEL: 'エリアレベル: ',
  HEIST_WINGS_REVEALED: '解放されたウィング: ',
  HEIST_TARGET: 'ハイストターゲット: ',
  HEIST_BLUEPRINT_ENCHANTS: 'エンチャントされた武器',
  HEIST_BLUEPRINT_TRINKETS: '盗賊のトリンケットまたは通貨',
  HEIST_BLUEPRINT_GEMS: '異常なジェム',
  HEIST_BLUEPRINT_REPLICAS: 'レプリカまたは実験アイテム',
  MIRRORED: 'ミラー化',
  MODIFIER_LINE: /^(?<type>[^"]+)(?:\s+"(?<name>[^"]+)")?(?:\s+\(ティア: (?<tier>\d+)\))?(?:\s+\(ランク: (?<rank>\d+)\))?$/,
  PREFIX_MODIFIER: 'プリフィックスモッド',
  SUFFIX_MODIFIER: 'サフィックスモッド',
  CRAFTED_PREFIX: 'マスタークラフトされたプリフィックスモッド',
  CRAFTED_SUFFIX: 'マスタークラフトされたサフィックスモッド',
  UNSCALABLE_VALUE: ' — スケーラブルではない値',
  CORRUPTED_IMPLICIT: 'コラプト状態の暗黙モッド',
  MODIFIER_INCREASED: /^(.+?)% 増加$/,
  INCURSION_OPEN: 'オープンルーム:',
  INCURSION_OBSTRUCTED: '妨害されたルーム:',
  EATER_IMPLICIT: /^世界を喰らう者 暗黙モッド \((?<rank>.+)\)$/,
  EXARCH_IMPLICIT: /^灼熱の代行者 暗黙モッド \((?<rank>.+)\)$/,
  ELDRITCH_MOD_R1: '(小)',
  ELDRITCH_MOD_R2: '(大)',
  ELDRITCH_MOD_R3: '(特大)',
  ELDRITCH_MOD_R4: '(希少)',
  ELDRITCH_MOD_R5: '(極上)',
  ELDRITCH_MOD_R6: '(完璧)',
  SENTINEL_CHARGE: 'チャージ: ',
  SHAPER_MODS: ['of Shaping', "The Shaper's"],
  ELDER_MODS: ['of the Elder', "The Elder's"],
  CRUSADER_MODS: ["Crusader's", 'of the Crusade'],
  HUNTER_MODS: ["Hunter's", 'of the Hunt'],
  REDEEMER_MODS: ['of Redemption', "Redeemer's"],
  WARLORD_MODS: ["Warlord's", 'of the Conquest'],
  DELVE_MODS: ['Subterranean', 'of the Underground'],
  VEILED_MODS: ['Chosen', 'of the Order'],
  INCURSION_MODS: ["Guatelitzi's", "Xopec's", "Topotante's", "Tacati's", "Matatl's", 'of Matatl', "Citaqualotl's", 'of Citaqualotl', 'of Tacati', 'of Guatelitzi', 'of Puhuarte'],
  FOIL_UNIQUE: 'Foil Unique',
  UNMODIFIABLE: 'Unmodifiable',
  // ---
  CHAT_SYSTEM: /^: (?<body>.+)$/,
  CHAT_TRADE: /^\$(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_GLOBAL: /^#(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_PARTY: /^%(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_GUILD: /^&(?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_WHISPER_TO: /^@To (?<char_name>.+?): (?<body>.+)$/,
  CHAT_WHISPER_FROM: /^@From (?:<(?<guild_tag>.+?)> )?(?<char_name>.+?): (?<body>.+)$/,
  CHAT_WEBTRADE_GEM: /^レベル (?<gem_lvl>\d+) (?<gem_qual>\d+)% (?<gem_name>.+)$/,
  REQUIREMENTS: '装備要求:',
  CHARM_SLOTS: 'チャームスロット:',
  BASE_SPIRIT: 'スピリット:',
  QUIVER_HELP_TEXT: '弓装備時のみ装備可能',
  FLASK_HELP_TEXT: '右クリックして飲む。',
  CHARM_HELP_TEXT: '条件を満たした時に自動的に使用される。',
  PRICE_NOTE: 'メモ: ',
  WAYSTONE_TIER: 'ウェイストーン ティア: ',
  WAYSTONE_HELP: 'マップデバイスで使用すると、',
  JEWEL_HELP: 'パッシブツリ',
  SANCTUM_HELP: 'セケマの試練開始時にこ',
  TIMELESS_RADIUS: '半径: ',
  PRECURSOR_TABLET_HELP: 'アトラス上の完了した塔で使用することで、周囲の',
  LOGBOOK_HELP: 'このアイテムをダニグに渡し、',
  REQUIRES: '要求',
  TIMELESS_SMALL_PASSIVES: '範囲内の通常パッシブスキルは{0}も付与する',
  TIMELESS_NOTABLE_PASSIVES: '範囲内の特殊パッシブスキルは{0}も付与する',
  GRANTS_SKILL: 'スキルを付与'
}

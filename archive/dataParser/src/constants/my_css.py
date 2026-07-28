import constants.other as t

CSS_SELECTOR = '#trade .results {{c(":is(.explicitMod,.runeMod,.implicitMod,.enchantMod,.desecratedMod)")}} > .lc.s[data-field$="stat_{0}"]'

EXPLICIT_CSS_SELECTOR = (
    '#trade .results .explicitMod > .lc.s[data-field="stat.explicit.stat_{0}"]'
)
RUNE_CSS_SELECTOR = '#trade .results .runeMod > .lc.s[data-field="stat.rune.stat_{0}"]'
IMPLICIT_CSS_SELECTOR = (
    '#trade .results .implicitMod > .lc.s[data-field="stat.implicit.stat_{0}"]'
)
ENCHANT_CSS_SELECTOR = (
    '#trade .results .enchantMod > .lc.s[data-field="stat.enchant.stat_{0}"]'
)
DESECRATED_CSS_SELECTOR = (
    '#trade .results .desecratedMod > .lc.s[data-field="stat.desecrated.stat_{0}"]'
)

MY_CSS_DEFAULT = """

#trade .results.compact .fracturedMod {
    font-weight: bold;
}

#trade .results .property.skill  > .lc.s span:nth-child(3) {
    font-weight: bold;
}


#trade .results.compact .runeMod > .lc.s {
    border-left: 1px dashed #6565ff;
    padding-left: 0.25rem;
}

#trade .results.compact .enchantMod > .lc.s[data-field]:not([data-field*="|"]){
    border-left: 1px dashed #ff0000;
    padding-left: 0.25rem;
}



c(a) {s(replace(",", "\\,", a))}
"""

# Mostly from COE, but any on trade by default are used
LIFE_COLOR = "#d14e4e"  # trade, coe is #ff00cc
MANA_COLOR = "#00d0dd"
SPEED_COLOR = "#00ffc0"
PHYSICAL_COLOR = "#0d8800"
CHAOS_COLOR = "#8a00ff"
FIRE_COLOR = "#b97123"  # trade, coe is #FF0000
COLD_COLOR = "#3f6db3"  # trade, coe is #5599FF
LIGHTNING_COLOR = "#adaa47"  # trade, coe is #FFF000
CRITICAL_COLOR = "#a8ff00"
ATTACK_COLOR = "#774300"
DAMAGE_COLOR = "#ffb4b4"
ATTRIBUTE_COLOR = "#7aaa00"
AILMENT_COLOR = "#00e120"
AURA_COLOR = "#ff99fe"
BLEED_COLOR = "#7a0000"
CASTER_COLOR = "#bc00dd"
MINION_COLOR = "#ff5eb5"
DEFENCES_COLOR = "#dddddd"
POISON_COLOR = AILMENT_COLOR
GEM_COLOR = "#d2eaa0"  # most +levels are not tagged as gem
STR_COLOR = "#ff0000"
DEX_COLOR = "#22ff22"
INT_COLOR = "#5555ff"
CURSE_COLOR = "#6c44ff"

ELEMENTAL_COLOR = "#ffffff"
RESISTANCE_COLOR = "#ffffff"

HIDE_BONDED = "hideBonded"


MY_CSS_USER_STYLE_VARS = f"""
@var checkbox {HIDE_BONDED} "Hide Bonded" {1}
@var color {t.LIFE_TAG} "{t.LIFE_TAG}" {LIFE_COLOR}
@var color {t.MANA_TAG} "{t.MANA_TAG}" {MANA_COLOR}
@var color {t.SPEED_TAG} "{t.SPEED_TAG}" {SPEED_COLOR}
@var color {t.PHYSICAL_TAG} "{t.PHYSICAL_TAG}" {PHYSICAL_COLOR}
@var color {t.CHAOS_TAG} "{t.CHAOS_TAG}" {CHAOS_COLOR}
@var color {t.FIRE_TAG} "{t.FIRE_TAG}" {FIRE_COLOR}
@var color {t.COLD_TAG} "{t.COLD_TAG}" {COLD_COLOR}
@var color {t.LIGHTNING_TAG} "{t.LIGHTNING_TAG}" {LIGHTNING_COLOR}
@var color {t.CRITICAL_TAG} "{t.CRITICAL_TAG}" {CRITICAL_COLOR}
@var color {t.ATTACK_TAG} "{t.ATTACK_TAG}" {ATTACK_COLOR}
@var color {t.DAMAGE_TAG} "{t.DAMAGE_TAG}" {DAMAGE_COLOR}
@var color {t.ATTRIBUTE_TAG} "{t.ATTRIBUTE_TAG}" {ATTRIBUTE_COLOR}
@var color {t.AILMENT_TAG} "{t.AILMENT_TAG}" {AILMENT_COLOR}
@var color {t.AURA_TAG} "{t.AURA_TAG}" {AURA_COLOR}
@var color {t.BLEED_TAG} "{t.BLEED_TAG}" {BLEED_COLOR}
@var color {t.CASTER_TAG} "{t.CASTER_TAG}" {CASTER_COLOR}
@var color {t.MINION_TAG} "{t.MINION_TAG}" {MINION_COLOR}
@var color {t.DEFENCES_TAG} "{t.DEFENCES_TAG}" {DEFENCES_COLOR}
@var color {t.POISON_TAG} "{t.POISON_TAG}" {POISON_COLOR}
@var color {t.GEM_TAG} "{t.GEM_TAG}" {GEM_COLOR}
@var color {t.STR_TAG} "{t.STR_TAG}" {STR_COLOR}
@var color {t.DEX_TAG} "{t.DEX_TAG}" {DEX_COLOR}
@var color {t.INT_TAG} "{t.INT_TAG}" {INT_COLOR}
@var color {t.CURSE_TAG} "{t.CURSE_TAG}" {CURSE_COLOR}
@var color {t.ELEMENTAL_TAG} "{t.ELEMENTAL_TAG}" {ELEMENTAL_COLOR}
@var color {t.RESISTANCE_TAG} "{t.RESISTANCE_TAG}" {RESISTANCE_COLOR}
"""

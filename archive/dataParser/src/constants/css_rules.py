from collections.abc import Callable

import constants.css as c
import constants.my_css as m
import constants.other as t
from models.css_rule import CssRule


def tag_rule(
    include: list[t.TAG], exclude: list[t.TAG] | None = None
) -> Callable[[str, int, list[str], str], bool]:
    return lambda ref, hash, tags, id: all(t in tags for t in include) and (
        exclude is None or not any(e in tags for e in exclude)
    )


TAG_ONLY_RULES: list[CssRule] = [
    CssRule(
        f"color: {t.GEM_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.GEM_TAG]),
        f"All {t.GEM_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.LIFE_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.LIFE_TAG]),
        f"All {t.LIFE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.MANA_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.MANA_TAG]),
        f"All {t.MANA_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.MINION_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.MINION_TAG]),
        f"All {t.MINION_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.BLEED_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.BLEED_TAG]),
        f"All {t.BLEED_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.POISON_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.POISON_TAG]),
        f"All {t.POISON_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.SPEED_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.SPEED_TAG]),
        f"All {t.SPEED_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.PHYSICAL_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.PHYSICAL_TAG]),
        f"All {t.PHYSICAL_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.CHAOS_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.CHAOS_TAG]),
        f"All {t.CHAOS_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.FIRE_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.FIRE_TAG]),
        f"All {t.FIRE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.COLD_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.COLD_TAG]),
        f"All {t.COLD_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.LIGHTNING_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.LIGHTNING_TAG]),
        f"All {t.LIGHTNING_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.CRITICAL_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.CRITICAL_TAG]),
        f"All {t.CRITICAL_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.STR_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.STR_TAG]),
        f"All {t.STR_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.DEX_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.DEX_TAG]),
        f"All {t.DEX_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.INT_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.INT_TAG]),
        f"All {t.INT_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.ATTRIBUTE_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.ATTRIBUTE_TAG]),
        f"All {t.ATTRIBUTE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.CURSE_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.CURSE_TAG]),
        f"All {t.CURSE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.AURA_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.AURA_TAG]),
        f"All {t.AURA_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.CASTER_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.CASTER_TAG]),
        f"All {t.CASTER_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.AILMENT_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.AILMENT_TAG]),
        f"All {t.AILMENT_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.DAMAGE_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.DAMAGE_TAG]),
        f"All {t.DAMAGE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.ATTACK_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.ATTACK_TAG]),
        f"All {t.ATTACK_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.DEFENCES_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.DEFENCES_TAG]),
        f"All {t.DEFENCES_TAG} tagged stats",
    ),
    # fall through, should likely not match much, not matched above
    CssRule(
        f"color: {t.ELEMENTAL_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.ELEMENTAL_TAG]),
        f"All {t.ELEMENTAL_TAG} tagged stats",
    ),
    # fall through, should likely not match much, not matched above
    CssRule(
        f"color: {t.RESISTANCE_TAG};",
        c.CSS_SELECTOR,
        tag_rule([t.RESISTANCE_TAG]),
        f"All {t.RESISTANCE_TAG} tagged stats",
    ),
    # max res so different
    CssRule(
        "text-decoration: underline;",
        c.CSS_SELECTOR,
        tag_rule([t.MAXIMUM_TAG]),
        f"{t.MAXIMUM_TAG} res stats (custom tag)",
    ),
]

# Same as TAG_ONLY_RULES but only applies to compact views
COMPACT_TAG_ONLY_RULES: list[CssRule] = [
    CssRule(r.css, c.CSS_SELECTOR_COMPACT, r.row_selector, r.name)
    for r in TAG_ONLY_RULES
]


OPINIONATED_RULES: list[CssRule] = [
    CssRule(
        "display: none;",
        m.RUNE_CSS_SELECTOR,
        tag_rule([t.BONDED_TAG]),
        "i dont wanna see bonded ones",
        disableSelector=m.HIDE_BONDED,
    ),
    CssRule(
        f"color: {t.GEM_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.GEM_TAG]),
        f"All {t.GEM_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.LIFE_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.LIFE_TAG], [t.ATTACK_TAG]),
        f"All {t.LIFE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.MANA_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.MANA_TAG], [t.ATTACK_TAG]),
        f"All {t.MANA_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.MINION_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.MINION_TAG]),
        f"All {t.MINION_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.BLEED_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.BLEED_TAG]),
        f"All {t.BLEED_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.POISON_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.POISON_TAG]),
        f"All {t.POISON_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.SPEED_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.SPEED_TAG]),
        f"All {t.SPEED_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.PHYSICAL_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.PHYSICAL_TAG]),
        f"All {t.PHYSICAL_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.CHAOS_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.CHAOS_TAG]),
        f"All {t.CHAOS_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.FIRE_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.FIRE_TAG]),
        f"All {t.FIRE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.COLD_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.COLD_TAG]),
        f"All {t.COLD_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.LIGHTNING_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.LIGHTNING_TAG]),
        f"All {t.LIGHTNING_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.CRITICAL_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.CRITICAL_TAG]),
        f"All {t.CRITICAL_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.STR_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.STR_TAG]),
        f"All {t.STR_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.DEX_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.DEX_TAG]),
        f"All {t.DEX_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.INT_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.INT_TAG]),
        f"All {t.INT_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.ATTRIBUTE_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.ATTRIBUTE_TAG]),
        f"All {t.ATTRIBUTE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.CURSE_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.CURSE_TAG]),
        f"All {t.CURSE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.AURA_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.AURA_TAG]),
        f"All {t.AURA_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.CASTER_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.CASTER_TAG]),
        f"All {t.CASTER_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.AILMENT_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.AILMENT_TAG]),
        f"All {t.AILMENT_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.DAMAGE_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.DAMAGE_TAG]),
        f"All {t.DAMAGE_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.ATTACK_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.ATTACK_TAG]),
        f"All {t.ATTACK_TAG} tagged stats",
    ),
    CssRule(
        f"color: {t.DEFENCES_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.DEFENCES_TAG]),
        f"All {t.DEFENCES_TAG} tagged stats",
    ),
    # fall through, should likely not match much, not matched above
    CssRule(
        f"color: {t.ELEMENTAL_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.ELEMENTAL_TAG]),
        f"All {t.ELEMENTAL_TAG} tagged stats",
    ),
    # fall through, should likely not match much, not matched above
    CssRule(
        f"color: {t.RESISTANCE_TAG};",
        m.CSS_SELECTOR,
        tag_rule([t.RESISTANCE_TAG]),
        f"All {t.RESISTANCE_TAG} tagged stats",
    ),
    # max res so different
    CssRule(
        "text-decoration: underline;",
        m.CSS_SELECTOR,
        tag_rule([t.MAXIMUM_TAG]),
        f"{t.MAXIMUM_TAG} res stats (custom tag)",
    ),
]

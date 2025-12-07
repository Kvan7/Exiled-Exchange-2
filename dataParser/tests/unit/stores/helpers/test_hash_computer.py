import pytest

from stores.helpers.hash_computer import HashComputer


@pytest.mark.parametrize(
    "in_id, expected",
    [
        (["base_maximum_life"], 3299347043),
        (
            ["attack_minimum_added_fire_damage", "attack_maximum_added_fire_damage"],
            1573130764,
        ),
        (
            [
                "bleed_on_hit_with_attacks_%",
                "attacks_inflict_bleeding_on_hit",
                "cannot_cause_bleeding",
            ],
            2055966527,
        ),
        (
            [
                "local_unique_jewel_alternate_tree_version",
                "local_unique_jewel_alternate_tree_seed",
                "local_unique_jewel_alternate_tree_keystone",
                "local_unique_jewel_alternate_tree_internal_revision",
            ],
            3418580811,
        ),
        (
            [
                "local_unique_jewel_disconnected_passives_can_be_allocated_around_keystone_hash"
            ],
            2422708892,
        ),
        (
            [
                "current_energy_shield_%_as_elemental_damage_reduction",
            ],
            2342939473,
        ),
        (
            [
                "split_arrow_number_of_additional_arrows",
            ],
            3677628129,
        ),
        (
            [
                "viper_strike_dual_wield_damage_+%_final",
            ],
            4267306471,
        ),
    ],
)
def test_hash_computer(in_id, expected):
    hc = HashComputer()
    assert hc.compute_hash(in_id) == expected


def test_dur():
    in_id = "vaal_animate_weapon_minimum_level_requirement animate_item_maximum_level_requirement".split(
        " "
    )
    expected = 3652125881

    hc = HashComputer()
    assert hc.compute_hash(in_id) == expected

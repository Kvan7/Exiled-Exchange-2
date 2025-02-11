<template>
  <div
    v-if="tags.length"
    class="flex items-center text-xs leading-none gap-x-1"
  >
    <template v-for="tag of tags">
      <ui-popover
        v-if="tag.isMaybeHybrid"
        :delay="[250, null]"
        placement="bottom-start"
        boundary="#price-window"
      >
        <template #target>
          <span :class="[$style[tag.type], $style['is-maybe-hybrid']]">{{
            t(tierOption == "poe2" ? "filters.tier" : "filters.grade", [
              tag.tier,
            ])
          }}</span>
        </template>
        <template #content> {{ t("filters.hybrid_note") }} </template>
      </ui-popover>
      <span v-else :class="$style[tag.type]">{{
        t(tierOption == "poe2" ? "filters.tier" : "filters.grade", [tag.tier])
      }}</span>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ItemCategory, ParsedItem } from "@/parser";
import UiPopover from "@/web/ui/Popover.vue";
import { FilterTag, StatFilter } from "./interfaces";
import { AppConfig } from "@/web/Config";
import { PriceCheckWidget } from "@/web/overlay/widgets";
import { checkPossibleHybrid } from "./hybrid-check";

export default defineComponent({
  components: { UiPopover },
  props: {
    filter: {
      type: Object as PropType<StatFilter>,
      required: true,
    },
    item: {
      type: Object as PropType<ParsedItem>,
      required: true,
    },
  },
  setup(props) {
    const tierOption = computed(
      () => AppConfig<PriceCheckWidget>("price-check")!.tierNumbering,
    );
    const alwaysShowTier = computed(
      () => AppConfig<PriceCheckWidget>("price-check")!.alwaysShowTier,
    );

    const tags = computed(() => {
      const { filter, item } = props;
      const out: Array<{ type: string; tier: number; isMaybeHybrid: boolean }> =
        [];
      for (const source of filter.sources) {
        const tier = source.modifier.info.tier;
        const tierNew = source.modifier.info.tierNew;
        if (!tier || !tierNew) continue;
        const usedTier = tierOption.value === "poe1" ? tier : tierNew;
        const isMaybeHybrid = checkPossibleHybrid(
          source.modifier.info.hybridWithRef,
          props.item.statsByType,
          props.item,
          source,
        );

        if (
          (filter.tag === FilterTag.Explicit ||
            filter.tag === FilterTag.Pseudo ||
            filter.tag === FilterTag.Property) &&
          item.category !== ItemCategory.Jewel &&
          item.category !== ItemCategory.ClusterJewel &&
          item.category !== ItemCategory.MemoryLine
        ) {
          if (tier === 1)
            out.push({ type: "tier-1", tier: usedTier, isMaybeHybrid });
          else if (tier === 2)
            out.push({ type: "tier-2", tier: usedTier, isMaybeHybrid });
          else if (alwaysShowTier.value)
            out.push({ type: "not-tier-1", tier: usedTier, isMaybeHybrid });
        } else if (tier >= 2) {
          // fractured, explicit-* filters
          out.push({ type: "tier-other", tier: usedTier, isMaybeHybrid });
        }
      }
      out.sort((a, b) => a.tier - b.tier);
      return out;
    });

    const { t } = useI18n();
    return { t, tags, tierOption };
  },
});
</script>

<style lang="postcss" module>
.tier-1,
.tier-2,
.not-tier-1,
.tier-other {
  @apply rounded px-1;
}

.tier-1 {
  @apply bg-yellow-500 text-black;
}
.tier-2 {
  @apply border -my-px border-yellow-500 text-yellow-500;
}
.tier-other {
  @apply bg-gray-700 text-black border -my-px border-black;
}
.not-tier-1 {
  @apply bg-gray-700 text-black;
}
.is-maybe-hybrid {
  @apply line-through;
}
</style>

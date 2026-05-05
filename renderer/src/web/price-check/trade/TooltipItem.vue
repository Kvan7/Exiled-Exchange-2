<template>
  <div class="flex flex-col p-1 bg-gray-800 text-center">
    <template v-for="(section, index) in sections">
      <div v-if="section.content" :key="index">
        <div
          v-for="mod in section.content"
          :key="mod.text"
          class="flex items-center justify-between"
        >
          <span class="flex-grow text-center">
            <span
              :class="
                mod.value
                  ? 'text-gray-400'
                  : $style[`number-color-${mod.color}`]
              "
              >{{
                // need to remove builtin %
                mod.text === "item.crit" ||
                mod.text === "item.map_pack_size" ||
                mod.text === "item.map_magic_monsters" ||
                mod.text === "item.map_rare_monsters" ||
                mod.text === "item.map_drop_chance" ||
                mod.text === "item.map_item_rarity" ||
                mod.text === "item.map_gold"
                  ? ((txt) => txt.slice(0, txt.lastIndexOf(" ")))(t(mod.text)) +
                    " "
                  : t(mod.text)
              }}</span
            >
            <span
              v-if="mod.value"
              :class="$style[`number-color-${mod.color}`]"
              >{{ mod.value }}</span
            >
          </span>
        </div>
      </div>
      <hr
        v-if="shouldShowDivider(index)"
        class="block h-[2px] bg-gradient-to-r from-transparent via-gray-400 to-transparent my-1 border-0 border-none"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { PricingResult } from "./pathofexile-trade";
import { useI18n } from "vue-i18n";

export default defineComponent({
  props: {
    result: {
      type: Object as PropType<PricingResult>,
      required: true,
    },
  },
  setup(props) {
    const item = props.result.displayItem;
    const sections = [
      { key: "nameBlock", content: item.nameBlock },
      { key: "itemProps", content: item.itemProps },
      { key: "enchantMods", content: item.enchantMods },
      { key: "runeMods", content: item.runeMods },
      { key: "implicitMods", content: item.implicitMods },
      {
        key: "explicitMods",
        content: [
          // ? maybe keep
          ...(item.fracturedMods ?? []),
          ...(item.explicitMods ?? []),
          ...(item.desecratedMods ?? []),
        ],
      },
      { key: "pseudoMods", content: item.pseudoMods },
    ];
    function isNonEmptyObject(obj: Record<string, string | number>): boolean {
      return Object.values(obj).some((value) => value !== undefined);
    }

    function shouldShowDivider(currentIndex: number) {
      return (
        sections[currentIndex].content &&
        sections[currentIndex].content.length > 0 &&
        sections.slice(currentIndex + 1).some((section) => {
          const { content } = section;
          if (!content) {
            return false;
          }

          // Check if the content is an array or object
          if (Array.isArray(content)) {
            return content.length > 0; // Non-empty array
          }
          if (content && typeof content === "object") {
            return isNonEmptyObject(content); // Non-empty object
          }
          return false; // Otherwise, not valid
        })
      );
    }

    function isExtendedContent(
      content: unknown,
    ): content is { text: string; value: number } {
      return (
        typeof content === "object" &&
        content !== null &&
        !Array.isArray(content)
      );
    }
    const { t } = useI18n();

    return {
      t,
      item,
      sections,
      shouldShowDivider,
      isExtendedContent,
    };
  },
});
</script>

<style lang="postcss" module>
.mod {
  @apply text-sm;
}

.number-color-0 {
  /*white*/
  @apply text-white;
}
.number-color-1 {
  /*aug*/
  @apply text-indigo-500;
}
.number-color-2 {
  /*unmet*/
  @apply text-red-500;
}
.number-color-3 {
  /*physical*/
  @apply text-white;
}
.number-color-4 {
  /*fire*/
  @apply text-red-700;
}
.number-color-5 {
  /*cold*/
  @apply text-blue-700;
}
.number-color-6 {
  /*lightning*/
  @apply text-yellow-500;
}
.number-color-7 {
  /*chaos*/
  @apply text-pink-800;
}
.number-color-8 {
  /*unique*/
  @apply text-orange-700;
}
.number-color-9 {
  /*unreachable*/
  @apply text-gray-500;
}
.number-color-10 {
  /*currency*/
  @apply text-gray-300;
}
.number-color-11 {
  /*reward*/
  @apply text-white;
}
.number-color-12 {
  /*divination*/
  @apply text-blue-300;
}
.number-color-13 {
  /*sanctum boon*/
  @apply text-gray-500;
}
.number-color-14 {
  /*sanctum curse*/
  @apply text-purple-300;
}
.number-color-15 {
  /*sanctum pact*/
  @apply text-pink-200;
}
.number-color-25 {
  /*grant skill*/
  @apply text-indigo-500;
}
.number-color-8729 {
  /*aug*/
  @apply text-indigo-300;
}
.number-color-8730 {
  /*fractured*/
  @apply text-yellow-500;
}
.number-color-8731 {
  /*desecrated*/
  @apply text-indigo-500 bg-gradient-to-l from-green-900 via-transparent to-transparent w-full;
}
</style>

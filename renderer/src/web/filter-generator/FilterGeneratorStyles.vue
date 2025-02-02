<template>
  <div class="p-2">
    <dnd-container
      tag="div"
      class="flex flex-col gap-y-2"
      v-model="styles"
      item-key="id"
      handle="[data-qa=drag-handle]"
      :animation="200"
      :force-fallback="true"
    >
      <template #item="{ element: style }">
        <div
          class="grid gap-0.5"
          style="grid-template-columns: auto 1fr auto auto"
        >
          <button
            class="leading-none cursor-move bg-gray-700 rounded-l w-6 h-6"
            data-qa="drag-handle"
          >
            <i class="fas fa-grip-vertical text-gray-400" />
          </button>
          <input
            v-model="style.name"
            :placeholder="t('filter_generator.friendly_name')"
            class="px-1 col-span-2 leading-6"
          />
          <button
            class="leading-none rounded-r bg-gray-700 w-6 h-6"
            @click="removeStyle(style)"
          >
            <i class="fas fa-times text-gray-400" />
          </button>
          <div v-for="(rule, ruleIdx) in style.rules" :class="$style.rules">
            <input
              v-model="rule.key"
              :placeholder="t('filter_generator.identifier_key')"
              class="bg-gray-700 px-1 col-start-1 rounded"
            />
            <input
              v-model="rule.value"
              :placeholder="t('filter_generator.identifier_value')"
              class="bg-gray-700 px-1 col-start-2 rounded"
            />
            <button
              class="rounded-r bg-gray-700 w-6 h-6 col-start-3"
              @click="removeRule(style, ruleIdx)"
            >
              <i class="fas fa-times text-gray-400" />
            </button>
          </div>
          <button
            class="rounded-r bg-gray-900 px-2 col-start-2 leading-6"
            @click="addRule(style)"
          >
            {{ t("filter_generator.rule_add") }}
          </button>
        </div>
      </template>
    </dnd-container>
    <button class="btn mt-2" style="min-width: 6rem" @click="addStyle">
      {{ t("Add") }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import DndContainer from "vuedraggable";
import HotkeyInput from "../settings/HotkeyInput.vue";
import { configProp, configModelValue } from "../settings/utils.js";
import type { FilterGeneratorWidget } from "./widget.js";

export default defineComponent({
  name: "filter_generator.styles",
  components: { DndContainer, HotkeyInput },
  props: configProp<FilterGeneratorWidget>(),
  setup(props) {
    const { t } = useI18n();

    return {
      t,
      title: configModelValue(() => props.configWidget, "wmTitle"),
      styles: configModelValue(() => props.configWidget, "styles"),
      removeStyle(style: FilterGeneratorWidget["styles"][number]) {
        props.configWidget.styles = props.configWidget.styles.filter(
          (_) => _ !== style,
        );
      },
      addStyle() {
        props.configWidget.styles.push({
          name: "",
          rules: [{ key: "", value: "" }],
        });
      },
      addRule(style: FilterGeneratorWidget["styles"][number]) {
        style.rules.push({
          key: "",
          value: "",
        });
      },
      removeRule(
        style: FilterGeneratorWidget["styles"][number],
        ruleIdx: number,
      ) {
        style.rules.splice(ruleIdx, 1);
      },
    };
  },
});
</script>

<style lang="postcss" module>
.rules {
  @apply grid;
  @apply gap-0.5;
  @apply col-start-2;
  grid-template-columns: 1fr 1fr auto;
}
</style>

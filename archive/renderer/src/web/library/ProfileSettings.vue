<template>
  <div class="max-w-md p-2">
    <div class="mb-4">{{ t("Recording settings") }}</div>
    <!-- <ui-checkbox class="mb-2" v-model="addedMods">{{
      t("added mods column")
    }}</ui-checkbox>
    <ui-checkbox class="mb-2" v-model="removedMods">{{
      t("removed mods column")
    }}</ui-checkbox> -->
    <ui-checkbox class="mb-2" v-model="keepExplicit">{{
      t("keep explicit mods")
    }}</ui-checkbox>
    <ui-checkbox class="mb-2" v-model="keepImplicit">{{
      t("keep implicit mods")
    }}</ui-checkbox>
    <ui-checkbox class="mb-2" v-model="keepEnchant">{{
      t("keep enchant mods")
    }}</ui-checkbox>
    <ui-checkbox class="mb-2" v-model="keepAugment">{{
      t("keep augment mods")
    }}</ui-checkbox>
    <!-- <ui-checkbox class="mb-2" v-model="modOptsTier">{{
      t("show tier")
    }}</ui-checkbox>
    <ui-checkbox class="mb-2" v-model="modOptsRoll">{{
      t("show roll")
    }}</ui-checkbox>
    <ui-checkbox class="mb-2" v-model="modOptsRef">{{
      t("show ref")
    }}</ui-checkbox>
    <ui-checkbox class="mb-2" v-model="modOptsType">{{
      t("show type")
    }}</ui-checkbox> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import { useI18n } from "vue-i18n";
import UiCheckbox from "@/web/ui/UiCheckbox.vue";
import { ColumnOpts } from "./widget";
import { configModelValue } from "../settings/utils";

export default defineComponent({
  emits: [],
  components: { UiCheckbox },
  props: {
    selectedProfile: {
      type: String,
      required: true,
    },
    profiles: {
      type: Object as PropType<Record<string, ColumnOpts>>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const selectedProfile = computed(
      () => props.profiles[props.selectedProfile],
    );

    return {
      t,
      addedMods: configModelValue(() => selectedProfile.value, "addedMods"),
      removedMods: configModelValue(() => selectedProfile.value, "removedMods"),
      keepExplicit: configModelValue(
        () => selectedProfile.value.keep,
        "explicit",
      ),
      keepImplicit: configModelValue(
        () => selectedProfile.value.keep,
        "implicit",
      ),
      keepEnchant: configModelValue(
        () => selectedProfile.value.keep,
        "enchant",
      ),
      keepAugment: configModelValue(
        () => selectedProfile.value.keep,
        "augment",
      ),
      modOptsTier: configModelValue(
        () => selectedProfile.value.modOpts,
        "tier",
      ),
      modOptsRoll: configModelValue(
        () => selectedProfile.value.modOpts,
        "roll",
      ),
      modOptsRef: configModelValue(() => selectedProfile.value.modOpts, "ref"),
      modOptsType: configModelValue(
        () => selectedProfile.value.modOpts,
        "type",
      ),
    };
  },
});
</script>

<style lang="postcss" module></style>

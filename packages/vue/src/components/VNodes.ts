import { defineComponent, type PropType, type VNodeChild } from "vue";

export const KEISEN_FLATTEN_NODES = "__keisenFlattenNodes" as const;

/**
 * 在 template 里铺开已 compose 好的 VNode 列表（mainLayers / paneCharts）。
 * 对父级 slot 解析透明：partition / parseLayer 会展开 props.nodes。
 */
export const VNodes = defineComponent({
  name: "VNodes",
  props: {
    nodes: {
      type: Array as PropType<VNodeChild[]>,
      required: true,
    },
  },
  setup(props) {
    return () => props.nodes;
  },
});

(VNodes as typeof VNodes & { [KEISEN_FLATTEN_NODES]: true })[KEISEN_FLATTEN_NODES] =
  true;

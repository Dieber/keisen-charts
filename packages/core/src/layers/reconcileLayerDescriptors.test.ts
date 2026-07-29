import { beforeEach, describe, expect, test } from "bun:test";

import {
  clearLayerRegistry,
  registerLayerType,
} from "./layerRegistry";
import {
  clearMountedLayers,
  reconcileLayerDescriptors,
  type LayerContainer,
  type LayerReconcileState,
} from "./reconcileLayerDescriptors";

let layerSeq = 0;

const createFakeHost = () => {
  const layers: Array<{ id: string; zIndex: number; label: string }> = [];
  const commits: number[] = [];

  const container: LayerContainer = {
    view: {
      addLayer: (layer) => {
        layers.push(layer);
      },
      removeLayer: (layerId) => {
        const index = layers.findIndex((item) => item.id === layerId);
        if (index >= 0) layers.splice(index, 1);
      },
    },
    onCommit: () => {
      commits.push(layers.length);
    },
  };

  return { container, layers, commits };
};

describe("reconcileLayerDescriptors", () => {
  beforeEach(() => {
    clearLayerRegistry();
    layerSeq = 0;
    registerLayerType("A", {
      createCoreLayer: (props) => ({
        id: `a-${++layerSeq}`,
        zIndex: 1,
        label: String(props.label ?? "A"),
      }),
    });
    registerLayerType("B", {
      createCoreLayer: () => ({
        id: `b-${++layerSeq}`,
        zIndex: 2,
        label: "B",
      }),
    });
  });

  test("mount / update / remove", () => {
    const { container, layers, commits } = createFakeHost();
    const state: LayerReconcileState = {
      mounted: [],
      previousProps: new Map(),
    };

    reconcileLayerDescriptors(
      container,
      [{ key: "a", layerType: "A", props: { label: "1" } }],
      state,
    );
    expect(layers).toHaveLength(1);
    expect(state.mounted).toHaveLength(1);
    expect(commits).toEqual([1]);

    // same props → keep
    const id1 = state.mounted[0]!.coreLayerId;
    reconcileLayerDescriptors(
      container,
      [{ key: "a", layerType: "A", props: { label: "1" } }],
      state,
    );
    expect(state.mounted[0]!.coreLayerId).toBe(id1);
    expect(layers).toHaveLength(1);

    // props change → replace
    reconcileLayerDescriptors(
      container,
      [{ key: "a", layerType: "A", props: { label: "2" } }],
      state,
    );
    expect(state.mounted[0]!.coreLayerId).not.toBe(id1);
    expect(layers).toHaveLength(1);
    expect((layers[0] as { label: string }).label).toBe("2");

    // remove
    reconcileLayerDescriptors(container, [], state);
    expect(layers).toHaveLength(0);
    expect(state.mounted).toHaveLength(0);
  });

  test("clearMountedLayers", () => {
    const { container, layers } = createFakeHost();
    const state: LayerReconcileState = {
      mounted: [],
      previousProps: new Map(),
    };

    reconcileLayerDescriptors(
      container,
      [
        { key: "a", layerType: "A", props: {} },
        { key: "b", layerType: "B", props: {} },
      ],
      state,
    );
    expect(layers).toHaveLength(2);

    clearMountedLayers(container, state);
    expect(layers).toHaveLength(0);
    expect(state.mounted).toHaveLength(0);
    expect(state.previousProps.size).toBe(0);
  });
});

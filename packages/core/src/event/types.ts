export type ChartEvent =
  | {
      type: "pointerdown";
      viewId: string;
      x: number;
      y: number;
      pointerId: number;
      buttons: number;
      pointerType?: string;
    }
  | {
      type: "pointermove";
      viewId: string;
      x: number;
      y: number;
      pointerId: number;
      buttons: number;
      pointerType?: string;
    }
  | {
      type: "pointerup";
      viewId: string;
      x: number;
      y: number;
      pointerId: number;
      buttons: number;
      pointerType?: string;
    }
  | { type: "pointerleave"; viewId: string }
  | { type: "wheel"; viewId: string; x: number; y: number; deltaY: number };

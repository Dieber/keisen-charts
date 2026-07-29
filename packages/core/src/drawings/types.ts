export type DrawingToolId =
  | "horizontal"
  | "vertical"
  | "ray"
  | "parallelLines"
  | "priceChannel"
  | "fibRetracement";

export type DrawingPoint = {
  /**
   * 连续 bar 索引（运行时投影用）。
   * 历史 prepend 后会过期，必须以 `time` 为准重映射。
   */
  barIndex: number;
  /**
   * X 轴语义锚点：K 线时间戳（毫秒）。
   * 画布平移 / 加载历史时保持不变，保证线钉在同一时间。
   */
  time: number;
  /** 该 pane 的 Y 语义值：价格或指标值 */
  value: number;
};

export type DrawingStyle = {
  stroke: string;
  lineWidth: number;
  lineDash?: number[];
};

export type Drawing = {
  id: string;
  tool: DrawingToolId;
  paneId: string;
  points: DrawingPoint[];
  style: DrawingStyle;
  /** 是否可拖动 / 显示锚点手柄；默认 true */
  editable?: boolean;
  locked?: boolean;
  visible?: boolean;
};

export type DrawingDraft = {
  tool: DrawingToolId;
  paneId: string;
  points: DrawingPoint[];
  /** 放置中跟随指针的预览点（未提交） */
  preview?: DrawingPoint | null;
};

export type DrawingGesture = {
  kind: "move" | "resize";
  drawingId: string;
  pointIndex?: number;
  startPointer: { x: number; y: number };
  startPoints: DrawingPoint[];
};

/** 画线命中 / 拖动时的 canvas cursor；null = 回落到 crosshair */
export type DrawingCursor = "pointer" | "grabbing";

export type DrawingsState = {
  /** 全部图形，按 id；paneId 在对象内 */
  items: Record<string, Drawing>;
  /** 当前工具；null = 浏览（十字线） */
  activeTool: DrawingToolId | null;
  /** 进行中的多点放置 */
  draft: DrawingDraft | null;
  /** 选中，供删除/改色 */
  selectedIds: string[];
  /** 画完后是否保持工具 */
  stickyTool: boolean;
  /** 浏览模式下的拖动 / 改锚点手势 */
  gesture: DrawingGesture | null;
  /** 悬停图形 → pointer；拖动中 → grabbing */
  cursor: DrawingCursor | null;
};

export type DrawingProjectHelpers = {
  xOfBar: (barIndex: number) => number;
  yOfValue: (value: number) => number;
  barOfX: (x: number) => number;
  valueOfY: (y: number) => number;
  width: number;
  height: number;
  formatValue?: (value: number) => string;
};

export type DrawingToolModule = {
  id: DrawingToolId;
  pointsRequired: number;
  paintDraft: (
    ctx: CanvasRenderingContext2D,
    points: DrawingPoint[],
    helpers: DrawingProjectHelpers,
    style: DrawingStyle,
  ) => void;
  paint: (
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    helpers: DrawingProjectHelpers,
  ) => void;
  hitTest: (
    x: number,
    y: number,
    drawing: Drawing,
    helpers: DrawingProjectHelpers,
  ) => { dist: number } | null;
  constrainPoint?: (index: number, point: DrawingPoint) => DrawingPoint;
};

export const DEFAULT_DRAWING_STYLE: DrawingStyle = {
  stroke: "#2962ff",
  lineWidth: 1.5,
};

export const createEmptyDrawingsState = (): DrawingsState => ({
  items: {},
  activeTool: null,
  draft: null,
  selectedIds: [],
  stickyTool: false,
  gesture: null,
  cursor: null,
});

/** 选中手柄视觉直径（CSS px） */
export const DRAWING_HANDLE_DIAMETER = 6;
/** 手柄命中半径（略大于视觉半径，便于点选） */
export const DRAWING_HANDLE_HIT_RADIUS = 6;

export const isDrawingEditable = (drawing: Drawing): boolean =>
  drawing.editable !== false;

export const DRAWING_TOOL_IDS: DrawingToolId[] = [
  "horizontal",
  "vertical",
  "ray",
  "parallelLines",
  "priceChannel",
  "fibRetracement",
];

export type DrawingToolMeta = {
  id: DrawingToolId;
  label: string;
  labelEn: string;
};

export const DRAWING_TOOL_METAS: DrawingToolMeta[] = [
  { id: "horizontal", label: "水平线", labelEn: "Horizontal" },
  { id: "vertical", label: "垂直线", labelEn: "Vertical" },
  { id: "ray", label: "射线", labelEn: "Ray" },
  { id: "parallelLines", label: "平行直线", labelEn: "Parallel" },
  { id: "priceChannel", label: "价格通道", labelEn: "Price line" },
  { id: "fibRetracement", label: "斐波那契", labelEn: "Fib" },
];

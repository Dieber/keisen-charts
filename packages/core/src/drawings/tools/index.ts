import { fibRetracementTool } from "./fibRetracement";
import { horizontalTool } from "./horizontal";
import { parallelLinesTool } from "./parallelLines";
import { priceChannelTool } from "./priceChannel";
import { rayTool } from "./ray";
import { verticalTool } from "./vertical";
import type { DrawingToolId, DrawingToolModule } from "../types";

const TOOLS: Record<DrawingToolId, DrawingToolModule> = {
  horizontal: horizontalTool,
  vertical: verticalTool,
  ray: rayTool,
  parallelLines: parallelLinesTool,
  priceChannel: priceChannelTool,
  fibRetracement: fibRetracementTool,
};

export const getDrawingTool = (id: DrawingToolId): DrawingToolModule =>
  TOOLS[id];

export const getAllDrawingTools = (): DrawingToolModule[] =>
  Object.values(TOOLS);

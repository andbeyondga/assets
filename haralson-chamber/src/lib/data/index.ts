import type { ChamberDataSource } from "./source";
import { MockDataSource } from "./mock";
import { GrowthZoneDataSource } from "./growthzone";

export type { ChamberDataSource } from "./source";
export * from "./types";

/**
 * The one place the active data source is chosen.
 *
 * - DATA_SOURCE unset or "mock"  -> JSON seed data (default; zero deps)
 * - DATA_SOURCE="live"           -> the AMS adapter (see growthzone.ts)
 *
 * Pages call getDataSource() and never import an implementation directly,
 * so swapping the backend never touches the UI.
 */
const mock = new MockDataSource();
const live = new GrowthZoneDataSource();

export function getDataSource(): ChamberDataSource {
  return process.env.DATA_SOURCE === "live" ? live : mock;
}

import type { Tooltip } from "layerchart";
import { getChartContext } from "layerchart";
import { getContext, setContext, type Component, type ComponentProps, type Snippet } from "svelte";

export const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
	[k in string]: {
		label?: string;
		icon?: Component;
	} & (
		| { color?: string; theme?: never }
		| { color?: never; theme: Record<keyof typeof THEMES, string> }
	);
};

export type ExtractSnippetParams<T> = T extends Snippet<[infer P]> ? P : never;

export type TooltipPayload = ExtractSnippetParams<
	ComponentProps<typeof Tooltip.Root>["children"]
>["payload"][number];

// Helper to extract item config from a payload.
export function getPayloadConfigFromPayload(
	config: ChartConfig,
	payload: TooltipPayload,
	key: string
) {
	if (typeof payload !== "object" || payload === null) return undefined;

	const payloadPayload =
		"payload" in payload && typeof payload.payload === "object" && payload.payload !== null
			? payload.payload
			: undefined;

	let configLabelKey: string = key;

	if (payload.key === key) {
		configLabelKey = payload.key;
	} else if (payload.name === key) {
		configLabelKey = payload.name;
	} else if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
		configLabelKey = payload[key as keyof typeof payload] as string;
	} else if (
		payloadPayload !== undefined &&
		key in payloadPayload &&
		typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
	) {
		configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
	}

	return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}

type ChartContextValue = {
	config: ChartConfig;
};

const chartContextKey = Symbol("chart-context");

export function setChartContext(value: ChartContextValue) {
	return setContext(chartContextKey, value);
}

export function useChart() {
	return getContext<ChartContextValue>(chartContextKey);
}

/**
 * Bridge for layerchart 2.x: `getTooltipContext` does not exist as an export.
 * layerchart 2.x exposes the tooltip state via `getChartContext().tooltip` (a
 * TooltipState with `series: TooltipSeries[]`), not via a `getTooltipContext()`
 * hook. This helper returns the `{ payload }` shape that chart-tooltip.svelte
 * consumes, mapping layerchart's `series` entries onto it.
 *
 * Returns `{ payload: [] }` when no chart context is available (SSR / not
 * wrapped in a chart), so the tooltip renders an empty state instead of
 * throwing — which previously crashed the module graph and caused the
 * /tasks 500er.
 */
export function getTooltipPayload(): { payload: TooltipPayload[] } {
	try {
		// @ts-ignore — layerchart 2.x: ChartState.tooltip is TooltipState, expose getter
		const state = getChartContext?.() as any;
		const series = state?.tooltip?.series ?? [];
		// @ts-ignore — map layerchart TooltipSeries onto our payload item shape
		const payload = series.map((s: any) => ({
			key: s.key,
			name: s.label ?? s.key,
			label: s.label,
			value: s.value,
			color: s.color,
			payload: s,
		}));
		return { payload };
	} catch {
		return { payload: [] };
	}
}

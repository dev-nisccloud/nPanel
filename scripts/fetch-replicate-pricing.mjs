const models = [
	"anthropic/claude-4.5-haiku",
	"anthropic/claude-4.5-sonnet",
	"anthropic/claude-3.7-sonnet",
	"anthropic/claude-opus-4.6",
	"google/gemini-3.1-pro",
	"google/gemini-2.5-flash",
	"google/gemini-3-pro",
	"openai/gpt-5.2",
	"openai/gpt-5",
	"openai/gpt-5-nano",
	"openai/gpt-4o",
	"deepseek-ai/deepseek-v3",
	"openai/gpt-image-2",
	"google/imagen-4-ultra",
	"google/imagen-4-fast",
	"bytedance/seedream-4.5",
	"black-forest-labs/flux-2-pro",
	"black-forest-labs/flux-2-max",
	"google/nano-banana-2",
	"google/nano-banana-pro",
	"google/nano-banana",
	"xai/grok-imagine-image",
	"openai/gpt-image-1.5",
	"prunaai/hidream-l1-fast",
	"prunaai/z-image-turbo",
	"prunaai/p-video",
	"bytedance/seedance-2.0",
	"bytedance/seedance-1-lite",
	"bytedance/seedance-1-pro",
	"google/veo-3.1-fast",
	"google/veo-3.1",
	"google/veo-3",
	"google/veo-3-fast",
	"google/veo-2",
	"xai/grok-imagine-video",
	"runwayml/gen-4.5",
	"wan-video/wan-2.2-i2v-fast",
	"kwaivgi/kling-v2.1",
	"kwaivgi/kling-v2.6",
	"kwaivgi/kling-v2.5-turbo-pro",
	"kwaivgi/kling-v3-omni-video",
	"kwaivgi/kling-v3-video",
	"minimax/speech-2.8-hd",
	"minimax/speech-2.8-turbo",
	"minimax/speech-02-hd",
	"qwen/qwen3-tts",
	"vaibhavs10/incredibly-fast-whisper",
	"bria/eraser",
	"bria/generate-background",
	"recraft-ai/recraft-crisp-upscale",
	"qwen/qwen-image-edit-2511",
	"black-forest-labs/flux-1.1-pro",
];

async function fetchPricing(id) {
	const url = `https://replicate.com/${id}`;
	try {
		const res = await fetch(url, {
			headers: { "User-Agent": "nPanel-pricing-audit/1.0" },
		});
		const html = await res.text();

		const pricingIdx = html.indexOf('id="pricing"');
		const slice =
			pricingIdx >= 0
				? html.slice(pricingIdx, pricingIdx + 12000)
				: html;

		const scriptMatch = slice.match(
			/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/,
		);
		if (scriptMatch) {
			try {
				const parsed = JSON.parse(scriptMatch[1]);
				if (parsed.billingConfig) {
					return { id, billing: parsed.billingConfig, modelName: parsed.modelName };
				}
			} catch {
				// fall through
			}
		}

		const hardwareMatch = html.match(/"hardware":\s*"([^"]+)"/);
		const priceMatch = html.match(/"price":\s*"(\$[^"]+)"/);
		return {
			id,
			error: "no billingConfig",
			hardware: hardwareMatch?.[1],
			fallbackPrice: priceMatch?.[1],
		};
	} catch (e) {
		return { id, error: String(e.message || e) };
	}
}

const fs = await import("node:fs");
const results = [];
for (const id of models) {
	results.push(await fetchPricing(id));
	await new Promise((r) => setTimeout(r, 250));
}

const outPath = new URL("./replicate-pricing-output.json", import.meta.url);
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

const summary = results.map((row) => {
	if (row.error) {
		return {
			id: row.id,
			error: row.error,
			hardware: row.hardware,
			fallbackPrice: row.fallbackPrice,
		};
	}
	const tiers = row.billing?.current_tiers || [];
	const prices = [];
	for (const t of tiers) {
		const crit = (t.criteria || [])
			.map((c) => c.description || c.title)
			.filter(Boolean)
			.join("; ");
		for (const p of t.prices || []) {
			prices.push({
				tier: crit || null,
				metric: p.metric,
				price: p.price,
				unit: p.title,
				note: p.description,
			});
		}
	}
	return { id: row.id, prices };
});

const summaryPath = new URL("./replicate-pricing-summary.json", import.meta.url);
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log("Wrote", results.length, "models to", outPath.pathname);

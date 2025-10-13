export default {
	async fetch(request, env, ctx): Promise<Response> {
		const decompressedSize = parseInt(env.DECOMPRESSED_SIZE_IN_GIB || "1") * 8192;
		const cache = caches.default;
		const cacheKey = `https://70348622-563c-41d5-ad4b-82d056474625/${decompressedSize}`
		const contentTypes = [
			"text/html; charset=utf-8",
			"application/json"
		];
		const randomContentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
		let response = await cache.match(cacheKey);
		if (!response) {
			const initialData = new Uint8Array([0x28, 0xB5, 0x2F, 0xFD, 0x00, 0x38]);

			const repeatPattern = new Uint8Array([0x02, 0x00, 0x10, 0x48]);
			const repeatPattern2 = new Uint8Array([0x03, 0x00, 0x10, 0x48]);

			const fullData = new Uint8Array(initialData.length + repeatPattern.length * decompressedSize);
			fullData.set(initialData, 0);
			for (let i = 0; i < decompressedSize; i++) {
				fullData.set(i == decompressedSize - 1 ? repeatPattern2 : repeatPattern, initialData.length + i * repeatPattern.length);
			}

			const headers = new Headers();
			headers.set("Content-Encoding", "zstd")
			headers.set("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS")
			headers.set("Access-Control-Max-Age", "86400")
			headers.set('Transfer-Encoding', 'chunked')
			headers.set("Cache-Control", "public, max-age=31536000")

			response = new Response(fullData, {
				status: 200,
				headers: headers,
			})
			ctx.waitUntil(cache.put(cacheKey, response.clone()));
		}
		const newHeaders = new Headers(response.headers);
		newHeaders.set("Access-Control-Allow-Origin", request.headers.get("Origin") ?? "*");
		newHeaders.set("Access-Control-Allow-Headers", request.headers.get("Access-Control-Request-Headers") ?? "*")
		newHeaders.set("Content-Type", randomContentType)
		return new Response(response.body, {
			headers: newHeaders,
			status: response.status,
		});
	},
} satisfies ExportedHandler<Env>;

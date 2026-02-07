import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// GET /api/partners/:partnerId/store-config - Get store configuration for a partner
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ partnerId: string }> },
) {
	try {
		const { partnerId } = await params;
		const id = Number(partnerId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid partner id" },
				{ status: 400 },
			);
		}

		const db = getDb();

		const partner = (await db
			.prepare(
				`
				SELECT
					id, name, is_active, store_config
				FROM loyalty_partners
				WHERE id = ?
				`,
			)
			.get(id)) as {
			id: number;
			name: string;
			is_active: boolean;
			store_config: string | null;
		} | null;

		if (!partner) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 });
		}

		// Parse store_config JSON if it exists
		let storeConfig = {};
		if (partner.store_config) {
			try {
				storeConfig =
					typeof partner.store_config === "string"
						? JSON.parse(partner.store_config)
						: partner.store_config;
			} catch {
				storeConfig = {};
			}
		}

		return NextResponse.json({
			id: partner.id,
			name: partner.name,
			is_active: partner.is_active,
			store_config: storeConfig,
		});
	} catch (error) {
		console.error("GET /api/partners/:id/store-config error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// PATCH /api/partners/:partnerId/store-config - Update store configuration for a partner
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ partnerId: string }> },
) {
	try {
		const { partnerId } = await params;
		const id = Number(partnerId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid partner id" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { store_config } = body;

		if (!store_config || typeof store_config !== "object") {
			return NextResponse.json(
				{ error: "store_config must be an object" },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if partner exists
		const existing = (await db
			.prepare("SELECT id, store_config FROM loyalty_partners WHERE id = ?")
			.get(id)) as { id: number; store_config: string | null } | undefined;

		if (!existing) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 });
		}

		// Merge with existing config (deep merge would be ideal, but shallow works for now)
		let existingConfig = {};
		if (existing.store_config) {
			try {
				existingConfig =
					typeof existing.store_config === "string"
						? JSON.parse(existing.store_config)
						: existing.store_config;
			} catch {
				existingConfig = {};
			}
		}

		// Deep merge the configurations
		const mergedConfig = deepMerge(existingConfig, store_config);

		// Update the store_config
		await db
			.prepare(
				`UPDATE loyalty_partners SET store_config = ?::jsonb WHERE id = ?`,
			)
			.run(JSON.stringify(mergedConfig), id);

		// Return the updated config
		return NextResponse.json({
			id,
			store_config: mergedConfig,
			message: "Store configuration updated successfully",
		});
	} catch (error) {
		console.error("PATCH /api/partners/:id/store-config error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// PUT /api/partners/:partnerId/store-config - Replace entire store configuration
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ partnerId: string }> },
) {
	try {
		const { partnerId } = await params;
		const id = Number(partnerId);
		if (Number.isNaN(id)) {
			return NextResponse.json(
				{ error: "Invalid partner id" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const { store_config } = body;

		if (!store_config || typeof store_config !== "object") {
			return NextResponse.json(
				{ error: "store_config must be an object" },
				{ status: 400 },
			);
		}

		const db = getDb();

		// Check if partner exists
		const existing = (await db
			.prepare("SELECT id FROM loyalty_partners WHERE id = ?")
			.get(id)) as { id: number } | undefined;

		if (!existing) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 });
		}

		// Replace the entire store_config
		await db
			.prepare(
				`UPDATE loyalty_partners SET store_config = ?::jsonb WHERE id = ?`,
			)
			.run(JSON.stringify(store_config), id);

		return NextResponse.json({
			id,
			store_config,
			message: "Store configuration replaced successfully",
		});
	} catch (error) {
		console.error("PUT /api/partners/:id/store-config error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// Helper function for deep merging objects
function deepMerge<T extends Record<string, unknown>>(
	target: T,
	source: Partial<T>,
): T {
	const result = { ...target };

	for (const key in source) {
		if (Object.prototype.hasOwnProperty.call(source, key)) {
			const sourceValue = source[key];
			const targetValue = target[key];

			if (
				sourceValue !== null &&
				typeof sourceValue === "object" &&
				!Array.isArray(sourceValue) &&
				targetValue !== null &&
				typeof targetValue === "object" &&
				!Array.isArray(targetValue)
			) {
				result[key] = deepMerge(
					targetValue as Record<string, unknown>,
					sourceValue as Record<string, unknown>,
				) as T[Extract<keyof T, string>];
			} else if (sourceValue !== undefined) {
				result[key] = sourceValue as T[Extract<keyof T, string>];
			}
		}
	}

	return result;
}

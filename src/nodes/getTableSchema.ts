import { createNodeDescriptor, INodeFunctionBaseParams } from "@cognigy/extension-tools";
import axios from "axios";

export interface IGetTableSchemaParams extends INodeFunctionBaseParams {
	config: {
		connection: {
			accessToken: string;
		};
		baseId: string;
		tableName: string;
		storeLocation: string;
		inputKey: string;
		contextKey: string;
	};
}

export const getTableSchemaNode = createNodeDescriptor({
	type: "airtable-get-table-schema",
	defaultLabel: "Get Table Schema",
	preview: {
		key: "baseId",
		type: "text"
	},
	fields: [
		{
			key: "connection",
			label: "Airtable Connection",
			type: "connection",
			params: {
				connectionType: "airtable-token",
				required: true
			}
		},
		{
			key: "baseId",
			label: "Base ID",
			type: "cognigyText",
			description: "The Airtable base ID (found in the URL: app...)",
			params: {
				required: true
			}
		},
		{
			key: "tableName",
			label: "Table Name (Optional)",
			type: "cognigyText",
			description: "Specific table name to filter by (leave empty to get all tables)",
			defaultValue: ""
		},
		{
			key: "storeLocation",
			type: "select",
			label: "Where to store the result",
			params: {
				options: [
					{
						label: "Input",
						value: "input"
					},
					{
						label: "Context",
						value: "context"
					}
				],
				required: true
			},
			defaultValue: "context"
		},
		{
			key: "inputKey",
			type: "cognigyText",
			label: "Input Key to store Result",
			defaultValue: "airtableSchema",
			condition: {
				key: "storeLocation",
				value: "input"
			}
		},
		{
			key: "contextKey",
			type: "cognigyText",
			label: "Context Key to store Result",
			defaultValue: "airtableSchema",
			condition: {
				key: "storeLocation",
				value: "context"
			}
		}
	],
	sections: [
		{
			key: "storageOption",
			label: "Storage Option",
			defaultCollapsed: true,
			fields: [
				"storeLocation",
				"inputKey",
				"contextKey"
			]
		}
	],
	form: [
		{ type: "field", key: "connection" },
		{ type: "field", key: "baseId" },
		{ type: "field", key: "tableName" },
		{ type: "section", key: "storageOption" }
	],
	appearance: {
		color: "#ffb100"
	},
	function: async ({ cognigy, config }: INodeFunctionBaseParams) => {
		const { api } = cognigy;
		const {
			connection,
			baseId,
			tableName,
			storeLocation,
			inputKey,
			contextKey
		} = config as IGetTableSchemaParams["config"];

		// Start logging
		api.log("info", `Get Table Schema - Base: ${baseId}${tableName ? `, Table: ${tableName}` : " (all tables)"}`);

		try {
			const response = await axios.get(
				`https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
				{
					headers: {
						Authorization: `Bearer ${connection.accessToken}`,
						"Content-Type": "application/json"
					}
				}
			);

			let tables = response.data.tables;

			// Filter by table name if specified
			if (tableName) {
				tables = tables.filter((t: any) => t.name === tableName);
				api.log("debug", `Filtered to ${tables.length} table(s) matching "${tableName}"`);
			}

			api.log("info", `Retrieved schema for ${tables.length} table(s)`);

			// Build result with useful information
			const result = {
				tables: tables.map((table: any) => ({
					id: table.id,
					name: table.name,
					description: table.description || null,
					fieldCount: table.fields?.length || 0,
					fields: table.fields?.map((field: any) => ({
						id: field.id,
						name: field.name,
						type: field.type,
						description: field.description || null,
						options: field.options || null
					})) || []
				})),
				total: tables.length
			};

			// Log field counts for each table
			tables.forEach((table: any) => {
				api.log("debug", `Table "${table.name}": ${table.fields?.length || 0} fields`);
			});

			if (storeLocation === "context") {
				api.addToContext(contextKey, result, "simple");
			} else {
				// @ts-ignore
				api.addToInput(inputKey, result);
			}

		} catch (error: any) {
			api.log("error", `Error retrieving table schema - Status: ${error.response?.status || "N/A"}, Message: ${error.response?.data?.error?.message || error.message}`);

			const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error occurred";
			const errorResult = {
				error: true,
				message: errorMessage,
				status: error.response?.status
			};

			if (storeLocation === "context") {
				api.addToContext(contextKey, errorResult, "simple");
			} else {
				// @ts-ignore
				api.addToInput(inputKey, errorResult);
			}
		}
	}
});

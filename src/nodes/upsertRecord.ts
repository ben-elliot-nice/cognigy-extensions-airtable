import { createNodeDescriptor, INodeFunctionBaseParams } from "@cognigy/extension-tools";
import axios from "axios";

export interface IUpsertRecordParams extends INodeFunctionBaseParams {
	config: {
		connection: {
			accessToken: string;
		};
		baseId: string;
		tableName: string;
		recordId: string;
		fields: any;
		storeLocation: string;
		inputKey: string;
		contextKey: string;
	};
}

export const upsertRecordNode = createNodeDescriptor({
	type: "airtable-upsert-record",
	defaultLabel: "Upsert Record",
	preview: {
		key: "tableName",
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
			label: "Table Name",
			type: "cognigyText",
			description: "The name of the table to update",
			params: {
				required: true
			}
		},
		{
			key: "recordId",
			label: "Record ID",
			type: "cognigyText",
			description: "The Airtable record ID to update (e.g., rec123abc)",
			params: {
				required: true
			}
		},
		{
			key: "fields",
			label: "Fields to Update",
			type: "json",
			description: "JSON object containing field names and values to update",
			params: {
				required: true
			}
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
			defaultValue: "airtableUpsertResult",
			condition: {
				key: "storeLocation",
				value: "input"
			}
		},
		{
			key: "contextKey",
			type: "cognigyText",
			label: "Context Key to store Result",
			defaultValue: "airtableUpsertResult",
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
		{ type: "field", key: "recordId" },
		{ type: "field", key: "fields" },
		{ type: "section", key: "storageOption" }
	],
	appearance: {
		color: "#ffb100"
	},
	dependencies: {
		children: ["success", "notFound", "error"]
	},
	function: async ({ cognigy, config, childConfigs }: INodeFunctionBaseParams) => {
		const { api } = cognigy;
		const {
			connection,
			baseId,
			tableName,
			recordId,
			fields,
			storeLocation,
			inputKey,
			contextKey
		} = config as IUpsertRecordParams["config"];

		try {
			const response = await axios.patch(
				`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}/${recordId}`,
				{
					fields
				},
				{
					headers: {
						Authorization: `Bearer ${connection.accessToken}`,
						"Content-Type": "application/json"
					}
				}
			);

			const result = {
				success: true,
				record: response.data
			};

			if (storeLocation === "context") {
				api.addToContext(contextKey, result, "simple");
			} else {
				// @ts-ignore
				api.addToInput(inputKey, result);
			}

			const successChild = childConfigs.find(child => child.type === "success");
			if (successChild) api.setNextNode(successChild.id);

		} catch (error: any) {
			// Check if it's a 404 (record not found)
			if (error.response?.status === 404) {
				const notFoundResult = {
					success: false,
					notFound: true,
					message: `Record not found: ${recordId}`,
					recordId
				};

				if (storeLocation === "context") {
					api.addToContext(contextKey, notFoundResult, "simple");
				} else {
					// @ts-ignore
					api.addToInput(inputKey, notFoundResult);
				}

				const notFoundChild = childConfigs.find(child => child.type === "notFound");
				if (notFoundChild) api.setNextNode(notFoundChild.id);
				return;
			}

			// Other errors
			const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error occurred";
			const errorResult = {
				success: false,
				error: true,
				message: errorMessage,
				status: error.response?.status,
				type: error.response?.data?.error?.type
			};

			if (storeLocation === "context") {
				api.addToContext(contextKey, errorResult, "simple");
			} else {
				// @ts-ignore
				api.addToInput(inputKey, errorResult);
			}

			const errorChild = childConfigs.find(child => child.type === "error");
			if (errorChild) api.setNextNode(errorChild.id);
		}
	}
});

// Child node definitions
export const upsertSuccessNode = createNodeDescriptor({
	type: "success",
	parentType: "airtable-upsert-record",
	defaultLabel: "Success",
	appearance: {
		color: "#2ecc71",
		textColor: "white",
		variant: "mini"
	},
	constraints: {
		editable: false,
		deletable: true,
		collapsable: true,
		creatable: true,
		movable: false,
		placement: {
			predecessor: {
				whitelist: []
			}
		}
	}
});

export const upsertNotFoundNode = createNodeDescriptor({
	type: "notFound",
	parentType: "airtable-upsert-record",
	defaultLabel: "Not Found",
	appearance: {
		color: "#f39c12",
		textColor: "white",
		variant: "mini"
	},
	constraints: {
		editable: false,
		deletable: true,
		collapsable: true,
		creatable: true,
		movable: false,
		placement: {
			predecessor: {
				whitelist: []
			}
		}
	}
});

export const upsertErrorNode = createNodeDescriptor({
	type: "error",
	parentType: "airtable-upsert-record",
	defaultLabel: "Error",
	appearance: {
		color: "#e74c3c",
		textColor: "white",
		variant: "mini"
	},
	constraints: {
		editable: false,
		deletable: true,
		collapsable: true,
		creatable: true,
		movable: false,
		placement: {
			predecessor: {
				whitelist: []
			}
		}
	}
});

import { createNodeDescriptor, INodeFunctionBaseParams } from "@cognigy/extension-tools";
import axios from "axios";

export interface IGetAllParams extends INodeFunctionBaseParams {
	config: {
		connection: {
			accessToken: string;
		};
		baseId: string;
		tableName: string;
		filterByFormula: string;
		fields: string[];
		maxRecords: number;
		sortField: string;
		sortDirection: string;
		storeLocation: string;
		inputKey: string;
		contextKey: string;
	};
}

export const getAllNode = createNodeDescriptor({
	type: "airtable-getall",
	defaultLabel: "Get All Records",
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
			description: "The name of the table to query",
			params: {
				required: true
			}
		},
		{
			key: "filterByFormula",
			label: "Filter Formula",
			type: "cognigyText",
			description: "Airtable formula to filter records (optional)",
			defaultValue: ""
		},
		{
			key: "fields",
			label: "Fields to Retrieve",
			type: "textArray",
			description: "Specific fields to return (leave empty for all fields)",
			defaultValue: []
		},
		{
			key: "maxRecords",
			label: "Max Records",
			type: "number",
			description: "Maximum number of records to return",
			defaultValue: 100,
			params: {
				min: 1,
				max: 100
			}
		},
		{
			key: "sortField",
			label: "Sort Field",
			type: "cognigyText",
			description: "Field name to sort by (optional)",
			defaultValue: ""
		},
		{
			key: "sortDirection",
			label: "Sort Direction",
			type: "select",
			defaultValue: "asc",
			params: {
				options: [
					{
						label: "Ascending",
						value: "asc"
					},
					{
						label: "Descending",
						value: "desc"
					}
				]
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
			defaultValue: "airtableRecords",
			condition: {
				key: "storeLocation",
				value: "input"
			}
		},
		{
			key: "contextKey",
			type: "cognigyText",
			label: "Context Key to store Result",
			defaultValue: "airtableRecords",
			condition: {
				key: "storeLocation",
				value: "context"
			}
		}
	],
	sections: [
		{
			key: "queryOptions",
			label: "Query Options",
			defaultCollapsed: true,
			fields: [
				"filterByFormula",
				"fields",
				"maxRecords",
				"sortField",
				"sortDirection"
			]
		},
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
		{ type: "section", key: "queryOptions" },
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
			filterByFormula,
			fields,
			maxRecords,
			sortField,
			sortDirection,
			storeLocation,
			inputKey,
			contextKey
		} = config as IGetAllParams["config"];

		try {
			const params: any = {
				maxRecords
			};

			if (filterByFormula) {
				params.filterByFormula = filterByFormula;
			}

			if (fields && fields.length > 0) {
				params.fields = fields;
			}

			if (sortField) {
				params.sort = [{ field: sortField, direction: sortDirection }];
			}

			const response = await axios.get(
				`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
				{
					headers: {
						Authorization: `Bearer ${connection.accessToken}`,
						"Content-Type": "application/json"
					},
					params
				}
			);

			const result = {
				records: response.data.records,
				offset: response.data.offset || null,
				total: response.data.records.length
			};

			if (storeLocation === "context") {
				api.addToContext(contextKey, result, "simple");
			} else {
				// @ts-ignore
				api.addToInput(inputKey, result);
			}

		} catch (error: any) {
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
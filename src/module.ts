import { createExtension } from "@cognigy/extension-tools";

/* import all nodes */
import { getAllNode } from "./nodes/getAll";
import { getOneOrFailNode, successNode, notFoundNode, multipleFoundNode, errorNode } from "./nodes/getOneOrFail";
import { insertRecordNode } from "./nodes/insertRecord";

/* import all connections */
import { airtableConnection } from "./connections/airtableConnection";

export default createExtension({
	nodes: [
		getAllNode,
		getOneOrFailNode,
		insertRecordNode,
		successNode,
		notFoundNode,
		multipleFoundNode,
		errorNode
	],

	connections: [
		airtableConnection
	],

	options: {
		label: "Airtable"
	}
});
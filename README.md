# Airtable Extension

This Extension integrates Cognigy.AI with Airtable, allowing you to query and retrieve records from your Airtable bases.

## Connection: airtableConnection

The Airtable Extension requires a Personal Access Token to authenticate with the Airtable API.

**Connection Fields:**
- **Personal Access Token**: Your Airtable Personal Access Token (create one at https://airtable.com/create/tokens)

## Nodes

### Insert Record

Inserts a new record into an Airtable table.

**Configuration:**
- **Airtable Connection**: The connection configured with your Personal Access Token
- **Base ID**: The Airtable base ID (found in the URL after 'app', e.g., 'appABC123')
- **Table Name**: The name of the table to insert into
- **Record Fields**: JSON object containing the field names and values for the new record
- **Storage Options**: Choose where to store the result (Input or Context)

**Output Format (Success):**
```json
{
  "success": true,
  "record": {...}, // The created Airtable record with all fields
  "id": "recXXXXXXXXXXXXXX", // The ID of the newly created record
  "createdTime": "2024-01-15T10:30:00.000Z" // Timestamp of creation
}
```

**Output Format (Error):**
```json
{
  "success": false,
  "error": true,
  "message": "Error description",
  "status": 422,
  "type": "INVALID_REQUEST_BODY"
}
```

### Get All Records

Retrieves multiple records from an Airtable table with optional filtering and sorting.

**Configuration:**
- **Airtable Connection**: The connection configured with your Personal Access Token
- **Base ID**: The Airtable base ID (found in the URL after 'app', e.g., 'appABC123')
- **Table Name**: The name of the table to query
- **Filter Formula**: (Optional) Airtable formula to filter records
- **Fields to Retrieve**: (Optional) Specific fields to return (returns all if empty)
- **Max Records**: Maximum number of records to return (1-100, default: 100)
- **Sort Field**: (Optional) Field name to sort by
- **Sort Direction**: Ascending or Descending sort order
- **Storage Options**: Choose where to store the result (Input or Context)

**Output Format:**
```json
{
  "records": [...], // Array of Airtable records
  "offset": "...", // Pagination offset (if applicable)
  "total": 25 // Number of records returned
}
```

### Get One Record (Or Fail)

Retrieves exactly one record based on a search criteria. This node has multiple exit paths based on the result.

**Configuration:**
- **Airtable Connection**: The connection configured with your Personal Access Token
- **Base ID**: The Airtable base ID
- **Table Name**: The name of the table to query
- **Search Field**: The field name to search in
- **Search Value**: The value to search for
- **Fields to Retrieve**: (Optional) Specific fields to return
- **Storage Options**: Choose where to store the result

**Exit Paths:**
- **Success**: Exactly one record was found
- **Not Found**: No records matched the search criteria
- **Multiple Found**: More than one record matched the search criteria
- **Error**: An error occurred during the API call

**Output Format (Success):**
```json
{
  "found": true,
  "multiple": false,
  "record": {...} // The Airtable record
}
```

**Output Format (Not Found):**
```json
{
  "found": false,
  "message": "No record found with Email = 'user@example.com'"
}
```

**Output Format (Multiple Found):**
```json
{
  "found": true,
  "multiple": true,
  "count": 3,
  "message": "Multiple records found (3) with Name = 'John'",
  "records": [...] // Array of all matching records
}
```

## Usage Examples

### Example 1: Insert a New Customer
- **Base ID**: `appABC123XYZ`
- **Table Name**: `Customers`
- **Record Fields**:
```json
{
  "Name": "John Doe",
  "Email": "john@example.com",
  "Status": "Active",
  "Sign-up Date": "2024-01-15"
}
```

This will create a new customer record with the specified fields.

### Example 2: Get All Customers
- **Base ID**: `appABC123XYZ`
- **Table Name**: `Customers`
- **Filter Formula**: `{Status} = 'Active'`
- **Sort Field**: `Name`
- **Sort Direction**: `Ascending`

### Example 2: Find User by Email
- **Base ID**: `appABC123XYZ`
- **Table Name**: `Users`
- **Search Field**: `Email`
- **Search Value**: `{{input.text}}`

This will search for a user with the email address provided in the user input and follow different paths based on whether 0, 1, or multiple users are found.

## Error Handling

Both nodes include comprehensive error handling:
- Network errors
- Authentication errors
- Invalid base/table names
- Malformed filter formulas
- API rate limiting

Errors are stored in the same location as successful results with an `error: true` flag and descriptive error messages.
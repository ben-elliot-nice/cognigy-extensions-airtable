# Project Context: Cognigy.AI Extension with Git Flow

## Project Overview
This is a Cognigy.AI Extension project that creates custom nodes for Cognigy.AI 4.0+. Extensions are TypeScript projects that compile to tarballs and get uploaded to Cognigy.AI.

## Repository Structure
- `src/nodes/*.ts` - Node implementations (custom flow nodes)
- `src/module.ts` - Main entry point that exports all nodes and connections
- `package.json` - Project metadata, current version is critical for releases
- `tsconfig.json` - TypeScript config (includes `src/**/*`, excludes `docs`, `build`, `node_modules`)
- `.github/workflows/` - GitHub Actions for CI/CD

## Git Flow Setup
We use a standard git flow with automation:

### Branches
- `main` - Production, tagged releases only
- `develop` - Integration branch, builds run here
- `feature/*` - Feature branches for new work

### GitHub Actions Workflows

**1. version-check.yml** (triggers on PR to `develop`)
- Validates version was bumped in package.json
- Runs lint
- Blocks merge if version unchanged

**2. build.yml** (triggers on push to `develop`)
- Runs `npm run build`
- Creates two artifacts:
  - `{package-name}-{version}.tar.gz` - Release tarball
  - `build-debug-{version}` - Uncompressed build files for debugging

**3. release.yml** (triggers on push to `main`)
- Checks if tag already exists (skips if yes)
- Runs build
- Creates GitHub release with tag `v{version}`
- Attaches tarball to release
- Auto-generates release notes

### Standard Workflow for Adding Features

```bash
# 1. Start from develop
git checkout develop
git pull

# 2. Create feature branch
git checkout -b feature/my-new-node

# 3. Make code changes (add node, update module.ts)
# ... write code ...

# 4. Test build locally
npm run build

# 5. Commit code changes FIRST
git add src/
git commit -m "Add my new node

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 6. Bump version with npm (creates its own commit)
npm version patch  # or minor/major

# 7. Push feature branch
git push -u origin feature/my-new-node

# 8. Create PR to develop (triggers version check + lint)
gh pr create --base develop --head feature/my-new-node --title "Add my new node" --body "..."

# 9. Merge PR (triggers build on develop)

# 10. When ready to release: Create PR develop -> main
gh pr create --base main --head develop --title "Release v0.0.X" --body "..."

# 11. Merge to main (triggers release creation)
```

## Cognigy Extension Structure

### Node Example
```typescript
import { createNodeDescriptor, INodeFunctionBaseParams } from "@cognigy/extension-tools";

export interface IMyNodeParams extends INodeFunctionBaseParams {
	config: {
		fieldName: string;
	};
}

export const myNode = createNodeDescriptor({
	type: "myNodeType",
	defaultLabel: "My Node Label",
	fields: [
		{
			key: "fieldName",
			label: "Field Label",
			type: "cognigyText", // or "say", "json", "number", etc.
			defaultValue: "default value",
			description: "Help text"
		}
	],
	preview: {
		type: "text",
		key: "fieldName"
	},
	function: async ({ cognigy, config }: IMyNodeParams) => {
		const { api, context } = cognigy;
		const { fieldName } = config;

		// Do something with the field
		context.myOutput = fieldName;
		api.output("Message to user");
		// or api.say("Output text");
	}
});
```

### Available Field Types
- `cognigyText` - Text with CognigyScript support
- `say` - Full Say control (text, data, quick replies, galleries)
- `json` - JSON editor
- `number`, `slider`, `toggle`, `checkbox`
- `date`, `datetime`, `daterange`, `time`
- `select`, `chipInput`, `textArray`
- `connection` - References a connection for API credentials
- `adaptivecard`, `xml`

### Module Registration
```typescript
// src/module.ts
import { createExtension } from "@cognigy/extension-tools";
import { myNode } from "./nodes/myNode";

export default createExtension({
	nodes: [
		myNode
	],
	connections: []
});
```

## Build Process
- `npm run transpile` - Compiles TypeScript to `build/`
- `npm run lint` - Runs tslint
- `npm run zip` - Creates `{package-name}-{version}.tar.gz` with build/, package.json, package-lock.json, README.md, icon.png
- `npm run build` - Runs all three in sequence

## Important Notes
- **Always commit code changes BEFORE running `npm version`** - npm version requires clean working directory
- **Version must be bumped** for every PR to develop - version-check workflow will fail otherwise
- **Use `git push --force` to develop** only when bypassing PR requirements (we have bypass rules enabled)
- Build artifacts (`build/`, `*.tar.gz`, `node_modules/`) are gitignored
- The tarball name is parameterized: `$npm_package_name-$npm_package_version.tar.gz`

## Commands Reference
```bash
# Build
npm run build

# Version bumping (creates commit automatically)
npm version patch  # 0.0.1 -> 0.0.2
npm version minor  # 0.0.1 -> 0.1.0
npm version major  # 0.0.1 -> 1.0.0

# PR creation
gh pr create --base develop --head feature/xyz --title "..." --body "..."
gh pr create --base main --head develop --title "Release v0.0.X" --body "..."
```

## Your Task
Help me add new nodes to this extension following the established git flow. When I ask you to create a node:
1. Checkout develop and pull
2. Create feature branch
3. Create the node implementation
4. Update module.ts
5. Run build locally to verify
6. Commit code changes
7. Run `npm version patch`
8. Push and create PR to develop

Always follow this workflow pattern for consistency.

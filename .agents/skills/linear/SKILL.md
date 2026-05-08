---
name: linear
description:
  Manage Linear issues and projects. Use when creating, updating, searching, or
  triaging issues, or when moving issues through the project workflow.
---

# Linear

Use the Codex Linear app/plugin (or your IDE's Linear MCP server) when it is
connected and available in the session. If those are not available, use the
Linear GraphQL API with `LINEAR_API_KEY` injected by your secrets manager
(Doppler is shown below; substitute your equivalent — `direnv`, `dotenvx`,
1Password CLI, etc.). Never read Linear credentials from a tracked `.env` file
and never print the key.

## Workflow

- When starting work on an issue, move it to `In Progress`.
- When opening a PR, leave the issue `In Progress` or move it to `In Review`.
- Only move issues to `Done` after the PR has merged.
- For destructive workspace/team/project/user changes, stop and ask the user to
  review and run the operation manually.

## Secrets-injected API Pattern

All curl-based calls should run under your secrets-injection wrapper so that
`LINEAR_API_KEY` is available in the child shell. Examples below use
`doppler run --`; replace with your project's wrapper as needed:

```bash
doppler run -- sh -c 'curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  -d "$1" | jq "."' sh '{"query":"{ viewer { id name } }"}'
```

For complex GraphQL payloads, write JSON to a temporary file under `/tmp` and
post it with `--data @/tmp/linear-query.json`:

```bash
doppler run -- sh -c 'curl -s -X POST https://api.linear.app/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: $LINEAR_API_KEY" \
  --data @/tmp/linear-query.json | jq "."'
```

## Common Queries

### Verify Auth

```graphql
{ viewer { id name } }
```

### Search by Identifier

Use `searchIssues` with a human-readable identifier such as `ABC-57`:

```graphql
{
  searchIssues(term: "ABC-57", first: 5) {
    nodes {
      id
      identifier
      title
      state { id name type }
      team { id key name }
    }
  }
}
```

### List Team States

```graphql
{
  teams {
    nodes {
      id
      key
      name
      states { nodes { id name type } }
    }
  }
}
```

### Update Issue State

Find the issue UUID and desired state UUID first, then:

```graphql
mutation {
  issueUpdate(id: "<ISSUE_UUID>", input: { stateId: "<STATE_UUID>" }) {
    success
    issue { id identifier state { name type } }
  }
}
```

### Add a Comment

```graphql
mutation {
  commentCreate(input: { issueId: "<ISSUE_UUID>", body: "Comment in markdown" }) {
    success
    comment { id body }
  }
}
```

## Notes

- Linear mutations generally require internal UUIDs, not just identifiers like
  `ABC-57`.
- Priority values are numeric: `1` urgent, `2` high, `3` medium, `4` low,
  `0` none.
- State types include `backlog`, `unstarted`, `started`, `completed`, and
  `canceled`.
- Linear descriptions and comments render Markdown.

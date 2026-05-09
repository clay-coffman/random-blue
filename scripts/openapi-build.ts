#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { load } from "js-yaml";

const root = resolve(import.meta.dirname, "..");
const yamlPath = resolve(root, "app/api/v1/openapi.yaml");
const jsonPath = resolve(root, "app/api/v1/_openapi-spec.json");

const yaml = readFileSync(yamlPath, "utf8");
const spec = load(yaml);
writeFileSync(jsonPath, JSON.stringify(spec, null, 2) + "\n");

const paths = Object.keys((spec as { paths?: Record<string, unknown> }).paths ?? {});
console.log(`openapi-build: ${yamlPath}`);
console.log(`           → ${jsonPath} (${paths.length} paths)`);

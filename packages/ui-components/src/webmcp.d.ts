// Minimal typings for the WebMCP imperative API (Chrome origin trial).
// https://developer.chrome.com/docs/ai/webmcp/imperative-api

interface ModelContextToolAnnotations {
  readOnlyHint?: boolean;
  consequentialHint?: boolean;
  untrustedContentHint?: boolean;
  debugging?: boolean;
}

interface ModelContextToolExecuteOptions {
  signal: AbortSignal;
}

interface ModelContextTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: ModelContextToolAnnotations;
  execute: (
    input: unknown,
    options: ModelContextToolExecuteOptions
  ) => unknown | Promise<unknown>;
}

interface ModelContextRegisterToolOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

interface ModelContext extends EventTarget {
  registerTool(
    tool: ModelContextTool,
    options?: ModelContextRegisterToolOptions
  ): Promise<void> | void;
}

interface Document {
  readonly modelContext?: ModelContext;
}

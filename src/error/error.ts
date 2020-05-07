interface TacoLabErrorOptions {
  children?: unknown[];
  context?: unknown;
  exit?: number;
  original?: Error;
  status?: number;
}

const DEFAULT_CHILDREN: NonNullable<TacoLabErrorOptions['children']> = [];
const DEFAULT_EXIT: NonNullable<TacoLabErrorOptions['exit']> = 1;
const DEFAULT_STATUS: NonNullable<TacoLabErrorOptions['status']> = 500;

export class TacoLabError extends Error {
  readonly children: unknown[];
  readonly context: unknown | undefined;
  readonly exit: number;
  readonly message: string;
  readonly name = 'TacoLabError';
  readonly original: Error | undefined;
  readonly status: number;

  constructor(message: string, options: TacoLabErrorOptions = {}) {
    super();

    this.children = options.children || DEFAULT_CHILDREN;
    this.context = options.context;
    this.exit = (options.exit !== undefined ? options.exit : DEFAULT_EXIT);
    this.message = message;
    this.original = options.original;
    this.status = options.status || DEFAULT_STATUS;
  }
}
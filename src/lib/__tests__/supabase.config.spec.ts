/* 
  Unit tests for src/lib/supabase.test.ts

  Note on test framework:
  - This suite is written to work with either Jest or Vitest without changes.
  - It auto-detects the runner via global "jest" or "vi" and mocks accordingly.
*/

 /* eslint-disable @typescript-eslint/no-explicit-any */
declare const vi: any;
declare const jest: any;

const g: any = (globalThis ?? global) as any;

// Top-level mocks for both Jest and Vitest so they apply before dynamic import of the module under test.
let serverInstance: any = { kind: "server-client" };
let browserInstance: any = { kind: "browser-client" };
let createClientMock: any;
let createBrowserClientMock: any;

if (g?.vi?.mock) {
  createClientMock = g.vi.fn(() => serverInstance);
  createBrowserClientMock = g.vi.fn(() => browserInstance);
  g.vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }));
  g.vi.mock('@supabase/ssr', () => ({ createBrowserClient: createBrowserClientMock }));
} else if (g?.jest?.mock) {
  createClientMock = g.jest.fn(() => serverInstance);
  createBrowserClientMock = g.jest.fn(() => browserInstance);
  g.jest.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }));
  g.jest.mock('@supabase/ssr', () => ({ createBrowserClient: createBrowserClientMock }));
} else {
  throw new Error('No supported test runner detected (Jest or Vitest).');
}

function resetModules() {
  g?.vi?.resetModules?.();
  g?.jest?.resetModules?.();
}

function clearAllMocks() {
  g?.vi?.clearAllMocks?.();
  g?.vi?.resetAllMocks?.();
  g?.jest?.clearAllMocks?.();
  g?.jest?.resetAllMocks?.();
}

const MODULE_UNDER_TEST = '../supabase.test';

// Set only the env vars relevant to this module and return a restore function
function setEnv(vars: Record<string, string | undefined>) {
  const original = { ...process.env };
  const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(vars, k)) {
      const val = (vars as any)[k];
      if (val === undefined) {
        delete (process.env as any)[k];
      } else {
        (process.env as any)[k] = val;
      }
    } else {
      delete (process.env as any)[k];
    }
  }
  return () => {
    process.env = original;
  };
}

// Compute expected resolved values as per module logic (fallbacks on falsy)
function resolved(url?: string, key?: string) {
  return {
    url: url || 'https://placeholder.supabase.co',
    key: key || 'placeholder-key',
  };
}

describe('src/lib/supabase.test.ts', () => {
  beforeEach(() => {
    clearAllMocks();
    resetModules();
  });

  describe('hasValidSupabaseConfig', () => {
    it('returns false when env is missing (uses placeholders)', async () => {
      const restore = setEnv({});
      serverInstance = { kind: 'server-client', case: 'placeholders' };

      const expected = resolved();
      const mod: any = await import(MODULE_UNDER_TEST);

      expect(mod.hasValidSupabaseConfig()).toBe(false);
      expect(createClientMock).toHaveBeenCalledTimes(1);
      expect(createClientMock).toHaveBeenCalledWith(expected.url, expected.key);

      restore();
    });

    it('returns false when URL contains "your-project"', async () => {
      const url = 'https://your-project.supabase.co';
      const key = 'a'.repeat(40);
      const restore = setEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
      });
      serverInstance = { kind: 'server-client', case: 'your-project' };

      const mod: any = await import(MODULE_UNDER_TEST);
      expect(mod.hasValidSupabaseConfig()).toBe(false);
      expect(createClientMock).toHaveBeenCalledWith(url, key);

      restore();
    });

    it('returns false when URL is not a supabase.co domain', async () => {
      const url = 'https://api.example.com';
      const key = 'b'.repeat(40);
      const restore = setEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
      });
      serverInstance = { kind: 'server-client', case: 'non-supabase-domain' };

      const mod: any = await import(MODULE_UNDER_TEST);
      expect(mod.hasValidSupabaseConfig()).toBe(false);
      expect(createClientMock).toHaveBeenCalledWith(url, key);

      restore();
    });

    it('returns false when anon key is too short', async () => {
      const url = 'https://validproj.supabase.co';
      const key = 'short';
      const restore = setEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
      });
      serverInstance = { kind: 'server-client', case: 'short-key' };

      const mod: any = await import(MODULE_UNDER_TEST);
      expect(mod.hasValidSupabaseConfig()).toBe(false);
      expect(createClientMock).toHaveBeenCalledWith(url, key);

      restore();
    });

    it('returns true for a valid configuration', async () => {
      const url = 'https://abccompany.supabase.co';
      const key = 'k'.repeat(32);
      const restore = setEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
      });
      serverInstance = { kind: 'server-client', case: 'valid' };

      const mod: any = await import(MODULE_UNDER_TEST);
      expect(mod.hasValidSupabaseConfig()).toBe(true);
      expect(createClientMock).toHaveBeenCalledWith(url, key);

      restore();
    });

    it('treats empty string env values as placeholders (falsy -> fallback)', async () => {
      const restore = setEnv({
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      });
      serverInstance = { kind: 'server-client', case: 'empty-strings' };

      const expected = resolved();
      const mod: any = await import(MODULE_UNDER_TEST);
      expect(mod.hasValidSupabaseConfig()).toBe(false);
      expect(createClientMock).toHaveBeenCalledWith(expected.url, expected.key);

      restore();
    });
  });

  describe('client factories', () => {
    it('creates the server client at module import and exports it', async () => {
      const url = 'https://proj.supabase.co';
      const key = 'x'.repeat(30);
      const restore = setEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
      });
      serverInstance = { kind: 'server-client', case: 'exported-instance' };

      const mod: any = await import(MODULE_UNDER_TEST);

      expect(createClientMock).toHaveBeenCalledTimes(1);
      expect(createClientMock).toHaveBeenCalledWith(url, key);
      expect(mod.supabase).toBe(serverInstance);

      restore();
    });

    it('createSupabaseClient returns a fresh browser client and passes the same config each call', async () => {
      const url = 'https://proj2.supabase.co';
      const key = 'y'.repeat(30);
      const restore = setEnv({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
      });

      // First import: does not call browser client yet
      let mod: any = await import(MODULE_UNDER_TEST);
      expect(createBrowserClientMock).not.toHaveBeenCalled();

      // Call 1
      browserInstance = { kind: 'browser-client', id: 1 };
      const c1 = mod.createSupabaseClient();
      expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
      expect(createBrowserClientMock).toHaveBeenCalledWith(url, key);
      expect(c1).toBe(browserInstance);

      // Call 2
      browserInstance = { kind: 'browser-client', id: 2 };
      const c2 = mod.createSupabaseClient();
      expect(createBrowserClientMock).toHaveBeenCalledTimes(2);
      expect(createBrowserClientMock).toHaveBeenNthCalledWith(2, url, key);
      expect(c2).toBe(browserInstance);

      restore();
    });
  });
});
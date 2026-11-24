import { createClient } from '@supabase/supabase-js';

describe('@supabase/supabase-js API', () => {
  it('warns when the schema option is passed at the top level instead of under db', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      // `schema` belongs under `db`; 2.119.0 added a warning for this mistake.
      createClient('https://example.supabase.co', 'sb_publishable_test_key', {
        schema: 'private',
      } as never);

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('The "schema" option must be nested under "db"')
      );
    } finally {
      warn.mockRestore();
    }
  });
});

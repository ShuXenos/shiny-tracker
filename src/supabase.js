import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  'https://wcpciwsghssyjokdovqa.supabase.co';

const supabaseKey =
  'sb_publishable_L8HAYJc4bkusFk63rWoKhA_tgXRDNWR';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
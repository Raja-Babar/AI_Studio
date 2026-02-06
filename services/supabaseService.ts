
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yxwnlyqppftfjshfqolk.supabase.co';
const supabaseKey = 'sb_publishable_rCcr-n0UXlJD9VRwp_z-UA_YxjUwZK3';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper for book operations
export const db = {
  async getBooks() {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('createdTime', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async upsertBook(book: any) {
    const { data, error } = await supabase
      .from('books')
      .upsert(book)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async seedBooks(books: any[]) {
    const { data, error } = await supabase
      .from('books')
      .upsert(books)
      .select();
    
    if (error) throw error;
    return data;
  },

  async deleteBook(id: string) {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

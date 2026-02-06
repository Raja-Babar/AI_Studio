
import React, { useState, useEffect, useMemo } from 'react';
import { User, Book, BookStatus } from './types';
import BookModal from './components/BookModal';
import { db } from './services/supabaseService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginView, setIsLoginView] = useState(true);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Search/Filters
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  
  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('nexus_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      fetchBooks();
    }
  }, []);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const data = await db.getBooks();
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const seedSampleData = async () => {
    if (!currentUser) return;
    setIsSyncing(true);
    const samples = [
      {
        id: crypto.randomUUID(),
        fileName: 'Shah_Jo_Risalo-Shah_Abdul_Latif-1744-SLA',
        titleEnglish: 'Shah Jo Risalo',
        titleSindhi: 'شاهه جو رسالو',
        authorEnglish: 'Shah Abdul Latif Bhittai',
        authorSindhi: 'شاهه عبداللطيف ڀٽائي',
        year: '1744',
        publisher: 'Sindh Literature Authority',
        category: 'Poetry',
        language: 'Sindhi',
        source: 'Public Domain',
        status: BookStatus.COMPLETED,
        stage: 'Archived',
        createdBy: currentUser.fullName,
        createdTime: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        fileName: 'Sindh_Ji_Adabi_Tarikh-Lutfullah_Badwi-1950',
        titleEnglish: 'History of Sindhi Literature',
        titleSindhi: 'سنڌ جي ادبي تاريخ',
        authorEnglish: 'Lutfullah Badwi',
        authorSindhi: 'لطف الله بدوي',
        year: '1950',
        publisher: 'R.H. Ahmed & Sons',
        category: 'History',
        language: 'Sindhi',
        source: 'Library Scan',
        status: BookStatus.IN_PROGRESS,
        stage: 'Formatting',
        createdBy: currentUser.fullName,
        createdTime: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        fileName: 'Sachal_Sarmast_Jo_Kalam-Sachal-1800',
        titleEnglish: 'The Poetry of Sachal Sarmast',
        titleSindhi: 'سچل سرمست جو ڪلام',
        authorEnglish: 'Sachal Sarmast',
        authorSindhi: 'سچل سرمست',
        year: '1820',
        publisher: 'Sachal Chair',
        category: 'Sufism',
        language: 'Sindhi',
        source: 'Manuscript',
        status: BookStatus.PENDING,
        stage: 'Initial Scan',
        createdBy: currentUser.fullName,
        createdTime: new Date().toISOString()
      }
    ];

    try {
      await db.seedBooks(samples);
      await fetchBooks();
      alert('Successfully added sample books to database!');
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Failed to connect to database. Check Supabase credentials.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const user = { id: Date.now().toString(), email, fullName: fullName || 'Librarian' };
    setCurrentUser(user);
    localStorage.setItem('nexus_user', JSON.stringify(user));
    fetchBooks();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('nexus_user');
    setBooks([]);
  };

  const saveBook = async (book: Book) => {
    setIsSyncing(true);
    try {
      const savedBook = await db.upsertBook(book);
      if (editingBook) {
        setBooks(prev => prev.map(b => b.id === savedBook.id ? savedBook : b));
      } else {
        setBooks(prev => [savedBook, ...prev]);
      }
      setIsBookModalOpen(false);
      setEditingBook(null);
    } catch (error) {
      console.error('Error saving book:', error);
      alert('Failed to save to cloud database.');
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book entry from the database?')) return;
    
    setIsSyncing(true);
    try {
      await db.deleteBook(id);
      setBooks(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete from cloud database.');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => 
      `${b.titleEnglish} ${b.titleSindhi} ${b.authorEnglish} ${b.fileName}`.toLowerCase().includes(bookSearchTerm.toLowerCase())
    );
  }, [books, bookSearchTerm]);

  // Calculated Stats
  const categoriesCount = useMemo(() => new Set(books.map(b => b.category)).size, [books]);
  const completedCount = useMemo(() => books.filter(b => b.status === BookStatus.COMPLETED).length, [books]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in border border-slate-100">
          <div className="p-8 bg-indigo-600 text-white text-center">
            <h1 className="text-3xl font-bold tracking-tight">NexusShelf</h1>
            <p className="text-indigo-100 mt-2">Digital Library & Cloud Asset Management.</p>
          </div>
          <div className="p-8">
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLoginView && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input type="text" required className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <input type="email" required className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input type="password" required className="mt-1 w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                {isLoginView ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => setIsLoginView(!isLoginView)} className="text-indigo-600 font-semibold hover:underline">
                {isLoginView ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-indigo-600 tracking-tight">NexusShelf</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <a href="#bookshelf" className="w-full flex items-center gap-3 px-4 py-2.5 text-indigo-600 bg-indigo-50 rounded-lg font-medium transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Book Shelf
          </a>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Library Stats
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold uppercase">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all font-medium flex items-center justify-center gap-2">
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-20">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">Shelf Dashboard</h1>
            {isSyncing && (
              <span className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Syncing...
              </span>
            )}
          </div>
          <div className="flex gap-4">
            <button 
              onClick={seedSampleData}
              className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all text-sm"
              disabled={isSyncing}
            >
              Seed Sample Data
            </button>
            <button 
              onClick={() => { setEditingBook(null); setIsBookModalOpen(true); }}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Add New Book
            </button>
          </div>
        </header>

        <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Records</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{isLoading ? '...' : books.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Categories</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{isLoading ? '...' : categoriesCount}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{isLoading ? '...' : completedCount}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Cloud Link</p>
            <p className={`text-sm font-bold mt-2 ${!isLoading ? 'text-green-600' : 'text-slate-400'}`}>
              {isLoading ? 'Fetching...' : 'Supabase Active'}
            </p>
          </div>
        </div>

        <section id="bookshelf" className="p-8 space-y-8 pt-0">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Search catalog..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={bookSearchTerm}
                onChange={e => setBookSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-200">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-100">فائيل نالو (File)</th>
                    <th className="px-6 py-4">Title (EN)</th>
                    <th className="px-6 py-4">ٽائيٽل (SD)</th>
                    <th className="px-6 py-4">Author (EN)</th>
                    <th className="px-6 py-4">ليکڪ (SD)</th>
                    <th className="px-6 py-4">Year</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {isLoading ? (
                    <tr><td colSpan={10} className="p-20 text-center text-slate-400">Connecting to Supabase...</td></tr>
                  ) : filteredBooks.map(book => (
                    <tr key={book.id} className="hover:bg-slate-50 group transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100">{book.fileName}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{book.titleEnglish}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 text-right" dir="rtl">{book.titleSindhi}</td>
                      <td className="px-6 py-4">{book.authorEnglish}</td>
                      <td className="px-6 py-4 text-right" dir="rtl">{book.authorSindhi}</td>
                      <td className="px-6 py-4">{book.year}</td>
                      <td className="px-6 py-4 text-xs font-bold text-indigo-400">{book.stage}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold">{book.category}</span></td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          book.status === BookStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                          book.status === BookStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {book.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingBook(book); setIsBookModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">Edit</button>
                          <button onClick={() => deleteBook(book.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isLoading && filteredBooks.length === 0 && (
              <div className="p-20 text-center text-slate-400 font-medium flex flex-col items-center gap-4">
                <span>Empty Catalog. Add your first digital asset above.</span>
                <button onClick={seedSampleData} className="text-indigo-600 hover:underline text-sm font-bold">
                  Click here to load sample data for verification
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <BookModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
        onSave={saveBook} 
        book={editingBook} 
        currentUser={currentUser} 
      />
    </div>
  );
};

export default App;

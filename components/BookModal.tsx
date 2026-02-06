
import React, { useState, useEffect } from 'react';
import { Book, BookStatus, User } from '../types';
import { suggestBookCategory } from '../services/geminiService';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (book: Book) => void;
  book?: Book | null;
  currentUser: User;
}

const BookModal: React.FC<BookModalProps> = ({ isOpen, onClose, onSave, book, currentUser }) => {
  const [formData, setFormData] = useState<Partial<Book>>({});
  const [isSuggesting, setIsSuggesting] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData(book);
    } else {
      setFormData({
        status: BookStatus.PENDING,
        language: 'Sindhi/English',
        createdTime: new Date().toISOString(),
        createdBy: currentUser.fullName,
        stage: 'Initial',
        currentHolderId: currentUser.id
      });
    }
  }, [book, isOpen, currentUser]);

  if (!isOpen) return null;

  const isSindhiScript = (text: string) => /[\u0600-\u06FF]/.test(text);

  const handleFileNameChange = (val: string) => {
    const segments = val.split('-');
    const newUpdates: Partial<Book> = { fileName: val };

    if (segments.length >= 1) {
      const rawTitle = segments[0].replace(/_/g, ' ').trim();
      if (isSindhiScript(rawTitle)) {
        newUpdates.titleSindhi = rawTitle;
      } else {
        newUpdates.titleEnglish = rawTitle;
      }
    }

    if (segments.length >= 2) {
      const rawAuthor = segments[1].replace(/_/g, ' ').trim();
      if (isSindhiScript(rawAuthor)) {
        newUpdates.authorSindhi = rawAuthor;
      } else {
        newUpdates.authorEnglish = rawAuthor;
      }
    }

    if (segments.length >= 3) {
      newUpdates.year = segments[2].trim();
    }

    if (segments.length >= 4) {
      newUpdates.source = segments[3].trim();
    }

    setFormData(prev => ({ ...prev, ...newUpdates }));
  };

  const handleSuggestCategory = async () => {
    if (!formData.titleEnglish) return alert('Enter English title first for AI suggestion');
    setIsSuggesting(true);
    const cat = await suggestBookCategory(formData.titleEnglish);
    setFormData(prev => ({ ...prev, category: cat }));
    setIsSuggesting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBook: Book = {
      ...formData as Book,
      id: book?.id || crypto.randomUUID(),
      lastEditedTime: new Date().toISOString(),
      lastEditedBy: currentUser.fullName,
    };
    onSave(finalBook);
  };

  const inputClass = "mt-1 w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-indigo-900">{book ? 'Edit Book Entry' : 'Add New Book to Shelf'}</h3>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Auto-Extractor Active</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} id="bookForm" className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className={`${labelClass} text-indigo-600`}>فائيل نالو (File Name - Auto-Extracts)</label>
              <input 
                type="text" 
                required 
                placeholder="Book_Name-Author-2001-org"
                className={`${inputClass} border-indigo-200 bg-indigo-50/30`} 
                value={formData.fileName || ''} 
                onChange={e => handleFileNameChange(e.target.value)} 
              />
            </div>
            <div className="md:col-span-1">
              <label className={labelClass}>Title (English)</label>
              <input type="text" className={inputClass} value={formData.titleEnglish || ''} onChange={e => setFormData(p => ({...p, titleEnglish: e.target.value}))} />
            </div>
            <div className="md:col-span-1 text-right">
              <label className={labelClass}>ٽائيٽل (Title Sindhi)</label>
              <input type="text" dir="rtl" className={`${inputClass} text-right`} value={formData.titleSindhi || ''} onChange={e => setFormData(p => ({...p, titleSindhi: e.target.value}))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <label className={labelClass}>Author (English)</label>
              <input type="text" className={inputClass} value={formData.authorEnglish || ''} onChange={e => setFormData(p => ({...p, authorEnglish: e.target.value}))} />
            </div>
            <div className="text-right">
              <label className={labelClass}>ليکڪ (Author Sindhi)</label>
              <input type="text" dir="rtl" className={`${inputClass} text-right`} value={formData.authorSindhi || ''} onChange={e => setFormData(p => ({...p, authorSindhi: e.target.value}))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Year</label>
              <input type="text" className={inputClass} value={formData.year || ''} onChange={e => setFormData(p => ({...p, year: e.target.value}))} />
            </div>
            <div>
              <label className={labelClass}>Publisher</label>
              <input type="text" className={inputClass} value={formData.publisher || ''} onChange={e => setFormData(p => ({...p, publisher: e.target.value}))} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <div className="relative">
                <input type="text" className={inputClass} value={formData.category || ''} onChange={e => setFormData(p => ({...p, category: e.target.value}))} />
                <button type="button" onClick={handleSuggestCategory} disabled={isSuggesting} className="absolute right-2 top-3 text-indigo-500 hover:text-indigo-700">
                  <svg className={`w-4 h-4 ${isSuggesting ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Language</label>
              <input type="text" className={inputClass} value={formData.language || ''} onChange={e => setFormData(p => ({...p, language: e.target.value}))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value as BookStatus}))}>
                {Object.values(BookStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Scanned By</label>
              <input type="text" className={inputClass} value={formData.scannedBy || ''} onChange={e => setFormData(p => ({...p, scannedBy: e.target.value}))} />
            </div>
            <div>
              <label className={labelClass}>Assigned To</label>
              <input type="text" className={inputClass} value={formData.assignedTo || ''} onChange={e => setFormData(p => ({...p, assignedTo: e.target.value}))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>External Link</label>
              <input type="url" placeholder="https://..." className={inputClass} value={formData.link || ''} onChange={e => setFormData(p => ({...p, link: e.target.value}))} />
            </div>
            <div>
              <label className={labelClass}>Thumbnail URL</label>
              <input type="url" placeholder="Image URL" className={inputClass} value={formData.thumbnail || ''} onChange={e => setFormData(p => ({...p, thumbnail: e.target.value}))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Source</label>
              <input type="text" className={inputClass} value={formData.source || ''} onChange={e => setFormData(p => ({...p, source: e.target.value}))} />
            </div>
            <div>
              <label className={labelClass}>Workflow Stage</label>
              <input type="text" className={inputClass} value={formData.stage || ''} onChange={e => setFormData(p => ({...p, stage: e.target.value}))} />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-white transition-colors">
            Cancel
          </button>
          <button type="submit" form="bookForm" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold">
            {book ? 'Update Entry' : 'Add to Shelf'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookModal;

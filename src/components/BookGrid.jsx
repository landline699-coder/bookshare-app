import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { EmptyState } from './Feedback';

export default function BookGrid({ books, appMode, searchTerm, onSelectBook, categories }) {
  
  // 🔍 फिल्टरिंग लॉजिक (Filtering Logic)
  const filteredBooks = useMemo(() => {
    let list = books.filter(b => b.type?.toLowerCase() === (appMode || '').toLowerCase());
    if (searchTerm) {
      list = list.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return list;
  }, [books, appMode, searchTerm]);

  // अगर सर्च के बाद कुछ न मिले
  if (filteredBooks.length === 0) {
    return <EmptyState message="No books found in this category." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {searchTerm ? (
        /* 1. सर्च मोड: सीधा ग्रिड दिखेगा */
        <div className="grid grid-cols-2 gap-4">
          {filteredBooks.map(book => (
            <BookCard key={book.id} book={book} onClick={() => onSelectBook(book)} />
          ))}
        </div>
      ) : (
        /* 2. नॉर्मल मोड: कैटेगिरी के हिसाब से स्क्रॉलर्स */
        categories.map(cat => {
          const catBooks = filteredBooks.filter(b => b.category === cat);
          if (catBooks.length === 0) return null;

          return (
            <div key={cat} className="group">
              <div className="flex justify-between items-end px-2 mb-3">
                <h3 className="font-black text-lg text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                  {cat}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                  {catBooks.length} Books
                </span>
              </div>

              <div className="flex overflow-x-auto gap-4 px-2 pb-4 snap-x hide-scrollbar">
                {catBooks.map(book => (
                  <div key={book.id} className="min-w-[140px] w-[140px] snap-start flex-shrink-0">
                    <BookCard book={book} onClick={() => onSelectBook(book)} />
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// 📕 छोटा बुक कार्ड कम्पोनेंट (Internal Component)
function BookCard({ book, onClick }) {
  // सिर्फ पेंडिंग रिक्वेस्ट की संख्या निकालें
  const pendingCount = book.waitlist?.filter(r => r.status === 'pending').length || 0;

  return (
    <div 
      onClick={onClick} 
      className="relative bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 active:scale-95 transition-all cursor-pointer group hover:shadow-xl hover:shadow-indigo-100/50"
    >
      {/* ✅ DEMAND BADGE (+3) */}
      {pendingCount > 0 && (
        <div className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-lg z-20 animate-bounce">
          +{pendingCount}
        </div>
      )}

      {/* Book Image */}
      <div className="aspect-[3/4] bg-slate-50 relative overflow-hidden">
        {book.imageUrl ? (
          <img 
            src={book.imageUrl} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            alt={book.title} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <BookOpen size={40} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Book Info */}
      <div className="p-3">
        <h4 className="font-bold text-[11px] leading-tight truncate text-slate-700 mb-1">
          {book.title}
        </h4>
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">
            {book.bookClass}
          </p>
          <div className="w-1 h-1 bg-slate-200 rounded-full" />
          <p className="text-[9px] font-bold text-slate-400 truncate w-16 text-right">
            {book.currentOwner}
          </p>
        </div>
      </div>
    </div>
  );
}
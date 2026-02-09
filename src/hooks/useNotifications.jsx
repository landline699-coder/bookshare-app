import { useMemo } from 'react';

export default function useNotifications(books, user, profile) {
  
  // 🔔 नोटिफिकेशन कैलकुलेशन (Notification Calculation)
  const myBooksWithRequests = useMemo(() => {
    if (!user || !books.length) return [];

    return books.filter(book => {
      // क्या आप इस बुक के मालिक हैं? (Smart Check)
      const isOwnerByUID = book.ownerId === user.uid;
      const isOwnerByProfile = profile && 
                               book.currentOwner === profile.name && 
                               book.contact === profile.mobile;

      // सिर्फ वही बुक्स लें जिनमें कम से कम एक 'pending' रिक्वेस्ट हो
      return (isOwnerByUID || isOwnerByProfile) && 
             book.waitlist?.some(req => req.status === 'pending');
    });
  }, [books, user, profile]);

  // 🔢 कुल पेंडिंग रिक्वेस्ट की संख्या (Total Count)
  const totalCount = useMemo(() => {
    return myBooksWithRequests.reduce((acc, book) => {
      const pendingRequests = book.waitlist.filter(r => r.status === 'pending').length;
      return acc + pendingRequests;
    }, 0);
  }, [myBooksWithRequests]);

  return {
    notifications: myBooksWithRequests,
    totalCount: totalCount,
    hasNotifications: totalCount > 0
  };
}
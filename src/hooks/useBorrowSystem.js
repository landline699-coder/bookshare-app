import { useState } from 'react';
import * as fb from '../services/firebaseService';

export default function useBorrowSystem(setToast) {
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Approve या Reject करने का लॉजिक
  const handleReply = async (book, uid, actionType, extraData) => {
    try {
      if (actionType === 'UPDATE') {
        await fb.updateBook(book.id, { 
          title: extraData.title, subject: extraData.subject, author: extraData.author 
        });
        setToast({ type: 'success', message: 'Book Updated!' });
        return;
      }

      const status = actionType === 'Approved' ? 'approved' : 'rejected';
      const updatedWaitlist = book.waitlist.map(req => 
        req.uid === uid ? { ...req, status, rejectionDate: status === 'rejected' ? new Date().toISOString() : null } : req
      );

      await fb.updateBook(book.id, { waitlist: updatedWaitlist });
      setToast({ type: 'success', message: `Request ${status}!` });
    } catch (error) {
      setToast({ type: 'error', message: 'Action failed!' });
    }
  };

  // 2. हैंडओवर (Mark as Given) करने का लॉजिक
  const handleHandover = async (book, rUid) => {
    try {
      const updatedWaitlist = book.waitlist.map(req => 
        req.uid === rUid ? { ...req, status: 'handed_over' } : req
      );
      await fb.updateBook(book.id, { waitlist: updatedWaitlist });
      setToast({ type: 'success', message: 'Handover marked!' });
    } catch (error) {
      setToast({ type: 'error', message: 'Handover failed!' });
    }
  };

  // 3. किताब प्राप्त (Receive) करने का लॉजिक
  const handleReceive = async (book, reqProfile) => {
    setIsProcessing(true);
    try {
      await fb.updateBook(book.id, {
        ownerId: reqProfile.uid,
        currentOwner: reqProfile.name,
        contact: reqProfile.mobile,
        handoverStatus: 'available',
        waitlist: [], // रिसीव होते ही वेटलिस्ट साफ़
        history: [...(book.history || []), { 
          owner: reqProfile.name, 
          date: new Date().toLocaleDateString(), 
          action: 'Received' 
        }]
      });
      setToast({ type: 'success', message: 'Book Transferred Successfully!' });
    } catch (error) {
      setToast({ type: 'error', message: 'Transfer failed!' });
    } finally {
      setIsProcessing(false);
    }
  };

  return { handleReply, handleHandover, handleReceive, isProcessing };
}
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'essay' | 'email' | 'article' | 'presentation' | 'other';
  wordCount: number;
  status: 'draft' | 'reviewing' | 'final';
  createdAt: Date;
  updatedAt: Date;
}

// Create a new document
export const createDocument = async (
  userId: string,
  documentData: Omit<Document, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'documents'), {
      ...documentData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Update an existing document
export const updateDocument = async (
  documentId: string,
  updates: Partial<Omit<Document, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Delete a document
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'documents', documentId));
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Get all documents for a user
export const getUserDocuments = async (userId: string): Promise<Document[]> => {
  try {
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const documents: Document[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Document);
    });
    
    return documents;
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw error;
  }
};

// Real-time listener for user documents
export const subscribeToUserDocuments = (
  userId: string,
  callback: (documents: Document[]) => void
): () => void => {
  const q = query(
    collection(db, 'documents'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const documents: Document[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      documents.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Document);
    });
    
    callback(documents);
  }, (error) => {
    console.error('Error in documents subscription:', error);
  });
};

// Real-time listener for a specific document
export const subscribeToDocument = (
  documentId: string,
  callback: (document: Document | null) => void
): () => void => {
  const docRef = doc(db, 'documents', documentId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      const document: Document = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Document;
      callback(document);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in document subscription:', error);
  });
};

// Auto-save function with debouncing
let saveTimeout: NodeJS.Timeout;

export const autoSaveDocument = (
  documentId: string,
  content: string,
  debounceMs: number = 2000
): void => {
  clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(async () => {
    try {
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      await updateDocument(documentId, {
        content,
        wordCount
      });
      console.log('Document auto-saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, debounceMs);
};

// Search documents
export const searchUserDocuments = async (
  userId: string,
  searchTerm: string
): Promise<Document[]> => {
  try {
    const documents = await getUserDocuments(userId);
    
    // Simple client-side search (for better search, use Algolia or similar)
    return documents.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}; 
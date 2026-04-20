// Mocking Firestore functions with localStorage
export const getDoc = async (path: string): Promise<any> => {
  const data = localStorage.getItem(path);
  return data ? JSON.parse(data) : null;
};

export const updateDoc = async (path: string, data: any): Promise<void> => {
  localStorage.setItem(path, JSON.stringify(data));
};

// Simplified wrappers for common usages in App.tsx
export const getDocs = async (collectionPath: string): Promise<any[]> => {
  const data = localStorage.getItem(collectionPath);
  return data ? JSON.parse(data) : [];
};

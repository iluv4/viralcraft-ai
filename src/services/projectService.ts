import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Project, ViralAnalysis, RemakeOutput } from "../types";

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string | null;
    email: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string | null; email: string | null; }[];
  }
}

function handleFirestoreError(error: any, operation: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  const user = auth.currentUser;
  const errorInfo: FirestoreErrorInfo = {
    error: error.message || String(error),
    operationType: operation,
    path: path,
    authInfo: {
      userId: user?.uid || null,
      email: user?.email || null,
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous || false,
      providerInfo: user?.providerData?.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName,
        email: p.email
      })) || []
    }
  };
  throw new Error(JSON.stringify(errorInfo));
}

export const createProject = async (data: Partial<Project>): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");

  const projectId = doc(collection(db, "projects")).id;
  const projectRef = doc(db, "projects", projectId);
  
  const newProject = {
    ...data,
    id: projectId,
    userId: user.uid,
    createdAt: serverTimestamp(),
  };

  try {
    const cleanProject = sanitizeData(newProject);
    await setDoc(projectRef, cleanProject);
    return projectId;
  } catch (error) {
    handleFirestoreError(error, 'create', `projects/${projectId}`);
  }
};

export const getProjects = async (): Promise<Project[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");

  const q = query(
    collection(db, "projects"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Project);
  } catch (error) {
    handleFirestoreError(error, 'list', 'projects');
  }
};

export const getProject = async (id: string): Promise<Project | null> => {
  const projectRef = doc(db, "projects", id);
  try {
    const docSnap = await getDoc(projectRef);
    if (docSnap.exists()) {
      return docSnap.data() as Project;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'get', `projects/${id}`);
  }
};

const sanitizeData = (data: any): any => {
  if (data === null || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeData);
  
  const sanitized: any = {};
  for (const key in data) {
    if (data[key] !== undefined) {
      sanitized[key] = sanitizeData(data[key]);
    }
  }
  return sanitized;
};

export const updateProject = async (id: string, data: Partial<Project>): Promise<void> => {
  const projectRef = doc(db, "projects", id);
  try {
    const cleanData = sanitizeData(data);
    await updateDoc(projectRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, 'update', `projects/${id}`);
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  const projectRef = doc(db, "projects", id);
  try {
    await deleteDoc(projectRef);
  } catch (error) {
    handleFirestoreError(error, 'delete', `projects/${id}`);
  }
};

// Asset Management (Sub-collections)
export const saveProjectScene = async (projectId: string, sceneId: string, data: any): Promise<void> => {
  const sceneRef = doc(db, "projects", projectId, "scenes", sceneId);
  try {
    const cleanData = sanitizeData(data);
    await setDoc(sceneRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, 'write', `projects/${projectId}/scenes/${sceneId}`);
  }
};

export const saveProjectFrame = async (projectId: string, frameId: string, data: any): Promise<void> => {
  const frameRef = doc(db, "projects", projectId, "frames", frameId);
  try {
    const cleanData = sanitizeData(data);
    await setDoc(frameRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, 'write', `projects/${projectId}/frames/${frameId}`);
  }
};

export const getProjectScenes = async (projectId: string): Promise<any[]> => {
  const scenesRef = collection(db, "projects", projectId, "scenes");
  try {
    const snap = await getDocs(scenesRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, 'list', `projects/${projectId}/scenes`);
  }
};

export const getProjectFrames = async (projectId: string): Promise<any[]> => {
  const framesRef = collection(db, "projects", projectId, "frames");
  try {
    const snap = await getDocs(framesRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, 'list', `projects/${projectId}/frames`);
  }
};

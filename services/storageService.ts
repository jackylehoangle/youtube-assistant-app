// File: services/storageService.ts
import { AppState } from '../types'; // Chúng ta sẽ định nghĩa AppState ở bước sau

const STORAGE_KEY = 'youtubeAssistantProject';

// Hàm để lưu toàn bộ trạng thái ứng dụng vào Local Storage
export const saveProject = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error("Could not save project to local storage", error);
  }
};

// Hàm để tải dự án từ Local Storage
export const loadProject = (): AppState | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null; // Không có dự án nào được lưu
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Could not load project from local storage", error);
    return null;
  }
};

// Hàm để xóa dự án (khi bắt đầu một dự án mới)
export const deleteProject = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error("Could not delete project from local storage", error);
    }
}
// локальное хранилище
export function setLocalStorage(newStorage) {
    localStorage.setItem('events', JSON.stringify(newStorage));
  }
export function readLocalStorage() {
    const savedSettings = localStorage.getItem('events');
    const parsedSettings = JSON.parse(savedSettings);
  
    return parsedSettings;
  }
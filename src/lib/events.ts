type EventCallback = () => void;
type EventType = "userRegistered";

class EventEmitter {
  private listeners: { [key in EventType]?: EventCallback[] } = {};

  on(event: EventType, callback: EventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(callback);
  }

  emit(event: EventType) {
    this.listeners[event]?.forEach((callback) => callback());
  }

  off(event: EventType, callback: EventCallback) {
    this.listeners[event] = this.listeners[event]?.filter(
      (cb) => cb !== callback
    );
  }
}

export const eventEmitter = new EventEmitter();

type ToastType = "success" | "error" | "warning" | "info";

export interface ToastEvent {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

class ToastEmitter extends EventTarget {
  private emit(type: ToastType, message: string, duration = 4000) {
    this.dispatchEvent(
      new CustomEvent<ToastEvent>("toast", {
        detail: { id: Math.random().toString(36).slice(2), type, message, duration },
      }),
    );
  }
  success(message: string, duration?: number) { this.emit("success", message, duration); }
  error(message: string, duration?: number) { this.emit("error", message, duration ?? 5000); }
  warning(message: string, duration?: number) { this.emit("warning", message, duration); }
  info(message: string, duration?: number) { this.emit("info", message, duration); }
}

export const toast = new ToastEmitter();

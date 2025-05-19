// js/inputController.js
export class InputController {
    constructor(canvasElement) { // Terima canvasElement untuk menghitung mouse relatif
        this.canvasElement = canvasElement;
        this.keys = {
            KeyW: false, KeyA: false, KeyS: false, KeyD: false,
            ShiftRight: false
        };
        this.mouseDelta = { x: 0, y: 0 };
        this.previousMousePosition = { x: 0, y: 0 };
        this.isMouseInitialized = false; // Untuk inisialisasi posisi mouse pertama kali

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
    }

    _onKeyDown(event) {
        if (this.keys.hasOwnProperty(event.code)) {
            this.keys[event.code] = true;
        }
    }

    _onKeyUp(event) {
        if (this.keys.hasOwnProperty(event.code)) {
            this.keys[event.code] = false;
        }
    }

    _onMouseMove(event) {
        const rect = this.canvasElement.getBoundingClientRect();
        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;

        if (!this.isMouseInitialized) {
            this.previousMousePosition.x = currentX;
            this.previousMousePosition.y = currentY;
            this.isMouseInitialized = true;
            return; // Jangan hitung delta pada gerakan pertama
        }

        this.mouseDelta.x = currentX - this.previousMousePosition.x;
        this.mouseDelta.y = currentY - this.previousMousePosition.y;

        this.previousMousePosition.x = currentX;
        this.previousMousePosition.y = currentY;
    }

    enable() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        this.canvasElement.addEventListener('mousemove', this._onMouseMove); // Tambahkan mousemove ke canvas
        this.isMouseInitialized = false; // Reset saat di-enable
        this.mouseDelta = { x: 0, y: 0 }; // Reset delta
    }

    disable() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        this.canvasElement.removeEventListener('mousemove', this._onMouseMove);
        for (const key in this.keys) {
            this.keys[key] = false;
        }
        this.mouseDelta = { x: 0, y: 0 };
    }

    // Panggil ini di loop animasi setelah mouseDelta digunakan
    resetMouseDelta() {
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
    }
}
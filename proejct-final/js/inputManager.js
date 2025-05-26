// js/inputManager.js
export class InputManager {
    constructor(canvasElement) {
        this.canvasElement = canvasElement;
        this.keys = {
            KeyW: false, KeyA: false, KeyS: false, KeyD: false,
            ShiftLeft: false,
            KeyE: false,
            KeyF: false,
            KeyG: false,
            KeyC: false,
        };
        this.mouse = {
            x: 0, y: 0,
            buttons: [false, false, false],
            deltaX: 0, deltaY: 0,
            isDragging: false,
            wheelDeltaY: 0 // Untuk scroll wheel
        };
        this.previousMousePos = {x: null, y: null};
        this.keyPressOnceState = {};

        // Pastikan semua metode ini didefinisikan di bawah sebelum di-bind
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);       // Pastikan _onWheel didefinisikan
        this._onContextMenu = (event) => event.preventDefault(); // Ini inline, jadi aman
    }

    _onKeyDown(event) {
        if (this.keys.hasOwnProperty(event.code)) {
            if (!this.keys[event.code]) {
                this.keyPressOnceState[event.code] = true;
            }
            this.keys[event.code] = true;
        }
    }

    _onKeyUp(event) {
        if (this.keys.hasOwnProperty(event.code)) {
            this.keys[event.code] = false;
        }
    }

    _onMouseDown(event) {
        this.mouse.buttons[event.button] = true;
        this.mouse.isDragging = true;
        this.previousMousePos = {x: event.clientX, y: event.clientY};
    }

    _onMouseUp(event) {
        this.mouse.buttons[event.button] = false;
        this.mouse.isDragging = false;
        this.previousMousePos = {x: null, y: null};
    }

    _onMouseMove(event) {
        const currentX = event.clientX;
        const currentY = event.clientY;

        if (this.mouse.isDragging && this.previousMousePos.x !== null) {
             this.mouse.deltaX = currentX - this.previousMousePos.x;
             this.mouse.deltaY = currentY - this.previousMousePos.y;
        } else {
            this.mouse.deltaX = 0;
            this.mouse.deltaY = 0;
        }
        this.previousMousePos = {x: currentX, y: currentY};
    }

    // PASTIKAN METODE INI ADA
    _onWheel(event) {
        event.preventDefault(); // Mencegah scroll halaman
        // Normalisasi deltaY bisa berbeda antar browser, tapi ini umum
        let delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail || -event.deltaY)));
        this.mouse.wheelDeltaY = delta; // Gunakan nilai yang dinormalisasi (-1, 0, atau 1) atau event.deltaY langsung
                                       // Di TPVCameraControls, kita menggunakan event.deltaY * 0.01
                                       // Jadi, mari kita konsisten dan simpan event.deltaY
        // this.mouse.wheelDeltaY = event.deltaY; // Anda sudah melakukan ini sebelumnya, ini baik
    }

    isKeyPressedOnce(keyCode) {
        if (this.keyPressOnceState[keyCode]) {
            this.keyPressOnceState[keyCode] = false;
            return true;
        }
        return false;
    }

    enable() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        this.canvasElement.addEventListener('mousemove', this._onMouseMove);
        this.canvasElement.addEventListener('mousedown', this._onMouseDown);
        this.canvasElement.addEventListener('mouseup', this._onMouseUp);
        this.canvasElement.addEventListener('contextmenu', this._onContextMenu);
        this.canvasElement.addEventListener('wheel', this._onWheel); // Pastikan event listener ditambahkan
    }

    disable() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        this.canvasElement.removeEventListener('mousemove', this._onMouseMove);
        this.canvasElement.removeEventListener('mousedown', this._onMouseDown);
        this.canvasElement.removeEventListener('mouseup', this._onMouseUp);
        this.canvasElement.removeEventListener('contextmenu', this._onContextMenu);
        this.canvasElement.removeEventListener('wheel', this._onWheel); // Pastikan event listener dihapus

        for (const key in this.keys) this.keys[key] = false;
        this.mouse.buttons.fill(false);
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.mouse.isDragging = false;
        this.mouse.wheelDeltaY = 0; // Reset wheel delta
        this.keyPressOnceState = {};
    }

    resetMouseDeltas() {
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        // this.mouse.wheelDeltaY = 0; // Wheel delta direset di TPVCameraControls setelah digunakan
                                   // atau bisa direset di sini jika tidak ada consumer lain.
                                   // Untuk konsistensi dengan kode TPVCameraControls, biarkan direset di sana.
    }
}
// js/inputController.js
export class InputController {
    constructor(canvasElement) {
        this.canvasElement = canvasElement; // Digunakan untuk meminta pointer lock
        this.keys = {
            KeyW: false, KeyA: false, KeyS: false, KeyD: false,
            ShiftRight: false // Atau ShiftLeft jika Anda preferensi
        };
        this.mouseDelta = { x: 0, y: 0 }; // Akan diisi oleh movementX/Y saat pointer terkunci
        this.isPointerLocked = false;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);
        this._onPointerLockError = this._onPointerLockError.bind(this);
        this._onCanvasClick = this._onCanvasClick.bind(this); // Untuk meminta lock saat canvas diklik
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
        if (this.isPointerLocked) {
            this.mouseDelta.x = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            this.mouseDelta.y = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        } else {
            // Jika pointer tidak terkunci, kita tidak ingin delta mouse biasa mempengaruhi pandangan.
            // Perilaku ini mirip FPS di mana mouse hanya mengontrol pandangan saat terkunci.
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        }
    }

    _onPointerLockChange() {
        if (document.pointerLockElement === this.canvasElement) {
            console.log('Pointer Locked');
            this.isPointerLocked = true;
            document.addEventListener('mousemove', this._onMouseMove, false); // Dengarkan mousemove HANYA saat terkunci
        } else {
            console.log('Pointer Unlocked');
            this.isPointerLocked = false;
            document.removeEventListener('mousemove', this._onMouseMove, false); // Berhenti mendengarkan saat tidak terkunci
            // Reset delta saat pointer dilepas
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
        }
    }

    _onPointerLockError() {
        console.error('Pointer Lock Error.');
        this.isPointerLocked = false; // Pastikan state konsisten
    }

    _onCanvasClick() {
        if (!this.isPointerLocked) {
            this.canvasElement.requestPointerLock =
                this.canvasElement.requestPointerLock ||
                this.canvasElement.mozRequestPointerLock ||
                this.canvasElement.webkitRequestPointerLock;
            if (this.canvasElement.requestPointerLock) {
                this.canvasElement.requestPointerLock();
            } else {
                console.warn("Pointer Lock API not available on this element.");
            }
        }
    }

    enable() {
        document.addEventListener('keydown', this._onKeyDown, false);
        document.addEventListener('keyup', this._onKeyUp, false);
        document.addEventListener('pointerlockchange', this._onPointerLockChange, false);
        document.addEventListener('mozpointerlockchange', this._onPointerLockChange, false); // Firefox
        document.addEventListener('webkitpointerlockchange', this._onPointerLockChange, false); // Chrome, Safari, Opera
        document.addEventListener('pointerlockerror', this._onPointerLockError, false);
        document.addEventListener('mozpointerlockerror', this._onPointerLockError, false);
        document.addEventListener('webkitpointerlockerror', this._onPointerLockError, false);

        this.canvasElement.addEventListener('click', this._onCanvasClick, false);
        console.log("InputController enabled. Klik canvas untuk mengunci pointer.");
    }

    disable() { // Dipanggil jika Anda ingin menonaktifkan semua input
        document.removeEventListener('keydown', this._onKeyDown, false);
        document.removeEventListener('keyup', this._onKeyUp, false);
        document.removeEventListener('mousemove', this._onMouseMove, false); // Hapus ini juga jika masih ada
        document.removeEventListener('pointerlockchange', this._onPointerLockChange, false);
        document.removeEventListener('mozpointerlockchange', this._onPointerLockChange, false);
        document.removeEventListener('webkitpointerlockchange', this._onPointerLockChange, false);
        document.removeEventListener('pointerlockerror', this._onPointerLockError, false);
        document.removeEventListener('mozpointerlockerror', this._onPointerLockError, false);
        document.removeEventListener('webkitpointerlockerror', this._onPointerLockError, false);

        this.canvasElement.removeEventListener('click', this._onCanvasClick, false);

        if (document.pointerLockElement === this.canvasElement) {
            document.exitPointerLock = document.exitPointerLock ||
                                      document.mozExitPointerLock ||
                                      document.webkitExitPointerLock;
            if(document.exitPointerLock) document.exitPointerLock();
        }
        this.isPointerLocked = false;

        for (const key in this.keys) {
            this.keys[key] = false;
        }
        this.mouseDelta = { x: 0, y: 0 };
    }

    resetMouseDelta() { // Panggil di akhir setiap frame update kontrol kamera
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
    }
}
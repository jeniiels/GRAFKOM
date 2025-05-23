// js/inputManager.js
export class InputManager {
    constructor(canvasElement) {
        this.canvasElement = canvasElement;
        this.keys = {
            KeyW: false, KeyA: false, KeyS: false, KeyD: false,
            ShiftLeft: false, // Untuk lari
            // Tambahkan tombol lain jika perlu
        };
        this.mouse = {
            x: 0, y: 0, // Posisi mouse relatif terhadap tengah layar (untuk orbit)
            buttons: [false, false, false], // Kiri, Tengah, Kanan
            deltaX: 0, deltaY: 0, // Pergerakan mouse sejak frame terakhir
            isDragging: false
        };
        this.previousMousePos = {x: null, y: null};

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onContextMenu = (event) => event.preventDefault(); // Mencegah menu klik kanan
    }

    _onKeyDown(event) {
        if (this.keys.hasOwnProperty(event.code)) this.keys[event.code] = true;
    }
    _onKeyUp(event) {
        if (this.keys.hasOwnProperty(event.code)) this.keys[event.code] = false;
    }
    _onMouseDown(event) {
        this.mouse.buttons[event.button] = true;
        this.mouse.isDragging = true;
        this.previousMousePos = {x: event.clientX, y: event.clientY}; // Simpan posisi awal drag
    }
    _onMouseUp(event) {
        this.mouse.buttons[event.button] = false;
        this.mouse.isDragging = false;
        this.previousMousePos = {x: null, y: null};
    }
    _onMouseMove(event) {
        const currentX = event.clientX;
        const currentY = event.clientY;

        // Hitung posisi mouse relatif ke tengah canvas (berguna untuk beberapa jenis kontrol)
        // const rect = this.canvasElement.getBoundingClientRect();
        // this.mouse.x = currentX - rect.left - rect.width / 2;
        // this.mouse.y = currentY - rect.top - rect.height / 2;

        if (this.mouse.isDragging && this.previousMousePos.x !== null) {
             this.mouse.deltaX = currentX - this.previousMousePos.x;
             this.mouse.deltaY = currentY - this.previousMousePos.y;
        } else {
            this.mouse.deltaX = 0;
            this.mouse.deltaY = 0;
        }
        this.previousMousePos = {x: currentX, y: currentY};
    }

    enable() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        this.canvasElement.addEventListener('mousemove', this._onMouseMove);
        this.canvasElement.addEventListener('mousedown', this._onMouseDown);
        this.canvasElement.addEventListener('mouseup', this._onMouseUp);
        this.canvasElement.addEventListener('contextmenu', this._onContextMenu); // Mencegah menu klik kanan
    }

    disable() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        this.canvasElement.removeEventListener('mousemove', this._onMouseMove);
        this.canvasElement.removeEventListener('mousedown', this._onMouseDown);
        this.canvasElement.removeEventListener('mouseup', this._onMouseUp);
        this.canvasElement.removeEventListener('contextmenu', this._onContextMenu);
        for (const key in this.keys) this.keys[key] = false;
        this.mouse.buttons.fill(false);
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.mouse.isDragging = false;
    }

    resetMouseDeltas() { // Panggil di akhir setiap frame update
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
}
const os = {
    windows: [],
    zIndexTracker: 10,

    init() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#start-menu') && !e.target.closest('.start-btn')) {
                document.getElementById('start-menu').classList.add('hidden');
            }
        });
    },

    updateClock() {
        const now = new Date();
        document.getElementById('clock').innerText = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    },

    toggleStartMenu() {
        document.getElementById('start-menu').classList.toggle('hidden');
    },

    openApp(appName) {
        if (this.windows.find(w => w.id === appName)) {
            this.focusWindow(appName);
            return;
        }

        const win = { id: appName, maximized: false };
        this.windows.push(win);
        this.renderWindow(appName);
        this.updateTray();
        this.focusWindow(appName);
        document.getElementById('start-menu').classList.add('hidden');
        
        if(appName === 'notepad') this.loadNotepad();
        if(appName === 'calculator') this.initCalc();
    },

    closeApp(appName) {
        this.windows = this.windows.filter(w => w.id !== appName);
        document.getElementById(`win-${appName}`).remove();
        this.updateTray();
    },

    focusWindow(appName) {
        this.zIndexTracker++;
        const el = document.getElementById(`win-${appName}`);
        if(el) el.style.zIndex = this.zIndexTracker;
        
        document.querySelectorAll('.tray-item').forEach(i => i.classList.remove('active'));
        const trayEl = document.getElementById(`tray-${appName}`);
        if(trayEl) trayEl.classList.add('active');
    },

    renderWindow(appName) {
        const container = document.getElementById('window-container');
        const winEl = document.createElement('div');
        winEl.className = 'os-window';
        winEl.id = `win-${appName}`;
        winEl.style.left = `${100 + this.windows.length * 30}px`;
        winEl.style.top = `${100 + this.windows.length * 30}px`;
        winEl.onmousedown = () => this.focusWindow(appName);

        let content = '';
        let icon = '';
        let title = '';

        if (appName === 'notepad') {
            title = 'Notepad'; icon = '📝';
            content = `<textarea class="notepad-textarea" id="notepad-text" placeholder="Start typing..."></textarea>`;
        } else if (appName === 'calculator') {
            title = 'Calculator'; icon = '🧮';
            winEl.style.width = '300px';
            content = `
                <div class="calc-display" id="calc-disp">0</div>
                <div class="calc-grid">
                    <button class="calc-btn" onclick="os.calcInp('7')">7</button>
                    <button class="calc-btn" onclick="os.calcInp('8')">8</button>
                    <button class="calc-btn" onclick="os.calcInp('9')">9</button>
                    <button class="calc-btn op" onclick="os.calcOp('/')">/</button>
                    <button class="calc-btn" onclick="os.calcInp('4')">4</button>
                    <button class="calc-btn" onclick="os.calcInp('5')">5</button>
                    <button class="calc-btn" onclick="os.calcInp('6')">6</button>
                    <button class="calc-btn op" onclick="os.calcOp('*')">*</button>
                    <button class="calc-btn" onclick="os.calcInp('1')">1</button>
                    <button class="calc-btn" onclick="os.calcInp('2')">2</button>
                    <button class="calc-btn" onclick="os.calcInp('3')">3</button>
                    <button class="calc-btn op" onclick="os.calcOp('-')">-</button>
                    <button class="calc-btn" onclick="os.calcInp('C')">C</button>
                    <button class="calc-btn" onclick="os.calcInp('0')">0</button>
                    <button class="calc-btn op" onclick="os.calcOp('=')">=</button>
                    <button class="calc-btn op" onclick="os.calcOp('+')">+</button>
                </div>
            `;
        }

        winEl.innerHTML = `
            <div class="window-header" id="header-${appName}">
                <div class="window-title">${icon} ${title}</div>
                <div class="window-controls">
                    <button class="win-btn win-min"></button>
                    <button class="win-btn win-max"></button>
                    <button class="win-btn win-close" onclick="os.closeApp('${appName}')"></button>
                </div>
            </div>
            <div class="window-body">${content}</div>
        `;
        container.appendChild(winEl);
        this.makeDraggable(winEl, document.getElementById(`header-${appName}`));
    },

    updateTray() {
        const tray = document.getElementById('open-apps-tray');
        tray.innerHTML = '';
        this.windows.forEach(win => {
            const el = document.createElement('div');
            el.className = 'tray-item';
            el.id = `tray-${win.id}`;
            el.innerText = win.id.charAt(0).toUpperCase() + win.id.slice(1);
            el.onclick = () => this.focusWindow(win.id);
            tray.appendChild(el);
        });
    },

    makeDraggable(elmnt, header) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    },

    // Notepad Logic
    loadNotepad() {
        const textEl = document.getElementById('notepad-text');
        if(!textEl) return;
        textEl.value = localStorage.getItem('os_notepad') || '';
        textEl.addEventListener('input', (e) => {
            localStorage.setItem('os_notepad', e.target.value);
        });
    },

    // Calc Logic
    calcState: { val: '0', op: null, prev: null },
    initCalc() { this.calcState = { val: '0', op: null, prev: null }; },
    calcInp(n) {
        if(n === 'C') { this.initCalc(); }
        else { this.calcState.val = this.calcState.val === '0' ? n : this.calcState.val + n; }
        document.getElementById('calc-disp').innerText = this.calcState.val;
    },
    calcOp(o) {
        if(o === '=') {
            if(this.calcState.op && this.calcState.prev) {
                this.calcState.val = eval(`${this.calcState.prev} ${this.calcState.op} ${this.calcState.val}`).toString();
                this.calcState.op = null;
                this.calcState.prev = null;
            }
        } else {
            this.calcState.prev = this.calcState.val;
            this.calcState.val = '0';
            this.calcState.op = o;
        }
        document.getElementById('calc-disp').innerText = this.calcState.val;
    }
};

window.onload = () => os.init();

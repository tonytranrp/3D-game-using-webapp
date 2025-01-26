export class GameMenu {
    constructor() {
        this.menuVisible = false;
        this.createMenuElements();
        this.createCustomCursor();
        this.addEventListeners();
    }
    addEventListeners() {
        const continueBtn = document.getElementById('continue-btn');
        const quitBtn = document.getElementById('quit-btn');
        
        if (continueBtn) {
            continueBtn.addEventListener('click', () => this.toggleMenu());
        }
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                window.close();
                window.location.href = "about:blank";
            });
        }
    }

    createMenuElements() {
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'pause-menu';
        this.menuContainer.style.display = 'none';
        this.menuContainer.innerHTML = `
            <div class="menu-content">
                <h2>Game Paused</h2>
                <button id="continue-btn" class="menu-button">Continue</button>
                <button id="quit-btn" class="menu-button">Quit</button>
            </div>
        `;
        document.body.appendChild(this.menuContainer);
    }

    createCustomCursor() {
        const cursor = document.createElement('div');
        cursor.id = 'custom-cursor';
        document.body.appendChild(cursor);
        
        document.addEventListener('mousemove', (e) => {
            if (!this.menuVisible) return;
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
    }

    toggleMenu() {
        this.menuVisible = !this.menuVisible;
        this.menuContainer.style.display = this.menuVisible ? 'flex' : 'none';
        document.body.style.cursor = 'none';
        document.getElementById('custom-cursor').style.display = 
            this.menuVisible ? 'block' : 'none';
        
        if (this.menuVisible) {
            document.exitPointerLock();
            document.dispatchEvent(new CustomEvent('gamePaused'));
        } else {
            document.body.requestPointerLock();
            document.dispatchEvent(new CustomEvent('gameResumed'));
        }
    }
}
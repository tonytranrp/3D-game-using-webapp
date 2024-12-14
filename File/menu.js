class GameMenu {
    constructor() {
        this.menuVisible = false;
        this.createMenuElements();
        this.createCustomCursor();
        this.addEventListeners();
    }

    createMenuElements() {
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'pause-menu';
        this.menuContainer.style.display = 'none';

        const menuContent = `
            <div class="menu-content">
                <h2>Game Paused</h2>
                <button id="continue-btn" class="menu-button">Continue</button>
                <button id="quit-btn" class="menu-button">Quit</button>
            </div>
        `;
        this.menuContainer.innerHTML = menuContent;
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

    addEventListeners() {
        // Make buttons pointer-events enabled
        const buttons = this.menuContainer.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.pointerEvents = 'auto';
        });

        document.getElementById('continue-btn').addEventListener('click', () => {
            this.hideMenu();
            this.resumeGame();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            window.close();
            window.location.href = "about:blank";
        });
    }

    showMenu() {
        this.menuVisible = true;
        this.menuContainer.style.display = 'flex';
        this.menuContainer.style.pointerEvents = 'auto';
        document.body.style.cursor = 'none';
        document.getElementById('custom-cursor').style.display = 'block';
        document.exitPointerLock();
    }

    hideMenu() {
        this.menuVisible = false;
        this.menuContainer.style.display = 'none';
        document.body.style.cursor = 'none';
        document.getElementById('custom-cursor').style.display = 'none';
        document.body.requestPointerLock();
    }

    toggleMenu() {
        if (this.menuVisible) {
            this.hideMenu();
            this.resumeGame();
        } else {
            this.showMenu();
            this.pauseGame();
        }
    }

    pauseGame() {
        document.dispatchEvent(new CustomEvent('gamePaused'));
    }

    resumeGame() {
        document.dispatchEvent(new CustomEvent('gameResumed'));
    }

    isMenuVisible() {
        return this.menuVisible;
    }
}

window.GameMenu = GameMenu;
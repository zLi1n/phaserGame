function replaceCanvasWithDiv() {
    const canvas = document.getElementById('gameCanvas');
    const div = document.createElement('div');
    div.id = 'gameCanvas';
    div.style.width = canvas.style.width;
    div.style.height = canvas.style.height;
    div.style.position = canvas.style.position;
    
    const container = canvas.parentNode;
    container.replaceChild(div, canvas);
}

replaceCanvasWithDiv();

const canvas = document.getElementById('drawing-board');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.7;

let drawing = false;
let currentPath = [];
let paths = [];
let undonePaths = [];

// Brush settings
const colorPicker = document.getElementById('color-picker');
const brushSize = document.getElementById('brush-size');
const brushType = document.getElementById('brush-type');
const shapeType = document.getElementById('shape-type');
const textInput = document.getElementById('text-input');
const fontSize = document.getElementById('font-size');

let currentColor = colorPicker.value;
let currentSize = brushSize.value;
let currentBrushType = brushType.value;
let currentShape = shapeType.value;

colorPicker.addEventListener('change', (e) => currentColor = e.target.value);
brushSize.addEventListener('input', (e) => currentSize = e.target.value);
brushType.addEventListener('change', (e) => currentBrushType = e.target.value);
shapeType.addEventListener('change', (e) => currentShape = e.target.value);

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseout', endDrawing);

function getMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function startDrawing(e) {
    drawing = true;
    const pos = getMousePosition(e);
    currentPath = [{ x: pos.x, y: pos.y }];
}

function draw(e) {
    if (!drawing) return;

    const pos = getMousePosition(e);

    if (currentShape === 'none') {
        // Freehand drawing
        ctx.lineWidth = currentSize;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentColor;

        if (currentBrushType === 'gradient') {
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, currentColor);
            gradient.addColorStop(1, '#ffffff');
            ctx.strokeStyle = gradient;
        } else if (currentBrushType === 'pattern') {
            ctx.strokeStyle = createPattern();
        }

        ctx.beginPath();
        ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        currentPath.push(pos);
    } else {
        // Shape preview while dragging
        redrawCanvas(); 
        drawShape(currentPath[0], pos);
    }
}

function endDrawing(e) {
    if (!drawing) return;
    drawing = false;

    const pos = getMousePosition(e);

    if (currentShape !== 'none') {
        drawShape(currentPath[0], pos);
        paths.push({
            path: [currentPath[0], pos],
            color: currentColor,
            size: currentSize,
            type: currentShape
        });
    } else {
        paths.push({
            path: currentPath,
            color: currentColor,
            size: currentSize,
            type: currentShape
        });
    }

    undonePaths = [];
}

function drawShape(start, end) {
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;

    if (currentShape === 'circle') {
        const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    } else if (currentShape === 'rectangle') {
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    } else if (currentShape === 'line') {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }
}

function createPattern() {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 20;
    patternCanvas.height = 20;
    const patternCtx = patternCanvas.getContext('2d');

    patternCtx.fillStyle = currentColor;
    patternCtx.fillRect(0, 0, 20, 20);
    patternCtx.strokeStyle = '#ffffff';
    patternCtx.strokeRect(0, 0, 20, 20);

    return ctx.createPattern(patternCanvas, 'repeat');
}

// Undo/Redo
document.getElementById('undo-btn').addEventListener('click', () => {
    if (paths.length > 0) {
        undonePaths.push(paths.pop());
        redrawCanvas();
    }
});

document.getElementById('redo-btn').addEventListener('click', () => {
    if (undonePaths.length > 0) {
        paths.push(undonePaths.pop());
        redrawCanvas();
    }
});

function endDrawing(e) {
    if (!drawing) return;
    drawing = false;

    const pos = getMousePosition(e);

    if (currentShape !== 'none') {
        // Save the drawn shape to history
        paths.push({
            path: [currentPath[0], pos],
            color: currentColor,
            size: currentSize,
            type: currentShape
        });
        drawShape(currentPath[0], pos);
    } else {
        paths.push({
            path: [...currentPath],
            color: currentColor,
            size: currentSize,
            type: 'none'
        });
    }

    undonePaths = [];
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths.forEach(({ path, color, size, type }) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = size;

        if (type === 'none') {
            // Freehand drawing
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            path.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
        } else if (type === 'circle') {
            const radius = Math.sqrt(Math.pow(path[1].x - path[0].x, 2) + Math.pow(path[1].y - path[0].y, 2));
            ctx.beginPath();
            ctx.arc(path[0].x, path[0].y, radius, 0, Math.PI * 2);
            ctx.stroke();
        } else if (type === 'rectangle') {
            ctx.strokeRect(path[0].x, path[0].y, path[1].x - path[0].x, path[1].y - path[0].y);
        } else if (type === 'line') {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            ctx.lineTo(path[1].x, path[1].y);
            ctx.stroke();
        }
    });
}

// Save drawing
document.getElementById('save-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Clear Canvas
document.getElementById('clear-btn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths = [];
    undonePaths = [];
});

// Add Text
canvas.addEventListener('dblclick', (e) => {
    const pos = getMousePosition(e);
    const text = textInput.value;
    if (text) {
        ctx.font = `${fontSize.value}px Arial`;
        ctx.fillStyle = currentColor;
        ctx.fillText(text, pos.x, pos.y);
    }
});

// AI Recognition (Example)
document.getElementById('recognize-btn').addEventListener('click', async () => {
    const dataUrl = canvas.toDataURL();

    const response = await fetch('https://api.example.com/analyze', {
        method: 'POST',
        body: JSON.stringify({ image: dataUrl }),
        headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    document.getElementById('feedback').innerText = `AI says: "${result.description}"`;
});

// AI Suggestion (Example)
document.getElementById('suggest-btn').addEventListener('click', async () => {
    const query = document.getElementById('suggestion-input').value;

    const response = await fetch('https://api.example.com/suggest', {
        method: 'POST',
        body: JSON.stringify({ prompt: query }),
        headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    document.getElementById('feedback').innerText = `Suggestion: "${result.suggestion}"`;
});
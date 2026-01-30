// keep one global state so init doesn't double-bind
window.__drawState = window.__drawState || { initialized: false };

window.initDraw = function initDraw() {
  const canvas = document.getElementById("draw-wrapper");
  const outerCanvas = document.getElementById("edit-main");
  const border = document.getElementById("edit-container");
  const brushSize = document.getElementById("lineWidth");
  const undoBtn = document.getElementById("undo");
  const redoBtn = document.getElementById("redo");
  const penBtn = document.getElementById("pen");
  const eraserBtn = document.getElementById("eraser");
  const clearBtn = document.getElementById("clearBtn");
  const bucketBtn = document.getElementById("paintBucket");
  const eyedropperBtn = document.getElementById("eyedropper");
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
  document.querySelectorAll(".transparent-button")
      .forEach(el => el.classList.add('dark'));
  } else {
  document.querySelectorAll(".transparent-button")
      .forEach(el => el.classList.remove('dark'));
  }

  if (canvas.dataset.drawInit === "1") return;
  canvas.dataset.drawInit = "1";

  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  let undoStack = [];
  let redoStack = [];
  const maxHistory = 20;
  let justCleared = false;
  let isPainting = false;
  window.hasUnsavedChanges = false;
  var multiply = 2;
  let mode = "draw";
  let manualSelection = false;
  let backgroundMode = "white";
  if (backgroundMode !== 'transparent') {
    outerCanvas.style.background = '#fff'; // **PUT USER INPUT TO HERE WHEN IMPLEMENTED MENU**
  } else {
    outerCanvas.style.backgroundImage = 'url("/assets/icons/transparentback.svg")';
  }

  function saveState() {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > maxHistory) undoStack.shift();
    redoStack = [];
  }

  function restoreState(state) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = state;
    window.window.hasUnsavedChanges = true;
  }

  function undo() {
    if (!isPainting) {
      if (undoStack.length === 0 && !isPainting) return;
      redoStack.push(canvas.toDataURL());
      const lastState = undoStack.pop();
      restoreState(lastState);
      justUndid = true;
      justCleared = false;
      window.hasUnsavedChanges = true;
    }
  }

  function redo() {
    if (!isPainting) {
      if (redoStack.length === 0) return;
      undoStack.push(canvas.toDataURL());
      const nextState = redoStack.pop();
      restoreState(nextState);
      justCleared = false;
      window.hasUnsavedChanges = true;
    }
  }

  function clearCanvas() {
    if (!justCleared) {
      saveState();
      justCleared = true;
      window.hasUnsavedChanges = true;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function pickColor(x, y) {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2], pixel[3]);
    const colorInput = document.getElementById("stroke");

    if (pixel[3] === 0 && backgroundMode !== "transparent") {
      ctx.strokeStyle = "#ffffff"; // ALLOW USER INPUT HERE IN MENU UPDATE
      if (colorInput) colorInput.value = "#ffffff";
    } else {
      ctx.strokeStyle = hex;
      if (colorInput) colorInput.value = hex;
    }
  }

  function rgbToHex(r, g, b, a) {
    return (
      "#" +
      [r, g, b]
        .map(v => v.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  function paintBucket(startX, startY, fillColor) {
    const width = canvas.width;
    const height = canvas.height;

    // Safety check
    if (startX < 0 || startY < 0 || startX >= width || startY >= height) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const startIndex = (startY * width + startX) * 4;
    const targetColor = [
      data[startIndex],
      data[startIndex + 1],
      data[startIndex + 2],
      data[startIndex + 3]
    ];

    const fill = hexToRgba(fillColor);

    // If already the same color, do nothing
    if (colorsMatch(targetColor, fill, 0)) return;

    const tolerance = 20;
    const visited = new Uint8Array(width * height);
    const queue = [[startX, startY]];

    while (queue.length) {
      const [x, y] = queue.pop();
      if (x < 0 || y < 0 || x >= width || y >= height) continue;

      const idx = y * width + x;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const i = idx * 4;
      const currentColor = [
        data[i],
        data[i + 1],
        data[i + 2],
        data[i + 3]
      ];

      if (!colorsMatch(currentColor, targetColor, tolerance)) continue;

      // Fill pixel
      data[i]     = fill[0];
      data[i + 1] = fill[1];
      data[i + 2] = fill[2];
      data[i + 3] = fill[3];

      // 4-way flood fill
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  }
  function hexToRgba(hex) {
    const c = parseInt(hex.replace("#", ""), 16);
    return [
      (c >> 16) & 255,
      (c >> 8) & 255,
      c & 255,
      255
    ];
  }

  function colorsMatch(a, b, tolerance = 0) {
    return (
      Math.abs(a[0] - b[0]) <= tolerance &&
      Math.abs(a[1] - b[1]) <= tolerance &&
      Math.abs(a[2] - b[2]) <= tolerance &&
      Math.abs(a[3] - b[3]) <= tolerance
    );
  }

  border.addEventListener('change', e => {
    if (e.target.id === 'stroke') ctx.strokeStyle = e.target.value;
  });

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  }
  
  function isPenEraser(e) {
    // eraser bit = 32
    return e.pointerType === "pen" && (e.buttons & 32) !== 0;
  }

  function start(e) {
    if (e.pointerType === "pen" && (e.buttons & 32) === 32) {
      selectTool("erase");
      manualSelection = false;
    }
    const { x, y } = getPos(e);
    const px = Math.floor(x * multiply);
    const py = Math.floor(y * multiply);

    justCleared = false;
    ctx.lineWidth = Number(brushSize.value) || 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (mode === "pick") {
      pickColor(px, py);
      return;
    } else if (mode === "fill") {
      saveState();
      paintBucket(px, py, ctx.strokeStyle);
      window.hasUnsavedChanges = true;
      return;
    }
    if (e.button === 0 && e.pointerType === 'mouse' || e.pointerType === 'pen' || e.pointerType === 'touch') {
      saveState();
      isPainting = true;
      mainDrawLogic(e);
    }
    window.hasUnsavedChanges = true;
  }

  let lastMode = mode; // track the last active tool
  function mainDrawLogic(e) {
    if (!isPainting) return;
    e.preventDefault();

    if (e.pointerType === "pen" && !manualSelection) {
      selectTool(isPenEraser(e) ? "erase" : "draw");
      manualSelection = false;
    }
    if ((e.pointerType === "touch" && !manualSelection) || (e.pointerType === "mouse" && !manualSelection)) {
      selectTool("draw");
    }

    const { x, y } = getPos(e);

    if (mode !== lastMode) {
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x * multiply, y * multiply);
      lastMode = mode;
    }

    ctx.globalCompositeOperation = mode === "erase" ? "destination-out" : "source-over";

    ctx.lineTo(x * multiply, y * multiply);
    ctx.stroke();

    window.hasUnsavedChanges = true;
  }

  function cursorSet(){
    if (mode === "pick") {
      canvas.style.cursor = 'url("/assets/icons/dropCursor.svg") 3 21, crosshair'
    } else if (mode === "fill") {
      canvas.style.cursor = 'url("/assets/icons/paintCursor.svg") 17 10, crosshair'
    } else if (mode === "draw") {
      canvas.style.cursor = 'url("/assets/icons/penCursor.svg") 3 21, crosshair'
    } else if (mode === "erase") {
      canvas.style.cursor = 'url("/assets/icons/eraserCursor.svg") 4 18, crosshair'
    }
  }

  function end(e) {
    e.preventDefault();
    isPainting = false;
    ctx.beginPath();
    ctx.globalCompositeOperation = "source-over";
  }
  
  brushSize.addEventListener("input", () => {
    let val = parseInt(brushSize.value, 10);
    if (Number.isNaN(val)) val = 0;
    if (val < 0) val = 0;
    if (val > 99) val = 99;
    brushSize.value = val;
  });
  // mouse/touch
  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", mainDrawLogic);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointerleave", end);
  canvas.addEventListener("pointermove", cursorSet);

  // buttons
  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);
  function selectTool(tool) {
    mode = tool;

    penBtn.classList.toggle("focus-visible", tool === "draw");
    eraserBtn.classList.toggle("focus-visible", tool === "erase");
    bucketBtn.classList.toggle("focus-visible", tool === "fill");
    eyedropperBtn.classList.toggle("focus-visible", tool === "pick");
  }

  penBtn.addEventListener("click", () => { selectTool("draw"); manualSelection = true; });
  eraserBtn.addEventListener("click", () => { selectTool("erase"); manualSelection = true; });
  bucketBtn.addEventListener("click", () => { selectTool("fill"); manualSelection = true; });
  eyedropperBtn.addEventListener("click", () => { selectTool("pick"); manualSelection = true; });
  clearBtn.addEventListener("click", () => clearCanvas());

  // keyboard
  const keyHandler = (event) => {
    const ctrlKey = navigator.platform.toUpperCase().includes("IPHONE") || navigator.platform.toUpperCase().includes("MAC") || navigator.platform.toUpperCase().includes("IPAD") || navigator.platform.toUpperCase().includes("MACINTEL") ? event.metaKey : event.ctrlKey;
    if (ctrlKey && !event.shiftKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
    } else if (ctrlKey && event.shiftKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      redo();
    } else if (ctrlKey && event.key.toLowerCase() === "x") {
      event.preventDefault();
      clearCanvas();
    } else if (ctrlKey && event.key.toLowerCase() === "p" && isPainting === false) {
      event.preventDefault();
      selectTool("draw");
      manualSelection = true;
    } else if (ctrlKey && event.key.toLowerCase() === "e" && isPainting === false) {
      event.preventDefault();
      selectTool("erase");
      manualSelection = true;
    } else if (ctrlKey && event.key.toLowerCase() === "b" && isPainting === false) {
      event.preventDefault();
      selectTool("fill");
      manualSelection = true;
    } else if (ctrlKey && event.key.toLowerCase() === "i" && isPainting === false) {
      event.preventDefault();
      selectTool("pick");
      manualSelection = true;
    }
  };
  document.addEventListener("keydown", keyHandler);

  const observer = new ResizeObserver(() => {
    // Read CSS pixel size as NUMBERS
    const displayW = outerCanvas.clientWidth;
    const displayH = outerCanvas.clientHeight;

    // Save current pixels (real backing pixels)
    const temp = document.createElement("canvas");
    temp.width = canvas.width;
    temp.height = canvas.height;
    temp.getContext("2d").drawImage(canvas, 0, 0);

    // Set CSS size (on-screen)
    canvas.style.width = displayW + "px";
    canvas.style.height = displayH + "px";

    // Set internal resolution (backing store)
    canvas.width = 1000;
    canvas.height = 1000;

    const ctx = canvas.getContext("2d");

    // Put old pixels back, scaled to the new backing resolution
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, canvas.width, canvas.height);
    multiply = canvas.width / outerCanvas.clientWidth;
  });

  observer.observe(outerCanvas);

  window.addEventListener("beforeunload", (e) => {
    if (!window.window.hasUnsavedChanges) return;

    e.preventDefault();
    e.returnValue = ""; // required for Chrome
  });

  document.getElementById('download').addEventListener('click', function () {
    const canvas = document.getElementById('draw-wrapper');
    
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    if (backgroundMode !== 'transparent') {
      ctx.fillStyle = '#fff'; // **PUT USER INPUT TO HERE WHEN IMPLEMENTED MENU**
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }
    ctx.drawImage(canvas, 0, 0);
    // Convert canvas to a PNG data URL
    const image = tempCanvas.toDataURL('image/png');

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = image;
    link.download = 'mini.png'; // filename for the download (user input needed here as well)
    link.click();
    window.window.hasUnsavedChanges = false;
  });
};
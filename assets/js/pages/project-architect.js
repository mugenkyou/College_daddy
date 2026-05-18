const SVG_NS = "http://www.w3.org/2000/svg";
const GRID_SIZE = 20;
const DEFAULT_NODE_SIZE = {
  terminator: { width: 180, height: 80 },
  process: { width: 200, height: 100 },
  decision: { width: 170, height: 120 },
  input: { width: 200, height: 90 },
};
const DEFAULT_LABELS = {
  terminator: "Start",
  process: "Process",
  decision: "Decision",
  input: "Input / Output",
};
const DEFAULT_NODE_COLORS = {
  fill: "#0f172a",
  stroke: "#94a3b8",
  text: "#e7edf7",
};
const DEFAULT_EDGE_COLOR = "#38bdf8";

class ProjectArchitect {
  constructor() {
    this.canvas = document.getElementById("diagramCanvas");
    this.stage = document.getElementById("canvasStage");
    this.nodeLayer = document.getElementById("nodeLayer");
    this.edgeLayer = document.getElementById("edgeLayer");
    this.connectBtn = document.getElementById("connectBtn");
    this.duplicateBtn = document.getElementById("duplicateBtn");
    this.deleteBtn = document.getElementById("deleteBtn");
    this.exportSvgBtn = document.getElementById("exportSvgBtn");
    this.exportPngBtn = document.getElementById("exportPngBtn");
    this.loadSampleBtn = document.getElementById("loadSampleBtn");
    this.clearBoardBtn = document.getElementById("clearBoardBtn");
    this.labelInput = document.getElementById("labelInput");
    this.widthInput = document.getElementById("widthInput");
    this.heightInput = document.getElementById("heightInput");
    this.fillColorInput = document.getElementById("fillColorInput");
    this.strokeColorInput = document.getElementById("strokeColorInput");
    this.accentColorInput = document.getElementById("accentColorInput");
    this.selectionSummary = document.getElementById("selectionSummary");
    this.modePill = document.getElementById("modePill");
    this.inspectorNote = document.getElementById("inspectorNote");
    this.shapeButtons = Array.from(document.querySelectorAll(".shape-chip"));

    this.nodes = [];
    this.edges = [];
    this.selection = null;
    this.mode = "select";
    this.connectSourceId = null;
    this.dragState = null;
    this.shapeInsertIndex = 0;
  }

  init() {
    if (!this.canvas) {
      return;
    }

    this.bindPalette();
    this.bindCanvas();
    this.bindToolbar();
    this.bindInspector();
    this.loadSampleDiagram();
  }

  bindPalette() {
    this.shapeButtons.forEach((button) => {
      const shape = button.dataset.shape;
      button.addEventListener("click", () => this.addNode(shape));
      button.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("text/plain", shape);
        event.dataTransfer.effectAllowed = "copy";
      });
    });

    this.stage.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
    });

    this.stage.addEventListener("drop", (event) => {
      event.preventDefault();
      const shape = event.dataTransfer?.getData("text/plain");
      if (!shape) {
        return;
      }
      const point = this.getSvgPoint(event.clientX, event.clientY);
      this.addNode(shape, point.x, point.y);
    });
  }

  bindCanvas() {
    this.canvas.addEventListener("pointermove", (event) =>
      this.handlePointerMove(event),
    );
    this.canvas.addEventListener("pointerup", () => this.stopDragging());
    this.canvas.addEventListener("pointerleave", () => this.stopDragging());
    this.canvas.addEventListener("pointercancel", () => this.stopDragging());
    this.canvas.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (!target.closest(".node-group") && !target.closest(".edge-path")) {
        this.clearSelection();
      }
    });
  }

  bindToolbar() {
    this.connectBtn.addEventListener("click", () => this.toggleConnectMode());
    this.duplicateBtn.addEventListener("click", () => this.duplicateSelection());
    this.deleteBtn.addEventListener("click", () => this.deleteSelection());
    this.exportSvgBtn.addEventListener("click", () => this.exportSvg());
    this.exportPngBtn.addEventListener("click", () => this.exportPng());
    this.loadSampleBtn.addEventListener("click", () => this.loadSampleDiagram());
    this.clearBoardBtn.addEventListener("click", () => this.clearBoard());

    document.addEventListener("keydown", (event) => {
      const isInputFocused = ["INPUT", "TEXTAREA"].includes(
        document.activeElement?.tagName,
      );

      if ((event.key === "Delete" || event.key === "Backspace") && !isInputFocused) {
        event.preventDefault();
        this.deleteSelection();
      }

      if (event.key === "Escape") {
        this.mode = "select";
        this.connectSourceId = null;
        this.updateModeUI();
        this.render();
      }
    });
  }

  bindInspector() {
    this.labelInput.addEventListener("input", () => {
      const node = this.getSelectedNode();
      if (!node) {
        return;
      }
      node.label = this.labelInput.value;
      this.render();
    });

    this.widthInput.addEventListener("input", () => {
      const node = this.getSelectedNode();
      if (!node) {
        return;
      }
      node.width = this.clampDimension(Number(this.widthInput.value), "width");
      this.render();
      this.updateInspector();
    });

    this.heightInput.addEventListener("input", () => {
      const node = this.getSelectedNode();
      if (!node) {
        return;
      }
      node.height = this.clampDimension(Number(this.heightInput.value), "height");
      this.render();
      this.updateInspector();
    });

    this.fillColorInput.addEventListener("input", () => {
      const node = this.getSelectedNode();
      if (!node) {
        return;
      }
      node.fill = this.fillColorInput.value;
      this.render();
    });

    this.strokeColorInput.addEventListener("input", () => {
      const node = this.getSelectedNode();
      if (!node) {
        return;
      }
      node.stroke = this.strokeColorInput.value;
      this.render();
    });

    this.accentColorInput.addEventListener("input", () => {
      const node = this.getSelectedNode();
      if (node) {
        node.textColor = this.accentColorInput.value;
        this.render();
        return;
      }

      const edge = this.getSelectedEdge();
      if (!edge) {
        return;
      }
      edge.color = this.accentColorInput.value;
      this.render();
    });
  }

  addNode(shape, x, y) {
    const id = `node-${crypto.randomUUID()}`;
    const baseSize = DEFAULT_NODE_SIZE[shape] || DEFAULT_NODE_SIZE.process;
    const position =
      typeof x === "number" && typeof y === "number"
        ? { x, y }
        : {
            x: 220 + (this.shapeInsertIndex % 3) * 250,
            y: 140 + Math.floor(this.shapeInsertIndex / 3) * 150,
          };

    this.shapeInsertIndex += 1;

    const node = {
      id,
      shape,
      x: this.snap(position.x),
      y: this.snap(position.y),
      width: baseSize.width,
      height: baseSize.height,
      label: DEFAULT_LABELS[shape] || "Step",
      fill: DEFAULT_NODE_COLORS.fill,
      stroke: DEFAULT_NODE_COLORS.stroke,
      textColor: DEFAULT_NODE_COLORS.text,
    };

    this.nodes.push(node);
    this.selectNode(id);
    this.render();
  }

  createEdge(from, to) {
    if (!from || !to || from === to) {
      return;
    }

    const exists = this.edges.some(
      (edge) => edge.from === from && edge.to === to,
    );
    if (exists) {
      return;
    }

    this.edges.push({
      id: `edge-${crypto.randomUUID()}`,
      from,
      to,
      color: DEFAULT_EDGE_COLOR,
    });
    this.selection = { type: "edge", id: this.edges[this.edges.length - 1].id };
    this.render();
    this.updateInspector();
  }

  duplicateSelection() {
    const node = this.getSelectedNode();
    if (!node) {
      return;
    }

    const clone = {
      ...node,
      id: `node-${crypto.randomUUID()}`,
      x: this.snap(node.x + 40),
      y: this.snap(node.y + 40),
      label: `${node.label} Copy`,
    };
    this.nodes.push(clone);
    this.selectNode(clone.id);
    this.render();
  }

  deleteSelection() {
    if (!this.selection) {
      return;
    }

    if (this.selection.type === "node") {
      const nodeId = this.selection.id;
      this.nodes = this.nodes.filter((node) => node.id !== nodeId);
      this.edges = this.edges.filter(
        (edge) => edge.from !== nodeId && edge.to !== nodeId,
      );
    }

    if (this.selection.type === "edge") {
      this.edges = this.edges.filter((edge) => edge.id !== this.selection.id);
    }

    this.clearSelection();
    this.render();
  }

  clearBoard() {
    this.nodes = [];
    this.edges = [];
    this.shapeInsertIndex = 0;
    this.clearSelection();
    this.render();
  }

  loadSampleDiagram() {
    this.nodes = [
      {
        id: "sample-start",
        shape: "terminator",
        x: 260,
        y: 120,
        width: 180,
        height: 80,
        label: "Start",
        fill: "#132033",
        stroke: "#60a5fa",
        textColor: "#e7edf7",
      },
      {
        id: "sample-input",
        shape: "input",
        x: 260,
        y: 260,
        width: 210,
        height: 90,
        label: "Collect Inputs",
        fill: "#10203a",
        stroke: "#7dd3fc",
        textColor: "#e7edf7",
      },
      {
        id: "sample-decision",
        shape: "decision",
        x: 650,
        y: 260,
        width: 180,
        height: 120,
        label: "Criteria Met?",
        fill: "#1f2336",
        stroke: "#a78bfa",
        textColor: "#f8fafc",
      },
      {
        id: "sample-process",
        shape: "process",
        x: 650,
        y: 450,
        width: 220,
        height: 100,
        label: "Generate Output",
        fill: "#18252e",
        stroke: "#2dd4bf",
        textColor: "#f8fafc",
      },
      {
        id: "sample-end",
        shape: "terminator",
        x: 960,
        y: 450,
        width: 180,
        height: 80,
        label: "End",
        fill: "#14253a",
        stroke: "#38bdf8",
        textColor: "#f8fafc",
      },
    ];

    this.edges = [
      { id: "edge-1", from: "sample-start", to: "sample-input", color: "#38bdf8" },
      { id: "edge-2", from: "sample-input", to: "sample-decision", color: "#38bdf8" },
      { id: "edge-3", from: "sample-decision", to: "sample-process", color: "#38bdf8" },
      { id: "edge-4", from: "sample-process", to: "sample-end", color: "#38bdf8" },
    ];

    this.selection = { type: "node", id: "sample-input" };
    this.mode = "select";
    this.connectSourceId = null;
    this.shapeInsertIndex = this.nodes.length;
    this.render();
    this.updateInspector();
  }

  toggleConnectMode() {
    this.mode = this.mode === "connect" ? "select" : "connect";
    this.connectSourceId = null;
    this.updateModeUI();
    this.render();
  }

  selectNode(id) {
    this.selection = { type: "node", id };
    this.updateInspector();
  }

  selectEdge(id) {
    this.selection = { type: "edge", id };
    this.updateInspector();
  }

  clearSelection() {
    this.selection = null;
    this.connectSourceId = null;
    this.updateInspector();
    this.render();
  }

  getSelectedNode() {
    if (!this.selection || this.selection.type !== "node") {
      return null;
    }
    return this.nodes.find((node) => node.id === this.selection.id) || null;
  }

  getSelectedEdge() {
    if (!this.selection || this.selection.type !== "edge") {
      return null;
    }
    return this.edges.find((edge) => edge.id === this.selection.id) || null;
  }

  handleNodeInteraction(node, event) {
    event.stopPropagation();

    if (this.mode === "connect") {
      if (!this.connectSourceId) {
        this.connectSourceId = node.id;
        this.selectNode(node.id);
        this.render();
        return;
      }

      this.createEdge(this.connectSourceId, node.id);
      this.connectSourceId = null;
      this.mode = "select";
      this.updateModeUI();
      return;
    }

    this.selectNode(node.id);
    const point = this.getSvgPoint(event.clientX, event.clientY);
    this.dragState = {
      nodeId: node.id,
      deltaX: point.x - node.x,
      deltaY: point.y - node.y,
    };
  }

  handlePointerMove(event) {
    if (!this.dragState) {
      return;
    }

    const node = this.nodes.find((item) => item.id === this.dragState.nodeId);
    if (!node) {
      return;
    }

    const point = this.getSvgPoint(event.clientX, event.clientY);
    node.x = this.snap(point.x - this.dragState.deltaX);
    node.y = this.snap(point.y - this.dragState.deltaY);
    this.render();
    this.updateInspector();
  }

  stopDragging() {
    this.dragState = null;
  }

  render() {
    this.renderEdges();
    this.renderNodes();
    this.updateModeUI();
  }

  renderNodes() {
    this.nodeLayer.textContent = "";

    this.nodes.forEach((node) => {
      const group = document.createElementNS(SVG_NS, "g");
      group.classList.add("node-group");
      group.dataset.nodeId = node.id;

      if (this.selection?.type === "node" && this.selection.id === node.id) {
        group.classList.add("selected");
      }

      if (this.connectSourceId === node.id) {
        group.classList.add("connect-source");
      }

      const shape = this.createNodeShape(node);
      shape.classList.add("node-shape");
      shape.style.fill = node.fill || DEFAULT_NODE_COLORS.fill;
      shape.style.stroke = node.stroke || DEFAULT_NODE_COLORS.stroke;
      group.appendChild(shape);

      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", String(node.x));
      text.setAttribute("y", String(node.y));
      text.setAttribute("class", "node-label");
      text.style.fill = node.textColor || DEFAULT_NODE_COLORS.text;
      text.textContent = node.label;
      group.appendChild(text);

      group.addEventListener("pointerdown", (event) =>
        this.handleNodeInteraction(node, event),
      );

      this.nodeLayer.appendChild(group);
    });
  }

  createNodeShape(node) {
    switch (node.shape) {
      case "terminator":
        return this.createRoundedRect(node, 40);
      case "decision":
        return this.createDiamond(node);
      case "input":
        return this.createInputShape(node);
      case "process":
      default:
        return this.createRoundedRect(node, 18);
    }
  }

  createRoundedRect(node, radius) {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(node.x - node.width / 2));
    rect.setAttribute("y", String(node.y - node.height / 2));
    rect.setAttribute("width", String(node.width));
    rect.setAttribute("height", String(node.height));
    rect.setAttribute("rx", String(radius));
    rect.setAttribute("ry", String(radius));
    return rect;
  }

  createDiamond(node) {
    const polygon = document.createElementNS(SVG_NS, "polygon");
    const halfWidth = node.width / 2;
    const halfHeight = node.height / 2;
    polygon.setAttribute(
      "points",
      [
        `${node.x},${node.y - halfHeight}`,
        `${node.x + halfWidth},${node.y}`,
        `${node.x},${node.y + halfHeight}`,
        `${node.x - halfWidth},${node.y}`,
      ].join(" "),
    );
    return polygon;
  }

  createInputShape(node) {
    const polygon = document.createElementNS(SVG_NS, "polygon");
    const left = node.x - node.width / 2;
    const top = node.y - node.height / 2;
    const skew = 26;
    polygon.setAttribute(
      "points",
      [
        `${left + skew},${top}`,
        `${left + node.width},${top}`,
        `${left + node.width - skew},${top + node.height}`,
        `${left},${top + node.height}`,
      ].join(" "),
    );
    return polygon;
  }

  renderEdges() {
    this.edgeLayer.textContent = "";

    this.edges.forEach((edge) => {
      const fromNode = this.nodes.find((node) => node.id === edge.from);
      const toNode = this.nodes.find((node) => node.id === edge.to);

      if (!fromNode || !toNode) {
        return;
      }

      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("class", "edge-path");
      path.dataset.edgeId = edge.id;
      path.setAttribute("d", this.buildConnectorPath(fromNode, toNode));
      path.style.stroke = edge.color || DEFAULT_EDGE_COLOR;

      if (this.selection?.type === "edge" && this.selection.id === edge.id) {
        path.classList.add("selected");
      }

      path.addEventListener("click", (event) => {
        event.stopPropagation();
        this.selectEdge(edge.id);
        this.render();
      });

      this.edgeLayer.appendChild(path);
    });
  }

  buildConnectorPath(fromNode, toNode) {
    const start = this.getAnchorPoint(fromNode, toNode);
    const end = this.getAnchorPoint(toNode, fromNode);
    const midX = this.snap((start.x + end.x) / 2);
    return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
  }

  getAnchorPoint(node, target) {
    const dx = target.x - node.x;
    const dy = target.y - node.y;
    const halfWidth = node.width / 2;
    const halfHeight = node.height / 2;

    if (Math.abs(dx) > Math.abs(dy)) {
      return {
        x: this.snap(node.x + Math.sign(dx || 1) * halfWidth),
        y: this.snap(node.y),
      };
    }

    return {
      x: this.snap(node.x),
      y: this.snap(node.y + Math.sign(dy || 1) * halfHeight),
    };
  }

  updateInspector() {
    const node = this.getSelectedNode();
    const edge = this.getSelectedEdge();
    const hasNode = Boolean(node);
    const hasEdge = Boolean(edge);

    this.labelInput.disabled = !hasNode;
    this.widthInput.disabled = !hasNode;
    this.heightInput.disabled = !hasNode;
    this.fillColorInput.disabled = !hasNode;
    this.strokeColorInput.disabled = !hasNode;
    this.accentColorInput.disabled = !hasNode && !hasEdge;

    if (node) {
      this.selectionSummary.textContent = `${this.titleCase(node.shape)} node selected`;
      this.labelInput.value = node.label;
      this.widthInput.value = String(node.width);
      this.heightInput.value = String(node.height);
      this.fillColorInput.value = this.normalizeColor(
        node.fill || DEFAULT_NODE_COLORS.fill,
      );
      this.strokeColorInput.value = this.normalizeColor(
        node.stroke || DEFAULT_NODE_COLORS.stroke,
      );
      this.accentColorInput.value = this.normalizeColor(
        node.textColor || DEFAULT_NODE_COLORS.text,
      );
      this.inspectorNote.textContent =
        "Resize in clean 20px steps and use the color pickers to match your report theme.";
      return;
    }

    if (edge) {
      this.selectionSummary.textContent = "Connector selected";
      this.labelInput.value = "";
      this.widthInput.value = "";
      this.heightInput.value = "";
      this.fillColorInput.value = DEFAULT_NODE_COLORS.fill;
      this.strokeColorInput.value = DEFAULT_NODE_COLORS.stroke;
      this.accentColorInput.value = this.normalizeColor(
        edge.color || DEFAULT_EDGE_COLOR,
      );
      this.inspectorNote.textContent =
        "Use the Text / Arrow picker to recolor the selected connector while keeping its snap behavior.";
      return;
    }

    this.selectionSummary.textContent = "No element selected";
    this.labelInput.value = "";
    this.widthInput.value = "";
    this.heightInput.value = "";
    this.fillColorInput.value = DEFAULT_NODE_COLORS.fill;
    this.strokeColorInput.value = DEFAULT_NODE_COLORS.stroke;
    this.accentColorInput.value = DEFAULT_EDGE_COLOR;
    this.inspectorNote.textContent =
      "Tip: in connect mode, click one shape and then another to draw a smart arrow.";
  }

  updateModeUI() {
    const isConnectMode = this.mode === "connect";
    this.connectBtn.classList.toggle("btn-primary", isConnectMode);
    this.connectBtn.classList.toggle("btn-secondary", !isConnectMode);
    this.modePill.textContent = isConnectMode
      ? this.connectSourceId
        ? "Pick destination node"
        : "Connect mode"
      : "Select mode";
  }

  exportSvg() {
    const svgText = this.buildExportSvg();
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    this.downloadBlob(blob, "college-daddy-project-architect.svg");
  }

  exportPng() {
    const svgText = this.buildExportSvg();
    const svgBlob = new Blob([svgText], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    const image = new Image();
    const canvas = document.createElement("canvas");
    const { width, height } = this.canvas.viewBox.baseVal;
    canvas.width = width;
    canvas.height = height;

    image.onload = () => {
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }
      context.drawImage(image, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          this.downloadBlob(blob, "college-daddy-project-architect.png");
        }
        URL.revokeObjectURL(url);
      });
    };

    image.src = url;
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  buildExportSvg() {
    const clone = this.canvas.cloneNode(true);
    clone.setAttribute("xmlns", SVG_NS);
    const style = document.createElementNS(SVG_NS, "style");
    style.textContent = `
      .grid-line { fill: none; stroke: rgba(148, 163, 184, 0.16); stroke-width: 1; }
      .arrow-head { fill: context-stroke; }
      .edge-path { fill: none; stroke: ${DEFAULT_EDGE_COLOR}; stroke-width: 2.5; marker-end: url(#arrowhead); }
      .node-shape { fill: ${DEFAULT_NODE_COLORS.fill}; stroke: ${DEFAULT_NODE_COLORS.stroke}; stroke-width: 2; }
      .node-label { fill: ${DEFAULT_NODE_COLORS.text}; font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif; font-size: 16px; font-weight: 600; text-anchor: middle; dominant-baseline: middle; }
    `;
    clone.insertBefore(style, clone.firstChild);
    return new XMLSerializer().serializeToString(clone);
  }

  getSvgPoint(clientX, clientY) {
    const point = this.canvas.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const transformed = point.matrixTransform(
      this.canvas.getScreenCTM()?.inverse(),
    );
    return transformed;
  }

  snap(value) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  clampDimension(value, axis) {
    if (Number.isNaN(value)) {
      return axis === "width" ? 180 : 80;
    }
    if (axis === "width") {
      return Math.min(320, Math.max(80, this.snap(value)));
    }
    return Math.min(220, Math.max(60, this.snap(value)));
  }

  titleCase(value) {
    return value.replace(/(^|\s|-)\w/g, (match) => match.toUpperCase());
  }

  normalizeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(value) ? value : "#000000";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const architect = new ProjectArchitect();
  architect.init();
});

import { fabric } from "fabric";
import { useCallback, useState, useMemo, useRef } from "react";

import { 
  Editor, 
  FILL_COLOR,
  STROKE_WIDTH,
  STROKE_COLOR,
  CIRCLE_OPTIONS,
  DIAMOND_OPTIONS,
  TRIANGLE_OPTIONS,
  BuildEditorProps, 
  RECTANGLE_OPTIONS,
  EditorHookProps,
  STROKE_DASH_ARRAY,
  TEXT_OPTIONS,
  FONT_FAMILY,
  FONT_WEIGHT,
  FONT_SIZE,
  JSON_KEYS,
} from "../_lib/types";
import { useHistory } from "./use-history";
import { 
  createFilter, 
  downloadFile, 
  isTextType,
  transformText
} from "../_lib/utils";
import { useHotkeys } from "./use-hotkeys";
import { useClipboard } from "./use-clipboard";
import { useAutoResize } from "./use-auto-resize";
import { useCanvasEvents } from "./use-canvas-events";
import { useWindowEvents } from "./use-window-events";
import { useLoadState } from "./use-load-state";

const buildEditor = ({
  save,
  undo,
  redo,
  canRedo,
  canUndo,
  autoZoom,
  copy,
  paste,
  canvas,
  fillColor,
  fontFamily,
  setFontFamily,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  selectedObjects,
  strokeDashArray,
  setStrokeDashArray,
}: BuildEditorProps): Editor => {
  const generateSaveOptions = () => {
    const { width, height, left, top } = getWorkspace() as fabric.Rect;

    return {
      name: "Image",
      format: "png",
      quality: 1,
      width,
      height,
      left,
      top,
    };
  };

  const savePng = () => {
    const options = generateSaveOptions();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);

    downloadFile(dataUrl, "png");
    autoZoom();
  };

  const saveSvg = () => {
    const options = generateSaveOptions();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);

    downloadFile(dataUrl, "svg");
    autoZoom();
  };

  const saveJpg = () => {
    const options = generateSaveOptions();

    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas.toDataURL(options);

    downloadFile(dataUrl, "jpg");
    autoZoom();
  };

  const saveJson = async () => {
    const dataUrl = canvas.toJSON(JSON_KEYS);

    await transformText(dataUrl.objects);
    const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataUrl, null, "\t"),
    )}`;
    downloadFile(fileString, "json");
  };

  const loadJson = (json: string) => {
    const data = JSON.parse(json);

    canvas.loadFromJSON(data, () => {
      autoZoom();
    });
  };

  const getWorkspace = () => {
    return canvas
    .getObjects()
    .find((object) => object.name === "clip");
  };

  const center = (object: fabric.Object) => {
    const workspace = getWorkspace();
    const center = workspace?.getCenterPoint();

    if (!center) return;

    // @ts-ignore
    canvas._centerObject(object, center);
  };

  const addToCanvas = (object: fabric.Object) => {
    center(object);
    canvas.add(object);
    canvas.setActiveObject(object);
  };

  return {
    savePng,
    saveJpg,
    saveSvg,
    saveJson,
    loadJson,
    canUndo,
    canRedo,
    autoZoom,
    getWorkspace,
    zoomIn: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio += 0.05;
      const center = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(center.left, center.top),
        zoomRatio > 1 ? 1 : zoomRatio
      );
    },
    zoomOut: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio -= 0.05;
      const center = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(center.left, center.top),
        zoomRatio < 0.2 ? 0.2 : zoomRatio,
      );
    },
    changeSize: (value: { width: number; height: number }) => {
      const workspace = getWorkspace();

      workspace?.set(value);
      autoZoom();
      save();
    },
    changeBackground: (value: string) => {
      const workspace = getWorkspace();
      workspace?.set({ fill: value });
      canvas.renderAll();
      save();
    },
    enableDrawingMode: () => {
      canvas.discardActiveObject();
      canvas.renderAll();
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    },
    disableDrawingMode: () => {
      canvas.isDrawingMode = false;
    },
    onUndo: () => undo(),
    onRedo: () => redo(),
    onCopy: () => copy(),
    onPaste: () => paste(),
    changeImageFilter: (value: string) => {
      const objects = canvas.getActiveObjects();
      objects.forEach((object) => {
        if (object.type === "image") {
          const imageObject = object as fabric.Image;

          const effect = createFilter(value);

          imageObject.filters = effect ? [effect] : [];
          imageObject.applyFilters();
          canvas.renderAll();
        }
      });
    },
    addImage: (value: string) => {
      fabric.Image.fromURL(
        value,
        (image) => {
          const workspace = getWorkspace();

          image.scaleToWidth(workspace?.width || 0);
          image.scaleToHeight(workspace?.height || 0);

          addToCanvas(image);
        },
        {
          crossOrigin: "anonymous",
        },
      );
    },
    delete: () => {
      canvas.getActiveObjects().forEach((object) => canvas.remove(object));
      canvas.discardActiveObject();
      canvas.renderAll();
    },
    addText: (value, options) => {
      const object = new fabric.Textbox(value, {
        ...TEXT_OPTIONS,
        fill: fillColor,
        ...options,
      });

      addToCanvas(object);
    },
    getActiveOpacity: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return 1;
      }

      const value = selectedObject.get("opacity") || 1;

      return value;
    },
    changeFontSize: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, fontSize exists.
          object.set({ fontSize: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontSize: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return FONT_SIZE;
      }

      // @ts-ignore
      // Faulty TS library, fontSize exists.
      const value = selectedObject.get("fontSize") || FONT_SIZE;

      return value;
    },
    changeTextAlign: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, textAlign exists.
          object.set({ textAlign: value });
        }
      });
      canvas.renderAll();
    },
    getActiveTextAlign: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return "left";
      }

      // @ts-ignore
      // Faulty TS library, textAlign exists.
      const value = selectedObject.get("textAlign") || "left";

      return value;
    },
    changeFontUnderline: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, underline exists.
          object.set({ underline: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontUnderline: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return false;
      }

      // @ts-ignore
      // Faulty TS library, underline exists.
      const value = selectedObject.get("underline") || false;

      return value;
    },
    changeFontLinethrough: (value: boolean) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, linethrough exists.
          object.set({ linethrough: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontLinethrough: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return false;
      }

      // @ts-ignore
      // Faulty TS library, linethrough exists.
      const value = selectedObject.get("linethrough") || false;

      return value;
    },
    changeFontStyle: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, fontStyle exists.
          object.set({ fontStyle: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontStyle: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return "normal";
      }

      // @ts-ignore
      // Faulty TS library, fontStyle exists.
      const value = selectedObject.get("fontStyle") || "normal";

      return value;
    },
    changeFontWeight: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, fontWeight exists.
          object.set({ fontWeight: value });
        }
      });
      canvas.renderAll();
    },
    changeOpacity: (value: number) => {
      canvas.getActiveObjects().forEach((object) => {
        object.set({ opacity: value });
      });
      canvas.renderAll();
    },
    bringForward: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.bringForward(object);
      });

      canvas.renderAll();
      
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    sendBackwards: () => {
      canvas.getActiveObjects().forEach((object) => {
        canvas.sendBackwards(object);
      });

      canvas.renderAll();
      const workspace = getWorkspace();
      workspace?.sendToBack();
    },
    changeFontFamily: (value: string) => {
      setFontFamily(value);
      canvas.getActiveObjects().forEach((object) => {
        if (isTextType(object.type)) {
          // @ts-ignore
          // Faulty TS library, fontFamily exists.
          object.set({ fontFamily: value });
        }
      });
      canvas.renderAll();
    },
    changeFillColor: (value: string) => {
      setFillColor(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ fill: value });
      });
      canvas.renderAll();
    },
    changeStrokeColor: (value: string) => {
      setStrokeColor(value);
      canvas.getActiveObjects().forEach((object) => {
        // Text types don't have stroke
        if (isTextType(object.type)) {
          object.set({ fill: value });
          return;
        }

        object.set({ stroke: value });
      });
      canvas.freeDrawingBrush.color = value;
      canvas.renderAll();
    },
    changeStrokeWidth: (value: number) => {
      setStrokeWidth(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeWidth: value });
      });
      canvas.freeDrawingBrush.width = value;
      canvas.renderAll();
    },
    changeStrokeDashArray: (value: number[]) => {
      setStrokeDashArray(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeDashArray: value });
      });
      canvas.renderAll();
    },
    addCircle: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addSoftRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: 50,
        ry: 50,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addTriangle: () => {
      const object = new fabric.Triangle({
        ...TRIANGLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addInverseTriangle: () => {
      const HEIGHT = TRIANGLE_OPTIONS.height;
      const WIDTH = TRIANGLE_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH, y: 0 },
          { x: WIDTH / 2, y: HEIGHT },
        ],
        {
          ...TRIANGLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addDiamond: () => {
      const HEIGHT = DIAMOND_OPTIONS.height;
      const WIDTH = DIAMOND_OPTIONS.width;

      const object = new fabric.Polygon(
        [
          { x: WIDTH / 2, y: 0 },
          { x: WIDTH, y: HEIGHT / 2 },
          { x: WIDTH / 2, y: HEIGHT },
          { x: 0, y: HEIGHT / 2 },
        ],
        {
          ...DIAMOND_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );
      addToCanvas(object);
    },
    // Basic outline variants
    addCircleOutline: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      addToCanvas(object);
    },
    addRectangleOutline: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      addToCanvas(object);
    },
    addRoundedRectangleOutline: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: RECTANGLE_OPTIONS.width / 4,
        ry: RECTANGLE_OPTIONS.height / 4,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      addToCanvas(object);
    },
    // Dashed variants
    addDashedCircle: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: [12, 8],
      });

      addToCanvas(object);
    },
    addDashedRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: [12, 8],
      });

      addToCanvas(object);
    },
    addDashedRoundedRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: RECTANGLE_OPTIONS.width / 4,
        ry: RECTANGLE_OPTIONS.height / 4,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: [12, 8],
      });

      addToCanvas(object);
    },
    // Pills & badges
    addHorizontalPill: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        width: RECTANGLE_OPTIONS.width * 1.6,
        height: RECTANGLE_OPTIONS.height * 0.4,
        rx: RECTANGLE_OPTIONS.height * 0.4,
        ry: RECTANGLE_OPTIONS.height * 0.4,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addVerticalPill: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        width: RECTANGLE_OPTIONS.width * 0.5,
        height: RECTANGLE_OPTIONS.height * 1.3,
        rx: RECTANGLE_OPTIONS.width * 0.25,
        ry: RECTANGLE_OPTIONS.width * 0.25,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addRibbonBadge: () => {
      const WIDTH = RECTANGLE_OPTIONS.width;
      const HEIGHT = RECTANGLE_OPTIONS.height * 0.5;

      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH, y: 0 },
          { x: WIDTH, y: HEIGHT * 0.75 },
          { x: WIDTH * 0.6, y: HEIGHT * 0.75 },
          { x: WIDTH * 0.5, y: HEIGHT },
          { x: WIDTH * 0.4, y: HEIGHT * 0.75 },
          { x: 0, y: HEIGHT * 0.75 },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addRingCircle: () => {
      const outer = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      const inner = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        radius: CIRCLE_OPTIONS.radius * 0.65,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      const group = new fabric.Group([outer, inner], {
        left: CIRCLE_OPTIONS.left,
        top: CIRCLE_OPTIONS.top,
      });

      addToCanvas(group);
    },
    // Additional geometric shapes
    addHexagon: () => {
      const WIDTH = RECTANGLE_OPTIONS.width;
      const HEIGHT = RECTANGLE_OPTIONS.height;

      const object = new fabric.Polygon(
        [
          { x: WIDTH * 0.25, y: 0 },
          { x: WIDTH * 0.75, y: 0 },
          { x: WIDTH, y: HEIGHT * 0.5 },
          { x: WIDTH * 0.75, y: HEIGHT },
          { x: WIDTH * 0.25, y: HEIGHT },
          { x: 0, y: HEIGHT * 0.5 },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addPentagon: () => {
      const WIDTH = RECTANGLE_OPTIONS.width;
      const HEIGHT = RECTANGLE_OPTIONS.height;

      const object = new fabric.Polygon(
        [
          { x: WIDTH * 0.5, y: 0 },
          { x: WIDTH, y: HEIGHT * 0.4 },
          { x: WIDTH * 0.8, y: HEIGHT },
          { x: WIDTH * 0.2, y: HEIGHT },
          { x: 0, y: HEIGHT * 0.4 },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addOctagon: () => {
      const WIDTH = RECTANGLE_OPTIONS.width;
      const HEIGHT = RECTANGLE_OPTIONS.height;
      const o = WIDTH * 0.2;

      const object = new fabric.Polygon(
        [
          { x: o, y: 0 },
          { x: WIDTH - o, y: 0 },
          { x: WIDTH, y: o },
          { x: WIDTH, y: HEIGHT - o },
          { x: WIDTH - o, y: HEIGHT },
          { x: o, y: HEIGHT },
          { x: 0, y: HEIGHT - o },
          { x: 0, y: o },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addParallelogram: () => {
      const WIDTH = RECTANGLE_OPTIONS.width;
      const HEIGHT = RECTANGLE_OPTIONS.height;
      const skew = WIDTH * 0.25;

      const object = new fabric.Polygon(
        [
          { x: skew, y: 0 },
          { x: WIDTH, y: 0 },
          { x: WIDTH - skew, y: HEIGHT },
          { x: 0, y: HEIGHT },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addTrapezoid: () => {
      const WIDTH = RECTANGLE_OPTIONS.width;
      const HEIGHT = RECTANGLE_OPTIONS.height;
      const inset = WIDTH * 0.2;

      const object = new fabric.Polygon(
        [
          { x: inset, y: 0 },
          { x: WIDTH - inset, y: 0 },
          { x: WIDTH, y: HEIGHT },
          { x: 0, y: HEIGHT },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addChevron: () => {
      const WIDTH = RECTANGLE_OPTIONS.width;
      const HEIGHT = RECTANGLE_OPTIONS.height;

      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH * 0.7, y: 0 },
          { x: WIDTH, y: HEIGHT * 0.5 },
          { x: WIDTH * 0.7, y: HEIGHT },
          { x: 0, y: HEIGHT },
          { x: WIDTH * 0.3, y: HEIGHT * 0.5 },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addRightAngleTriangle: () => {
      const WIDTH = TRIANGLE_OPTIONS.width;
      const HEIGHT = TRIANGLE_OPTIONS.height;

      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH, y: 0 },
          { x: 0, y: HEIGHT },
        ],
        {
          left: TRIANGLE_OPTIONS.left,
          top: TRIANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    // Stars & highlights
    addStar: () => {
      const R = RECTANGLE_OPTIONS.width / 2;
      const r = R * 0.45;
      const cx = R;
      const cy = R;
      const points: { x: number; y: number }[] = [];
      const spikes = 5;

      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? R : r;
        const angle = (Math.PI * i) / spikes - Math.PI / 2;
        points.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }

      const object = new fabric.Polygon(points, {
        left: RECTANGLE_OPTIONS.left,
        top: RECTANGLE_OPTIONS.top,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addStarOutline: () => {
      const R = RECTANGLE_OPTIONS.width / 2;
      const r = R * 0.45;
      const cx = R;
      const cy = R;
      const points: { x: number; y: number }[] = [];
      const spikes = 5;

      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? R : r;
        const angle = (Math.PI * i) / spikes - Math.PI / 2;
        points.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }

      const object = new fabric.Polygon(points, {
        left: RECTANGLE_OPTIONS.left,
        top: RECTANGLE_OPTIONS.top,
        fill: "transparent",
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      addToCanvas(object);
    },
    addBurstStar: () => {
      const R = RECTANGLE_OPTIONS.width / 2;
      const r = R * 0.55;
      const cx = R;
      const cy = R;
      const points: { x: number; y: number }[] = [];
      const spikes = 12;

      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? R : r;
        const angle = (Math.PI * i) / spikes - Math.PI / 2;
        points.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }

      const object = new fabric.Polygon(points, {
        left: RECTANGLE_OPTIONS.left,
        top: RECTANGLE_OPTIONS.top,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        strokeDashArray: strokeDashArray,
      });

      addToCanvas(object);
    },
    addSparkle: () => {
      const SIZE = RECTANGLE_OPTIONS.width;
      const cx = SIZE / 2;
      const cy = SIZE / 2;
      const arm = SIZE / 2;

      const object = new fabric.Polygon(
        [
          { x: cx, y: cy - arm },
          { x: cx + arm * 0.3, y: cy - arm * 0.3 },
          { x: cx + arm, y: cy },
          { x: cx + arm * 0.3, y: cy + arm * 0.3 },
          { x: cx, y: cy + arm },
          { x: cx - arm * 0.3, y: cy + arm * 0.3 },
          { x: cx - arm, y: cy },
          { x: cx - arm * 0.3, y: cy - arm * 0.3 },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    // Arrows
    addArrowRight: () => {
      const WIDTH = RECTANGLE_OPTIONS.width * 1.2;
      const HEIGHT = RECTANGLE_OPTIONS.height * 0.4;

      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH * 0.7, y: 0 },
          { x: WIDTH * 0.7, y: -HEIGHT },
          { x: WIDTH, y: HEIGHT * 0.5 },
          { x: WIDTH * 0.7, y: HEIGHT * 2 },
          { x: WIDTH * 0.7, y: HEIGHT },
          { x: 0, y: HEIGHT },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addArrowLeft: () => {
      const WIDTH = RECTANGLE_OPTIONS.width * 1.2;
      const HEIGHT = RECTANGLE_OPTIONS.height * 0.4;

      const object = new fabric.Polygon(
        [
          { x: WIDTH, y: 0 },
          { x: WIDTH * 0.3, y: 0 },
          { x: WIDTH * 0.3, y: -HEIGHT },
          { x: 0, y: HEIGHT * 0.5 },
          { x: WIDTH * 0.3, y: HEIGHT * 2 },
          { x: WIDTH * 0.3, y: HEIGHT },
          { x: WIDTH, y: HEIGHT },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addArrowUp: () => {
      const WIDTH = RECTANGLE_OPTIONS.width * 0.4;
      const HEIGHT = RECTANGLE_OPTIONS.height * 1.2;

      const object = new fabric.Polygon(
        [
          { x: 0, y: HEIGHT },
          { x: 0, y: HEIGHT * 0.3 },
          { x: -WIDTH, y: HEIGHT * 0.3 },
          { x: WIDTH * 0.5, y: 0 },
          { x: WIDTH * 2, y: HEIGHT * 0.3 },
          { x: WIDTH, y: HEIGHT * 0.3 },
          { x: WIDTH, y: HEIGHT },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addArrowDown: () => {
      const WIDTH = RECTANGLE_OPTIONS.width * 0.4;
      const HEIGHT = RECTANGLE_OPTIONS.height * 1.2;

      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: 0, y: HEIGHT * 0.7 },
          { x: -WIDTH, y: HEIGHT * 0.7 },
          { x: WIDTH * 0.5, y: HEIGHT },
          { x: WIDTH * 2, y: HEIGHT * 0.7 },
          { x: WIDTH, y: HEIGHT * 0.7 },
          { x: WIDTH, y: 0 },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    addArrowLeftRight: () => {
      const WIDTH = RECTANGLE_OPTIONS.width * 1.4;
      const HEIGHT = RECTANGLE_OPTIONS.height * 0.4;

      const object = new fabric.Polygon(
        [
          { x: 0, y: HEIGHT * 0.5 },
          { x: WIDTH * 0.2, y: 0 },
          { x: WIDTH * 0.2, y: HEIGHT * 0.35 },
          { x: WIDTH * 0.8, y: HEIGHT * 0.35 },
          { x: WIDTH * 0.8, y: 0 },
          { x: WIDTH, y: HEIGHT * 0.5 },
          { x: WIDTH * 0.8, y: HEIGHT },
          { x: WIDTH * 0.8, y: HEIGHT * 0.65 },
          { x: WIDTH * 0.2, y: HEIGHT * 0.65 },
          { x: WIDTH * 0.2, y: HEIGHT },
        ],
        {
          left: RECTANGLE_OPTIONS.left,
          top: RECTANGLE_OPTIONS.top,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDashArray: strokeDashArray,
        }
      );

      addToCanvas(object);
    },
    // Callouts & UI shapes
    addSpeechBubble: () => {
      const rect = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: 30,
        ry: 30,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      const tail = new fabric.Triangle({
        width: RECTANGLE_OPTIONS.width * 0.2,
        height: RECTANGLE_OPTIONS.height * 0.2,
        left: RECTANGLE_OPTIONS.left + RECTANGLE_OPTIONS.width * 0.2,
        top: RECTANGLE_OPTIONS.top + RECTANGLE_OPTIONS.height,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        angle: 180,
      });

      const group = new fabric.Group([rect, tail], {
        left: RECTANGLE_OPTIONS.left,
        top: RECTANGLE_OPTIONS.top,
      });

      addToCanvas(group);
    },
    addThoughtBubble: () => {
      const main = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      const small1 = new fabric.Circle({
        radius: CIRCLE_OPTIONS.radius * 0.35,
        left: CIRCLE_OPTIONS.left + CIRCLE_OPTIONS.radius * 1.4,
        top: CIRCLE_OPTIONS.top + CIRCLE_OPTIONS.radius * 0.8,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      const small2 = new fabric.Circle({
        radius: CIRCLE_OPTIONS.radius * 0.2,
        left: CIRCLE_OPTIONS.left + CIRCLE_OPTIONS.radius * 1.7,
        top: CIRCLE_OPTIONS.top + CIRCLE_OPTIONS.radius * 1.2,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      const group = new fabric.Group([main, small1, small2], {
        left: CIRCLE_OPTIONS.left,
        top: CIRCLE_OPTIONS.top,
      });

      addToCanvas(group);
    },
    addMapPin: () => {
      const R = CIRCLE_OPTIONS.radius;
      const circle = new fabric.Circle({
        radius: R,
        left: CIRCLE_OPTIONS.left,
        top: CIRCLE_OPTIONS.top,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      const pointer = new fabric.Triangle({
        width: R * 1.4,
        height: R * 1.6,
        left: CIRCLE_OPTIONS.left + R * 0.3,
        top: CIRCLE_OPTIONS.top + R * 1.2,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      const group = new fabric.Group([circle, pointer], {
        left: CIRCLE_OPTIONS.left,
        top: CIRCLE_OPTIONS.top,
      });

      addToCanvas(group);
    },
    addPlayButton: () => {
      const circle = new fabric.Circle({
        ...CIRCLE_OPTIONS,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });

      const tri = new fabric.Triangle({
        width: CIRCLE_OPTIONS.radius,
        height: CIRCLE_OPTIONS.radius * 1.2,
        left: CIRCLE_OPTIONS.left + CIRCLE_OPTIONS.radius * 0.4,
        top: CIRCLE_OPTIONS.top + CIRCLE_OPTIONS.radius * 0.3,
        fill: "white",
        stroke: "white",
        strokeWidth: strokeWidth,
        angle: 90,
      });

      const group = new fabric.Group([circle, tri], {
        left: CIRCLE_OPTIONS.left,
        top: CIRCLE_OPTIONS.top,
      });

      addToCanvas(group);
    },
    canvas,
    getActiveFontWeight: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return FONT_WEIGHT;
      }

      // @ts-ignore
      // Faulty TS library, fontWeight exists.
      const value = selectedObject.get("fontWeight") || FONT_WEIGHT;

      return value;
    },
    getActiveFontFamily: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return fontFamily;
      }

      // @ts-ignore
      // Faulty TS library, fontFamily exists.
      const value = selectedObject.get("fontFamily") || fontFamily;

      return value;
    },
    getActiveFillColor: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return fillColor;
      }

      const value = selectedObject.get("fill") || fillColor;

      // Currently, gradients & patterns are not supported
      return value as string;
    },
    getActiveStrokeColor: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return strokeColor;
      }

      const value = selectedObject.get("stroke") || strokeColor;

      return value;
    },
    getActiveStrokeWidth: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return strokeWidth;
      }

      const value = selectedObject.get("strokeWidth") || strokeWidth;

      return value;
    },
    getActiveStrokeDashArray: () => {
      const selectedObject = selectedObjects[0];

      if (!selectedObject) {
        return strokeDashArray;
      }

      const value = selectedObject.get("strokeDashArray") || strokeDashArray;

      return value;
    },
    selectedObjects,
  };
};

export const useEditor = ({
  defaultState,
  defaultHeight,
  defaultWidth,
  clearSelectionCallback,
  saveCallback,
}: EditorHookProps) => {
  const initialState = useRef(defaultState);
  const initialWidth = useRef(defaultWidth);
  const initialHeight = useRef(defaultHeight);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

  const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
  const [fillColor, setFillColor] = useState(FILL_COLOR);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
  const [strokeDashArray, setStrokeDashArray] = useState<number[]>(STROKE_DASH_ARRAY);

  useWindowEvents();

  const { 
    save, 
    canRedo, 
    canUndo, 
    undo, 
    redo,
    canvasHistory,
    setHistoryIndex,
  } = useHistory({ 
    canvas,
    saveCallback
  });

  const { copy, paste } = useClipboard({ canvas });

  const { autoZoom } = useAutoResize({
    canvas,
    container,
  });

  useCanvasEvents({
    save,
    canvas,
    setSelectedObjects,
    clearSelectionCallback,
  });

  useHotkeys({
    undo,
    redo,
    copy,
    paste,
    save,
    canvas,
  });

  useLoadState({
    canvas,
    autoZoom,
    initialState,
    canvasHistory,
    setHistoryIndex,
  });

  const editor = useMemo(() => {
    if (canvas) {
      return buildEditor({
        save,
        undo,
        redo,
        canUndo,
        canRedo,
        autoZoom,
        copy,
        paste,
        canvas,
        fillColor,
        strokeWidth,
        strokeColor,
        setFillColor,
        setStrokeColor,
        setStrokeWidth,
        strokeDashArray,
        selectedObjects,
        setStrokeDashArray,
        fontFamily,
        setFontFamily,
      });
    }

    return undefined;
  }, 
  [
    canRedo,
    canUndo,
    undo,
    redo,
    save,
    autoZoom,
    copy,
    paste,
    canvas,
    fillColor,
    strokeWidth,
    strokeColor,
    selectedObjects,
    strokeDashArray,
    fontFamily,
  ]);

  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#3b82f6",
        borderScaleFactor: 1.5,
        transparentCorners: false,
        borderOpacityWhenMoving: 1,
        cornerStrokeColor: "#3b82f6",
      });

      const initialWorkspace = new fabric.Rect({
        width: initialWidth.current,
        height: initialHeight.current,
        name: "clip",
        fill: "white",
        selectable: false,
        hasControls: false,
        shadow: new fabric.Shadow({
          color: "rgba(0,0,0,0.8)",
          blur: 5,
        }),
      });

      initialCanvas.setWidth(initialContainer.offsetWidth);
      initialCanvas.setHeight(initialContainer.offsetHeight);

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);
      initialCanvas.clipPath = initialWorkspace;
      initialCanvas.renderAll();

      setCanvas(initialCanvas);
      setContainer(initialContainer);

      const currentState = JSON.stringify(
        initialCanvas.toJSON(JSON_KEYS)
      );
      canvasHistory.current = [currentState];
      setHistoryIndex(0);
    },
    [
      canvasHistory, // No need, this is from useRef
      setHistoryIndex, // No need, this is from useState
    ]
  );

  return { init, editor };
};

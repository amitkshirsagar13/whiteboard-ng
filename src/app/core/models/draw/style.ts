export class Style {
  constructor(strokeStyle: string | CanvasGradient | CanvasPattern) {
    this.strokeStyle = strokeStyle;
  }
  strokeStyle: string | CanvasGradient | CanvasPattern;
  color: string;
  fillStyle: string;
  lineWidth: number;
  lineCap: string;
}

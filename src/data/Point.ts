export class Point {
    x: number;
    y: number;
    onCurve: boolean;
    endOfContour: boolean;
    touched: boolean = false;
  
    constructor(x: number, y: number, onCurve: boolean = true, endOfContour: boolean = false) {
      this.x = x;
      this.y = y;
      this.onCurve = onCurve;
      this.endOfContour = endOfContour;
    }

  }
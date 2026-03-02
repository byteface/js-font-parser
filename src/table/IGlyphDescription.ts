export interface IGlyphDescription {
	getEndPtOfContours(i: number): number;
	getFlags(i: number): number;
	getXCoordinate(i: number): number;
	getYCoordinate(i: number): number;
	getXMaximum(): number;
	getXMinimum(): number;
	getYMaximum(): number;
	getYMinimum(): number;
	isComposite(): boolean;
	getPointCount(): number;
	getContourCount(): number;
	resolve(): void;

	// Uncomment these if needed
	// getComponentIndex(c: number): number;
	// getComponentCount(): number;
  }

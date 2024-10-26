// com/byteface/font/utils/Color.ts

export class Color {

	private range: string[];
  
	constructor() {
		// set black and white as defaults
		this.range = ['#000000', '#ffffff'];
	}
  
	// returns a completely random color
	static rndColor(): string {
		return '#' + ('00000' + ((Math.random() * 16777216) << 0).toString(16)).slice(-6);
	}
  
	// returns a random color from the range you set
	rndColorFromPalette(): string {
		const index = Math.floor(Math.random() * this.range.length);
		return this.range[index];
	}
  
	setPalette(array: string[]): void {
		this.range = array;
	}
  }
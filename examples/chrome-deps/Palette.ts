import chroma from "chroma-js";

export class Palette {
  private colorMap: Map<string, { index: number; count: number }>;
  private currentIndex: number;

  constructor(initialColors: string[] = []) {
    this.currentIndex = 0;
    this.colorMap = new Map(initialColors.map((color, index) => [color, { index: index, count: 0 }]));
    this.currentIndex = this.colorMap.size;
  }

  addColor(color: string): string {
    if (this.colorMap.has(color)) {
      const colorInfo = this.colorMap.get(color);
      if (colorInfo) {
        colorInfo.count += 1;
        this.colorMap.set(color, colorInfo);
      }
    } else {
      // this.currentIndex = mainPalette.length % this.currentIndex;
      this.currentIndex = this.currentIndex % mainPalette.length;
      this.colorMap.set(color, { index: this.currentIndex, count: 1 });
      this.currentIndex++;
    }
    return this.getColor(color);
  }

  getColor(color: string): string {
    if (!this.colorMap.has(color)) {
      return "#000";
    }
    return mainPalette[this.colorMap.get(color).index];
  }

  getTotalColors(): number {
    return this.colorMap.size;
  }

  getColorUsageHistogram(): Map<string, number> {
    const histogram = new Map<string, number>();
    this.colorMap.forEach((value, key) => {
      histogram.set(key, value.count);
    });
    return histogram;
  }
}

export const palette = new Palette(["CursorKind.TRANSLATION_UNIT", "CursorKind.NAMESPACE", "NOT_PARSED"]);

export const mainPalette = [
  "#444",
  "#444",
  "#555",
  "#6b59a4",
  "#7572ae",
  "#808ab8",
  "#8aa3c1",
  "#98bcc8",
  "#c5ba9d",
  "#b4a084",
  "#a2876e",
  "#8d705a",
  "#745c49",
];

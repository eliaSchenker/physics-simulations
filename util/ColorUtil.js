/**
 * © 2021 Elia Schenker
 */
class ColorUtil {
    /**
     * Interpolates between two colors (source: https://bl.ocks.org/espetro/bd7555f4363af4f5a81bb324eae76912)
     * @param {Array} color1 First color
     * @param {Array} color2 Second color
     * @param {Number} factor Factor
     * @returns Interpolated color
     */
    static interpolateColor(color1, color2, factor) {
        if (arguments.length < 3) { factor = 0.5; }
        var result = color1.slice();
        for (var i=0;i<3;i++) {
          result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
        }
        return result;
      };


    /** Color conversion (source: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb) */
    
    static componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    static rgbToHex(r, g, b) {
        return "#" + ColorUtil.componentToHex(r) + ColorUtil.componentToHex(g) + ColorUtil.componentToHex(b);
    }

    static hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
    }
}
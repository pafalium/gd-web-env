
import {Color} from 'three';

function randomColor() {
  const c = new Color();
  c.setHSL(Math.random(), 0.8, 0.5);
  return c;
}
function colorByHSL(hue, saturation, lightness) {
 const c = new Color();
  c.setHSL(hue, saturation, lightness);
  return c; 
}
const color = {};
color.random = randomColor;
color.hsl = colorByHSL;


export default color;

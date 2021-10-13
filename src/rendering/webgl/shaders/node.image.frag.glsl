precision mediump float;

varying vec4 v_color;
varying float v_border;
varying vec4 v_texture;

uniform sampler2D u_atlas;

const float radius = 0.5;

void main(void) {
//  gl_FragColor = texture2D(u_atlas, v_texture.xy + gl_PointCoord * v_texture.zw);

  vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);
  vec4 color;

  if (v_texture.w > 0.0) {
    vec4 texel = texture2D(u_atlas, v_texture.xy + gl_PointCoord * v_texture.zw);
    color = mix(v_color, texel, texel.a);
  } else {
    color = v_color;
  }

  vec2 m = gl_PointCoord - vec2(0.5, 0.5);
  float dist = length(m);

  if (dist < radius - v_border) {
    gl_FragColor = color;
  } else if (dist < radius) {
    gl_FragColor = mix(transparent, color, (radius - dist) / v_border);
  } else {
    gl_FragColor = transparent;
  }
}

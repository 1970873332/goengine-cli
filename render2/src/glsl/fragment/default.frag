#version 300 es

precision mediump float;

//材质颜色
uniform vec3 u_color;
//材质透明度
uniform float u_opacity;
//贴图
uniform sampler2D u_map;

//纹理坐标
in vec2 v_uv;

//颜色输出
out vec4 outColor;
void main() {
    outColor = texture(u_map, v_uv) * vec4(u_color, u_opacity);
}

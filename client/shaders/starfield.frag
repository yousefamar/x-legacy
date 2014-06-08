#ifdef GL_ES
precision highp float;
#endif

#define PI_2	1.5707963267948966192313216916398
#define PI2		6.2831853071795864769252867665590

//uniform mat4 modelViewMatrix;

uniform float time;

//varying vec4 worldCoord;

uniform sampler2D starMap;
varying vec2 skyUV;
//varying vec2 angles;

/*
float lerp(float x0, float x1, float mu) {
	return x0+(x1-x0)*mu;
}
*/

const vec3 BLACK		= vec3(0.0, 0.0, 0.0);
const vec3 WHITE		= vec3(1.0, 1.0, 1.0);
const vec3 SKY_BLUE		= vec3(0.5, 0.8, 1.0);
const vec3 DARK_BLUE	= vec3(0.0, 0.0, 0.5);
const vec3 BLACK_BLUE	= vec3(0.0, 0.0, 0.1);
const vec3 DARK_ORANGE	= vec3(0.75, 0.4, 0.0);

vec4 calcSkyCol() {
	// TODO: See if blending night with transitions is worth the extra processing power.
	vec3 col;
	if (time < 0.1) {
		col = mix(mix(DARK_ORANGE, DARK_BLUE, skyUV.y), mix(WHITE, SKY_BLUE, skyUV.y), 10.0*time);
		col *= 0.5 * min(max(-cos(skyUV.x*PI2), 0.0) * cos(skyUV.y*PI_2) + sin(10.0*time*PI_2), 1.0) + 0.5;
	} else if (time < 0.4) {
		col = mix(WHITE, SKY_BLUE, skyUV.y);
	} else if (time < 0.5) {
		col = mix(mix(WHITE, SKY_BLUE, skyUV.y), mix(DARK_ORANGE, DARK_BLUE, skyUV.y), 10.0*time-4.0);
		col *= 0.5 * min(max(cos(skyUV.x*PI2), 0.0) * cos(skyUV.y*PI_2) + cos((10.0*time-4.0)*PI_2), 1.0) + 0.5;
	} else if (time < 0.6) {
		col = mix(mix(DARK_ORANGE, DARK_BLUE, skyUV.y), mix(BLACK_BLUE, BLACK, skyUV.y), 10.0*time-5.0);
		col *= 0.5 * min(max(cos(skyUV.x*PI2), 0.0) * cos(skyUV.y*PI_2) + sin((10.0*time-5.0)*PI_2), 1.0) + 0.5;
	} else if (time < 0.9) {
		col = mix(BLACK_BLUE, BLACK, skyUV.y);
	} else {
		col = mix(mix(BLACK_BLUE, BLACK, skyUV.y), mix(DARK_ORANGE, DARK_BLUE, skyUV.y), 10.0*time-9.0);
		col *= 0.5 * min(max(-cos(skyUV.x*PI2), 0.0) * cos(skyUV.y*PI_2) + cos((10.0*time-9.0)*PI_2), 1.0) + 0.5;
	}

	return vec4(col, 1.0);
}

void main() {
	gl_FragColor = calcSkyCol();
}
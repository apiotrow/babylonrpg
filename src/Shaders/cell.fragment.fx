precision highp float;uniform vec3 vEyePosition;uniform vec4 vDiffuseColor;varying vec3 vPositionW;#ifdef NORMALvarying vec3 vNormalW;#endif#ifdef VERTEXCOLORvarying vec4 vColor;#endif#include<__decl__lightFragment>[0..maxSimultaneousLights]#include<lightsFragmentFunctions>#include<shadowsFragmentFunctions>#ifdef DIFFUSEvarying vec2 vDiffuseUV;uniform sampler2D diffuseSampler;uniform vec2 vDiffuseInfos;#endif#include<clipPlaneFragmentDeclaration>#include<fogFragmentDeclaration>vec3 computeCustomDiffuseLighting(lightingInfo info,vec3 diffuseBase,float shadow){diffuseBase=info.diffuse*shadow;#ifdef CELLBASICfloat level=1.0;if (info.ndl<0.5)level=0.5;diffuseBase.rgb*vec3(level,level,level);#elsefloat ToonThresholds[4];ToonThresholds[0]=0.95;ToonThresholds[1]=0.5;ToonThresholds[2]=0.2;ToonThresholds[3]=0.03;float ToonBrightnessLevels[5];ToonBrightnessLevels[0]=1.0;ToonBrightnessLevels[1]=0.8;ToonBrightnessLevels[2]=0.6;ToonBrightnessLevels[3]=0.35;ToonBrightnessLevels[4]=0.2;if (info.ndl>ToonThresholds[0]){diffuseBase.rgb*=ToonBrightnessLevels[0];}else if (info.ndl>ToonThresholds[1]){diffuseBase.rgb*=ToonBrightnessLevels[1];}else if (info.ndl>ToonThresholds[2]){diffuseBase.rgb*=ToonBrightnessLevels[2];}else if (info.ndl>ToonThresholds[3]){diffuseBase.rgb*=ToonBrightnessLevels[3];}else{diffuseBase.rgb*=ToonBrightnessLevels[4];}#endifreturn max(diffuseBase,vec3(0.2));}void main(void){#include<clipPlaneFragment>vec3 viewDirectionW=normalize(vEyePosition-vPositionW);vec4 baseColor=vec4(1.,1.,1.,1.);vec3 diffuseColor=vDiffuseColor.rgb;float alpha=vDiffuseColor.a;#ifdef DIFFUSEbaseColor=texture2D(diffuseSampler,vDiffuseUV);#ifdef ALPHATESTif (baseColor.a<0.4)discard;#endifbaseColor.rgb*=vDiffuseInfos.y;#endif#ifdef VERTEXCOLORbaseColor.rgb*=vColor.rgb;#endif#ifdef NORMALvec3 normalW=normalize(vNormalW);#elsevec3 normalW=vec3(1.0,1.0,1.0);#endiflightingInfo info;vec3 diffuseBase=vec3(0.,0.,0.);float shadow=1.;float glossiness=0.;#ifdef SPECULARTERMvec3 specularBase=vec3(0.,0.,0.);#endif #include<lightFragment>[0..maxSimultaneousLights]#ifdef VERTEXALPHAalpha*=vColor.a;#endifvec3 finalDiffuse=clamp(diffuseBase*diffuseColor,0.0,1.0)*baseColor.rgb;;vec4 color=vec4(finalDiffuse,alpha);#include<fogFragment>gl_FragColor=color;}
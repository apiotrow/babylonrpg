document.addEventListener('DOMContentLoaded', function () {
	// var BABYLON = require('babylonjs')
	// var BABYLON = require('./node_modules/babylonjs/dist/preview release/babylon.max.js')
	var test = require('./js/test.js')
	// var CellMaterial = require('./assets/babylon.cellMaterial.js')

	

	// var assetnames = []
	// for(var i in assets){
	// 	assetnames.push(i)
	// }

	// var promises = []
	// var assetmeshes = {}
	// for(var i = 0; i < assetnames.length; i++){
		// promises.push(
		// 	new Promise(function(resolve, reject) {
		// 		var file = assetnames[i];
		// 		new THREE.CTMLoader().load(file, (geometry)=> {
		// 			var material = new THREE.MeshPhongMaterial({
		// 	        	wireframe: false, 
		// 	        	shading: THREE.FlatShading, 
		// 	        	vertexColors: THREE.VertexColors,
		// 	        	shininess: 0
		// 	        });

		// 	        geometry.computeFaceNormals();
		// 	        geometry.computeVertexNormals();

		// 	        var obj = new THREE.Mesh(geometry, material);

		// 	        pokemde.rotateLocal(obj, -90, 0, 0)

		// 	        file = file.replace("assets/","")
		// 			assetmeshes[file] = obj
		// 			resolve();
		// 		})
		// 	})
		// )
	// }
	// Promise.all(promises).then(function(){
		var canvas = document.getElementById("game")
		var engine = new BABYLON.Engine(canvas, true)
		engine.enableOfflineSupport = false //prevent babylon.manifest error
		var scene = new BABYLON.Scene(engine)


		// BABYLON.Effect.ShadersStore["customVertexShader"]=               
		// "precision highp float;\r\n"+

  //               "// Attributes\r\n"+
  //               "attribute vec3 position;\r\n"+
  //               "attribute vec3 normal;\r\n"+
  //               "attribute vec2 uv;\r\n"+

  //               "// Uniforms\r\n"+
  //               "uniform mat4 world;\r\n"+
  //               "uniform mat4 worldViewProjection;\r\n"+

  //               "// Varying\r\n"+
  //               "varying vec3 vPositionW;\r\n"+
  //               "varying vec3 vNormalW;\r\n"+
  //               "varying vec2 vUV;\r\n"+

  //               "void main(void) {\r\n"+
  //               "    vec4 outPosition = worldViewProjection * vec4(position, 1.0);\r\n"+
  //               "    gl_Position = outPosition;\r\n"+
  //               "    \r\n"+
  //               "    vPositionW = vec3(world * vec4(position, 1.0));\r\n"+
  //               "    vNormalW = normalize(vec3(world * vec4(normal, 0.0)));\r\n"+
  //               "    \r\n"+
  //               "    vUV = uv;\r\n"+
  //               "}\r\n";

  //               BABYLON.Effect.ShadersStore["customFragmentShader"]=                
  //               "precision highp float;\r\n"+

  //               "// Lights\r\n"+
  //               "varying vec3 vPositionW;\r\n"+
  //               "varying vec3 vNormalW;\r\n"+
  //               "varying vec2 vUV;\r\n"+

  //               "// Refs\r\n"+
  //               "uniform vec4 _Color;"+
		// 		"uniform float _Brightness;"+
  //               "uniform sampler2D textureSampler;\r\n"+

  //               "void main(void) {\r\n"+
  //               "    float ToonThresholds[4];\r\n"+
  //               "    ToonThresholds[0] = 0.95;\r\n"+
  //               "    ToonThresholds[1] = 0.5;\r\n"+
  //               "    ToonThresholds[2] = 0.2;\r\n"+
  //               "    ToonThresholds[3] = 0.03;\r\n"+
  //               "    \r\n"+
  //               "    float ToonBrightnessLevels[5];\r\n"+
  //               "    ToonBrightnessLevels[0] = 1.0;\r\n"+
  //               "    ToonBrightnessLevels[1] = 0.8;\r\n"+
  //               "    ToonBrightnessLevels[2] = 0.6;\r\n"+
  //               "    ToonBrightnessLevels[3] = 0.35;\r\n"+
  //               "    ToonBrightnessLevels[4] = 0.2;\r\n"+
  //               "    \r\n"+
  //               "    vec3 vLightPosition = vec3(0,20,10);\r\n"+
  //               "    \r\n"+
  //               "    // Light\r\n"+
  //               "    vec3 lightVectorW = normalize(vLightPosition - vPositionW);\r\n"+
  //               "    \r\n"+
  //               "    // diffuse\r\n"+
  //               "    float ndl = max(0., dot(vNormalW, lightVectorW));\r\n"+
  //               "    \r\n"+
  //               "    vec3 color = texture2D(textureSampler, vUV).rgb;\r\n"+
  //               "    \r\n"+
  //               "    if (ndl > ToonThresholds[0])\r\n"+
  //               "    {\r\n"+
  //               "        color *= ToonBrightnessLevels[0];\r\n"+
  //               "    }\r\n"+
  //               "    else if (ndl > ToonThresholds[1])\r\n"+
  //               "    {\r\n"+
  //               "        color *= ToonBrightnessLevels[1];\r\n"+
  //               "    }\r\n"+
  //               "    else if (ndl > ToonThresholds[2])\r\n"+
  //               "    {\r\n"+
  //               "        color *= ToonBrightnessLevels[2];\r\n"+
  //               "    }\r\n"+
  //               "    else if (ndl > ToonThresholds[3])\r\n"+
  //               "    {\r\n"+
  //               "        color *= ToonBrightnessLevels[3];\r\n"+
  //               "    }\r\n"+
  //               "    else\r\n"+
  //               "    {\r\n"+
  //               "        color *= ToonBrightnessLevels[4];\r\n"+
  //               "    }\r\n"+
  //               "    \r\n"+
  //               "    gl_FragColor = vec4(color, 1.);\r\n"+
  //               "}\r\n";

		var assetsManager = new BABYLON.AssetsManager(scene)
		assetsManager.useDefaultLoadingScreen = false
		var meshTask = assetsManager.addMeshTask("skulltask", "", "./assets/", "bugsports.babylon")
		meshTask.onSuccess = function (task) {
			// var shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, {
		 //        vertex: "custom",
		 //        fragment: "custom",
			//     },
		 //        {
			// 		attributes: ["position", "normal", "uv"],
			// 		uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
	  //      		})
	        // var mainTexture = new BABYLON.Texture("./assets/3dd.jpg", scene)
	        // shaderMaterial.setTexture("textureSampler", mainTexture)

			var materialSphere1 = new BABYLON.StandardMaterial("texture1", scene)
			materialSphere1.specularPower = 99
			// materialSphere1.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7)

			// console.log(BABYLON.CellMaterial)

			// var knot = BABYLON.Mesh.CreateTorusKnot("knot", 2, 0.5, 128, 64, 2, 3, scene)
			var cell = new BABYLON.CellMaterial("cell", scene)
			
			cell.diffuseTexture = new BABYLON.Texture("./assets/3dd.jpg", scene)
			cell.computeHighLevel = true
			cell.diffuseTexture.uScale = cell.diffuseTexture.vScale = 3;

			// cell.pointsCloud = true
			// cell.pointSize = 50
			// cell.wireframe = true

			//set root object position`
			task.loadedMeshes[0].position = BABYLON.Vector3.Zero();

			for(let i = 0; i < task.loadedMeshes.length; i ++){
				// task.loadedMeshes[i].useVertexColors = true
				task.loadedMeshes[i].material = cell

				// task.loadedMeshes[i].outlineWidth = 0.15
				// task.loadedMeshes[i].outlineColor = new BABYLON.Color4(0, 0, 0, 1)
				// task.loadedMeshes[i].renderOutline = true
				
				// task.loadedMeshes[i].enableEdgesRendering()
				// task.loadedMeshes[i].edgesWidth = 30.0;
				// task.loadedMeshes[i].edgesColor = new BABYLON.Color4(0, 0, 0, 1)

				task.loadedMeshes[i].convertToFlatShadedMesh()
			}

			let d = 10
			let spacing = 150
			for(let i = 0; i < d; i++){
    			for(let j = 0; j < d; j++){
    				var newInstance = task.loadedMeshes[0].createInstance("index: " + i + "" + j)
    				newInstance.position.x =+ i * spacing
    				newInstance.position.z =+ j * spacing

    	// 			newInstance.enableEdgesRendering()
				 //   	newInstance.edgesWidth = 30.0;
					// newInstance.edgesColor = new BABYLON.Color4(0, 0, 0, 1)
    			}
			}
		}

		var textureTask = assetsManager.addTextureTask("imagetask", "./assets/dd.jpg");
		assetsManager.load()

		var test
		assetsManager.onFinish = function(tasks) {
         	test = new test(engine, canvas, scene, tasks)
     	}


		

		
	// })

})
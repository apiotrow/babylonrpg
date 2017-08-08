var BABYLON = require('babylonjs')
let perlin = require('perlin-noise')
class test{
	constructor(engine, canvas, scene, tasks){
		// let model = task.loadedMeshes[0]

		this.scene = scene
		this.tasks = tasks

		let keyCodes = {
			S: 83,
			A: 65,
			W: 87,
			D: 68
		}

		scene.clearColor = new BABYLON.Color3(0, 0, 0)
		// BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.LowDegradationAllowed())
		var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(100, 200, -100), scene)
		camera.target = new BABYLON.Vector3(150, 150, 150)
		// camera.inputs.add(new BABYLON.FreeCameraKeyboardMoveInput())
		
		// camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		// camera.orthoTop = 50;
		// camera.orthoBottom = -50;
		// camera.orthoLeft = -50;
		// camera.orthoRight = 50
		

		// var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
		// var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene)
		// skyboxMaterial.backFaceCulling = false;
		// // skyboxMaterial.disableLighting = true;
		// // skybox.infiniteDistance = true;
		// // skyboxMaterial.disableLighting = true;
		// skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/skyboxes/TropicalSunnyDay/TropicalSunnyDay", scene);
		// skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
		// skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
		// skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
		// skybox.material = skyboxMaterial;
		
		this.keyState = {}
		var onKeyDown = (evt)=> {
			this.keyState[evt.key] = true

	    }
	    var onKeyUp = (evt)=> {
	    	this.keyState[evt.key] = false

	    }
	    BABYLON.Tools.RegisterTopRootEvents([{
	        name: "keydown",
	        handler: onKeyDown
	    }, {
	        name: "keyup",
	        handler: onKeyUp
	    }])

		camera.inputs.attached.keyboard.keysDown.push(keyCodes.S)
		camera.inputs.attached.keyboard.keysUp.push(keyCodes.W)
		camera.inputs.attached.keyboard.keysLeft.push(keyCodes.A)
		camera.inputs.attached.keyboard.keysRight.push(keyCodes.D)

	    camera.setTarget(BABYLON.Vector3.Zero())
	    camera.attachControl(canvas, false)

	    // var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene)
	    var light = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(.2, -1, .5), scene)
	    var light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(-.8, -1, -.2), scene)
	    light.intensity = 2
	    light2.intensity = 1

	    // var sphere = BABYLON.Mesh.CreateCylinder("box", 4.0, 2.0, 2.0, 0, 0,
	    // 	scene, false, BABYLON.Mesh.DEFAULTSIDE)
	    // sphere.position.y = 1
	    // let vec = new BABYLON.Vector3(3, 3, 3)
	    // sphere.lookAt(vec)


	    // var ground = BABYLON.Mesh.CreateGround("ground1", 6, 6, 2, scene)

		engine.runRenderLoop( ()=> {
			this.update()
		})

		window.addEventListener("resize", function () {
		    engine.resize()
		})

		// console.log(this.tasks[0].loadedMeshes[0].animations)

		// for(let i = 0; this.tasks[0].loadedMeshes.length; i++){
		// 	scene.beginAnimation(this.tasks[0].loadedMeshes[i], 0, 10, 1, 1.0)
		// }
		// console.log(scene.beginAnimation(this.tasks[0].loadedMeshes[0], 0, 10, 1, 1.0))
		
		var cell = new BABYLON.CellMaterial("cell", scene)
			
		cell.diffuseTexture = new BABYLON.Texture("./assets/3dd.jpg", scene)
		cell.computeHighLevel = true
		cell.diffuseTexture.uScale = cell.diffuseTexture.vScale = 3

		console.log(tasks)

		let meshes = {}
		for(let i = 0; i < tasks.length; i++){
			let meshName = tasks[i].name
			let mesh = tasks[i].loadedMeshes[0]

			meshes[meshName] = mesh
		}

		console.log(meshes)


		let d = 50
		let spacing = 15
		for(let i in meshes){
			let mesh = meshes[i]
			// task.loadedMeshes[i].useVertexColors = true
			mesh.material = cell

			mesh.convertToFlatShadedMesh()
			mesh.position.x = Math.floor(Math.random() * d) * spacing
			mesh.position.z = Math.floor(Math.random() * d) * spacing
			mesh.position.y = 1
		}

		
		
		const h = perlin.generatePerlinNoise(d, d)
		for(let i = 0; i < d * d; i++){
			var newInstance 

			if(h[i] < 0.5)
				newInstance = meshes.grass.createInstance("index: " + i)
			else
				newInstance = meshes.tree.createInstance("index: " + i)

			//column
			newInstance.position.x = (i % d) * spacing

			//row
			newInstance.position.z = (Math.floor(i / d) * spacing)
			newInstance.position.y = 0
		}

		// for(let i = 0; i < d; i++){
		// 	for(let j = 0; j < d; j++){
		// 		var newInstance 

		// 		if(h[i] < 0.4)
		// 			newInstance = meshes.grass.createInstance("index: " + i + "" + j)
		// 		else
		// 			newInstance = meshes.tree.createInstance("index: " + i + "" + j)

				
		// 		newInstance.position.x =+ i * spacing
		// 		newInstance.position.z =+ j * spacing

		// 		// newInstance.enableEdgesRendering()
		// 	 //   	newInstance.edgesWidth = 30.0;
		// 		// newInstance.edgesColor = new BABYLON.Color4(0, 0, 0, 1)
		// 	}
		// }
	}

	update(){
		this.scene.render()

		if(this.keyState['r'] == true){
			// this.tasks[0].loadedMeshes[0].rotation.y += 0.05
		}
	}
}

module.exports = test
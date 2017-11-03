var BABYLON = require('babylonjs')
let perlin = require('perlin-noise')

class test{
	constructor(engine, canvas, scene, tasks){
		this.scene = scene
		this.tasks = tasks

		let keyCodes = {
			S: 83,
			A: 65,
			W: 87,
			D: 68
		}

		this.player

		scene.clearColor = new BABYLON.Color3(153 / 255, 204 / 255, 255 / 255)
		// BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.LowDegradationAllowed())
		// var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(100, 100, -100), scene)
		var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene)
		console.log(camera)
		camera.inputs.attached.keyboard.detachControl()
		// camera.inputs.attached.keyboard.keysUp = []
		// camera.inputs.attached.keyboard.keysDown= []
		// console.log(camera.inputs)

		// camera.inputs.attached.keyboard.keysDown.push(keyCodes.S)
		// camera.inputs.attached.keyboard.keysUp.push(keyCodes.W)
		// camera.inputs.attached.keyboard.keysLeft.push(keyCodes.A)
		// camera.inputs.attached.keyboard.keysRight.push(keyCodes.D)

	 //    camera.setTarget(BABYLON.Vector3.Zero())
	    camera.attachControl(canvas, false)

		this.camera = camera
		// camera.target = new BABYLON.Vector3(150, 150, 150)
		// camera.inputs.add(new BABYLON.FreeCameraKeyboardMoveInput())
		
		// let orthoSize = 100
		// camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		// camera.orthoTop = orthoSize;
		// camera.orthoBottom = -orthoSize;
		// camera.orthoLeft = -orthoSize;
		// camera.orthoRight = orthoSize
		

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


	    let angles = 0.15
	    var light5 = new BABYLON.HemisphericLight("light3", 
	    	new BABYLON.Vector3(-angles, 1, -angles / 2), scene)
	    light5.intensity = 1.5

		engine.runRenderLoop( ()=> {
			this.update()
		})

		window.addEventListener("resize", function () {
		    engine.resize()
		})

		var cell = new BABYLON.StandardMaterial("cell", scene)
		cell.specularColor = BABYLON.Color3.Black()

		this.meshes = {}
		for(let i = 0; i < tasks.length; i++){
			let meshName = tasks[i].name
			let mesh = tasks[i].loadedMeshes[0]

			this.meshes[meshName] = mesh
		}

		let d = 30
		let spacing = 15
		this.rotateMeshes = []
		
		for(let i in this.meshes){
			let mesh = this.meshes[i]

			mesh.material = cell
			mesh.convertToFlatShadedMesh()

			mesh.useVertexColors = true
			mesh.outlineWidth = 0.15
			mesh.outlineColor = new BABYLON.Color4(0, 0, 0, 1)
			mesh.renderOutline = true

			if(mesh.name == "tree" || mesh.name == "grass"
				|| mesh.name == "water")
			{
				mesh.position.y = 1000
				continue
			}
			else if(mesh.name == "chad.mc"){
				 this.player = mesh
			}

			mesh.position.x = Math.floor(Math.random() * d) * spacing
			mesh.position.z = Math.floor(Math.random() * d) * spacing
			mesh.position.y = 1

			this.rotateMeshes.push(mesh)
		}

		console.log(this.rotateMeshes)

		
		let groundArr = []
		const h = perlin.generatePerlinNoise(d, d)
		this.changeMeshes = []
		for(let i = 0; i < d * d; i++){
			var newInstance 

			if(h[i] < 0.5){
				newInstance = this.meshes.grass.createInstance("index: " + i)
				// newInstance = this.meshes.grass.clone("index: " + i)
			}
			else if(h[i] < 0.7){
				newInstance = this.meshes.tree.createInstance("index: " + i)
				// newInstance = this.meshes.tree.clone("index: " + i)
			}else {
				newInstance = this.meshes.water.createInstance("index: " + i)
				// newInstance = this.meshes.tree.clone("index: " + i)
			}

			//column
			newInstance.position.x = (i % d) * spacing

			//row
			newInstance.position.z = (Math.floor(i / d) * spacing)
			newInstance.position.y = 0

			groundArr.push(newInstance)

			this.changeMeshes.push(newInstance)
		}
	}

	update(){
		this.scene.render()

		if(this.keyState['r'] == true){
			// console.log(this.camera.target)
			this.camera.position.z += 1
			// let z = this.camera.target.z
			// z += 1
			// this.camera.target = new BABYLON.Vector3(
			// 	this.camera.target.x, this.camera.target.y, z)
			// this.tasks[0].loadedMeshes[0].rotation.y += 0.05
			
			this.changeMeshes[Math.floor(Math.random() * this.changeMeshes.length)] 
			= this.meshes.tree.createInstance(Math.random())
		}

		for(let mesh in this.rotateMeshes){
			// console.log(this.rotateMeshes[mesh])
			// this.rotateMeshes[mesh].rotation.y += 0.01
			
			// this.rotateMeshes[mesh].dispose()
			// this.rotateMeshes[mesh] = this.meshes.tree.clone()
			// this.rotateMeshes[mesh].position.y = Math.random() * 100
		}

		if(this.player !== undefined)
			this.camera.setTarget(this.player.position)
		if(this.keyState['w'] == true){
			this.player.position.x += 1
		}
	}
}

module.exports = test
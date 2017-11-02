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

		scene.clearColor = new BABYLON.Color3(153 / 255, 204 / 255, 255 / 255)
		// BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.LowDegradationAllowed())
		var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(100, 100, -100), scene)

		this.camera = camera
		camera.target = new BABYLON.Vector3(150, 150, 150)
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

		camera.inputs.attached.keyboard.keysDown.push(keyCodes.S)
		camera.inputs.attached.keyboard.keysUp.push(keyCodes.W)
		camera.inputs.attached.keyboard.keysLeft.push(keyCodes.A)
		camera.inputs.attached.keyboard.keysRight.push(keyCodes.D)

	    camera.setTarget(BABYLON.Vector3.Zero())
	    camera.attachControl(canvas, false)

	    let angles = 0.15
	    let yAngles = 1
	    let lightLevel = 0.3

	    // var light = new BABYLON.HemisphericLight("light1", 
	    // 	new BABYLON.Vector3(angles, yAngles, angles), scene)
	    // light.intensity = lightLevel

	    // var light2 = new BABYLON.HemisphericLight("light2", 
	    // 	new BABYLON.Vector3(-angles, yAngles, -angles), scene)
	    // light2.intensity = lightLevel

	    // var light3 = new BABYLON.HemisphericLight("light3", 
	    // 	new BABYLON.Vector3(angles, yAngles, -angles), scene)
	    // light3.intensity = lightLevel

	    // var light4 = new BABYLON.HemisphericLight("light3", 
	    // 	new BABYLON.Vector3(-angles, yAngles, angles), scene)
	    // light4.intensity = lightLevel

	    var light5 = new BABYLON.HemisphericLight("light3", 
	    	new BABYLON.Vector3(-angles, 1, -angles / 2), scene)
	    light5.intensity = 1.5

	    
	    // let NWlight = new BABYLON.DirectionalLight("NWlight", 
	    // 	new BABYLON.Vector3(angles, -1, angles), scene)
	    // NWlight.intensity = 3
	    // let SWlight = new BABYLON.DirectionalLight("SWlight", 
	    // 	new BABYLON.Vector3(-angles, -yAngles, -angles), scene)
	    // SWlight.intensity = 1
	    // let SElight = new BABYLON.DirectionalLight("SElight", 
	    // 	new BABYLON.Vector3(-angles, -yAngles, -angles), scene)
	    // SElight.intensity = 0.5
	    // let NElight = new BABYLON.DirectionalLight("NElight", 
	    // 	new BABYLON.Vector3(angles/3, -yAngles, angles/3), scene)
	    // NElight.intensity = 0.2

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
		
		// var cell = new BABYLON.CellMaterial("cell", scene)
		var cell = new BABYLON.StandardMaterial("cell", scene)
		// cell.specularPower = 1
		// cell.useEmissiveAsIllumination = false
		cell.specularColor = BABYLON.Color3.Black()
			
		// cell.diffuseTexture = new BABYLON.Texture("./assets/3dd.jpg", scene)
		// cell.computeHighLevel = true
		// cell.diffuseTexture.uScale = cell.diffuseTexture.vScale = 3

		console.log(tasks)

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
				// mesh.rotation.x = Math.random() * 360
				continue
			}
			else{
				 
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


			// newInstance.useVertexColors = true
			// newInstance.outlineWidth = 0.15
			// newInstance.outlineColor = new BABYLON.Color4(0, 0, 0, 1)
			// newInstance.renderOutline = true

			//column
			newInstance.position.x = (i % d) * spacing

			//row
			newInstance.position.z = (Math.floor(i / d) * spacing)
			newInstance.position.y = 0

			groundArr.push(newInstance)

			this.changeMeshes.push(newInstance)
		}


		// let groundMesh = BABYLON.Mesh.MergeMeshes(groundArr, true)
		// groundMesh.outlineWidth = 0.15
		// groundMesh.outlineColor = new BABYLON.Color4(0, 0, 0, 1)
		// groundMesh.renderOutline = true

		// for(let i = 0; i < d; i++){
		// 	for(let j = 0; j < d; j++){
		// 		var newInstance 

		// 		if(h[i] < 0.4)
		// 			newInstance = meshes.grass.createInstance("index: " + i + "" + j)
		// 		else
		// 			newInstance = meshes.tree.createInstance("index: " + i + "" + j)

				
		// 		newInstance.position.x =+ i * spacing
		// 		newInstance.position.z =+ j * spacing

				// newInstance.enableEdgesRendering()
			 //   	newInstance.edgesWidth = 30.0;
				// newInstance.edgesColor = new BABYLON.Color4(0, 0, 0, 1)
		// 	}
		// }
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
	}
}

module.exports = test
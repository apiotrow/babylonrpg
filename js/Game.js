var BABYLON = require('babylonjs')
let perlin = require('perlin-noise')

class Game{
	constructor(engine, canvas, scene, tasks, map){
		this.scene = scene
		this.tasks = tasks

		let keyCodes = {
			S: 83,
			A: 65,
			W: 87,
			D: 68
		}

		this.player
		this.map = map

		scene.clearColor = new BABYLON.Color3(153 / 255, 204 / 255, 255 / 255)
		this.scene = scene
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
	    window.addEventListener
		('click', (evt)=>{
			this.keyState["click"] = true
		})
		window.addEventListener
		('mouseup', (event)=>{
			this.keyState["click"] = false
		})

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

		let d = map.length
		this.spacing = 15
		this.rotateMeshes = []
		
		for(let i in this.meshes){
			let mesh = this.meshes[i]

			mesh.material = cell
			mesh.convertToFlatShadedMesh()

			mesh.useVertexColors = true
			mesh.outlineWidth = 0.15
			mesh.outlineColor = new BABYLON.Color4(0, 0, 0, 1)
			mesh.renderOutline = true

			// if(mesh.name == "tree" || mesh.name == "blue"
			// 	|| mesh.name == "water")
			// {
			// 	mesh.position.y = 1000
			// 	continue
			// }
			if(mesh.name == "chad.mc"){
				 this.player = mesh
			}

			mesh.position.x = Math.floor(Math.random() * d) * this.spacing
			mesh.position.z = Math.floor(Math.random() * d) * this.spacing
			mesh.position.y = 1

			this.rotateMeshes.push(mesh)
		}

		console.log(this.meshes)



		let randX = Math.floor(Math.random() * map.length)
		let randY = Math.floor(Math.random() * map.length)
		
		this.player.x = randX
		this.player.y = randY

		
		let groundArr = []
		const h = perlin.generatePerlinNoise(d, d)
		this.changeMeshes = []


		
		this.renderMapAroundPlayer()
		



		this.player.position = map[randX][randY].position
		

		// for(let i = 0; i < d * d; i++){
		// 	var newInstance 

		// 	newInstance = this.meshes.blue.createInstance("index: " + i)

		// 	// if(h[i] < 0.5){
		// 	// 	newInstance = this.meshes.grass.createInstance("index: " + i)
		// 	// 	// newInstance = this.meshes.grass.clone("index: " + i)
		// 	// }
		// 	// else if(h[i] < 0.7){
		// 	// 	newInstance = this.meshes["blue.ply"].createInstance("index: " + i)
		// 	// 	// newInstance = this.meshes.tree.clone("index: " + i)
		// 	// }else {
		// 	// 	newInstance = this.meshes.water.createInstance("index: " + i)
		// 	// 	// newInstance = this.meshes.tree.clone("index: " + i)
		// 	// }

		// 	//column
		// 	newInstance.position.x = (i % d) * spacing

		// 	//row
		// 	newInstance.position.z = (Math.floor(i / d) * spacing)
		// 	newInstance.position.y = 0

		// 	groundArr.push(newInstance)

		// 	this.changeMeshes.push(newInstance)
		// }

		let g = []
		g.push("ss")
		g.push(2)
		console.log(g)
	}

	renderMapAroundPlayer(){


		for(let i = this.player.x - 5; i < this.player.x + 5; i++){
			for(let j = this.player.y - 5; j < this.player.y + 5; j++){

				//if it's off map don't do
				if(this.map[i] === undefined
					|| this.map[i][j] === undefined)
					continue

				let newInstance

				newInstance = this.meshes.blue.createInstance("blah")

				newInstance.x = i
				newInstance.y = j

				if(this.map[i][j] == 1)
					newInstance.walkable = true
				else
					newInstance.walkable = false

				this.map[i][j] = newInstance

				newInstance.position.x = i * this.spacing
				newInstance.position.z = j * this.spacing
				newInstance.position.y = 0
			}
		}
	}

	update(){
		this.scene.render()

		// var forward = this.player.getDirection(BABYLON.Vector3.Forward())
		// console.log(forward)

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

		
		if(this.keyState['w'] == true){
			// this.player.position.x += 1
			// this.player.rotation.y += 0.1

			// var orientation = BABYLON.Vector3.RotationFromAxis(axis1, axis2, axis3);
			// mesh.rotation = orientation;


			this.player.rotation.y = 0 * (Math.PI / 180)
		}
		if(this.keyState['d'] == true){
			this.player.rotation.y = 270 * (Math.PI / 180)
		}
		if(this.keyState['a'] == true){
			this.player.rotation.y = 90 * (Math.PI / 180)
		}
		if(this.keyState['s'] == true){
			this.player.rotation.y = 180 * (Math.PI / 180)
		}

		let pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY)

	    if (pickResult.hit) {
		    let diffX = pickResult.pickedPoint.x - this.player.position.x
		    let diffY = pickResult.pickedPoint.z - this.player.position.z
		    this.player.rotation.y = Math.atan2(diffX,diffY) + 180 * (Math.PI / 180)

		    if(this.keyState["click"]){
		    	if(pickResult.pickedMesh !== null && pickResult.pickedMesh !== undefined){
		    		this.player.position = pickResult.pickedMesh.position
		    		this.player.x = pickResult.pickedMesh.x
		    		this.player.y = pickResult.pickedMesh.y
		    		this.renderMapAroundPlayer()
		    	}
		    	this.keyState["click"] = false
	    	}
    	}

    	if(this.player !== undefined)
			this.camera.setTarget(this.player.position)

		let playerTile = this.map[this.player.x][this.player.y]


	}
}

module.exports = Game
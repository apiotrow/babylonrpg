var BABYLON = require('babylonjs')
let perlin = require('perlin-noise')

class Game{
	constructor(engine, canvas, scene, tasks, chunk, playerMapX, playerMapZ, appW, appH){

		this.scene = scene
		this.tasks = tasks

		let keyCodes = {
			S: 83,
			A: 65,
			W: 87,
			D: 68
		}

		this.player = {}
		// this.map = map

		// let randX = Math.floor(Math.random() * map.length)
		// let randY = Math.floor(Math.random() * map.length)
		
		

		this.chunk = chunk

		this.ground = BABYLON.Mesh.CreateGround("ground", 500, 500, 10, scene)
		this.ground.isPickable = true

		scene.clearColor = new BABYLON.Color3(153 / 255, 204 / 255, 255 / 255)
		this.scene = scene
		// BABYLON.SceneOptimizer.OptimizeAsync(scene, BABYLON.SceneOptimizerOptions.LowDegradationAllowed())
		// var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(100, 100, -100), scene)
		var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene)
		console.log(camera)
		camera.inputs.attached.keyboard.detachControl()
		camera.inputs.attached.pointers.detachControl()
		camera.inputs.attached.mousewheel.detachControl()
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
		
		// let divisor = 3
		// camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		// camera.orthoTop = appH / divisor
		// camera.orthoBottom = -appH / divisor
		// camera.orthoLeft = -appW / divisor
		// camera.orthoRight = appW / divisor
		

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

		engine.runRenderLoop( ()=> {
			this.update()
		})

		// let d = map.length
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

			// mesh.position.x = Math.floor(Math.random() * d) * this.spacing
			// mesh.position.z = Math.floor(Math.random() * d) * this.spacing
			// mesh.position.y = 1

			// this.rotateMeshes.push(mesh)
		}



		console.log(this.meshes)



		

		
		let groundArr = []
		// const h = perlin.generatePerlinNoise(d, d)
		this.changeMeshes = []


		this.player.x = playerMapX
		this.player.z = playerMapZ
		this.player.position.x = this.player.x * this.spacing
		this.player.position.z = this.player.z * this.spacing

		this.destX = this.player.position.x
    	this.destZ = this.player.position.z

		this.renderMapAroundPlayer()
		



		// this.player.position = map[randX][randY].position
		

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


		
	}

	renderMapAroundPlayer(){
		for(let i = 0; i < this.chunk.length; i++){
			for(let j = 0; j < this.chunk[i].length; j++){

				//if it's off map don't do
				if(this.chunk[i] === null
					|| this.chunk[i][j] === null)
					continue

				let newInstance

				newInstance = this.meshes.blue.createInstance("blah")

				newInstance.x = this.player.x + (j - 5)
				newInstance.z = this.player.z + (i - 5)

				// newInstance.x = this.player.x - i + 5
				// newInstance.z = this.player.x - j + 5


				newInstance.position.x = newInstance.x * this.spacing
				newInstance.position.z = newInstance.z * this.spacing
				newInstance.position.y = 0
			}
		}




		// for(let i = this.player.x - 5; i < this.player.x + 5; i++){
		// 	for(let j = this.player.y - 5; j < this.player.y + 5; j++){

		// 		//if it's off map don't do
		// 		if(this.map[i] === undefined
		// 			|| this.map[i][j] === undefined)
		// 			continue

		// 		let newInstance

		// 		newInstance = this.meshes.blue.createInstance("blah")

		// 		newInstance.x = i
		// 		newInstance.y = j

		// 		if(this.map[i][j] == 1)
		// 			newInstance.walkable = true
		// 		else
		// 			newInstance.walkable = false

		// 		this.map[i][j] = newInstance

		// 		newInstance.position.x = i * this.spacing
		// 		newInstance.position.z = j * this.spacing
		// 		newInstance.position.y = 0
		// 	}
		// }

		
	}

    groundPredicate(mesh){
        if (mesh.id == "ground"){
            return true
        }
        return false
    }

	update(){

		this.scene.render()

		if(this.keyState['w'] == true){
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

		



		if(this.keyState["click"]){

	        var hits = this.scene.multiPick(
	        	this.scene.pointerX, 
	        	this.scene.pointerY,
	        	this.groundPredicate,
	        	this.camera)

	        if(hits[0] !== undefined){
		        let mouseHit = hits[0].pickedPoint

		        console.log(mouseHit)

		        this.destX = mouseHit.x 
	    		this.destZ = mouseHit.z 

		     //    this.destX = Math.floor(mouseHit.x / this.spacing)
	    		// this.destZ = Math.floor(mouseHit.z / this.spacing)

	    		// this.player.x = this.destX
	    		// this.player.z = this.destZ

	    		this.renderMapAroundPlayer()
		    }

		    this.keyState["click"] = false
		}

    	let moveInc = new BABYLON.Vector3(
    		this.destX - this.player.position.x,
    		0,
    		this.destZ - this.player.position.z)
    	.normalize().scale(1)

    	if(Math.abs(this.destX - this.player.position.x) > Math.abs(moveInc.x)
    		|| Math.abs(this.destZ - this.player.position.z) > Math.abs(moveInc.z))
    		this.player.position = this.player.position.add(moveInc)



















    	// this.player.position = new BABYLON.Vector3.Lerp(
    	// 	this.player.position,
    	// 	new BABYLON.Vector3(
    	// 		1,
    	// 		this.player.position.y + 100,
    	// 		1),
    	// 	0.0001)




    	if(this.player !== undefined)
			this.camera.setTarget(this.player.position)

		// let playerTile = this.map[this.player.x][this.player.z]

		this.ground.position = this.player.position



		this.camera.radius = 200
		
		// this.camera.setPosition(new BABYLON.Vector3(
		// 	this.player.position.x - 100, 
		// 	100, 
		// 	this.player.position.z - 100))
	}
}

module.exports = Game
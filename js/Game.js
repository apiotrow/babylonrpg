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

		this.chunk = chunk

		this.ground = BABYLON.Mesh.CreateGround("ground", 500, 500, 10, scene)
		this.ground.isPickable = true

		scene.clearColor = new BABYLON.Color3(153 / 255, 204 / 255, 255 / 255)
		this.scene = scene
		// var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(100, 100, -100), scene)
		var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene)

		camera.inputs.attached.keyboard.detachControl()
		camera.inputs.attached.pointers.detachControl()
		camera.inputs.attached.mousewheel.detachControl()
	    camera.attachControl(canvas, false)
		this.camera = camera
		
		let divisor = 3
		camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		camera.orthoTop = appH / divisor
		camera.orthoBottom = -appH / divisor
		camera.orthoLeft = -appW / divisor
		camera.orthoRight = appW / divisor
	
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

		this.spacing = 15
		
		for(let i in this.meshes){
			let mesh = this.meshes[i]

			mesh.material = cell
			mesh.convertToFlatShadedMesh()

			mesh.useVertexColors = true
			mesh.outlineWidth = 0.15
			mesh.outlineColor = new BABYLON.Color4(0, 0, 0, 1)
			mesh.renderOutline = true

			if(mesh.name == "chad"){
				 this.player = mesh
			}
		}

		this.player.x = playerMapX
		this.player.z = playerMapZ
		this.player.position.x = this.player.x * this.spacing
		this.player.position.z = this.player.z * this.spacing

		this.destX = this.player.position.x
    	this.destZ = this.player.position.z

		this.renderMapAroundPlayer()
	}

	renderMapAroundPlayer(){
		for(let x = 0; x < this.chunk.length; x++){
			for(let z = 0; z < this.chunk[x].length; z++){

				//if it's off map don't do
				if(this.chunk[x] === null
					|| this.chunk[x][z] === null)
					continue

				let newInstance

				newInstance = this.meshes.blue.createInstance("blah")

				newInstance.x = this.player.x + (x - 5)
				newInstance.z = this.player.z + (z - 5)


				newInstance.position.x = newInstance.x * this.spacing
				newInstance.position.z = newInstance.z * this.spacing
				newInstance.position.y = 0
			}
		}
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
		
		this.camera.setPosition(new BABYLON.Vector3(
			this.player.position.x - 100, 
			100, 
			this.player.position.z - 100))
	}
}

module.exports = Game
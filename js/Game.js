var BABYLON = require('babylonjs')
let perlin = require('perlin-noise')
let gloss = require("../assets/gloss.json")

class Game{
	constructor(main, engine, canvas, scene, appW, appH, ws){

		this.scene = scene
		this.engine = engine
		this.chunk
		this.ws = ws
		this.main = main

		this.meshes = {}



		

		

		
		let keyCodes = {
			S: 83,
			A: 65,
			W: 87,
			D: 68
		}

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
		
		let divisor = 9
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

		this.spacing = 15
	}

	initGame(tasks, playerTileX, playerTileZ){
		this.setupMeshes(tasks)

		this.engine.runRenderLoop( ()=> {
			this.update()
		})

		this.player.tileX = playerTileX
		this.player.tileZ = playerTileZ
		this.player.position.x = this.player.tileX * this.spacing
		this.player.position.z = this.player.tileZ * this.spacing

		this.destWorldX = this.player.position.x
    	this.destWorldZ = this.player.position.z

    	let requestChunk = {
			h: "chunk",
			v: [this.destWorldX, this.destWorldZ]
		}
		this.ws.send(JSON.stringify(requestChunk))
	}

	setupMeshes(tasks){
		//make non-specular material to prevent shine
		var mat = new BABYLON.StandardMaterial("mat", this.scene)
		mat.specularColor = BABYLON.Color3.Black()

		//setup meshes
		for(let i = 0; i < tasks.length; i++){
			let meshName = tasks[i].name
			let mesh = tasks[i].loadedMeshes[0]

			mesh.material = mat
			mesh.convertToFlatShadedMesh()

			mesh.useVertexColors = true
			mesh.outlineWidth = 0.15
			mesh.outlineColor = new BABYLON.Color4(0, 0, 0, 1)
			mesh.renderOutline = true

			this.meshes[meshName] = mesh
		}

		this.player = this.meshes.chad
	}

	renderChunk(chunk){
		for(let x = 0; x < chunk.length; x++){
			for(let z = 0; z < chunk[x].length; z++){

				//if it's off map don't do
				if(chunk[x] === null
					|| chunk[x][z] === null)
					continue

				let newInstance

				//convert model ID to model name
				let modelName = gloss.IDToModel[chunk[x][z]]

				newInstance = this.meshes.blue.createInstance(
					modelName
					)

				newInstance.tileX = this.player.tileX + (x - 5)
				newInstance.tileZ = this.player.tileZ + (z - 5)


				newInstance.position.x = this.tileToWorld(newInstance.tileX)
				newInstance.position.z = this.tileToWorld(newInstance.tileZ)
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

    worldToTile(worldCoord){
    	return Math.floor((worldCoord + (this.spacing / 2)) / this.spacing)
    }

    tileToWorld(tileCoord){
    	return (tileCoord * this.spacing)
    }

    newChunk(chunk){
    	this.renderChunk(chunk)
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

		        let tileXHit = this.worldToTile(mouseHit.x)
		        let tileZHit = this.worldToTile(mouseHit.z)

		        this.destWorldX = this.tileToWorld(tileXHit)
	    		this.destWorldZ = this.tileToWorld(tileZHit)

	    		let requestChunk = {
					h: "chunk",
					v: [tileXHit, tileZHit]
				}
				this.ws.send(JSON.stringify(requestChunk))

				this.player.tileX = tileXHit
    			this.player.tileZ = tileZHit
		    }

		    this.keyState["click"] = false
		}

    	let moveInc = new BABYLON.Vector3(
    		this.destWorldX - this.player.position.x,
    		0,
    		this.destWorldZ - this.player.position.z)
    	.normalize().scale(1)

    	if(Math.abs(this.destWorldX - this.player.position.x) > Math.abs(moveInc.x)
    		|| Math.abs(this.destWorldZ - this.player.position.z) > Math.abs(moveInc.z))
    	{
    		//continue moving toward destination
    		this.player.position = this.player.position.add(moveInc)

    	}else{
    		// this.player.tileX = this.worldToTile(this.destWorldX)
    		// this.player.tileZ = this.worldToTile(this.destWorldZ)


    	}




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
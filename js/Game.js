var BABYLON = require('babylonjs')
let perlin = require('perlin-noise')
let gloss = require("../assets/gloss.json")
var sizeof = require('sizeof')

class Game{
	constructor(engine, canvas, scene, appW, appH, ws){
		this.scene = scene
		this.engine = engine
		this.ws = ws

		this.ID

		this.chunk = []
		this.meshes = {}

		this.spacing = 15
		this.radius = 10

		this.ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 10, scene)
		this.ground.isPickable = true

		this.camType = "FollowCamera"
		this.camera

		this.playerFollow = new BABYLON.Mesh()

		scene.clearColor = new BABYLON.Color3(153 / 255, 204 / 255, 255 / 255)
		// var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(100, 100, -100), scene)
		// var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene)
		
		if(this.camType == "FollowCamera")
			this.camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene)
		
		// var camera = new BABYLON.TargetCamera("FollowCam", new BABYLON.Vector3(0, 0, 0), scene)
		// camera.parent = this.player

		this.camera.minZ = -90

		// camera.inputs.attached.keyboard.detachControl()
		// camera.inputs.attached.pointers.detachControl()
		// camera.inputs.attached.mousewheel.detachControl()
	 //    camera.attachControl(canvas, false)
		// camera.noRotationConstraint = true

		console.log(this.camera)
		
		let divisor = 6
		this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		this.camera.orthoTop = appH / divisor
		this.camera.orthoBottom = -appH / divisor
		this.camera.orthoLeft = -appW / divisor
		this.camera.orthoRight = appW / divisor
	
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
	}

	/**
	 * Request a movement path to a particular destination
	 * from server
	 */ 
	requestPath(px, pz, dx, dz){
		let mess = {
			h: "path",
			v: {
				ID: this.ID,
				px: px,
				pz: pz,
				dx: dx,
				dz: dz,
				r: this.radius
			}
		}
		this.ws.send(JSON.stringify(mess))
	}

	/**
	 * Request a chunk from the server
	 */ 
	requestChunk(x, y){
		let mess = {
			h: "chunk",
			v: {
				cent: [x, y],
				r: this.radius
			}
		}
		this.ws.send(JSON.stringify(mess))
	}

	initGame(tasks, playerTileX, playerTileZ){
		//make non-specular material to prevent shine
		var mat = new BABYLON.StandardMaterial("mat", this.scene)
		mat.specularColor = BABYLON.Color3.Black()

		this.pool = {}

		//setup meshes
		for(let i = 0; i < tasks.length; i++){
			let meshName = tasks[i].name
			let mesh = tasks[i].loadedMeshes[0]

			mesh.material = mat

			//make shading more angular
			mesh.convertToFlatShadedMesh()

			//this doesn't seem to change anything
			mesh.useVertexColors = true
			
			//give meshes an outline
			mesh.outlineWidth = 0.15
			mesh.outlineColor = new BABYLON.Color4(0, 0, 0, 1)
			mesh.renderOutline = true

			//add mesh to mesh holder
			this.meshes[meshName] = mesh

			// this.pool[meshName] = []
			// for(let i = 0; i < 300; i++){
			// 	let ni = mesh.createInstance()
			// 	this.pool[meshName].push(ni)
			// }
		}

		//init player
		this.player = this.meshes.chad
		this.player.tileX = playerTileX
		this.player.tileZ = playerTileZ
		this.playerFollow.position.x = this.tileToWorld(this.player.tileX)
		this.playerFollow.position.z = this.tileToWorld(this.player.tileZ)

		// this.player.position.x = this.tileToWorld(this.player.tileX)
		// this.player.position.z = this.tileToWorld(this.player.tileZ)
		this.player.parent = this.playerFollow

		if(this.camType == "FollowCamera"){
			this.camera.lockedTarget = this.playerFollow
			this.camera.cameraAcceleration = 0.5
		}

		//start update loop
		this.engine.runRenderLoop( ()=> {
			this.update()
		})

		//init player destination to their current position
		this.destWorldX = this.playerFollow.position.x
    	this.destWorldZ = this.playerFollow.position.z

    	//render first chunk around player
    	this.requestChunk(this.player.tileX, this.player.tileZ)

    	this.chunk = []
		for(let x = 0; x < (this.radius * 2) + 1; x++){
			let col = []
			for(let z = 0; z < (this.radius * 2) + 1; z++){
				let newInstance = this.meshes["blue"].createInstance()
				col.push(newInstance)
			}
			this.chunk.push(col)
		}

		// console.log(sizeof.sizeof(this) / 1000000)
	}

	// renderChunk(chunk, r){
	// 	for(let x = 0; x < chunk.length; x++){
	// 		for(let z = 0; z < chunk[x].length; z++){

	// 			//if tile is off map it will be undefined
	// 			if(chunk[x] === null
	// 				|| chunk[x][z] === null)
	// 			{
	// 				continue
	// 			}

	// 			//convert model ID to model name
	// 			let modelName = gloss.IDToModel[chunk[x][z]]

	// 			this.chunk[x][z].setVerticesData(
	// 				BABYLON.VertexData.ExtractFromMesh(this.meshes.blue)
	// 				)

	// 			this.chunk[x][z].tileX = this.player.tileX + (x - r)
	// 			this.chunk[x][z].tileZ = this.player.tileZ + (z - r)

	// 			this.chunk[x][z].position.x = this.tileToWorld(this.chunk[x][z].tileX)
	// 			this.chunk[x][z].position.z = this.tileToWorld(this.chunk[x][z].tileZ)
	// 			this.chunk[x][z].position.y = 0


	// 		}
	// 	}
	// }

	/**
	 * Render the tiles around the player by a certain radius
	 */ 
	renderChunk(chunk, r){
		//if this.chunk hasn't been initialized (game just
    	//started), or if new chunk is a different dimension 
    	//than previous chunk, remake this.chunk 
    	if(
    		this.chunk !== undefined
    		&& this.chunk.length != (r * 2) + 1)
    	{
    		this.chunk = []
    		for(let x = 0; x < (r * 2) + 1; x++){
    			let col = []
				for(let z = 0; z < (r * 2) + 1; z++){
					col.push(null)
				}
				this.chunk.push(col)
			}
    	}

		//dispose all meshes in old chunk
		//and reset all entries
		for(let x = 0; x < this.chunk.length; x++){
			for(let z = 0; z < this.chunk[x].length; z++){
				if(this.chunk[x][z] !== null){
					this.chunk[x][z].dispose()
				}
				this.chunk[x][z] = null
			}
		}

		for(let x = 0; x < chunk.length; x++){
			for(let z = 0; z < chunk[x].length; z++){

				//if tile is off map it will be undefined
				if(chunk[x] === null
					|| chunk[x][z] === null)
				{
					continue
				}

				//convert model ID to model name
				let modelName = gloss.IDToModel[chunk[x][z]]

				let newInstance = this.meshes[modelName].createInstance()

				newInstance.tileX = this.player.tileX + (x - r)
				newInstance.tileZ = this.player.tileZ + (z - r)

				newInstance.position.x = this.tileToWorld(newInstance.tileX)
				newInstance.position.z = this.tileToWorld(newInstance.tileZ)
				newInstance.position.y = 0

				this.chunk[x][z] = newInstance
// this.chunk[x][z].setEnabled()

			}
		}
	}

	/**
	 * Filter for raycasting that makes it only hit ground
	 */ 
    groundPredicate(mesh){
        if (mesh.id == "ground"){
            return true
        }
        return false
    }

    /**
     * Take a world coordinate and convert it to a tile coordinate
     */ 
    worldToTile(worldCoord){
    	return Math.floor((worldCoord + (this.spacing / 2)) / this.spacing)
    }

    /**
     * Take a tile coordinate and convert it to a world coordinate
     */ 
    tileToWorld(tileCoord){
    	return (tileCoord * this.spacing)
    }

    /**
     * Change destination so player will begin moving
     * toward it
     */ 
    changeDest(x, z){
    	this.destWorldX = this.tileToWorld(x)
		this.destWorldZ = this.tileToWorld(z)

		let mess = {
			h: "nextInPath",
			v: this.ID
		}
		this.ws.send(JSON.stringify(mess))
    }

    /**
     * Get the next destination in path ready
     */ 
    prepareNextDest(x, z){
    	this.nextDest = [x, z]
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

	    		this.requestPath(
    				this.player.tileX,
    				this.player.tileZ,
    				tileXHit,
    				tileZHit
    				)
		    }

		    this.keyState["click"] = false
		}

		//increment of movement per frame
    	let moveInc = new BABYLON.Vector3(
    		this.destWorldX - this.playerFollow.position.x,
    		0,
    		this.destWorldZ - this.playerFollow.position.z)
    	.normalize().scale(1)

    	//if player hasn't reached next spot, move them
    	if(Math.abs(this.destWorldX - this.playerFollow.position.x) > Math.abs(moveInc.x)
    		|| Math.abs(this.destWorldZ - this.playerFollow.position.z) > Math.abs(moveInc.z))
    	{
    		//continue moving toward destination
    		this.playerFollow.position = this.playerFollow.position.add(moveInc)
    	}else{
    		//player arrived at next spot. change their tile coords.
    		this.player.tileX = this.worldToTile(this.destWorldX)
    		this.player.tileZ = this.worldToTile(this.destWorldZ)

    		//get next spot in path if it exists.
    		//else just sit there
    		if(this.nextDest !== undefined
    			&& this.nextDest[0] != -1
    			&& this.nextDest[1] != -1)
    		{
    			//set new destination
    			this.changeDest(this.nextDest[0], this.nextDest[1])

    			//incremement movement for this frame to prevent
    			//stop/go jerkiness
    			this.playerFollow.position = this.playerFollow.position.add(moveInc)

    			//request new chunk
    			this.requestChunk(this.player.tileX, this.player.tileZ)
    		}
    	}




    	// this.player.position = new BABYLON.Vector3.Lerp(
    	// 	this.player.position,
    	// 	new BABYLON.Vector3(
    	// 		1,
    	// 		this.player.position.y + 100,
    	// 		1),
    	// 	0.0001)




   //  	if(this.player !== undefined)
			// this.camera.setTarget(this.playerFollow.position)

		this.ground.position = this.playerFollow.position

		if(this.camType == "FollowCamera"){
			this.camera.radius = 200
			this.camera.heightOffset = 100
			this.camera.rotationOffset += 0.5

			this.camera.position.y = 100
			// this.camera.position.x = this.player.position.x - 100
			// this.camera.position.z = this.player.position.z - 100
		}
		// this.camera.rotation.y += 0.5
		// this.camera.position.x = this.player.position.x - 100
		
		// this.camera.setPosition(new BABYLON.Vector3(
		// 	this.camera.position.x, 
		// 	100, 
		// 	this.camera.position.z))

		
	}
}

module.exports = Game
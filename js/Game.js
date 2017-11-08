var BABYLON = require('babylonjs')
let perlin = require('perlin-noise')
let gloss = require("../assets/gloss.json")
var sizeof = require('sizeof')
var work = require('webworkify')

class Game{
	constructor(engine, canvas, scene, appW, appH, ws){
		this.scene = scene
		this.engine = engine
		this.ws = ws
		this.appW = appW
		this.appH = appH

		this.ID

		this.chunk = []
		this.meshes = {}

		this.spacing = 15
		this.radius = 10

		this.ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 10, scene)
		this.ground.isPickable = true

		this.camera

		this.playerFollow = new BABYLON.Mesh()

		this.scene.clearColor = new BABYLON.Color3(153 / 255, 204 / 255, 255 / 255)
		
		this.camera = new BABYLON.FollowCamera(
			"FollowCam", 
			new BABYLON.Vector3(0, 10, -10), 
			scene)
		this.camera.rotationOffset = 225
		this.camera.heightOffset = 200

		this.camera.minZ = -90
		
		this.orthoSize = 4
		this.cameraOrtho(this.orthoSize)
	
		this.keyState = {}
		var onKeyDown = (evt)=> {
			this.keyState[evt.key] = true
	    }
	    var onKeyUp = (evt)=> {
	    	this.keyState[evt.key] = false
	    }
	    canvas.addEventListener
		('click', (evt)=>{
			this.keyState["click"] = true
		})
		canvas.addEventListener
		('mouseup', (event)=>{
			this.keyState["click"] = false
		})
		canvas.addEventListener('wheel', (e)=>{
			if(e.deltaY < 0){
				this.keyState['zoomIn'] = true
			}
			else if(e.deltaY > 0){
				this.keyState['zoomOut'] = true
			}
		}, {passive: true})

	    BABYLON.Tools.RegisterTopRootEvents([{
	        name: "keydown",
	        handler: onKeyDown
	    }, {
	        name: "keyup",
	        handler: onKeyUp
	    }])

	    let angles = 0.15
	    var light = new BABYLON.HemisphericLight("light", 
	    	new BABYLON.Vector3(0, 1, .25), scene)
	    light.intensity = 1.5

		window.addEventListener("resize", function () {
		    engine.resize()
		})
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
		}

		//init player
		this.player = this.meshes.chad
		this.player.tileX = playerTileX
		this.player.tileZ = playerTileZ
		this.playerFollow.position.x = this.tileToWorld(this.player.tileX)
		this.playerFollow.position.z = this.tileToWorld(this.player.tileZ)
		this.player.newAngle = 90 * (Math.PI / 180)

		//if null, we're on final tile in path.
		//if -1, -1, we're on second-to-last tile in path.
		//if anything else, we're on another spot in path.
		this.player.nextDest = null

		// this.player.position.x = this.tileToWorld(this.player.tileX)
		// this.player.position.z = this.tileToWorld(this.player.tileZ)
		this.player.parent = this.playerFollow

		this.camera.lockedTarget = this.playerFollow
		this.camera.cameraAcceleration = 0.5

		//start update loop
		this.engine.runRenderLoop(()=> {
			this.update()
		})

		//init player destination to their current position
    	this.player.destWorld = []
    	this.player.destWorld[0] = this.tileToWorld(this.player.tileX)
    	this.player.destWorld[1] = this.tileToWorld(this.player.tileZ)

		this.player.newDestSelected = false
		this.player.selectedDest = [-1, -1]

    	//render first chunk around player
    	this.requestChunk(this.player.tileX, this.player.tileZ)

    	this.chunk = []

		// for(let x = 0; x < (this.radius * 2) + 1; x++){
		// 	let col = []
		// 	for(let z = 0; z < (this.radius * 2) + 1; z++){
		// 		let newInstance = this.meshes["blue"].createInstance()
		// 		col.push(newInstance)
		// 	}
		// 	this.chunk.push(col)
		// }
	}

	cameraOrtho(size){
		let divisor = size
		this.camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA
		this.camera.orthoTop = this.appH / divisor
		this.camera.orthoBottom = -this.appH / divisor
		this.camera.orthoLeft = -this.appW / divisor
		this.camera.orthoRight = this.appW / divisor
	}

	/**
	 * Request a movement path to a particular destination
	 * from server
	 */ 
	requestPath(px, pz, dx, dz){
		//TODO: Check if spot is walkable first, to prevent
		//needless server request

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
     * Change destination so player will begin moving
     * toward it, then get next spot in path so player
     * can move to it immedately upon reaching destination.
     */ 
    getNextInPath(x, z){
    	this.player.destWorld[0] = this.tileToWorld(x)
		this.player.destWorld[1] = this.tileToWorld(z)

		let mess = {
			h: "nextInPath",
			v: this.ID
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

    /**
     * Get the next destination in path ready.
     * Results from getNextInPath() call
     */ 
    prepareNextDest(x, z){
    	this.player.nextDest = [x, z]
    }

	renderChunk(chunk, r){
		// this.renderChunkFromPool(chunk, r)
		this.renderChunkFromNewInstances(chunk, r)
		// this.renderChunkFromNewInstancesWebWorker(chunk, r)
		// this.renderChunkFromNewInstancesPromises(chunk, r)
	}

	renderChunkFromNewInstancesPromises(chunk, r){
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

    	// var disposePromises = []
    	let count = 0

		//dispose all meshes in old chunk
		//and reset all entries
		for(let x = 0; x < this.chunk.length; x++){
			for(let z = 0; z < this.chunk[x].length; z++){
				let ch = this.chunk
				if(this.chunk[x][z] !== null){
					// disposePromises.push(new Promise(function(resolve, reject) {

						this.chunk[x][z].dispose()
						this.chunk[x][z] = null
						// resolve()
					// }))
					
				}
				this.chunk[x][z] = null
			}
		}

		// Promise.all(disposePromises).then(function(){
		// 	// console.log("disposing done")
		// })

		var instancePromises = []

		count = 0
		for(let x = 0; x < chunk.length; x++){
			for(let z = 0; z < chunk[x].length; z++){

				//if tile is off map it will be undefined
				if(chunk[x] === null
					|| chunk[x][z] === null)
				{
					continue
				}

				let _this = this
				count++
				// instancePromises.push(new Promise(function(resolve, reject) {
					

					// let wait = setTimeout(()=>{
						//convert model ID to model name
						let modelName = gloss.IDToModel[chunk[x][z]]

						let newInstance = _this.meshes[modelName].createInstance()

						newInstance.tileX = _this.player.tileX + (x - r)
						newInstance.tileZ = _this.player.tileZ + (z - r)

						newInstance.position.x = _this.tileToWorld(newInstance.tileX)
						newInstance.position.z = _this.tileToWorld(newInstance.tileZ)
						newInstance.position.y = 0

						_this.chunk[x][z] = newInstance
						
					// 	resolve()
					// }, count * 3)
					
				// }))

				
			}
		}

		Promise.all(instancePromises).then(function(){
			console.log("instances done")
		})
	}


	/**
	 * Render the tiles around the player by a certain radius
	 */ 
	renderChunkFromPool(chunk, r){
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

		for(let x = 0; x < this.chunk.length; x++){
			for(let z = 0; z < this.chunk[x].length; z++){
				if(this.chunk[x][z] !== null){
					this.chunk[x][z].setEnabled(false)
				}
			}
		}

		let poolIter = 0
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

				let newInstance = this.pool["blue"][poolIter++]

				newInstance.tileX = this.player.tileX + (x - r)
				newInstance.tileZ = this.player.tileZ + (z - r)

				newInstance.position.x = this.tileToWorld(newInstance.tileX)
				newInstance.position.z = this.tileToWorld(newInstance.tileZ)
				newInstance.position.y = 0

				this.chunk[x][z] = newInstance
				newInstance.setEnabled(true)
			}
		}
	}

	/**
	 * Render the tiles around the player by a certain radius
	 */ 
	renderChunkFromNewInstancesWebWorker(chunk, r){
		let mess = {
			h: "instance",
			v: {
				chunk: chunk,
				r: r
			}
		}
		this.instanceWorker.postMessage(mess)

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
			}
		}
	}

	/**
	 * Render the tiles around the player by a certain radius
	 */ 
	renderChunkFromNewInstances(chunk, r){
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

    negZ(){
    	return 0 * (Math.PI / 180)
    }

    posZ(){
    	return 180 * (Math.PI / 180)
    }

    posX(){
    	return 270 * (Math.PI / 180)
    }

    negX(){
    	return 90 * (Math.PI / 180)
    }

    negZnegX(){
    	return 45 * (Math.PI / 180)
    }

    posZnegX(){
    	return 135 * (Math.PI / 180)
    }

    negZposX(){
    	return 315 * (Math.PI / 180)
    }

    posZposX(){
    	return 225 * (Math.PI / 180)
    }

    /**
     * Rotate angle @currDeg by a certain amount @changeDeg
     */ 
    rotateByDeg(currDeg, changeDeg){
    	return currDeg + (changeDeg * (Math.PI / 180))
    }

    rayCastToGround(){
    	return this.scene.multiPick(
        	this.scene.pointerX, 
        	this.scene.pointerY,
        	this.groundPredicate,
        	this.camera)
    }

    /**
     * Return the mesh of the tile over worldX, worldY
     */ 
    selectedTile(worldX, worldY){
    	let tileXHit = this.worldToTile(worldX)
        let tileZHit = this.worldToTile(worldY)

        let x = tileXHit - (this.player.tileX - this.radius)
		let z = tileZHit - (this.player.tileZ - this.radius)
		if(this.chunk[x] !== undefined
			&& this.chunk[x][z] !== undefined
			&& this.chunk[x][z] !== null)
		{
			return this.chunk[x][z]
		}else{
			return undefined
		}
    }

    /**
     * Initiate the setting of a new path to worldX, worldY
     */ 
    selectNewPath(worldX, worldY){
    	let tileXHit = this.worldToTile(worldX)
        let tileZHit = this.worldToTile(worldY)

    	//if player is currently moving along path and 
		//player wants to find a new path, cancel current path, 
		//wait until character gets to next tile in path,
		//then get new path. this will prevent calls to server
        //happening too frequently.
    	if(this.player.nextDest !== null)
    	{
    		//flag so we can get new path once we reach the next tile
    		this.player.newDestSelected = true
    		this.player.selectedDest = [tileXHit, tileZHit]

    		//clear next destination if one exists so the player
    		//will stop moving on the next tile
    		this.player.nextDest = [-1, -1]
        }else{
        	//request new path for chosen destination
    		this.requestPath(
				this.player.tileX,
				this.player.tileZ,
				tileXHit,
				tileZHit
				)
        }
    }

    /**
     * What happens on mouse click
     */  
    mouseClickBehavior(){
    	var hits = this.rayCastToGround()

		if(this.keyState["click"]){
	        if(hits[0] !== undefined){
	        	let mouseHit = hits[0].pickedPoint

	        	let selTile = this.selectedTile(mouseHit.x, mouseHit.z)
	        	if(selTile !== undefined){
					selTile.position.y = 10
	        	}

		        this.selectNewPath(mouseHit.x, mouseHit.z)
		    }
		    this.keyState["click"] = false
		}
    }

    /**
     * Get new angle a thing needs in order to rotate by the shortest
     * arc from its current angle.
     */ 
    newAngleForThing(thing){
    	let newAngle

    	//get new direction player must face
		if(thing.tileX > this.worldToTile(this.player.destWorld[0])
			&& thing.tileZ > this.worldToTile(this.player.destWorld[1]))
		{
			newAngle =  this.negZnegX()
		}else if(thing.tileX > this.worldToTile(this.player.destWorld[0])
			&& thing.tileZ < this.worldToTile(this.player.destWorld[1]))
		{
			newAngle =  this.posZnegX()
		}else if(thing.tileX < this.worldToTile(this.player.destWorld[0])
			&& thing.tileZ > this.worldToTile(this.player.destWorld[1]))
		{
			newAngle =  this.negZposX()
		}else if(thing.tileX < this.worldToTile(this.player.destWorld[0])
			&& thing.tileZ < this.worldToTile(this.player.destWorld[1]))
		{
			newAngle =  this.posZposX()
		}else if(thing.tileX > this.worldToTile(this.player.destWorld[0])){
			newAngle =  this.negX()
		}else if(thing.tileX < this.worldToTile(this.player.destWorld[0])){
			newAngle =  this.posX()
		}else if(thing.tileZ < this.worldToTile(this.player.destWorld[1])){
			newAngle =  this.posZ()
		}else if(thing.tileZ > this.worldToTile(this.player.destWorld[1])){
			newAngle =  this.negZ()
		}

		//get player's current angle as an angle between 0 and 360
		let pDeg = thing.newAngle * (180 / Math.PI)
		while(pDeg < 0)
			pDeg += 360
		while(pDeg > 360)
			pDeg -= 360
		let nDeg = newAngle * (180 / Math.PI)
		while(nDeg < 0)
			nDeg += 360
		while(nDeg > 360)
			nDeg -= 360

		//get rid of random .00000034 that may show up
		pDeg = Math.round(pDeg)
		nDeg = Math.round(nDeg)

		//360 and 0 are equivalent, but I only check for 0
		if(pDeg == 360)
			pDeg = 0
		if(nDeg == 360)
			nDeg = 0

		//90 left
		if(pDeg == 90 && nDeg == 315){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -135)
		}else if(pDeg == 90 && nDeg == 0){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -90)
		}else if(pDeg == 90 && nDeg == 45){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -45)
		}else if(pDeg == 90 && nDeg == 270){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -180)
		}
		//90 right
		else if(pDeg == 90 && nDeg == 135){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 45)
		}else if(pDeg == 90 && nDeg == 180){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 90)
		}else if(pDeg == 90 && nDeg == 225){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 135)
		}
		//135 left
		else if(pDeg == 135 && nDeg == 90){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -45)
		}else if(pDeg == 135 && nDeg == 45){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -90)
		}else if(pDeg == 135 && nDeg == 0){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -135)
		}else if(pDeg == 135 && nDeg == 315){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -180)
		}
		//135 right
		else if(pDeg == 135 && nDeg == 180){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 45)
		}else if(pDeg == 135 && nDeg == 225){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 90)
		}else if(pDeg == 135 && nDeg == 270){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 135)
		}
		//180 left
		else if(pDeg == 180 && nDeg == 135){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -45)
		}else if(pDeg == 180 && nDeg == 90){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -90)
		}else if(pDeg == 180 && nDeg == 45){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -135)
		}else if(pDeg == 180 && nDeg == 0){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -180)
		}
		//180 right
		else if(pDeg == 180 && nDeg == 225){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 45)
		}else if(pDeg == 180 && nDeg == 270){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 90)
		}else if(pDeg == 180 && nDeg == 315){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 135)
		}
		//225 left
		else if(pDeg == 225 && nDeg == 180){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -45)
		}else if(pDeg == 225 && nDeg == 135){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -90)
		}else if(pDeg == 225 && nDeg == 90){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -135)
		}else if(pDeg == 225 && nDeg == 45){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -180)
		}
		//225 right
		else if(pDeg == 225 && nDeg == 270){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 45)
		}else if(pDeg == 225 && nDeg == 315){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 90)
		}else if(pDeg == 225 && nDeg == 0){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 135)
		}
		//270 left
		else if(pDeg == 270 && nDeg == 225){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -45)
		}else if(pDeg == 270 && nDeg == 180){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -90)
		}else if(pDeg == 270 && nDeg == 135){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -135)
		}else if(pDeg == 270 && nDeg == 90){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -180)
		}
		//270 right
		else if(pDeg == 270 && nDeg == 315){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 45)
		}else if(pDeg == 270 && nDeg == 0){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 90)
		}else if(pDeg == 270 && nDeg == 45){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 135)
		}
		//315 left
		else if(pDeg == 315 && nDeg == 270){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -45)
		}else if(pDeg == 315 && nDeg == 225){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -90)
		}else if(pDeg == 315 && nDeg == 180){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -135)
		}else if(pDeg == 315 && nDeg == 135){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -180)
		}
		//315 right
		else if(pDeg == 315 && nDeg == 0){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 45)
		}else if(pDeg == 315 && nDeg == 45){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 90)
		}else if(pDeg == 315 && nDeg == 90){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 135)
		}
		//0 left
		else if(pDeg == 0 && nDeg == 315){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -45)
		}else if(pDeg == 0 && nDeg == 270){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -90)
		}else if(pDeg == 0 && nDeg == 225){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -135)
		}else if(pDeg == 0 && nDeg == 180){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -180)
		}
		//0 right
		else if(pDeg == 0 && nDeg == 45){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 45)
		}else if(pDeg == 0 && nDeg == 90){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 90)
		}else if(pDeg == 0 && nDeg == 135){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 135)
		}
		//45 left
		else if(pDeg == 45 && nDeg == 0){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -45)
		}else if(pDeg == 45 && nDeg == 315){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -90)
		}else if(pDeg == 45 && nDeg == 270){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -135)
		}else if(pDeg == 45 && nDeg == 225){
			thing.newAngle = this.rotateByDeg(thing.newAngle, -180)
		}
		//45 right
		else if(pDeg == 45 && nDeg == 90){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 45)
		}else if(pDeg == 45 && nDeg == 135){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 90)
		}else if(pDeg == 45 && nDeg == 180){
			thing.newAngle = this.rotateByDeg(thing.newAngle, 135)
		}
    }

    /**
     * Update the movement of a moving thing. For movement
     * controlled by pathfinding.
     */ 
    moveThing(thing){
    	let vehicle
    	if(thing == this.player){
    		vehicle = thing.parent
    	}else{
    		vehicle = thing
    	}

    	//increment of movement per frame
    	let moveInc = new BABYLON.Vector3(
    		this.player.destWorld[0] - vehicle.position.x,
    		0,
    		this.player.destWorld[1] - vehicle.position.z)
    	.normalize().scale(1)

    	if(Math.abs(this.player.destWorld[0] - vehicle.position.x) 
    		> Math.abs(moveInc.x)
    		|| Math.abs(this.player.destWorld[1] - vehicle.position.z) 
    		> Math.abs(moveInc.z))
    	{
    		//set new angle
    		this.newAngleForThing(thing)

    		//continue moving thing toward destination
			vehicle.position = vehicle.position.add(moveInc)
    	}else{
    		//player arrived at next spot. change their tile coords.
    		thing.tileX = this.worldToTile(this.player.destWorld[0])
    		thing.tileZ = this.worldToTile(this.player.destWorld[1])

    		//if we're currently moving
    		if(thing.nextDest !== null){
    			//the next tile isn't the final spot
    			if(thing.nextDest[0] != -1 && thing.nextDest[1] != -1){
    				//set new destination
	    			this.getNextInPath(thing.nextDest[0], thing.nextDest[1])

	    			//incremement movement for this frame to prevent
	    			//stop/go jerkiness
	    			vehicle.position = vehicle.position.add(moveInc)

	    			if(thing == this.player){
		    			//request new chunk
		    			this.requestChunk(thing.tileX, thing.tileZ)
		    		}
    			//if next tile IS final spot
    			}else if(thing.nextDest[0] == -1 && thing.nextDest[1] == -1){
    				//nullify path
    				thing.nextDest = null

	    			if(thing == this.player){
		    			//request new chunk
		    			this.requestChunk(thing.tileX, thing.tileZ)
		    		}
    			}

    			//if we selected a new destination mid-path, request
    			//path to that destination
    			if(this.player.newDestSelected){
		    		this.requestPath(
	    				thing.tileX,
	    				thing.tileZ,
	    				this.player.selectedDest[0],
	    				this.player.selectedDest[1]
	    				)

		    		//unflag
	    			this.player.newDestSelected = false
	    		}
	    	}
    	}
    }

    /**
     * Update rotation of thing to new angle
     */ 
    updateThingRotation(thing){
    	//lerptate the player
    	if(Math.abs(thing.rotation.y - thing.newAngle) > 0.01){
    		let left = thing.rotation.y - thing.newAngle
    		let right = thing.newAngle - thing.rotation.y

    		if(left < right)
	    		thing.rotation.y -= left / 5
	    	else
	    		thing.rotation.y += right / 5
	    }
    }

	update(){
		this.scene.render()

		//camera zoom in/out functionality
		if(this.keyState['zoomIn']){
			this.cameraOrtho(++this.orthoSize)
			this.keyState['zoomIn'] = false
		}else if (this.keyState['zoomOut']){
			this.cameraOrtho(--this.orthoSize)
			this.keyState['zoomOut'] = false
		}

		if(this.keyState['w'] == true){
			this.camera.heightOffset -= 2
		}
		if(this.keyState['d'] == true){
			this.camera.rotationOffset += 2
		}
		if(this.keyState['a'] == true){
			this.camera.rotationOffset -= 2
		}
		if(this.keyState['s'] == true){
			this.camera.heightOffset += 2
		}

		this.mouseClickBehavior()

		this.moveThing(this.player)
		this.updateThingRotation(this.player)

	    //have ground object follow player
		this.ground.position = this.playerFollow.position

		//update camera height and radius from player
		this.camera.radius = 200
	}
}

module.exports = Game
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

		this.newDestSelected = false
		this.newDestSelectedX
		this.newDestSelectedZ

		this.ground = BABYLON.Mesh.CreateGround("ground", 1000, 1000, 10, scene)
		this.ground.isPickable = true

		this.camera

		this.playerFollow = new BABYLON.Mesh()

		scene.clearColor = new BABYLON.Color3(153 / 255, 204 / 255, 255 / 255)
		
		this.camera = new BABYLON.FollowCamera(
			"FollowCam", 
			new BABYLON.Vector3(0, 10, -10), 
			scene)

		this.camera.minZ = -90

		console.log(this.camera)
		
		let divisor = 4
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

	// resolveAfter2Seconds(x) { 
	//   return new Promise(resolve => {
	//     setTimeout(() => {
	//       resolve(x);
	//     }, 2000);
	//   });
	// }

	// async doEverything() {
 //    // const sumOfItAll = await http.scrapeTheInternet() +
 //    //   await new Promise((resolve, reject) =>
 //    //     http.asyncCallback((e, result) => !e ? resolve(result) : reject(e)))
 //    // return this.resp = sumOfItAll
 //  }

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

    /**
     * Change destination so player will begin moving
     * toward it, then get next spot in path so player
     * can move to it immedately upon reaching destination.
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

		this.pool["blue"] = []
		for(let i = 0; i < ((this.radius * 2) + 1) * ((this.radius * 2) + 1); i++){
			let ni = this.meshes["blue"].createInstance()
			// ni.setEnabled(false)
			this.pool["blue"].push(ni)
		}

		//init player
		this.player = this.meshes.chad
		this.player.tileX = playerTileX
		this.player.tileZ = playerTileZ
		this.playerFollow.position.x = this.tileToWorld(this.player.tileX)
		this.playerFollow.position.z = this.tileToWorld(this.player.tileZ)
		this.player.newRot = 90 * (Math.PI / 180)

		// this.player.position.x = this.tileToWorld(this.player.tileX)
		// this.player.position.z = this.tileToWorld(this.player.tileZ)
		this.player.parent = this.playerFollow

		this.camera.lockedTarget = this.playerFollow
		this.camera.cameraAcceleration = 0.5

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
// if(newInstance !== undefined){
				// newInstance.setEnabled(true)

				newInstance.tileX = this.player.tileX + (x - r)
				newInstance.tileZ = this.player.tileZ + (z - r)

				newInstance.position.x = this.tileToWorld(newInstance.tileX)
				newInstance.position.z = this.tileToWorld(newInstance.tileZ)
				newInstance.position.y = 0

				this.chunk[x][z] = newInstance
			// }
// this.chunk[x][z].setEnabled()

			}
		}
	}

// 	/**
// 	 * Render the tiles around the player by a certain radius
// 	 */ 
// 	renderChunk(chunk, r){
// 		//if this.chunk hasn't been initialized (game just
//     	//started), or if new chunk is a different dimension 
//     	//than previous chunk, remake this.chunk 
//     	if(
//     		this.chunk !== undefined
//     		&& this.chunk.length != (r * 2) + 1)
//     	{
//     		this.chunk = []
//     		for(let x = 0; x < (r * 2) + 1; x++){
//     			let col = []
// 				for(let z = 0; z < (r * 2) + 1; z++){
// 					col.push(null)
// 				}
// 				this.chunk.push(col)
// 			}
//     	}

// 		//dispose all meshes in old chunk
// 		//and reset all entries
// 		for(let x = 0; x < this.chunk.length; x++){
// 			for(let z = 0; z < this.chunk[x].length; z++){
// 				if(this.chunk[x][z] !== null){
// 					this.chunk[x][z].dispose()
// 				}
// 				this.chunk[x][z] = null
// 			}
// 		}

// 		for(let x = 0; x < chunk.length; x++){
// 			for(let z = 0; z < chunk[x].length; z++){

// 				//if tile is off map it will be undefined
// 				if(chunk[x] === null
// 					|| chunk[x][z] === null)
// 				{
// 					continue
// 				}

// 				//convert model ID to model name
// 				let modelName = gloss.IDToModel[chunk[x][z]]

// 				let newInstance = this.meshes[modelName].createInstance()

// 				newInstance.tileX = this.player.tileX + (x - r)
// 				newInstance.tileZ = this.player.tileZ + (z - r)

// 				newInstance.position.x = this.tileToWorld(newInstance.tileX)
// 				newInstance.position.z = this.tileToWorld(newInstance.tileZ)
// 				newInstance.position.y = 0

// 				this.chunk[x][z] = newInstance
// // this.chunk[x][z].setEnabled()

// 			}
// 		}
// 	}

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
     * Rotate degree @currDeg by a certain amount @changeDeg
     */ 
    rotateByDeg(currDeg, changeDeg){
    	return currDeg + (changeDeg * (Math.PI / 180))
    }

	update(){
		this.scene.render()

		if(this.keyState['w'] == true){
			this.player.rotation.y -= 0.1
		}
		if(this.keyState['d'] == true){
			this.camera.rotationOffset -= 0.5
		}
		if(this.keyState['a'] == true){
			this.camera.rotationOffset += 0.5
		}
		if(this.keyState['s'] == true){
			this.player.rotation.y += 0.1
		}

		//increment of movement per frame
    	let moveInc = new BABYLON.Vector3(
    		this.destWorldX - this.playerFollow.position.x,
    		0,
    		this.destWorldZ - this.playerFollow.position.z)
    	.normalize().scale(1)

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

		        //if player wants to find a new path while character is currently
		        //moving, cancel current path, wait until character gets to next
		        //tile in path, then get new path. this will prevent calls to server
		        //happening too frequently.
	        	if(Math.abs(this.destWorldX - this.playerFollow.position.x) 
	        		> Math.abs(moveInc.x)
		    		|| Math.abs(this.destWorldZ - this.playerFollow.position.z) 
		    		> Math.abs(moveInc.z))
		    	{
		    		//flag so we can get new path once we reach the next tile
		    		this.newDestSelected = true
		    		this.newDestSelectedX = tileXHit
		    		this.newDestSelectedZ = tileZHit

		    		//clear next destination if one exists so the player
		    		//will stop moving on the next tile
		    		this.nextDest = [-1, -1]
		        	
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
		    this.keyState["click"] = false
		}

    	//if player hasn't reached next spot, move them
    	if(Math.abs(this.destWorldX - this.playerFollow.position.x) 
    		> Math.abs(moveInc.x)
    		|| Math.abs(this.destWorldZ - this.playerFollow.position.z) 
    		> Math.abs(moveInc.z))
    	{
    		let newRot

    		if(this.player.tileX > this.worldToTile(this.destWorldX)
    			&&
    			this.player.tileZ > this.worldToTile(this.destWorldZ))
    		{
    			newRot = this.negZnegX()
    		}else if(this.player.tileX > this.worldToTile(this.destWorldX)
    			&&
    			this.player.tileZ < this.worldToTile(this.destWorldZ))
    		{
    			newRot = this.posZnegX()
    		}else if(this.player.tileX < this.worldToTile(this.destWorldX)
    			&&
    			this.player.tileZ > this.worldToTile(this.destWorldZ))
    		{
    			newRot = this.negZposX()
    		}else if(this.player.tileX < this.worldToTile(this.destWorldX)
    			&&
    			this.player.tileZ < this.worldToTile(this.destWorldZ))
    		{
    			newRot = this.posZposX()
    		}else if(this.player.tileX > this.worldToTile(this.destWorldX)){
    			newRot = this.negX()
    		}else if(this.player.tileX < this.worldToTile(this.destWorldX)){
    			newRot = this.posX()
    		}else if(this.player.tileZ < this.worldToTile(this.destWorldZ)){
    			newRot = this.posZ()
    		}else if(this.player.tileZ > this.worldToTile(this.destWorldZ)){
    			newRot = this.negZ()
    		}

    		//get y rotation as an angle between 0 and 360
			let pDeg = this.player.newRot * (180 / Math.PI)
			while(pDeg < 0)
				pDeg += 360
			while(pDeg > 360)
				pDeg -= 360
			let nDeg = newRot * (180 / Math.PI)
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
				this.player.newRot = this.rotateByDeg(this.player.newRot, -135)
			}else if(pDeg == 90 && nDeg == 0){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -90)
			}else if(pDeg == 90 && nDeg == 45){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -45)
			}else if(pDeg == 90 && nDeg == 270){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -180)
			}
			//90 right
			else if(pDeg == 90 && nDeg == 135){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 45)
			}else if(pDeg == 90 && nDeg == 180){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
			}else if(pDeg == 90 && nDeg == 225){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
			}
			//135 left
			else if(pDeg == 135 && nDeg == 90){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -45)
			}else if(pDeg == 135 && nDeg == 45){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -90)
			}else if(pDeg == 135 && nDeg == 0){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -135)
			}else if(pDeg == 135 && nDeg == 315){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -180)
			}
			//135 right
			else if(pDeg == 135 && nDeg == 180){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 45)
			}else if(pDeg == 135 && nDeg == 225){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
			}else if(pDeg == 135 && nDeg == 270){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
			}
			//180 left
			else if(pDeg == 180 && nDeg == 135){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -45)
			}else if(pDeg == 180 && nDeg == 90){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -90)
			}else if(pDeg == 180 && nDeg == 45){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -135)
			}else if(pDeg == 180 && nDeg == 0){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -180)
			}
			//180 right
			else if(pDeg == 180 && nDeg == 225){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 45)
			}else if(pDeg == 180 && nDeg == 270){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
			}else if(pDeg == 180 && nDeg == 315){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
			}
			//225 left
			else if(pDeg == 225 && nDeg == 180){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -45)
			}else if(pDeg == 225 && nDeg == 135){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -90)
			}else if(pDeg == 225 && nDeg == 90){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -135)
			}else if(pDeg == 225 && nDeg == 45){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -180)
			}
			//225 right
			else if(pDeg == 225 && nDeg == 270){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 45)
			}else if(pDeg == 225 && nDeg == 315){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
			}else if(pDeg == 225 && nDeg == 0){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
			}
			//270 left
			else if(pDeg == 270 && nDeg == 225){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -45)
			}else if(pDeg == 270 && nDeg == 180){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -90)
			}else if(pDeg == 270 && nDeg == 135){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -135)
			}else if(pDeg == 270 && nDeg == 90){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -180)
			}
			//270 right
			else if(pDeg == 270 && nDeg == 315){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 45)
			}else if(pDeg == 270 && nDeg == 0){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
			}else if(pDeg == 270 && nDeg == 45){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
			}
			//315 left
			else if(pDeg == 315 && nDeg == 270){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -45)
			}else if(pDeg == 315 && nDeg == 225){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -90)
			}else if(pDeg == 315 && nDeg == 180){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -135)
			}else if(pDeg == 315 && nDeg == 135){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -180)
			}
			//315 right
			else if(pDeg == 315 && nDeg == 0){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 45)
			}else if(pDeg == 315 && nDeg == 45){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
			}else if(pDeg == 315 && nDeg == 90){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
			}
			//0 left
			else if(pDeg == 0 && nDeg == 315){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -45)
			}else if(pDeg == 0 && nDeg == 270){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -90)
			}else if(pDeg == 0 && nDeg == 225){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -135)
			}else if(pDeg == 0 && nDeg == 180){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -180)
			}
			//0 right
			else if(pDeg == 0 && nDeg == 45){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 45)
			}else if(pDeg == 0 && nDeg == 90){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
			}else if(pDeg == 0 && nDeg == 135){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
			}
			//45 left
			else if(pDeg == 45 && nDeg == 0){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -45)
			}else if(pDeg == 45 && nDeg == 315){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -90)
			}else if(pDeg == 45 && nDeg == 270){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -135)
			}else if(pDeg == 45 && nDeg == 225){
				this.player.newRot = this.rotateByDeg(this.player.newRot, -180)
			}
			//45 right
			else if(pDeg == 45 && nDeg == 90){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 45)
			}else if(pDeg == 45 && nDeg == 136){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
			}else if(pDeg == 45 && nDeg == 180){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
			}

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
    		}else{
    			//if we selected a new destination mid-path, request
    			//path to that destination
    			if(this.newDestSelected){
		    		this.requestPath(
	    				this.player.tileX,
	    				this.player.tileZ,
	    				this.newDestSelectedX,
	    				this.newDestSelectedZ
	    				)

		    		//unflag
	    			this.newDestSelected = false

	    			//request new chunk (rapid path changing can prevent
	    			//chunk request above from being called)
    				this.requestChunk(this.player.tileX, this.player.tileZ)
	    		}
    		}
    	}

    	//lerptate the player
    	if(Math.abs(this.player.rotation.y - this.player.newRot) > 0.01){
    		let left = this.player.rotation.y - this.player.newRot
    		let right = this.player.newRot - this.player.rotation.y

    		if(left < right)
	    		this.player.rotation.y -= left / 5
	    	else
	    		this.player.rotation.y += right / 5
	    }


   //  	if(this.player !== undefined)
			// this.camera.setTarget(this.playerFollow.position)

		this.ground.position = this.playerFollow.position


		this.camera.radius = 200
		this.camera.heightOffset = 200
		

		// this.camera.position.y = 200
		// this.camera.position.x = this.player.position.x - 100
		// this.camera.position.z = this.player.position.z - 100

		// this.camera.rotation.y += 0.5
		// this.camera.position.x = this.player.position.x - 100
		
		// this.camera.setPosition(new BABYLON.Vector3(
		// 	this.camera.position.x, 
		// 	100, 
		// 	this.camera.position.z))
	}
}

module.exports = Game
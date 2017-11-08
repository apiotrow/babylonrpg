var BABYLON = require('babylonjs')
let perlin = require('perlin-noise')
let gloss = require("../assets/gloss.json")
var sizeof = require('sizeof')
var work = require('webworkify')

class Game{
	constructor(engine, canvas, scene, appW, appH, ws){
		// this.instanceWorker = work(require('./InstanceWorker.js'))
		// this.instanceWorker.addEventListener('message', function (ev) {
		//     console.log(ev.data)
		// })

		this.scene = scene
		this.engine = engine
		this.ws = ws
		this.appW = appW
		this.appH = appH

		//if null, we're on final tile in path.
		//if -1, -1, we're on second-to-last tile in path.
		//if anything else, we're on another spot in path.
		this.nextDest = null

		this.ID

		this.chunk = []
		this.meshes = {}

		this.spacing = 15
		this.radius = 10

		this.newDestSelected = false
		this.selectedDest = [-1, -1]

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
	    var light5 = new BABYLON.HemisphericLight("light3", 
	    	new BABYLON.Vector3(-angles, 1, -angles / 2), scene)
	    light5.intensity = 1.5

		window.addEventListener("resize", function () {
		    engine.resize()
		})
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
    	this.destWorld[0] = this.tileToWorld(x)
		this.destWorld[1] = this.tileToWorld(z)

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

// 		this.pool["blue"] = []
// 		for(let i = 0; i < ((this.radius * 2) + 1) * ((this.radius * 2) + 1); i++){
// 			let ni = this.meshes["blue"].createInstance()
// 			ni.setEnabled(false)
// 			this.pool["blue"].push(ni)
// 		}

// let hh = {hey: 3, sd: function(){console.log("ss")}}
// console.log(JSON.parse(JSON.stringify(hh)))


// 		// This works on all devices/browsers, and uses IndexedDBShim as a final fallback 
// 		var indexedDB = window.indexedDB 
// 		|| window.mozIndexedDB 
// 		|| window.webkitIndexedDB 
// 		|| window.msIndexedDB 
// 		|| window.shimIndexedDB

// 		// Open (or create) the database
// 		var open = indexedDB.open("GameDB", 2)

// 		// Create the schema
// 		open.onupgradeneeded = ()=> {
// 		    var db = open.result

// 		    for(let i in this.pool){
// 		    	var store = db.createObjectStore("MeshInstancess", {keyPath: "MeshName"})
// 		   		// var index = store.createIndex("MeshName", [])
// 		    }
		    
// 		    console.log("upgraded")
// 		}

// 		open.onsuccess = ()=> {
// 		    // Start a new transaction
// 		    var db = open.result
// 		    var tx = db.transaction("MeshInstancess", "readwrite")
// 		    var store = tx.objectStore("MeshInstancess")
// 		    // var index = store.index("MeshName")

// 		    let count = 0
// 		    for(let i in this.pool){
// 		    	// store.put({MeshName:i , this.pool[i]})
// 		    	// store.add({MeshName: i + ":" + (count++) , mesh: this.pool[i]})
// 		    }
// 		    store.put({MeshName: "sss" , mesh: {hsd: "Sss", ssd: 52}})
// 		    store.add({MeshName: "sss" , mesh: hh})

// 		    // Add some data
// 		    // store.put({id: 67890, name: {first: "Bob", last: "Smith"}, age: 35})
		    
// 		    // Query the data
// 		    var getJohn = store.get("sss");
// 		    // var getBob = index.get(["Smith", "Bob"]);

// 		    getJohn.onsuccess = function() {
// 		        console.log(getJohn);  // => "John"
// 		    };


// 		    // // Close the db when the transaction is done
// 		    // tx.oncomplete = function() {
// 		    //     db.close();
// 		    // };

// 		    console.log(db)
// 		}





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
		this.engine.runRenderLoop(()=> {
			this.update()
		})

		  		this.destWorld = []
		//init player destination to their current position
		this.destWorld[0] = this.playerFollow.position.x
    	this.destWorld[1] = this.playerFollow.position.z


    	// this.destWorld[0] = this.tileToWorld(this.player.tileX)
    	// this.destWorld[1] = this.tileToWorld(this.player.tileZ)

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
	

		// setInterval(()=>{
		   	
		// 	}
		// , 100)

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
     * Rotate degree @currDeg by a certain amount @changeDeg
     */ 
    rotateByDeg(currDeg, changeDeg){
    	return currDeg + (changeDeg * (Math.PI / 180))
    }

	update(){
		this.scene.render()

		if(this.keyState['w'] == true){
			this.camera.heightOffset -= 2
		}
		if(this.keyState['d'] == true){
			this.camera.rotationOffset -= 0.5
		}
		if(this.keyState['a'] == true){
			this.camera.rotationOffset += 0.5
		}
		if(this.keyState['s'] == true){
			this.camera.heightOffset += 2
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

		        //if player is currently moving along path and 
				//player wants to find a new path, cancel current path, 
				//wait until character gets to next tile in path,
				//then get new path. this will prevent calls to server
		        //happening too frequently.
	        	if(this.nextDest !== null)
		    	{
		    		//flag so we can get new path once we reach the next tile
		    		this.newDestSelected = true
		    		this.selectedDest = [tileXHit, tileZHit]

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

		//increment of movement per frame
    	let moveInc = new BABYLON.Vector3(
    		this.destWorld[0] - this.playerFollow.position.x,
    		0,
    		this.destWorld[1] - this.playerFollow.position.z)
    	.normalize().scale(1)

    	//if player hasn't reached next spot, move them
    	if(Math.abs(this.destWorld[0] - this.playerFollow.position.x) 
    		> Math.abs(moveInc.x)
    		|| Math.abs(this.destWorld[1] - this.playerFollow.position.z) 
    		> Math.abs(moveInc.z))
    	{
    		let newRot

    		if(this.player.tileX > this.worldToTile(this.destWorld[0])
    			&&
    			this.player.tileZ > this.worldToTile(this.destWorld[1]))
    		{
    			newRot = this.negZnegX()
    		}else if(this.player.tileX > this.worldToTile(this.destWorld[0])
    			&&
    			this.player.tileZ < this.worldToTile(this.destWorld[1]))
    		{
    			newRot = this.posZnegX()
    		}else if(this.player.tileX < this.worldToTile(this.destWorld[0])
    			&&
    			this.player.tileZ > this.worldToTile(this.destWorld[1]))
    		{
    			newRot = this.negZposX()
    		}else if(this.player.tileX < this.worldToTile(this.destWorld[0])
    			&&
    			this.player.tileZ < this.worldToTile(this.destWorld[1]))
    		{
    			newRot = this.posZposX()
    		}else if(this.player.tileX > this.worldToTile(this.destWorld[0])){
    			newRot = this.negX()
    		}else if(this.player.tileX < this.worldToTile(this.destWorld[0])){
    			newRot = this.posX()
    		}else if(this.player.tileZ < this.worldToTile(this.destWorld[1])){
    			newRot = this.posZ()
    		}else if(this.player.tileZ > this.worldToTile(this.destWorld[1])){
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
			}else if(pDeg == 45 && nDeg == 135){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
			}else if(pDeg == 45 && nDeg == 180){
				this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
			}

    		//continue moving toward destination
    		this.playerFollow.position = this.playerFollow.position.add(moveInc)
    	}else{
    		// //player arrived at next spot. change their tile coords.
    		this.player.tileX = this.worldToTile(this.destWorld[0])
    		this.player.tileZ = this.worldToTile(this.destWorld[1])

    		//if we're currently moving
    		if(this.nextDest !== null){
    			//the next tile isn't the final spot
    			if(this.nextDest[0] != -1 && this.nextDest[1] != -1){
    				//set new destination
	    			this.getNextInPath(this.nextDest[0], this.nextDest[1])

	    			//incremement movement for this frame to prevent
	    			//stop/go jerkiness
	    			this.playerFollow.position = this.playerFollow.position.add(moveInc)

	    			//request new chunk
	    			this.requestChunk(this.player.tileX, this.player.tileZ)
    			//if next tile IS final spot
    			}else if(this.nextDest[0] == -1 && this.nextDest[1] == -1){
    				//nullify path
    				this.nextDest = null

	    			//request new chunk
	    			this.requestChunk(this.player.tileX, this.player.tileZ)
    			}

    			//if we selected a new destination mid-path, request
    			//path to that destination
    			if(this.newDestSelected){
		    		this.requestPath(
	    				this.player.tileX,
	    				this.player.tileZ,
	    				this.selectedDest[0],
	    				this.selectedDest[1]
	    				)

		    		//unflag
	    			this.newDestSelected = false
	    		}
    		}
    	}


    		let x = 15 - (this.player.tileX - this.radius)
    		let z = 15 - (this.player.tileZ - this.radius)
    		if(this.chunk[x] !== undefined
    			&& this.chunk[x][z] !== undefined
    			&& this.chunk[x][z] !== null)
    		this.chunk[x][z].position.y = 10

    	//lerptate the player
    	if(Math.abs(this.player.rotation.y - this.player.newRot) > 0.01){
    		let left = this.player.rotation.y - this.player.newRot
    		let right = this.player.newRot - this.player.rotation.y

    		if(left < right)
	    		this.player.rotation.y -= left / 5
	    	else
	    		this.player.rotation.y += right / 5
	    }

	    //have ground object follow player
		this.ground.position = this.playerFollow.position

		//update camera height and radius from player
		this.camera.radius = 200

		//camera zoom in/out functionality
		if(this.keyState['zoomIn']){
			this.cameraOrtho(++this.orthoSize)
			this.keyState['zoomIn'] = false
		}else if (this.keyState['zoomOut']){
			this.cameraOrtho(--this.orthoSize)
			this.keyState['zoomOut'] = false
		}
	}
}

module.exports = Game
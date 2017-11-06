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
		
		let divisor = 8
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
		this.player.newRot = 90 * (Math.PI / 180)

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

    faceNegZ(mesh){
		mesh.rotation.y = this.negZ()
    }

    facePosZ(mesh){
		mesh.rotation.y = this.posZ()
    }

    facePosX(mesh){
		mesh.rotation.y = this.posX()
    }

    faceNegX(mesh){
    	mesh.rotation.y = this.negX()
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

    rotateByDeg(currDeg, changeDeg){
    	return currDeg + (changeDeg * (Math.PI / 180))
    }

    changeRot(pDeg, nDeg, origRot){
		//        0   1   2   3    4    5    6    7
		let ca = [0, 45, 90, 135, 180, 225, 270, 315]

		let begin = ca.indexOf(pDeg)
		let end = ca.indexOf(nDeg)

		let rightCount = 0
		let iter = begin
		let eightCount = 0

		while(eightCount < 8){
			if(nDeg == ca[iter])
				break
			else
				rightCount++

			if(iter == 7)
				iter = 0
			else
				iter++

			eightCount++
		}

		let leftCount = 0
		iter = begin
		eightCount = 0

		while(eightCount < 8){
			if(nDeg == ca[iter])
				break
			else
				leftCount++

			if(iter == 0)
				iter = 7
			else
				iter--

			eightCount++
		}

		// console.log("leftCount: " + leftCount + ", rightCount: " + rightCount)


		// let angleChange = ((leftCount < rightCount) ? leftCount : rightCount)

		

		if(leftCount < rightCount){
			console.log(leftCount * -45)
			return this.rotateByDeg(origRot, leftCount * -45)
		}else{
			console.log(rightCount * 45)
			return this.rotateByDeg(origRot, rightCount * 45)
		}

		
		// return origRot + (angleChange * (Math.PI / 180))


		// let angleChange
		// if(Math.abs(end - begin) < 5)
		// 	angleChange = (end - begin) * 45
		// else
		// 	angleChange = (ca.length - begin) + end

		// return origRot + (angleChange * (Math.PI / 180))

		// //180 left
		// if(pDeg == initRot && nDeg == ca[ca.indexOf(initRot) - 1]){
		// 	return this.rotateByDeg(this.player.newRot, -45)
		// }else if(pDeg == 180 && nDeg == 90){
		// 	this.player.newRot = this.rotateByDeg(this.player.newRot, -90)
		// }else if(pDeg == 180 && nDeg == 45){
		// 	this.player.newRot = this.rotateByDeg(this.player.newRot, -135)
		// }else if(pDeg == 180 && nDeg == 0){
		// 	this.player.newRot = this.rotateByDeg(this.player.newRot, -180)
		// }
		// //180 right
		// else if(pDeg == 180 && nDeg == 225){
		// 	this.player.newRot = this.rotateByDeg(this.player.newRot, 45)
		// }else if(pDeg == 180 && nDeg == 270){
		// 	this.player.newRot = this.rotateByDeg(this.player.newRot, 90)
		// }else if(pDeg == 180 && nDeg == 315){
		// 	this.player.newRot = this.rotateByDeg(this.player.newRot, 135)
		// }
	}

	update(){
		this.scene.render()


		if(this.keyState['w'] == true){
			this.player.rotation.y -= 0.1
			// this.player.newRot = this.negX()
		}
		if(this.keyState['d'] == true){
			this.camera.rotationOffset -= 0.5
		}
		if(this.keyState['a'] == true){
			this.camera.rotationOffset += 0.5
		}
		if(this.keyState['s'] == true){
			this.player.rotation.y += 0.1
			// this.player.newRot = this.negZposX()
		}

		// let rot = (this.player.rotation.y /  Math.PI / 2) 
		// - Math.floor(this.player.rotation.y /  Math.PI / 2)

		

		// let ninety = (this.negX() /  Math.PI / 2) 
		// - Math.floor(this.negX() /  Math.PI / 2)

		// let threefifteen = (this.negZposX() /  Math.PI / 2) 
		// - Math.floor(this.negZposX() /  Math.PI / 2)

		// console.log(ninety + (1 - threefifteen))
		// console.log(threefifteen + (1 - ninety))

		// let vec1 = new BABYLON.Vector3(0, this.negX(), 0)
		// let vec2 = new BABYLON.Vector3(0, this.posZ(), 0)

		// console.log(Math.acos(BABYLON.Vector3.Dot(vec1, vec2) / Math.abs(vec1) ))

		// console.log(Math.atan2(vec2.y, vec1.x) - Math.atan2(vec2.y, vec1.y))
		// console.log(vec2.subtract(vec1).y * (180 / Math.PI))

		// console.log(BABYLON.Vector3.Dot(vec1, vec2))
		// let lefty = rot

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

    		// console.log(this.player.newRot * (180 / Math.PI))

   //  		let pDeg = this.player.newRot * (180 / Math.PI)

			// while(pDeg < 0)
			// 	pDeg += 360
			// while(pDeg > 360)
			// 	pDeg -= 360

			// let nDeg = newRot * (180 / Math.PI)

			// while(nDeg < 0)
			// 	nDeg += 360
			// while(nDeg > 360)
			// 	nDeg -= 360

			// console.log(pDeg + ", " + nDeg)

			// if(nDeg > pDeg){
			// 	if(pDeg + (360 - nDeg) < (nDeg - pDeg)){
			// 		this.player.rotDir = "left"
			// 	}
			// }else{
			// 	if(nDeg + (360 - pDeg) < (pDeg - nDeg)){
			// 		this.player.rotDir = "right"
			// 	}
			// }


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

			let left = this.player.newRot - newRot
    		let right = newRot - this.player.newRot
			
			if(pDeg > 180){
				if(nDeg < pDeg && nDeg > pDeg - 180){
					this.player.rotDir = "left"
				}else{
					this.player.rotDir = "right"
				}
			}else{
				if(nDeg > pDeg && nDeg < pDeg + 180){
					this.player.rotDir = "right"
				}else{
					this.player.rotDir = "left"
				}
			}

			pDeg = Math.floor(pDeg)
			nDeg = Math.floor(nDeg)
			console.log(pDeg + " , " + nDeg)

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






















			// this.player.newRot = this.changeRot(pDeg, nDeg, this.player.newRot)

			




			// console.log(this.player.newRot)

			// if(pDeg == 90 
			// 	&& 
			// 	nDeg == 0 || nDeg == 315 || nDeg == 270 || nDeg == 45)
			// {
			// 	this.player.rotDir = "left"
			// }else{
			// 	this.player.rotDir = "right"
			// }

			
			// this.player.rotate(BABYLON.Axis.Y, -Math.PI / 2, BABYLON.Space.WORLD)

			let leftInterval = this.player.rotation.y - Math.PI
			let rightInterval = this.player.rotation.y + Math.PI


			// this.player.rotation.y = newRot
    		// this.player.newRot = newRot


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




    	if(Math.abs(this.player.rotation.y - this.player.newRot) > 0.01){

    		

    		// let leftDeg = (this.player.rotation.y - this.player.newRot) * (Math.PI / 180)
    		// let rightDeg = (this.player.newRot - this.player.rotation.y) * (Math.PI / 180)

    		

    		// let newRot = new BABYLON.Vector3(
    		// 	this.player.rotation.x,
    		// 	this.player.newRot,
    		// 	this.player.rotation.z
    		// 	)



			

    		let left = this.player.rotation.y - this.player.newRot
    		let right = this.player.newRot - this.player.rotation.y

    		if(left < right)
	    		this.player.rotation.y -= left / 5
	    	else
	    		this.player.rotation.y += right / 5



			// if(this.player.rotDir == "left"){
			// 	this.player.rotation.y -= 1 *  (Math.PI / 180)

			// }else if(this.player.rotDir == "right"){
			// 	this.player.rotation.y += 1 *  (Math.PI / 180)
			// }



    		// if(this.player.rotation.y - this.player.newRot < 0)
	    	// 	this.player.rotation.y -= (this.player.rotation.y - this.player.newRot) / 5
	    	// else
	    	// 	this.player.rotation.y += (this.player.newRot - this.player.rotation.y) / 5
	    
	    	// let left = (this.player.rotation.y * (180 / Math.PI))
	    	// + 360 - 

			// let nn = (this.player.newRot /  Math.PI / 2) 
			// 	- Math.floor(this.player.newRot /  Math.PI / 2)



	  //   	if(pl + (1 - nn) < nn + (1 - pl)){
	  //   		this.player.rotation.y -= (left) / 5
	  //   	}else{
	  //   		this.player.rotation.y += (right) / 5
	  //   	}


// 		  	let pDeg = this.player.rotation.y * (180 / Math.PI)

// 			while(pDeg < 0)
// 				pDeg += 360
// 			while(pDeg > 360)
// 				pDeg -= 360

// 			let nDeg = this.player.newRot * (180 / Math.PI)

// 			while(nDeg < 0)
// 				nDeg += 360
// 			while(nDeg > 360)
// 				nDeg -= 360


			// let left = this.player.rotation.y - this.player.newRot
   //  		let right = this.player.newRot - this.player.rotation.y
			
// // console.log(pDeg + ", " + nDeg)
// 			if(pDeg > 180){
// 				if(nDeg < pDeg && nDeg > pDeg - 180){
// 					this.player.rotation.y -= left / 5
// 				}else{
// 					this.player.rotation.y += right / 5
// 				}
// 			}else{
// 				if(nDeg > pDeg && nDeg < pDeg + 180){console.log("right")
// 					//right
// 					this.player.rotation.y += (5 / 5) * (Math.PI / 180)
// 				}else{console.log("left")
// 					//left
// 					this.player.rotation.y -= (5 / 5) *  (Math.PI / 180)
// 				}
// 			}
// 			let left = this.player.rotation.y - this.player.newRot
//     		let right = this.player.newRot - this.player.rotation.y

// console.log(this.player.rotation.y *  (180 / Math.PI))




	    }

			// let nn = (this.player.rotation.y  * (180 / Math.PI)) 
			// - Math.floor(this.player.rotation.y * (180 / Math.PI))




    	// this.player.rotation = new BABYLON.Vector3.Lerp(
    	// 	this.player.rotation,
    	// 	new BABYLON.Vector3(
    	// 		this.player.rotation.x,
    	// 		90,
    	// 		this.player.rotation.y),
    	// 	0.0001)




   //  	if(this.player !== undefined)
			// this.camera.setTarget(this.playerFollow.position)

		this.ground.position = this.playerFollow.position

		if(this.camType == "FollowCamera"){
			this.camera.radius = 200
			this.camera.heightOffset = 200
			

			// this.camera.position.y = 200
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
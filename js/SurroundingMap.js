var BABYLON = require('babylonjs')
let gloss = require("../assets/gloss.json")

class SurroundingMap{
	constructor(game, radius, mapD){
		this.game = game
		this.radius = radius
		this.mapD = mapD

		this.surround = []
		for(let x = 0; x < (this.radius * 2) + 1; x++){
			let col = []
			for(let z = 0; z < (this.radius * 2) + 1; z++){
				col.push(null)
			}
			this.surround.push(col)
		}

		// this.requestChunk(game.player.tileX, game.player.tileZ)

		this.wegot = {}

		this.requestMissingTiles(game.player.tileX, game.player.tileZ)
	}

	requestMissingTiles(playerx, playerz){
		// for(let x = 0; x < this.surround.length; x++){
		// 	for(let z = 0; z < this.surround[x].length; z++){
		// 		if(this.surround[x + 1] !== undefined
		// 			&& this.surround[x + 1][z] !== undefined)
		// 		{
		// 			this.surround[x][z] = this.surround[x + 1][z]
		// 		}else{
		// 			this.surround[x][z] = null
		// 		}

		// 		let p = BABYLON.Vector3.Project(new BABYLON.Vector3(0, 0, 0), 
		// 	BABYLON.Matrix.Identity(), 
		// 	this.game.camera.getViewMatrix().multiply(this.game.camera.getProjectionMatrix()),
  //           this.game.camera.viewport.toGlobal(this.game.engine.getRenderWidth(), 
  //           this.game.engine.getRenderHeight()))
		// 	}
		// }


		let p = BABYLON.Vector3.Project(
			new BABYLON.Vector3(
				this.game.tileToWorld(playerx), 
				2, 
				this.game.tileToWorld(playerz)), 
			BABYLON.Matrix.Identity(), 
			this.game.camera.getViewMatrix().multiply(this.game.camera.getProjectionMatrix()),
            this.game.camera.viewport.toGlobal(this.game.engine.getRenderWidth(), 
            this.game.engine.getRenderHeight()))


		let putX = this.game.worldToTile(this.game.tileToWorld(playerx) + 40)
		let putZ = this.game.worldToTile(this.game.tileToWorld(playerz) + 40)
		let mess = {
			h: "mapData",
			v: {
				tile: [putX, putZ]
			}
		}
		this.game.ws.send(JSON.stringify(mess))






let h = new Set()
h.add(JSON.stringify([4,3]))
// console.log(h.has(JSON.stringify("[4,3]")))

// console.log(JSON.parse("[4,3]"))




		// for(let x = playerx - this.radius; x < playerx + this.radius; x++){
		// 	for(let z = playerz - this.radius; z < playerz + this.radius; z++){
		// 		if(this.surround[x] === undefined
		// 			|| this.surround[x][z] === undefined){
		// 			continue
		// 		}

		// 		if(this.surround[x][z] === null){

		// 			//if tile is in bounds
		// 			if(x > 0 && z > 0
		// 				&& x < this.mapD && z < this.mapD)
		// 			{
		// 				let mess = {
		// 					h: "mapData",
		// 					v: {
		// 						tile: [x, z]
		// 					}
		// 				}
		// 				this.game.ws.send(JSON.stringify(mess))
		// 			}
		// 		}
		// 	}
		// }
	}

	placeTile(x, z, tileID){
		let modelName = gloss.IDToModel[tileID]
		let newInstance = this.game.meshes[modelName].createInstance()
		newInstance.tileX = x
		newInstance.tileZ = z

		newInstance.position.x = this.game.tileToWorld(x)
		newInstance.position.z = this.game.tileToWorld(z)
		newInstance.position.y = 0

		if(this.wegot[x] === undefined){
			this.wegot[x] = {}
		}
		if(this.wegot[x][z] === undefined){
			this.wegot[x][z] = newInstance
		}


		for(let xw in this.wegot){
			for(let zw in this.wegot[xw]){
				let pos = BABYLON.Vector3.Project(
					new BABYLON.Vector3(
						this.game.tileToWorld(xw), 
						2, 
						this.game.tileToWorld(zw)),
					BABYLON.Matrix.Identity(), 
					this.game.camera.getViewMatrix().multiply(this.game.camera.getProjectionMatrix()),
		            this.game.camera.viewport.toGlobal(this.game.engine.getRenderWidth(), 
		            this.game.engine.getRenderHeight()))

		            if(pos.x < 0 || pos.x > this.game.appW
		            	|| pos.y < 0 || pos.y > this.game.appH){
		            	this.wegot[xw][zw].dispose()
		            }
			}
		}

		// this.surround[x][z] = newInstance
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
		this.game.ws.send(JSON.stringify(mess))
	}
}
module.exports = SurroundingMap
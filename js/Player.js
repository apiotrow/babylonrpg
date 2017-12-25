var BABYLON = require('babylonjs')
let gloss = require("../assets/gloss.json")

class Player{
	constructor(game, playerTileX, playerTileZ){
		this.mesh = new BABYLON.Mesh()
		this.animation = "walk"

		this.vehicle = new BABYLON.Mesh()
		this.parent = this.vehicle

		this.runAnim(game)

		this.tileX = playerTileX
		this.tileZ = playerTileZ
		this.vehicle.position.x = game.tileToWorld(this.tileX)
		this.vehicle.position.z = game.tileToWorld(this.tileZ)
		this.newAngle = 90 * (Math.PI / 180)

		//if null, we're on final tile in path.
		//if -1, -1, we're on second-to-last tile in path.
		//if anything else, we're on another spot in path.
		this.nextDest = null

		this.mesh.parent = this.vehicle
	}

	runAnim(game){
		let animFrame = 0

		let frameInstances = {}
		for(let i in gloss.modelHier.char.chad[this.animation]){
			let animFrameName = gloss.modelHier.char.chad[this.animation][i]
			let newMesh = game.meshes[animFrameName].createInstance()
			frameInstances[i] = newMesh
			newMesh.parent = this.mesh
		}

		let hat = gloss.modelHier.char.hat
		let hatMesh = game.meshes[hat].createInstance()
		hatMesh.parent = this.mesh

		let cape = gloss.modelHier.char.cape
		let capeMesh = game.meshes[cape].createInstance()
		capeMesh.parent = this.mesh

		for(let i in frameInstances){
			frameInstances[i].setEnabled(false)
		}

		setInterval(()=>{
			animFrame++
			if(gloss.modelHier.char.chad[this.animation][animFrame] === undefined)
				animFrame = 0
				let animFrameName = gloss.modelHier.char.chad[this.animation][animFrame]

				for(let i in frameInstances){
					if(i == animFrame){
						frameInstances[i].setEnabled(true)
					}
					else{
						frameInstances[i].setEnabled(false)
					}
				}
		}, 100)
	}
}
module.exports = Player
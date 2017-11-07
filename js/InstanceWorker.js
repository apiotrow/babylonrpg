let BABYLON = require('babylonjs')
let gloss = require("../assets/gloss.json")

module.exports = function (self) {
	let meshes = {}

	let assetsManager = new BABYLON.AssetsManager(scene)
	assetsManager.useDefaultLoadingScreen = false

	for(let i in gloss.models){
		assetsManager.addMeshTask(i, "", "", gloss.models[i].path)
	}

	assetsManager.load()

	assetsManager.onFinish = (tasks)=> {
		gameInstance.initGame(tasks, playerTileX, playerTileZ)
 	}

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
		meshes[meshName] = mesh
	}

    self.addEventListener('message', (ev)=>{
    	let data = ev.data
        
        if(data.h == "instance"){
   //      	let chunk = data.v.chunk
   //      	let r = data.v.r

			// for(let x = 0; x < chunk.length; x++){
			// 	for(let z = 0; z < chunk[x].length; z++){

			// 		//if tile is off map it will be undefined
			// 		if(chunk[x] === null
			// 			|| chunk[x][z] === null)
			// 		{
			// 			continue
			// 		}

			// 		//convert model ID to model name
			// 		let modelName = gloss.IDToModel[chunk[x][z]]

			// 		let newInstance = this.meshes[modelName].createInstance()

			// 		newInstance.tileX = this.player.tileX + (x - r)
			// 		newInstance.tileZ = this.player.tileZ + (z - r)

			// 		newInstance.position.x = this.tileToWorld(newInstance.tileX)
			// 		newInstance.position.z = this.tileToWorld(newInstance.tileZ)
			// 		newInstance.position.y = 0

			// 		this.chunk[x][z] = newInstance
			// 	}
			// }
        }
    })
}
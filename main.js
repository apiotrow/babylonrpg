document.addEventListener('DOMContentLoaded', function () {
	// var BABYLON = require('babylonjs')
	// var BABYLON = require('./node_modules/babylonjs/dist/preview release/babylon.max.js')
	var test = require('./js/test.js')
	// var CellMaterial = require('./assets/babylon.cellMaterial.js')

	

	// var assetnames = []
	// for(var i in assets){
	// 	assetnames.push(i)
	// }

	// var promises = []
	// var assetmeshes = {}
	// for(var i = 0; i < assetnames.length; i++){
		// promises.push(
		// 	new Promise(function(resolve, reject) {
		// 		var file = assetnames[i];
		// 		new THREE.CTMLoader().load(file, (geometry)=> {
		// 			var material = new THREE.MeshPhongMaterial({
		// 	        	wireframe: false, 
		// 	        	shading: THREE.FlatShading, 
		// 	        	vertexColors: THREE.VertexColors,
		// 	        	shininess: 0
		// 	        });

		// 	        geometry.computeFaceNormals();
		// 	        geometry.computeVertexNormals();

		// 	        var obj = new THREE.Mesh(geometry, material);

		// 	        pokemde.rotateLocal(obj, -90, 0, 0)

		// 	        file = file.replace("assets/","")
		// 			assetmeshes[file] = obj
		// 			resolve();
		// 		})
		// 	})
		// )
	// }
	// Promise.all(promises).then(function(){
		var canvas = document.getElementById("game")
		var engine = new BABYLON.Engine(canvas, true)
		engine.enableOfflineSupport = false //prevent babylon.manifest error
		var scene = new BABYLON.Scene(engine)


		var assetsManager = new BABYLON.AssetsManager(scene)
		assetsManager.useDefaultLoadingScreen = false
		assetsManager.addMeshTask("tree", "", "./assets/", "models/tree1.babylon")
		assetsManager.addMeshTask("grass", "", "./assets/", "models/grass.babylon")
		assetsManager.addMeshTask("bugsports", "", "./assets/", "models/bugsports.babylon")
		assetsManager.addMeshTask("bugsports2", "", "./assets/", "models/bugsports2.babylon")
		assetsManager.addMeshTask("chamonix", "", "./assets/", "models/chamonix.babylon")


		// var grassTask = assetsManager.addMeshTask("grass", "", "./assets/", "models/grass.babylon")
		// grassTask.onSuccess = function (task) {
		// 	var cell = new BABYLON.CellMaterial("cell", scene)
			
		// 	cell.diffuseTexture = new BABYLON.Texture("./assets/3dd.jpg", scene)
		// 	cell.computeHighLevel = true
		// 	cell.diffuseTexture.uScale = cell.diffuseTexture.vScale = 3;

		// 	// cell.pointsCloud = true
		// 	// cell.pointSize = 50
		// 	// cell.wireframe = true

		// 	//set root object position`
		// 	task.loadedMeshes[0].position = BABYLON.Vector3.Zero()

		// 	console.log(task)

		// 	for(let i = 0; i < task.loadedMeshes.length; i ++){
		// 		// task.loadedMeshes[i].useVertexColors = true
		// 		task.loadedMeshes[i].material = cell

		// 		// task.loadedMeshes[i].outlineWidth = 0.15
		// 		// task.loadedMeshes[i].outlineColor = new BABYLON.Color4(0, 0, 0, 1)
		// 		// task.loadedMeshes[i].renderOutline = true
				
		// 		// task.loadedMeshes[i].enableEdgesRendering()
		// 		// task.loadedMeshes[i].edgesWidth = 30.0;
		// 		// task.loadedMeshes[i].edgesColor = new BABYLON.Color4(0, 0, 0, 1)

		// 		task.loadedMeshes[i].convertToFlatShadedMesh()
		// 	}

		// 	let d = 100
		// 	let spacing = 15
		// 	for(let i = 0; i < d; i++){
  //   			for(let j = 0; j < d; j++){
  //   				var newInstance = task.loadedMeshes[0].createInstance("index: " + i + "" + j)
  //   				newInstance.position.x =+ i * spacing
  //   				newInstance.position.z =+ j * spacing

  //   	// 			newInstance.enableEdgesRendering()
		// 		 //   	newInstance.edgesWidth = 30.0;
		// 			// newInstance.edgesColor = new BABYLON.Color4(0, 0, 0, 1)
  //   			}
		// 	}
		// }

		// var textureTask = assetsManager.addTextureTask("imagetask", "./assets/dd.jpg");
		assetsManager.load()

		var test
		assetsManager.onFinish = function(tasks) {
         	test = new test(engine, canvas, scene, tasks)
     	}


		

		
	// })

})
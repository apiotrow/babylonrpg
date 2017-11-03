

document.addEventListener('DOMContentLoaded', function () {
	var BABYLON = require('babylonjs')
	var test = require('./js/test.js')

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
		assetsManager.addMeshTask("concrete", "", "./assets/", "models/concrete.babylon")
		assetsManager.addMeshTask("water", "", "./assets/", "models/water.babylon")
		assetsManager.addMeshTask("chad", "", "./assets/", "models/chad.babylon")

		assetsManager.load()

		var test
		assetsManager.onFinish = function(tasks) {
         	test = new test(engine, canvas, scene, tasks)
     	}
})
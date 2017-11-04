
// browserify js/Main.js -o client.js
// 
// 
//for development. causes changes to server.js to reload browser
let server
var isNode = new Function("try {return this===global;}catch(e){return false;}")
if(isNode())
	server = require('../server.js')

//glossary
let gloss = require("../assets/gloss.json")

document.addEventListener('DOMContentLoaded', function () {
	var BABYLON = require('babylonjs')
	var Game = require('./Game.js')

	var canvas = document.getElementById("game")
	var engine = new BABYLON.Engine(canvas, true)
	engine.enableOfflineSupport = false //prevent babylon.manifest error
	var scene = new BABYLON.Scene(engine)

	this.ws = new WebSocket("ws://127.0.0.1:5000/")

	this.ws.onopen = ()=>{
		// console.log("op")
	}

	this.ws.onmessage = (event)=> {
		let data = JSON.parse(event.data)

		if(data.header == "initData"){
			let map = data.value

			var assetsManager = new BABYLON.AssetsManager(scene)
			assetsManager.useDefaultLoadingScreen = false

			for(let i in gloss.models){
				assetsManager.addMeshTask(i, "", "", gloss.models[i].path)
			}

			assetsManager.load()

			let go
			assetsManager.onFinish = function(tasks) {
		     	go = new Game(engine, canvas, scene, tasks, map)
		 	}
		}
	}	
})
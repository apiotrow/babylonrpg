
// browserify js/Main.js -o client.js
// 
// 
//for development. causes changes to server.js to reload browser
let server
var isNode = new Function("try {return this===global;}catch(e){return false;}")
if(isNode())
	server = require('../server.js')

var sizeof = require('sizeof')

//glossary
let gloss = require("../assets/gloss.json")

document.addEventListener('DOMContentLoaded', function () {
	let BABYLON = require('babylonjs')
	let Game = require('./Game.js')

	let appH = 600
	let appW = 800
	let canvas = document.getElementById("game")
	canvas.style.width = appW + "px"
	canvas.style.height = appH + "px"
	let engine = new BABYLON.Engine(canvas, true)
	engine.enableOfflineSupport = false //prevent babylon.manifest error
	let scene = new BABYLON.Scene(engine)

	let ws = new WebSocket("ws://127.0.0.1:5000/")

	let playerTileX = 1
	let playerTileZ = 3
	let gameInstance = new Game(
 		engine, canvas, scene,
 		appW, appH,
 		ws)

	ws.onopen = ()=>{
		let playerID = Math.random()
		let mess = {
			h: "login",
			v: playerID
		}
		gameInstance.ID = playerID
		ws.send(JSON.stringify(mess))

		let assetsManager = new BABYLON.AssetsManager(scene)
		assetsManager.useDefaultLoadingScreen = false

		for(let i in gloss.models){
			assetsManager.addMeshTask(i, "", "", gloss.models[i].path)
		}

		assetsManager.load()

		assetsManager.onFinish = (tasks)=> {
			gameInstance.initGame(tasks, playerTileX, playerTileZ)
	 	}
	}

	ws.onmessage = (event)=> {
		if(event.data instanceof Blob){
			//reader for converting from binary to JSON
			const reader = new FileReader()

			//if server sent binary, convert to JSON
			reader.addEventListener('loadend', (e) => {
			  	let data = JSON.parse(e.srcElement.result)
			  	messageAction(data)
			})

			reader.readAsText(event.data)
		}
		else if(typeof event.data === 'string' || event.data instanceof String){
			let data = JSON.parse(event.data)
			messageAction(data)
		}
	}

	//what to do with message from server
	function messageAction(data){
		if(data.h == "chunk"){
			gameInstance.renderChunk(data.v.chunk, data.v.r)
		}

		if(data.h == "path"){
			gameInstance.getNextInPath(data.v[0], data.v[1])
		}

		if(data.h == "nextInPath"){
			gameInstance.prepareNextDest(data.v[0], data.v[1])
		}
	}
})
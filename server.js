"use strict"

const express = require('express')
const SocketServer = require('ws').Server
const path = require('path')
const cors = require('cors')
let jsonfile = require('jsonfile')
let easystarjs = require('easystarjs')

let gloss = require("./assets/gloss.json")

let fs = require('fs')

//setup server
let http = require("http")
let app = express()
const PORT = process.env.PORT || 5000

const corsOptions = {
  origin: '*'
}
app.use(cors(corsOptions))

app.use(express.static(__dirname))

let httpserver = http.createServer(app).listen(PORT)
const wss = new SocketServer({server: httpserver})

let map = []
let aStarMap = []
let d = 300
for(let x = 0; x < d; x++){
	let col = []
	let aStarMapCol = []
	for(let z = 0; z < d; z++){
		let tile = {}
		tile.name = "blue"
		tile.walkable = 1
		col.push(tile)

		if(tile.walkable == 1)
			aStarMapCol.push(1)
		else
			aStarMapCol.push(0)
	}
	map.push(col)
	aStarMap.push(aStarMapCol)
}

let es = new easystarjs.js()
es.setAcceptableTiles(1)
es.enableDiagonals()
es.disableCornerCutting()
es.setIterationsPerCalculation(100) //set low to prevent framerate drops
es.setGrid(aStarMap)

let players = {}


wss.on('connection', function connection(ws, req){
	ws.on('message', function incoming(message){
		let data = JSON.parse(message)
		let h = data.h

		if(h == "login"){
			players[data.v] = {}
		}

		//player request chunk of map around him
		if(h == "chunk"){
			let tileX = data.v.cent[0]
			let tileZ = data.v.cent[1]

			let r = data.v.r

			let chunk = []

			for(let x = tileX - r; x < tileX + r + 1; x++){
				let col = []
				for(let z = tileZ - r; z < tileZ + r + 1; z++){
					//if tile is off map it will be undefined
					if(map[x] === undefined
						|| map[x][z] === undefined)
					{
						col.push(null)
						continue
					}
					col.push(gloss.modelToID[map[x][z].name])
				}
				chunk.push(col)
			}

			let chunkSend = {
				h: "chunk",
				v: {
					chunk: chunk,
					r: r
				}
			}

			sendMessage(ws, JSON.stringify(chunkSend))
		}

		//player request next spot in path
		if(h == "nextInPath"){
			players["pathIter"]++

			//if there's another place in path for player to go,
			//send it. otherwise send -1,-1 as the next spot, which
			//the player will take as a declaration that they've reached
			//the final spot in the path.
			if(players[data.v].path[players["pathIter"]] !== undefined){
				let pathSend = {
					h: "nextInPath",
					v: [
					players[data.v].path[players["pathIter"]].x, 
					players[data.v].path[players["pathIter"]].y
					]
				}
				sendMessage(ws, JSON.stringify(pathSend))
			}else{
				let pathSend = {
					h: "nextInPath",
					v: [
					-1, 
					-1
					]
				}
				sendMessage(ws, JSON.stringify(pathSend))
			}
		}

		//player requests to move
		if(h == "path"){
			let playerX = data.v.px
			let playerZ = data.v.pz

			let destX = data.v.dx
			let destZ = data.v.dz

			let pID = data.v.ID

			if(map[destX] === undefined || map[destX][destZ] === undefined
				|| map[playerX] === undefined || map[playerX][playerZ] === undefined)
				return

			es.findPath(playerX, playerZ, destX, destZ, (path)=>{
				if(path == null){
					return
				}

				let pathArr = []
				for(let i = 0; i < path.length; i++){
					pathArr.push(path[i].x)
					pathArr.push(path[i].y)
				}

				players["pathIter"] = 1
				if(path[players["pathIter"]] !== undefined){
					players[pID].path = path

					let pathSend = {
						h: "path",
						v: [
						players[pID].path[players["pathIter"]].x, 
						players[pID].path[players["pathIter"]].y
						]
					}

					sendMessage(ws, JSON.stringify(pathSend))
				}
			})

			es.calculate()
		}
	})
})

function sendMessage(reciever, whatToSend){
	if(reciever.readyState === reciever.OPEN){

		//simulate latency
		setTimeout(()=>{
			reciever.send(whatToSend)
		}, 100)

		// reciever.send(whatToSend)
	}
}

function objectIsEmpty(obj){
	return (Object.keys(obj).length === 0 && obj.constructor === Object)
}

function hasProp(obj, prop){
	if(typeof obj[prop] === 'undefined'){ 
		return false
	}else if(typeof obj[prop] !== 'undefined'){
		return true
	}
}
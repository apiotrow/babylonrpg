"use strict"

const express = require('express')
const SocketServer = require('ws').Server
const path = require('path')
const cors = require('cors')
let jsonfile = require('jsonfile')
let easystarjs = require('easystarjs')
var sizeof = require('sizeof')

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
let d = 300
for(let x = 0; x < d; x++){
	let col = []
	for(let z = 0; z < d; z++){
		let tile = {}

		if(Math.random() < 0.7){
			tile.name = "blue"
			tile.walkable = 1
		}
		else{
			tile.name = "chair1"
			tile.walkable = 0
		}
		col.push(tile)
	}
	map.push(col)
}

let aStarMap = []
//fill in pathfinding map
for(let x = 0; x < d; x++){
	let aStarMapCol = []
	for(let z = 0; z < d; z++){
		//z and x have to be reversed for eaststar to
		//represent map correctly
		if(map[z][x].walkable == 1)
			aStarMapCol.push(1)
		else
			aStarMapCol.push(0)
	}
	aStarMap.push(aStarMapCol)
}

let es = new easystarjs.js()
es.setAcceptableTiles(1)
es.enableDiagonals()
es.disableCornerCutting()
es.setIterationsPerCalculation(100) //set low to prevent framerate drops
es.setGrid(aStarMap)

let players = {}

//for accumulating number of bytes sent
let mb = 0

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

/**
 * Convert a string to ArrayBuffer to reduce size
 * before sending to client.
 */ 
function stringToArrayBuffer(string) {
  const arrayBuffer = new ArrayBuffer(string.length);
  const arrayBufferView = new Uint8Array(arrayBuffer);
  for (let i = 0; i < string.length; i++) {
    arrayBufferView[i] = string.charCodeAt(i);
  }
  return arrayBuffer;
}

/**
 * Accumulate bytes sent to check bandwidth usage
 */ 
function addBytes(bytes){
	// mb += bytes / 1000000
	mb += bytes
	// console.log(mb)
}

//send messages to client as binary rather than string
let usingBinary = false

//add latency to communication
let simulatingLatency = true
let latencyMS = 40

/**
 * 
 */ 
function sendMessage(reciever, whatToSend){
	//if sending messages as binary
	if(usingBinary){
		//convert string to arraybuffer
		let send = stringToArrayBuffer(whatToSend)

		//output 
		console.log("message size reduction: " 
			+ sizeof.sizeof(whatToSend) 
			+ " => " 
			+ send.byteLength)

		//accumulate bytes
		addBytes(send.byteLength)

		//send message
		if(reciever.readyState === reciever.OPEN){
			if(simulatingLatency){
				//send blob with latency
				setTimeout(()=>{
					reciever.send(send)
				}, latencyMS)
			}else{
				//send blob with no latency
				reciever.send(send)
			}
		}
	//if sending messages as strings
	}else{
		//keep message as string
		let send = whatToSend

		//accumulate bytes
		addBytes(sizeof.sizeof(send))

		//send message
		if(reciever.readyState === reciever.OPEN){
			if(simulatingLatency){
				//send string with latency
				setTimeout(()=>{
					reciever.send(send)
				}, latencyMS)
			}else{
				//send string with no latency
				reciever.send(send)
			}
		}
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
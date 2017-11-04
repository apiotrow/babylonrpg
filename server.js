"use strict"

const express = require('express')
const SocketServer = require('ws').Server
const path = require('path')
const cors = require('cors')
let jsonfile = require('jsonfile')
let easystarjs = require('easystarjs')

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
for(let i = 0; i < d; i++){
	let row = []
	for(let j = 0; j < d; j++){
		row.push(1)
	}
	map.push(row)
}
let es = new easystarjs.js()
es.setAcceptableTiles(1)
es.enableDiagonals()
es.disableCornerCutting()
es.setIterationsPerCalculation(1000) //set low to prevent framerate drops
es.setGrid(map)
// es.findPath(2,3,5,6, (path)=>{
// 	esPath = path
// })
// es.calculate()



wss.on('connection', function connection(ws, req){
	//let client know we're ready
	
	fs.readFile("assets/models/char/chad.babylon", 'utf8', function read(err, data){
		// let bab = JSON.parse(data)

		let initData = {
			h: "initData",
			v: map
		}
		console.log("sending initial data")
		sendMessage(ws, JSON.stringify(initData))
	})


	ws.on('message', function incoming(message){
		let data = JSON.parse(message)
		let h = data.h

		//player requests to move
		if(h == "moveTo"){
			let spotX = data.x
			let spotY = data.y
			console.log("request to move to " + spotX + "," + spotY)

			es.findPath(3, 7, spotX, spotY, (path)=>{
				console.log(path)

				let pathArr = []
				for(let i = 0; i < path.length; i++){
					pathArr.push(path[i].x)
					pathArr.push(path[i].y)
				}

				console.log(pathArr)

				let pathSend = {
					h: "path",
					v: pathArr
				}
				sendMessage(ws, JSON.stringify(pathSend))
			})
			es.calculate()
		}

		if(h == "test"){
			console.log("got test message")

			let pathSend = {
				h: "shit",
				v: 4
			}
			sendMessage(ws, JSON.stringify(pathSend))

		}
	})
})

function sendMessage(reciever, whatToSend){
	if(reciever.readyState === reciever.OPEN){
		reciever.send(whatToSend)
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
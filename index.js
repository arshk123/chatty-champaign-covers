'use strict'

const express = require('express')
const bodyparser = require('body-parser')
const request = require('request')
const app = express()
const dateTime = require('node-datetime')
const fs = require('fs')

let api_keys = JSON.parse(fs.readFileSync('api_keys/api.json'))
let token = api_keys["messenger_token"]
let hub_verify_token = api_keys["hub_verify_token"]
let covers = {}
let bars = ['lion', 'clys', 'firehaus', 'joes', 'brothers', 'legends', 'murphys', 'kams']
app.use(bodyparser.urlencoded({extended: false}))
app.use(bodyparser.json())

// route(s)
app.get('/', function (req, res) {
  res.send("Hi, I'm a chatbot")
})

// Facebook auth
app.get('/webhook/', function(req, res){
  if(req.query['hub.verify_token'] === hub_verify_token) {
    res.send(req.query['hub.challenge'])
  }
  else {
    res.send("Wrong Token")
  }
})


// Handle Incoming Messages
app.post('/webhook/', function(req, res) {
  let messaging_events = req.body.entry[0].messaging
  for(let i = 0; i < messaging_events.length; i++) {
    let event = messaging_events[i]
    let sender = event.sender.id
    if(event.message && event.message.text) {
      let inputText = event.message.text
      // console.log(JSON.stringify(req.body))
      // clys update
      // clys info
      inputText = inputText.split(/[ ]/)
      handleMessage(inputText, sender)
    }
  }
  res.sendStatus(200)
})

function handleMessage(input, sender) {
  if(input.length === 0) {
    sendText(sender, "Please provide a bar name and an action : list, update, price")
    return
  }
  let output = {
    'update' : false,
    'info' : false,
    'list' : false
  }
  let bar = ''
  let value = -1
  for (let i = 0; i < input.length; i++ ) {
    console.log(input[i])
    switch(input[i]) {
      case 'update':
        console.log("hit update")
        output['update'] = true
        break
      case 'info':
        output['info'] = true
        break
      case 'list':
        output['list'] = true
        break
    }
    if(!isNaN(input[i]) && value === -1) {
      console.log("hit nan")
      let temp = parseInt(input[i])
      if(temp%5 === 0 && temp <= 30 && value < 0) {
        console.log("updating value to " + temp)
        value = parseInt(input[i])
      }
    }
    if(bars.indexOf(input[i]) > -1) {
      console.log("hit bars")
      bar = input[i]
    }
  }
  if(output['update'] && bar != '' && value != -1) {
    console.log("storing cover")
    storeCover(bar, value)
    sendText(sender, "Thank you for your input, cover price has been updated for " + bar)
  }
  else if(output['list']) {
    console.log("TODO")
    Object.keys(covers).forEach(function(element) {
      console.log(`${element}: As of ${covers[element]['time_hour']} on ${covers[element]['time_date']}, cover is ${covers[element]['cost']}`)
      sendText(sender, `${element}: As of ${covers[element]['time_hour']} on ${covers[element]['time_date']}, cover is ${covers[element]['cost']}`)
    })
  }
  else if(output['info'] && bar != '') {
    console.log("TODO")
  }
}

function sendText(sender, text) {
  // let messageData = {text : text}
  messageData = "hello"
  request ({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token : token},
    method: 'POST',
    json: {
      recipient: {
        id : sender
      },
      message: messageData
    },
  },
    function(error, response, body) {
      if(error) {
        console.log("sending error")
      }
      else if(response.body.error){
        console.log(response.body.error)
      }
  })
}

function storeCover(bar, amount) {
  var dt = dateTime.create()
  dt.offsetInHours(-5)
  covers[bar] = {
    cost : amount,
    time_hour : dt.format('H:M:S'),
    time_date : dt.format('m-d-Y')
  }
  console.log(JSON.stringify(covers))
}

app.listen(process.env.PORT || 5000, function() {
  console.log("running: port")
})

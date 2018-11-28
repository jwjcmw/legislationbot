'use strict'

// Vars to run our server
const https = require('https')
const request = require('request')
const express = require('express')
const storage = require('node-persist')
const app = express()
const port = 8080

// Setting up our Twit instance
const Twit = require('twit')
const T = new Twit({
  consumer_key:         process.env.CONSUMER_KEY,
  consumer_secret:      process.env.CONSUMER_SECRET,
  access_token:         process.env.ACCESS_TOKEN,
  access_token_secret:  process.env.ACCESS_TOKEN_SECRET,
})

//const stream = T.stream('user')
const url = `https://openstates.org/api/v1/bills/?apikey=${process.env.OPEN_STATES_KEY}&state=${process.env.STATE}&search_window=session&sort=updated_at`

// Set up the app endpoint that will be called by 
app.all('/' + process.env.BOT_ENDPOINT, (request, response) => {
  
    // Fetch Data from OpenStates API
    https.get(url, (resp) => {
      let data = ''
      resp.on('data', (chunk) => {
        data += chunk
      })
      // After receiving everything, process!
      resp.on('end', async () => {
        await processData(data)
        // This needs to have error handling, but I'm still figuring out how that might work with async/await
        response.sendStatus(200)

    }).on('error', (err) => {
        return console.log('lol: ' + err.message)
    })
  })
})

async function processData(data) {
  
  let bills = JSON.parse(data)
  let tweetBills = []

  // Pull info we want from each obj
  for (const bill of bills) {
    
    let trimBill = bill.bill_id.replace(/(-|_|\s)/g, "")

    // Check to see if we've already sent this one, and if not add to list to send
    let storageBill = await storage.getItem(trimBill)
    
    if (!storageBill){
      tweetBills.push({
        id: trimBill,
        date: bill.updated_at,
        status: `${bill.title.slice(0, 180)} https://openstates.org/${process.env.STATE}/bills/${bill.session}/${trimBill}`
      })
    }
    //The following won't work because twitter will throw an error saying it is a duplicate, but it would be good to find a way to retweet updated bills
    // If it is in storage, but has been updated since it was tweeted out, remove it and we'll tweet it again next go round
    //else if (tweetInfo['date'] != storageBill.date){
      //storage.removeItem(trimBill)
    //}
  }
  
  
  // Send however many tweets we limit it to, and record them in storage
  tweetBills.slice(0,process.env.TWEET_LIMIT).forEach( bill => {
    T.post('statuses/update', { status: bill['status'] }, (err, data, res) => {
      if (err && err.code == 187){
        // If it is a duplicate, make sure that we don't try to send it again
        storage.setItem(bill['id'], {date: bill['date'], status: bill['status']})
      }else if (err){
        console.log('Error!')
        console.log(err)
      }
      else{
        storage.setItem(bill['id'], {date: bill['date'], status: bill['status']})
      }
    })
  })
}

async function startServer() {
  // Make sure that the storage is ready
  await storage.init()
  // The next line will clear out your storage if you need to
  // await storage.clear();
  // Start listening for calls to the app
  const listener = app.listen(port, function () {
    console.log('Your app is listening on port ' + listener.address().port)
  })
}

startServer()
  
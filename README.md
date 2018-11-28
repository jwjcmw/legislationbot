# Open States Twitter bot!


This is Twitter bot that tweets out legislation currently being worked on for NC, and is based on [this template](https://glitch.com/edit/#!/dull-equinox) utilizing the 
[Open States API](http://docs.openstates.org/en/latest/api/ ). See this [bot here](https://twitter.com/nclawsbot)!

## Changes from original

1.  Added in local storage with node-persist
2.  Used local storage to keep track of what tweets have gone out
3.  Split main code into multiple functions that use async/await
4.  Added environment variable to define number of tweets that can go out at a time.


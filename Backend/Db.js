import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
const App = express();
const port = 8000;

App.use(bodyParser.json())


App.post('/location', (req, res) => {
  const locationData = req.body;
  
  // Append the location data to a file
  fs.appendFile('locations.json', JSON.stringify(locationData) + '\n', (err) => {
    if (err) {
      console.error('Error writing to file', err);
      return res.status(500).send('Internal Server Error');
    }
    res.status(200).send('Location data received');
  });
});
// App.use("/api/v1/auth",controller)

App.listen(port);

// import express from "express";
// import bodyParser from "body-parser";
// import morgan from "morgan";
// import mongoose from "mongoose";
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require('morgan');
const mongoose = require('mongoose');
const app = express();

const URL = 'mongodb+srv://mongo-user:pokilee10@cluster-mongo-database.a4ifqdc.mongodb.net/test?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    await mongoose.connect(
      URL,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('Connected to MongoDB');
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

connectDB();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('combined'));

const dataSchema = new mongoose.Schema({
  id: String,
  name: String,
  temperature: Number,
  humidity: Number,
  pressure: Number,
  altitude: Number,
  sealevelpressure: Number,
  realaltitude: Number
});

const DataModel = mongoose.model('Data', dataSchema);



// Một biến để lưu trữ dữ liệu từ Arduino
let arduinoData = {
  id: null,
  name: null,
  temperature: null,
  humidity: null,
  pressure: null,
  altitude: null,
  sealevelpressure: null,
  realaltitude: null
};

app.post("/data", (req, res) => {
  const { id, name, temperature, humidity, pressure, altitude, sealevelpressure, realaltitude } = req.body;

  // Kiểm tra xem dữ liệu có hợp lệ hay không
  if (temperature < 0 || humidity < 0 || temperature > 100 || humidity > 100) {
    res.status(400).send("Data is invalid");
    return;
  }

  // Lưu dữ liệu từ Arduino vào biến arduinoData
  arduinoData.id = id;
  arduinoData.name = name;
  arduinoData.temperature = temperature;
  arduinoData.humidity = humidity;
  arduinoData.pressure = pressure;
  arduinoData.altitude = altitude;
  arduinoData.sealevelpressure = sealevelpressure;
  arduinoData.realaltitude = realaltitude;

  console.log(`Received data from Arduino - ID: ${id}, Name: ${name}, Temperature: ${temperature}°C, Humidity: ${humidity}%, Pressure: ${pressure}°C, Altitude: ${altitude}%, Sealevel Pressure: ${sealevelpressure}°C, Real Altitude: ${realaltitude}%`);

  // Lưu dữ liệu vào cơ sở dữ liệu MongoDB
  const newData = new DataModel({
    id,
    name,
    temperature,
    humidity,
    pressure,
    altitude,
    sealevelpressure,
    realaltitude
  });

  newData.save()
    .then(() => {
      console.log('Data received and saved to MongoDB');
      res.send("Data received and saved!");
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Failed to save data to MongoDB");
    });
});


app.get("/data", async (req, res) => {
  // Trả về dữ liệu đã được lưu từ Arduino khi có yêu cầu GET từ trình duyệt
  try {
    const arduinoData = await DataModel.find().limit(1).sort({$natural:-1});
    res.json(arduinoData);
  } catch (error) {
    console.error(error);
  }
});

app.get("/", (req, res) => {
  // Phản hồi trang HTML cho trình duyệt khi truy cập vào trang chủ
  res.sendFile(__dirname + "/index.html");
});

app.listen(3000, () => {
  console.log("Server started!");
});
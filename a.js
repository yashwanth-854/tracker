import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Button, FlatList } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const App = () => {
  const [location, setLocation] = useState(null);
  const [isRunning, setIsRunning] = useState(true); // Initially, the background task is running
  const [locationData, setLocationData] = useState([]);

  // Function to store location data in AsyncStorage
  const storeLocationData = async (data) => {
    try {
      const existingData = await AsyncStorage.getItem("locationQueue");
      let locationQueue = existingData ? JSON.parse(existingData) : [];
      locationQueue.push(data);
      await AsyncStorage.setItem("locationQueue", JSON.stringify(locationQueue));
    } catch (error) {
      console.error("Error storing location data:", error);
    }
  };

  // Function to retrieve stored location data from AsyncStorage
  const retrieveLocationData = async () => {
    try {
      const data = await AsyncStorage.getItem("locationQueue");
      if (data) {
        setLocationData(JSON.parse(data));
      }
    } catch (error) {
      console.error("Error retrieving location data:", error);
    }
  };

  // Function to get location and handle storage
  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setLocation(location);
      storeLocationData({
        time: new Date().toISOString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  // Background task to get location every 5 minutes
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        getLocation();
      }, 5 * 60 * 1000); // 5 minutes interval
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  // Function to handle stop button press
  const handleStop = () => {
    setIsRunning(false); // Stop the background task
    retrieveLocationData(); // Retrieve stored location data
  };

  // Render function for each item in the FlatList
  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>Time: {item.time}</Text>
      <Text>Latitude: {item.latitude}</Text>
      <Text>Longitude: {item.longitude}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text>Welcome!</Text>
      <View style={styles.buttonContainer}>
        <Button title="Get Location" onPress={getLocation} />
      </View>
      {location && (
        <>
          <Text>Latitude: {location.coords.latitude}</Text>
          <Text>Longitude: {location.coords.longitude}</Text>
        </>
      )}
      <View style={styles.buttonContainer}>
        <Button title="Send Location" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Stop" onPress={handleStop} />
      </View>
      {locationData.length > 0 && (
        <FlatList
          data={locationData}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    width: "40%",
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

export default App;

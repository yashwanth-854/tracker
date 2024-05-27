import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Button,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Linking from "expo-linking";
import * as Cellular from "expo-cellular";
const Vonage = require("@vonage/server-sdk").Vonage;

const vonage = new Vonage({
  apiKey: "2d5152c1",
  apiSecret: "aYVIe0NtZJZs0ASE",
});
const img = require("./nfc.png");
const img1 = require("./n.png");
const img2 = require("./gov.png");

const LocationScreen = () => {
  const [location, setLocation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [locationData, setLocationData] = useState([]);
  const [simState, setSimState] = useState(null);
  const [queueCount, setQueueCount] = useState("0"); // Add state for queue count
  const [showNumbersModal, setShowNumbersModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(""); // State to store selected number
  const [phoneNumberInput, setPhoneNumberInput] = useState(""); // State to store phone number input

  useEffect(() => {
    checkSignal();
    getQueueCount(); // Get initial queue count
  }, []);

  const handleLogout = () => {
    // Implement your logout logic here
    // For example, navigate to the logout screen or clear authentication tokens
  };

  const checkSignal = async () => {
    const networkCode = await Cellular.getMobileNetworkCodeAsync();
    setSimState(networkCode);
  };

  const getQueueCount = async () => {
    try {
      const existingData = await AsyncStorage.getItem("locationQueue");
      let locationQueue = existingData ? JSON.parse(existingData) : [];
      setQueueCount(locationQueue.length);
    } catch (error) {
      console.error("Error getting queue count:", error);
    }
  };

  const storeLocationData = async (data) => {
    try {
      const existingData = await AsyncStorage.getItem("locationQueue");
      let locationQueue = existingData ? JSON.parse(existingData) : [];
      locationQueue.push(data);
      await AsyncStorage.setItem(
        "locationQueue",
        JSON.stringify(locationQueue)
      );
      setQueueCount(locationQueue.length); // Update queue count
    } catch (error) {
      console.error("Error storing location data:", error);
    }
  };

  const retrieveLocationData = async () => {
    try {
      const data = await AsyncStorage.getItem("locationQueue");
      if (data) {
        setLocationData(JSON.parse(data));
        await AsyncStorage.removeItem("locationQueue");
        setQueueCount(0); // Update queue count
      }
    } catch (error) {
      console.error("Error retrieving location data:", error);
    }
  };

  const handleStart = async () => {
    await AsyncStorage.removeItem("locationQueue");
    getLocation();
    setIsRunning(true);
    console.log("Started");
  };

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
      const isoString = new Date().toISOString();
      const [da, ti] = isoString.split("T");
      const time = `${da} ${ti}`;

      checkSignal();
      if (simState != null) {
        retrieveLocationData();
        console.log(locationData.length);
        if (locationData.length != 0) {
          console.log("Sending Stored Data");
        }
        const l = [
          {
            time: time,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        ];
        setLocationData(l);
      } else {
        storeLocationData({
          time: time,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        getLocation();
      }, 500);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStop = async () => {
    setIsRunning(false);
    console.log("Stopped");
    console.log(locationData);
    axios
      .post("http://10.10.8.157:8000/location", locationData)
      .then((response) => {
        console.log("Location data sent successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error sending location data:", error);
      });
  };

  const handleSend = async () => {
    console.log(locationData);
    const phoneNumber = selectedNumber;
    // "+91 9618026156";
    const message = JSON.stringify(locationData);
    const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    checkSignal();
    await vonage.sms
      .send({ to, from, text })
      .then((resp) => {
        console.log("Message sent successfully");
        console.log(resp);
      })
      .catch((err) => {
        console.log("There was an error sending the messages.");
        console.error(err);
      });
    if (simState != null) {
      // Linking.openURL(url).catch((err) =>
      //   console.error("Error opening SMS app:", err)
      // );
      console.log("signal yes");
    } else {
      Alert.alert("NO SIGNAL");
    }
  };

  const openNumbersModal = () => {
    setShowNumbersModal(true);
  };

  const closeNumbersModal = () => {
    setShowNumbersModal(false);
  };

  const handlePhoneNumberChange = (text) => {
    setPhoneNumberInput(text);
  };

  const savePhoneNumber = () => {
    setSelectedNumber(phoneNumberInput);
    setShowNumbersModal(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>Time: {item.time}</Text>
      <Text>Latitude: {item.latitude}</Text>
      <Text>Longitude: {item.longitude}</Text>
    </View>
  );
  // const renderItem1 = ({ item }) => (
  //   <TouchableOpacity onPress={() => selectNumber(item)}>
  //     <View style={styles.item}>
  //       <Text>{item}</Text>
  //     </View>
  //   </TouchableOpacity>
  // );

  return (
    <View style={styles.mainContainer}>
      {/* <View style={styles.taskbar}>
        <Text style={styles.taskbarText}> </Text>
      </View> */}
      <Modal
        visible={showNumbersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeNumbersModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              onChangeText={handlePhoneNumberChange}
              value={phoneNumberInput}
              placeholder="Enter phone number"
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-evenly" }}
            >
              <View style={styles.buttonContainer}>
                <Button
                  title="Save"
                  onPress={savePhoneNumber}
                  titleStyle={{ fontSize: 16 }}
                />
              </View>
              <View style={styles.buttonContainer}>
                <Button
                  title="Close"
                  onPress={closeNumbersModal}
                  titleStyle={{ fontSize: 16 }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 35,
        }}
      >
        <View>
          <Image source={img2} style={styles.image2} />
        </View>
        <View>
          <Image source={img1} style={styles.image1} />
        </View>
        <View>
          <Image source={img} style={styles.image} />
        </View>
      </View>
      <View style={styles.taskbar1}>
        {/* <View style={{ margin: 10 }}> */}
        <Text style={{ color: "white" }}>
          Configure ID : {phoneNumberInput}
        </Text>
        {/* </View> */}
        <Text style={styles.taskbarText}> </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <View style={{ marginHorizontal: 10 }}>
            <Text style={styles.statusText}>
              Status: {isRunning ? "Running" : "Stopped"}
            </Text>
          </View>
          <View style={{ marginHorizontal: 10 }}>
            <Text style={styles.statusText}>Queue Count: {queueCount}</Text>
          </View>
        </View>
        <View>
          {location && (
            <View style={styles.coordinatesContainer}>
              <Text>Latitude: {location.coords.latitude}</Text>
              <Text>Longitude: {location.coords.longitude}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
          <View style={styles.buttonContainer}>
            <Button title="Configure" onPress={openNumbersModal} />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title={isRunning ? "Stop" : "Start"}
              onPress={isRunning ? handleStop : handleStart}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Send" onPress={handleSend} />
          </View>
        </View>
      </View>
      <View style={styles.listContainer}>
        {locationData.length > 0 && (
          <FlatList
            data={locationData}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  taskbar1: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  taskbarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  logoutButton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContainer: {
    flex: 1,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  statusContainer: {
    marginBottom: 10,
    // alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  queueText: {
    // Add styles for queue text
    fontSize: 16,
    marginBottom: 5,
  },
  coordinatesContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
  },
  buttonContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    width: "30%",
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  button: {
    backgroundColor: "#313590",
    marginTop: 25,
    borderRadius: 10,
    width: 100,
    padding: 10,
    alignItems: "center",
  },
  image: {
    width: 60,
    height: 60,
    margin: 15,
  },
  image2: {
    width: 40,
    height: 65,
    margin: 10,
  },
  image1: {
    marginTop: 30,
    height: 20,
    width: 180,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxHeight: "40%",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});

export default LocationScreen;

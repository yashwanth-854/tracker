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
  ToastAndroid,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Linking from "expo-linking";
import * as Cellular from "expo-cellular";
import * as TaskManager from "expo-task-manager"; // Import TaskManager for background tasks
const img = require("./nfc.png");
const img1 = require("./n.png");
const img2 = require("./gov.png");

const LOCATION_TASK_NAME = "background-location-task";

const LocationScreen = () => {
  const [location, setLocation] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [locationData, setLocationData] = useState([]);
  const [simState, setSimState] = useState(null);
  const [queueCount, setQueueCount] = useState("0"); // Add state for queue count
  const [showNumbersModal, setShowNumbersModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(""); // State to store selected number
  const [phoneNumberInput, setPhoneNumberInput] = useState(""); // State to store phone number input
  const [allData, setAllData] = useState([]);
  const [timeIntervalInput, setTimeIntervalInput] = useState();
  const [timeInterval, setTimeInterval] = useState(0);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    checkSignal();
    // getLocation();
    // getQueueCount(); // Get initial queue count
  }, []);
  // useEffect(() => {
  //   // checkPermissions(); // Check permissions when component mounts
  //   // getQueueCount();
  //   // Start background task if supported
  //   if (Platform.OS === "android") {
  //     startLocationTask();
  //   }
  //   return () => {
  //     // Clean up background task when component unmounts
  //     if (Platform.OS === "android") {
  //       stopLocationTask();
  //     }
  //   };
  // }, []);

  // const startLocationTask = async () => {
  //   await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
  //     accuracy: Location.Accuracy.Balanced,
  //   });
  //   console.log("Background location task started");
  // };

  // const stopLocationTask = async () => {
  //   await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  //   console.log("Background location task stopped");
  // };

  // // Define background location task
  // TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  //   if (error) {
  //     console.error("Location task error:", error);
  //     return;
  //   }
  //   if (data) {
  //     const { locations } = data;
  //     console.log("Background location update:", locations);
  //     // Process location updates here
  //   }
  // });
  const handleLogout = () => {
    // Implement your logout logic here
    // For example, navigate to the logout screen or clear authentication tokens
  };

  const checkSignal = async () => {
    const networkCode = await Cellular.getMobileNetworkCodeAsync();
    setSimState(networkCode);
    console.log("1" + networkCode);
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
    if (configured) {
      setAllData([]);
      await AsyncStorage.removeItem("locationQueue");
      getLocation();
      setIsRunning(true);
      console.log("Started");
    } else {
      Alert.alert(
        "You need to configure phone number and time interval before starting"
      );
    }
  };

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync(); // Requests location permissions
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      }); // Gets the current location with high accuracy
      setLocation(location); // Sets the location state with the obtained location data
      console.log(location);
      const isoString = new Date().toISOString();
      const [da, ti] = isoString.split("T");
      const time = `${da} ${ti}`; // Formats the current date and time

      await checkSignal(); // Checks the cellular signal state

      const currentLocationData = {
        time: time,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      // encryption(currentLocationData);

      setAllData((prevData) => [...prevData, currentLocationData]);

      if (simState != null) {
        await retrieveLocationData(); // If the device has a signal, retrieves any stored location data
        if (locationData.length > 0) {
          console.log("Sending Stored Data");
          // handleSend(locationData)
          // axios
          //   .post("http://10.10.8.157:8000/location", locationData)
          //   .then((response) => {
          //     console.log(
          //       "Stored location data sent successfully:",
          //       response.data
          //     );
          //     setLocationData([]); // Clear the stored location data
          //     setQueueCount(0); // Reset the queue count
          //   })
          //   .catch((error) => {
          //     console.error("Error sending stored location data:", error);
          //   });
        }
        setLocationData([currentLocationData]); // Sets the location data state with the current location
        // handleSend(locationData)
        // axios
        //   .post("http://10.10.8.157:8000/location", [currentLocationData])
        //   .then((response) => {
        //     console.log(
        //       "Current location data sent successfully:",
        //       response.data
        //     );
        //   })
        //   .catch((error) => {
        //     console.error("Error sending current location data:", error);
        //   });
      } else {
        await storeLocationData(currentLocationData); // If no signal, stores the current location data in AsyncStorage
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        getLocation(); // Calls getLocation function at the specified interval
      }, 60 * 1000 * timeInterval); // Set interval to 5 seconds
    }

    return () => clearInterval(interval); // Clears the interval when the component unmounts or isRunning changes
  }, [isRunning]);

  const handleStop = async () => {
    setIsRunning(false);
    console.log("Stopped");
    // console.log(locationData);
    // axios
    //   .post("http://10.10.8.157:8000/location", locationData)
    //   .then((response) => {
    //     console.log("Location data sent successfully:", response.data);
    //   })
    //   .catch((error) => {
    //     console.error("Error sending location data:", error);
    //   });
  };

  const encryption = async (data) => {
    // Parse the date and time from the provided data
    const date = new Date(data.time);

    // Extract individual components
    const y = String(date.getUTCFullYear()).padStart(2, "0");
    const year = y.slice(2);
    const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // getUTCMonth is zero-based
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    // Extract latitude and longitude
    const latitude = data.latitude.toFixed(6); // Assuming you want to keep up to 6 decimal places
    const longitude = data.longitude.toFixed(6); // Assuming you want to keep up to 6 decimal places

    const latitude1 = latitude.replace(".", "");
    const longitude1 = longitude.replace(".", "");

    const yearHex = parseInt(year).toString(16).padStart(2, "0").toUpperCase();
    const monthHex = parseInt(month)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
    const dayHex = parseInt(day).toString(16).padStart(2, "0").toUpperCase();
    const hoursHex = parseInt(hours)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
    const minutesHex = parseInt(minutes)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
    const secondsHex = parseInt(seconds)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase();
    const latitudeHex = parseInt(latitude1)
      .toString(16)
      .padStart(8, "0")
      .toUpperCase();
    const longitudeHex = parseInt(longitude1)
      .toString(16)
      .padStart(8, "0")
      .toUpperCase();

    const result1 = `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${latitude1},${longitude1}`;
    console.log(result1);
    // Create the string with the desired format
    const result = `${dayHex}-${monthHex}-${yearHex} ${hoursHex}:${minutesHex}:${secondsHex} ${latitudeHex},${longitudeHex}`;
    console.log(result);
    let encryptedString = ":000002";
    encryptedString =
      encryptedString +
      dayHex +
      monthHex +
      yearHex +
      hoursHex +
      minutesHex +
      secondsHex +
      latitudeHex +
      longitudeHex +
      "4E" +
      "45" +
      "00000000";
    console.log(encryptedString);
    console.log("1");
    return encryptedString;
  };

  const tempHandleSend = async () => {
    getLocation();
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    console.log(location);
    const isoString = new Date().toISOString();
    const [da, ti] = isoString.split("T");
    const time = `${da} ${ti}`; // Formats the current date and time
    const currentLocationData = {
      time: time,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    console.log(currentLocationData);
    // Assuming encryption(currentLocationData) returns a JSON object
    const es = encryption(currentLocationData);
    console.log(es); // Log the encrypted data object

    const phoneNumber = selectedNumber;
    console.log(phoneNumber); // Log the selected phone number

    const message = JSON.stringify(es);
    console.log(message); // Log the JSON stringified encrypted data

    // Access the third item in the original JSON object, not the string
    const keys = Object.keys(es);
    const thirdItem = es[keys[2]]; // Get the value of the third key in the original object
    console.log(thirdItem); // Log the third item value

    const url = `sms:${phoneNumber}?body=${encodeURIComponent(thirdItem)}`;
    Linking.openURL(url).catch((err) =>
      console.error("Error opening SMS app:", err)
    );
  };

  const handleSend = async () => {
    console.log(locationData);
    const phoneNumber = selectedNumber;
    // "+91 9618026156";
    const message = JSON.stringify(locationData);
    const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;

    checkSignal();
    if (simState != null) {
      Linking.openURL(url).catch((err) =>
        console.error("Error opening SMS app:", err)
      );
      console.log("signal yes");
    } else {
      Alert.alert("NO SIGNAL");
    }
  };
  const handleSendAll = async () => {
    const phoneNumber = selectedNumber;
    // "+91 9618026156";
    const message = JSON.stringify(allData);
    const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    checkSignal();
    if (simState != null) {
      Linking.openURL(url).catch((err) =>
        console.error("Error opening SMS app:", err)
      );
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

  const handleTimeInterval = (text) => {
    setTimeIntervalInput(text);
  };

  const savePhoneNumber = () => {
    setSelectedNumber(phoneNumberInput);
    setTimeInterval(timeIntervalInput);
    if (selectedNumber != "" && timeInterval != 0) {
      setConfigured(true);
    }
    ToastAndroid.show("Phone number saved", ToastAndroid.SHORT);
    setShowNumbersModal(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text>Time: {item.time}</Text>
      <Text>Latitude: {item.latitude}</Text>
      <Text>Longitude: {item.longitude}</Text>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
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
            <TextInput
              style={styles.input}
              onChangeText={handleTimeInterval}
              value={timeIntervalInput}
              placeholder="Enter Time in minutes"
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
        {selectedNumber ? (
          <Text style={{ color: "white" }}>Configure ID: {selectedNumber}</Text>
        ) : null}
        <Text style={styles.taskbarText}> </Text>
        {timeInterval ? (
          <Text style={{ color: "white" }}>Time : {timeInterval} min</Text>
        ) : null}
        {/* <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>timeInterval */}
      </View>

      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <View style={{ marginHorizontal: 10 }}>
            <Text style={styles.statusText}>Status:</Text>
          </View>
          <View>
            <Text
              style={[
                styles.statusText,
                { color: isRunning ? "red" : "black" },
              ]}
            >
              {isRunning ? "Running" : "Stopped"}
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
            <Button title="Send" onPress={tempHandleSend} />
          </View>
        </View>
      </View>
      <View style={styles.listContainer}>
        {allData.length > 0 && (
          <FlatList
            data={allData}
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
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusText: {
    //backgroundColor: "#FF0000",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  queueText: {
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

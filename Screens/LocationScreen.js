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
import * as Network from "expo-network";
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
  const [networkState, setNetworkState] = useState(true);
  const [queueCount, setQueueCount] = useState("0"); // Add state for queue count
  const [showNumbersModal, setShowNumbersModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState("---"); // State to store selected number
  const [phoneNumberInput, setPhoneNumberInput] = useState(""); // State to store phone number input
  const [allData, setAllData] = useState([]);
  const [timeIntervalInput, setTimeIntervalInput] = useState();
  const [timeInterval, setTimeInterval] = useState("---");
  const [configured, setConfigured] = useState(false);
  const [lastSent, setLastSent] = useState("---");
  const [cnt, setCnt] = useState(1);
  useEffect(() => {
    getQueueCount();
    // getLocation();
    // getQueueCount(); // Get initial queue count
  }, []);

  class Queue {
    constructor() {
      this.items = {};
      this.frontIndex = 0;
      this.backIndex = 0;
    }

    enqueue(item) {
      this.items[this.backIndex] = item;
      this.backIndex++;
      return item + " inserted";
    }

    dequeue() {
      if (this.frontIndex === this.backIndex) {
        return null;
      }
      const item = this.items[this.frontIndex];
      delete this.items[this.frontIndex];
      this.frontIndex++;
      return item;
    }

    peek() {
      if (this.frontIndex === this.backIndex) {
        return null;
      }
      return this.items[this.frontIndex];
    }

    printQueue() {
      let str = "";
      for (let i = this.frontIndex; i < this.backIndex; i++) {
        str += this.items[i] + " ";
      }
      return str;
    }

    length() {
      return this.backIndex - this.frontIndex;
    }

    isEmpty() {
      return this.length() === 0;
    }
  }

  const queue = new Queue();
  const handleLogout = () => {
    // Implement your logout logic here
    // For example, navigate to the logout screen or clear authentication tokens
  };

  const checkNetworkState = async () => {
    try {
      let state1 = await Network.isAirplaneModeEnabledAsync();
      let state2 = await Cellular.getMobileNetworkCodeAsync();
      console.log(state1);
      console.log(state2);
      if (state1 != true && state2 != null) {
        setNetworkState(true);
        return true;
      } else {
        setNetworkState(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking network state:", error);
    }
  };

  const getQueueCount = async () => {
    try {
      setQueueCount(queue.length());
    } catch (error) {
      console.error("Error getting queue count:", error);
    }
  };

  // const storeLocationData = async (data) => {
  //   try {
  //     const existingData = await AsyncStorage.getItem("locationQueue");
  //     let locationQueue = existingData ? JSON.parse(existingData) : [];
  //     locationQueue.push(data);
  //     await AsyncStorage.setItem(
  //       "locationQueue",
  //       JSON.stringify(locationQueue)
  //     );
  //     setQueueCount(locationQueue.length); // Update queue count
  //   } catch (error) {
  //     console.error("Error storing location data:", error);
  //   }
  // };

  // const retrieveLocationData = async () => {
  //   try {
  //     const data = await AsyncStorage.getItem("locationQueue");
  //     if (data) {
  //       setLocationData(JSON.parse(data));
  //       await AsyncStorage.removeItem("locationQueue");
  //       setQueueCount(0); // Update queue count
  //     }
  //   } catch (error) {
  //     console.error("Error retrieving location data:", error);
  //   }
  // };

  const handleStart = async () => {
    if (configured) {
      setAllData([]);
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

      const date = new Date();
      // Convert to IST by adding 5 hours and 30 minutes
      const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
      const istDate = new Date(date.getTime() + istOffset);

      // Format the date and time
      const [da, ti] = istDate.toISOString().split("T");
      const time = `${da} ${ti.split(".")[0]}`;

      const currentLocationData = {
        time: time,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setAllData((prevData) => [...prevData, currentLocationData]);
      const es = encryption(currentLocationData);
      console.log(es); // Log the encrypted data object

      const phoneNumber = selectedNumber;
      console.log(phoneNumber); // Log the selected phone number

      const message = JSON.stringify(es);
      console.log(message); // Log the JSON stringified encrypted data

      // Access the third item in the original JSON object, not the string
      const keys = Object.keys(es);
      const thirdItem = es[keys[2]];
      queue.enqueue(thirdItem);
      console.log(queue.printQueue());

      let state = await checkNetworkState(); // Checks the network state

      if (state) {
        console.log("Network is connected");
        while (!queue.isEmpty()) {
          const itemToBeSent = queue.dequeue();
          handleSend(itemToBeSent);
          setCnt(cnt + 1);
          setLastSent(time);
        }
      } else {
        console.log("No network connection, queue length:", queue.length());
      }
      getQueueCount();
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
    let msgno = String(cnt).padStart(4, "0");
    const hexmsg=parseInt(msgno).toString(16).padStart(4, "0")
    .toUpperCase();
    let encryptedString = ":"+hexmsg+"02";
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
    setLastSent(time);
    // console.log(currentLocationData);
    // Assuming encryption(currentLocationData) returns a JSON object
    const es = encryption(currentLocationData);
    console.log(es); // Log the encrypted data object

    const phoneNumber = selectedNumber;
    // console.log(phoneNumber); // Log the selected phone number

    const message = JSON.stringify(es);
    console.log(message); // Log the JSON stringified encrypted data

    // Access the third item in the original JSON object, not the string
    const keys = Object.keys(es);
    const thirdItem = es[keys[2]]; // Get the value of the third key in the original object
    // console.log(thirdItem); // Log the third item value

    const url = `sms:${phoneNumber}?body=${encodeURIComponent(thirdItem)}`;
    Linking.openURL(url).catch((err) =>
      console.error("Error opening SMS app:", err)
    );
  };

  const handleSend = async (item) => {
    try {
      let state = await checkNetworkState();
      const phoneNumber = selectedNumber;
      const message = JSON.stringify(item);
      const url = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;

      if (state) {
        Linking.openURL(url).catch((err) =>
          console.error("Error opening SMS app:", err)
        );

        console.log("Signal available, sending message");
      } else {
        Alert.alert("No signal available");
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
    if (phoneNumberInput != "---" && timeIntervalInput != "---") {
      if (timeIntervalInput == 0) {
        Alert.alert("Interval Time can't be 0");
      } else {
        setSelectedNumber(phoneNumberInput);
        setTimeInterval(timeIntervalInput);
        setConfigured(true);
        ToastAndroid.show(
          "Phone number and Time interval saved",
          ToastAndroid.SHORT
        );
        setShowNumbersModal(false);
      }
    }
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
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "center",
                padding: 10,
                margin: 10,
              }}
            >
              <Text style={{ fontSize: 16 }}>Phn. No.</Text>
              <TextInput
                style={styles.input}
                onChangeText={handlePhoneNumberChange}
                value={phoneNumberInput}
                placeholder="Enter phone number"
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "center",
                padding: 10,
                margin: 10,
                marginTop: -10,
                marginBottom: -10,
              }}
            >
              <Text style={{ fontSize: 16 }}>Interval Time</Text>
              <TextInput
                style={styles.input}
                onChangeText={handleTimeInterval}
                value={timeIntervalInput}
                placeholder="Enter Time in minutes"
              />
            </View>
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
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ color: "white" }}>Server ID : {selectedNumber}</Text>
          <Text style={{ color: "white" }}>
            Time Interval : {timeInterval} min
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row" }}>
            <View>
              <Text style={{ color: "white" }}>Status : </Text>
            </View>
            <View>
              <Text style={[{ color: isRunning ? "green" : "red" }]}>
                {isRunning ? "Running" : "Stopped"}
              </Text>
            </View>
          </View>
          <View>
            <Text style={{ color: "white" }}>Queue Count : {queueCount}</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {lastSent ? (
            <Text style={{ color: "white" }}>
              Last Sent Message : {lastSent}
            </Text>
          ) : null}
        </View>
        {/* <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>timeInterval */}
      </View>
      <View style={styles.container}>
        {/* <View style={styles.statusContainer}>
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
        </View> */}
        {/* <View>
          {location && (
            <View style={styles.coordinatesContainer}>
              <Text>Latitude: {location.coords.latitude}</Text>
              <Text>Longitude: {location.coords.longitude}</Text>
            </View>
          )}
        </View> */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-evenly",
            marginTop: -300,
          }}
        >
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
    flexDirection: "column",
    // justifyContent: "space-between",
    // alignItems: "center",
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
    marginTop: -300,
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
    marginTop: 38,
    height: 22,
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

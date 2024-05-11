import {
  StyleSheet,
  Text,
  View,
  Button,
  PermissionsAndroid,
  Alert,
} from "react-native";
import React from "react";
import GetLocation from "react-native-get-location";
import Geolocation from "@react-native-community/geolocation";
Geolocation.setRNConfiguration(config);

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "ReactNativeCode Location Permission",
        message: "ReactNativeCode App needs access to your location ",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(latitude, longitude);z
        },
        {
          enableHighAccuracy: false,
          timeout: 60000,
        }
      );
      // Geolocation.getCurrentPosition({
      //     enableHighAccuracy: false,
      //     timeout: 60000,
      // })
      // .then(location => {
      //     console.log(location);
      // })
      // .catch(error => {
      //     const { code, message } = error;
      //     console.warn(code, message);
      // })

      Alert.alert("Location Permission Granted.");
    } else {
      Alert.alert("Location Permission Not Granted");
    }
  } catch (err) {
    console.warn(err);
  }
};
const LocationScreen = () => {
  return (
    <View style={styles.container}>
      <View style={{ margin: 50 }}>
        <Button
          title="request permission"
          onPress={requestLocationPermission}
        ></Button>
      </View>
    </View>
  );
};

export default LocationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    // margin: 50,
  },
});

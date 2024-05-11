import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Platform,
  Pressable,
  Image,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { userName, passWord } from "../assets/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import axios from "axios";

// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { asFileSystem } from 'expo-file-system';
import { id } from "./../assets/constants";
import { useNavigation } from "@react-navigation/native";

const img = require("./nfc.png");
const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const handleLogin = async () => {
    const user = {
      username: username,
      password: password,
    };
    try {
      if (user.username === userName && user.password === passWord) {
        // console.log(user.username)
        // console.log(user.password)
        // const token = await jwt.sign(
        //   asdfg4356tygfvcxdrt56y7uhgftry6uhjgtuhjgytuhjh1234567,
        //   {
        //     expiresIn: "5d",
        //   }
        // );
        Alert.alert("Login Successful");
        navigation.navigate("Location");
      } else {
        Alert.alert("Incorrect credentials");
      }
    } catch (error) {
      Alert.alert(error);
    }
    //   if (user) {
    //     // Login successful
    //     const accessToken = jwt.sign(
    //       { username: user.username },
    //       "asdfg4356tygfvcxdrt56y7uhgftry6uhjgtuhjgytuhjh1234567",
    //       { expiresIn: "3d" }
    //     );
    //     await AsyncStorage.setItem("token", accessToken);
    //     Alert.alert("Success", "Login successful");
    //   } else {
    //     // Invalid credentials
    //     Alert.alert("Error", "Invalid username or password");
    //   }
    // } catch (error) {
    //   console.error("Error reading users file:", error);
    // }
  };

  // const verifyToken = async () => {
  //   try {
  //     const token = await AsyncStorage.getItem("token");
  //     if (token) {
  //       jwt.verify(token, "your_secret_key");
  //       Alert.alert("Success", "Token verified");
  //     } else {
  //       Alert.alert("Error", "Token not found");
  //     }
  //   } catch (error) {
  //     Alert.alert("Error", "Token invalid or expired");
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView>
        <Image source={img} style={styles.image} />
        <View style={styles.card}>
          <View>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>
              Login to your Account
            </Text>
          </View>
          <View style={styles.box} marginTop={25}>
            {/* <MaterialCommunityIcons name="email" size={24} color="black" /> */}
            <TextInput
              value={username}
              onChangeText={(text) => setUsername(text)}
              placeholder="Enter Email-address"
            ></TextInput>
          </View>
          <View style={styles.box}>
            {/* <AntDesign name="lock" size={24} color="black" /> */}
            <TextInput
              value={password}
              onChangeText={(text) => setPassword(text)}
              secureTextEntry={true}
              placeholder="Enter Password"
            ></TextInput>
          </View>
          <View marginTop={30}>
            {/* <Button title="Login" color={"#d82731"}  /> */}
            <Pressable onPress={handleLogin} style={styles.button}>
              <Text style={{ color: "white", fontWeight: "bold" }}>LOGIN</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
  },
  image: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginTop: 100,
  },
  card: {
    backgroundColor: "white",
    alignItems: "center",
    width: 350,
    height: 300,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    margin: 25,
    justifyContent: "space-evenly",
    ...Platform.select({
      ios: {
        shadowoffset: { width: 2, height: 2 },
        shadowColor: "#333",
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  box: {
    borderWidth: 1,
    flexDirection: "row",
    width: 300,
    gap: 10,
    borderRadius: 10,
    margin: 10,
    backgroundColor: "#D0d0d0",
    padding: 10,
  },
  button: {
    backgroundColor: "#313590",
    marginTop: -25,
    // margin: 10,
    borderRadius: 10,
    width: 100,
    padding: 10,
    alignItems: "center",
  },
});
